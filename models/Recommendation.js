var db = require('../libs/database');
var debug = require('debug')('Model:CollectionToArticle');

var Recommendation = function(options){

};
var NoCategoryIdError = {
    code : 404,
    success : false,
    message : "didn't get Category id"
};
var NotFoundError = {
    code : 404,
    success : false,
    message : "NotFound"
};

Recommendation.categorytypeget = function (articleid,cb) {
  db.query("SELECT category FROM fanpages WHERE id = (SELECT fanpageid FROM articles WHERE id = ? )",
    [
    articleid
    ], function (err, rows) {
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,rows[0].category);
    } else {
      cb(null,0);
    }
  });
};

Recommendation.categoryidget = function (category,cb) {
  db.query("SELECT categoryid  FROM r_categories_fanpages  WHERE fanpagetype = ? ",
    [
    category
    ], function (err, rows) {
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,rows[0].categoryid);
    } else {
      cb(null,13);
    }
  });
};

Recommendation.fanpageidget = function (categoryid, cb) {
  db.query("SELECT fanpages.id FROM fanpages,r_categories_fanpages WHERE fanpages.category = r_categories_fanpages.fanpagetype AND r_categories_fanpages.categoryid= ? ORDER BY RAND() LIMIT 3",
  [
  categoryid
], function (err, rows) {
  if (err) {
    cb(err);
  } else if (rows.length) {
    cb(null,rows);
  } else {
    cb(null,0);
  }
});
};

Recommendation.randomArticleidget = function (fanpageidfir, fanpageidsec, fanpageidthi, articleid, cb) {
  db.query("SELECT articles.*,fanpages.name AS fanpage_name, fanpages.picture AS fanpage_picture  FROM articles,fanpages  WHERE articles.fanpageid = fanpages.id  AND articles.fanpageid IN (?,?,?) AND articles.id<>? ORDER BY RAND() LIMIT 6",
    [
    fanpageidfir,
    fanpageidsec,
    fanpageidthi,
    articleid
    ], function (err, rows) {
    if (err) {
      cb(err);
    } else if (rows.length) {
      rows = rows.map(function(ele){
        if(ele.created_time !== null){
            ele.created_time = ele.created_time.toISOString().slice(0,10)//.replace(/T/, ',').replace(/\..+/, '');
            //console.log(ele.created_time);
        }
        if(ele.message !== null){
          ele.message = ele.message.replace(/NLINEN/g,'\n');
        }

        return ele;
      });
      cb(null,rows);
    } else {
      console.log(rows);
      cb(null,0);
    }
  });
};


module.exports = Recommendation;
