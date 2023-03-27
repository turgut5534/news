const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');

const db = require('../../db/postresql'); // assuming you have a separate file to establish the database connection

async function validatePassword(password, hash, salt) {
    const hashVerify = crypto.createHmac('sha512', salt);
    hashVerify.update(password);
    const value = hashVerify.digest('hex');
    return value === hash;
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

    const hexSaltString = dbPassword.salt_pass.toString('hex')
    const saltBuffer = Buffer.from(hexSaltString, 'hex')
    const convertedSalt = saltBuffer.toString()

    const hexPasswordString = dbPassword.hash_pass.toString('hex')
    const passwordBuffer = Buffer.from(hexPasswordString, 'hex')
    const convertedPassword = passwordBuffer.toString()

    // const passwordMatch = await bcrypt.compare(password.toString(), hashedPassword.toString());
    const passwordMatch = await validatePassword(password.toString(), convertedPassword, convertedSalt);


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