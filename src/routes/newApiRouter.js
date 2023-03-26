const express = require('express')
const router = new express.Router()
const pool = require('../../db/postresql')

router.get('/api/news', async(req,res) => {

    try {
        const query = `SELECT * FROM news`;
        const { rows: news } = await pool.query(query)

        res.json(news)
     
    } catch(e) {
        res.status(500).send(e)
    }


})

module.exports = router