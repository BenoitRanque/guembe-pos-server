const { requireSession } = require('utils/session')
const { BadRequestError } = require('utils/errors')
const { client: sap } = require('utils/sap')

module.exports = {
  async quick_sale ({ Data, Test }, { req }) {
    // TODO: validate roles
    const session = requireSession(req)

    Data.SalesPersonCode = session.SalesEmployeeCode

    const payload = {
      Operation: 'QUICKSALE',
      Test,
      Data
    }

    const path = process.env.NODE_ENV === 'development' ? 'script/test/guembe' : '/script/Guembe/GPos'
    const { data } = await sap.post(path, payload)

    return data
  }
}
