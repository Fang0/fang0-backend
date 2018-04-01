var express = require('express');
var router = express.Router();
var User = require('../models/UserTable');
var Auth = require('../models/AuthTable');
var FB = require('fb');

router.get('/', function(req, res, next) {

});

//post，用來新增使用者
router.post('/',function(req,res,next){

});

module.exports = router;
