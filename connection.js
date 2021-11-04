console.log(process.env)
const {Client} = require('pg')

const client = new Client({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USERNAME || "newuser",
    port: process.env.PORT || 5432,
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "postgres",
    // bucketname: process.env.S3_BUCKET
    // host: "localhost",
    // user: "newuser",
    // port: 5432,
    // password: "password",
    // database: "postgres"
})

module.exports = client