var db = require('../libs/database');

var CalculateRank = function(options){

};
// 熱門度 = ((C*所有主題平均評分)+該主題總分)/(C+該主題受評數)
// C = 所有主題平均受評數
// 該主題總分 = 該主題受評數*主題分數
//
// 所有主題平均受評數 =  資料庫內所有評分數目/被評分過的文章數
// 所有主題平均評分 = 資料庫內所有評分總和/被評分過的文章數
CalculateRank.caldbrankedall = function(cb){
  //資料庫內所有評分數目
  db.query("SELECT COUNT(id) AS dbrankedall FROM rankings",
  [

  ],function(err,rows){
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,rows[0].dbrankedall);
    } else {
      cb(err);
    }
  });
};

CalculateRank.caldbrankedallarticle = function(cb){
  //資料庫內被評分過的文章數目
    db.query("SELECT COUNT(DISTINCT articleid) AS dbrankedallarticle FROM rankings",
    [

    ],
    function (err, rows) {
  if (err) {
    cb(err);
    } else if (rows.length) {
    cb(null,rows[0].dbrankedallarticle);
    } else {
    cb(err);
    }
  });
};



CalculateRank.calarticleranksum = function(articleid,cb){
  //該文章總分
  db.query("SELECT SUM(rankvalue) AS articleranksum FROM rankings WHERE articleid = ? ",
  [
    articleid
  ],function (err, rows) {
if (err) {
  cb(err);
  } else if (rows.length) {
  cb(null,rows[0].articleranksum);
  } else {
  cb(err);
  }
});
};

CalculateRank.calrankedartilce = function(articleid,cb){
  //該文章受評數
  db.query("SELECT COUNT(articleid = ?) AS rankedarticle FROM rankings",
  [
    articleid
  ],function (err, rows) {
    if (err) {
    cb(err);
    } else if (rows.length) {
    cb(null,rows[0].rankedarticle);
    } else {
    cb(err);
    }
  });

};

CalculateRank.caldbrankedallsum = function(cb){
  //資料庫內所有評分總和
  db.query("SELECT SUM(rankvalue) AS dbrankedallsum FROM rankings ",
 [

 ],function (err, rows) {
if (err) {
 cb(err);
 } else if (rows.length) {
 cb(null,rows[0].dbrankedallsum);
 } else {
 cb(err);
 }
});


};

CalculateRank.rankupdate = function(result,articleid,cb){
  //傳進資料庫
  db.query("UPDATE articles SET rank = ? WHERE id = ?",
  [
    result,
    articleid
  ],function(err,rows){
    if (err) {
      cb(err);
    }else {
      cb(null,"rank update finish");
    }
  });

};



module.exports = CalculateRank;
