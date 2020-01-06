const { requireSession } = require('utils/session')
const { BadRequestError } = require('utils/errors')
const { client: sap } = require('utils/sap')
const pg = require('utils/pg')
// all clients can either us their price list or this one
const DEFAULT_PRICE_LIST = 1
const PAY_TERMS_NONE = -1
const INTERNAL_CLIENT_GROUP = 114

module.exports = {
  async quick_sale ({ Sale }, { req }) {
    // TODO: validate roles

    const { SalesPointID, SalesEmployeeCode } = requireSession(req)
    const Card = await getCardDetails(Sale.CardCode)
    const SalesPoint = await getSalesPointDetails(SalesPointID)

    const ClientIsTaxExempt = Card.GroupCode === INTERNAL_CLIENT_GROUP
    
    // validate sale
    if (!Sale.Items.length > 0) {
      throw new BadRequestError(`Se requiere por lo menos un articulo de venta`)
    }
    
    // if credit, verify allowed
    if (Sale.Invoice.PaymentGroupCode !== PAY_TERMS_NONE && Sale.Invoice.PaymentGroupCode !== Card.PayTermsGrpCode) {
      throw new BadRequestError(`Este cliente no tiene permitida la venta al credito`)
    }
    
    // if internal client, verify credit
    if (ClientIsTaxExempt && Sale.Invoice.PaymentGroupCode !== Card.PayTermsGrpCode) {
      throw new BadRequestError(`Clientes internos solo pueden realizar consumos al credito`)
    }
    // validate payment
    if (Sale.Invoice.PaymentGroupCode !== PAY_TERMS_NONE && Sale.Invoice.Payment) {
      throw new BadRequestError(`Pago presente en venta a credito`)
    }
    
    if (Sale.Invoice.PaymentGroupCode === PAY_TERMS_NONE && !Sale.Invoice.Payment) {
      throw new BadRequestError(`Pago Requerido en venta a contado`)
    }
    
    // verify pay amounts match
    if (Sale.Invoice.Payment) {
      const TotalPaidInCents = Sale.Invoice.Payment.PaymentCreditCards.reduce((total, { CreditSum }) => total + (CreditSum * 100), Sale.Invoice.Payment.CashSum * 100)
      const TotalPaid = TotalPaidInCents ? TotalPaidInCents / 100 : 0
      
      const TotalToPayInCents = Sale.Items.reduce((total, { PriceAfterVAT, Quantity }) => total + ((PriceAfterVAT * 100) * Quantity), 0)
      const TotalToPay = TotalToPayInCents ? TotalToPayInCents / 100 : 0
      
      if (TotalToPay !== TotalPaid) {
        throw new BadRequestError(`Error de montos de pago. Se esperaba ${TotalToPay}, pero se recibio ${TotalPaid}`)
      }
    }
    
    const ItemDetails = await Promise.all(Sale.Items.map(getItemDetails(SalesPointID)))
    
    // if client belongs to internal clients, check all products are autorized for consumption
    if (ClientIsTaxExempt) {
      const unauthorizedItems = ItemDetails.filter(item => !item.AllowInternalConsumption)
      
      if (unauthorizedItems.length) {
        throw new BadRequestError(`Articulos no autorizados para consumo interno: ${unauthorizedItems.map(({ ItemCode, ItemName }) => `${ItemCode}: ${ItemName}`).join(', ')}`)
      }
    }

    // if buying on credit, check all products are authorized
    if (Sale.Invoice.PaymentGroupCode !== PAY_TERMS_NONE && Card.GroupCode !== INTERNAL_CLIENT_GROUP) {
      const unauthorizedItems = ItemDetails.filter(item => !item.AllowCredit)
      
      if (unauthorizedItems.length) {
        throw new BadRequestError(`Articulos no autorizados para consumo a credito: ${unauthorizedItems.map(({ ItemCode, ItemName }) => `${ItemCode}: ${ItemName}`).join(', ')}`)
      }
    }

    // Build Payment
    const Payment = Sale.Invoice.Payment ? {
      CashSum: Sale.Invoice.Payment.CashSum,
      CashAccount: SalesPoint.CashAccount,
      PaymentCreditCards: []
    } : null

    if (Payment && Sale.Invoice.Payment.PaymentCreditCards) {
      const { rows: CreditCards } = await pg.query(/* sql */`
        SELECT "CreditCard", "CardName", "CreditAcct"
        FROM "CreditCard"
      `)

      Payment.PaymentCreditCards = Sale.Invoice.Payment.PaymentCreditCards.map(CardInfo => {
        const CreditCard = CreditCards.find(card => card.CreditCard === CardInfo.CreditCard)

        if (!CreditCard) {
          throw new BadRequestError(`Invalid Credit Card ${CardInfo.CreditCard}`)
        }
        
        return {
          CreditAcct: CreditCard.CreditAcct,
          ...CardInfo
        }
      })
    }

    const TaxAuthorizations = ClientIsTaxExempt ? null : await getTaxAutorizations(ItemDetails, Sale.Invoice.VATExempt)

    const Items = ItemDetails.map(getItemLine(Sale, ClientIsTaxExempt, TaxAuthorizations))

    const payload = {
      Operation: 'QUICKSALE',
      Data: {
        SalesPointID,
        SalesPersonCode: SalesEmployeeCode,
        CardCode: Card.CardCode,
        Items,
        Invoice: {
          VATExempt: ClientIsTaxExempt ? true : Sale.Invoice.VATExempt,
          TaxAuthorizations: TaxAuthorizations ? Object.keys(TaxAuthorizations).reduce((Authorizations, TaxGroup) => {
            Authorizations[TaxGroup] = TaxAuthorizations[TaxGroup].TaxAuthorizationCode
            return Authorizations
          }, {}) : {},
          PaymentGroupCode: Sale.Invoice.PaymentGroupCode,
          U_NIT: Sale.Invoice.U_NIT,
          U_RAZSOC: Sale.Invoice.U_RAZSOC,
          Payment
        }
      }
    }

    // return payload
    console.log('requesting quick sale', payload)
    const { data } = await sap.post('/script/test/guembe', payload)
    console.log('received a response', data)
    
    return data
  }
}

