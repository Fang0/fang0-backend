//以下單純是範例
//在../libs/database引用了mysqljs/mysql套件
//以下的db.query中的 query方法是 mysqljs/mysql 套件所提供的方法，詳情參考 mysqljs/mysql 的 github
//create by T.W.Huang(t-rain),2017.04.25
//從ArticleTable.js開始寫起

//引用NodeJS Library for Facebook套件(https://github.com/Thuzi/facebook-node-sdk)
var FB = require('fb');
//也可以不引用，而直接使用fb的 REST graph api，參考https://developers.facebook.com/tools-and-support/的
//圖形 API 測試工具

var db = require('../libs/database');

var Article = require('./ArticleTable');
var Fanpage = require('./FanpageTable');

//下面這些是web爬蟲才需要的套件
//nodjs爬蟲最常用的兩個工具
var request = require('request');
var cheerio = require('cheerio');

//檔案讀取、寫入
var fs = require('fs');
//壓縮
var zlib = require('zlib');
//async套件，用於解決callback hell，與ES7的async/await不同
var asyncLibrary = require('async');


//-----------------------------------------------------------------//

//FacebookModel，共分為兩部分，用Graph api部分與web爬fb部分
var FacebookModel = function (fbtoken) {
   this.fbtoken = fbtoken;
};

//用Graph api部分，又分為以ES7新寫的部分與舊的ES5的部分
var changeFBerror = function(err){
  err.fbcode = err.code;
  err.code = 404;
  return err;
};

//ES7，nodejs版本v7.6之後原生支援
//改寫抓粉專的方法
const insertFBpageFrom = async(pageDataArray) => {

    const insert = async(pageData) => new Promise((resolve,reject) => {
        //下方的回應訊息處理
        let showMessage = (isRight,status,message) => {
            let result = {};
            result.status = status;
            result.message = message;
            result.date = new Date();
            if(isRight){
                resolve(result);
            }else {
                reject(result);
            }
        };

        var fanpage = new Fanpage(pageData);
        //FanpageTable中CRUD中的CREATE方法
        fanpage.save(function(err,result){
            //insert有無錯誤
            if (err){
              //是不是PRIMARY KEY error
              if(err.errno === 1062){

                fanpage.update(function(up_err,up_result){
                  //update有無錯誤
                  if(up_err){
                      showMessage(false,"update error",up_err);
                  }else{
                      showMessage(true,"update",up_result.id);
                  }
                });
              //insert不是errno = 1062
              }else{
                showMessage(false,"insert error",err);
              }
            //insert沒錯
            }else {
              showMessage(true,"insert",result.id);
            }
        });

    });

    let statusPromiseArray = pageDataArray.map(async (ele) => insert(ele));
    return Promise.all(statusPromiseArray);
};



const getPageDataFrom = async(pidArray) =>{

     const callFBapi = async(pid) => new Promise((resolve,reject) => {
         FB.api(
         '/v2.5/'+pid,
         'GET',
         {"fields":"id,name,picture,start_info,record_label,about,description,bio,category,genre,likes,awards,hometown,current_location,band_members,band_interests,artists_we_like,booking_agent,influences,press_contact,website,link"},
         //fields後可修改為需要的欄位
           function(response) {
             if (response && !response.error) {
                   var sd = "";
                   if(response.start_info.date){
                         var dateObject =  response.start_info.date;

                         if(dateObject.year){
                           sd = dateObject.year;
                           if(dateObject.month){
                             sd += "/" + dateObject.month;
                             if(dateObject.day){
                               sd += "/" + dateObject.day;
                             }
                           }
                         }
                   }

                   var pageData = {
                     fid : response.id,
                     fname : response.name,
                     fpicture : response.picture.data.url,
                     fstart_date : sd,
                     fcategory : response.category,
                     flikes : response.likes,
                     flink : response.link,
                     //....
                   };

                   resolve(pageData);

             }else{
                   reject(changeFBerror(response.error));
             }
           }
         );
     });


     let pageDataPromiseArray = pidArray.map(async(ele) => callFBapi(ele));
     return Promise.all(pageDataPromiseArray);

};

const getFBpage = async() => new Promise((resolve,reject) => {

    //這邊設置想抓取的fanpageIDarray
    resolve(fanpageIDarray);
});

