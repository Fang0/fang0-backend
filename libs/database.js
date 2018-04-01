//連結資料庫
var mysql = require('mysql');
var debug = require('debug')('');

var pool = mysql.createPool(process.env.DB_PATH || '填入所要的 MYSQL DB connection string');

module.exports = pool;
