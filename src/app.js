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
        formatDate: function (value) { return moment(value).format("MM/DD/YY"); },
        formatPercent: function (value) { if (value < 0){return '<span class="percent-change negative">(' + (value).toFixed(2) + '%)</span>'}
            else{return '<span class="percent-change positive">(' + (value).toFixed(2) + '%)</span>'}}
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
    Trade.find({}).populate('_user', 'local.username').exec((err, trades) => {
        if (trades.length > 0){
            //attach extra data to results via current prices retrieved from API
            getStockPrices(trades).then(result => {
                res.render('index', {trade : result});
            });
        }
        else{
            res.render('index');
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
    Trade.find({_user : req.user._id}).populate('_user', 'local.username').exec((err, result) => {
        if (err){
            console.error(err);
        }
        else{
            getStockPrices(result).then(result => {
                res.render('profile', {trade : result});
            });
        }
    });
});

/*
 * =========================
 *      Trades
 * =========================
 */

//render list of trades and sort them if parameters are supplied
 app.get('/trades', (req, res) => {
     //handle parameters
    if (req.query.category){
        //mongoose sorting for ticker and date
        if(req.query.category !== 'profit'){
            //set sorting config objects
            let sortConfig = {};
            (req.query.category == 'stock') ? sortConfig.ticker = req.query.sort : sortConfig.time = req.query.sort;
            Trade.find({}).populate('_user', 'local.username').sort(sortConfig).exec((err, result) =>{
                if (err){
                    console.error(err);
                }
                else{
                    getStockPrices(result).then(trades => {
                        res.render('trades', {trade : trades});
                    });
                }
            })
        }
        //sort by Profit
        else{
            Trade.find({}).populate('_user', 'local.username').exec((err, result) =>{
                getStockPrices(result).then(trades => {
                    //sort by percentChange attribute
                    trades.sort(percentChangeComparator(req.query.sort));
                    res.render('trades', {trade : trades});
                });
            });
        }
    }
    //no sorting
    else{
        Trade.find({}).populate('_user', 'local.username').exec((err, trades) => {
            if (trades){
                //attach extra data to results via current prices retrieved from API
                getStockPrices(trades).then(result => {
                    res.render('trades', {trade : result});
                });
            }
        })
    }

 });

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
            else{
                //parse response data and save trade
                parseJson(response).then(json => {
                    quote = json[req.body.ticker.toUpperCase()].quote;
                    const newTrade = Trade({
                       _user: req.user._id,

                       ticker: quote.symbol,
                       companyName: quote.companyName,
                       sector: quote.sector,
                       priceAtCreation: quote.iexRealtimePrice,

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
    Trade.findOne({slug :
         req.params.tradeSlug}).populate('_user', 'local.username').populate('comments._user').exec((err, result) => {
        console.log(result);
        if (err || result === null){
            res.redirect('/trades');
        }
        else{
            getStockPrices(result).then(result => {
                trade = result[0];
                isShort = true;
                if (trade.action === 'buy'){
                    isShort = false;
                }
                res.render('trade-info', {trade : trade, short : isShort});
            });
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
    const url = `https://api.iextrading.com/1.0/stock/market/batch?symbols=${ticker}&types=quote`;
    return fetch(url);
}

//helper for taking trade objects from DB query and attaching the current price for each
//returns a promise
function getStockPrices(trades){
    tickersInUse = [];
    //handle being passed just one trade object
    if (!(trades instanceof Array)){
        trades = [trades];
    }
    for (let i = 0; i < trades.length; i++){
        if (!tickersInUse.includes(trades[i].ticker)){
            tickersInUse.push(trades[i].ticker);
        }
    }
    let queryString = tickersInUse.join(',');
    let url  = `https://api.iextrading.com/1.0/stock/market/batch?symbols=${queryString}&types=quote`;
    let stockFetch = fetch(url);
    return stockFetch.then(parseJson).then(json => {
        //populate results with price data from fetch
        let retrievedStocks = Object.keys(json);
        let stockPrices = {};
        retrievedStocks.forEach(stock => {
            if (json[stock].quote){
                stockPrices[stock] = json[stock].quote.latestPrice;
            }
        });
        trades.forEach(trade => {
            trade.currentPrice = stockPrices[trade.ticker];
            //swap percentage if they shorted the stock
            if (trade.action === 'buy'){
                trade.percentChange = ((trade.currentPrice - trade.priceAtCreation) / trade.priceAtCreation)*100;
            }
            else {
                trade.percentChange = ((trade.priceAtCreation - trade.currentPrice) / trade.priceAtCreation)*100;
            }
        });
        return trades;
    });
}

//simple wrapper function for using json parsing in promises
function parseJson(input){
    return input.json();
}

//helper function for sorting via percent change
function percentChangeComparator(sortMethod){
    if (sortMethod === 'asc'){
        return function(a, b){
            if (a.percentChange > b.percentChange){
                return -1;
            }
            return 1;
        }
    }
    else{
        return function(a, b){
            if (a.percentChange < b.percentChange){
                return -1;
            }
            return 1;
        }
    }
}

app.listen(config.get('port'));
