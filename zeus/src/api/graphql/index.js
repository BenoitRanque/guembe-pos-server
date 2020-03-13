const express = require('express')
const graphqlHTTP = require('express-graphql')
const { execute } = require('graphql')
const SAPClient = require('../../utils/sap')

const schema = require('./schema')
const queries = require('./queries')
const mutations = require('./mutations')

const app = express()

app.use(graphqlHTTP((req, res, graphQLParams) => ({
  schema,
  rootValue: {
    ...queries,
    ...mutations
  },
  graphiql: true,
  context: { req, res, graphQLParams, sap: new SAPClient() },
  customExecuteFn: customExecuteFn
})))

// Wrapper for default execute function
// only used to ensure proper conection/deconection to database
async function customExecuteFn ({ contextValue, ...args }) {
  try {   
    return await execute({ contextValue, ...args })
  } finally {
    await contextValue.sap.disconnect()
  }
}

module.exports = app
