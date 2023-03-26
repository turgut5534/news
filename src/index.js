const express = require('express')
const app = express()
require('./configs/hbsconfig')
const port = process.env.PORT || 3000
const path = require('path')
const bodyParser = require('body-parser')
const passport = require('./utils/passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const newsRouter = require('./routes/newsRouter')

const publicDirectory = path.join(__dirname, '../public')
const viewsDirectory = path.join(__dirname, '../templates/views')
const uploadDirectory = path.join(__dirname, '/../uploads')


app.set('view engine', 'hbs')
app.set('views', viewsDirectory)
app.use(express.static(publicDirectory))
app.use(express.static(uploadDirectory))
app.use(bodyParser.urlencoded({extended: true}))
app.use(newsRouter)

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

app.listen(port, ()=> {
    console.log(`Server is up on ${port}`)
})

