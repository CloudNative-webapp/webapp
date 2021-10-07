const client = require('./connection.js')
const express = require('express');
const app = express();
const Api404Error = require('./api404Error')
const Api401Error = require('./api401Error')
const Api400Error = require('./api400Error')
const Api403Error = require('./api403Error')
const validatePassword = require('./validatePassword')

//include bcrypt module
const bcrypt = require('bcrypt');

//Set a value for saltRounds
const saltRounds = 10;

app.listen(5000, () => {
    console.log("Sever is now listening at port 5000");
})

client.connect();

const bodyParser = require("body-parser"); //To access request body as JSON
const {
    error
} = require('console');
const {
    application
} = require('express');
app.use(bodyParser.json());


function emailIsValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}


//get all users
app.get('/users', (req, res, next) => {

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
                    // res.send(result.rows,res.statusCode);
                    // res.status(res.statusCode).send(result.rows)

                }
                console.log('select query:' + result.rows)
                delete result.rows[0]['password']
                res.status(200).json(result.rows)
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
app.post('/createUser', (req, res) => {
    let d = new Date();
    const userReq = req.body;
    var password = userReq.password;
    let sqlString = `INSERT INTO public.user (username, password, first_name, last_name, account_created, account_updated) VALUES ($1, $2, $3, $4, $5, $6)`

    try {
        if (!emailIsValid(userReq.username)) {
            res.status(400).send('Bad request')
            throw new Api404Error('username not valid')
        } else {

            //generate  a salt and hash the password
            bcrypt.hash(password, saltRounds, function (err, hash) {
                const values = [userReq.username, hash, userReq.firstname, userReq.lastname, d, d];
                client.query(sqlString, values, (err, result) => {
                    // if(userReq.username == null){
                    //     res.status()
                    //     throw new Api404Error(`User with username: ${userReq.username} not found`)
                    // }
                    // else 
                    try {
                        if (err) {
                            // res.status(400).send('Bad request')

                            res.status(403).json({
                                status: 403,
                                error: "Username Already Exists"
                            })
                            throw new Api403Error(`Username: ${userReq.username}`)
                        } else {
                            res.status(201).json(result.rows)
                        }
                    } catch (error) {
                        console.log(error)
                    }
                });
            });
        }
    } catch (error) {
        console.log(error)
    }

    client.end;
})

//update details of user
app.put('/users/updateUser', (req, res) => {
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [uname, passwd] = credentials.split(':');

    let {
        username,
        password,
        firstname,
        lastname
    } = req.body;
    let d = new Date();
    console.log(firstname);

    //let updateQuery = 'UPDATE public.user SET password = $1, first_name = $2, last_name = $3, account_updated = $4 WHERE username = $5'

    let newquery = 'UPDATE public.user SET password = COALESCE(NULLIF($1, \'\'), password), first_name = COALESCE(NULLIF($2, \'\'), first_name), last_name = COALESCE(NULLIF($3, \'\'), last_name), account_updated = $4 WHERE username = $5'

    try {
        if (req.body.accountCreated || req.body.accountUpdated) {
            console.log('here')
            // res.status(400).send('Bad request')
            res.status(400).json({
                status: 400,
                error: 'Bad Request'
            })
            throw new Api400Error(`Updated field not allowed`)
        } else if (validatePassword(uname, passwd)) {

            // if(!passwordUser){
            bcrypt.hash(password, saltRounds, function (err, hash) {
                const values = [hash, firstname, lastname, d, username];
                client.query(newquery, values, (err, result) => {
                    if (result.status(200)) {
                        // res.status(204).send('Update successful')
                        // console.log(result);
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
            // res.status(400).send('Bad request')
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

module.exports = app;