const { client: sap } = require('utils/sap')

module.exports = {
  // TODO!
  async invoices ({ limit = 20, offset = 0, SalesPersonCode = null, SalesPointCode = null, FromDate, ToDate }, ctx) {
    const { data: { ['odata.count']: count, value: items }  } = await sap.get(`Invoices`, {
      headers: {
        'Prefer': 'odata.maxpagesize=0',
      },
      params: {
        // '$select': 'CardCode,CardName,GroupCode,CardForeignName,FederalTaxID,PayTermsGrpCode,PriceListNum,PriceList/PriceListNo,PriceList/PriceListName,VatLiable,Affiliate',
        '$expand': 'SalesPerson',
        '$filter': [
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
    const { data } = await sap.get(`Invoices(${DocEntry})`, {
      params: {
        '$expand': 'SalesPerson'
      }
    })

    return data
  }
}
