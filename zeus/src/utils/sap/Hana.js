const HanaClient = require('@sap/hana-client')



const defaultConnectionOptions = {
  host: process.env.SAP_HANA_HOSTNAME,
  port: process.env.SAP_HANA_PORT,
  uid: process.env.SAP_HANA_USERNAME,
  pwd: process.env.SAP_HANA_PASSWORD,
  databaseName: process.env.SAP_HANA_DATABASE,
  currentSchema: process.env.SAP_B1_COMPANY
}

// async/await wrapper for hana client
class AsyncProxy {
  asyncProxy (method, ...args) {
    return new Promise((resolve, reject) => this.proxiedObject[method](...args, (err, result) => err ? reject(err) : resolve(result)))
  }
}
class HanaClientAsync extends AsyncProxy {
  constructor (connection = HanaClient.createConnection()) {
    super()
    this.proxiedObject = connection
  }
  connect (options = defaultConnectionOptions) {
    return this.asyncProxy('connect', typeof options === 'string' ? options : {
      ...defaultConnectionOptions,
      ...options
    })
  }
  disconnect () { return this.asyncProxy('disconnect') }
  close () { return this.asyncProxy('close') }
  exec (sql, params) { return this.asyncProxy('exec', sql, params) }
  execute (sql, params) { return this.asyncProxy('execute', sql, params) }
  commit () { return this.asyncProxy('commit') }
  rollback () { return this.asyncProxy('rollback') }
  getClientInfo (key) { return this.asyncProxy('getClientInfo', key) }
  setClientInfo (key, value) { return this.asyncProxy('setClientInfo', key, value) }
  setAutoCommit (flag) { return this.asyncProxy('setAutoCommit', flag) }
  async prepare (sql) { return new HanaStatementAsync(await this.asyncProxy('prepare', sql)) }
}
class HanaStatementAsync extends AsyncProxy {
  constructor (statement) {
    super()
    this.proxiedObject = statement
  }
  drop () { return this.asyncProxy('drop') }
  exec (params) { return this.asyncProxy('exec', params) }
  execute (params) { return this.asyncProxy('execute', params) }
  execBatch (params) { return this.asyncProxy('execBatch', params) }
  executeBatch (params) { return this.asyncProxy('executeBatch', params) }
  async execQuery (params) { return new HanaResultSetAsync(await this.asyncProxy('execQuery', params)) }
  async executeQuery (params) { return new HanaResultSetAsync(await this.asyncProxy('executeQuery', params)) }
  functionCode () { return this.proxiedObject.functionCode() }
  getParameterValue (paramIndex) { return this.proxiedObject.getParameterValue(paramIndex) }
  sendParameterData (columnIndex, buffer) { return this.asyncProxy('sendParameterData', columnIndex, buffer) }
}
class HanaResultSetAsync {
  constructor (resultset) {
    this.proxiedObject = resultset
  }
  close () { return this.proxiedObject.close() }
  getColumnCount () { return this.proxiedObject.getColumnCount() }
  getColumnName (colIndex) { return this.proxiedObject.getColumnName(colIndex) }
  getData (colIndex, dataOffset, buffer, bufferOffset, length) { return this.asyncProxy('getData', colIndex, dataOffset, buffer, bufferOffset, length) }
  getValue (colIndex) { return this.proxiedObject.getValue(colIndex) }
  getValues () { return this.proxiedObject.getValues() }
  next () { return this.asyncProxy('next') }
  nextResult () { return this.asyncProxy('nextResult') }
}

module.exports = {
  HanaClientAsync,
  HanaStatementAsync,
  HanaResultSetAsync
}