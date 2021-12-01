console.log(process.env)
const {
    Client
} = require('pg')

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

const clientRead = new Client({
    host: process.env.DB_HOST_REPLICA || "localhost",
    user: process.env.DB_USERNAME || "newuser",
    port: process.env.PORT || 5432,
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "postgres",
})

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
//     dialect: 'postgres',
//     port: 5432,
//     replication: {
//       read: [
//         { host: DB_HOST_REPLICA},
//       ],
//       write: { host: process.env.DB_HOST}
//     },
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 3000,
//         idle: 10000
//     }
//   })

exports.client = client
exports.clientRead = clientRead