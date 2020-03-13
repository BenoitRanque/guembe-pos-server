const { client: sap  } = require('./ServiceLayer')
const { HanaClientAsync } = require('./Hana')

module.exports = class SAPClient {
  constructor ({ hana = null, serviceLayer = sap } = {}) {
    this.serviceLayerClient = serviceLayer
    this.hanaClient = hana
  }

  async disconnect () {
    if (this.hanaClient) {
      const client = await this.hanaClient
      client.disconnect()
    }
  }

  get hana () {
    if (!this.hanaClient) {
      this.hanaClient = new Promise((resolve, reject) => {
        const client = new HanaClientAsync()
        client.connect()
          .then(() => resolve(client))
          .catch(reject)
      })
    }
    return this.hanaClient
  }

  get serviceLayer () {
    return this.serviceLayerClient
  }
}
