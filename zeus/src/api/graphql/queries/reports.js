const { client: sap } = require('../../../utils/sapServiceLayer')

module.exports = {
  // TODO!
  async invoices ({ limit = 20, offset = 0, SalesPersonCode = null, SalesPointCode = null, FromDate, ToDate }, ctx) {
    const { data: { ['odata.count']: count, value: items }  } = await sap.get(`Invoices`, {
      headers: {
        'Prefer': 'odata.maxpagesize=0',
      },
      params: {
        '$select': 'DocEntry,DocNum,DocDate,CardCode,CardName,NumAtCard,DocTotal,Comments,JournalMemo,PaymentGroupCode,DocTime,SalesPersonCode,SalesPerson,Cancelled,U_TIPODOC,U_NIT,U_RAZSOC,U_CCFACANU,U_CODCTRL,U_NROAUTOR,U_ESTADOFC,U_NRO_FAC,U_GPOS_SalesPointCode,U_GPOS_Serial,U_GPOS_Type,DocumentLines,SalesPerson/SalesEmployeeCode,SalesPerson/SalesEmployeeName,SalesPerson/EmployeeID',
        '$expand': 'SalesPerson',
        '$filter': [
          `CancelStatus ne 'csCancellation'`,
          'U_GPOS_Type ne 0',
          SalesPersonCode ? `SalesPersonCode eq ${SalesPersonCode}` : null,
          SalesPointCode ? `U_GPOS_SalesPointCode eq '${SalesPointCode}'` : null,
          `DocDate ge ${FromDate}`,
          `DocDate le ${ToDate}`
        ].filter(str => str).join(' and '),
        '$orderby': 'DocDate asc, U_GPOS_Serial asc',
        '$inlinecount': 'allpages',
        '$top': limit,
        '$skip': offset
      }
    })

    return {
      count,
      items
    }
  },
  async invoice ({ DocEntry }, ctx) {
    // TODO: only select required fields
    const { data } = await sap.get(`Invoices(${DocEntry})`, {
      params: {
        '$select': 'DocEntry,DocNum,DocDate,CardCode,CardName,NumAtCard,DocTotal,Comments,JournalMemo,PaymentGroupCode,DocTime,SalesPersonCode,SalesPerson,Cancelled,U_TIPODOC,U_NIT,U_RAZSOC,U_CCFACANU,U_CODCTRL,U_NROAUTOR,U_ESTADOFC,U_NRO_FAC,U_GPOS_SalesPointCode,U_GPOS_Serial,U_GPOS_Type,DocumentLines,SalesPerson/SalesEmployeeCode,SalesPerson/SalesEmployeeName,SalesPerson/EmployeeID',
        '$expand': 'SalesPerson'
      }
    })

    return data
  },
  async print_invoice ({ DocEntry }, ctx) {
    // TODO: only select required fields
    const { data: Invoice } = await sap.get(`Invoices(${DocEntry})`, {
      params: {
        '$select': 'DocDate,DocTime,DocTotal,PaymentGroupCode,U_GPOS_Type,U_GPOS_Serial,U_GPOS_SalesPointCode,U_GPOS_TaxSeriesCode,DocumentLines,U_FECHALIM,U_EXENTO,U_NRO_FAC,U_NROAUTOR,U_CODCTRL,U_NIT,U_RAZSOC',
        '$expand': 'SalesPerson'
      }
    })

    const { data: TaxSerie } = await sap.get(`U_LB_CDC_DOS('${Invoice.U_GPOS_TaxSeriesCode}')`, {
      params: {
        '$select': 'U_ACTIVIDAD,U_LEYENDA,U_DIRECCION,U_CIUDAD,U_PAIS,U_SUCURSAL'
      }
    }) 

    return {
      ...TaxSerie,
      ...Invoice
    }
  }
}
