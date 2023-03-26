const express = require('express')
const isLoggedIn = require('../middlewares/auth')
const router = new express.Router()
const pool = require('../../db/postresql')

router.get('/tags/add', (req,res) => {
    res.render('tags/add_tag')
})

router.post('/tags/save', isLoggedIn, async(req,res) => {

    try {
      const query = `INSERT INTO tags(name)
      VALUES($1)`;

      const values = [req.body.name];
      
      await pool.query(query,values);

      res.redirect('/tags/all')

    } catch(e) {
      console.log(e)
      res.status(401).send(e)
    }

})

router.get('/tags/all',  isLoggedIn, async(req,res) => {

    const query = `SELECT * FROM tags`;
    const {rows:tags } = await pool.query(query)

    res.render('tags/tags', {
      tags:tags
    })

})

router.get('/tags/edit/:id', isLoggedIn, async(req,res) => {

    try {
      const query = `SELECT * FROM tags WHERE id=${req.params.id}`;
      const { rows: [tag] } = await pool.query(query)

      res.render("tags/edit_tag", {
        tag: tag
      })

    } catch(e) {
      res.status(404).send(e)
    }
})

router.post('/tags/update', isLoggedIn, async(req,res) => {

  try {

    const query = `UPDATE tags SET name=$1 WHERE id=$2`;
    const values = [req.body.name, req.body.id]
    await pool.query(query,values);

    res.redirect('/tags/all')

  } catch(e) {
    console.log(e)
    res.status(500).send(e)
  }

})

router.get('/tags/delete/:id', isLoggedIn, async(req,res) => {

try {

  const getTag = `SELECT * FROM tags WHERE id=$1`;
  const tagValue = [req.params.id]
  const { rows: [tag] } = await pool.query(getTag, tagValue)

  const newsTagQuery = `SELECT * FROM news_tags WHERE tag_id=$1`;
  const newsTagValues = [ tag.id ]
  const { rows: newsTags } = await pool.query(newsTagQuery, newsTagValues)

  if(newsTags.length > 0 ) {
    const deleteNewsTagQuery = `DELETE FROM news_tags WHERE tag_id=$1`;
    await pool.query(deleteNewsTagQuery, tagValue)
  }

  const deleteTagQuery = `DELETE FROM tags WHERE id=$1`;
  await pool.query(deleteTagQuery, tagValue)

  res.status(200).send()

} catch(e) {
    console.log(e)
    res.status(500).send(e)
}


})

module.exports = router