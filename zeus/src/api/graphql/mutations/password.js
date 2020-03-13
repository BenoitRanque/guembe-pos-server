const bcrypt = require('bcryptjs')
const { authenticateEmployee } = require('../../../utils/session')
const { ServiceLayerClient } = require('../../../utils/sap/ServiceLayer')
module.exports = {
  async password_change ({ Credentials: { EmployeeID = null, Password = '' }, NewPassword }, { sap }) {
    await authenticateEmployee({ EmployeeID, Password }, sap)
    
    await sap.serviceLayer.patch(`/EmployeesInfo(${EmployeeID})`, {
      U_GPOS_Password: await bcrypt.hash(NewPassword, 12)
    })

    return true
  },
  async password_reset ({ SAPB1Credentials, EmployeeID, NewPassword }, ctx) {

    const serviceLayer = new ServiceLayerClient({
      credentials: {
        ...ServiceLayerClient.defaultCredentials,
        UserName: SAPB1Credentials.UserName,
        Password: SAPB1Credentials.Password
      }
    })

    await serviceLayer.patch(`/EmployeesInfo(${EmployeeID})`, {
      U_GPOS_Password: await bcrypt.hash(NewPassword, 12)
    })

    return true
  }
}