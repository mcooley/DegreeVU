var query = require('../query.js');

exports.index = function(req, res) {
	query.getGoalsByName("", function(goals) {
		res.render('index', {queryArray: goals});
	});
}

exports.home = function(req, res) {
	res.render('home');
}