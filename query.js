var mongo = require("mongodb"),
	Db = mongo.Db,
   // fs = require("fs"),
    // = JSON.parse(fs.readFileSync("dbConfig.json")),
    _ = require('underscore')._,

    //dbName = config.name,
    //dbHost = config.host,
    //dbPort = mongo.Connection.DEFAULT_PORT,
    //db = new mongo.Db(dbName, new mongo.Server(dbHost, dbPort), {}),
    MONGODB_URL;

    schoolMap = {
	ENGINEERING: "School of Engineering",
	AS: "College of Arts and Science",
	BLAIR: "Blair School of Music",
	PEABODY: "Peabody College"
};

//add some functionality missing from underscore
//checks for deep compairson between objects when
//computing difference array
_.differenceDeep = function(array1, array2) {
	var difference = [],
	    add;
	array1.forEach(function(obj1) {
		add = true;
		array2.forEach(function(obj2) {
			if (_.isEqual(obj1, obj2)) {
				add = false;
			}
		});
		if (add) {
			difference.push(obj1);
		}
	});
	return difference;
};


//initial setup here
if (process.env.MONGOHQ_URL) {
	MONGODB_URL = process.env.MONGOHQ_URL;
} else {
	MONGODB_URL = "mongodb://localhost:27017/degreeVU";
}