async function getTaxAutorizations (ItemDetails, VATExempt) {
  const TaxGroups = Array.from(new Set(ItemDetails.filter(({ TaxExempt }) => !TaxExempt).map(({ TaxGroup }) => TaxGroup)))

  const { rows: TaxAuthorizations } = await pg.query(/*sql*/`
    WITH CHOICE_1 AS (
      SELECT *
      FROM "TaxAuthorization"
      WHERE "ValidFrom" <= DATE 'today' AND "ValidTo" > DATE 'tomorrow'
      AND "TaxGroup" = ANY ($1)
      AND "VATExempt" = $2
    ), CHOICE_2 AS (
      SELECT *
      FROM "TaxAuthorization"
      WHERE "ValidFrom" <= DATE 'today' AND "ValidTo" > DATE 'tomorrow'
      AND "TaxGroup" = ANY ($1)
      AND "VATExempt" = false
      AND "TaxGroup" NOT IN (SELECT "TaxGroup" FROM CHOICE_1)
    )
    SELECT * FROM CHOICE_1
    UNION
    SELECT * FROM CHOICE_2
  `, [ TaxGroups, VATExempt ])

  return TaxGroups.reduce((result, TaxGroup) => {
    const Authorizations = TaxAuthorizations.filter(Authorization => Authorization.TaxGroup === TaxGroup)        

    if (Authorizations.length < 1) {
      throw new BadRequestError(`No se encontro dosificacion vigente para ${TaxGroup}`)
    } else if (Authorizations.length > 1) {
      throw new BadRequestError(`Se encontraron demasiadas dosificaciones vigentes para ${TaxGroup}`)
    } else {
      result[TaxGroup] = Authorizations[0]
    }

    return result
  }, {})
}

function getItemDetails (SalesPointID) {
  return async ({ ItemCode, Quantity, PriceAfterVAT }) => {
    const { rows: [ Item ] } = await pg.query(/* sql */`
      SELECT *
      FROM "SalesPointItem"
      WHERE "SalesPointID" = $1 AND "ItemCode" = $2
    `, [ SalesPointID, ItemCode ])

    return {
      ...Item,
      ItemCode,
      Quantity,
      PriceAfterVAT
    }
  }
}

function getItemLine (Sale, ClientIsTaxExempt, TaxAuthorizations) {
  return Item => ({
    ItemCode: Item.ItemCode,
    Quantity: Item.Quantity,
    PriceAfterVAT: Item.PriceAfterVAT,
    CostingCode: Item.CostingCode,
    CostingCode2: Item.CostingCode2,
    WarehouseCode: Item.WarehouseCode,
    TaxGroup: ClientIsTaxExempt ? null : Item.TaxGroup,
    TaxExempt: ClientIsTaxExempt ? true : Item.TaxExempt,
    VATExempt: ClientIsTaxExempt || Item.TaxExempt ? true : TaxAuthorizations[Item.TaxGroup].VATExempt
  })
}

async function getCardDetails(CardCode) {
  const { data } = await sap.get(`/BusinessPartners('${CardCode}')`, {
    params: {
      '$select': 'CardCode,CardName,GroupCode,PayTermsGrpCode,PriceListNum'
    }
  })
  return data
}

async function getSalesPointDetails(SalesPointID) {
  const { rows: [ SalesPoint ] } = await pg.query(/* sql */`
    SELECT "SalesPointID", "CashAccount"
    FROM "SalesPoint"
    WHERE "SalesPointID" = $1
  `, [ SalesPointID ])

  return SalesPoint
}

function formatDate(date = new Date()) {
  return date.getFullYear() + `00${date.getMonth() + 1}`.slice(-2) + `00${date.getDate()}`.slice(-2)
}
