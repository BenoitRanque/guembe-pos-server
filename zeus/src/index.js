const express = require('express')
const corser = require('corser')
const cookieParser = require('cookie-parser')

const port = 8080

const app = express()

app.use(corser.create({
  origins: ['http://192.168.0.202:8080', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
  requestHeaders: corser.simpleRequestHeaders.concat(['Authorization', 'X-Hasura-Role']),
  responseHeaders: corser.simpleResponseHeaders.concat(['']),
  supportsCredentials: true
}))

app.use(cookieParser())

app.use('/graphql', require('./api/graphql'))
app.use('/hooks', require('./api/hooks'))

app.listen({ port }, () => {
  console.log(`Server listening on port ${port}`)
})