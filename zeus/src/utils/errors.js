class ServerError extends Error {
  constructor (message = '500: Internal Server Error', status = 500) {
    super(message)

    // this line possibly not required
    // Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;

    this.status = status
  }
}

class InternalServerError extends ServerError {
  constructor (message = '500: Internal Server Error') {
    super(message, 500)
  }
}

class BadRequestError extends ServerError {
  constructor (message = '400: Bad Request') {
    super(message, 400)
  }
}

class UnauthorizedError extends ServerError {
  constructor (message = '401: Unauthorized') {
    super(message, 401)
  }
}

class ForbiddenError extends ServerError {
  constructor (message = '403: Forbidden') {
    super(message, 403)
  }
}

class NotFoundError extends ServerError {
  constructor (message = '404: Not Found') {
    super(message, 404)
  }
}

module.exports = {
  ServerError,
  InternalServerError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError
}
