var Tokenizer = require('./public/js/tokenizer'),
	CourseCodeTokenizer = Tokenizer.CourseCodeTokenizer,
	Query = Tokenizer.Query,
	QueryCollection = Tokenizer.QueryCollection;

//add ons to tokenizer for server-side querying
//include require statement here

//returns the mongoQuery after the token has been added
var StatementHelper = {};
StatementHelper.addTokenToMongoQuery = function(token, mongoQuery) {
	if (StatementHelper.mongoQueryLength(mongoQuery) === 1) {
		if (!token.query) {
			mongoQuery.courseCode = tokenToRegExp(token);
		} else {
			throw new Error("not yet implemented");
		}
	} else {
		//more than 1
	}
};

//the number of copies held in the query
StatementHelper.mongoQueryLength = function(mongoQuery) {
	if (!mongoQuery.$or) {
		return 1;
	} else {
		return mongoQuery.$or.length;
	}
};

//makes a deep copy of the query
StatementHelper.copyMongoQuery = function(mongoQuery) {
	var i, copy = {};
	if (typeof mongoQuery === 'object') {
		for (i in mongoQuery) {
			if (mongoQuery.hasOwnProperty(i)) {
				if (Array.isArray(mongoQuery[i])) {
					copy[i] = mongoQuery[i].slice();
				} else {
					copy[i] = StatementHelper.copyMongoQuery(mongoQuery[i]);
				}
					
			}
		}
		return copy;
	}
	return mongoQuery;
};

//takes a query for a single course code and converts it 
//to regexp, this method only converts single courses to regexp
StatementHelper.tokenToRegExp = function(token) {
	var course;
	if (token.query) {
		throw new Error("The token needs to be for a single course code in order to be converted to regexp");
	}
	course = "^\\s*" + token.coursePrefix + "\\s*" + token.courseNumber.toString();
	course += (token.courseSuffix) ? token.courseSuffix  + "\\s*" : "\\s*$";
	return new RegExp(course, "i");
};
//generates a mongo query from this query


Query.prototype.mongoQuery = function() {
	
};

QueryCollection.prototype.mongoQuery = function() {

};


//exports
exports.Query = Query;
exports.QueryCollection = QueryCollection;
exports.CourseCodeTokenizer = CourseCodeTokenizer;
exports.StatementHelper = StatementHelper;