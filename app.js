const client = require('./connection.js')
const express = require('express');
const app = express();
const Api404Error = require('./api404Error')
const Api400Error = require('./api400Error')
const validatePassword = require('./validatePassword')

//include bcrypt module
const bcrypt = require ('bcrypt');

//Set a value for saltRounds
const saltRounds = 10;

app.listen(5000, ()=>{
    console.log("Sever is now listening at port 5000");
})

client.connect();

const bodyParser = require("body-parser");  //To access request body as JSON
const { error } = require('console');
const { application } = require('express');
// const { randomUUID } = require('crypto');
app.use(bodyParser.json());


function emailIsValid (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
 }


//get all users
app.get('/users',(req, res, next) => {
    
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // var username = req.headers.authorization.username
    // var p = req.headers.authorization.password
    if(validatePassword(username,password)){
        const values=[username]
        client.query(`SELECT * FROM public.user WHERE username = $1`,values, (err, result)=>{
            if(err){
                console.log('Error'+error)
                // res.send(result.rows,res.statusCode);
                // res.status(res.statusCode).send(result.rows)
                
            }
            console.log('select query:'+result.rows)
            res.status(200).json(result.rows)
        });
    }else{
        res.status(400).send('Bad request')
        throw new Api404Error('invalid request')
    }
    
    
    
    client.end;

})

//create a new user
app.post('/createUser',(req, res)=>{
    let d = new Date();
    const userReq = req.body;
    var password = userReq.password;
    let sqlString = `INSERT INTO public.user (username, password, first_name, last_name, account_created, account_updated) VALUES ($1, $2, $3, $4, $5, $6)`

    if(!emailIsValid(userReq.username)){
        res.status(400).send('Bad request')
        throw new Api404Error('username not valid')
    }else{
    //generate  a salt and hash the password
    bcrypt.hash(password, saltRounds, function(err, hash) {
        const values = [userReq.username, hash, userReq.firstname, userReq.lastname, d, d];
        client.query(sqlString,values,(err,result) =>{
            if(userReq.username == null){
                res.status()
                throw new Api404Error(`User with username: ${userReq.username} not found`)
            }
            else if(err){
                // res.status(400).send('Bad request')
                res.status(400).json({
                    status : 400,
                    error :"Bad Request"
                })
                throw new Api400Error(`Username already exists`)
                // console.log('client.query(): username already exists')
                // res.status()
                // res.send({msg:'Bad request',status:res.status()})
                // return
                // throw error
                
            }
            if(res){
                // console.log('client.query():',result)
                res.status(201).json(result.rows)
                // res.sendStatus(status)
                
            }
            // res.status(201).json(result.rows)
        });
    });
}
    
    client.end;
})

//update details of user
app.put('/users/updateUser', (req, res)=> {
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [uname, passwd] = credentials.split(':');

    let { username, password, firstname, lastname } = req.body;
    let d = new Date();
    console.log(firstname);

    let updateQuery = 'UPDATE public.user SET password = $1, first_name = $2, last_name = $3, account_updated = $4 WHERE username = $5'

    // let newquery = 'UPDATE public.user SET password = COALESCE(NULLIF($1, ''), password), first_name = COALESCE(NULLIF($2, ''), first_name), last_name = COALESCE(NULLIF($3, ''), last_name), account_updated = COALESCE(NULLIF($4, ''), account_updated) WHERE username = $5'
    // if(!req.body.accountCreated){
    //     console.log('here')
    //     res.status(400).send('Bad request')
    //     throw new Api400Error(`Updated field not allowed`)
        
    // }else 
    if(validatePassword(uname,passwd)){
        
        // if(!passwordUser){
            bcrypt.hash(password, saltRounds, function(err, hash) {
                const values = [hash, firstname, lastname, d, username];
                client.query(updateQuery, values, (err, result)=>{
                    if(!err){
                        res.status(200).send('Update was successful')
                        console.log(result);
                    }
                    else{ console.log(err.message) }
                });
                // passwordUser = hash;
                console.log(password+' pass and hash '+hash);
            });
        // }
        // const values = [passwordUser, firstname, lastname, d, name];
        // client.query(updateQuery, values, (err, result)=>{
        //     if(!err){
        //         res.status(200).send('Update was successful')
        //     }
        //     else{ console.log(err.message) }
        // });
        
    }else{
        res.status(400).send('Bad request')
        throw new Api404Error('invalid request')
    }
    
    client.end;
})