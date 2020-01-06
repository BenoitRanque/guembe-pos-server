const { client: sap, formatDate } = require('utils/sap')


    // Notes on Costing Code
    // CostingCode = Rubro = Unidad de negocio
    // CostingCode2 = point of sale
    // derive invoice Codes from order codes (should be automatic)


    // Note: CardCode must be consistent accross all related documents. 
module.exports = {
  async add_items () {
     //626
     
    const SalesPersonCode = 96 // alex

    const payload = {
      U_GMBPOS_Type: 3,
      DocumentLines: [
        {
          SalesPersonCode,
          ItemCode: 'BQ000783',
          Quantity: 1,
          PriceAfterVAT: '3.40',
          WarehouseCode: 'ABQ00002',
          CostingCode: 'Boutique', // derive from Item (rubro)
          CostingCode2: 'Boutiqu' // derive from salespointID
        }
      ]
    }

    const { data } = await sap.patch(`/script/test/guembe(${626})`, payload)

    return data
  },
  async create_sale () {

    // step 1 create order
    // step 2 create invoice(s)
    // step 3 create payment

    const SalesPersonCode = 96 // alex
    const SalesPointID = '201' // las palmas
    // const Type = 1 // Quick sale

    const CardCode = 'CL000001'

    const isCredit = false
    const PaymentGroupCode = isCredit ?  '1' : '-1' // set per invoice. Default to -1 (downpay)

    const payload = {
      SalesPersonCode,
      SalesPointID,
      CardCode,
      PaymentGroupCode,
      Order: {
        U_GMBPOS_Type: 1,
        DocumentLines: [
          {
            ItemCode: 'AB001519',
            Quantity: 2,
            PriceAfterVAT: '40.00',
            WarehouseCode: 'AABBG001',
            CostingCode: 'A&B', // derive from Item (rubro)
            CostingCode2: 'BeerGard' // derive from salespointID
          },
          {
            ItemCode: 'AB001517',
            Quantity: 4,
            PriceAfterVAT: '25.00',
            WarehouseCode: 'AABBG001',
            CostingCode: 'A&B', // derive from Item (rubro)
            CostingCode2: 'BeerGard' // derive from salespointID
          },
          {
            ItemCode: 'BQ000783',
            Quantity: 2,
            PriceAfterVAT: '10.00',
            WarehouseCode: 'ABQ00002',
            CostingCode: 'Boutique', // derive from Item (rubro)
            CostingCode2: 'Boutiqu' // derive from salespointID
          },
          {
            ItemCode: 'BQ000783',
            Quantity: 1,
            PriceAfterVAT: '3.40',
            WarehouseCode: 'ABQ00002',
            CostingCode: 'Boutique', // derive from Item (rubro)
            CostingCode2: 'Boutiqu' // derive from salespointID
          }
        ] 
      },
      DocumentLines: [],
      Invoices: [
        {
          TaxCode: 'IVA',
          IT: true,
          CostingCodes: ['A&B']
        },
        {
          TaxCode: 'IVA',
          IT: true,
          CostingCodes: ['Boutique']
        }
      ],
      // ItemCostingCodes: {
      //   'AB001519': 'A&B',
      //   'AB001517': 'A&B',
      //   'BQ000783': 'Boutique'
      // },
      Payment: {
        CashAccount: '_SYS00000000600',
        CashSum: 53.4,
        PaymentCreditCards: [
          {
             CreditCard: 3,
             CreditAcct: '_SYS00000000138',
             CreditCardNumber: '1633',
             CardValidUntil: '20200401',
             VoucherNum: '1111',
             OwnerIdNum: '8910399',
             OwnerPhone: null,
             CreditSum: 150
          }
       ]
      }
    }

    const { data } = await sap.post('/script/test/guembe', payload)

    return data


    // const payload = {
    //   Header,
    //   Lines,
    //   ItemAreas: {
    //     'Item': 'area'
    //   },
    //   Payment: {
    //     DocDate: Today,
    //     DocDueDate: Today,
    //   }
    //   items
    //   items: [],
    //   documents: {
    //     Order,
    //     Invoice,
    //     IncomingPayment
    //   }
    // }
    // const data = {
    //   U_GMBPOS_SalesPointID: SalesPointID,
    //   DocDate: Today,
    //   DocDueDate: Today,
    //   SalesPersonCode,
    //   CardCode
    // }

    // const OrderDocumentLines = []
    // const OrderDocumentLines = []
    // const invoices = order.DocumentLines.reduce((invoices, item) => {
    //   if (!invoices[itemAreas[item.ItemCode]]) {
    //     invoices[itemAreas[item.ItemCode]] = {
    //       // initial invoiceData
    //       U_GMBPOS_SalesPointID: SalesPointID,
    //       // U_GMBPOS_Type: Type, // maybe add a tyoe here?
    //       DocDate: Today,
    //       DocDueDate: Today,
    //       SalesPersonCode,
    //       CardCode,
    //       DocumentLines: []
    //     }
    //   }
    //   invoices.DocumentLines.push(Object.apply({}, items[index], {
    //     BaseRef: order.DocNum, // add these in SAP
    //     BaseEntry: order.DocEntry, // add these in SAP
    //     BaseType: 17, // BaseType 17 = Order
    //     BaseLine: index
    //   }))
    //   return invoices
    // }, {})
    // const data = {
    //   Items: [
    //     {
    //       ItemArea: 'A', // rubro
    //       ItemData: {
    //         // SalesPersonCode,
    //         ItemCode: 'AB001519',
    //         Quantity: 2,
    //         PriceAfterVAT: '40.00',
    //         WarehouseCode: 'AABBG001',
    //         // ChangeAssemlyBoMWarehouse: 'Y' // whether to apply item warehouse to other items within
    //         CostingCode: 'A&B', // derive from Item (rubro)
    //         CostingCode2: 'RestPalm', // derive from salespointID
    //       }
    //     }
    //   ],
    //   Payment: {

    //   }
    // }

    // const payload = {
    //   order: {
    //     U_GMBPOS_SalesPointID: SalesPointID,
    //     U_GMBPOS_Type: Type,
    //     DocDate: Today,
    //     DocDueDate: Today,
    //     SalesPersonCode,
    //     CardCode: 'CL000001',
    //     // Comments: '', // maybe we could set these
    //     // JournalMemo: '', // maybe we could set these
    //     PaymentGroupCode: '-1', // 1 credito
    //     DocumentLines: [
    //       {
    //         SalesPersonCode,
    //         ItemCode: 'AB001519',
    //         Quantity: 2,
    //         PriceAfterVAT: '40.00',
    //         WarehouseCode: 'AABBG001',
    //         // ChangeAssemlyBoMWarehouse: 'Y' // whether to apply item warehouse to other items within
    //         CostingCode: 'A&B', // derive from Item (rubro)
    //         CostingCode2: 'RestPalm' // derive from salespointID
    //       }
    //     ]
    //   },
    //   invoices: [
    //     {
    //       U_GMBPOS_SalesPointID: SalesPointID,
    //       // U_GMBPOS_Type: Type, // maybe add a tyoe here?
    //       DocDate: Today,
    //       DocDueDate: Today,
    //       SalesPersonCode,
    //       CardCode,
    //       PaymentGroupCode: '-1', // 1 credito
    //       DocumentLines: [
    //         {
    //           SalesPersonCode,
    //           Quantity: 2,
    //           PriceAfterVAT: '40.00',
    //           // BaseRef: '19100008', // add these in SAP
    //           // BaseEntry: 624, // add these in SAP
    //           BaseType: 17,
    //           BaseLine: 0
    //         }
    //       ] 
    //     }
    //   ],
    //   payment: {
    //     CardCode,
    //     CashSum: '40',
    //     CashAccount: _SYS00000000002, // from SalesPointID
    //     // unsure what this is. aparently not required?
    //     // CashFlowAssignments: [
    //     //   {
    //     //     AmountLC: '40',
    //     //     PaymentMeans: 'pmtCash'
    //     //   }
    //     // ],
    //     // PaymentInvoices: [
    //     //   {
    //     //     // DocEntry: // from invoice 
    //     //     SumApplied: '40'
    //     //   }
    //     // ],
    //     PaymentCreditCards: [
    //       {
    //         CreditCard: 3,
    //         CreditAcct: '_SYS00000000138',
    //         CreditCardNumber: '1633',
    //         CardValidUntil: '20200401',
    //         VoucherNum: '1111',
    //         OwnerIdNum: '8910399',
    //         OwnerPhone: null,
    //         CreditSum: '40'
    //       }
    //     ]
    //   }
    // }

  },
  async create_order ({ order }, ctx) {

    // TODO: get from session
    const SalesPersonCode = 96
    const SalesPointID = 201

    const Type = 2

    // const { data } = await sap.post('/script/PosGuembe/Orders', {
    const response = await sap.post('/script/test/guembe', {
      ...order,
      U_GMBPOS_SalesPointID: SalesPointID,
      U_GMBPOS_Type: Type,
      DocDate: formatDate(new Date()),
      DocDueDate: formatDate(new Date()),
      SalesPersonCode,
      DocumentLines: order.DocumentLines.map(line => ({
        ...line,
        SalesPersonCode
      }))
    }, {
      params: {
        operation: 'CREATE_TABLE'
      }
    })
    
    return response.data
  },
  async orders () {
    const params = {
      '$select': [
        'DocEntry',
        'DocNum',
        'CardCode',
        'CardName',
        'DocDate',
        'DocTime',
        'DocDueDate',
        'SalesPersonCode',
        'U_GMBPOS_SalesPointID',
        'U_GMBPOS_Type',
        'U_GMBPOS_Serial',
        'DocumentLines'
      ].join(','),
      '$filter': `(not U_GMBPOS_Serial eq null) and (not U_GMBPOS_SalesPointID eq 0) and (not U_GMBPOS_Type eq 0)`
    }

    const headers = {}

    const { data: { value: orders } } = await sap.get('/Orders', {
      params,
      headers
    })
    return orders
  }
}