var mongo = require("mongodb");
var fs = require("fs")
var config = JSON.parse(fs.readFileSync("dbConfig.json"));


var dbName = config.name;
var dbHost = config.host;
var dbPort = mongo.Connection.DEFAULT_PORT;
var db = new mongo.Db(dbName, new mongo.Server(dbHost, dbPort), {});

// Retrns the course with the given key.
function getGoalsByKey(key, callback) {
	db.collection("goals", function(error, callback) {
		if (error) {
			console.log(error);
		}
		var goalKey = mongo.ObjectID.createFromHexString(key);
		collection.find({"_id" : type}, function(error, cursor) {
			if (error) {
				console.log(error);
			}
			cursor.toArray(function(error, goals) {
				callback(goals[0]);
			})
		});
	});
};

// Returns all courses with the given type as an array
function getGoalsByType(type, callback) {
	db.collection("goals", function(error, callback) {
		if (error) {
			console.log(error);
		} 
		collection.find({"type" : type}, function(error, cursor) {
			if (error) {
				console.log(error);
			}
			cursor.toArray(function(error, goals) {
				callback(goals);
			})
		});
	});
};

// Returns the course with the given key to the callback.
function getCoursesByKey(key, callback) {
	db.collection("courses", function(error, collection) {
		if (error) {
			console.log(error);
		}
		var objKey = mongo.ObjectID.createFromHexString(key);
		collection.find({"_id" : objKey}, function(error, cursor) {
			if (error) {
				console.log(error);
			}
			cursor.toArray(function(error, courses) {
				callback(courses);
			});
		});
	});
};

// Takes in the name of the course and returns the course key
function getCourseKeyByName(courseNumber, callback) {
	db.collection("courses", function(error, collection) {
		if (error) {
			console.log(error);
		}
		collection.find({"courseNumber" : courseNumber}, function(error, cursor) {
			if (error) {
				console.log(error);
			}
			cursor.toArray(function(error, courses) {
				if (courses[0]) {
					callback(courses[0]._id);
				} else {
					callback(null);
				}
			});
		});
	});
};

function getCoursesByCode(code, callback) {
	db.collection("courses", function(error, collection) {
		if (error) {
			console.log(error);
		}
		collection.find({"courseCode": code}, function(error, cursor) {
			if (error) {
				console.log(error);
			}
			cursor.toArray(function(error, courses) {
				callback(courses);
			});
		});
	});
};
// Queries for the database in collection with courseNumber
// or courseName matching some part of the string.
// Pre: numResults is a positive int.
function getCoursesLike(str, numResults, callback) {
	db.collection("courses", function(error, collection) {
		if (error) {
			console.log(error);
		}


		myregex = new RegExp(str, "i"); // For any strings that have 'str' appear (case insenstivie)

		// Return an array of all 
		collection.find({ $or: [{"courseCode" : myregex}, 
								{"courseNumber" : myregex},
		 						{"coursePrefix" : myregex}]}, function(error, cursor) {
									if (error) {
										console.log(error);
									}
									cursor.limit(numResults);
									cursor.toArray(function(error, courses) {
										if (error) {
											console.log(error);
										}
										callback(courses);
			});
		});
	});
};

function parseCourseToken(token) {
	var coursePrefix = token.match(/[a-z]+/i)[0];
	var courseNumber = token.match(/\d+/);
	var courseSuffix = "";
	var parseChar = "";
	var temp = token[token.length - 1];

	if (temp.match(/[+, !, ~, *, $]/)) {
		parseChar = temp;
	}
	if (temp.match(/[a-z]/i)) {
		courseSuffix = temp;
	}
	var temp2 = token[token.length - 2];
	if (temp2.match(/[a-z]/i)) {
		var courseSuffix = temp2;
	}
	var courseCode = coursePrefix + " " + courseNumber + courseSuffix;
	var course = {
		"coursePrefix" : coursePrefix,
		"courseSuffix" : courseSuffix,
		"courseCode" : courseCode,
		"parseChar" : parseChar
	};

	if (courseNumber) {
		course.courseNumber = parseInt(courseNumber[0]);
	} else {
		course.courseNumber = 0;
	}

	return course;
};

