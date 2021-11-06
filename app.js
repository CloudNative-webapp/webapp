const client = require('./connection.js')
const express = require('express');
const multer = require('multer');
const upload = multer({dest:'uploads/'})
const app = express();
// const Api404Error = require('./api404Error')
// const Api401Error = require('./api401Error')
// const Api400Error = require('./api400Error')
// const Api403Error = require('./api403Error')
const validatePassword = require('./validatePassword')
const fs = require("fs");
var uuid = require('uuid');
const {uploadFile} = require('./s3')
const AWS = require('aws-sdk');
const Jimp = require("jimp");
const { emailIsValid } = require('./helperFunctions');
const s3 = new AWS.S3(
    region = 'us-east-1'
);

//include bcrypt module
const bcrypt = require('bcrypt');

//Set a value for saltRounds
const saltRounds = 10;

app.listen(3000, () => {
    console.log("Sever is now listening at port 3000");
})

client.connect(function(err) {
    if (err) throw err;
    client.query('CREATE EXTENSION "uuid-ossp";');
    client.query('create table custuser(user_uid UUID DEFAULT uuid_generate_v4(),username VARCHAR(100) NOT NULL,password VARCHAR(100) NOT NULL,first_name VARCHAR(50) NOT NULL,last_name VARCHAR(50) NOT NULL,account_created timestamp with time zone,account_updated timestamp with time zone,PRIMARY KEY (user_uid));', function(error, result, fields) {
    });
    client.query('create table usermetadata(file_name VARCHAR(200) NOT NULL,id UUID,url VARCHAR(200) NOT NULL, upload_date DATE NOT NULL, user_id UUID REFERENCES custuser(user_uid),keypath VARCHAR(100));', function(error, ans, fields) {
    });
    client.end;
});
// client.connect();

const bodyParser = require("body-parser"); //To access request body as JSON
const { error } = require('console');
const { application } = require('express');
const { env } = require('process');
app.use(bodyParser.json());


// function emailIsValid(email) {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
// }


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
            client.query(`SELECT * FROM custuser WHERE username = $1`, values, (err, result) => {
                if (err) {
                    console.log('Error' + error)
                }
                console.log('select query:' + result.rows)
                const {password,...cred} = result.rows[0]
                res.status(200).json(cred)
            });
        } else {
            res.status(401).send({error: 'Authentication Failed'})
            // throw new Api401Error('Authentication Failed')
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
    let sqlString = `INSERT INTO custuser (username, password, first_name, last_name, account_created, account_updated) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`

    try {
        if (!emailIsValid(userReq.username)) {
            res.status(400).send('Bad request')
            // throw new Api400Error('username not valid')
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
                            // throw new Api400Error(`Username: ${userReq.username}`)
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
    
    let newquery = 'UPDATE custuser SET password = COALESCE(NULLIF($1, \'\'), password), first_name = COALESCE(NULLIF($2, \'\'), first_name), last_name = COALESCE(NULLIF($3, \'\'), last_name), account_updated = $4 WHERE username = $5'

    try {
        if (account_created || account_updated || username) {
            res.status(400).json({
                status: 400,
                error: 'Bad Request'
            })
            // throw new Api400Error(`Updated field not allowed`)
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
            // throw new Api401Error('Authentication Failed')
        }
    } catch (error) {
        console.log(error)
    }

    client.end;
})

app.post('/v1/user/self/pic', async (req, res) => {
    const value = [req.body.username]
    const id = uuid.v4();
    let sqlstr = `SELECT * FROM custuser WHERE username = $1`
        let kquery = `SELECT keypath,user_id FROM usermetadata WHERE user_id = $1`
    let delrecord = `DELETE FROM usermetadata WHERE user_id = $1;`
    const ans = await client.query(sqlstr, value);
    const userid = ans.rows[0].user_uid;
   const delval = [userid];
   const del = await client.query(kquery,delval);
        console.log('kquery ',del);
        console.log('rowcount',del.rowCount);
   // const delid = [del.rows[0].id]
        //const kparam = del.rows[0].keypath;
    if(del.rowCount > 0){
     const delid = [del.rows[0].user_id]
            const kparam = del.rows[0].keypath;
        const rec = await client.query(delrecord,delid);
        const deleteParam = {
            Bucket: process.env.S3_BUCKET,
            Key: kparam,
          };

        s3.deleteObject(deleteParam, function(err, data) {
            if (err) console.log(err, err.stack);
            else console.log('delete', data);
            // res.status(204);
        });
    }
    const imgBinary = req.body.data;
    const buffer = Buffer.from(imgBinary, "base64");
    const fname = Date.now()+".jpeg";
    fs.writeFileSync(fname, buffer);
    let upMeta = `INSERT INTO usermetadata (file_name, id, url, upload_date, user_id,keypath) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`

      const folder = (userid + "/");
      //let uploaddate =String(Date.now());
        var todayDate = new Date().toISOString().slice(0, 10);
        
      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: (folder + fname),
        Body: fname,
      };

      s3.upload(params, async function(err, data) {
        if (err) {
            throw err;
        }
        const values = [fname,id,data.Location,todayDate,userid,data.Key];
        const ans = await client.query(upMeta, values);

        res.status(201).json(ans.rows[0]);
        console.log(`File uploaded successfully. ${data.Location}`);
    });
    
})

app.get('/v1/user/self/pic',async (req, res) => {
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    const value = [username];
    let sqlstr = `SELECT * FROM custuser WHERE username = $1`
    const ans = await client.query(sqlstr,value);
    const userid = ans.rows[0].user_uid;
    console.log('userid',userid);
    const val = [userid];
    let getProfileQuery = `SELECT * from usermetadata where user_id = $1`
    client.query(getProfileQuery,val,(err, result) => {
        if(err){
            console.log('err in get profile',err);
            res.status(400);
        }else if(result.rowCount < 1){
            res.status(404);
        }else{
            console.log('success');
            res.status(200).json(result.rows);
        }
    })
    
})

app.delete('/v1/user/self/pic', async (req, res) => {
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    const value =[username];
    let sqlstr = `SELECT user_uid FROM custuser WHERE username = $1`
    let kquery = `SELECT keypath FROM usermetadata WHERE user_id = $1`
    let delrecord = `DELETE FROM usermetadata WHERE user_id = $1;`
    const ans = await client.query(sqlstr,value);
  
    const val = [ans.rows[0].user_uid]
    const result = await client.query(kquery,val);
    const kname = result.rows[0].keypath;
    if(kname.rowCount < 1){
        res.status(404);
    }

    console.log('uid ',ans.rows[0].user_uid);
    const deleteParam = {
        Bucket: process.env.S3_BUCKET,
        Key: kname,
      };
    
    s3.deleteObject(deleteParam, async function(err, data) {
        if (err) console.log(err, err.stack);
        
        const rec = await client.query(delrecord,val);
       console.log('in del object',data);
        res.sendStatus(204);


    });
        client.end;

})

module.exports = app; 