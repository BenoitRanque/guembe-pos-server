const axios = require('axios')
const https = require('https')
const createAuthRefreshInterceptor = require('axios-auth-refresh').default

class ServiceLayerClient {
  constructor ({ options = ServiceLayerClient.defaultOptions, credentials = ServiceLayerClient.defaultCredentials } = {}) {
    this.cookies = null
    this.options = options
    this.credentials = credentials

    const client = axios.create(options)

    client.interceptors.request.use(async request => {
        if (!this.cookies) {
            this.cookies = await ServiceLayerClient.getSAPSessionCookies()
        }
        
        request.headers['Cookie'] = ServiceLayerClient.getCookieHeader(this.cookies)
    
        return request
    }, error => {
        return Promise.reject(error)
    })
    client.interceptors.response.use(async response => {
        this.cookies = {
            ...this.cookies,
            ...ServiceLayerClient.readSetCookieHeader(response.headers)
        }
        return response
    }, error => {
        if (error && error.response && error.response.data && error.response.data.error && error.response.data.error.message && error.response.data.error.message.value) {
            error.message = `${error.response.data.error.message.value}: ${error.message}`
        }
        return Promise.reject(error)
    })
    
    createAuthRefreshInterceptor(client, async failedRequest => {
        this.cookies = await ServiceLayerClient.getSAPSessionCookies({ options: this.options, credentials: this.credentials })
        failedRequest.response.config.headers['Cookie'] = ServiceLayerClient.getCookieHeader(this.cookies)
        return failedRequest
    })

    return client
  }

  static get defaultOptions () {
    return {
      timeout: 1000 * 20, // 20 seconds
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
  }

  static get defaultCredentials () {
    return {
      CompanyDB: process.env.SAP_B1_COMPANY,
      UserName: process.env.SAP_B1_USERNAME,
      Password: process.env.SAP_B1_PASSWORD
    }
  }

  static readSetCookieHeader(headers) {
    if (!headers['set-cookie']) {
      return {}
    }
    return headers['set-cookie'].reduce((cookies, header) => {
        const [ , name, value ] = header.match(/^([^=]*)=([^;]*)/)
        cookies[name] = value
        return cookies
    }, {})
  }

  static getCookieHeader(cookies) {
    return Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  static async getSAPSessionCookies ({ options = ServiceLayerClient.defaultOptions, credentials = ServiceLayerClient.defaultCredentials } = {}) {
    const response = await axios.create(options)
      .post('/Login', credentials)
    const cookies = this.readSetCookieHeader(response.headers)
    return cookies
  }
}

module.exports = {
  ServiceLayerClient,
  client: new ServiceLayerClient()
}