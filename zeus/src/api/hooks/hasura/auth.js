const express = require('express')
const app = express()

const { parseSession } = require('utils/session')
const { ForbiddenError } = require('utils/errors')


app.get('/', function (req, res, next) {
  function safe (f, ...args) {
    try {
      return f(...args)
    } catch {
      return null
    }
  }
  // invalid JWT behaves the same as no JWT
  const session = safe(parseSession, req)

  const grants = {
    Now: new Date().toISOString()
  }

  if (session) {
    const role = req.get('X-HASURA-ROLE')

    if (!role) {
      grants['ROLE'] = 'user'
    } else if (session.Roles.includes(role)) {
      grants['ROLE'] = role
    } else {
      console.log(session)
      throw new ForbiddenError(`Unauthorized role ${role}`)
    }

    grants['User-Id'] = session.user_id
  } else {
    grants['ROLE'] = 'anonymous'
  }

  res.status(200).json(Object.keys(grants).reduce((obj, key) => {
    obj[`X-Hasura-${key}`] = grants[key]
    return obj
  }, {}))
})

module.exports = app
