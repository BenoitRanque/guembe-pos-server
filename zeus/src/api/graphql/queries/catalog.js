const { getSalesPerson, getEmployeeFromEmployeeID, getEmployeeRoles } = require('../../../utils/employee')

async function getSalesPoint (Code, sap ) {
  const hana = await sap.hana
  const [ salespoint = null ] = await hana.execute(/*sql*/`
    SELECT
      T0."Code",
      T0."Name"
    FROM "@GPOS_SALESPOINT" T0
    WHERE T0."Code" = ?
    LIMIT 1
  `, [
    Code
  ])
  return salespoint
}

async function getSalesOrder (DocEntry, sap) {
  const hana = await sap.hana
  const [ salesOrder ] = await hana.execute(/*sql*/`
    SELECT
      T0."DocEntry",
      T0."DocNum",
      T0."DocDate",
      SUBSTRING(T0."DocTime", 1, LENGTH(T0."DocTime") - 2) || ':' || RIGHT(T0."DocTime", 2) AS "DocTime",
      T0."CardCode",
      T0."CardName",
      T0."SlpCode" AS "SalesPersonCode",
      T0."DocTotal",
      T0."Comments",
      T0."JrnlMemo" AS "JournalMemo",
      CASE WHEN T0."CANCELED" = 'Y' THEN TRUE ELSE FALSE END AS "Cancelled",
      CASE T0."U_GPOS_Type"
        WHEN 101 THEN 'QUICKSALE'
        WHEN 102 THEN 'TABLE_OPEN'    
        WHEN 103 THEN 'TABLE_CLOSED'      
        WHEN 104 THEN 'TABLE_INVOICED'      
        WHEN 105 THEN 'TABLE_CANCELLED'
        ELSE NULL END AS "Type",      
      T0."U_GPOS_SalesPointCode",
      T0."U_GPOS_Serial",
      T0."U_GPOS_Type"
    FROM ORDR T0
    WHERE T0."CANCELED" <> 'C' AND T0."U_GPOS_Type" <> 0
    AND T0."DocEntry" = ?
    LIMIT 1
  `, [ DocEntry ])
  return salesOrder ? {
    ...salesOrder,
    SalesPerson: () => getSalesPerson(salesOrder.SalesPersonCode, sap),
    SalesPoint: () => getSalesPoint(salesOrder.U_GPOS_SalesPointCode, sap),
    DocumentLines: () => getSalesOrderDocumentLines(salesOrder.DocEntry, sap)
  } : null
}

async function getSalesOrderDocumentLines(DocEntry, sap) {
  const hana = await sap.hana
  const lines = await hana.execute(/*sql*/`
    SELECT
      T0."ItemCode" AS "ItemCode",
      T0."Dscription" AS "ItemDescription",
      T0."Quantity" AS "Quantity",
      T0."PriceAfVAT" AS "Price",
      T0."SlpCode" AS "SalesPersonCode"
    FROM RDR1 T0
    WHERE T0."DocEntry" = ?
  `, [ DocEntry ])
  
  return lines.map(line => ({
    ...line,
    SalesPerson: () => getSalesPerson(line.SalesPersonCode, sap)
  }))
}

