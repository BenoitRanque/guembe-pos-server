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