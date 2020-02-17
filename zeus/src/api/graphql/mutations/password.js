const bcrypt = require('bcryptjs')
const axios = require('axios')
const { sapCredentials, clientOptions, getCookieHeader, getSAPSessionCookies, client: sap } = require('utils/sap')
const { authenticateEmployee } = require('utils/session')

module.exports = {
  async password_change ({ Credentials: { EmployeeID = null, Password = '' }, NewPassword }) {
    await authenticateEmployee({ EmployeeID, Password })
    
    await sap.patch(`/EmployeesInfo(${EmployeeID})`, {
      U_GPOS_Password: await bcrypt.hash(NewPassword, 12)
    })

    return true
  },
  async password_reset ({ SAPB1Credentials, EmployeeID, NewPassword }) {
    const cookies = await getSAPSessionCookies({
      CompanyDB: sapCredentials.CompanyDB,
      UserName: SAPB1Credentials.UserName,
      Password: SAPB1Credentials.Password
    })

    await axios.create(clientOptions).patch(`/EmployeesInfo(${EmployeeID})`, {
      U_GPOS_Password: await bcrypt.hash(NewPassword, 12)
    }, {
      headers: {
        'Cookie': getCookieHeader(cookies)
      }
    })

    return true
  }
}