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

function getCoursesFromTokens(tokens, callback) {

	var collection = new StatementCollection(tokens),
		mongoQuery = collection.mongoQuery();
		
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

function getCourseByKey(key, callback) {
	Db.connect(MONGODB_URL, function(err, db) {

		db.collection("courses", function(error, collection) {
			collection.findOne({_id : new mongo.ObjectID(key)}, function(err,doc) {
				callback(err, doc);
				db.close();
			});
		});

	});
}

function getGoalByKey(key, callback) {
	Db.connect(MONGODB_URL, function(err, db) {

		db.collection("goals", function(error, collection) {
			collection.findOne({_id : new mongo.ObjectID(key)}, function(err,doc) {
				callback(err, doc);
				db.close();
			});
		});

	});
}

function listMajors(callback) {
	Db.connect(MONGODB_URL, function(err, db) {

		db.collection("goals", function(error, collection) {
			collection.find({type: 'major'}, {items: 0}, function(err, cursor) {
				cursor.toArray(function(err, majors) {
					callback(err, majors);
					db.close();
				});
			});
		});

	});
}

exports.getCoursesFromTokens = getCoursesFromTokens;
exports.getCourseByKey = getCourseByKey;
exports.getGoalByKey = getGoalByKey;
exports.listMajors = listMajors;

