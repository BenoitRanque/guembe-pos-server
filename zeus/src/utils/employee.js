const ROLE_WHITELIST = [
  'administrador',
  'meseros',
  'cajeros'
]

async function getSalesPerson (SalesPersonCode, sap) {
  const hana = await sap.hana
  const [ SalesPerson ] = await hana.execute(/*sql*/`
    SELECT
      T0."SlpCode" AS "SalesPersonCode",
      T0."SlpName" AS "SalesPersonName"
    FROM OSLP T0
    WHERE T0."SlpCode" = ?
    LIMIT 1
  `, [ SalesPersonCode ])
  return SalesPerson ? {
    ...SalesPerson,
    Employee: () => getEmployeeFromSalesPersonCode(SalesPerson.SalesPersonCode, sap)
  } : null
}
async function getEmployeeFromEmployeeID (EmployeeID, sap) {
  const hana = await sap.hana
  const [ Employee ] = await hana.execute(/*sql*/`
    SELECT
      T0."empID" AS "EmployeeID",
      T0."salesPrson" AS "SalesPersonCode"
    FROM OHEM T0
    WHERE T0."empID" = ?
    LIMIT 1
  `, [ EmployeeID ])
  return Employee ? {
    ...Employee,
    Roles: () => getEmployeeRoles(Employee.EmployeeID, sap),
    SalesPerson: () => getSalesPerson(Employee.SalesPersonCode, sap)
  } : null
}
async function getEmployeeFromSalesPersonCode (SalesPersonCode, sap) {
  const hana = await sap.hana
  const [ Employee ] = await hana.execute(/*sql*/`
    SELECT 
      T0."empID" AS "EmployeeID",
      T0."salesPrson" AS "SalesPersonCode",
      T0."U_GPOS_Password" AS "Password"
    FROM OHEM T0
    WHERE T0."salesPrson" = ?
    LIMIT 1
  `, [ SalesPersonCode ])
  return Employee ? {
    ...Employee,
    Roles: () => getEmployeeRoles(Employee.EmployeeID, sap),
    SalesPerson: () => getSalesPerson(Employee.SalesPersonCode, sap)
  } : null
}

async function getEmployeeRoles(EmployeeID, sap) {
  const hana = await sap.hana

  const roles = await hana.execute(/*sql*/`
    SELECT T1."name"
    FROM HEM6 T0
    INNER JOIN OHTY T1 ON T1."typeID" = T0."roleID"
    WHERE T0."empID" = ?
  `, [ EmployeeID ])

  return roles
    .map(({ name }) => name.toLowerCase())
    .filter(role => ROLE_WHITELIST.includes(role))
}

module.exports = {
  getEmployeeFromEmployeeID,
  getEmployeeFromSalesPersonCode,
  getSalesPerson,
  getEmployeeRoles
}