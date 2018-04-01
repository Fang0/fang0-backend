var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


//Routes
var users = require('./routes/usersRouter');
var categories = require('./routes/categoriesRouter');
var fanpages = require('./routes/fanpagesRouter');

var login_users = require('./routes/login_usersRouter');
var articles = require('./routes/articlesRouter');
var login_articles = require('./routes/login_articlesRouter');
var collections = require('./routes/collectionsRouter');
var recommendations = require('./routes/recommendationsRouter');
var rankings = require('./routes/rankingsRouter');
//Models
var authModel = require('./models/AuthRouter');


var app = express();



app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//以下是用來解決browser上Cross Domain的問題
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });


//使用相對應的路徑
app.use('/users', users);
app.use('/categories',categories);
app.use('/fanpages',fanpages);
app.use('/articles',articles);
app.use('/recommendations',recommendations);
app.use('/rankings',rankings);

//認證token
app.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.headers.token || req.query.token || req.body.token;

  // decode token
  if (!token) {
    //console.log("NotFoundError");
      res.status(404);
      res.json({
          code : 404,
          success : false,
          message : "NotFoundError"
      });

  }else{
    //確認token的正確與否
    authModel.checkToken(token,function(err,decoded){
      if(err){
        res.status(err.code||403);
        res.json(err);
      }else{
        //token正確
        next();
      }
    });
  }
});
//讓user改用認證之後的路徑檔案

app.use('/users', login_users);
app.use('/articles',login_articles);
app.use('/collections',collections);


// catch 404 and forward to error handler

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  });
});


module.exports = app;
