const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
// const { client: sap } = require('./sap/ServiceLayer')
const { UnauthorizedError } = require('./errors')
const { getEmployeeFromSalesPersonCode } = require('./employee')

const ONE_MONTH = 30 * 24 * 60 * 60 * 1000
const refreshCookieOptions = {
  httpOnly: true,
  maxAge: ONE_MONTH
}
const ROLE_WHITELIST = [
  'administrador',
  'meseros',
  'cajeros'
]

async function authenticateEmployee ({ EmployeeID, Password }, sap) {
  const hana = await sap.hana

  const [ employee ] = await hana.execute(/*sql*/`
    SELECT
      T0."empID" AS "EmployeeID",
      T1."SlpCode" AS "SalesPersonCode",
      T1."SlpName" AS "SalesPersonName",
      T0."U_GPOS_Password" AS "Password"
    FROM OHEM T0
    INNER JOIN OSLP T1 ON T1."SlpCode" = T0."salesPrson" AND T1."SlpCode" > 1
    WHERE T0."empID" = ?
    AND T0."Active" = 'Y'
    AND T1."Active" = 'Y'
    LIMIT 1 
  `, [
    EmployeeID
  ])

  if (!employee) {
    throw new Error(`Empleado no encontrado, inactivo, o no tiene empleado de venta valido`)
  }

  if (!employee.Password) {
    throw new Error(`Para poder inciar session primero establesca contraseña para el usuario ${EmployeeID}`)
  }

  const valid = await bcrypt.compare(Password, employee.Password)
  if (valid) {
    const { EmployeeID, SalesPersonCode, SalesPersonName } = employee
    return {
      EmployeeID,
      SalesPerson: {
        SalesPersonCode,
        SalesPersonName
      }
    }
  }

  throw new Error('Error de Autenticación')
}
async function getEmployeeRoles ({ EmployeeID }) {
  const { data: { EmployeeRolesInfoLines: employeeRoles } } = await sap.get(`/EmployeesInfo(${EmployeeID})/EmployeeRolesInfoLines`)
  const { data: { value: roles } } = await sap.get('/EmployeeRolesSetup')

  const Roles = roles
    .filter(({ TypeID, Name }) => employeeRoles.some(({ RoleID }) => RoleID === TypeID))
    .map(({ Name }) => Name.toLowerCase())
    .filter(role => ROLE_WHITELIST.includes(role))

  return Roles
}
function encodeRefreshToken(payload) {
  return jwt.sign({ ses: payload }, process.env.AUTH_JWT_SECRET, { expiresIn: '30 days' })
}
function encodeAuthToken(payload) {
  return jwt.sign({ ses: payload }, process.env.AUTH_JWT_SECRET, { expiresIn: '2 hours' })
}
function decodeToken(token) {
  const { ses } = jwt.verify(token, process.env.AUTH_JWT_SECRET)
  return ses
}
function parseSession (req) {
  const authorization = req.get('Authorization')

  if (authorization) {
    const token = authorization.replace('Bearer ', '')

    return decodeToken(token)
  }

  return null
}
function requireSession(req) {
  const session = parseSession(req)

  if (!session) {
    throw new UnauthorizedError(`Access denied: Session required`)
  }

  return session
}

module.exports = {
  requireSession,
  parseSession,
  refreshCookieOptions,
  authenticateEmployee,
  getEmployeeRoles,
  encodeAuthToken,
  encodeRefreshToken,
  decodeToken
}
