var express = require('express');
var router = express.Router();
var debug = require('debug')('Route:Users');
var Ranking = require("../models/Ranking");
var Auth = require('../models/Auth');
var CalculateRank = require('../models/CalculateRank');
var errReturn = function (err, res) {
  debug(err);
  res.status(err.code||404);
  return res.json(err);
};
var noTokenError = {
    code: 404,
    success: false,
    message: "no token"
};

var noArtilceError = {
    code: 404,
    success: false,
    message: "no articleid"
};

var noRankvalueError = {
    code: 404,
    success: false,
    message: "no rankvalue"
};

router.post("/",function(req, res, next){
   var token = req.headers.token || req.query.token|| req.body.token;
    var articleid = req.headers.articleid || req.query.articleid|| req.body.articleid;
    var rankvalue = req.headers.rankvalue || req.query.rankvalue|| req.body.rankvalue;

    if(token){
      if (articleid) {
        if (rankvalue) {
    Auth.checkToken(token,function(err, decoded){
        if(err){
          res.status(err.code||403);
          res.json(err);
        }else{
          //token正確
          var decodedId = parseInt(decoded.id, 10);
          //確認token的持有者是否為此id
          if(!decodedId){
            //console.log("notRightTokenError");
            return errReturn(notRightTokenError,res);
          }else{
            //更新資料庫內categorylist
            var userid = parseInt(decodedId);
            Ranking.checkranking(userid,articleid,function(err,rows){
              if (rows == "update") {
                Ranking.updateranking(rankvalue,userid,articleid,function(err,rows){
                  if (err) {
                    return errReturn(err,res);
                  }else {
                    CalculateRank.caldbrankedall(function(err,rows){
                      if (err) {
                        return errReturn(err,res);
                      }else {
                        var dbrankedall = rows;
                        CalculateRank.caldbrankedallarticle(function(err,rows){
                          if (err) {
                            return errReturn(err,res);
                          }else {
                            var dbrankedallarticle = rows;
                            //所有文章平均受評數
                            var c = dbrankedall/dbrankedallarticle;
                            CalculateRank.calarticleranksum(articleid,function(err,rows){
                              if (err) {
                                return errReturn(err,res);
                              }else {
                                var articleranksum = rows;
                                CalculateRank.calrankedartilce(articleid,function(err,rows){
                                  if (err) {
                                    return errReturn(err,res);
                                  }else {
                                    var rankedarticle = rows;
                                    CalculateRank.caldbrankedallsum(function(err,rows){
                                      if (err) {
                                        return errReturn(err,res);
                                      }else {
                                        var dbrankedallsum = rows;
                                        // 所有主題平均評分
                                        var allavg = dbrankedallsum/dbrankedallarticle;
                                        //計算排名分數
                                        var result = ((c*allavg)+articleranksum)/(c+rankedarticle);
                                        CalculateRank.rankupdate(result,articleid,function(err,rows){
                                          if (err) {
                                            return errReturn(err,res);
                                          }else {
                                            res.status(200);
                                            res.json("update success");
                                          }
                                        });
                                      }
                                    });
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });

              }else if(rows == "post") {
                Ranking.newranking(userid,articleid,rankvalue,function(err,rows){
                  if (err) {
                    return errReturn(err,res);
                  }else {
                    CalculateRank.caldbrankedall(function(err,rows){
                      if (err) {
                        return errReturn(err,res);
                      }else {
                        var dbrankedall = rows;
                        CalculateRank.caldbrankedallarticle(function(err,rows){
                          if (err) {
                            return errReturn(err,res);
                          }else {
                            var dbrankedallarticle = rows;
                            //所有文章平均受評數
                            var c = dbrankedall/dbrankedallarticle;
                            CalculateRank.calarticleranksum(articleid,function(err,rows){
                              if (err) {
                                return errReturn(err,res);
                              }else {
                                var articleranksum = rows;
                                CalculateRank.calrankedartilce(articleid,function(err,rows){
                                  if (err) {
                                    return errReturn(err,res);
                                  }else {
                                    var rankedarticle = rows;
                                    CalculateRank.caldbrankedallsum(function(err,rows){
                                      if (err) {
                                        return errReturn(err,res);
                                      }else {
                                        var dbrankedallsum = rows;
                                        // 所有主題平均評分
                                        var allavg = dbrankedallsum/dbrankedallarticle;
                                        //計算排名分數
                                        var result = ((c*allavg)+articleranksum)/(c+rankedarticle);
                                        CalculateRank.rankupdate(result,articleid,function(err,rows){
                                          if (err) {
                                            return errReturn(err,res);
                                          }else {
                                            res.status(200);
                                            res.json("post success");
                                          }
                                        });
                                      }
                                    });
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                });
              }
            });
          }else{
            res.json('user without log in');
          }
        });
      }
    }

  });
    }else {
      return errReturn(noRankvalueError,res);
    }
  }else {
    return errReturn(noArtilceError,res);
  }
}else {
  return errReturn(noTokenError,res);
}
});
module.exports = router;
