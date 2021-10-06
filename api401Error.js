const httpStatusCodes = require('./httpStatusCodes')
const BaseError = require('./BaseError')

class Api401Error extends BaseError {
    constructor(
        name,
        statusCode = httpStatusCodes.UNAUTHORIZED,
        description = 'UNAUTHORIZED',
        isOperational = true
    ) {
        super(name, statusCode, isOperational, description)
    }
}

module.exports = Api401Error