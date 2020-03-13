function formatDate(date) {
  return date.getFullYear() + `00${date.getMonth()}`.slice(-2) + `00${date.getDate()}`.slice(-2)
}

function getProp(obj, path) {
  return path.split('.').reduce((obj, prop) => obj[prop] ? obj[prop] : null, obj)
}

module.exports = {
  formatDate
}