const crawFBpage = async() => {
    try {
        FB.setAccessToken(fbtoken);
        //fbtoken用來通過Graph api的方法認證
        let pageIDarray = await getFBpage();
        let pageDataArray = await getPageDataFrom(pageIDarray);
        let statusArray = await insertFBpageFrom(pageDataArray);
        console.log(statusArray);
    } catch (e) {
        console.log(e);
    }
};

//爬粉專資料
// crawFBpage();
//-----------------------------------------------------------------//

//ES5，進入點在下方(500行左右的位置，程式碼排列的方式依照越先執行越靠近進入點的方式)，進入點在//**********//底下
var getArticleContent = function(aidArray,messageReplace,cb){

    aidArray.forEach(function(element){

      FB.api(
      '/'+element,
      'GET',
      {"fields":"id,icon,from,name,story,created_time,message,full_picture,description,likes,actions,type,link"},
      //fields後可修改為需要的欄位
        function(response) {
            if (response && !response.error) {

              //得到文章讚數
              var getArticleLike = function(cb){
                FB.api(
                  "/"+response.id+"/likes?summary=1&limit=0",
                  function (res) {
                    if (res && !res.error) {
                      /* handle the result */
                      cb(res.summary.total_count);
                    }else{
                      cb(0);
                    }
                  }
                );
              };

              //對message做處理，可不用
              var resultmessage = response.message;
              if(messageReplace){
                  if(resultmessage){
                    resultmessage = resultmessage.replace(/\n/g,'SALT');
                  }
              }

              //對時間做處理，改變時間格式
              var stamptime = response.created_time;
              var aTime = new Date(stamptime).toISOString().slice(0, 19).replace('T', ' ');

              //整理成與資料庫相同的格式
              getArticleLike(function(count){

                  var articleData = {
                    aid : response.id,
                    aCategoryid : response.icon,
                    aTime : aTime,
                    aMessage : resultmessage,
                    aFanpageid : response.from.id,
                    //...
                  };

                  cb(null,articleData);

              });

            }else{

                cb(changeFBerror(response.error));
            }
        }
      );

    });

};

//得到pageID陣列中的粉專po文的文章id陣列
var getFBarticle = function(pidArray,sinceDate,untilDate,cb){

      //顯示總共要抓的文章總數(應該有的)
      //console.log(pidArray.length*yearDate);

      pidArray.forEach(function(element){
      FB.api(
        '/'+ element,
        'GET',
        {"fields":"posts.since("+sinceDate+").until("+untilDate+")"},
          function(response) {
            if (response && !response.error) {

                if(response.posts){
                    var articleArray = response.posts.data;
                    var articleIDArray = articleArray.map(function(element){
                    return element.id;
                    });
                    cb(null,articleIDArray);

                }else{
                    var articleNullArray = [];
                    cb(null,articleNullArray);

                }
            }else{
                cb(changeFBerror(response.error));
            }
          }
        );
      });

};

var insertArticle = function(fbtoken,sinceDate,untilDate){
    getFBpage(fbtoken,function(err,pidArray){
        if(err){
              console.log(err);
        }else{
              //console.log(pidArray);
              var insertTotal = 0;
              var pageArrayLength = pidArray.length;
              var getPage = 0;
              var totalArticle = 0;


              console.log("The number of fanpage current want to get:"+pageArrayLength);
              //以下會執行多次
              getFBarticle(pidArray,sinceDate,untilDate,function(err,aidArray){
                //console.log(aidArray);
                if(err){
                    getPage++;
                    if(getPage == pageArrayLength){
                      console.log("The number of article current want to get:"+totalArticle);
                    }
                    console.log(err);

                }else{
                    var articleArrayLength=aidArray.length;
                    getPage++;
                    totalArticle += articleArrayLength;
                    if(getPage == pageArrayLength){
                      console.log("The number of article current want to get:"+totalArticle+" ,and now is "+new Date());
                    }
                    var messageReplace = true;

                    getArticleContent(aidArray,messageReplace,function(err,articleData){
                          if(err){
                            console.log(err);
                          }else{

                            var article = new Article(articleData);

                            if(articleData.message&&article.picture){
                              //運用model中的ArticleTable裡頭CRUD方法中的CREATE
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
                                            console.log(article);

                                          }else{
                                            insertTotal++;
                                            console.log(insertTotal+":update");
                                            console.log(up_result.id);
                                            console.log(new Date());
                                          }

                                        });
                                      //insert不是errno = 1062
                                      }else{
                                        insertTotal++;
                                        console.log(insertTotal+":insert error");
                                        console.log(err);
                                        console.log(new Date());
                                        console.log(article);

                                      }

                                    //insert沒錯
                                    }else {
                                      insertTotal++;
                                      console.log(insertTotal+":insert");
                                      console.log(result.id);
                                      console.log(new Date());

                                    }
                              });
                            }else{
                                insertTotal++;
                                console.log("noMessageORPicture");
                                console.log(new Date());
                            }


                          }
                    });
                }
              });
        }
    });
};

