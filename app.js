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

app.get("/courses/lookup", function(req, res) {
  var str = req.query.q;
  tokens = str.split(",");
  query.getCoursesFromTokens(tokens, function(courses) {

    var results = JSON.stringify(courses);
    
    res.send(JSON.stringify(courses));
  });
});

app.get("/courses/:key", function(req, res) {
  var courseKey = req.params.key;
  query.getCourseByKey(courseKey, function(err, doc) {
	  res.send(doc);
  });
});

app.get("/goals/:key", function(req, res) {
  var goalKey = req.params.key;
  query.getGoalByKey(goalKey, function(err, doc) {
	  res.send(doc);
  });
});

app.get('/planner', routes.planner);

app.get('/goals', routes.goals);
app.post('/goals/upload', routes.uploadGoals);
app.get('/goals/status', routes.uploadStatus);


/*temp route*/
app.get('/test', function(req, res) {
  res.render('testValidation.ejs');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
