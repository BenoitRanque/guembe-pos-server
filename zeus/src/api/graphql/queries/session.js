const {
  refreshCookieOptions,
  authenticateEmployee,
  getEmployeeRoles,
  encodeRefreshToken,
  encodeAuthToken,
  decodeToken
} = require('utils/session')
const { client: sap } = require('utils/sap')

module.exports = {
  async session_employees ({ top = null, skip = 0 }, ctx) {
    const params = {
      '$expand': `SalesPerson`,
      '$select': `EmployeeID,SalesPerson/SalesEmployeeCode,SalesPerson/SalesEmployeeName`,
      '$filter': `Active eq 'tYES' and not U_GPOS_Password eq null and not SalesPersonCode eq null`,
      '$orderby': `LastName asc`
    }
    
    const headers = {}
    
    if (top === null) {
      headers['Prefer'] = 'odata.maxpagesize=0' 
    } else {
      params['$top'] = top
      params['$skip'] = skip
    }
    
    const { data: { value: employees } } = await sap.get('/EmployeesInfo', {
      params,
      headers
    })

    return employees.map(employee => ({
      ...employee,
      ...employee.SalesPerson
    }))
  },
  async session_login ({ Credentials: { EmployeeID = null, Password = '' } }, { res }) {  
    const employee = await authenticateEmployee({ EmployeeID, Password })
    
    const session = {
      ...employee,
      Roles: await getEmployeeRoles({ EmployeeID })
    }

    res.cookie('refresh-token', encodeRefreshToken(employee), refreshCookieOptions)

    return {
      session,
      token: encodeAuthToken(session)
    }
  },
  async session_logout (args, { res }) {
    res.clearCookie('refresh-token')
    return true
  },
  async session_refresh (args, { req, res }) {
    const token = req.cookies['refresh-token']

    if (!token) {
      throw new Error('No refresh token')
    }

    const employee = await decodeToken(token)

    const session = {
      ...employee,
      Roles: await getEmployeeRoles(employee)
    }

    res.cookie('refresh-token', encodeRefreshToken(employee), refreshCookieOptions)

    return {
      session,
      token: encodeAuthToken(session)
    }
  }
}
