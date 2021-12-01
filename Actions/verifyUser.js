const client = require('../connection.js')
const logger = require('../config/logger')

const verifyUser = (req,res) =>{
    logger.info('in verify user api')
    logger.info({'response':res});
    logger.info({'request':req});
}

exports.verifyUser = verifyUser;