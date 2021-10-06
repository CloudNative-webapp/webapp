const httpStatusCodes = require('./httpStatusCodes')
const BaseError = require('./BaseError')

class Api400Error extends BaseError {
 constructor (
 name,
 statusCode = httpStatusCodes.NOT_FOUND,
 description = 'Bad Request.',
 isOperational = true
 ) {
 super(name, statusCode, isOperational, description)
 }
}

module.exports = Api400Error