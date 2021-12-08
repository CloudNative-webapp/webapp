console.log(process.env)
const {
    Client
} = require('pg')
const fs = require('fs');
const rdsCrt = fs.readFileSync('./prod_snehalchavan_me.ca-bundle');

const client = new Client({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USERNAME || "newuser",
    port: process.env.PORT || 5432,
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "postgres",
    ssl: {
        rejectUnauthorized: true,
        ca: [rdsCrt]
    },
})

const clientRead = new Client({
    host: process.env.DB_HOST_REPLICA || "localhost",
    user: process.env.DB_USERNAME || "newuser",
    port: process.env.PORT || 5432,
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "postgres",
    ssl: {
        rejectUnauthorized: true,
        ca: [rdsCrt]
    },
})


exports.client = client
exports.clientRead = clientRead