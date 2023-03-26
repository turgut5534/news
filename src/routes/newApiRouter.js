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
  
      const { rows: news } = await pool.query(query, params);

      if(news.length == 0 ) {
        return res.json( {"status" : false, "message" : "Haber bulunamadı"} )
      }
  
      res.json(news);
    } catch (e) {
      res.status(500).send(e);
    }
  });
  

module.exports = router