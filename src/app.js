/*
 * Author: Daniel Fischer
 * NetID: daf452
 * CSCI UA 480 Final Project
 * Tradify: Paper Trading WebApp
 */

//requires
 const express = require('express');
 const mongoose = require('mongoose');
 const path = require('path');
 require('./db');

//config
 const app = express();
 app.use(express.static(path.join(__dirname, 'public')));

 app.listen(3000);
