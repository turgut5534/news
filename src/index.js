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

const publicDirectory = path.join(__dirname, '../public')
const viewsDirectory = path.join(__dirname, '../templates/views')

app.set('view engine', 'hbs')
app.set('views', viewsDirectory)
app.use(express.static(publicDirectory))
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// app.get('/', async(req,res) => {

//     try {
//         const allUsers = `SELECT * FROM users`;
//         const {rows:users } =await pool.query(allUsers)
    
//         res.json(users)
//     } catch(error) {
//         console.log(error)
//         res.status(500).json({"message" : "Something went wrong"})
//     }

// })

app.get('/', (req,res) => {

    if(!req.user) {
        return res.redirect('/login')
    }

    res.redirect('/news/all')
})

app.get('/profile', (req,res) => {
    res.json({
        "email" : req.user
    })
})

app.get('/news/write', (req,res) => {
    res.render('news_write')
})

app.get('/news/all', async(req,res) => {
    res.render('news')
})

app.get('/login', (req,res) => {
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

app.listen(port, ()=> {
    console.log(`Server is up on ${port}`)
})

