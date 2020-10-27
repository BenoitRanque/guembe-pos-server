const {
  refreshCookieOptions,
  authenticateEmployee,
  encodeRefreshToken,
  encodeAuthToken,
  decodeToken
} = require('../../../utils/session')
const {
  getEmployeeRoles,
  getEmployeeFromSalesPersonCode
} = require('../../../utils/employee')

module.exports = {
  async session_login ({ Credentials: { EmployeeID = null, Password = '' } }, { res, sap }) {  
    const Employee = await authenticateEmployee({ EmployeeID, Password }, sap)
    
    res.cookie('refresh-token', encodeRefreshToken(Employee), refreshCookieOptions)

    return {
      Token: encodeAuthToken(Employee),
      Employee: {
        ...Employee,
        SalesPerson: {
          ...Employee.SalesPerson,
          Employee: () => getEmployeeFromSalesPersonCode(Employee.SalesPerson.SalesPersonCode, sap)
        },
        Roles: () => getEmployeeRoles(Employee.EmployeeID, sap)
      }
    }
  },
  async session_logout (args, { res }) {
    res.clearCookie('refresh-token')
    return true
  },
  async session_refresh (args, { req, res, sap }) {
    const token = req.cookies['refresh-token']

    if (!token) {
      throw new Error('No refresh token')
    }

    const Employee = await decodeToken(token)

    res.cookie('refresh-token', encodeRefreshToken(Employee), refreshCookieOptions)

    return {
      Token: encodeAuthToken(Employee),
      Employee: {
        ...Employee,
        SalesPerson: {
          ...Employee.SalesPerson,
          Employee: () => getEmployeeFromSalesPersonCode(Employee.SalesPerson.SalesPersonCode, sap)
        },
        Roles: () => getEmployeeRoles(Employee.EmployeeID, sap)
      }
    }
  }
}

