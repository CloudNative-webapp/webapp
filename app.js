const {
    client,
    clientRead
} = require('./connection.js')
// const clientRead = require('./connection.js')
const express = require('express');
const multer = require('multer');
const upload = multer({
    dest: 'uploads/'
})
const app = express();
const logger = require('./config/logger')
var SDC = require('statsd-client'),
    sdc = new SDC({
        host: 'localhost',
        port: 8125
    });
const router = express.Router();
var crypt = require('crypto');
const {
    verifyUser
} = require('./Actions/verifyUser')

// const Api404Error = require('./api404Error')
// const Api401Error = require('./api401Error')
// const Api400Error = require('./api400Error')
// const Api403Error = require('./api403Error')
const validatePassword = require('./validatePassword')
const fs = require("fs");
var uuid = require('uuid');
const {
    uploadFile
} = require('./s3')
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-1'
});
var dynamo = new AWS.DynamoDB({
    region: 'us-east-1'
});
var DynamoDB = new AWS.DynamoDB.DocumentClient({
    service: dynamo
});
const Jimp = require("jimp");
const {
    emailIsValid
} = require('./helperFunctions');
const s3 = new AWS.S3(
    region = 'us-east-1'
);

//include bcrypt module
const bcrypt = require('bcrypt');

const generateAccessToken = (username) => {
    let SHA = crypt.createHash('sha256');
    SHA.update(username);
    let HASH = SHA.digest('hex');
    logger.info({
        'in_token_creation': HASH
    })
    return HASH;
}

//Set a value for saltRounds
const saltRounds = 10;

app.listen(3000, () => {
    console.log("Sever is now listening at port 3000");
})

client.connect(function (err) {
    if (err) {
        logger.error("Error in connecting client");
        throw err;
    }
    client.query('CREATE EXTENSION "uuid-ossp";');
    client.query('create table custuser(user_uid UUID DEFAULT uuid_generate_v4(),username VARCHAR(100) NOT NULL,password VARCHAR(100) NOT NULL,first_name VARCHAR(50) NOT NULL,last_name VARCHAR(50) NOT NULL,account_created timestamp with time zone,account_updated timestamp with time zone,verified boolean,verified_on timestamp with time zone,PRIMARY KEY (user_uid));', function (error, result, fields) {});
    client.query('create table usermetadata(file_name VARCHAR(200) NOT NULL,id UUID,url VARCHAR(200) NOT NULL, upload_date DATE NOT NULL, user_id UUID REFERENCES custuser(user_uid),keypath VARCHAR(100));', function (error, ans, fields) {});

    logger.info("Client connected successfully");
    client.end;
});

clientRead.connect(function (err) {
    if (err) {
        logger.error({
            "Error in connecting read replica client": err
        });
    }
    logger.info("Read replica Client connected successfully");
});
// client.connect();

const bodyParser = require("body-parser"); //To access request body as JSON
const {
    error
} = require('console');
const {
    application
} = require('express');
const {
    env
} = require('process');
app.use(bodyParser.json());


// function emailIsValid(email) {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
// }

app.get('/healthstatus', (req, res) => {
    res.status(200).send('Ok');
});

//get all users
app.get('/v2/user/self', (req, res, next) => {
    let start_api = Date.now();
    sdc.increment('get.api.count');
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    const text1 = 'Select verified from custuser where username =$1'
    const value1 = [username];
    client.query(text1, value1, (error, result) => {
        if (!result.rows[0].verified) {
            logger.error('User not verified to perform any action');
            return res.status(400).json({
                status: 400,
                error: "User not verified"
            });
        } else {


            try {
                const ans = validatePassword(username, password);

                if (ans) {
                    const values = [username]
                    let start_query = Date.now();
                    clientRead.query(`SELECT * FROM custuser WHERE username = $1`, values, (err, result) => {
                        if (err) {
                            console.log('Error' + error)
                            logger.error("Error in get api query");
                        }

                        const {
                            password,
                            ...cred
                        } = result.rows[0]
                        res.status(200).json(cred)
                        logger.info("Get user data");
                    });
                    let end_query = Date.now();
                    var query_time_completion = end_query - start_query;
                    sdc.timing('timer.query.api.get', query_time_completion);
                } else {
                    res.status(401).send({
                        error: 'Authentication Failed'
                    })
                    logger.error("Authentication Failed in get api")
                    // throw new Api401Error('Authentication Failed')
                }
            } catch (error) {
                return res.status(401).send({
                    error: 'Authentication Failed'
                });
            }
        }
    })

    let end_api = Date.now();
    var time_of_completion = end_api - start_api;
    sdc.timing('timer.api.get', time_of_completion);



    client.end;

})

