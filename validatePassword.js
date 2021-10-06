const bcrypt = require('bcrypt');
const client = require('./connection.js')

// query database for user's password
function validatePassword(username, password) {
    return new Promise(function (resolve, reject) {
        var statement = "SELECT password FROM public.user where username = $1";
        var values = [username];

        client.query(statement, values, function (err, res) {
            // console.log(res);
            var hash = res.rows[0].password;

            //compare hash and password
            bcrypt.compare(password, hash, function (err, result) {
                // execute code to test for access and login
                console.log("in validate method: " + result)

                return result
            })
        });
    })
}

module.exports = validatePassword