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

exports.planner = function(req, res) {
	res.render('planner');
};

//eventually lock this with authentication
exports.goals = function(req, res) {
	res.render('uploadGoals');
};

//called during post of goals
exports.uploadGoals = function(req, res) {
	var goals, file;
	if (!req.files) {
		res.redirect('/goals/status?error=true&message=' + encodeURIComponent('No file was uploaded.  You must upload before submitting'))
	} else {
		goals = parseGoals.parseFile(req.files.goals.path, function(err, JSON) {
			if (err) {
				res.redirect('/goals/status?error=true&message=' + encodeURIComponent(err.message));
			} else {
				//redirect also
				/*
				file = fs.createWriteStream('test2.json');
				file.write(new Buffer(JSON), function(err) {
					if (err) {
						res.redirect('/goals/status?error=true&message=' + encodeURIComponent(err.message));
					} else {
						//res.pipe(file);
						res.send()
					}
				});
				*/
				res.send(JSON);
				
			}
		});
	}
};

exports.uploadStatus = function(req, res) {
	var error = (req.query.error === "true") ? true : false,
		title = (error) ? "Failure!" : "Success!",
		message = req.query.message;

	res.render('uploadStatus.ejs', {title: title, error: error, message: message});
};



