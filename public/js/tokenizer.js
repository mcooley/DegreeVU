
//the school tokens are:
	//SE: school of engineering
	//AS: arts and science
	//PB: peabody
	//BL: Blair

//is this script being run on server or client side

var serverSide = typeof require === 'function' && typeof exports === 'object' && typeof module === 'object';
if (serverSide) {
	var _ = require('underscore');
}


//DO NOT USE COURSE CODE TOKENIZER... USE THE Statement OBJECT BELOW 
//AS THE ABSTRACTION OVER THE TOKENIZER
var CourseCodeTokenizer = {
	
	isEqual: function(courseCode1, courseCode2) {
		var token1 = CourseCodeTokenizer.parse(courseCode1),
			token2 = CourseCodeTokenizer.parse(courseCode2);

		return _.isEqual(token1, token2);
	},
	parse: function(courseCode) {

		var validSchoolTokens,
			matchSchoolToken,
			token = {},
		    q = courseCode.match(/[+,$,*,~,^]$/);
		    if (q) {
		    	token.query = q[0];
		    }
		    //check for the anti character at the beginning
		    if (courseCode.charAt(0) === "!") {
		    	token.not = true;
		    	courseCode = courseCode.substr(1, courseCode.length - 1);
		    } else {
		    	token.not = false;
		    }

		if (!token.query) {
			
			//then the Statement is just a normal course code
			token.coursePrefix = courseCode.match(/^[a-z]+/i)[0].toUpperCase();
			token.courseNumber = +courseCode.match(/\d+/)[0];
			if (courseCode.match(/[a-z]+$/i)) {
				token.courseSuffix = courseCode.match(/[a-z]+$/i)[0].toUpperCase();
			}

		} else if (token.query === '$') {
			token.courseSuffix = courseCode.match(/^[a-z]+/i)[0].toUpperCase();
			
			
		} else if (token.query === '+') {
			if (courseCode.match(/\d+/)) {
				token.courseNumber = +courseCode.match(/\d+/)[0];
			} else {
				token.courseNumber = 0;
			}	
			token.coursePrefix = courseCode.match(/^[a-z]+/i)[0].toUpperCase();

		} else if (token.query === '~') {
			token.category = courseCode.match(/^[a-z]+/i)[0].toUpperCase();

		} else if (token.query === '^') {
			validSchoolTokens = ['SE', 'PB', 'BL', 'AS'];
			token.school = courseCode.match(/^[a-z]+/i)[0].toUpperCase();
			matchSchoolToken = false;
			validSchoolTokens.forEach(function(sToken) {
				if (sToken == token.school) {
					matchSchoolToken = true;
				}
			});

			if (!matchSchoolToken) {
				throw new Error("invalid school token " + token.school);
			}


		} else {
			token.coursePrefix = courseCode.match(/^[a-z]+/i)[0].toUpperCase();
			
		}

		return token;

	},
	//returns true if the courseCode is within the Statement
	//automatically returns false if the course code parameter
	//is filled with a quey (something with a Statement character, like +)
	matchQuery: function(courseCode, query) {
		var token = CourseCodeTokenizer.parse(query),
		    codeObject = CourseCodeTokenizer.parse(courseCode);

		return CourseCodeTokenizer.matchObject(codeObject, token);
		
	},
	matchObject: function(codeObject, token) {
		var negateStatement;
		if (!token.query) {
			negateStatement = CourseCodeTokenizer.copyToken(token);
			negateStatement.not = false;
			return (!token.not && _.isEqual(codeObject, token)) || (token.not && !_.isEqual(codeObject, negateStatement));

		} else if (token.query === '$') {

			return (!token.not && token.courseSuffix === codeObject.courseSuffix) || (token.not && token.courseSuffix !== codeObject.courseSuffix);

		} else if (token.query === '*') {

			return (!token.not && token.coursePrefix === codeObject.coursePrefix) || (token.not && token.coursePrefix !== codeObject.coursePrefix);

		} else if (token.query === '+') {

			return (!token.not && (token.coursePrefix === codeObject.coursePrefix && codeObject.courseNumber >= token.courseNumber)) 
					|| (token.not && (token.coursePrefix !== codeObject.coursePrefix || codeObject.courseNumber < token.courseNumber));

		} else if (token.query === '^') {
			throw new Error("cannot match a statement to the school (^) token");
		} else if (token.query === "~") {
			throw new Error("cannot match a statement with the category (~) token");
		}

		return false;
	},
	
	//makes a deep copy and returns it
	copyToken: function(obj) {
		var copy = {}, i;
		for (i in obj) {
			if (obj.hasOwnProperty(i)) {
				//nothing is nested in a Statement object,
				// no recursion needed
				copy[i] = obj[i];
			}
		}
		return copy;
	}	
};


