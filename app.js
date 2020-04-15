var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
const appRoot = require('app-root-path');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(req,res){
	const fs = require('fs');	
	res.sendFile(appRoot + '/public/idex.html');
});


var stampRouter = require('./stamp');
app.use('/stamp/', stampRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  if(err.status == 404){
	res.sendFile(appRoot + '/static/404.html');

  }else{
  	res.status(err.status || 500);
  	res.json({
		title:"Error",
		status:(err.status || 500),
		error:err
		});
  }
});

module.exports = app;
