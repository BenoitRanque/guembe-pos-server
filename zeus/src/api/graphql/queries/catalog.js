const { getSalesPerson, getEmployeeFromEmployeeID, getEmployeeRoles } = require('../../../utils/employee')

function getInvoiceDocumentLines (DocEntry, sap) {
  return async () => {
    const hana = await sap.hana
    return hana.execute(/*sql*/`
      SELECT
        T0."ItemCode" AS "ItemCode",
        T0."Dscription" AS "ItemDescription",
        T0."Quantity" AS "Quantity",
        T0."PriceAfVAT" AS "PriceAfterVAT"
      FROM INV1 T0
      WHERE T0."DocEntry" = ?
    `, [ DocEntry ])
  }
}
function getInvoiceTaxSeries (TaxSeriesCode, sap) {
  return async () => {
    const hana = await sap.hana
    const [ TaxSeries ] = await hana.execute(/*sql*/`
      SELECT
        T0."U_ACTIVIDAD",
        T0."U_LEYENDA",
        T0."U_DIRECCION",
        T0."U_CIUDAD",
        T0."U_PAIS",
        T0."U_SUCURSAL"
      FROM U_LB_CDC_DOS T0
      WHERE T0."Code" = ?
      LIMIT 1
    `, [ TaxSeriesCode ])
    return TaxSeries
  }
}

