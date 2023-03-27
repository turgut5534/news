const express = require('express')
const multer = require('multer')
const isLoggedIn = require('../middlewares/auth')
const router = new express.Router()
const passport = require('../utils/passport')
const pool = require('../../db/postresql')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');

const uploadDirectory = path.join(__dirname, '/../../uploads')

router.get('/', isLoggedIn, (req,res) => {

    res.redirect('/news/all')
})

router.get('/news/write', isLoggedIn,  async(req,res) => {

    try {

      const tagQuery = `SELECT * FROM tags`;

      const { rows:tags } = await pool.query(tagQuery);

      res.render('news/add_news', {
        tags: tags
      })
    } catch(e) {
      res.status(401).send(e)
    }
    
})

router.get('/edit/:id', isLoggedIn, async(req,res) => {

    try {
      // const query = `SELECT * FROM news WHERE id=${req.params.id}`;
      const query = `
      SELECT news.id, news.title, news.description, news.image, news.lang , news.created_at, news.updated_at, 
      COALESCE(array_agg(tags.name), '{}') as tags 
      FROM news
      LEFT JOIN news_tags ON news.id = news_tags.news_id
      LEFT JOIN tags ON news_tags.tag_id = tags.id
      WHERE news.id = $1
      GROUP BY news.id, news.title, news.description, news.image, news.created_at, news.updated_at;
    `;
      const values = [req.params.id]
      const { rows } = await pool.query(query,values);

      const news = rows.map((row) => ({
        id: row.id,
        author: row.author,
        title: row.title,
        description: row.description,
        image: row.image,
        like_count: row.like_count,
        dislike_count: row.dislike_count,
        lang: row.lang,
        created_at: row.created_at,
        updated_at: row.updated_at,
        tags: row.tags,
      }));

      console.log(news)
      res.render('news/edit-news', {
        news: news[0]
      })
    } catch(e) {
      console.log(e)
    }
    
})

router.get('/delete/:id', isLoggedIn, async(req,res) => {

  console.log(req.params.id)

  try {
    const getNew = `SELECT * FROM news WHERE id=$1`;
    const deleteNew = `DELETE FROM news WHERE id=$1`;
    const value = [req.params.id]
    const { rows:[news] } = await pool.query(getNew, value)

    if(news.image) {

      const path = uploadDirectory + '/' + news.image
      await fs.promises.unlink(path)
      
    }

    const getTags = `DELETE FROM news_tags WHERE news_id=$1`;
    const tagValues = [news.id]
    await pool.query(getTags, tagValues)
 
    await pool.query(deleteNew, value)

    res.status(200).json({"status" : true})
    
  } catch(e) {
    console.log(e)
    res.status(401).send(e)
  }

})

router.post('/update', isLoggedIn, async(req,res) => {
  
  const { id, title, description, lang} = req.body
  
  try {

    const getTheNews = `SELECT * FROM news WHERE id=$1`;
    const getId = [id]
    const { rows: theNews } = await pool.query(getTheNews, getId)

    if(theNews.length == 0) {
      return res.status(500).send()
    }

    const query = `UPDATE news 
                  SET title=$1, description=$2, author = $3 ,lang=$4, updated_at= $5
                  WHERE id=$6 `;
    
    const values = [title, description, 1, lang, new Date().toISOString(), id]

    await pool.query(query, values)

    res.redirect('/news/all')

  } catch(e) {
    console.log(e)
    res.send(e)
  }

})

router.get('/news/all' , isLoggedIn, async(req,res) => {

    try {
      const query = `SELECT * FROM news`;
      const { rows:news } = await pool.query(query)

      res.render('news/all', {
        news: news
      })
    } catch(e) {
        console.log(e)
      res.status(401).send(e)
    }

})

router.get('/login', (req,res) => {

    if(req.user) {
      return res.json({"message" : "You are already logged in"})
    }

    return res.render('login/login')
})

router.get('/logout', (req,res) => {

  req.logout((err) => {
      if(err) {
          return next(err)
      }
  });
  res.redirect('/login')
})

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }

      const { email, password } = req.body

      if(!email || !password) {
        return res.status(401).json({ message: 'Tüm alanlar zorunludur.' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Mail veya şifre hatalı' });
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.status(200).json({ message: 'Giriş Başarılı!' });
      });
    })(req, res, next);
  });

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, uniqueId + ext);
    }
  });
  
  const upload = multer({ storage: storage });
  
  router.post('/save', isLoggedIn, upload.single('image'),  async(req, res) => {
    
    const { title, description, lang, tags} = req.body

    try {

      const query = `INSERT INTO news (title, description, author, image, lang, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5,$6, $7) RETURNING id
      `;
      
      const values = [title, description, 1, req.file.filename, lang, new Date().toISOString('tr-TR'), new Date().toISOString('tr-TR')]
  
      const { rows: [newsRow] } = await pool.query(query, values)

      if (!tags || tags.length === 0) {
        return res.redirect('/news/all')
      }

      const newsId = newsRow.id;
      
      const tagInsertQuery = `INSERT INTO news_tags(news_id, tag_id)
      SELECT $1, id FROM tags WHERE name = ANY($2)`;
      const tagInsertValues = [newsId, tags];
      await pool.query(tagInsertQuery, tagInsertValues);

      for(const tag of tags) {

        const getTagQuery = `SELECT * FROM tags WHERE id=$1`;
        const getTagValue = [tag]
        const { rows: [gotTag] } = await pool.query(getTagQuery,getTagValue);

        const tagInsertQuery = `INSERT INTO news_tags(news_id, tag_id)
        VALUES($1, $2)`;
        const values = [newsId, gotTag.id]
        await pool.query(tagInsertQuery, values)

      }

      res.redirect('/news/all')

    } catch(e) {
      console.log(e)
      res.status(401).send(e)
    }

  });


  module.exports = router