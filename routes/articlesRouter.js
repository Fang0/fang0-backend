//以下單純是範例，it can't work
//搭配相對應的Model，在此為ArticleTable
//create by T.W.Huang(t-rain),2017.04.20
//從articleRouter.js開始寫起

//引入模組與需要的Model(Model為用來操作Database或是搜集、處理資料)
var express = require('express');
var router = express.Router();
var Auth = require('../models/AuthTable');
var User = require('../models/UserTable');
var Article = require('../models/ArticleTable');
var Fanpage = require('../models/FanpageTable');
var Facebook = require('../models/FB_Crawler');

//每個Router的error處理方式須固定，更好的寫法應為獨立出來，再引用
var errReturn = function (err, res) {

  debug(err);
  if(isNaN(err.code)){
    res.status(404);
  }else{
    res.status(err.code);
  }
  return res.json(err);
};


var listError = {
  code : 400,
  success : false,
  message : "Wrong list of not array"
};

var wrongTypeError = {
  code : 400,
  success : false,
  message : "Wrong list",
  requestHeaders : {},
  requestQuery : {}
};

var noQueryError = {
  code : 400,
  success : false,
  message : "No query parameter Error"

};

var noValueError = {
  code : 400,
  success : false,
  message : "No Value Error"
}

//READ
router.get('/', function(req, res, next) {
  var token = req.headers.authToken || req.query.authToken;
  var list = req.headers.list|| req.query.list;
  var begin = req.headers.begin || req.query.begin || 0;
  var number = req.headers.number || req.query.number || 10;
  var sort = req.headers.sort || req.query.sort || "new";

  var postbegin = parseInt(begin, 10);
  var postnumber = parseInt(number, 10);

  var rule = {
      token : token,
      list : list,
      begin : postbegin,
      number : postnumber,
      sort : sort,
  };
  if(!rule.token){
    //未登入
    //...登入一樣，差別在有登入可以直接找到使用者的喜愛列表(list)
  }else{
    //已登入
    Auth.checkToken(token,function(err,decoded){
      if(err){
        res.status(err.code||403);
        res.json(err);
      }else{
        //從token裡頭得到的id資訊
        var decodedId = parseInt(decoded.id, 10);
        User.get(decodedId,function(err,result){
          if(err){
            return errReturn(err,res);
          }else{
            try{
              var loveArray = JSON.parse(result.list);
              //用來處理loveArray，分為非陣列、空陣列、陣列處理

              //非陣列，error
              if(!Array.isArray(loveArray)){

                listError.type_of = typeof(loveArray);
                listError.is_Array = Array.isArray(loveArray);
                return errReturn(listError,res);

              //空陣列，沒有喜愛列表，找所有文章
              }else if(loveArray.length === 0){

                Article.getwithoutlist(rule,function(err,rows){
                 if(err){
                   errReturn(err,res);
                 }else{
                   res.status(200);
                   res.json(rows);
                 }

                });

              //陣列處理，依據喜愛列表找文章
              }else{
                rule.list = loveArray;
                Article.get(rule,function(err,rows){
                    if(err){
                      errReturn(err,res);
                    }else{
                      res.status(200);
                      res.json(rows);
                    }
                });
              }

            //JSON.parse錯誤
            }catch(e){

              Article.getwithoutlist(rule,function(err,rows){
                 if(err){

                   errReturn(err,res);
                 }else{
                   res.status(200);
                   res.json(rows);
                 }

              });
            }
          }

        });
      }
    });
  }
});


router.get('/searchdb',function(req, res, next) {
    var text = req.headers.text || req.query.text;
    if (text) {
      Article.search(text,function(err,rows){
        if(err){
          return errReturn(err,res);
        }else{
          return res.json(rows);
        }
      });
    }else{
      return errReturn(noValueError,res);
    }
});


//Create
router.post('/save',function(req, res, next) {
      //POST的body中所帶的data參數
      var jsonData = req.body.data;
      console.log(jsonData);

      if (jsonData) {
          //檢查jsonData(JSON.parse(jsonData)若解析錯誤，會回傳 500 error，需catch)
          try{
              var insertTotal = 0;
              var articleData = JSON.parse(jsonData);

              //下面用到
              var checkTotal = function(insertTotal){
                if(insertTotal == articleData.length){
                    res.status(200);
                    res.json("already done");
                }
              };

              //下面用到
              var checkTotalSingal = function(insertTotal){
                if(insertTotal == 1){
                    res.status(200);
                    res.json("already done");
                }
              };

              //檢查傳進來的文章是多篇(Array)還是單篇(Object)
              if(Array.isArray(articleData)){
                  // console.log("array");
                  articleData.forEach(function(article){

                    var resultmessage = article.message;

                    if(resultmessage){
                        resultmessage = resultmessage.replace(/\n/g,'NLINEN');
                    }

                    var articleDataObject = {
                      aid = article.aid,
                      aCategoryid = article.aCategoryid,
                      aMessage = article.aMessage,
                      aTime = article.aTime,
                      aFanpageid = article.aFanpageid
                    };

                    // console.log(articleDataObject);

                    //新建一個ArticleTable的物件，用其中的save,update方法
                    var article = new Article(articleDataObject);
                    article.save(function(err,result){
                          //insert有無錯誤
                          if (err){
                            //是不是PRIMARY KEY error
                            if(err.errno === 1062){

                              article.update(function(up_err,up_result){
                                //update有無錯誤
                                if(up_err){
                                  insertTotal++;
                                  console.log(insertTotal+":update error");
                                  console.log(up_err);
                                  console.log(new Date());
                                  checkTotal(insertTotal);
                                }else{
                                  insertTotal++;
                                  console.log(insertTotal+":update");
                                  console.log(up_result.id);
                                  console.log(new Date());
                                  checkTotal(insertTotal);

                                }

                              });
                            //insert不是errno = 1062
                            }else{
                              insertTotal++;
                              console.log(insertTotal+":insert error");
                              console.log(err);
                              console.log(new Date());
                              checkTotal(insertTotal);

                            }

                          //insert沒錯
                          }else {
                            insertTotal++;
                            console.log(insertTotal+":insert");
                            console.log(result.id);
                            console.log(new Date());
                            checkTotal(insertTotal);

                          }
                    });
                  });

              }else if(typeof(articleData) == "object"){
                // console.log("object");
                //對一篇文章做處理，流程跟上面一樣，只是少了forEach部分
              }else{
                //其他型態或錯誤
                return errReturn(wrongTypeError,res);
              }
          //parse jsonData 錯誤
          }catch(e){
            console.log(e);
            return errReturn(e,res);
          }

      //無data參數
      }else{
        return errReturn(noQueryError,res);
      }
});

module.exports = router;
