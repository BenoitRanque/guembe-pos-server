const { requireSession } = require('utils/session')
const { BadRequestError } = require('utils/errors')
const { client: sap } = require('utils/sap')

module.exports = {
  async quick_sale ({ Data, Test }, { req }) {
    // TODO: validate roles
    const session = requireSession(req)

    Data.SalesPointCode = session.SalesPointCode
    Data.SalesPersonCode = session.SalesEmployeeCode

    const payload = {
      Operation: 'QUICKSALE',
      Test,
      Data
    }

    const { data } = await sap.post('/script/test/guembe', payload)

    return data
  }
}
