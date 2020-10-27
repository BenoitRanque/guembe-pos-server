const { getEmployeeRoles } = require('../../../utils/employee')
const { requireSession } = require('../../../utils/session')
const { ForbiddenError } = require('../../../utils/errors')

async function handleRequest ({ Operation, Roles, Data, Test, req, sap }) {
    // TODO: validate roles
    const session = requireSession(req)
    const EmployeeRoles = await getEmployeeRoles(session.EmployeeID, sap)

    if (!EmployeeRoles.some(employeeRole => Roles.includes(employeeRole))) {
      throw new ForbiddenError(`Empleado '${session.SalesPerson.SalesPersonName}' no tiene roles suficientes para esta operacion. Roles disponibles: ${EmployeeRoles.join(', ')}. Roles requeridos: ${Roles.join(', ')}`)
    }

    Data.SalesPersonCode = session.SalesPerson.SalesPersonCode

    const payload = {
      Operation,
      Test,
      Data
    }

    const path = `script/${process.env.NODE_ENV === 'development' ? 'test' : 'Guembe'}/GPos`
    const { data } = await sap.serviceLayer.post(path, payload)

    return data
}

module.exports = {
  async quick_sale ({ Data, Test }, { req, sap }) {
    return await handleRequest({ Operation: 'QUICKSALE', Roles: ['cajeros'], Data, Test, req, sap })
  },
  async table_create ({ Data, Test }, { req, sap }) {
    return await handleRequest({ Operation: 'TABLE_CREATE', Roles: ['meseros'], Data, Test, req, sap })
  },
  async table_update ({ Data, Test }, { req, sap }) {
    return await handleRequest({ Operation: 'TABLE_UPDATE', Roles: ['meseros'], Data, Test, req, sap })
  },
  async table_close ({ Data, Test }, { req, sap }) {
    return await handleRequest({ Operation: 'TABLE_CLOSE', Roles: ['meseros'], Data, Test, req, sap })    
  },
  async table_reopen ({ Data, Test }, { req, sap }) {
    return await handleRequest({ Operation: 'TABLE_REOPEN', Roles: ['cajeros'], Data, Test, req, sap })    
  },
  async table_checkout ({ Data, Test }, { req, sap }) {
    return await handleRequest({ Operation: 'TABLE_CHECKOUT', Roles: ['cajeros',], Data, Test, req, sap })    
  },
  async table_cancel ({ Data, Test }, { req, sap }) {
    return await handleRequest({ Operation: 'TABLE_CANCEL', Roles: ['administrador'], Data, Test, req, sap })    
  }
}
