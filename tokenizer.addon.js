var Tokenizer = require('./public/js/tokenizer'),
	CourseCodeTokenizer = Tokenizer.CourseCodeTokenizer,
	Statement = Tokenizer.Statement,
	StatementCollection = Tokenizer.StatementCollection;

//add ons to tokenizer for server-side querying
//include require statement here

//returns the mongoQuery after the token has been added
var StatementHelper = {
	addTokenToMongoQuery: function(token, mongoQuery) {
		
		if (!token.query) {
			//single course
			if (mongoQuery.courseCode) {
				if (token.not && mongoQuery.courseCode.$nin) {
					mongoQuery.courseCode.$nin.push(StatementHelper.tokenToRegExp(token));
				} else if (token.not && !mongoQuery.courseCode.$nin) {
					mongoQuery.courseCode.$nin = [StatementHelper.tokenToRegExp(token)];
				} else if (mongoQuery.courseCode.$in) {
					mongoQuery.courseCode.$in.push(StatementHelper.tokenToRegExp(token));
				} else {
					mongoQuery.courseCode.$in = [StatementHelper.tokenToRegExp(token)];
				}
			} else {
				mongoQuery.courseCode = (token.not) ? {$nin: [StatementHelper.tokenToRegExp(token)]} : {$in: [StatementHelper.tokenToRegExp(token)]};
			}
				
			
		} else if (token.query === '*') {
			mongoQuery.coursePrefix = (token.not) ? {$nin: [new RegExp("^"+token.coursePrefix+"$", "i")]} : new RegExp("^"+token.coursePrefix+"$", "i");
		} else if (token.query === '+') {
			if (mongoQuery.courseCode) {
				if (token.not && mongoQuery.courseCode.$nin) {
					mongoQuery.courseCode.$nin.push(StatementHelper.plusTokenToRegExp(token));
				} else if (token.not && !mongoQuery.courseCode.$nin) {
					mongoQuery.courseCode.$nin = [StatementHelper.plusTokenToRegExp(token)];

				} 
				//for !token.not
				else if (mongoQuery.courseCode.$in) {
					mongoQuery.courseCode.$in.push(StatementHelper.plusTokenToRegExp(token));
				} 
				//!mongoQuery.courseCode.$in
				else {
					mongoQuery.courseCode.$in = [StatementHelper.plusTokenToRegExp(token)];
				}
			} 
			//there is no mongo query courseCode Property
			else {
				
				mongoQuery.courseCode = (token.not) ? {$nin: [StatementHelper.plusTokenToRegExp(token)]} : {$in: [StatementHelper.plusTokenToRegExp(token)]};
			}
		} else if (token.query === '$') {
			mongoQuery.courseSuffix = new RegExp("^"+token.courseSuffix+"$", "i");
		} else if (token.query === '^') {
			//school name
			if (token.school === "SE") {
				mongoQuery.college = (token.not) ? {$nin: ["School of Engineering"]} : {$in: ["School of Engineering"]};
			} else if (token.school === "AS") {
				mongoQuery.college = (token.not) ? {$nin: ["College of Arts and Science"]} : {$in: ["School of Engineering"]};
			} else if (token.school === "PB") {
				mongoQuery.college = (token.not) ? {$nin: ["Peabody College"]} : {$in: ["School of Engineering"]};
			} else if (token.school === "BL") {
				mongoQuery.college = (token.not) ? {$nin: ["Blair School of Music"]} : {$in: ["School of Engineering"]};
			}
		} else if (token.query === '~') {
			//category
			if (mongoQuery.category) {
				if (token.not && mongoQuery.category.$nin) {
					mongoQuery.category.$nin.push(new RegExp("^"+token.category+"$", "i"));
				} else if (token.not && !mongoQuery.category.$nin) {
					mongoQuery.category.$nin = [new RegExp("^"+token.category+"$", "i")];
				} 
				//for !token.not
				else if (mongoQuery.category.$in) {
					mongoQuery.category.$in.push(new RegExp("^"+token.category+"$", "i"));
				} 
				// !mongoQuery.category.$in
				else {
					mongoQuery.category.$in = [new RegExp("^"+token.category+"$", "i")];
				}
			} else {
				mongoQuery.category = (token.not) ? {$nin: [new RegExp("^"+token.category+"$", "i")]} : {$in: [new RegExp("^"+token.category+"$", "i")]};
			}
		}
		
	},
	//makes a deep copy of the query
	copyMongoQuery: function(mongoQuery) {
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
	},
	//takes a query for a single course code and converts it 
	//to regexp, this method only converts single courses to regexp
	//ignores the not property on the token
	tokenToRegExp: function(token) {
		var courseSearch;
		if (!token.query) {
			courseSearch = "^" + token.coursePrefix + '(\\s?)+' + token.courseNumber.toString();
			courseSearch += (token.courseSuffix) ? token.courseSuffix  + '$' : '$';
		} else if (token.query === '*') {
			courseSearch = "^" + token.coursePrefix + "\\d+";
		} else if (token.query === '+') {
			courseSearch = "^" + token.coursePrefix + "";

		}
			
		return new RegExp(courseSearch, "i");
	},
	plusTokenToRegExp: function(token) {
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
		return new RegExp(courseSearch, 'i');

	},
	//generates a string that can be converted to regexp for searching
	//for a number greater than or equal to the parameter, with the number of digits used
	//to search
	numberSearchGenerator: function(num, numOfDigits) {
		var number = num,
			digits = [],
			numberSearch, i, j, n, digitsCount,
			searchCombinations, next;
		//store all the digits in an array
		while (number != 0) {
			digits.push(number % 10);
			number = Math.floor(number / 10);
		}
		
		//special case where the number 0 is passed in
		if (digits.length === 0) {
			numberSearch = "";
			for (i = 0, n = numOfDigits; i < n; ++i) {
				numberSearch += "\\d";
			}

			return numberSearch;
		} 
		//make sure that the number of digits being passed in,
		//can generate a number that is greater than or equal to 
		//the number
		else if (digits.length <= numOfDigits) {
			searchCombinations = [];
			
			for (i = 0, n = numOfDigits; i < n; ++i) {
				
				next = "(";
				
				for (j = numOfDigits - 1; j >= 0; --j) {
					if (j >= digits.length) {
						if (j > i) {
							next += "0";
						} else  {
							next += "[^0]";
						} 
					} else {
						if (j > i) {
							next += digits[j].toString();
						} else if (j === i) {
							next += (j === 0) ? StatementHelper.numberGenerator(digits[j], true) : StatementHelper.numberGenerator(digits[j]);
						} else { //j is less than i
							next += "\\d";
						}
					}
				}
				next += ")";
				searchCombinations.push(next);
			}
			//remove any combinations where there is a 9 at the digit
			searchCombinations = searchCombinations.filter(function(comb, index) {
				return (index === 0 || index >= digits.length || digits[index] !== 9);
			});
			return "(" + searchCombinations.join("|") + ")";
		}
		return null;
	},
	//pass in a single digit number and this will generate
	//a string of numbers that are greater than or equal to the
	//string digit number, with no breaks between the numbers
	//used to help generate plusQuery regexp's, should work if passing in
	//a number or a string
	//include number is a boolean that determines if the number itself is included
	//in the string or if it is a string of numbers > than the number.  This will
	//not have the correct behavior if the num passed in is greater than 9
	numberGenerator: function(digit, includeNumber) {
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
};

	
	
//generates a mongo query from this query
Statement.prototype.mongoQuery = function() {
	var query = {};
	this.tokens.forEach(function(token) {
		StatementHelper.addTokenToMongoQuery(token, query);
	});
	return query;
};

StatementCollection.prototype.mongoQuery = function() {
	var collectionQuery;
	if (this.collection.length) {
		collectionQuery = {$or: []};
		this.collection.forEach(function(statement) {
			collectionQuery.$or.push(statement.mongoQuery());
		});
		return collectionQuery;
	}
	return null;	
};


//exports
exports.Statement = Statement;
exports.StatementCollection = StatementCollection;
exports.CourseCodeTokenizer = CourseCodeTokenizer;
exports.StatementHelper = StatementHelper;