const { requireSession } = require('../../../utils/session')

module.exports = {
  async quick_sale ({ Data, Test }, { req, sap }) {
    // TODO: validate roles
    const session = requireSession(req)

    Data.SalesPersonCode = session.SalesPerson.SalesPersonCode

    const payload = {
      Operation: 'QUICKSALE',
      Test,
      Data
    }

    const path = `script/${process.env.NODE_ENV === 'development' ? 'test' : 'Guembe'}/GPos`
    const { data } = await sap.serviceLayer.post(path, payload)

    return data
  }
}