//create a new user
app.post('/v1/user', (req, res) => {
    let start_api = Date.now();
    sdc.increment('post.api.count');
    let d = new Date();
    const userReq = req.body;
    let verify;
    var password = userReq.password;
    let sqlString = `INSERT INTO custuser (username, password, first_name, last_name, account_created, account_updated) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`

    try {
        if (!emailIsValid(userReq.username)) {
            res.status(400).send('Bad request')
            logger.error("Invalid email");
            // throw new Api400Error('username not valid')
        } else {
            const get_user_start_time = Date.now();
            const text1 = 'Select * from custuser where username =$1'
            const value1 = [userReq.username];
            client.query(text1, value1, (error, results) => {
                const get_user_end_time = Date.now();
                let get_user_time_elapsed = get_user_end_time - get_user_start_time;
                sdc.timing('query.user.get.post', get_user_time_elapsed);
                logger.info('result from query', results)
                if (results.rows.length) {
                    logger.error('user already exists')
                    verify = results.rows[0].verified;
                    return res.status(400).json({
                        status: 400,
                        msg: 'Email already in use'
                    })

                } else {
                    logger.info({
                        'result': results
                    });
                    verify = false;


                    //generate  a salt and hash the password
                    bcrypt.hash(password, saltRounds, async function (err, hash) {
                        const values = [userReq.username, hash, userReq.firstname, userReq.lastname, d, d];
                        let start_query = Date.now();
                        const ans = await client.query(sqlString, values)
                        let end_query = Date.now();
                        var query_time_completion = end_query - start_query;
                        sdc.timing('timer.query.api.post', query_time_completion);

                        try {
                            if (!ans) {
                                res.status(400).json({
                                    status: 400,
                                    error: "Bad Request"
                                })
                                logger.error("User not added:Invalid query")
                                // throw new Api400Error(`Username: ${userReq.username}`)
                            } else {
                                //omitted password field
                                // Create publish parameters
                                const token = generateAccessToken(userReq.username);
                                // const dbdata = {username:userReq.username, token}
                                const current = Math.floor(Date.now() / 1000)
                                let ttl = 60 * 5
                                const expiresIn = ttl + current
                                var param = {
                                    TableName: "dynamodb-table",
                                    Item: {
                                        username: userReq.username,
                                        "one-time-token": token,
                                        ttl: expiresIn,
                                    }
                                };
                                logger.info('before dynamodb in post')
                                logger.info({
                                    username: userReq.username
                                })
                                DynamoDB.put(param, function (error, data) {
                                    if (error) {
                                        console.log("Error in putting item in DynamoDB ", error);
                                        logger.error({
                                            'error in dynamo put': error
                                        })
                                    }

                                });
                                const params = {
                                    Message: JSON.stringify({
                                        username: userReq.username,
                                        token,
                                        messageType: "Create User",
                                        domainName: process.env.domain_name,
                                        first_name: userReq.first_name,
                                        verify
                                    }),
                                    TopicArn: process.env.TOPIC_ARN,
                                }
                                let publishTextPromise = new AWS.SNS({
                                    apiVersion: '2010-03-31'
                                }).publish(params).promise();
                                publishTextPromise.then(
                                    function (data) {
                                        console.log(`Message sent to the topic ${params.TopicArn}`);
                                        console.log("MessageID is " + data.MessageId);
                                        // res.status(201).send(result.toJSON());
                                        logger.info("in sns publish post api");

                                    }).catch(
                                    function (err) {
                                        logger.error({
                                            'error in sns': err
                                        })
                                        console.error(err, err.stack);
                                        // res.status(500).send(err)
                                    });

                                const {
                                    password,
                                    ...result
                                } = ans.rows[0]
                                res.status(201).json(result)
                                logger.info("New user created");
                            }
                        } catch (error) {
                            console.log(error)
                        }
                    });
                }
            })
        }
    } catch (error) {
        console.log(error)
    }

    let end_api = Date.now();
    var time_of_completion = end_api - start_api;
    sdc.timing('timer.api.post', time_of_completion);
    client.end;
})

app.get('/v1/verifyUserEmail', verifyUser);

