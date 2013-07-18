var express = require('express'),
  routes = require('./routes'),
  lessMiddleware = require('less-middleware'),
  http = require('http'),
  query = require("./query.js"),
  mongo = require("./node_modules/mongodb");

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  app.use(lessMiddleware({src: __dirname + '/public', compress: true}));

  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index)


app.get("/courses/autocomplete", function(req, res) {
  var qryStr = req.query.qry;
  var courses = query.getCoursesLike(qryStr, 10, function(courses) {
    var results = "";
    for (var i = 0; i < courses.length; i++) {
      // delete results._id;
      results = results + JSON.stringify(courses[i]);
    }
    res.send("Your courses: " + results);
  });
});



// app.get("/goals/:key", function(req, res) {
//   var goalKey = req.params.key;
//   query.getGoalsByKey(goalKey, function(error, goals) {
//     res.send(goals[0]);
//   });
// });

app.get("/courses/lookup", function(req, res) {
  var str = req.query.q;
  tokens = str.split(",");
  query.getCoursesFromTokens(tokens, function(courses) {
// <<<<<<< HEAD
    var results = JSON.stringify(courses);
    // var results = "";
    // for (var i = 0; i < courses.length; i++) {
    //   results = results + JSON.stringify(courses[i]);
    // }
// =======
    //var results = "";
    //for (var i = 0; i < courses.length; i++) {
    //  results = results + JSON.stringify(courses[i]);
    //}
// >>>>>>> 05ef88db08fad9a75b59a11a3ba3a4a50bd7177a
    // console.log(results);
    res.send(JSON.stringify(courses));
  });
});

app.get("/courses/:key", function(req, res) {
  var courseKey = req.params.key;
  query.getCoursesByKey(courseKey, function(course) {
    res.send(course[0]);
  });
}); 

app.get('/home', routes.home);

app.get('/ejs/templates', routes.templates);

app.get('/goals', routes.goals);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
