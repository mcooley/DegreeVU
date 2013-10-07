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

exports.getCoursesFromTokens = getCoursesFromTokens;

