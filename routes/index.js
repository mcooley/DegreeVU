var query = require('../query.js'),
	fs = require('fs'),
    parseGoals = require('../parseGoals.js');


exports.index = function(req, res) {
	//TO-DO, retrieve goals from here
	/*
	query.getGoalsByName("", function(goals) {
		console.log(goals);
;		res.render('index', {queryArray: goals});
	});
*/
	res.render('index');


};

exports.home = function(req, res) {
	res.render('home');
};

exports.templates = function(req, res) {
	//TODO: caching, and remove the synchronous file reads
	fs.readdir('views/templates', function(err, filenames) {
		if (err) {
			console.log(err);
			res.send(500);
		} else {
			var templates = {};
			filenames.forEach(function(filename) {
				var tmpl = fs.readFileSync('views/templates/' + filename);
				templates[filename] = tmpl.toString();
			});
			res.json(templates);
		}
	});
}

//eventually lock this with authentication
exports.goals = function(req, res) {
	res.render('uploadGoals');
};