var db = require('../libs/database');

var Ranking = function (options) {

};

Ranking.checkranking = function(userid,articleid,cb){
  db.query("SELECT * FROM rankings WHERE userid = ? AND articleid = ? ",
    [
    userid,
    articleid
    ], function (err, rows) {
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,"update");
    } else {
      cb(null,"post");
    }
  });
};
Ranking.newranking = function(userid,articleid,rankvalue,cb){
  db.query("INSERT INTO rankings (userid,articleid,rankvalue) VALUES (?,?,?) ",
    [
    userid,
    articleid,
    rankvalue
    ], function (err, rows) {
    if (err) {
      console.log(err);
      cb(err);
    } else {
      cb(null,rows);
    }
  });
};
Ranking.updateranking = function(rankvalue,userid,articleid,cb){
  db.query("UPDATE rankings SET rankvalue = ? WHERE userid = ? AND articleid = ? ",
    [
    rankvalue,
    userid,
    articleid
    ], function (err, rows) {
    if (err) {
      cb(err);
    } else {
      cb(null,rows);
    }
  });
};


module.exports = Ranking;
