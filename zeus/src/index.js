const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const port = 8080

const app = express()

app.use(cors({
  origin: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: true
}))

app.use(cookieParser())

app.use('/graphql', require('./api/graphql'))

app.listen({ port }, () => {
  console.log(`Server listening on port ${port}`)
})

// const { handleQuery } = require('./utils/sapHana');

// (async function () {
//   try {
//     const result = await handleQuery(client => client.execute(/*sql*/`SELECT T0."CompnyName" FROM OADM T0 WHERE T0."CompnyName" LIKE ?`, ['%GUEMBE%']))
//     console.log(result)
// } catch (error) {
//   console.error(error)
// }
// })()
    // const await query(async client => {
    //   const result = await client.execute(/*sql*/`
    //     SELECT T0."CompnyName" FROM OADM T0 WHERE T0."CompnyName" = ?;
    //   `, ["GUEMBE PRUEBAS' OR ''='"])
    //   // `, ["' OR 1=1--"])
    //   // SELECT T0."Rate" FROM ORTT T0
    //   // WHERE T0."Currency" = 'USD'
    //   // AND T0."RateDate" = '2020-03-09';
    //   console.log(result)

    //   // const [{ Rate }] = await getChangeRate.execute(['2020-03-09'])

    //   // console.log('rate', await getChangeRate.then(s => s.execute(['2020-03-09'])))

    //   // const stmt = await client.prepare(/*sql*/`
    //   //   SELECT T0."CompnyName" FROM OADM T0
    //   // `)
    //   // const result2 = await stmt.functionCode()
    //   // const result =  await client.exec(/*sql*/`
    //   //   SELECT T0."CompnyName" FROM OADM T0
    //   // `)
    //   // console.log(result, result2)
    //   // SELECT T0."ItemCode", T0."ItemName"
    //   // FROM "BD_GUEMBE_PRUEBAS"."OITM"
    //   // T0 LIMIT 10 OFFSET 100
    // })


// const hanaClient = require('@sap/hana-client')

// const connection = hanaClient.createConnection();

// const connectionParams = {
//     host : "srvsaph1",
//     // port : 39013,
//     port : 30015,
//     uid  : "SYSTEM",
//     pwd  : "/*HSap_01*/",
//     databaseName : "NDB"
// }

// connection.connect(connectionParams, (err) => {
//     if (err) {
//         return console.error("Connection error", err);
//     }

//     const sql = 'SELECT T0."ItemCode", T0."ItemName" FROM "BD_GUEMBE_PRUEBAS"."OITM" T0 LIMIT 100'

//     // const whereClause = process.argv[2] ? `WHERE "group" = '${process.argv[2]}'` : "";
//     // const sql         = `SELECT "name" FROM food_collection ${whereClause}`;

//     connection.exec(sql, (err, rows) => {
//         connection.disconnect();

//         if (err) {
//             return console.error('SQL execute error:', err);
//         }

//         console.log("Results:", rows);
//         console.log(`Query '${sql}' returned ${rows.length} items`);
//     });
// });