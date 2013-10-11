var express = require('express'),
	lessMiddleware = require('less-middleware'),
	http = require('http'),
	query = require('./query');

var app = express();

app.configure(function() {
	app.set('port', process.env.PORT || 3000);

	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');

	app.use(lessMiddleware({
		src: __dirname + '/public',
		compress: true
	}));

	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);

	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.use(express.errorHandler());
});

app.get('/', function(req, res) {
	query.listMajors(function(err, majors) {
		res.render('index', {
			majors: majors
		});
	});
});

app.get("/courses/lookup", function(req, res) {
	var tokens = req.query.q.split(",");
	query.getCoursesFromTokens(tokens, function(err, courses) {
		if (err) throw err;
		if (!courses) res.send(404);
		res.send(courses);
	});
});

app.get("/courses/:key", function(req, res) {
	var courseKey = req.params.key;
	query.getCourseByKey(courseKey, function(err, doc) {
		if (err) throw err;
		if (!doc) res.send(404);
		res.send(doc);
	});
});

app.get("/goals/:key", function(req, res) {
	var goalKey = req.params.key;
	query.getGoalByKey(goalKey, function(err, doc) {
		if (err) throw err;
		if (!doc) res.send(404);
		res.send(doc);
	});
});

app.get('/planner', function(req, res) {
	res.render('planner');
});

http.createServer(app).listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});
