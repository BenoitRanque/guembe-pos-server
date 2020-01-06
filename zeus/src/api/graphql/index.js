const express = require('express')
const graphqlHTTP = require('express-graphql')

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
  context: { req, res, graphQLParams }
})))

module.exports = app
