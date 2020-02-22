const { buildSchema } = require('graphql')

// Construct a schema, using GraphQL schema language
const schema = buildSchema(/* GraphQL */`
  scalar Date
  scalar Time
  scalar json
  scalar DocEntry
  scalar DocNum

  type Employee {
    EmployeeID: Int!
    SalesEmployeeCode: Int
    SalesEmployeeName: String
  }

  type Session {
    EmployeeID: Int!
    SalesEmployeeCode: Int!
    SalesEmployeeName: String
    Roles: [String!]!
  }

  type Auth {
    token: String!
    session: Session!
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
    PriceAfterVAT: Float!
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
  
  # input SalesOrderOpenInput {
  #   CardCode: String!
  #   IsCredit: Boolean
  #   IsOpen: Boolean
  #   Items: [ItemInput!]!
  # }
  # input SalesOrderUpdateInput {
  #   CardCode: String
  #   IsCredit: Boolean
  #   IsOpen: Boolean
  #   Items: [ItemInput!]
  # }
  # input OrderItemInput {
  #   ItemCode: String!
  #   Quantity: Int!
  #   PriceList: Int!
  #   BaseRef: DocNum!
  #   BaseEntry: DocEntry!
  #   BaseLine: Int!
  # }
  # input SalesOrderChargeInput {
  #   CardCode: String!
  #   Items: [OrderItemInput!]!
  #   Invoice: InvoiceSplitInput
  #   Invoices: [InvoiceSplitInput!]
  #   IsCredit: Boolean
  #   Payment: PaymentInput
  # }
  # input InvoiceSingleInput {
  #   PaymentGroupCode: Int!
  #   U_NIT: String!
  #   U_RAZSOC: String!
  # }
  # input InvoiceSplitInput {
  #   PaymentGroupCode: Int!
  #   U_NIT: String!
  #   U_RAZSOC: String!
  #   ItemDistribution: [ItemDistributionInput!]!
  # }
  # input ItemDistributionInput {
  #   ItemIndex: Int!
  #   Quantity: Int!
  #   PriceAfVAT: Float!
  # }

  type Order {
    Printer: String!
    DocDate: Date!
    SalesPersonCode: Int!
    U_GPOS_Serial: Int!
    U_GPOS_SalesPointCode: String!
    Items: [OrderItem!]!
  }
  type OrderItem {
    ItemCode: String!
    ItemName: String!
    Quantity: Int!
  }

  type Invoice {
    DocDate: Date!
    DocTime: String!
    DocTotal: Float!
    PaymentGroupCode: Int!
    U_GPOS_Type: Int!
    U_GPOS_Serial: Int!
    U_GPOS_SalesPointCode: String!
    Items: [InvoiceItem!]!
    U_FECHALIM: Date
    U_EXENTO: Float
    U_ACTIVIDAD: String
    U_LEYENDA: String
    U_DIRECCION: String
    U_CIUDAD: String
    U_PAIS: String
    U_SUCURSAL: String
    U_NRO_FAC: Int
    U_NROAUTOR: String
    U_CODCTRL: String
    U_NIT: String
    U_RAZSOC: String
  }

  type InvoiceItem {
    ItemCode: String!
    ItemName: String!
    Quantity: Int!
    PriceAfterVAT: Float!
  }

  type SalePrint {
    Orders: [Order!]
    Invoices: [Invoice!]
  }

  type QuickSale {
    Test: Boolean!
    Print: SalePrint 
  }

  type Mutation {
    # rapid_sale: json
    quick_sale (Data: QuickSaleInput! Test: Boolean!): QuickSale
    # sales_order_open (Order: SalesOrderOpenInput!): json
    # sales_order_update (OrderID: DocEntry! Order:  SalesOrderUpdateInput!): json
    # sales_order_close (OrderID: DocEntry!): json
    # sales_order_reopen (OrderID: DocEntry!): json
    # sales_order_charge (OrderID: DocEntry! Sale: SalesOrderChargeInput!): json
    # create_sale: json
    # create_order(order: OrderInput): Order!
    password_change (Credentials: CredentialsInput! NewPassword: String!): Boolean
    password_reset (SAPB1Credentials: SAPB1CredentialsInput! EmployeeID: Int! NewPassword: String): Boolean
  }

  type Item {
    ItemCode: String!
    ItemName: String!
    AllowManualPrice: Boolean!
    AllowCredit: Boolean!
    AllowAffiliate: Boolean!
    ItemPrices: [ItemPrice!]!
    Tags: [String!]!
    # ItemWarehouseInfoCollection: [ItemwareHouse!]!
  }

  type ItemPrice {
    PriceList: Int!
    Price: Float
  }

  type CreditCard {
    CreditCardCode: Int!
    CreditCardName: String!
    GLAccount: String!
  }

  type PriceList {
    PriceListNo: Int!
    PriceListName: String!
  }

  type BusinessPartner {
    CardCode: String!
    CardName: String!
    CardForeignName: String!
    FederalTaxID: String!
    PayTermsGrpCode: Int!
    Affiliate: Boolean!
    VatLiable: Boolean!
    PriceListNum: Int!
    PriceList: PriceList!
  }

  type BusinessPartnerPagination {
    count: Int!
    items: [BusinessPartner!]!
  }

  type SalesPoint {
    Code: String!
    Name: String!
    Catalog: [Item!]!
  }

  type SalesPagination {
    count: Int!
    items: [Sale!]!
  }

  type Sale {
    DocEntry: Int!
    DocNum: Int!
    DocDate: Date!
    DocTime: String!
    DocTotal: Float!
    SalesPersonCode: Int
    U_GPOS_Type: Int!
    U_GPOS_Serial: Int!
    U_GPOS_SalesPointCode: String!
    DocumentLines: [SaleItem!]!
  }

  type SaleItem {
    LineNum: Int!
    ItemCode: String!
    ItemDescription: String!
    Quantity: Int!
    PriceAfterVAT: Float!
  }

  type Query {
    session_employees(top: Int skip: Int): [Employee!]!
    session_login (Credentials: CredentialsInput!): Auth!
    session_logout: Boolean!
    session_refresh: Auth!
    creditcard (CreditCardCode: Int!): CreditCard!
    creditcards: [CreditCard!]!
    pricelist (PriceListNo: Int!): PriceList!
    pricelists: [PriceList!]!
    business_partner (CardCode: String!): BusinessPartner!
    business_partners (search: String offset: Int limit: Int): BusinessPartnerPagination!
    salespoint (Code: String!): SalesPoint!
    sales (top: Int skip: Int): SalesPagination!
    sale (DocEntry: Int!): Sale!
  }
`)

module.exports = schema
