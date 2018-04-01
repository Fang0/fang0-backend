var express = require('express');
var router = express.Router();
var debug = require('debug')('Route:Users');
var Recommendation  = require("../models/Recommendation");

var errReturn = function (err, res) {
  debug(err);
  res.status(err.code||404);
  return res.json(err);
};

router.get('/', function(req, res, next) {
  var articleid = req.headers.articleid || req.query.articleid|| req.body.articleid;
  Recommendation.categorytypeget(articleid, function(err,rows){
    if(err){
      return errReturn(err,res);
    }else{
      Recommendation.categoryidget(rows, function(err,rows){
        if(err){
          // console.log(err);
          return errReturn(err,res);
        }else{
          Recommendation.fanpageidget(rows,function(err,rows){
            if(err){
              console.log(err);
              return errReturn(err,res);
            }else{
              if (rows.length == 3) {
                var idfir = rows[0].id;
                var idsec = rows[1].id;
                var idthi = rows[2].id;
              }else if (rows.length == 2) {
                var idfir = rows[0].id;
                var idsec = rows[1].id;
                var idthi = rows[1].id;
              }else if (rows.length == 1) {
                var idfir = rows[0].id;
                var idsec = rows[0].id;
                var idthi = rows[0].id;
              }else if (rows.length == 0) {
                return errReturn(err,res);
              }

              Recommendation.randomArticleidget(idfir, idsec, idthi, articleid, function(err,rows){
                  if(err){
                    return errReturn(err,res);
                  }else{
                    return res.json(rows);
                  }
              });

              }});
      }});
    }
  });
});


module.exports = router;