//update details of user
app.put('/v1/user/self', (req, res) => {
    let start_api = Date.now();
    sdc.increment('put.api.count');
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [uname, passwd] = credentials.split(':');

    let {
        username,
        password,
        firstname,
        lastname,
        account_created,
        account_updated
    } = req.body;
    let d = new Date();

    let newquery = 'UPDATE custuser SET password = COALESCE(NULLIF($1, \'\'), password), first_name = COALESCE(NULLIF($2, \'\'), first_name), last_name = COALESCE(NULLIF($3, \'\'), last_name), account_updated = $4 WHERE username = $5'

    const text2 = 'Select verified from custuser where username =$1'
    const value2 = [uname];
    client.query(text2, value2, (error, result) => {
        if (!result.rows[0].verified) {
            logger.error('User not verified to perform any action');
            return res.status(400).json({
                status: 400,
                error: "User not verified"
            });
        } else {

            try {
                if (account_created || account_updated || username) {
                    res.status(400).json({
                        status: 400,
                        error: 'Bad Request'
                    })
                    logger.error("Invalid put request");
                    // throw new Api400Error(`Updated field not allowed`)
                } else if (validatePassword(uname, passwd)) {

                    bcrypt.hash(password, saltRounds, function (err, hash) {
                        const values = [hash, firstname, lastname, d, uname];
                        let start_query = Date.now();
                        client.query(newquery, values, (err, result) => {
                            if (result) {
                                res.status(204).json({
                                    status: 204,
                                    message: "Update Successful"
                                })
                                logger.info("User details updated")
                            } else {
                                console.log(err.message)
                                logger.error("Query failed in put api");
                            }
                        });
                        let end_query = Date.now();
                        var query_time_completion = end_query - start_query;
                        sdc.timing('timer.query.api.put', query_time_completion);
                    });

                } else {
                    res.status(401).json({
                        status: 401,
                        error: 'User is'
                    })
                    logger.error("Authentication failed in put api");
                    // throw new Api401Error('Authentication Failed')
                }
            } catch (error) {
                console.log(error)
            }
        }
    })
    let end_api = Date.now();
    var time_of_completion = end_api - start_api;
    sdc.timing('timer.api.put', time_of_completion);
    client.end;
})

app.post('/v1/user/self/pic', async (req, res) => {
    let start_api = Date.now();
    sdc.increment('post.pic.api.count');
    const value = [req.body.username]
    const id = uuid.v4();
    let sqlstr = `SELECT * FROM custuser WHERE username = $1`
    let kquery = `SELECT keypath,user_id FROM usermetadata WHERE user_id = $1`
    let delrecord = `DELETE FROM usermetadata WHERE user_id = $1;`
    logger.info('in post picture api')
    const text5 = 'Select verified from custuser where username =$1'
    const value5 = [value];
    client.query(text5, value5, async (error, result) => {
        if (!result.rows[0].verified) {
            logger.error('User not verified to perform any action');
            return res.status(400).json({
                status: 400,
                error: "User not verified"
            });
        } else {
            logger.info('after user is verified in post pic')
            let start_query = Date.now();
            const ans = await client.query(sqlstr, value);
            let end_query = Date.now();
            var query_time_completion = end_query - start_query;
            sdc.timing('timer.query.api.post.pic.getUser', query_time_completion);
            logger.info('query 1 executed', ans)
            const userid = ans.rows[0].user_uid;
            const delval = [userid];

            let start_query1 = Date.now();
            const del = await client.query(kquery, delval);
            let end_query1 = Date.now();
            var query_time_completion1 = end_query1 - start_query1;
            sdc.timing('timer.query.api.post.pic.getUser', query_time_completion1);
            logger.info('query 2 executed', del)
            if (del.rowCount > 0) {
                const delid = [del.rows[0].user_id]
                const kparam = del.rows[0].keypath;

                let start_query2 = Date.now();
                const rec = await client.query(delrecord, delid);
                let end_query2 = Date.now();
                var query_time_completion2 = end_query2 - start_query2;
                sdc.timing('timer.query.api.post.pic.deleteExisting', query_time_completion2);

                let s3_start = Date.now();
                const deleteParam = {
                    Bucket: process.env.S3_BUCKET,
                    Key: kparam,
                };

                s3.deleteObject(deleteParam, function (err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        logger.error("Error in deleting existing pic")
                    } else {
                        console.log('delete', data);
                        logger.info("Existing pic deleted before updating new")
                    }
                    // res.status(204);
                });
                let s3_end = Date.now();
                var s3_elapsed = s3_end - s3_start;
                sdc.timing('s3.pic.deleteInPost', s3_elapsed);
            }
            const imgBinary = req.body.data;
            const buffer = Buffer.from(imgBinary, "base64");
            const fname = Date.now() + ".jpeg";
            fs.writeFileSync(fname, buffer);
            let upMeta = `INSERT INTO usermetadata (file_name, id, url, upload_date, user_id,keypath) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`

            const folder = (userid + "/");
            //let uploaddate =String(Date.now());
            var todayDate = new Date().toISOString().slice(0, 10);

            let s3_start1 = Date.now();
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: (folder + fname),
                Body: fname,
            };


            s3.upload(params, async function (err, data) {
                if (err) {
                    logger.error("Error in uploading profile pic");
                    throw err;
                }
                const values = [fname, id, data.Location, todayDate, userid, data.Key];

                let start_query3 = Date.now();
                const ans = await client.query(upMeta, values);
                let end_query3 = Date.now();
                var query_time_completion3 = end_query3 - start_query3;
                sdc.timing('timer.query.api.post.pic.insert.metadata', query_time_completion3);

                res.status(201).json(ans.rows[0]);
                logger.info("File uploaded successfully");
                console.log(`File uploaded successfully. ${data.Location}`);
            });
            let s3_end1 = Date.now();
            var s3_elapsed1 = s3_end1 - s3_start1;
            sdc.timing('s3.pic.upload', s3_elapsed1);

        }
    })
    let end_api = Date.now();
    var time_of_completion = end_api - start_api;
    sdc.timing('timer.api.post.pic', time_of_completion);
    client.end;

})