//----------------------------------------------------------------//

//得到該fbtoken其likes的pageID陣列
var getFBpage = function(fbtoken,cb){

    FB.setAccessToken(fbtoken);
    FB.api(
    '/me',
    'GET',
    {"fields":"id,name,likes.limit(100)"},
      function(response) {
      // Insert your code here
        if (response && !response.error) {
            /* handle the result */
            var LikePageArray = response.likes.data;
            var pageIDarray = LikePageArray.map(function(element){
                return element.id;
            });
            cb(null,pageIDarray);
        }else{
            cb(response.error);
        }
      }
    );

};


var insertFanPage = function(fbtoken){
  getFBpage(fbtoken,function(err,pidArray){

    if(err){

      console.log(err);
    }else{

      pidArray.forEach(function(element){

        FB.api(
        '/v2.5/'+element,
        'GET',
        {"fields":"id,name,picture,start_info,record_label,about,description,bio,category,genre,likes,awards,hometown,current_location,band_members,band_interests,artists_we_like,booking_agent,influences,press_contact,website,link"},
        //fields後可修改為需要的欄位
          function(response) {
            if (response && !response.error) {

                  var sd = "";
                  if(response.start_info.date){
                        var dateObject =  response.start_info.date;

                        if(dateObject.year){
                          sd = dateObject.year;
                          if(dateObject.month){
                            sd += "/" + dateObject.month;
                            if(dateObject.day){
                              sd += "/" + dateObject.day;
                            }
                          }
                        }
                  }

                  var pageData = {
                    fid : response.id,
                    fname : response.name,
                    fpicture : response.picture.data.url,
                    fstart_date : sd,
                    fcategory : response.category,
                    flikes : response.likes,
                    flink : response.link,
                    //....
                  };

                  var fanpage = new Fanpage(pageData);
                  //運用model中的FanpageTable裡頭CRUD方法中的CREATE
                  fanpage.save(function(err,result){
                      //insert有無錯誤
                      if (err){
                        //是不是PRIMARY KEY error
                        if(err.errno === 1062){

                          fanpage.update(function(up_err,up_result){
                            //update有無錯誤
                            if(up_err){
                              console.log("update error");
                              console.log(up_err);
                              console.log(new Date());
                            }else{

                              console.log("update");
                              console.log(up_result.id);
                              console.log(new Date());
                            }

                          });
                        //insert不是errno = 1062
                        }else{
                          console.log('insert error');
                          console.log(err);
                          console.log(new Date());
                        }

                      //insert沒錯
                      }else {
                        console.log("insert");
                        console.log(result.id);
                        console.log(new Date());
                      }
                  });


            }else{
                  console.log(changeFBerror(response.error));
            }
          }
        );
      });
    }

  });

};

//用來設置token
var getToken = function(cb) {
    //取得一個值fbtoken
    if(err){
        cb(err);
    }else{
        cb(null,fbtoken);
    }
}

