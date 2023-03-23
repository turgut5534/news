const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chat',
    password: 'Busra!keles!1',
    port: 5432,
})

// const pool = new Pool({
//     user: 'postgres',
//     host: '45.79.250.159',
//     database: 'touridetestdb',
//     password: 'Tl5PThsBkAhKExs',
//     port: 5432,
// })


module.exports = pool;