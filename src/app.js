/*
* Author: Daniel Fischer
* NetID: daf452
* CSCI UA 480 Final Project
* Tradify: Paper Trading WebApp
*/

//requires
const config           = require('../config/config.js');
const express          = require('express');
const mongoose         = require('mongoose');
const path             = require('path');
const moment           = require('moment');
const exphbs           = require('express-handlebars');
const session          = require('express-session');
const expressSanitized = require('express-sanitize-escape');
const passport         = require('passport')
const fetch            = require('node-fetch');
require('../config/passport')(passport);
require('./db');

//config
const app = express();
app.use(express.static(path.join(__dirname,'../','public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSanitized.middleware());
app.use(session({
    secret: config.get('sessionSecret'),
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

//setup handlebars helpers
const hbs = exphbs.create({
    helpers: {
        formatDateTime: function (value) { return moment(value).format("MM-DD-YY HH:mm"); },
        formatDate: function (value) { return moment(value).format("MM/DD/YY"); }
    },
    defaultLayout: 'main',
    extname: '.hbs'
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

// add req.user to every context object for templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

//auth middleware for selective use
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, continue
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the login
    res.redirect('/login');
}

//init
const User = mongoose.model('User');
const Trade = mongoose.model('Trade');
moment().format();

//render homepage
app.get('/', (req, res) => {
    Trade.find({}, (err, result) => {
        if (result){
            let count = result.length;
            res.render('index', {trade : result, count : count});
        }
    })
});

app.get('/login', (req, res) => {
    res.render('login');
});

/*
 * =========================
 *      AUTHENTICATION
 * =========================
 */
app.post('/login', passport.authenticate('local-login', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/profile');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
}));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

/*
 * =========================
 *      User Profiles
 * =========================
 */

app.get('/profile', isLoggedIn, (req, res) => {
    //get user associated trades
    Trade.find({_user : req.user._id}, (err, result) => {
        if (err){
            console.error(err);
        }
        else{
            console.log(result);
            res.render('profile', {trade : result});
        }
    });
});

/*
 * =========================
 *      Trades
 * =========================
 */

 app.get('/new-trade', isLoggedIn, (req, res) => {
    res.render('new-trade');
 });

//recieve new trade
//beware those who enter, callback AND promise hell lie ahead
 app.post('/new-trade', (req, res) => {
     //catch bad POST requests
     if (!req.isAuthenticated())
        res.redirect('/login');
    else{
        fetchStockInfo(req.body.ticker).then(function (response){
            //is this a valid stock?
            if (response.status === 404){
                //TODO: handle invalid ticker better
                res.redirect('/new-trade');
            }
            //TODO: handle this on the frontend and create confidence field in form
            // else if(!req.body.action || !req.body.confidence){
            //     console.log('Missing form data!');
            //     res.redirect('/new-trade');
            // }
            else{
                //parse response data and save trade
                response.json().then(json => {
                    const newTrade = Trade({
                       _user: req.user._id,

                       ticker: json.quote.symbol,
                       companyName: json.quote.companyName,
                       sector: json.quote.sector,
                       priceAtCreation: json.quote.iexRealtimePrice,

                       action: req.body.action,
                       confidence: req.body.confidence,
                       description: req.body.description
                    });
                    newTrade.save((err, newObj) => {
                        //TODO: handle save error better
                        if (err){
                            res.redirect('/new-trade');
                        }
                        //redirect to page of trade
                        else{
                            res.redirect(`/trades/${newTrade.slug}`);
                        }
                    });
                });
            }
        }).catch(error => {
            console.error(error);
        });
    }
 });

 app.get('/trades/:tradeSlug', (req, res) => {
    Trade.findOne({slug : req.params.tradeSlug}).populate('_user', 'local.username').populate('comments._user').exec((err, result) => {
        if (err){
            //TODO: More gracefully handle failing lookup
            res.redirect('/');
        }
        else{
            res.render('trade-info', {trade : result});
            console.log(result.comments);
        }
    });
});

//handle comment submission on trades
app.post('/trades/:tradeSlug', (req, res) => {
    //request not from valid session
    if (!req.isAuthenticated()){
        res.redirect('/login');
    }
    else{
        Trade.findOne({slug : req.params.tradeSlug}, (err, result) => {
            if (err){
                res.redirect('/');
            }
            result.comments.push({
                _user: req.user._id,
                content: req.body.comment
            });
            result.save((err) => {
                if (err){
                    console.error(err);
                }
                res.redirect(`/trades/${req.params.tradeSlug}`);
            })
        });
    }
});

//helper for retrieving stock info
//returns a promise with the data from the given url
function fetchStockInfo(ticker){
    const url = `https://api.iextrading.com/1.0/stock/${ticker}/batch?types=quote`;
    return fetch(url);
}

app.listen(config.get('port'));
