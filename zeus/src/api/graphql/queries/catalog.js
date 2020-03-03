const { client: sap } = require('utils/sap')

module.exports = {
  async catalog ({ SalesPointCode }) {

    const path = `script/${process.env.NODE_ENV === 'development' ? 'test' : 'Guembe'}/GPos('${SalesPointCode}')`
    const { data: { Catalog } } = await sap.get(path)

    return Catalog
  },
  async salespoints ({ limit = null, offset = 0 }, ctx) {
    const params = {
      '$orderby': `Name asc`
    }

    const headers = {
      Prefer: 'odata.maxpagesize=0' 
    }

    if (limit !== null) {
      params['$top'] = limit
      params['$skip'] = offset
    }

    const { data: { value: salespoints } } = await sap.get('/GPosSalesPoint', {
      params,
      headers
    })

    return salespoints.map(salespoint => ({
      Code: salespoint.Code,
      Name: salespoint.Name
    }))
  },
  async salespoint ({ Code }, ctx) {
    const { data: salespoint } = await sap.get(`/GPosSalesPoint('${Code}')`)

    return {
      Code: salespoint.Code,
      Name: salespoint.Name
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