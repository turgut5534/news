require('dotenv').config()

const { Pool } = require('pg')

// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'chat',
//     password: 'Busra!keles!1',
//     port: 5432,
// })

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

const addTables = async() => {

    const newsTableQuery = `CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        author INTEGER NOT NULL REFERENCES "user"(id),
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

    const newsTagQuery = `CREATE TABLE IF NOT EXISTS news_tags (
            id SERIAL PRIMARY KEY,
            news_id INTEGER NOT NULL REFERENCES news(id),
            tag_id INTEGER NOT NULL REFERENCES tags(id)
          );`;

    const newsReactionQuery = `CREATE TABLE IF NOT EXISTS news_reaction (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES "user"(id),
            news_id INTEGER REFERENCES news(id),
            action_type INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );`;

      try {

        await pool.query(newsTableQuery)
        await pool.query(tagsQuery)
        await pool.query(newsTagQuery)
        await pool.query(newsReactionQuery)

      } catch(e) {
        console.log(e)
      }
}

// addTables()
//   .then(() => console.log('Tables are created successfully'))
//   .catch((err) => console.error('Error creating tables', err))
//   .finally(() => pool.end());


module.exports = pool;