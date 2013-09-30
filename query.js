var mongo = require("mongodb"),
	Db = mongo.Db,
   
    Tokenizer = require('./tokenizer.addon'),
    Statement = Tokenizer.Statement,
    StatementCollection = Tokenizer.StatementCollection,

    MONGODB_URL;



//initial setup here
if (process.env.MONGOHQ_URL) {
	MONGODB_URL = process.env.MONGOHQ_URL;
} else {
	MONGODB_URL = "mongodb://localhost:27017/degreeVU";
}

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

function getCoursesFromTokens(queries, callback) {
	var qCollection = new StatementCollection(queries),
		mongoQuery = qCollection.mongoQuery();
	if (mongoQuery) {
		queryCourses(mongoQuery, function(err, courses) {
			if (err) {
				throw err;
			}
			callback(courses);
		});
	} else {
		callback([]);
	}
		
}

function getGoalsByName(callback) {
	callback(["Computer Science", "HOD"]);
};




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
