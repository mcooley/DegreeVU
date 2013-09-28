var Tokenizer = require('./public/js/tokenizer'),
	CourseCodeTokenizer = Tokenizer.CourseCodeTokenizer,
	Query = Tokenizer.Query,
	QueryCollection = Tokenizer.QueryCollection;

//add ons to tokenizer for server-side querying
//include require statement here

//returns the mongoQuery after the token has been added
var StatementHelper = {};
StatementHelper.addTokenToMongoQuery = function(token, mongoQuery) {
	if (!token.query) {
		mongoQuery.courseCode = tokenToRegExp(token);
	} else if (token.query === '*') {
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
//ignores the not property on the token
StatementHelper.tokenToRegExp = function(token) {
	var courseSearch;
	if (!token.query) {
		courseSearch = "^" + token.coursePrefix + '(\\s?)+' + token.courseNumber.toString();
		courseSearch += (token.courseSuffix) ? token.courseSuffix  + '(\\s?)+' : '(\\s?)$';
	} else if (token.query === '*') {
		courseSearch = "^" + token.coursePrefix + "\\d+";
	} else if (token.query === '+') {
		courseSearch = "^" + token.coursePrefix + "";

	}
		
	return new RegExp(courseSearch, "i");
};

//takes a plus query and converts it to regexp
//this is separated from the tokenToRegExp method because
//it is much more complex
StatementHelper.plusQueryToRegExp = function(token) {
	var courseSearch,
		numberSearch,
		digits;
	if (token.query !== '+') {
		throw new Error("Expecting a plus token to be passed in method plusQueryToRegExp");
	}
	courseSearch = "^" + token.coursePrefix + '(\\s?)+';
	//all number regexes should work for numbers with 2, 3, or 4 digits
	if (token.courseNumber < 10) {
		courseSearch = 	"((\\d["+StatementHelper.numberGenerator(token.courseNumber)+
						"])|(\\d\\d["+StatementHelper.numberGenerator(token.courseNumber)+
						"])|(\\d\\d\\d["+StatementHelper.numberGenerator(token.courseNumber)+"]))";
	} else if (token.courseNumber < 100) {
		//the number has 2 digits
		digits = [token.courseNumber/10, token.courseNumber%10];
		courseSearch = "( ( (["+""+"]) | () ) )|()|())";
	} else if (token.courseNumber < 1000) {

	} else {
		//the number has 3 digits
	}

}
//pass in a single digit number and this will generate
//a string of numbers that are greater than or equal to the
//string digit number, with no breaks between the numbers
//used to help generate plusQuery regexp's, should work if passing in
//a number or a string
//include number is a boolean that determines if the number itself is included
//in the string or if it is a string of numbers > than the number
StatementHelper.numberGenerator = function(num, includeNumber) {
	var numString = "",
		number = (typeof num === 'number') ? num : +num;
	if (!includeNumber) {
		number++;
	}
	while (number < 10) {
		numString = numString + number.toString();
		number++;
	}
	return numString;
}
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