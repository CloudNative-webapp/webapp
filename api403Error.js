const httpStatusCodes = require('./httpStatusCodes')
const BaseError = require('./BaseError')

class Api403Error extends BaseError {
    constructor(
        name,
        statusCode = httpStatusCodes.ALREADY_EXISTS,
        description = 'Already Exists',
        isOperational = true
    ) {
        super(name, statusCode, isOperational, description)
    }
}

module.exports = Api403Error