//SPDX-License-Identifier: Apache-2.0

var route = require('./controller.js');


module.exports = function(app){

  app.post('/CreateProduct/:user/:mspid', function(req, res){
    route.CreateProduct(req, res);
  });
  app.post('/SendDeliveryRequest/:user/:mspid', function(req, res){
    route.SendDeliveryRequest(req, res);
  });
  app.post('/SendDelivery/:user/:mspid', function(req, res){
    route.SendDelivery(req, res);
  });
  app.post('/AcceptDelivery/:user/:mspid', function(req, res){
    route.AcceptDelivery(req, res);
  });
  app.get('/QueryDeliveryRequest/:user/:mspid', function(req, res){
    route.QueryDeliveryRequest(req, res);
  });
  app.post('/ServeDelivery/:user/:mspid', function(req, res){
    route.ServeDelivery(req, res);
  });
  app.get('/GetProduct/:id/:user/:mspid', function(req, res){
    route.GetProduct(req, res);
  });
  app.get('/getHistoryForDelevryRequest/:id/:user/:mspid', function(req, res){
    route.getHistoryForDelevryRequest(req, res);
  });
  app.get('/SignInUser/:id', function(req, res){
    route.SignInUser(req, res);
  });
  app.get('/RegisterUser/:user', function(req, res){
    route.RegisterUser(req, res);
  });



}

