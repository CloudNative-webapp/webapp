const client = require('./connection.js')
const express = require('express');
const app = express();
const Api404Error = require('./api404Error')
const Api401Error = require('./api401Error')
const Api400Error = require('./api400Error')
const Api403Error = require('./api403Error')
const validatePassword = require('./validatePassword')
const fs = require("fs");
const AWS = require('aws-sdk');
const Jimp = require("jimp");
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

//include bcrypt module
const bcrypt = require('bcrypt');

//Set a value for saltRounds
const saltRounds = 10;

app.listen(5000, () => {
    console.log("Sever is now listening at port 5000");
})

client.connect(function(err) {
    if (err) throw err;

    client.query('CREATE DATABASE IF NOT EXISTS postgres;');
    client.query('USE postgres;');
    client.query('create table user(user_uid UUID DEFAULT uuid_generate_v4(),username VARCHAR(100) NOT NULL,password VARCHAR(100) NOT NULL,first_name VARCHAR(50) NOT NULL,last_name VARCHAR(50) NOT NULL,account_created timestamp with time zone,account_updated timestamp with time zone,PRIMARY KEY (user_uid);', function(error, result, fields) {
        console.log("hi"+result);
    });
    client.end;
});

const bodyParser = require("body-parser"); //To access request body as JSON
const { error } = require('console');
const { application } = require('express');
const { env } = require('process');
app.use(bodyParser.json());


function emailIsValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}


//get all users
app.get('/v1/user/self', (req, res, next) => {

    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    try {
        const ans = validatePassword(username, password);
        console.log("ans"+ ans);
        if (ans) {
            const values = [username]
            client.query(`SELECT * FROM public.user WHERE username = $1`, values, (err, result) => {
                if (err) {
                    console.log('Error' + error)
                }
                console.log('select query:' + result.rows)
                const {password,...cred} = result.rows[0]
                res.status(200).json(cred)
            });
        } else {
            res.status(401).send({error: 'Authentication Failed'})
            throw new Api401Error('Authentication Failed')
        }
    } catch (error) {
        return res.status(401).send({error: 'Authentication Failed'});
    }




    client.end;

})

//create a new user
app.post('/v1/user', (req, res) => {
    let d = new Date();
    const userReq = req.body;
    var password = userReq.password;
    let sqlString = `INSERT INTO public.user (username, password, first_name, last_name, account_created, account_updated) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`

    try {
        if (!emailIsValid(userReq.username)) {
            res.status(400).send('Bad request')
            throw new Api400Error('username not valid')
        } else {

            //generate  a salt and hash the password
            bcrypt.hash(password, saltRounds, async function (err, hash) {
                const values = [userReq.username, hash, userReq.firstname, userReq.lastname, d, d];
                    const ans = await client.query(sqlString, values)

                    try {
                        if (!ans) {
                            res.status(400).json({
                                status: 400,
                                error: "Bad Request"
                            })
                            throw new Api400Error(`Username: ${userReq.username}`)
                        } else {
                            //omitted password field
                             const {password,...result} = ans.rows[0]
                            res.status(201).json(result)
                        }
                    } catch (error) {
                        console.log(error)
                    }
                });
        }
    } catch (error) {
        console.log(error)
    }

    client.end;
})

//update details of user
app.put('/v1/user/self', (req, res) => {
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
    
    let newquery = 'UPDATE public.user SET password = COALESCE(NULLIF($1, \'\'), password), first_name = COALESCE(NULLIF($2, \'\'), first_name), last_name = COALESCE(NULLIF($3, \'\'), last_name), account_updated = $4 WHERE username = $5'

    try {
        if (account_created || account_updated || username) {
            res.status(400).json({
                status: 400,
                error: 'Bad Request'
            })
            throw new Api400Error(`Updated field not allowed`)
        } else if (validatePassword(uname, passwd)) {

            bcrypt.hash(password, saltRounds, function (err, hash) {
                const values = [hash, firstname, lastname, d, uname];
                client.query(newquery, values, (err, result) => {
                    if (result) {
                        res.status(204).json({
                            status: 204,
                            message: "Update Successful"
                        })
                    } else {
                        console.log(err.message)
                    }
                });
                console.log(password + ' pass and hash ' + hash);
            });

        } else {
            res.status(401).json({
                status: 401,
                error: 'User is'
            })
            throw new Api401Error('Authentication Failed')
        }
    } catch (error) {
        console.log(error)
    }

    client.end;
})

app.post('/v1/user/self/pic', (req, res) => {
    const value = [req.body.username]
    // const userid="";
    let sqlstr = `SELECT * FROM public.user WHERE username = $1`
    async function getUserID(){
        const ans = await client.query(sqlstr, value);
        return ans.rows[0].user_uid;
    }
    getUserID().then((ans)=> userid = ans)
    .catch(console.log("err"))
    const imgBinary = req.body.data;
    const buffer = Buffer.from(imgBinary, "base64");
    const fname = Date.now()+".jpeg";
    fs.writeFileSync(fname, buffer);
    // fs.writeFileSync("new-path.jpg", buffer);
    // const file = Jimp.read(buffer, (err, res) => {
    //     if (err) throw new Error(err);
    //     res.quality(5).write("resized.jpg");
    //   });
    
      const folder = (req.body.username + "/");
      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: (folder + fname),
        ACL: 'public-read',
        Body: fname
      };

      s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
    
})

module.exports = app; 