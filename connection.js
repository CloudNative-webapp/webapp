const {Client} = require('pg')

const client = new Client({
    host: "localhost",
    user: "newuser",
    port: 5432,
    password: "password",
    database: "postgres"
})

module.exports = client