async function getInvoice (DocEntry, sap) {
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
      CASE WHEN T0."CANCELED" = 'Y' THEN TRUE ELSE FALSE END AS "Cancelled",
      T0."U_TIPODOC",
      T0."U_NIT",
      T0."U_RAZSOC",
      T0."U_CCFACANU",
      T0."U_CODCTRL",
      T0."U_NROAUTOR",
      T0."U_ESTADOFC",
      T0."U_NRO_FAC",
      T0."U_FECHALIM",
      T0."U_EXENTO",
      T0."U_GPOS_SalesPointCode",
      T0."U_GPOS_Serial",
      T0."U_GPOS_Type",
      T0."U_GPOS_TaxSeriesCode"
    FROM OINV T0
    WHERE T0."CANCELED" <> 'C' AND T0."U_GPOS_Type" <> 0
    AND T0."DocEntry" = ?
    LIMIT 1
  `, [ DocEntry ])
  return invoice ? {
    ...invoice,
    SalesPerson: () => getSalesPerson(invoice.SalesPersonCode, sap),
    SalesPoint: () => getSalesPoint(invoice.U_GPOS_SalesPointCode, sap),
    DocumentLines: () => getInvoiceDocumentLines(invoice.DocEntry, sap),
    TaxSerie: () => getInvoiceTaxSerie(invoice.U_GPOS_TaxSeriesCode, sap)
  } : null
}

async function getInvoiceDocumentLines (DocEntry, sap) {
  const hana = await sap.hana
  const lines = await hana.execute(/*sql*/`
    SELECT
      T0."ItemCode" AS "ItemCode",
      T0."Dscription" AS "ItemDescription",
      T0."Quantity" AS "Quantity",
      T0."PriceAfVAT" AS "Price",
      T0."SlpCode" AS "SalesPersonCode"
    FROM INV1 T0
    WHERE T0."DocEntry" = ?
  `, [ DocEntry ])

  return lines.map(line => ({
    ...line,
    SalesPerson: () => getSalesPerson(line.SalesPersonCode, sap)
  }))
}
async function getInvoiceTaxSerie (TaxSerieCode, sap) {
  const hana = await sap.hana
  const [ TaxSerie ] = await hana.execute(/*sql*/`
    SELECT
      T0."U_ACTIVIDAD",
      T0."U_LEYENDA",
      T0."U_DIRECCION",
      T0."U_CIUDAD",
      T0."U_PAIS",
      T0."U_SUCURSAL"
    FROM "@LB_CDC_DOS" T0
    WHERE T0."Code" = ?
    LIMIT 1
  `, [ TaxSerieCode ])

  return TaxSerie
}

module.exports = {
  async employee ({ EmployeeID }, { sap }) {
    return getEmployeeFromEmployeeID(EmployeeID, sap)
  },
  async employees ({ limit = null, offset = 0, showUnset = false }, { sap }) {
    const hana = await sap.hana
    const [
      [{ count }],
      Employees
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) AS "count" FROM OHEM T0
        ${showUnset ? '' :/*sql*/`WHERE T0."U_GPOS_Password" IS NOT NULL`}
      `),
      hana.execute(/*sql*/`
        SELECT
          T0."empID" AS "EmployeeID",
          T0."salesPrson" AS "SalesPersonCode",
          T1."SlpName" AS "SalesPersonName"
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
        SalesPerson: {
          ...Employee,
          Employee: () => getEmployeeFromEmployeeID(Employee.EmployeeID, sap)
        },
        Roles: () => getEmployeeRoles(Employee.EmployeeID, sap)
      }))
    }
  },
  async sales_order ({ DocEntry }, { sap }) {
    return getSalesOrder(DocEntry, sap)
  },
  async sales_orders (args, { sap }) {
    const {
      limit = null,
      offset = 0,
      FromDate,
      ToDate,
      SalesPointCode = null,
      SalesPersonCode = null,
      Type = null
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
    if (Type !== null && Type.length) {
      const TypeMap = {
        QUICKSALE: 101,
        TABLE_OPEN: 102,    
        TABLE_CLOSED: 103,      
        TABLE_INVOICED: 104,      
        TABLE_CANCELLED: 105
      }

      optionalQuery.push(`AND T0."U_GPOS_Type" IN (${Type.map(type => TypeMap[type]).join(', ')})`)
    }

    const hana = await sap.hana
    const [
      [{ count }],
      salesOrders
    ] = await Promise.all([
      hana.execute(/*sql*/`
        SELECT COUNT(*) AS "count"
        FROM ORDR T0
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
          CASE WHEN T0."CANCELED" = 'Y' THEN TRUE ELSE FALSE END AS "Cancelled",
          CASE T0."U_GPOS_Type"
            WHEN 101 THEN 'QUICKSALE'
            WHEN 102 THEN 'TABLE_OPEN'    
            WHEN 103 THEN 'TABLE_CLOSED'      
            WHEN 104 THEN 'TABLE_INVOICED'      
            WHEN 105 THEN 'TABLE_CANCELLED'
            ELSE NULL END AS "Type", 
          T0."U_GPOS_SalesPointCode",
          T0."U_GPOS_Serial",
          T0."U_GPOS_Type"
        FROM ORDR T0
        WHERE T0."CANCELED" <> 'C' AND T0."U_GPOS_Type" <> 0
        AND T0."DocDate" >= ?
        AND T0."DocDate" <= ?
        ${optionalQuery.join(' ')}
        ORDER BY T0."DocDate" DESC, T0."U_GPOS_SalesPointCode" ASC, T0."U_GPOS_Serial" DESC
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
      pageItems: salesOrders.map(salesOrder => ({
        ...salesOrder,
        SalesPerson: () => getSalesPerson(salesOrder.SalesPersonCode, sap),
        SalesPoint: () => getSalesPoint(salesOrder.U_GPOS_SalesPointCode, sap),
        DocumentLines: () => getSalesOrderDocumentLines(salesOrder.DocEntry, sap),
      }))
    }
  },
  async invoice ({ DocEntry }, { sap }) {
    return getInvoice(DocEntry, sap)
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
      optionalArgs.push(`%${filter}%`)
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
          CASE WHEN T0."CANCELED" = 'Y' THEN TRUE ELSE FALSE END AS "Cancelled",
          T0."U_TIPODOC",
          T0."U_NIT",
          T0."U_RAZSOC",
          T0."U_CCFACANU",
          T0."U_CODCTRL",
          T0."U_NROAUTOR",
          T0."U_ESTADOFC",
          T0."U_NRO_FAC",
          T0."U_FECHALIM",
          T0."U_EXENTO",
          T0."U_GPOS_SalesPointCode",
          T0."U_GPOS_Serial",
          T0."U_GPOS_Type",
          T0."U_GPOS_TaxSeriesCode"
        FROM OINV T0
        WHERE T0."CANCELED" <> 'C' AND T0."U_GPOS_Type" <> 0
        AND T0."DocDate" >= ?
        AND T0."DocDate" <= ?
        ${optionalQuery.join(' ')}
        ORDER BY T0."DocDate" DESC, T0."U_GPOS_SalesPointCode" ASC, T0."U_GPOS_Serial" DESC
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
        SalesPerson: () => getSalesPerson(invoice.SalesPersonCode, sap),
        SalesPoint: () => getSalesPoint(invoice.U_GPOS_SalesPointCode, sap),
        DocumentLines: () => getInvoiceDocumentLines(invoice.DocEntry, sap),
        TaxSerie: () => getInvoiceTaxSerie(invoice.U_GPOS_TaxSeriesCode, sap)
      }))
    }
  },
  async item ({ SalesPointCode, PrimaryPriceList = null, SecondaryPriceList = null, Code, CodeType = 'ItemCode', }, { sap }) {
    const hana = await sap.hana
    const [ item ] = await hana.execute(/*sql*/`
      SELECT T0."ItemCode",
        T0."ItemName",
        TO_BOOLEAN(T0."U_GPOS_AllowManualPrice") AS "AllowManualPrice",
        TO_BOOLEAN(T0."U_GPOS_AllowCredit") AS "AllowCredit",
        TO_BOOLEAN(T0."U_GPOS_AllowAffiliate") AS "AllowAffiliate",
        ${PrimaryPriceList === null ? '' : /*sql*/`T2."Price" AS "PrimaryPrice",`}
        ${SecondaryPriceList === null ? '' : /*sql*/`T3."Price" AS "SecondaryPrice",`}
        T4."OnHand" AS "Stock"
      FROM OITM T0
      INNER JOIN "@GPOS_SALESITEM" T1 ON T1."U_ItemCode" = T0."ItemCode" AND T1."Code" = ?
      ${PrimaryPriceList === null ? '' : /*sql*/`LEFT JOIN ITM1 T2 ON T2."ItemCode" = T0."ItemCode" AND T2."PriceList" = ? AND T2."Price" <> 0`}
      ${SecondaryPriceList === null ? '' : /*sql*/`LEFT JOIN ITM1 T3 ON T3."ItemCode" = T0."ItemCode" AND T3."PriceList" = ? AND T3."Price" <> 0`}
      LEFT JOIN OITW T4 ON T4."ItemCode" = T0."ItemCode" AND T4."WhsCode" = T1."U_WarehouseCode" AND T0."InvntItem" = 'Y'
      WHERE ${CodeType === 'BarCode' ? /*sql*/`CONTAINS((T0."ItemCode", T0."CodeBars"), ?)` : /*sql*/`T0."ItemCode" = ?`}
      ORDER BY T0."ItemName" ASC
      LIMIT 1
    `, [
      SalesPointCode,
      PrimaryPriceList,
      SecondaryPriceList,
      Code
    ].filter(value => value !== null))

    return item
  },
  async items (args, { sap }) {
    const {
      limit = null,
      offset = 0,
      filter = null,
      SalesPointCode,
      PrimaryPriceList = null,
      SecondaryPriceList = null
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
        ${filter === null ? '' : /*sql*/`
          WHERE CONTAINS((
            T0."ItemCode",
            T0."ItemName",
            T0."CodeBars",
            T0."FrgnName",
            T0."U_GPOS_Tags"
          ), ?)
        `}
      `, [
        SalesPointCode,
        filter === null ? null : `%${filter}%`
      ].filter(value => value !== null)),
      hana.execute(/*sql*/`
        SELECT T0."ItemCode",
          T0."ItemName",
          TO_BOOLEAN(T0."U_GPOS_AllowManualPrice") AS "AllowManualPrice",
          TO_BOOLEAN(T0."U_GPOS_AllowCredit") AS "AllowCredit",
          TO_BOOLEAN(T0."U_GPOS_AllowAffiliate") AS "AllowAffiliate",
          ${PrimaryPriceList === null ? '' : /*sql*/`T2."Price" AS "PrimaryPrice",`}
          ${SecondaryPriceList === null ? '' : /*sql*/`T3."Price" AS "SecondaryPrice",`}
          T4."OnHand" AS "Stock"
        FROM OITM T0
        INNER JOIN "@GPOS_SALESITEM" T1 ON T1."U_ItemCode" = T0."ItemCode" AND T1."Code" = ?
        ${PrimaryPriceList === null ? '' : /*sql*/`LEFT JOIN ITM1 T2 ON T2."ItemCode" = T0."ItemCode" AND T2."PriceList" = ? AND T2."Price" <> 0`}
        ${SecondaryPriceList === null ? '' : /*sql*/`LEFT JOIN ITM1 T3 ON T3."ItemCode" = T0."ItemCode" AND T3."PriceList" = ? AND T3."Price" <> 0`}
        LEFT JOIN OITW T4 ON T4."ItemCode" = T0."ItemCode" AND T4."WhsCode" = T1."U_WarehouseCode" AND T0."InvntItem" = 'Y'
        ${filter === null ? '' : /*sql*/`
          WHERE CONTAINS((
            T0."ItemCode",
            T0."ItemName",
            T0."CodeBars",
            T0."FrgnName",
            T0."U_GPOS_Tags"
          ), ?)
        `}
        ORDER BY T0."ItemName" ASC
        LIMIT ? OFFSET ?
      `, [
        SalesPointCode,
        PrimaryPriceList,
        SecondaryPriceList,
        filter === null ? null : `%${filter}%`
      ].filter(value => value !== null).concat([
        limit,
        offset
      ]))
    ])

    return {
      totalItems: count,
      pageItems: items
    }
  },
  async salespoint ({ Code }, { sap }) {
    return getSalesPoint(Code, sap)
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
  },
  async changerate (args, { sap }) {
    const hana = await sap.hana
    const [{ Rate }] = await hana.execute(/*sql*/`
      SELECT T0."Rate"
      FROM ORTT T0
      WHERE T0."Currency" = 'USD'
      AND T0."RateDate" = CURRENT_DATE
    `)
    return Rate
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
        CASE WHEN T0."Affiliate" = 'Y' THEN TRUE ELSE FALSE END AS "Affiliate",
        CASE WHEN T0."VatStatus" = 'Y' THEN TRUE ELSE FALSE END AS "VatLiable",
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
        `%${filter}%`
      ]),
      hana.execute(/*sql*/`
        SELECT
          T0."CardCode",
          T0."CardName",
          T0."CardFName" AS "CardForeignName",
          T0."LicTradNum" AS "FederalTaxID",
          T0."GroupNum" AS "PayTermsGrpCode",
          CASE WHEN T0."Affiliate" = 'Y' THEN TRUE ELSE FALSE END AS "Affiliate",
          CASE WHEN T0."VatStatus" = 'Y' THEN TRUE ELSE FALSE END AS "VatLiable",
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
        limit,
        offset
      ])
    ])
    return {
      totalItems: count,
      pageItems: items
    }
  }
}