//----------------------------------------------------------------//
//**********//
//下面是此程式抓取資料的進入點，用input來決定抓的資料
// var stdin = process.openStdin();
// console.log("Please enter 'since afterDays' ,for example: 2016-07-11 1");
// stdin.addListener("data", function(d) {
//     var argData = d.toString().trim().split(/\s+/);
//     var sinceDateString = argData[0];
//     var afterDaysNumber = parseInt(argData[1],10);
//
//     var sinceDate = new Date(sinceDateString);
//     var untilDate = new Date();
//     //86400,000ms = 1 day
//     untilDate.setTime(sinceDate.getTime()+afterDaysNumber*86400000);
//     var untilDateString = untilDate.toISOString().slice(0,10);
//
//     getToken(function(err,result){
//          if(err){
//              console.log(err);
//          }else{
//              //找尋fanpage，insert進資料庫
//              insertFanPage(result);
//              //找尋article，insert進資料庫
//              insertArticle(result,sinceDateString,untilDateString);
//          }
//      });
// });


//----------------------------------------------------------------//


//給schedule-job使用的方法
//運用async套件來排序流程
FacebookModel.getArticleByDB = function(setting,cb){
      var searchFanpageTime = setting.searchFanpageTime;
      var searchArticleTime = setting.searchArticleTime;
      var sinceDate = setting.sinceDate;
      var untilDate = setting.untilDate;
      var fbTokenArray = setting.fbTokenArray;
      asyncLibrary.waterfall([
          //拿每個token
          function(callback){
              var accountTokenArray = [];
              var accountNum = 0;
              console.log("hi");
              fbTokenArray.forEach(function(fbToken){
                  fb.setAccessToken(fbToken);
                  if(err){
                    console.log(err);
                    accountTokenArray.push("noToken");
                    accountNum += 1;
                    if(accountNum == accountIDArray.length){
                        callback(null,accountTokenArray);
                    }

                  }else{
                    accountTokenArray.push(token);
                    accountNum += 1;
                    if(accountNum == accountIDArray.length){
                        callback(null,accountTokenArray);
                    }
                  }
              });
          },
          //用token找粉專id，並搜尋粉專內容，存進資料庫
          function(accountTokenArray,callback){
              console.log("Start search fanpage at "+ new Date());
              var accountNum = 1;
              var totalNum =  accountTokenArray.length;

              //不能同時間用所有token一起找，會衝突
              accountTokenArray.forEach(function(currentValue,index){

                setTimeout(function(){
                    var realIndex = index +1;
                    console.log("arrayIndex+1: "+realIndex);

                    if(currentValue !== "noToken"){

                        insertFanPage(currentValue,realIndex);
                    }
                    //console.log(accountNum);
                    if(accountNum == totalNum){
                        accountNum += 1;
                        setTimeout(function(){
                            console.log("Search Fanpage End at " + new Date());
                            callback(null,accountTokenArray);

                        },searchFanpageTime * (totalNum + 1));


                    }

                },searchFanpageTime * accountNum);

                accountNum += 1;

              });
          },
          //用token找粉專id，並用粉專id找文章，再將文章存進資料庫
          function(accountTokenArray,callback){
              console.log("Start search article at "+ new Date());
              var accountNum = 0;
              var totalNum =  accountTokenArray.length;

              accountTokenArray.forEach(function(currentValue,index){

                  setTimeout(function(){
                      var catryid = index + 1;
                      console.log("article"+catryid);
                      insertArticle(currentValue,sinceDate,untilDate);
                      //console.log(accountNum);
                      if(accountNum == totalNum){
                        accountNum += 1;
                        setTimeout(function(){
                            callback(null,"down");

                        },searchArticleTime * (totalNum + 1));

                      }

                  },searchArticleTime * accountNum);

                  accountNum += 1;

              });

          }

      ],function (err, result) {

        if(err){
          cb(err);
        }else{
          cb(null,result);
        }

      });

}

