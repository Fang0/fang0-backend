var db = require('../libs/database');
var FB = require('fb');
var request = require('request');

//建構式
var User = function (options) {

};

//若有相同帳戶則拋出的error
var AccountExistedError = {
    code : 401,
    success : false,
    message : "AccountExisted"
};

//沒有找到User
var NotFoundError = {
    code : 404,
    success : false,
    message : "NotFound"
};

var ParameterError = {
    code : 400,
    success : false,
    message : "WrongParameter"
};


User.get = function () {

};

//use from users.js getFBuser
User.fbget = function () {

};


User.prototype.save = function (cb) {



};

User.categorylistupdate = function(){

};

User.checkExpire = function(){

};

User.tokenExpire = function(){

};

User.idget =  function(){

};

module.exports = User;
