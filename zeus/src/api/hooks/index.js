const express = require('express')

const app = express()

app.use('/hasura', require('./hasura'))

module.exports = app
