//SPDX-License-Identifier: Apache-2.0

// nodejs server setup 

// call the packages we need
const log4js = require('log4js');
//const logger = log4js.getLogger('BasicNetwork');
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
//var http = require('http')
//var fs = require('fs');
//var Fabric_Client = require('fabric-client');
//var path = require('path');
//var util = require('util');
//var os = require('os');
//const crypto = require('crypto');
//const mongoose = require('mongoose');
//const multer = require('multer');
//const GridFsStorage = require('multer-gridfs-storage');
//const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
//var cors = require('cors');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

app.use(bodyParser.json());
app.use(methodOverride('_method'));

require('./routes.js')(app);

// Save our port
var port = process.env.PORT || 3000;

// Start the server and listen on port 
app.listen(port, function () {
  console.log("Server is running on port: " + port);
});


