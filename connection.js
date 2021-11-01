console.log(process.env)
const {Client} = require('pg')

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    port: process.env.PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // bucketname: process.env.S3_BUCKET
    // host: "localhost",
    // user: "newuser",
    // port: 5432,
    // password: "password",
    // database: "postgres"
})

module.exports = client