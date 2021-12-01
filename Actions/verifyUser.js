const client = require('../connection.js')
const logger = require('../config/logger')

const verifyUser = (req,res) =>{
    console.log(req, res);
    logger.info('request 1st part',req.request);
    logger.info('request 2nd part',req.request._parsedUrl);
    
    const a = req.request._parsedUrl.query;
    logger.info('request 3rd part',a);
    const username = a.split("=")[1].split("&")[0]
    const text = 'UPDATE public.users SET verified = $1, verified_on = $2 WHERE username =$3'
    const values = [true, new Date().toISOString(), username];
    client.query(text1, value1, (error, results) => {
        if(error) {
            logger.error('Error while verifying user');
            return res.status(400).json({
            status: 400,
            error: err
            });
        } else {
            logger.info('User verified sucessfully');
            return res.status(204).json({
                status: 204,
                description: 'User verified sucessfully'
            });
        }
        
    });
}

exports.verifyUser = verifyUser;