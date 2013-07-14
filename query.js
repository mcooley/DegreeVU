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
_.extendDeep = function(object) {
	var copy = {};
	for (i in object) {
		if (object.hasOwnProperty(i)) {
			if (typeof i === object && i !== null) {
				copy[i] = _.extendDeep(i);
			} else {
				copy[i] = object[i];
			}
		}
	}
	return copy;
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
				queryObject.category = queryToken.match(/^[a-z]+/i)[0].toUpperCase();
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

function parseQueries(queries) {
	console.log("Parse queries was called");
	var parsedQueries =  queries.map(function(query) {
		return parseQuery(query);
	});
	console.log(parsedQueries);
	return parsedQueries;
}
//takes a query object and inverts it
//so the not variable is changed in value
function invertQueries(queriesArray) {
	return queriesArray.map(function(query) {
		var copy = _.extendDeep(query);
		console.log("extend deep: " + JSON.stringify(copy));
		copy.not = !copy.not;
		return copy;
	});
	
};
//takes the query tokens as an array and returns a mongodb 
//query for the courses that are being searched
//this method does not differentiate between positive and negative queries
//NEED TO START FIXING THIS IN ORDER TO HANDLE NEGATIVE QUERIES PROPERLY
function generateDBQuery(tokens) {
	
	var singleCourseTokens = [],
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
		tempObject,
		//due to some ambiguity, certain 
		//queries are filtered out in this process
		//particularly negative plus queries
		//these queries are saved and returned
		//to be dealt with by some parent process
		//only keep track of removed tokens
		//that can make a difference if they were
		//added to a negative query
		removedQueries = [];

	tokens.forEach(function(token) {

			switch(token.queryToken) {
				case "":
					
					
					if (token.not) {
						removedQueries.push(token);
					} else {
						singleCourseTokens.push(token);
					}
					break;
					
				case "+":
					//only keep track of the plus prefixes that are positive,
					//want to ignore the negation for plus prefix if it does not have
					//a corresponding plus prefix
					if (!token.not) {
						if (plusPrefixes.length) {
							if (plusPrefixes.filter(function(prefix) {return prefix === token.coursePrefix;}).length == 0) {
								plusPrefixes.push(token.coursePrefix);
							}

						} else {
							plusPrefixes.push(token.coursePrefix);
						}
					}
						

					plusTokens.push(token);
					break;
				case "*":
					if (token.not) {
						removedQueries.push(token);
					} else {
						starTokens.push(token);
					}
					
					break;

				case "$":
					if (token.not) {
						removedQueries.push(token);
					} else {
						suffixTokens.push(token);
					}
					
					break;
				case "~":
					
					if (token.not) {
						removedQueries.push(token);
					} else {
						categoryTokens.push(token);
					}
					
					
					break;
				case "^":
					if (token.not) {
						removedQueries.push(token);
					} else {
						schoolTokens.push(token);
					}
					
					break;

				default:
					throw new Error("Token has invalid query token property " + JSON.stringify(token));
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
	plusTokens = plusTokens.sort(function(token1, token2) {
		if (token1.coursePrefix !== token2.coursePrefix) {
			return (token1.coursePrefix < token2.coursePrefix) ? -1 : 1;
		}
		return token1.courseNumber - token2.courseNumber;
	}).filter(function(token, index, _array) {

		if (index !== 0 && token.coursePrefix.toLowerCase() === _array[index - 1].coursePrefix.toLowerCase()) {
			
			return token.not !== _array[index - 1].not;
		}
		//only return elements that have a registered
		//coursePrefix to prevent
		//lose not queries
		if (!_.contains(plusPrefixes, token.coursePrefix)) {
			removedQueries.push(token);
			return false;
		}
		return true;
	});

	plusPrefixes.forEach(function(prefix) {
		var i, n;
		//add an or query for each prefix for 
		//each plus query
		queryObject.$or.push({coursePrefix: "", courseNumber: {}});
		lastElement = queryObject.$or.length - 1;
		//prefix filter should maintain the same order
		//of the array with the exception of the missing elements
		prefixFilter = plusTokens.filter(function(token) {return prefix === token.coursePrefix;}),
		tempObject;

		//at most 2 elements in the filtered
		//array
		if (prefixFilter.length === 1) {
			queryObject.$or[lastElement].coursePrefix = prefixFilter[0].coursePrefix;
			tempObject = queryObject.$or[lastElement].courseNumber.$gte = prefixFilter[0].courseNumber;
		} else {

			for (i=0, n = prefixFilter.length; i < n; ++i) {
				queryObject.$or[lastElement].coursePrefix = prefixFilter[i].coursePrefix;
				tempObject = queryObject.$or[lastElement].courseNumber.$gte = prefixFilter[i].courseNumber;
				if (i < n-1) {
					//then there is a corresponding negative query
					tempObject = queryObject.$or[lastElement].courseNumber.$lt = prefixFilter[i+1].courseNumber;
					i++;
				}
			}
		}
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

	categoryTokens.forEach(function(token) {
		queryObject.$or.push({category: new RegExp("^" + token.category + "$", "i")});
	
	});

	return {
		query: queryObject,
		filter: removedQueries
	};
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
	
	var processedTokens = generateDBQuery(parseQueries(tokens));
	
	

	queryCourses(processedTokens.query, function(error, positiveCourses) {
		if (error) {
			
			throw error;
		} else if (processedTokens.filter.length) {

			queryCourses(generateDBQuery(invertQueries(processedTokens.filter)).query, function(error, negativeCourses) {
				
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