module.exports = {
  async employee ({ EmployeeID }, { sap }) {
    return getEmployeeFromEmployeeID(EmployeeID, sap)()
  },
  async employees ({ limit = null, offset = 0, showUnset = false }, { sap }) {
    const hana = await sap.hana
    const [
      [{ count }],
      Employees
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) AS "count" FROM OHEM T0
      `),
      hana.execute(/*sql*/`
        SELECT
          T0."empID" AS "EmployeeID",
          T0."salesPrson" AS "SalesPersonCode"
        FROM OHEM T0
        LEFT JOIN OSLP T1 ON T1."SlpCode" = T0."salesPrson" 
        WHERE T0."Active" = 'Y'
        AND T1."Active" = 'Y'
        ${showUnset ? '' :/*sql*/`AND T0."U_GPOS_Password" IS NOT NULL`}
        ORDER BY T1."SlpName" ASC
        LIMIT ?
        OFFSET ?
      `, [ limit, offset ])
    ])
    return {
      totalItems: count,
      pageItems: Employees.map(Employee => ({
        ...Employee,
        Roles: getEmployeeRoles(Employee.EmployeeID, sap),
        SalesPerson: getSalesPerson(Employee.SalesPersonCode, sap)
      }))
    }
  },
  async invoice ({ DocEntry }, { sap }) {
    const hana = await sap.hana
    const [ invoice ] = await hana.execute(/*sql*/`
      SELECT
        T0."DocEntry",
        T0."DocNum",
        T0."DocDate",
        SUBSTRING(T0."DocTime", 1, LENGTH(T0."DocTime") - 2) || ':' || RIGHT(T0."DocTime", 2) AS "DocTime",
        T0."CardCode",
        T0."CardName",
        T0."NumAtCard",
        T0."SlpCode" AS "SalesPersonCode",
        T0."DocTotal",
        T0."Comments",
        T0."JrnlMemo" AS "JournalMemo",
        T0."GroupNum" AS "PaymentGroupCode",
        T0."CANCELLED" AS "Cancelled",
        T0."U_TIPODOC",
        T0."U_NIT",
        T0."U_RAZSOC",
        T0."U_CCFACANU",
        T0."U_CODCTRL",
        T0."U_NROAUTOR",
        T0."U_ESTADOFC",
        T0."U_NRO_FAC",
        T0."U_GPOS_SalesPointCode",
        T0."U_GPOS_Serial",
        T0."U_GPOS_Type",
        T0."U_GPOS_TaxSeriesCode"
      FROM OINV T0
      WHERE T0."CANCELLED" <> 'C' AND T0."U_GPOS_Type" <> 0
      AND T0."DocEntry" = ?
      LIMIT 1
    `, [ DocEntry ])
    return invoice ? {
      ...invoice,
      SalesPerson: getSalesPerson(invoice.SalesPersonCode, sap),
      DocumentLines: getInvoiceDocumentLines(invoice.DocEntry, sap),
      TaxSeries: getInvoiceTaxSeries(invoice.U_GPOS_TaxSeriesCode, sap)
    } : null
  },
  async invoices (args, { sap }) {
    const {
      limit = null,
      offset = 0,
      FromDate,
      ToDate,
      filter = null,
      SalesPointCode = null,
      SalesPersonCode = null
    } = args

    const optionalArgs = []
    const optionalQuery = []

    if (SalesPointCode !== null) {
      optionalArgs.push(SalesPointCode)
      optionalQuery.push(/*sql*/`AND T0."U_GPOS_SalesPointCode" = ?`)
    }
    if (SalesPersonCode !== null) {
      optionalArgs.push(SalesPersonCode)
      optionalQuery.push(/*sql*/`AND T0."SlpCode" = ?`)
    }
    if (filter !== null) {
      optionalArgs.push(filter)
      optionalQuery.push(/*sql*/`
        AND CONTAINS((
          T0."CardCode",
          T0."CardName",
          T0."U_NIT",
          T0."U_RAZSOC",
          T0."U_CODCTRL",
          T0."U_NRO_FAC",
          T0."U_NROAUTOR",
          T0."U_GPOS_Serial"
        ), ?)
      `)
    }

    const hana = await sap.hana
    const [
      [{ count }],
      invoices
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) AS "count"
        FROM OINV T0
        WHERE T0."CANCELED" <> 'C' AND T0."U_GPOS_Type" <> 0
        AND T0."DocDate" >= ?
        AND T0."DocDate" <= ?
        ${optionalQuery.join(' ')}
      `, [
        FromDate,
        ToDate,
        ...optionalArgs
      ]),
      hana.execute(/*sql*/`
        SELECT
          T0."DocEntry",
          T0."DocNum",
          TO_DATE(T0."DocDate") AS "DocDate",
          SUBSTRING(T0."DocTime", 1, LENGTH(T0."DocTime") - 2) || ':' || RIGHT(T0."DocTime", 2) AS "DocTime",
          T0."CardCode",
          T0."CardName",
          T0."NumAtCard",
          T0."SlpCode" AS "SalesPersonCode",
          T0."DocTotal",
          T0."Comments",
          T0."JrnlMemo" AS "JournalMemo",
          T0."GroupNum" AS "PaymentGroupCode",
          T0."CANCELED" AS "Cancelled",
          T0."U_TIPODOC",
          T0."U_NIT",
          T0."U_RAZSOC",
          T0."U_CCFACANU",
          T0."U_CODCTRL",
          T0."U_NROAUTOR",
          T0."U_ESTADOFC",
          T0."U_NRO_FAC",
          T0."U_GPOS_SalesPointCode",
          T0."U_GPOS_Serial",
          T0."U_GPOS_Type",
          T0."U_GPOS_TaxSeriesCode"
        FROM OINV T0
        WHERE T0."CANCELED" <> 'C' AND T0."U_GPOS_Type" <> 0
        AND T0."DocDate" >= ?
        AND T0."DocDate" <= ?
        ${optionalQuery.join(' ')}
        ORDER BY T0."DocDate" ASC, T0."U_GPOS_Serial" ASC
        LIMIT ?
        OFFSET ?
      `, [
        FromDate,
        ToDate,
        ...optionalArgs,
        limit,
        offset
      ])
    ])
    return {
      totalItems: count,
      pageItems: invoices.map(invoice => ({
        ...invoice,
        SalesPerson: getSalesPerson(invoice.SalesPersonCode, sap),
        DocumentLines: getInvoiceDocumentLines(invoice.DocEntry, sap),
        TaxSeries: getInvoiceTaxSeries(invoice.U_GPOS_TaxSeriesCode, sap)
      }))
    }
  },
  async item ({ SalesPointCode, PrimaryPriceList, SecondaryPriceList, Code, CodeType = 'ItemCode', }, { sap }) {
    const hana = await sap.hana
    const [ item ] = await hana.execute(/*sql*/`
      SELECT T0."ItemCode",
        T0."ItemName",
        TO_BOOLEAN(T0."U_GPOS_AllowManualPrice") AS "AllowManualPrice",
        TO_BOOLEAN(T0."U_GPOS_AllowCredit") AS "AllowCredit",
        TO_BOOLEAN(T0."U_GPOS_AllowAffiliate") AS "AllowAffiliate",
        T2."Price" AS "PrimaryPrice",
        T3."Price" AS "SecondaryPrice",
        T4."OnHand" AS "Stock"
      FROM OITM T0
      INNER JOIN "@GPOS_SALESITEM" T1 ON T1."U_ItemCode" = T0."ItemCode" AND T1."Code" = ?
      LEFT JOIN ITM1 T2 ON T2."ItemCode" = T0."ItemCode" AND T2."PriceList" = ? AND T2."Price" <> 0
      LEFT JOIN ITM1 T3 ON T3."ItemCode" = T0."ItemCode" AND T3."PriceList" = ? AND T3."Price" <> 0
      LEFT JOIN OITW T4 ON T4."ItemCode" = T0."ItemCode" AND T4."WhsCode" = T1."U_WarehouseCode" AND T0."InvntItem" = 'Y'
      WHERE T0."${CodeType === 'BarCode' ? 'CodeBars' : 'ItemCode'}" = ?
      ORDER BY T0."ItemName" ASC
      LIMIT 1
    `, [
      SalesPointCode,
      PrimaryPriceList,
      SecondaryPriceList,
      Code
    ])

    return item
  },
  async items (args, { sap }) {
    const {
      limit = 10,
      offset = 0,
      filter = null,
      SalesPointCode,
      PrimaryPriceList,
      SecondaryPriceList
    } = args
      
    const hana = await sap.hana
    const [
      [{ count }],
      items
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) as "count"
        FROM OITM T0
        INNER JOIN "@GPOS_SALESITEM" T1 ON T1."U_ItemCode" = T0."ItemCode" AND T1."Code" = ?
        WHERE ? = false OR CONTAINS((
          T0."ItemCode",
          T0."ItemName",
          T0."CodeBars",
          T0."FrgnName",
          T0."U_GPOS_Tags"
        ), ?)
      `, [
        SalesPointCode,
        !!filter,
        `%${filter}%`
      ]),
      hana.execute(/*sql*/`
        SELECT T0."ItemCode",
          T0."ItemName",
          TO_BOOLEAN(T0."U_GPOS_AllowManualPrice") AS "AllowManualPrice",
          TO_BOOLEAN(T0."U_GPOS_AllowCredit") AS "AllowCredit",
          TO_BOOLEAN(T0."U_GPOS_AllowAffiliate") AS "AllowAffiliate",
          T2."Price" AS "PrimaryPrice",
          T3."Price" AS "SecondaryPrice",
          T4."OnHand" AS "Stock"
        FROM OITM T0
        INNER JOIN "@GPOS_SALESITEM" T1 ON T1."U_ItemCode" = T0."ItemCode" AND T1."Code" = ?
        LEFT JOIN ITM1 T2 ON T2."ItemCode" = T0."ItemCode" AND T2."PriceList" = ? AND T2."Price" <> 0
        LEFT JOIN ITM1 T3 ON T3."ItemCode" = T0."ItemCode" AND T3."PriceList" = ? AND T3."Price" <> 0
        LEFT JOIN OITW T4 ON T4."ItemCode" = T0."ItemCode" AND T4."WhsCode" = T1."U_WarehouseCode" AND T0."InvntItem" = 'Y'
        WHERE ? = false OR CONTAINS((
          T0."ItemCode",
          T0."ItemName",
          T0."CodeBars",
          T0."FrgnName",
          T0."U_GPOS_Tags"
        ), ?)
        ORDER BY T0."ItemName" ASC
        LIMIT ? OFFSET ?
      `, [
        SalesPointCode,
        PrimaryPriceList,
        SecondaryPriceList,
        !!filter,
        `%${filter}%`,
        limit,
        offset
      ])
    ])

    return {
      totalItems: count,
      pageItems: items
    }
  },
  async salespoint ({ Code }, { sap }) {
    const hana = await sap.hana
    const [ salespoint = null ] = await hana.execute(/*sql*/`
      SELECT
        T0."Code",
        T0."Name"
      FROM "@GPOS_SALESPOINT" T0
      LIMIT 1
    `, [
      Code
    ])
    return salespoint
    // const { data: salespoint } = await sap.get(`/GPosSalesPoint('${Code}')`)

    // return {
    //   Code: salespoint.Code,
    //   Name: salespoint.Name
    // }
  },
  async salespoints ({ limit = null, offset = 0 }, { sap }) {
    const hana = await sap.hana
    const [
      [{ count }],
      items
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) AS "count"
        FROM "@GPOS_SALESPOINT" T0        
      `),
      hana.execute(/*sql*/`
        SELECT
          T0."Code",
          T0."Name"
        FROM "@GPOS_SALESPOINT" T0
        ORDER BY T0."Name" ASC
        LIMIT ?
        OFFSET ?
      `, [
        limit,
        offset
      ])
    ])
    return {
      totalItems: count,
      pageItems: items
    }
    // const params = {
    //   '$orderby': `Name asc`
    // }

    // const headers = {
    //   Prefer: 'odata.maxpagesize=0' 
    // }

    // if (limit !== null) {
    //   params['$top'] = limit
    //   params['$skip'] = offset
    // }

    // const { data: { value: salespoints } } = await sap.get('/GPosSalesPoint', {
    //   params,
    //   headers
    // })

    // return salespoints.map(salespoint => ({
    //   Code: salespoint.Code,
    //   Name: salespoint.Name
    // }))
  },
  async creditcard ({ CreditCard }, { sap }) {
    const hana = await sap.hana
    const [ card ] = await hana.execute(/*sql*/`
      SELECT
        T0."CreditCard",
        T0."CardName"
      FROM OCRC T0
      WHERE T0."CreditCard" = ?
      LIMIT 1
    `, [ CreditCard ])
    return card

    // const { data } = await sap.get(`/CreditCards(${CreditCardCode})`)
    // return data
  },
  async creditcards ({ limit = null, offset = 0 }, { sap }) {
    const hana = await sap.hana
    const [
      [{ count }],
      items
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) as "count"
        FROM OCRC T0
      `),
      hana.execute(/*sql*/`
        SELECT
          T0."CreditCard",
          T0."CardName"
        FROM OCRC T0
        ORDER BY T0."CreditCard"
        LIMIT ?
        OFFSET ?
      `, [
        limit,
        offset
      ])
    ])
    return {
      totalItems: count,
      pageItems: items
    }
    // const { data: { value } } = await sap.get(`/CreditCards`)
    // return value
  },
  async business_partner ({ Code, CodeType }, { sap }) {
    const hana = await sap.hana
    const [ business_partner ] = await hana.execute(/*sql*/`
      SELECT
        T0."CardCode",
        T0."CardName",
        T0."CardFName" AS "CardForeignName",
        T0."LicTradNum" AS "FederalTaxID",
        T0."GroupNum" AS "PayTermsGrpCode",
        T0."Affiliate",
        T0."VatStatus" AS "VatLiable",
        T1."ListNum" AS "PrimaryPriceList",
        T1."ListName" AS "PrimaryPriceListName",
        T2."ListNum" AS "SecondaryPriceList",
        T2."ListName" AS "SecondaryPriceListName"
      FROM OCRD T0
      LEFT JOIN OPLN T1 ON T1."ListNum" = T0."ListNum"
      LEFT JOIN OPLN T2 ON T2."ListNum" = 1
      WHERE T0."${CodeType === 'FederalTaxID' ? 'LicTradNum' : 'CardCode'}" = ?
    `, [
      Code
    ])
    return business_partner // TODO: map booleans
  },
  async business_partners ({ limit = null, offset = 0, filter = null }, { sap }) {
    const hana = await sap.hana
    const [
      [{ count }],
      items
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) as "count"
        FROM OCRD T0
        WHERE T0."CardType" = 'C'
        AND T0."validFor" = 'Y'
        AND T0."frozenFor" = 'N'
        AND (? = false OR CONTAINS((
          T0."CardCode",
          T0."CardName",
          T0."CardFName",
          T0."LicTradNum"
        ), ?))
      `, [
        !!filter,
        `%${filter}%`,
        offset,
        limit
      ]),
      hana.execute(/*sql*/`
        SELECT
          T0."CardCode",
          T0."CardName",
          T0."CardFName" AS "CardForeignName",
          T0."LicTradNum" AS "FederalTaxID",
          T0."GroupNum" AS "PayTermsGrpCode",
          T0."Affiliate",
          T0."VatStatus" AS "VatLiable",
          T1."ListNum" AS "PrimaryPriceList",
          T1."ListName" AS "PrimaryPriceListName",
          T2."ListNum" AS "SecondaryPriceList",
          T2."ListName" AS "SecondaryPriceListName"
        FROM OCRD T0
        LEFT JOIN OPLN T1 ON T1."ListNum" = T0."ListNum"
        LEFT JOIN OPLN T2 ON T2."ListNum" = 1
        WHERE T0."CardType" = 'C'
        AND T0."validFor" = 'Y'
        AND T0."frozenFor" = 'N'
        AND (? = false OR CONTAINS((
          T0."CardCode",
          T0."CardName",
          T0."CardFName",
          T0."LicTradNum"
        ), ?))
        ORDER BY T0."CardName" ASC
        LIMIT ?
        OFFSET ?
      `, [
        !!filter,
        `%${filter}%`,
        offset,
        limit
      ])
    ])

    return {
      totalItems: count,
      pageItems: items
    }
  }
}