function getCoursesFromTokens(tokens, callback) {
	db.collection("courses", function(error, collection) {
		if (error) {
			console.log(error);
		}
		var timeBomb = tokens.length;
		var checkBomb = function() {
			timeBomb--;
			if (timeBomb <= 0) {
				var flattenedResults = [];
				results.additions.forEach(function(r) {
					if (r && r._id) {
						flattenedResults.push(r);
					} else if (r && r.length) {
						flattenedResults = flattenedResults.concat(r);
					}
				});

				var finalResults = flattenedResults.filter(function(item) {
					if (item) {
						return (results.removals.indexOf(item._id.toString()) === -1);
					}
					return false;
				});

				callback(finalResults);
			}
		};

		var results = {additions:[], removals:[]};

		tokens.forEach(function(token, i) {
			
			var course;
			if (token.match(/[+,~,*]!/)) {
				
				//then there is a double query token
				getCoursesFromTokens([token.substr(0,token.length - 1)], function(subResults) {
					subResults.forEach(function(removalCourse) {
						results.removals.push(removalCourse._id.toString());
					});
					checkBomb();
				});
			} else {

				course = parseCourseToken(token);
				if (course.parseChar === "+") {
					getCoursesPlus(course, function(courses) {
						if (courses.length > 0) {
							results.additions[i] = courses;
						}
						checkBomb();
					});
				} else if (course.parseChar === "!") {
					getCoursesByCode(course.courseCode, function(courses) {	

						if (courses.length > 0) {
							results.removals.push(courses[0]._id.toString());
						}
						checkBomb();
					});
				} else if (course.parseChar === "*") { 
					getCoursesPlus(course, function(courses) {
						if (courses.length > 0) {
							results.additions[i] = courses;
						}
						checkBomb();
					});
				} else if (course.parseChar === '~') {
					getCoursesByCategory(course.coursePrefix, function(courses) {
						if (courses.length > 0) {
							results.additions[i] = courses;
						}
						checkBomb();
					});
				} else if (course.parseChar === '$') {
					getCoursesBySuffix(course.courseSuffix, function(courses) {
						if (courses.length > 0) {
							results.additions[i] = courses;
						}
						checkBomb();
					});
				} else {
					getCoursesByCode(course.courseCode, function(courses) {
						if (courses.length > 0) {
							results.additions[i] = courses[0]; //Closure issues
						}
						checkBomb();
					});
				}

			}
			
		});
	});
};

function getCoursesPlus(course, callback) {
	db.collection("courses", function(error, collection) {
		var courseNumber = course.courseNumber;
		var coursePrefix = course.coursePrefix;
		collection.find({"courseNumber" : {$gte: courseNumber}, "coursePrefix" : coursePrefix}, function(error, cursor) {
			cursor.toArray(function(error, courses) {
				callback(courses);
			});
		});
	});
}

function getCoursesBySuffix(suffix, callback) {
	db.collection("courses", function(error, collection) {
		collection.find({"courseSuffix": suffix}, function(error, cursor) {
			cursor.toArray(function(error, courses) {
				callback(courses);
			});
		});
	});

};

function getCoursesByCategory(cat, callback) {
	db.collection("courses", function(error, collection) {
		collection.find({"category" : cat}, function(error, cursor) {
			cursor.toArray(function(error, courses) {
				callback(courses);
			});
		});
	});
};

function getGoalsByName(name, callback) {
	db.collection("goals", function(error, collection) {
		var regex = RegExp(name, "i");
		collection.find({"name" : regex}, function(error, cursor) {
			cursor.toArray(function(error, goals) {
				console.log(goals);
				callback(goals);
			});
		});
	});
};

// Open the connection
db.open(function(error) {
	if (!error) {
		console.log("Connected to " + dbName + " at " + dbHost + ":" + dbPort);
	} else {
		console.log("Error connecting to database: " + error);
	}
});

exports.getCoursesByKey = getCoursesByKey;
exports.getCoursesLike = getCoursesLike;
exports.getGoalsByType = getGoalsByType;
exports.getGoalsByKey = getGoalsByKey;
exports.getCoursesFromTokens = getCoursesFromTokens;
exports.getGoalsByName = getGoalsByName;