const express = require('express')
const app = express()
const hbs = require('hbs')
const port = process.env.PORT || 3000
const path = require('path')
const pool = require('../db/postresql');
const bodyParser = require('body-parser')
const passport = require('./utils/passport')
const bcrypt = require('bcrypt')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const isLoggedIn = require('./middlewares/auth')
const multer = require('multer')
const sanitizeHtml = require('sanitize-html')

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

app.get('/', isLoggedIn, (req,res) => {

    res.redirect('/news/all')
})

app.get('/news/write', (req,res) => {
    res.render('news_write')
})

app.get('/edit/:id', async(req,res) => {

    try {
      const query = `SELECT * FROM news WHERE id=${req.params.id}`;
      const { rows:news } = await pool.query(query);
      res.render('news_edit', {
        news: news[0]
      })
    } catch(e) {
      console.log(e)
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
                  SET title=$1, description=$2, author = $3 ,lang=$4, updated_data= $5
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

    try {
      const query = `SELECT * FROM news`;
      const { rows:news } = await pool.query(query)

      const sanitizedData = news.map(item => ({
        ...item,
        description: sanitizeHtml(item.description, { allowedTags: [], allowedAttributes: [] })
      }));

      res.render('news', {
        news: sanitizedData
      })
    } catch(e) {
      res.send('Hata')
    }

})

app.get('/create', async(req,res) => {

    try {
      const query = `CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author INTEGER NOT NULL REFERENCES users(id),
        image VARCHAR(255),
        url VARCHAR(255),
        lang VARCHAR(4),
        published_date TIMESTAMP DEFAULT NOW(),
        updated_data TIMESTAMP,
        category VARCHAR(50) NOT NULL
      );`

      await pool.query(query)

      return res.json({"status": "Table was created"})
    }

    catch(e) {
      return res.json({"status": "Error"})
    }
})

app.get('/login', (req,res) => {

    if(req.user) {
      return res.json({"message" : "You are already logged in"})
    }

    return res.render('login')
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

    console.log(req.body)
    
    const { title, description, lang} = req.body

    try {

      const query = `INSERT INTO news (title, description, author, image, url, lang, published_date, updated_data, category)
      VALUES ($1, $2, $3, $4, $5,$6,'2022-03-22 12:30:00', '2022-03-23 08:15:00', 'Health');
      `;
      
      const values = [title, description, 1, req.file.filename, req.file.filename, lang]
  
      await pool.query(query, values)
  
      res.send('ok')

    } catch(e) {
      console.log(e)
      res.status(401).send(e)
    }

  });
  

app.listen(port, ()=> {
    console.log(`Server is up on ${port}`)
})

