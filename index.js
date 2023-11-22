const express = require('express');
const router = express.Router();
const passport = require('passport');
const session = require('express-session');
const monk = require('monk');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

var db = monk("localhost:27017/A4");
var users = db.get('Users');

db.on('open', () => {
    console.log('MongoDB connected');
});

db.on('error', (err) => {
    console.error('Error connecting to MongoDB:', err);
});

router.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true, 
}));

router.use(passport.initialize())
router.use(passport.session())

passport.use(new LocalStrategy(async(username, password, done) =>{
    try{
    const user = await users.findOne({username: username});
    if(!user){ return done(null, false, {message: 'User not found'});}
    if(await bcrypt.compare(password, user.password)) {return done(null, user);}
    else { return done(null, false, {message: 'Incorrect Password'});}
    }
    catch(e){
        return done(e);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.username)
});

passport.deserializeUser(async (username, done) => {
    try {
        const user = await users.findOne({ username: username });
        done(null, user);
    } catch (err) {
        done(err);
    }
});

checkAuth = (req, res, next) => {
    if(req.isAuthenticated()){ return next();}
    res.redirect("/login")
}

checkLoggedin = (req, res, next) => {
    if(req.isAuthenticated()){ return res.redirect("/home")}
    return next();
}

router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', checkLoggedin, (req, res)=>{
    res.render('login');
});

router.get('/register', checkLoggedin, (req, res)=>{
    res.render('register');
});

router.get('/home', checkAuth, (req, res)=>{
    res.render('home');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: "/home",
    failureRedirect: "/login",
}));

router.post('/register', async(req, res)=>{
    try{
        const existingUser = await users.findOne({ username: req.body.username });
        if (existingUser) {
            req.flash('error', 'Username already exists. Please choose a different one.');
            res.redirect('/register');
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const inserted = await users.insert({
          username: req.body.username,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
          password: hashedPassword,
        });
        console.log('User inserted:', inserted);
        res.redirect('/login');
    } catch{
        res.redirect('/register');
    }
})

router.post("/logout", checkAuth, (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

module.exports = router;