//USE THIS CONSTRUCTOR HERE TO CONSTRUCT A Statement
function Statement(statementString) {
	var array = statementString.split("&");
	this.array = array.map(function(token) {
		token = token.trim();
		return CourseCodeTokenizer.parse(token);
	});
};

Statement.prototype.has = function(courseCode) {
	var i, n;
	if (this.isSingleStatement()) {
		return CourseCodeTokenizer.matchQuery(courseCode, this.toString());
	} else {
		for (i =0, n = this.array.length; i < n; ++i) {
			if (!CourseCodeTokenizer.matchQuery(courseCode, Statement.formatObject(this.array[i]))) {
				return false;
			}
		}
		return true;
	}
};
//takes an array of course codes and returns another array of
//course codes with the codes that do not match 
//the Statement filtered out
Statement.prototype.filter = function(courseCodeArray) {
	var has = this.has.bind(this);
	return courseCodeArray.filter(function(courseCode) {
		return has(courseCode);
	}).map(function(courseCode) {
		return Statement.formatStatement(courseCode);
	});
};

//adds an "and" Statement
//can be a Statement object or a course code
Statement.prototype.and = function(statement) {
	this.array.push(CourseCodeTokenizer.parse(statement));
};

//returns true if the Statement is equal to the course code
Statement.prototype.isEqual = function(statement) {
	var statementCopy, i,j, n;
	if (this === statement) {return true;}

	if (typeof statement === 'string') {
		return this.isEqual(new Statement(statement));
	} else if (typeof statement === 'object' && statement.constructor === Statement) {
		
		if (this.array.length === statement.array.length) {
			
			statementCopy = statement.array.slice();
			for (i = 0, n = this.array.length; i < n; ++i) {
				
				for (j = 0; j < n; ++j) {
					//null out any tokens that match in both arrays
					if (_.isEqual(this.array[i], statementCopy[j])) {
						statementCopy[j] = null;
					}
				}
			}
			return !statementCopy.filter(function(token) {return token;}).length;
		}
	}
	return false;
};

//true if the Statement is just a single course code
Statement.prototype.isSingleCourse = function() {
	return this.isSingleStatement && !this.array[0].query;
};

//true if the Statement is not an ampersand combo Statement
Statement.prototype.isSingleStatement = function() {
	return this.array.length === 1
};

Statement.prototype.isNegated = function() {
	return this.isSingleStatement() && this.array[0].not;
};

Statement.prototype.toString = function() {
	var queries = this.array.map(function(statement) {
		return Statement.formatObject(statement);
	});
	return queries.join(" & ");
};

//makes a deep copy and returns the copy
Statement.prototype.copy = function() {
	return new Statement(this.toString());
};

//static methods

//reformats the Statement string and returns another
//Statement string in the new format (capitalization, proper spacing, etc)
Statement.formatStatement = function(statementString) {
	var statements = statementString.split("&").map(function(statement) {
		var obj = CourseCodeTokenizer.parse(statement.trim());
		return Statement.formatObject(obj);
	});
	return statements.join(" & ");
};

Statement.isEqual = function(statementString1, statementString2) {
	var statement1 = new Statement(statementString1),
		statement2 = new Statement(statementString2);
	return statement1.isEqual(statement2);
};

//should not call these methods, they are "private"

