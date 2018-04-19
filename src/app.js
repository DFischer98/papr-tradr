/*
* Author: Daniel Fischer
* NetID: daf452
* CSCI UA 480 Final Project
* Tradify: Paper Trading WebApp
*/

//requires
const config     = require('../config/config.js');
const express    = require('express');
const mongoose   = require('mongoose');
const path       = require('path');
const moment     = require('moment');
const exphbs     = require('express-handlebars');
const session    = require('express-session');
const passport   = require('passport')
require('../config/passport')(passport);
require('./db');

//config
const app = express();
app.use(express.static(path.join(__dirname,'../','public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: config.get('sessionSecret') })); // session secret
app.use(passport.initialize());
app.use(passport.session());

//setup handlebars helpers
const hbs = exphbs.create({
    helpers: {
        formatDateTime: function (value) { return moment(value).format("MM-DD-YY HH:mm"); }
    },
    defaultLayout: 'main',
    extname: '.hbs'
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

//init
const User = mongoose.model('User');
const Trade = mongoose.model('Trade');
moment().format();

//render homepage
app.get('/', (req, res) => {
    Trade.find({}, (err, result) => {
        if (result){
            let count = result.length;

            result.formattedTime = moment(result.time, "MM-DD-YY HH:MM");
            res.render('index', {trade : result, count : count});
        }
    })
});

app.post('/', (req, res) => {
    const newTrade = Trade({
        ticker: req.body.ticker,
        action: req.body.action
    });

    newTrade.save((err, newObj) => {
        if (!err){
            res.redirect('/');
        }
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
}));

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    console.log('success');
});

app.get('/logout', (req, res) => {
    req.logout();
    res.render('logout');
});

app.listen(config.get('port'));

//auth middleware
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, continue
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the login
    res.redirect('/login');
}
