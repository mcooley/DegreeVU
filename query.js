var mongo = require("mongodb");
var fs = require("fs")
var config = JSON.parse(fs.readFileSync("dbConfig.json"));


var dbName = config.name;
var dbHost = config.host;
var dbPort = mongo.Connection.DEFAULT_PORT;
var db = new mongo.Db(dbName, new mongo.Server(dbHost, dbPort), {});


//takes a query token and returns a parsed query object
function parseQuery(queryToken) {
	//this is what the query object looks like
	var queryObject = {
		coursePrefix: "",
		courseSuffix: "",
		courseNumber: 0,
		queryToken: "",
		category: "",
		school: "",
		//not indicates if this is an 'anti-query',
		//or appended with ! to remove courses
		//from the query
		not: false
	},
	    lastCharacter = queryToken.charAt(queryToken.length - 1);

	switch (lastCharacter) {
		case '!':

			queryObject = parseQuery(queryToken.substr(0,queryToken.length - 1));
			queryObject.not = true;
			return queryObject;

		case '+':

			queryObject.queryToken = '+';
			queryObject.coursePrefix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
			queryObject.courseNumber = +queryToken.match(/\d+/)[0];
			return queryObject;

		case '$':

			queryObject.queryToken = '$';
			queryObject.courseSuffix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
			return queryObject;

		case '*':

			queryObject.coursePrefix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
			return queryObject;

		case '~':

			queryObject.coursePrefix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
			return queryObject;

		case '^':

			queryObject.school = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
			return queryObject;
		default:
			//this is a single course query
			if (+lastCharacter === +lastCharacter) {
				//last character is a number
				queryObject.courseNumber = +queryToken.match(/\d+$/)[0];
			} else {
				//last character is not a number
				queryObject.courseNumber = +queryToken.match(/\d+/)[0];
				queryObject.courseSuffix = queryToken.match(/[a-z]+$/i)[0].toUpperCase();
			}

			queryObject.coursePrefix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
			return queryObject;

	}
};
//takes the query tokens as an array and returns a mongodb 
//query for the courses that are being searched
function generateDBQuery(queryTokens) {
	var tokens = queryTokens.map(function(query) {
			return parseQuery(query);
		}),
		antiTokens = [],
		singleCourseTokens = [],
		schoolTokens = [],
		plusTokens = [],
		categoryTokens = [],
		starTokens = [],
		suffixTokens = [],

		queryObject = {};

	tokens.forEach(function(token) {
		
		switch(token.queryToken) {
			case "":
				singleCourseTokens.push(token);
				break;
			case "+":
				plusTokens.push(token);
				break;
			case "*":
				starTokens.push(token);
				break;
			case "$":
				suffixTokens.push(token);
				break;
			case "~":
				categoryTokens.push(token);
				break;
			case "^":
				schoolTokens.push(token);
				break;

			default:
				throw new Error("Token has invalid query token property");
				break;
		}
	});

	if (singleCourseTokens.length) {
		queryObject.courseCode = {};
		queryObject.courseCode.$in = singleCourseTokens.filter(function(token) {
			return !token.not;
		}).map(function(token) {
			return new RegExp(token.coursePrefix + " " + token.courseNumber.toString(), "i");
		});

		queryObject.courseCode.$nin = singleCourseTokens.filter(function(token) {
			return token.not;
		}).map(function(token) {
			return new RegExp(token.coursePrefix + " " + token.courseNumber.toString(), "i");
		});

	}

	return queryObject;
};


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
	console.log(generateDBQuery(tokens));
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