//converts a Statement object to a Statement string
//this is for formatting a single Statement
Statement.formatObject = function(obj) {
	var format;

	if (obj.not) {
		format = "!";
	} else {
		format = "";
	}
	if (!obj.query) {
		format = format + obj.coursePrefix.toUpperCase() + " ";
		format = format + obj.courseNumber.toString();
		if (obj.courseSuffix) {
			format = format + obj.courseSuffix.toUpperCase();
		}

	} else if (obj.query === '*') {
		format = format + obj.coursePrefix.toUpperCase() + "*";
	} else if (obj.query === '+') {
		format = format + obj.coursePrefix.toUpperCase() + " ";
		format = format + obj.courseNumber.toString() + "+";
	} else if (obj.query === '^') {
		format = format + obj.school.toUpperCase() + "^"
	} else if (obj.query === '~') {
		format = format + obj.category.toUpperCase() + "~";
	} else if (obj.query === '$') {
		format = format + obj.courseSuffix.toUpperCase() + "$";
	}
	return format;
};

//goes through the queries in the array and removes 
//unneccessary elements in the Statement
//returns true if the Statement can be refactored and 
//returns false if the elements in the Statement contradict and
//the Statement is useless.  This is a facade method that calls 
//multiple other methods for refactoring different types 
//of queries
Statement.prototype.refactor = function() {
	var self = this;
	return this.refactorCollection.reduce(function(memo, funct) {
		//make sure to pass in the correct context to the function
		return memo && funct.call(self);
	}, true);
	
};

//collection of functions that can be iterated and
//executed.  This is a collection of refactoring tests
//to run on the array object, that will automatically 
//be executed.  Each function must return true if the
//refactoring was successful, and false otherwise
Statement.prototype.refactorCollection = [
	//single courses
	function() {
		var singleCourses = this.array.filter(function(token) {return !token.query;}),
			i, n, j, representative;
		if (singleCourses.length > 1) {
			for (i = 0, n = singleCourses.length; i < n; ++i) {
				for (j = i + 1; j < n; ++j) {
					if (!CourseCodeTokenizer.matchObject(singleCourses[i], singleCourses[j])) {
						return false;
					}
				}
			}
			//all courses are in agreement with one another at this point
			//get a single course to use as the replacement to the list of 
			//all single courses.  Remove any anti single courses
			singleCourses = singleCourses.filter(function(token) {
				return !token.not;
			});
			representative = (singleCourses.length) ? singleCourses[0] : null;
			//check if there is an single course that is positive to represent
			//courses
			if (representative) {
				this.array = this.array.filter(function(token) {
					return token.query || token === representative;
				});
			}
		}
		return true;
	},
	//check for any queries that are exclusively made of
	//anti queries
	function() {
		return this.array.length !== this.array.filter(function(token) {return token.not;}).length;
	},
	//compare a single course against all other queries
	function() {
		var i,n,
			singleTokens = this.array.filter(function(token) {
				return !token.not && !token.query;
			}),
		//there should only be 1 single token since the single courses 
		//refactoring function was run before this
			singleToken = (singleTokens.length) ? singleTokens[0] : null;


		if (singleToken) {
			//compare the sinlge token to all other tokens
			for (i = 0, n = this.array.length; i < n; ++i) {
				if (this.array[i] !== singleToken) {
					try {
						if (!CourseCodeTokenizer.matchObject(singleToken, this.array[i])) {
							return false;
						} else {
							this.array[i] = null;
						}
					} catch (e) {}
				}
			}
			this.array = this.array.filter(function(token) {return token;});
		}
		return true;
	},
	//start courses/ all courses in major
	function() {
		return true;
	}

]
//collection of queries that are related in some way,
//such as queries that satisfy a single course
//used to bundle queries and optimize processes
//such as matching courses to a set of queries 
//or unioning queries into 1
//takes an array of queries as a parameter
//parameter can either be an array of Statement objects
//or array of course code strings, but not a mix 
//of the two, throws an error if the parameter is not
//an array
function StatementCollection(statements) {
	if (!Array.isArray(statements)) {
		throw new Error("parameter for StatementCollection constructor should be an array");
	}
	if (statements.length === 0) {
		this.collection = [];
	} 

	else if (typeof statements[0] === 'string') {
		return new StatementCollection(statements.map(function(statementString) {return new Statement(statementString);}));
	}
	else if (statements[0].constructor === Statement) {
		
		this.collection = this.collapseStatements(statements);
		this.refactor();
	}
};

