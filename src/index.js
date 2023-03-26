const express = require('express')
const app = express()
require('./configs/hbsconfig')
const port = process.env.PORT || 3000
const path = require('path')
const pool = require('../db/postresql');
const bodyParser = require('body-parser')
const passport = require('./utils/passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const isLoggedIn  = require('./middlewares/auth')
const multer = require('multer')
const sanitizeHtml = require('sanitize-html')
const fs = require('fs')
const { query } = require('express')

const publicDirectory = path.join(__dirname, '../public')
const viewsDirectory = path.join(__dirname, '../templates/views')
const uploadDirectory = path.join(__dirname, '/../uploads')


app.set('view engine', 'hbs')
app.set('views', viewsDirectory)
app.use(express.static(publicDirectory))
app.use(express.static(uploadDirectory))
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


app.get('/', isLoggedIn, (req,res) => {

    res.redirect('/news/all')
})

app.get('/news/write', async(req,res) => {

    try {

      const tagQuery = `SELECT * FROM tags`;

      const { rows:tags } = await pool.query(tagQuery);

      res.render('add_news', {
        tags: tags
      })
    } catch(e) {
      res.status(401).send(e)
    }
    
})

app.get('/edit/:id', async(req,res) => {

    try {
      const query = `SELECT * FROM news WHERE id=${req.params.id}`;
      const { rows:news } = await pool.query(query);
      res.render('edit-news', {
        news: news[0]
      })
    } catch(e) {
      console.log(e)
    }
    
})

app.get('/delete/:id', async(req,res) => {

  console.log(req.params.id)

  try {
    const getNew = `SELECT * FROM news WHERE id=$1`;
    const deleteNew = `DELETE FROM news WHERE id=$1`;
    const value = [req.params.id]
    const { rows:news } = await pool.query(getNew, value)

    if(news[0].image) {

      const path = uploadDirectory + '/' + news[0].image
      await fs.promises.unlink(path)
      
    }
 
    await pool.query(deleteNew, value)

    res.status(200).json({"status" : true})
    
  } catch(e) {
    res.status(401).send(e)
  }

})

app.post('/update', async(req,res) => {
  
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

app.get('/news/all' ,async(req,res) => {

  console.log(req.locals)

    try {
      const query = `SELECT * FROM news`;
      const { rows:news } = await pool.query(query)

      const sanitizedData = news.map(item => ({
        ...item,
        description: sanitizeHtml(item.description, { allowedTags: [], allowedAttributes: [] })
      }));

      res.render('all', {
        news: sanitizedData
      })
    } catch(e) {
      res.send('Hata')
    }

})

app.get('/login', (req,res) => {

    if(req.user) {
      return res.json({"message" : "You are already logged in"})
    }

    return res.render('login')
})

app.get('/logout', (req,res) => {

  req.logout((err) => {
      if(err) {
          return next(err)
      }
  });
  res.redirect('/login')
})

app.post('/login', function(req, res, next) {
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
  
  app.post('/save', upload.single('image'), async(req, res) => {
    
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


app.listen(port, ()=> {
    console.log(`Server is up on ${port}`)
})

