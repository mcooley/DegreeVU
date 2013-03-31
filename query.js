var mongo = require("mongodb");
var fs = require("fs")
var config = JSON.parse(fs.readFileSync("dbConfig.json"));


var dbName = config.name;
var dbHost = config.host;
var dbPort = mongo.Connection.DEFAULT_PORT;
var db = new mongo.Db(dbName, new mongo.Server(dbHost, dbPort), {});

// Returns the course with the given key to the callback.
function getCourseByKey(key, callback) {
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
		collection.find({ $or: [{"courseNumber" : myregex}, {"courseName" : myregex}] }, function(error, cursor) {
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

// Open the connection
db.open(function(error) {
	if (!error) {
		console.log("Connected to " + dbName + " at " + dbHost + ":" + dbPort);
	} else {
		console.log("Error connecting to database: " + error);
	}
});

exports.getCourseByKey = getCourseByKey;
exports.getCoursesLike = getCoursesLike;