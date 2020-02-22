const { client: sap } = require('utils/sap')

async function getItemDetails(ItemCode) {
  try {
    // note: we may want to select ItemWarehouseInfoCollection if we want to be aware of stock levels
    const { data } = await sap.get(`/Items('${ItemCode}')`, {
      params: {
        '$select': 'ItemCode,ItemName,ItemPrices,U_GPOS_AllowManualPrice,U_GPOS_AllowCredit,U_GPOS_AllowAffiliate'
      }
    })
    return data    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      error.message = `No se pudo encontrar el articulo ${ItemCode}`
    }
    throw error
  } 
}

module.exports = {
  async salespoint ({ Code }) {
    const { data: SalesPoint } = await sap.get(`/GPosSalesPoint('${Code}')`)

    return {
      Code: SalesPoint.Code,
      Name: SalesPoint.Name,
      Catalog: await Promise.all(SalesPoint.GPOS_SALESITEMCollection.map(async Item => {
        const ItemDetails = await getItemDetails(Item.U_ItemCode)

        return {
          ItemCode: ItemDetails.ItemCode,
          ItemName: ItemDetails.ItemName,
          AllowManualPrice: ItemDetails.U_GPOS_AllowManualPrice === 1,
          AllowCredit: ItemDetails.U_GPOS_AllowCredit === 1,
          AllowAffiliate: ItemDetails.U_GPOS_AllowAffiliate === 1,
          ItemPrices: ItemDetails.ItemPrices.map(({ PriceList, Price }) => ({ PriceList, Price })),
          Tags: Item.U_Tags ? Item.U_Tags.split(/[^\w]/) : []
        }
      }))
    }
  },
  async creditcard ({ CreditCardCode }) {
    const { data } = await sap.get(`/CreditCards(${CreditCardCode})`)
    return data
  },
  async creditcards () {
    const { data: { value } } = await sap.get(`/CreditCards`)
    return value
  },
  async pricelist ({ PriceListNo }) {
    const { data } = await sap.get(`/PriceLists(${PriceListNo})`, {
      params: {
        '$select': 'PriceListNo,PriceListName'
      }
    })
  
    return data
  },
  async pricelists () {
    const { data: { value } } = await sap.get(`/PriceLists`, {
      params: {
        '$select': 'PriceListNo,PriceListName'
      }
    })

    return value
  },
  async business_partners ({ search = null, limit = 20, offset = 0 }) {
    const { data: { ['odata.count']: count, value: items }  } = await sap.get(`BusinessPartners`, {
      headers: {
        'Prefer': 'odata.maxpagesize=0',
        'B1S-CaseInsensitive': true
      },
      params: {
        '$select': 'CardCode,CardName,GroupCode,CardForeignName,FederalTaxID,PayTermsGrpCode,PriceListNum,PriceList/PriceListNo,PriceList/PriceListName,VatLiable,Affiliate',
        '$expand': 'PriceList',
        '$filter': `${search ? `contains(CardName, '${search}') and ` : ''}CardType eq 'cCustomer' and Valid eq 'Y' and Frozen eq 'N'`,
        '$orderby': 'CardName asc',
        '$inlinecount': 'allpages',
        '$top': limit,
        '$skip': offset
      }
    })

    return {
      count,
      items: items.map(item => ({
        ...item,
        VatLiable: item.VatLiable === 'vLiable',
        Affiliate: item.Affiliate === 'tYES'
      }))
    }
  },
  async business_partner ({ CardCode }) {
    const { data } = await sap.get(`BusinessPartners('${CardCode}')`, {
      params: {
        '$select': 'CardCode,CardName,GroupCode,CardForeignName,FederalTaxID,PayTermsGrpCode,PriceListNum,PriceList/PriceListNo,PriceList/PriceListName,VatLiable,Affiliate',
        '$expand': 'PriceList'
      }
    })

    return {
      ...data,
      VatLiable: data.VatLiable === 'vLiable',
      Affiliate: data.Affiliate === 'tYES'
    }
  }
}