 var express = require('express');
var router = express.Router();
var debug = require('debug')('Route:Users');
var Category = require('../models/Category');
var Auth = require('../models/Auth');
var User = require('../models/User');
var async = require('../node_modules/async/lib/async');
var Fanpage = require('../models/Fanpage');
var errReturn = function (err, res) {
  debug(err);
  res.status(err.code||404);
  return res.json(err);
};

var failcategoryError = {
    code: 400,
    success: false,
    message: "fail to get countries status"
};

var failcategoryUpdate = {
    code: 400,
    success: false,
    message: "fail to update categorylist(categorylist'format was wrong)"
};

router.get('/', function(req, res, next) {
  Category.get(function(err,rows){
    if(err){
      return errReturn(err,res);
    }else{
      return res.json(rows);
    }
  });
  //TODO
});

router.get('/:categoryId', function(req, res, next) {
if (req.params.categoryId) {
  var id = parseInt(req.params.categoryId);
  Category.idget(id,function(err,rows){
    if(err){
      return errReturn(err,res);
    }else{
      return res.json(rows);
    }
  });
}else{
      return errReturn(failcategoryError,res);
  }
  //TODO
});



router.get('/:categoryId/all',function(req, res, next){
  if (req.params.categoryId) {
    var categoryid = parseInt(req.params.categoryId);
    Category.categoryNameget(categoryid,function(err,category){
      if(err){
        //console.log(category);
        //console.log(rows);
        return errReturn(err,res);
      }else{
          Fanpage.idget(categoryid,function(err,rows){
            if(err){
              return errReturn(err,res);
            }else{
              //console.log(category);
              return res.json(category.concat(rows));
            }
          });
      }
  });
  }else{
      //console.log(req.params.categoryId);
        return errReturn(failcategoryError,res);
    }
    //TODO

});

router.post('/',function(req, res, next){
  var token = req.headers.token || req.query.token|| req.body.token;
  if(token){
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
          var decodedid = parseInt(decodedId);
          var categorylist = req.headers.categorylist||req.query.token||req.body.categorylist;
          if(Array.isArray(categorylist)!=true){
            console.log(typeof(categorylist));
            return errReturn(failcategoryUpdate,res);
          }else{
         User.categorylistupdate(JSON.stringify(categorylist),decodedid,function(err,rows){
            if(err){
              return errReturn(err,res);
            }else{
              res.status(200);
              res.json('success');
          }});
        }
      }
      }
    });
  }else{
    res.json('user without log in');
  }
});

//讀取user的categorylist >> 得到粉專 >> 得到文章
// User.categorylist(decodedid,function(err,list){
//   if(err){
//     return errReturn(err,res);
//   }else{
//     console.log(list[0].categorylist[1]);
//     category.getByIdList(list[0].categorylist[1],function(err, categoryList) {
//       if(err) {
//         errReturn(err,res);
//       } else {
//         console.log(categoryList);
//         async.map(categoryList, category.getPageList, function(err) {
//           if(err) {
//             errReturn(err, res);
//           } else {
//             res.json(categoryList);
//           }
//         });
//       }
//     });
//
//   }
// });



module.exports = router;
