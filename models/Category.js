var db = require('../libs/database');

//建構式
var Category = function (options) {
  this.id = options.id;
  this.categoryName = options.categoryName;
};


var NotFoundError = {
    code : 404,
    success : false,
    message : "NotFound"
};



Category.get = function (cb) {
  db.query("SELECT id, category FROM fbaccount ", function (err, rows) {
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,rows);
    } else {
      cb(NotFoundError);
    }
  });
};

Category.idget = function (id,cb) {
  db.query("SELECT category FROM fbaccount WHERE id = ?", [id], function (err, rows) {
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,rows);
    } else {
      cb(NotFoundError);
    }
  });
};

Category.categoryNameget = function (id,cb) {
  db.query("SELECT category FROM fbaccount WHERE id = ?", [id], function (err, rows) {
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,rows);
    } else {
      cb(NotFoundError);
    }
  });
};

Category.getByIdList= function(idList, cb) {
    db.query("SELECT id FROM fbaccount WHERE id IN (?)",[
      idList
    ], function(err, rows) {
      if(err) {
        cb(err);
      } else {
        cb(null,rows);
      }
    });
};

Category.getPageList = function(category, cb) {
  db.query("SELECT * FROM fanpage WHERE categoryid = ?", [
    category.id
  ], function(err, rows) {
    if(err) {
      cb(err);
    } else {
      category.pageList = rows;
      cb(null, category);
    }
  });
};
Category.categorylist = function(userid,cb){
  db.query("SELECT categorylist FROM users WHERE id = ?", [userid],function(err,rows){
    if (err) {
      cb(err);
    } else if (rows.length) {
      cb(null,rows);
    } else {
      cb(NotFoundError);
    }
  });
};



module.exports = Category;
