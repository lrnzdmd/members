const pool = require('./db/pool');
const queries = require('./db/queries')
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

app.get('/', async (req, res) => {
    const messages = await queries.getAllMessages();
    res.render('index', {messages:messages});
});

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

app.post('/sign-up', async (req, res, next) => {
    try {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            if (err) {
                return next(err);
            }
            try {
                await queries.newUser(req.body.username, req.body.fullname, hashedPassword);
            res.redirect('/');
            } catch (error) {
                return next(error);
            }

            
        })
    } catch (error) {
        return next(error);
    }
})

app.post('/new-message', async (req, res) => {
    
    try {
       await queries.newMessage(req.body.title, req.user.id, req.body.message);
       res.redirect('/');
    } catch (error) {
        return next(error);
    }
})

app.get('/delete/message', async (req, res) => {
    if (req.user && req.user.memberstatus === 'Admin') {
        await queries.deleteMessage(req.query.msgid);
        res.redirect('/');
    } else {
        res.redirect('*');
    }
})

app.get('/edit/message', async (req, res) => {
    if (req.user && req.user.memberstatus === 'Admin') {
        const message = await queries.getMessageById(req.query.msgid);
        res.render('editMsg', {message: message});
    } else {
        res.redirect('*');
    }
})

app.post('/edit/message', async (req, res) => {
    if (req.user && req.user.memberstatus === 'Admin') {
        await queries.editMessage(req.body.id, req.body.title, req.body.message);
        res.redirect('/');
    } else {
        res.redirect('*');
    }
})

app.get('/youarewelcometojointhesecretclub', async (req,res) => {
    if (req.user.memberstatus === 'User') {
        await queries.userUpgrade(req.user.id);
        res.redirect('/');
    } else {
        res.redirect('*');
    }
})


app.get('*', (req, res) => {
    res.render('404');
})



app.listen(3000, () => console.log('Server listening on port 3000'));