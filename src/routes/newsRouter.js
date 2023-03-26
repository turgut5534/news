const express = require('express')
const multer = require('multer')
const isLoggedIn = require('../middlewares/auth')
const router = new express.Router()
const passport = require('../utils/passport')
const pool = require('../../db/postresql')
const path = require('path')
const fs = require('fs')

const uploadDirectory = path.join(__dirname, '/../../uploads')

router.get('/', isLoggedIn, (req,res) => {

    res.redirect('/news/all')
})

router.get('/news/write', async(req,res) => {

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

router.get('/edit/:id', async(req,res) => {

    try {
      const query = `SELECT * FROM news WHERE id=${req.params.id}`;
      const { rows:news } = await pool.query(query);
      res.render('news/edit-news', {
        news: news[0]
      })
    } catch(e) {
      console.log(e)
    }
    
})

router.get('/delete/:id', async(req,res) => {

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

router.post('/update', async(req,res) => {
  
  const { id, title, description, lang} = req.body
  
  try {

    const getTheNews = `SELECT * FROM news WHERE id=$1`;
    const getId = [id]
    const { rows: theNews } = await pool.query(getTheNews, getId)

    if(theNews.length == 0) {
      return res.send('Haber bulunamadı')
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

router.get('/news/all' ,async(req,res) => {

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
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
  
  const upload = multer({ storage: storage });
  
  router.post('/save', upload.single('image'), async(req, res) => {
    
    const { title, description, lang, tags} = req.body

    try {

      const query = `INSERT INTO news (title, description, author, image, lang, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5,'2022-03-22 12:30:00', '2022-03-23 08:15:00') RETURNING id
      `;
      
      const values = [title, description, 1, req.file.filename, lang]
  
      const { rows: [newsRow] } = await pool.query(query, values)

      const newsId = newsRow.id;
      
      // if (!tags || tags.length === 0) {
      //   res.status(400).json({ message: 'Tags array is empty or undefined' });
      //   return;
      // }

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

      console.log('asd')

      res.redirect('/news/all')

    } catch(e) {
      console.log(e)
      res.status(401).send(e)
    }

  });


  module.exports = router