app.get('/v1/user/self/pic', async (req, res) => {
    let start_api = Date.now();
    sdc.increment('get.pic.api.count');

    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    const value = [username];
    let sqlstr = `SELECT * FROM custuser WHERE username = $1`

    const text3 = 'Select verified from custuser where username =$1'
    const value3 = [username];
    client.query(text3, value3, async (error, result) => {
        if (!result.rows[0].verified) {
            logger.error('User not verified to perform any action');
            return res.status(400).json({
                status: 400,
                error: "User not verified"
            });
        } else {

            let start_query1 = Date.now();
            const ans = await client.query(sqlstr, value);
            let end_query1 = Date.now();
            var query_time_completion1 = end_query1 - start_query1;
            sdc.timing('timer.query.api.get.pic.getUser', query_time_completion1);

            const userid = ans.rows[0].user_uid;

            const val = [userid];
            let getProfileQuery = `SELECT * from usermetadata where user_id = $1`

            let start_query = Date.now();
            clientRead.query(getProfileQuery, val, (err, result) => {
                if (err) {
                    console.log('err in get profile', err);
                    res.status(400);
                    logger.error("Error in getting pic");
                } else if (result.rowCount < 1) {
                    res.status(404);
                    logger.error("Error in getting pic query");
                } else {
                    console.log('success');
                    res.status(200).json(result.rows);
                    logger.info("Profile pic retrieved");
                }
            })
            let end_query = Date.now();
            var query_time_completion = end_query - start_query;
            sdc.timing('timer.query.api.get.pic', query_time_completion);

        }
    })
    let end_api = Date.now();
    var time_of_completion = end_api - start_api;
    sdc.timing('timer.api.get.pic', time_of_completion);

})

app.delete('/v1/user/self/pic', async (req, res) => {
    let start_api = Date.now();
    sdc.increment('delete.pic.api.count');

    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    const value = [username];
    let sqlstr = `SELECT user_uid FROM custuser WHERE username = $1`
    let kquery = `SELECT keypath FROM usermetadata WHERE user_id = $1`
    let delrecord = `DELETE FROM usermetadata WHERE user_id = $1;`

    const text4 = 'Select verified from custuser where username =$1'
    const value4 = [username];
    client.query(text4, value4, async (error, result) => {
        if (!result.rows[0].verified) {
            logger.error('User not verified to perform any action');
            return res.status(400).json({
                status: 400,
                error: "User not verified"
            });
        } else {


            let start_query2 = Date.now();
            const ans = await client.query(sqlstr, value);
            let end_query2 = Date.now();
            var query_time_completion2 = end_query2 - start_query2;
            sdc.timing('timer.query.api.delete.pic.getuser', query_time_completion2);

            const val = [ans.rows[0].user_uid]

            let start_query1 = Date.now();
            const result = await client.query(kquery, val);
            let end_query1 = Date.now();
            var query_time_completion1 = end_query1 - start_query1;
            sdc.timing('timer.query.api.delete.pic.getMetadata', query_time_completion1);

            const kname = result.rows[0].keypath;
            if (kname.rowCount < 1) {
                res.status(404);
                logger.error("Error in metadata query in delete pic api")
            }

            let s3_start = Date.now();
            const deleteParam = {
                Bucket: process.env.S3_BUCKET,
                Key: kname,
            };

            s3.deleteObject(deleteParam, async function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    logger.error("Error deleting profile pic");
                }

                let start_query = Date.now();
                const rec = await client.query(delrecord, val);
                let end_query = Date.now();
                var query_time_completion = end_query - start_query;
                sdc.timing('timer.query.api.delete.pic.metadata', query_time_completion);

                res.sendStatus(204);
                logger.info("Profile pic deleted");


            });
            let s3_end = Date.now();
            var s3_elapsed = s3_end - s3_start;
            sdc.timing('s3.pic.delete', s3_elapsed);

        }
    })
    let end_api = Date.now();
    var time_of_completion = end_api - start_api;
    sdc.timing('timer.api.delete.pic', time_of_completion);
    client.end;

})



module.exports = app;