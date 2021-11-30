const client = require('./connection.js')
const logger = require('./config/logger')

const verifyUser = (req,res) =>{
    logger.info('in verify user api')
    console.log('response'+res);
}

exports.verifyUser = verifyUser;