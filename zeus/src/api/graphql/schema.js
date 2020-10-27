const { buildSchema } = require('graphql')

// Construct a schema, using GraphQL schema language
const schema = buildSchema(/* GraphQL */`
  scalar Date

  type Session {
    Token: String!
    Employee: Employee!
  }
  input CredentialsInput {
    EmployeeID: Int!
    Password: String!
  }
  input SAPB1CredentialsInput {
    UserName: String!
    Password: String!
  }
  input ItemInput {
    ItemCode: String!
    Quantity: Int!
    Price: Float!
  }
  input PaymentInput {
    CashSum: Float!
    PaymentCreditCards: [PaymentCreditCardInput!]
  }
  input PaymentCreditCardInput {
    CreditSum: Float!
    CreditCard: Int!
    CreditCardNumber: String!
    CardValidUntil: Date!
    VoucherNum: String!
    OwnerIdNum: String
    OwnerPhone: String
  }
  input InvoiceInput {
    PaymentGroupCode: Int!
    Payment: PaymentInput
    U_NIT: String!
    U_RAZSOC: String!
  }
  input QuickSaleInput {
    SalesPointCode: String!
    CardCode: String!
    Items: [ItemInput!]!
    Invoice: InvoiceInput!
  }

  input TableCreateInput {
    SalesPointCode: String!,
    CardCode: String!
    Items: [ItemInput!]!
    Close: Boolean
  }
  input TableUpdateInput {
    SalesPointCode: String!,
    CardCode: String!
    Items: [ItemInput!]!
    PurchaseOrderDocEntry: Int!
    Close: Boolean
  }
  input TableCloseInput {
    SalesPointCode: String!,
    CardCode: String!
    PurchaseOrderDocEntry: Int!
  }
  input TableReopenInput {
    SalesPointCode: String!,
    CardCode: String!
    PurchaseOrderDocEntry: Int!
  }
  input TableCheckoutInput {
    SalesPointCode: String!,
    CardCode: String!
    Invoice: InvoiceInput!
    PurchaseOrderDocEntry: Int!
  }
  input TableCancelInput {
    SalesPointCode: String!,
    CardCode: String!
    PurchaseOrderDocEntry: Int!
  }

  type QuickSale {
    Test: Boolean!
    Print: SalePrint 
    SalesOrder: SalesOrder!
    Invoices: [Invoice!]!
  }

  type TableCreate {
    Test: Boolean!
    Print: SalePrint
  }
  type TableUpdate {
    Test: Boolean!
    Print: SalePrint
  }
  type TableClose {
    Test: Boolean!
  }
  type TableReopen {
    Test: Boolean!
  }
  type TableCheckout {
    Test: Boolean!
    Print: SalePrint
  }
  type TableCancel {
    Test: Boolean!
  }
  
  type SalePrint {
    Orders: [PrintOrder!]
    Invoices: [Invoice!]
  }
  type PrintOrder {
    Printer: String!
    DocDate: Date!
    SalesPersonCode: Int!
    U_GPOS_Serial: Int!
    U_GPOS_SalesPointCode: String!
    DocumentLines: [ItemLine!]!
  }
  type ItemLine {
    ItemCode: String!
    ItemDescription: String!
    Quantity: Int!
    Price: Float!
    SalesPerson: SalesPerson
  }
  type TaxSerie {
    U_ACTIVIDAD: String!
    U_LEYENDA: String!
    U_DIRECCION: String!
    U_CIUDAD: String!
    U_PAIS: String!
    U_SUCURSAL: String!
  }
  type SalesOrderPagination {
    totalItems: Int!
    pageItems: [SalesOrder!]!
  }
  type SalesOrder {
    Type: SalesOrderTypeEnum
    DocEntry: Int!
    DocNum: Int!
    DocDate: Date!
    DocTime: String!
    CardCode: String!
    CardName: String!
    Cancelled: Boolean!
    DocTotal: Float
    Comments: String
    JournalMemo: String
    DocumentLines: [ItemLine!]!
    SalesPoint: SalesPoint
    SalesPerson: SalesPerson
    U_GPOS_SalesPointCode: String
    U_GPOS_Serial: Int
    U_GPOS_Type: Int
  }
  enum SalesOrderTypeEnum {
    QUICKSALE
    TABLE_OPEN
    TABLE_CLOSED
    TABLE_INVOICED
    TABLE_CANCELLED
  }
  type InvoicePagination {
    totalItems: Int!
    pageItems: [Invoice!]!
  }
  type Invoice {
    DocEntry: Int!
    DocNum: Int!
    DocDate: Date!
    DocTime: String!
    CardCode: String!
    CardName: String!
    Cancelled: Boolean!
    NumAtCard: String
    DocTotal: Float
    Comments: String
    JournalMemo: String
    PaymentGroupCode: Int!
    U_TIPODOC: Int
    U_NIT: String
    U_RAZSOC: String
    U_CCFACANU: String
    U_CODCTRL: String
    U_NROAUTOR: String
    U_ESTADOFC: String
    U_NRO_FAC: String
    U_FECHALIM: Date
    U_EXENTO: Float
    U_GPOS_SalesPointCode: String
    U_GPOS_Serial: Int
    U_GPOS_Type: Int
    U_GPOS_TaxSeriesCode: String
    DocumentLines: [ItemLine!]!
    SalesPoint: SalesPoint
    SalesPerson: SalesPerson
    TaxSerie: TaxSerie
  }
  type EmployeePagination {
    totalItems: Int!
    pageItems: [Employee!]!
  }
  type Employee {
    EmployeeID: Int!
    SalesPerson: SalesPerson
    Roles: [String!]!
  }
  type SalesPerson {
    SalesPersonCode: Int!
    SalesPersonName: String
    Employee: Employee
  }
  type CreditCardPagination {
    totalItems: Int!
    pageItems: [CreditCard!]!
  }
  type CreditCard {
    CreditCard: Int!
    CardName: String!
  }
  type BusinessPartnerPagination {
    totalItems: Int!
    pageItems: [BusinessPartner!]!
  }
  type BusinessPartner {
    CardCode: String!
    CardName: String!
    CardForeignName: String!
    FederalTaxID: String!
    PayTermsGrpCode: Int!
    Affiliate: Boolean!
    VatLiable: Boolean!
    PrimaryPriceList: Int!
    PrimaryPriceListName: String!
    SecondaryPriceList: Int!
    SecondaryPriceListName: String!
  }
  enum BusinessPartnerCodeTypeEnum {
    CardCode
    FederalTaxID
  }
  type SalesPointPagination {
    totalItems: Int!
    pageItems: [SalesPoint!]!
  }
  type SalesPoint {
    Code: String!
    Name: String!
  }
  type ItemPagination {
    totalItems: Int!
    pageItems: [Item!]!
  }
  type Item {
    ItemCode: String!
    ItemName: String!
    AllowManualPrice: Boolean!
    AllowCredit: Boolean!
    AllowAffiliate: Boolean!
    PrimaryPrice: Float
    SecondaryPrice: Float
    Stock: Float
  }
  enum ItemCodeTypeEnum {
    ItemCode
    BarCode
  }

  type Query {
    session_login (Credentials: CredentialsInput!): Session!
    session_logout: Boolean!
    session_refresh: Session!
    sales_orders (Type: [SalesOrderTypeEnum!] limit: Int offset: Int SalesPointCode: String SalesPersonCode: Int FromDate: Date! ToDate: Date): SalesOrderPagination
    sales_order (DocEntry: Int!): SalesOrder!
    invoices (limit: Int offset: Int filter: String SalesPointCode: String SalesPersonCode: Int FromDate: Date! ToDate: Date): InvoicePagination
    invoice (DocEntry: Int!): Invoice!
    employees (limit: Int offset: Int showUnset: Boolean): EmployeePagination!
    employee (EmployeeID: Int!): Employee
    creditcards (limit: Int offset: Int): CreditCardPagination!
    creditcard (CreditCard: Int!): CreditCard
    changerate: Float
    salespoints (limit: Int offset: Int): SalesPointPagination!
    salespoint (Code: String!): SalesPoint
    business_partners (limit: Int offset: Int filter: String): BusinessPartnerPagination!
    business_partner (Code: String CodeType: BusinessPartnerCodeTypeEnum): BusinessPartner
    items (limit: Int offset: Int filter: String SalesPointCode: String! PrimaryPriceList: Int SecondaryPriceList: Int): ItemPagination!
    item (Code: String! CodeType: ItemCodeTypeEnum SalesPointCode: String! PrimaryPriceList: Int SecondaryPriceList: Int): Item
  }

  type Mutation {
    quick_sale (Data: QuickSaleInput! Test: Boolean!): QuickSale
    table_create (Data: TableCreateInput! Test: Boolean!): TableCreate
    table_update (Data: TableUpdateInput! Test: Boolean!): TableUpdate
    table_close (Data: TableCloseInput! Test: Boolean!): TableClose
    table_reopen (Data: TableReopenInput! Test: Boolean!): TableReopen
    table_checkout (Data: TableCheckoutInput! Test: Boolean!): TableCheckout
    table_cancel (Data: TableCancelInput! Test: Boolean!): TableCancel
    password_change (Credentials: CredentialsInput! NewPassword: String!): Boolean
    password_reset (SAPB1Credentials: SAPB1CredentialsInput! EmployeeID: Int! NewPassword: String): Boolean
  }
`)

module.exports = schema