//returns true if the course code has
//the Statement collection
StatementCollection.prototype.has = function(courseCode) {
	var i, n;
	for (i = 0, n = this.collection.length; i < n; ++i) {
		if (this.collection[i].has(courseCode)) {
			return true;
		}
	}
	return false;
};

//accepts an array of course codes and returns another array
//of course codes that satisfy the StatementCollection
StatementCollection.prototype.filter = function(courseCodes) {

	return courseCodes.filter(function(courseCode) {
		return this.has(courseCode);
	}, this).map(function(courseCode) {
		return Statement.formatStatement(courseCode);
	});
};

StatementCollection.prototype.copy = function() {
	return new StatementCollection(this.collection);
};


StatementCollection.prototype.toArray = function() {
	return this.collection.map(function(statement) {
		return statement.toString();
	});
};

//pass in either a string, Statement object
StatementCollection.prototype.append = function(statement) {
	var i, n;
	if (typeof statement === 'string') {
		this.append(new Statement(statement));
	} else if (statement.constructor === Statement) {
		if (statement.isNegated()) {
			for (i = 0, n = this.collection.length; i < n; ++i) {
				this.collection[i].and(statement);
			}
		} else {
			this.collection.push(statement);
		}
	}
};

//for any unknown functionality...
StatementCollection.prototype.each = function(callback, context) {
	var _context = (context) ? context : this,
	i, n;

	for (i = 0, n = this.collection.length; i < n; ++i) {
		callback.call(_context, this.collection[i], i);
	}
};

//Statement collection is unioned into the current Statement collection
StatementCollection.prototype.union = function(_collection) {
	var i, n, j,
	collection;
	if (this !== _collection) {
		if (Array.isArray(_collection)) {
			collection = new StatementCollection(_collection);
		}
		else if (_collection.constructor === StatementCollection) {
			collection = _collection
		}

		collection.each(function(statement) {
			this.collection.push(statement.copy());
		}, this);

		for (i = 0, n = this.collection.length; i < n; ++i) {
			if (this.collection[i]) {
				for (j = i + 1; j < n; ++j) {
					
					if (this.collection[j] && this.collection[i].isEqual(this.collection[j])) {
						this.collection[j] = null;
					}
				}
			}
				
		}
		//filter out the nulled elements
		this.collection = this.collection.filter(function(statement) {
			return statement;
		});
	}		
};

//static methods
StatementCollection.union = function(collection1, collection2) {
	var queries = null;

	
	//collection 1 and 2 both have values in it
	if (Array.isArray(collection1) && typeof collection1[0] === 'string') {
		queries = new StatementCollection(collection1);
			
	} else if (collection1.constructor === StatementCollection) {
		queries = collection1;
	}

	queries.union(collection2);
	
	return queries;
};

//methods that should be "private"

//takes an array of Statement objects
StatementCollection.prototype.collapseStatements = function(statements) {
	//make a copy of the queries so that they are not changed
	var i, j, n, _statements = statements.slice();

	for (i = 0, n = _statements.length; i < n; ++i) {
		if (_statements[i].isNegated()) {
			for (j = i - 1; j >= 0; --j) {
				_statements[j].and(_statements[i].toString());
			}
		}
	}
	return _statements.filter(function(statement) {
		return !statement.isNegated();
	});
	
};

//attempts to refactor the Statement but if there is a conflict, this method
//will simply return false, returns true if no conflict was found and
//refactoring was successful
StatementCollection.prototype.refactor = function() {
	this.collection = this.collection.filter(function(statement) {
		//each Statement performs its own refactoring and returns false
		//if conflicts are found, so Statement must be removed
		return statement.refactor();
	});
};


//set the exports for server side script
if (serverSide) {
	exports.CourseCodeTokenizer = CourseCodeTokenizer;
	exports.Statement = Statement,
	exports.StatementCollection = StatementCollection;
} 



