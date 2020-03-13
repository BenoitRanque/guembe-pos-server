const axios = require('axios')
const https = require('https')
const createAuthRefreshInterceptor = require('axios-auth-refresh').default

const sapCredentials = {
    CompanyDB: process.env.SAP_B1_COMPANY,
    UserName: process.env.SAP_B1_USERNAME,
    Password: process.env.SAP_B1_PASSWORD
}

const clientOptions = {
  timeout: 1000 * 60 * 5, // 5 minutes
  baseURL: `https://${process.env.SAP_HANA_HOSTNAME}:50000/b1s/v1`,
  headers: {
    'Content-Type': 'application/json'
  },
  httpsAgent: new https.Agent({
    secureProtocol: 'TLSv1_method',
    rejectUnauthorized: false
  }),
  paramsSerializer (params) {
    // axios tries to plus encode spaces, not supported by sap
    return Object.entries(params)
      .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join('&')
  }
}

function readSetCookieHeader (headers) {
    if (!headers['set-cookie']) {
        return {}
    }
    return headers['set-cookie'].reduce((cookies, header) => {
        const [ , name, value ] = header.match(/^([^=]*)=([^;]*)/)
        cookies[name] = value
        return cookies
    }, {})
}

function getCookieHeader (cookies) {
    return Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
}

async function getSAPSessionCookies (sapCredentials) {
    const response = await axios.create(clientOptions).post('/Login', sapCredentials)
    const cookies = readSetCookieHeader(response.headers)
    return cookies
}

const session = {
    cookies: null
}

const client = axios.create(clientOptions)

client.interceptors.request.use(async request => {
    // TODO: if no cookie, login. also how to handle timeout?
    if (!session.cookies) {
        session.cookies = await getSAPSessionCookies(sapCredentials)
    }
    
    request.headers['Cookie'] = getCookieHeader(session.cookies)

    return request
}, error => {
    return Promise.reject(error)
})

client.interceptors.response.use(async response => {
    session.cookies = {
        ...session.cookies,
        ...readSetCookieHeader(response.headers)
    }
    return response
}, error => {
    if (error && error.response && error.response.data && error.response.data.error && error.response.data.error.message && error.response.data.error.message.value) {
        error.message = `${error.response.data.error.message.value}: ${error.message}`
    }
    return Promise.reject(error)
})

createAuthRefreshInterceptor(client, async failedRequest => {
    session.cookies = await getSAPSessionCookies(sapCredentials)
    failedRequest.response.config.headers['Cookie'] = getCookieHeader(session.cookies)
    return failedRequest
})

module.exports = {
    client,
    sapCredentials,
    clientOptions,
    readSetCookieHeader,
    getCookieHeader,
    getSAPSessionCookies
}
