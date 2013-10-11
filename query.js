var mongo = require("mongodb"),
	async = require("async"),

	Tokenizer = require('./tokenizer.addon'),
	Statement = Tokenizer.Statement,
	StatementCollection = Tokenizer.StatementCollection,

	MONGODB_URL;

// Initial connection setup.
if (process.env.MONGOHQ_URL) {
	MONGODB_URL = process.env.MONGOHQ_URL;
} else {
	MONGODB_URL = "mongodb://localhost:27017/degreeVU";
}

var db = { // Dummy object while we wait for a connection.
	collection: function(name, cb) {
		cb('A database connection has not been established. Try again.');
	}
};

mongo.Db.connect(MONGODB_URL, function(err, dbPool) {
	if (err) {
		console.log("Couldn't establish a database connection. Exiting...");
		process.exit(1);
	}
	db = dbPool;
});


// Factory function to get a collection. Can be used directly in async.waterfall.
var getCollection = function(name) {
	return function(cb) {
		db.collection(name, cb);
	}
}


////// Query functions //////

var getCoursesFromTokens = function(tokens, callback) {
	var collection = new StatementCollection(tokens),
		mongoQuery = collection.mongoQuery();

	if (mongoQuery) {
		async.waterfall([
			getCollection('courses'),
			function(collection, cb) {
				collection.find(mongoQuery, cb);
			},
			function(cursor, cb) {
				cursor.toArray(cb);
			}
		],
		callback);
	} else {
		callback(null, []);
	}
}

var getCourseByKey = function(key, callback) {
	async.waterfall([
		getCollection('courses'),
		function(collection, cb) {
			try {
				var id = new mongo.ObjectID(key);
				collection.findOne({ _id: id }, cb);
			} catch (e) {
				cb(null, null);
			}
		}
	],
	callback);
};

var getGoalByKey = function(key, callback) {
	async.waterfall([
		getCollection('goals'),
		function(collection, cb) {
			try {
				var id = new mongo.ObjectID(key);
				collection.findOne({ _id: id }, cb);
			} catch (e) {
				cb(null, null);
			}
		}
	],
	callback);
};

var listMajors = function(callback) {
	async.waterfall([
		getCollection('goals'),
		function(collection, cb) {
			collection.find({ type: 'major' }, { items: 0 }, cb);
		},
		function(cursor, cb) {
			cursor.toArray(cb);
		}
	],
	callback);
};

exports.getCoursesFromTokens = getCoursesFromTokens;
exports.getCourseByKey = getCourseByKey;
exports.getGoalByKey = getGoalByKey;
exports.listMajors = listMajors;
