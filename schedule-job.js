//var mysql = require('mysql');
//var db = require('./libs/database');

var fb = require('./models/FB_Crawler');
var schedule = require('node-schedule');


//更改每次任務間隔的分鐘數
var timeInterval = 10;

//設定找粉專(毫秒),文章(毫秒),每一個粉專的文章個數
//找第一次會比較久
//每40秒可抓抓過的350篇，目前最大的粉專數是7
var accountIDArray = [1,2,3,4,5,6];
var setting = {
  searchFanpageTime: 10000,
  searchArticleTime: 40000,
  sinceDate: 2016-06-01,
  untilDate: 2016-06-30,
  accountIDArray: accountIDArray
};

var rule = new schedule.RecurrenceRule();
var d = new Date();
var times = [];
for(var i=1; i<60; i++){
   if(i%timeInterval == d.getMinutes()%timeInterval){
      times.push(i);
   }
}

rule.second = [d.getSeconds()+3];
rule.minute = times;

var j = schedule.scheduleJob(rule, function(){
    console.log("Now is "+ new Date());
    //得到資料，之後再存入資料庫
    fb.getArticleByDB(setting,function(err,message){
        if(err){
          console.log("allerr");
          console.log(err);
        }else{
          console.log("The time interval: "+times);
          console.log("allmessage is save at "+new Date());
          console.log(message);
        }

    });

});
