const pool = require('./db/pool');
const bcrypt = require('bcryptjs');
const path = require('node:path')
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    store: new pgSession({
    pool : pool
  }),
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

app.use(passport.session());
app.use(express.urlencoded({extended: false}));

passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const { rows } = await pool.query("SELECT * FROM users WHERE username = $1;", [username]);
                const user = rows[0];
                if (!user) {
                    return done(null, false, { message: 'incorrect username'});
                }

                const match = await bcrypt.compare(password, user.password);

                if (!match) {
                    return done(null,false, {message: 'incorrect password'});
                }

                return done (null, user);

            } catch (error) {
                return done(err);
            }
        })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id,done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1",[id]);
        const user = rows[0];

        done(null, user);

    } catch (error) {
        done(error);
    }
});

app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    next();
})







// ----------Views Render--------------

app.get('/', (req, res) => res.render('index'));

app.get('/log-in', (req, res) => res.render('log-in'));

app.post('/log-in', 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/'
    })
);

app.get('/log-out', (req,res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        } 
        res.redirect('/');
    });
});

app.get('/sign-up', (req, res) => res.render('sign-up'));

app.post('/sign-up', (req, res, next) => {
    try {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            if (err) {
                return next(err);
            }
            try {
                await pool.query("INSERT INTO users (username, password) VALUES ($1,$2);",[req.body.username, hashedPassword]);
            res.redirect('/');
            } catch (error) {
                return next(error);
            }

            
        })
    } catch (error) {
        return next(error);
    }
})



app.listen(3000, () => console.log('Server listening on port 3000'));