//helper methods that do not interact with the database

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
	    lastCharacter = queryToken.charAt(queryToken.length - 1),
	    firstCharacter = queryToken.charAt(0);
	if (firstCharacter === '!') {

		queryObject = parseQuery(queryToken.substr(1,queryToken.length - 1));
		queryObject.not = true;
		return queryObject;

	} else {

		switch (lastCharacter) {

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
				queryObject.queryToken = "*";
				queryObject.coursePrefix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
				return queryObject;

			case '~':
				queryObject.queryToken = "~";
				queryObject.coursePrefix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
				return queryObject;

			case '^':
				queryObject.queryToken = "^";
				queryObject.school = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
				return queryObject;
			default:
				//this is a single course query
				if (+lastCharacter === +lastCharacter) {
					//last character is a number, NaN is not equal to itself
					queryObject.courseNumber = +queryToken.match(/\d+$/)[0];
				} else {
					//last character is not a number
					queryObject.courseNumber = +queryToken.match(/\d+/)[0];
					queryObject.courseSuffix = queryToken.match(/[a-z]+$/i)[0].toUpperCase();
				}

				queryObject.coursePrefix = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
				return queryObject;

		}
	}
	
};
//takes the query tokens as an array and returns a mongodb 
//query for the courses that are being searched
//this method does not differentiate between positive and negative queries
//NEED TO START FIXING THIS IN ORDER TO HANDLE NEGATIVE QUERIES PROPERLY
function generateDBQuery(queryTokens) {
	var tokens = queryTokens.map(function(query) {
			return parseQuery(query);
		}),

		singleCourseTokens = [],
		schoolTokens = [],
		plusTokens = [],
		categoryTokens = [],
		starTokens = [],
		suffixTokens = [],

		queryObject = {},

		//helper variables
		lastElement,
		plusPrefixes = [],
		prefixFilter,
		tempObject;

	tokens.forEach(function(token) {
		
		

			switch(token.queryToken) {
				case "":
					
					singleCourseTokens.push(token);
					break;
					
				case "+":
					//only keep track of the plus prefixes that are positive,
					//want to ignore the negation for plus prefix if it does not have
					//a corresponding plus prefix
					if (plusPrefixes.length && !token.not) {
						if (plusPrefixes.filter(function(prefix) {return prefix === token.coursePrefix;}).length == 0) {
							plusPrefixes.push(token.coursePrefix);
						}

					} else {
						plusPrefixes.push(token.coursePrefix);
					}

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

	queryObject.$or = [];
	if (singleCourseTokens.length) {

		queryObject.$or.push({courseCode: {}});
		//keep track of the element that was just pushed
		lastElement = queryObject.$or.length - 1;

		queryObject.$or[lastElement].courseCode.$in = singleCourseTokens.map(function(token) {
			
			return new RegExp("^" + token.coursePrefix + " " + token.courseNumber.toString() + token.courseSuffix + "$", "i");
		});

	}

	//sort the plus prefixes
	//also filter the array so the positive and negative values of the same
	//course prefix are always alternating; prevents ambiguous queries from
	//poluting query object
	plusTokens.sort(function(token1, token2) {
		if (token1.coursePrefix !== token2.coursePrefix) {
			return (token1.coursePrefix < token2.coursePrefix) ? -1 : 1;
		}
		return token1.courseNumber - token2.courseNumber;
	}).filter(function(token, index, _array) {

		if (index !== 0 && token.coursePrefix === _array[index - 1].coursePrefix) {
			return token.not !== _array[index - 1].not;
		}
		return true;
	});
	console.log(plusTokens);
	console.log(plusPrefixes);

	plusPrefixes.forEach(function(prefix) {
		//add an or query for each prefix for 
		//each plus query
		queryObject.$or.push({coursePrefix: "", courseNumber: {}});
		lastElement = queryObject.$or.length - 1;
		prefixFilter = plusTokens.filter(function(token) {return prefix === token.coursePrefix;});

		//at most 2 elements in the filtered
		//array
		prefixFilter.forEach(function(token) {
			queryObject.$or[lastElement].coursePrefix = token.coursePrefix;
			
			tempObject = queryObject.$or[lastElement].courseNumber.$gte = token.courseNumber;


		});
	});
	

	
	starTokens.forEach(function(token) {
		queryObject.$or.push({coursePrefix: new RegExp("^" + token.coursePrefix + "$", "i")});
	});
	

	
	suffixTokens.forEach(function(token) {
		queryObject.$or.push({courseSuffix: new RegExp("^" + token.courseSuffix + "$", "i")});
	});
	

	
	schoolTokens.forEach(function(token) {
		queryObject.$or.push({college: new RegExp("^" + schoolMap[token.school] + "$", "i")});
	});

	return queryObject;
};



//pass in a DB query and the courses that are
//returned from the database are passed into the callback
//the callback arguments are error, courses
function queryCourses(query, callback) {
	Db.connect(MONGODB_URL, function(err, db) {

		db.collection("courses", function(error, collection) {
			collection.find(query, function(err,cursor) {
				cursor.toArray(function(err, courses) {
					callback(err, courses);
					db.close();
				});
			});
		});

	});
		
}

function getCoursesFromTokens(tokens, callback) {
	//separate tokens into negative and positive queries
	var positiveSet = [],
	    negativeSet = [];

	tokens.forEach(function(token) {
		if (token.charAt(0) === "!") {
			negativeSet.push(token.substr(1, token.length - 1));
		} else {
			positiveSet.push(token);
		}
	});

	queryCourses(generateDBQuery(positiveSet), function(error, positiveCourses) {
		if (error) {
			
			throw error;
		} else if (negativeSet.length) {
			
			queryCourses(generateDBQuery(negativeSet), function(error, negativeCourses) {
				if (error) {
					
					throw error;
				} else {
					callback(_.differenceDeep(positiveCourses, negativeCourses));
				}
			});
		} else {
			
			callback(positiveCourses);
		}
	});
	
}

function getGoalsByName(callback) {
	callback(["Computer Science", "HOD"]);
};
// Open the connection
/*
db.open(function(error) {
	if (!error) {
		console.log("Connected to " + dbName + " at " + dbHost + ":" + dbPort);
	} else {
		console.log("Error connecting to database: " + error);
	}
});
*/



//exports.getCoursesByKey = getCoursesByKey;
//exports.getCoursesLike = getCoursesLike;
//exports.getGoalsByType = getGoalsByType;
//exports.getGoalsByKey = getGoalsByKey;
exports.getCoursesFromTokens = getCoursesFromTokens;
exports.getGoalsByName = getGoalsByName;



//query methods that are currently not being used
/*
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
*/
