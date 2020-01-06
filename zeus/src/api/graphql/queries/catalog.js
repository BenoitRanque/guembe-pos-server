const { client: sap } = require('utils/sap')

async function getItemDetails(ItemCode) {
  try {
    const { data } = await sap.get(`/Items('${ItemCode}')`, {
      params: {
        '$select': 'ItemCode,ItemName,InventoryItem,ItemPrices,ItemWarehouseInfoCollection'
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
  async item_details ({ ItemCode }, ctx) {
    return getItemDetails(ItemCode)
  },
  async items_details ({ ItemCodes }, ctx) {
    return Promise.all(ItemCodes.map(getItemDetails))
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
  async clients ({ search = null, limit = 20, offset = 0 }) {
    const { data: { ['odata.count']: count, value: items }  } = await sap.get(`BusinessPartners`, {
      headers: {
        'Prefer': 'odata.maxpagesize=0',
        'B1S-CaseInsensitive': true
      },
      params: {
        '$select': 'CardCode,CardName,GroupCode,CardForeignName,FederalTaxID,PayTermsGrpCode,PriceListNum,PriceList/PriceListNo,PriceList/PriceListName',
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
      items
    }
  },
  async client ({ CardCode }) {
    const { data } = await sap.get(`BusinessPartners('${CardCode}')`, {
      params: {
        '$select': 'CardCode,CardName,GroupCode,CardForeignName,FederalTaxID,PayTermsGrpCode,PriceListNum,PriceList/PriceListNo,PriceList/PriceListName',
        '$expand': 'PriceList'
      }
    })

    return data
  }
}