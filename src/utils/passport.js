const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');

const db = require('../../db/postresql'); // assuming you have a separate file to establish the database connection

function verifyPassword(inputPassword, storedPasswordHash, storedPasswordSalt) {

    storedPasswordHash = Buffer.from(storedPasswordHash)
    storedPasswordSalt = Buffer.from(storedPasswordSalt)

    const hmac = crypto.createHmac('sha512', storedPasswordSalt);
    const computeHash = hmac.update(inputPassword).digest('hex');
    
    const isMatched = Buffer.from(computeHash, 'hex').equals(storedPasswordHash);

    return isMatched
  }

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    const user = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);

    if (!user || !user.rows || user.rows.length === 0) {
        return done(null, false, { message: 'Mail veya şifre hatalı.' });
    }
   
    const passwordQuery = `SELECT * FROM user_password WHERE user_id=$1`;
    const passwordValues = [user.rows[0].id];
    const { rows: [dbPassword] } = await db.query(passwordQuery, passwordValues);

    const passwordMatch = await verifyPassword(password.toString(), dbPassword.hash_pass, dbPassword.salt_pass);


    if (!passwordMatch) {
        return done(null, false, { message: 'Mail veya şifre hatalı' });
    }
    return done(null, user.rows[0]);
}));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await db.query('SELECT * FROM "user" WHERE id = $1', [id]);
    done(null, user.rows[0]);
});

module.exports = passport;