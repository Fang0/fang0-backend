var db = require('../libs/database');

//以下單純是範例
//搭配相對應的Router，在此為articleRouter
//在../libs/database引用了mysqljs/mysql套件
//以下的db.query中的 query方法是 mysqljs/mysql 套件所提供的方法，詳情參考 mysqljs/mysql 的 github
//create by T.W.Huang(t-rain),2017.04.08
//從ArticleTable.js開始寫起
//程式進入點是bin/www，不過主要路由配置與其他設定在app.js


var ArticleModel = function (options) {
  //follow the database structure
  this.aid = options.aid;
  this.aCategoryid = options.aCategoryid;
  this.aMessage = options.aMessage;
  this.aTime = options.aTime;
  this.aFanpageid = options.aFanpageid;
};


var noQueryError = {
  code : 400,
  success : false,
  message : "No query parameter Error"
};

var changeArticleOuput = {

};

//以下為CRUD的方法

//Read
ArticleModel.get = function (rule,cb) {
  //從articleTable這張表中取出特定類別的文章
  //sort有兩種，一種為new(照時間，最新優先)，另一種為hot(照熱門程度)
  if(rule.sort == "new"){
    db.query("SELECT articleTable.aid,articleTable.aMessage... FROM articleTable WHERE articleTable.aFanpageid = fanpageTable.fid AND articleTable.aCategoryid IN (?,?,?) ORDER BY aTime DESC LIMIT ?,?", [
      rule.categorylist[0],rule.categorylist[1],rule.categorylist[2],rule.startDate,rule.howManyDateWantToGet
    ], function (err, rows) {
      if (err) {
        cb(err);
      } else if (rows.length) {

        rows = rows.map(function(ele){

          //以下是要處理時間格式
          if(ele.aTime !== null){
              ele.aTime = ele.aTime.toISOString().slice(0,10).replace(/T/, ',').replace(/\..+/, '');
          }

          //以下是處理資料庫中\n的問題，存入時用SALT代替
          if(ele.aMessage !== null){
            ele.aMessage = ele.aMessage.replace(/SALT/g,'\n');
          }

          return ele;
        });
        cb(null, rows);

      } else {
        var noArticle = [];
        cb(null,noArticle);
      }
    });

  }else if(rule.sort == "hot"){

    //aHot是用來衡量的指標
    db.query("SELECT articleTable.aid,articleTable.aMessage... FROM articleTable WHERE articleTable.aFanpageid = fanpage.fid AND articleTable.aCategoryid IN (?,?,?) ORDER BY aHot DESC LIMIT ?,?", [
      rule.startDate,rule.howManyDateWantToGet
    ], function (err, rows) {
      if (err) {
        //同上
        //...
        //...
      }else{
        //同上
        //...
      }
    });

  }else{
    cb(noQueryError);
  }
};

ArticleModel.getwithoutlist = function(rule,cb){
  //與上面類似，只是沒有指定類別
};

//CREATE
ArticleModel.prototype.save = function(cb){
    //綁定call這個method的物件，不然到了其他function時會讀取不到(js變數宣告與作用域得問題)
    var self = this;
    db.query("INSERT INTO articleTable (aid,aCategoryid,aMessage,aTime,aFanpageid) VALUES (?,?,?,?,?)",
    [self.aid,self.aCategoryid,self.aMessage,self.aTime,self.aFanpageid],
    function (err, result) {
          if (err){
            //Insert Error
            cb(err);
          }else {
            //Insert Success
            cb(null, self);
          }
    });
};

//UPDATE
ArticleModel.prototype.update = function(cb){
   var self = this;
   //UPDATE contacts SET Name = ?,Mobile=? WHERE yourCondition = ?
   db.query("UPDATE articleTable SET aCategoryid= ?,aMessage= ?,aTime= ?,aFanpageid= ?",
    [self.aCategoryid,self.aMessage,self.aTime,self.aFanpageid],
    function (err, result) {
          if (err){
            //Update Error
            cb(err);
          }else {
            //Update Success
            cb(null, self);
          }
    });
};


//Search article in ArticleTable
//Made by W.T.Chen
ArticleModel.search = function(text,cb){
  db.query("SELECT SELECT articleTable.aid,articleTable.aMessage AS aMessage... FROM articleTable WHERE articleTable.aFanpageid = fanpage.fid AND  AND aMessage LIKE CONCAT('%',?,'%') ",
    [
      text
    ], function (err, rows) {
    if (err) {
      //像是ArticleModel.get一樣處理得到的文章
    }
  });
};


//有分 ArticleModel.prototype.method 跟 ArticleModel.method 兩種，這兩種的差別在於js為prototype繼承，運用了prototype才能夠在每new一個物件時取得其prototype，像是CREATE跟UPDATE就是每個呼叫都要利用其個別的protoype，用法在articleRouter.js呈現
//ArticleModel.prototype.method就是用在處理個別物件時
//ArticleModel.method則是用在不與個別物件有關時的操作，像是Read,Search等等

module.exports = ArticleModel;
