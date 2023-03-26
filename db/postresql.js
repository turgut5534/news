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

const addTables = async() => {

    const newsTableQuery = `CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        author INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(255),
        like_count INTEGER DEFAULT 0,
        dislike_count INTEGER DEFAULT 0,
        lang VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`;

const tagsQuery = `CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );`;

const newsTagQuery = `CREATE TABLE news_tags (
        id SERIAL PRIMARY KEY,
        news_id INTEGER NOT NULL REFERENCES news(id),
        tag_id INTEGER NOT NULL REFERENCES tags(id)
      );`;

      try {

        await pool.query(newsTableQuery)
        await pool.query(tagsQuery)
        await pool.query(newsTagQuery)

        console.log('Tables are created successfully')

      } catch(e) {
        console.log(e)
      }
}

// addTables()
//   .then(() => console.log('Tables are created successfully'))
//   .catch((err) => console.error('Error creating tables', err))
//   .finally(() => pool.end());


module.exports = pool;