const bcrypt = require('bcrypt');
const client = require('./connection.js')

// query database for user's password
async function validatePassword(username, password) {
        var statement = "SELECT password FROM public.user where username = $1";
        var values = [username];
        try{
             const res = await client.query(statement, values)
             try{
                if(res.rows === undefined || res.rows == null || res.rows.length <= 0){
                    
                    throw new Api401Error('Authentication Failed')
                
                }
             }catch(err){
                 return false;
                 console.log("error")
             }
             var hash = res.rows[0].password;
            
            return await bcrypt.compare(password, hash)
    }catch(err){
        console.log(err)
    }
}

module.exports = validatePassword