//-----------------------------------------------------------------//
//web爬fb部分，因為fb並無提供search api，故利用它有提供的web search來找資料
var ServerError = {
    code : 500,
    success : false,
    message : "QueryDataFromServerError"
};
//Facebook爬蟲，需要先了解實際DOM與解決CAPTCHA問題
FacebookModel.get = function(query,cb){

  //放置抓到的網頁位址
  var writeStream = fs.createWriteStream('exampleFileLocation');
  //exampleFileLocation:./tmp/articles.html
  var options = {
    method: 'GET',
    url: 'https://www.facebook.com/search/pages/',
    qs: { q: query},
          //url: https://www.facebook.com/hashtag/query
    headers:
        {
            'host': 'www.facebook.com',
            'connection': 'keep-alive',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'user-agent': 'Mozilla/5.0  AppleWebKit/601.1.56 (KHTML, like Gecko) Version/9.0 Safari/601.1.56',
            'upgrade-insecure-requests': '1',
            'cookie':'???',
            'cache-control': 'max-age=0',
            'Content-Type': 'text/html; charset=utf-8',
            'accept-encoding': 'gzip, deflate,sdch',
            'accept-language': 'zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2,zh-CN;q=0.2',
         }
  };
  asyncLibrary.waterfall([

    //第一步，發request，在此需解決CAPTCHA問題，用設置headers來避免，但有時會失敗，需參考其他方式
    function(callback){
          request
            .get(options)
            .on('response', function(response) {
                var encoding = response.headers['content-encoding'];
                if (encoding == 'gzip') {
                  response.pipe(zlib.createGunzip()).pipe(writeStream);
                } else if (encoding == 'deflate') {
                  response.pipe(zlib.createInflate()).pipe(writeStream);
                } else {
                  response.pipe(writeStream);
                }
            })
            .on('error', function(err) {
                callback(err);
            })
            .on('end',function(){
               setTimeout(function() {
                callback();
               },10);
            });
    },

    //第二步，解析html，在此fb網頁之DOM會變化，所以需要隨網頁更改
    function(callback){
        fs.readFile('exampleFileLocation', function(err,data){
          if(err){
            callback(err);
          }else{
            var $ = cheerio.load(data.toString());
            var codecotent = $('code').html();
            if(codecotent !== null){
              codecotent = codecotent.substring(5,codecotent.length-3);
              $ = cheerio.load(codecotent);
              var datadiv = $(' div div div').find('div');
              var pageIDarray = [];


              if(datadiv.hasClass('_3u1 _gli _5und')){
                datadiv.filter(function(i,e){

                  if(e.attribs.class === '_3u1 _gli _5und'){

                      return true;
                  }else{

                      return false;
                  }
                })
                .map(function(i,e){
                    return e.attribs['data-bt'].substring(6,e.attribs['data-bt'].indexOf(","));
                })
                .each(function(i,e){
                  pageIDarray.push(e);
                });

                callback(null,pageIDarray);

              }else{

                callback(ServerError);

              }

            }else{

              callback(null,[]);
            }

          }
        });

    },

    //找到了欲抓取的fanpageID陣列，就同之前方式抓取每個fanpage的articleID陣列
    function(pidArray,callback){

        var sinceDate = 2016-06-01;
        var untilDate = 2016-06-30;
        var aidTotalArray = [];
        var count = 0;

        //這邊需要token要定期改或用其他方式
        FB.setAccessToken(fbtoken);
        //fbtoken用來通過Graph api的方法認證
        getFBarticle(pidArray,sinceDate,untilDate,function(err,aidArray){
            if(err){
              callback(err);
            }else{
              count++;
              aidArray.forEach(function(element){
                aidTotalArray.push(element);
              });

              if(count === pidArray.length ){
                  callback(null,aidTotalArray);
              }
            }


        });

    },
    //得到了欲抓取的articleID陣列，就同之前方式抓取每個相對應的article資料
    function(aidTotalArray,callback){

        var messageReplace = false;
        var articleTotalArray = [];
        var count = 0;

        //console.log(aidTotalArray);
        getArticleContent(aidTotalArray,messageReplace,function(err,articleData){
          if(err){
              console.log(err);
              callback(err);
            }else{
              if(articleData.created_time){

                  var artime = articleData.created_time;
                  var changeArtime = artime.slice(0,10).replace(/T/, ',').replace(/\..+/, '');
                  articleData.created_time = changeArtime;
              }

              if(articleData.message && articleData.picture){

                  articleTotalArray.push(articleData);
                  count++;
              }else{

                  count++;
              }

              if(count === aidTotalArray.length ){
                  callback(null,articleTotalArray);
              }

            }


        });

    }


  ],function (err, result) {

        if(err){
          cb(err);
        }else{

          cb(null,result);
        }

  });

};

//-----------------------------------------------------------------//



module.exports = FacebookModel;
