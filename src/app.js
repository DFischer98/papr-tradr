/*
* Author: Daniel Fischer
* NetID: daf452
* CSCI UA 480 Final Project
* Tradify: Paper Trading WebApp
*/

//requires
const config = require('./config');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const moment = require('moment');
moment().format();
const exphbs  = require('express-handlebars');
require('./db');

//config
const app = express();
app.use(express.static(path.join(__dirname,'../','public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

//render homepage
app.get('/', (req, res) => {
    Trade.find({}, (err, result) => {
        let count = result.length;
        if (result){
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

app.listen(config.get('env'));
