const express = require('express')
const router = new express.Router()
const pool = require('../../db/postresql')

router.get('/api/news', async (req, res) => {
    try {
      let query = 'SELECT * FROM news';
      const params = [];
  
      if (req.query.lang) {
        params.push(req.query.lang);
        query += ` WHERE lang = $${params.length}`;
      }
  
      if (req.query.author) {
        params.push(req.query.author);
        if (params.length === 1) {
          query += ` WHERE author = $${params.length}`;
        } else {
          query += ` AND author = $${params.length}`;
        }
      }
  
      const { rows } = await pool.query(query, params);

      const news = rows.map((row) => ({
        id: row.id,
        author: row.author,
        title: row.title,
        description: row.description,
        image: `${req.protocol}://${req.get('host')}/${row.image}`,
        like_count: row.like_count,
        dislike_count: row.dislike_count,
        lang: row.lang,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      if(news.length == 0 ) {
        return res.json( {"status" : false, "message" : "Haber bulunamadı"} )
      }
  
      res.json(news);
    } catch (e) {
      res.status(500).send(e);
    }
  });
  

module.exports = router