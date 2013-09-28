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
			mongoQuery.courseCode = (token.not) ? {$nin: [tokenToRegExp(token)]} : tokenToRegExp(token);
		} else if (token.query === '*') {
			mongoQuery.coursePrefix = (token.not) ? {$nin: [new RegExp(token.coursePrefix, "i")]} : new RegExp(token.coursePrefix);
		} else if (token.query === '+') {
			mongoQuery.courseCode = (token.not) ? {$nin: [plusTokenToRegExp(token)]} : plusTokenToRegExp(token);
		} else if (token.query === '$') {
			mongoQuery.courseSuffix = new RegExp(token.courseSuffix, "i");
		} else if (token.query === '^') {
			//school name
		} else if (token.query === '~') {
			//attribute
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
StatementHelper.plusTokenToRegExp = function(token) {
	var courseSearch,
		numberSearch,
		digits;
	if (token.query !== '+') {
		throw new Error("Expecting a plus token to be passed in method plusQueryToRegExp");
	}
	courseSearch = "^" + token.coursePrefix + '\\s';
	//all number regexes should work for numbers with 2, 3, or 4 digits
	courseSearch += "(";
	courseSearch += ("(" + StatementHelper.numberSearchGenerator(token.courseNumber, 4) + ")");
	if (token.courseNumber < 1000) {
		courseSearch += ("|(" + StatementHelper.numberSearchGenerator(token.courseNumber, 3) + ")");
	}
	if (token.courseNumber < 100) {
		courseSearch += ("|(" + StatementHelper.numberSearchGenerator(token.courseNumber, 2) + ")");
	}	
	courseSearch += ")";

	//could have a course suffix at the end of the code
	courseSearch += "[a-z]*";
	console.log(courseSearch);
	return new RegExp(courseSearch, 'i');

};

//generates a string that can be converted to regexp for searching
//for a number greater than or equal to the parameter, with the number of digits used
//to search
StatementHelper.numberSearchGenerator = function(num, numOfDigits) {
	var number = num,
		digits = [],
		numberSearch, i, j, n, digitsCount;
	//store all the digits in an array
	while (number != 0) {
		digits.push(number % 10);
		number = Math.floor(number / 10);
	}
	//make sure that the number of digits being passed in,
	//can generate a number that is greater than or equal to 
	//the number
	if (digits.length <= numOfDigits) {
		numberSearch = "(";
		for (i = 0, n = numOfDigits; i < n; ++i) {
			if (i !== 0) {
				numberSearch += "|";
			}
			numberSearch += "(";
			
			for (j = numOfDigits - 1; j >= 0; --j) {
				if (j >= digits.length) {
					if (j > i) {
						numberSearch += "0";
					} else  {
						numberSearch += "[^0]";
					} 
				} else {
					if (j > i) {
						numberSearch += digits[j].toString();
					} else if (j === i) {
						numberSearch += (j === 0) ? StatementHelper.numberGenerator(digits[j], true) : StatementHelper.numberGenerator(digits[j]);
					} else { //j is less than i
						numberSearch += "\\d";
					}
				}
			}
			numberSearch += ")";
		}
		numberSearch += ")";
		return numberSearch;
	}
	return null;
};
//pass in a single digit number and this will generate
//a string of numbers that are greater than or equal to the
//string digit number, with no breaks between the numbers
//used to help generate plusQuery regexp's, should work if passing in
//a number or a string
//include number is a boolean that determines if the number itself is included
//in the string or if it is a string of numbers > than the number.  This will
//not have the correct behavior if the num passed in is greater than 9
StatementHelper.numberGenerator = function(digit, includeNumber) {
	var number = (typeof num === 'number') ? digit : +digit;
	if (!includeNumber) {
		number++;
	}
	if (number === 0) {
		return "\\d"
	} 
	if (number === 9) {
		return "9";
	}
	
	return "["+number.toString()+"-9]";
	
	
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