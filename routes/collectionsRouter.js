
var errReturn = function (err, res) {
  debug(err);
  res.status(err.code||404);
  return res.json(err);
};

router.get('/', function(req, res, next) {

});

router.get('/articles',function(req,res,next){

});



router.post("/", function(req,res,next){
});


router.post('/articles',function(req,res,next){

});

router.delete("/",function(req,res,next){

//TODO
});

router.delete('/articles',function(req,res,next){

});



module.exports = router;
