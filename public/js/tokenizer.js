
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


/**
 * Parses course codes into tokens that can be
 * interpretted by higher level functions.  Also offers
 * low-level comparisons of token objects.  THIS CLASS
 * SHOULD NEVER BE CALLED DIRECTLY.
 * @class CourseCodeTokenizer
 */
var CourseCodeTokenizer = {
	
	/**
	 * Compares course code strings for equality.  This goes
	 * beyond string comparison; compares if the course codes are
	 * referring to the same type of course, whether it is a single
	 * course or multiple courses
	 * @method isEqual
	 * @param {String} courseCode1 Course code as a string
	 * @param {String} courseCode2 Course code as a string
	 * @return {Boolean} true if the course codes are logically equal, false otherwise
	 */
	isEqual: function(courseCode1, courseCode2) {
		var token1 = CourseCodeTokenizer.parse(courseCode1),
			token2 = CourseCodeTokenizer.parse(courseCode2);

		return _.isEqual(token1, token2);
	},
	/**
	 * parses a courseCode into a token, separating the different
	 * portions of the course code string into an object that can be
	 * quickly interpretted
	 * @method parse
	 * @param {String} courseCode The course code string being parsed
	 * @return {Object} A token object with the course code parsed into properties
	 */
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
	/**
	 * checks if a course code matches a query multiple course codes.  This method
	 * calls parse and matchObject methods of CourseCodeTokenizer to perform comparison
	 * @method matchQuery
	 * @param {String} courseCode A string that represents the course code being queried against
	 * @param {String} query A string that queries the course code
	 * @return {Boolean} true if the courseCode is a member of the query, false otherwise
	 * @throws Error if trying to match a codeObject with a token with query ^ (school) or (~) category,
	 * neither of which can be determined from a course code
	 */
	matchQuery: function(courseCode, query) {
		var token = CourseCodeTokenizer.parse(query),
		    codeObject = CourseCodeTokenizer.parse(courseCode);

		return CourseCodeTokenizer.matchObject(codeObject, token);
		
	},
	/**
	 * similar to matchQuery, except it matches object against object
	 * instead of string against string.
	 * @method matchObject
	 * @param {Object} codeObject The token object that is checked for belonging within the query
	 * @param {Object} token The query object that is being used compare against the token
	 * @return {Boolean} true if the codeObject is a member of the token's query, false otherwise
	 * @throws Error if trying to match a codeObject with a token with query ^ (school) or (~) category,
	 * neither of which can be determined from a course code
	 */
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
	
	/**
	 * Performs a deep, logical copy of a course token
	 * @method copyToken
	 * @param {Object} obj The token that is being copied
	 * @return {Boolean} a deep copy of the param
	 */
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


/**
 * Used to change course codes into objects that can be interpretted by 
 * both client and server side code, and for matching course codes with 
 * queries and other course codes.  This object adds a more powerful abstraction
 * over CourseCodeTokenizer.  The Statement Object can be a combination of multiple
 * tokens, all of which must be satisfied for a course code to match a Statement
 * @class Statement
 * @constructor
 * @param {String} statementString a course code-like string
 */
function Statement(statementString) {
	var tokens = statementString.split("&");
	this.tokens = tokens.map(function(token) {
		token = token.trim();
		return CourseCodeTokenizer.parse(token);
	});
};

/**
 * Checks if a course code matches a Statement
 * @method has
 * @param {String} courseCode A course code string
 * @return {Boolean} true if the course code matches the statement, false otherwise
 * @throws Error if the Statement has a token with query ^ (school) or (~) category,
 * neither of which can be resolved from a course code
 */
Statement.prototype.has = function(courseCode) {
	var i, n;
	if (this.isSingleStatement()) {
		return CourseCodeTokenizer.matchQuery(courseCode, this.toString());
	} else {
		for (i =0, n = this.tokens.length; i < n; ++i) {
			if (!CourseCodeTokenizer.matchQuery(courseCode, Statement.formatObject(this.tokens[i]))) {
				return false;
			}
		}
		return true;
	}
};

/**
 * Checks if an array of course codes match the statement
 * @method filter
 * @param {Array} courseCodeArray an array of course code strings
 * @return {Array} a new array with the course codes passed in the array that actually 
 * match the filter.  These course codes are formatted, capitalized, and spaced properly,
 * and may not look identical to the ones passed in with the array
 * @throws Error if the Statement has a token with query ^ (school) or (~) category,
 * neither of which can be resolved from a course code
 */
Statement.prototype.filter = function(courseCodeArray) {
	var has = this.has.bind(this);
	return courseCodeArray.filter(function(courseCode) {
		return has(courseCode);
	}).map(function(courseCode) {
		return Statement.formatStatement(courseCode);
	});
};

/**
 * Takes a course code and appends it to the Statement object.
 * The statement can be composed of multiple course code tokens,
 * all of which have to be satisfied by a course
 * @method and
 * @param {String} courseCode the course code that is being appended to the token
 */
Statement.prototype.and = function(courseCode) {
	this.tokens.push(CourseCodeTokenizer.parse(courseCode));
};

/**
 * compares the statement object with the parameter.
 * @method isEqual
 * @param {String, Statement} statement Either a string that can be parsed into 
 * a statement or an actual statement object
 * @return true if the Statement is logically equivalent to the parameter, false otherwise
 */
Statement.prototype.isEqual = function(statement) {
	var statementCopy, i,j, n;
	if (this === statement) {return true;}

	if (typeof statement === 'string') {
		return this.isEqual(new Statement(statement));
	} else if (typeof statement === 'object' && statement.constructor === Statement) {
		
		if (this.tokens.length === statement.tokens.length) {
			
			statementCopy = statement.tokens.slice();
			for (i = 0, n = this.tokens.length; i < n; ++i) {
				
				for (j = 0; j < n; ++j) {
					//null out any tokens that match in both arrays
					if (_.isEqual(this.tokens[i], statementCopy[j])) {
						statementCopy[j] = null;
					}
				}
			}
			return !statementCopy.filter(function(token) {return token;}).length;
		}
	}
	return false;
};

/**
 * Checks if the Statement is for a single course
 * @method isSingleCourse
 * @return {Boolean} true if the Statement is for a single course
 */
Statement.prototype.isSingleCourse = function() {
	return this.isSingleStatement && !this.tokens[0].query;
};

/**
 * Checks if the Statement has only a single token within it
 * @method isSingleStatement
 * @return {Boolean} true if the Statement has only 1 token within it
 */
Statement.prototype.isSingleStatement = function() {
	return this.tokens.length === 1
};

/**
 * Checks if the token within the statement is a negative token
 * @method isNegated
 * @return {Boolean} true if the Statement is a negative token
 */
Statement.prototype.isNegated = function() {
	return this.isSingleStatement() && this.tokens[0].not;
};

/**
 * Returns a String representation of the Statement, similar to a course code
 * @method toString
 * @return {String} string representation of the Statement, formatted properly with
 * spacing and capitalization
 */
Statement.prototype.toString = function() {
	var queries = this.tokens.map(function(statement) {
		return Statement.formatObject(statement);
	});
	return queries.join(" & ");
};

/**
 * Makes a logical copy of the statement
 * @method copy
 * @return {Statement} logical copy of the statement
 */
Statement.prototype.copy = function() {
	return new Statement(this.toString());
};

/**
 * Formats a statement string into a statement string with proper
 * capitalization and spacing
 * @method formatStatement
 * @static
 * @param {String} statementString The Statement string to format
 * @return {String} the reformatted statement string
 */
Statement.formatStatement = function(statementString) {
	var statements = statementString.split("&").map(function(statement) {
		var obj = CourseCodeTokenizer.parse(statement.trim());
		return Statement.formatObject(obj);
	});
	return statements.join(" & ");
};

/**
 * Compares two statement Strings and returns true if they 
 * are logically equal
 * @method isEqual
 * @static
 * @param {String} statementString1 A statement as string representation
 * @param {String} statementString2 A statement as string representation
 */
Statement.isEqual = function(statementString1, statementString2) {
	var statement1 = new Statement(statementString1),
		statement2 = new Statement(statementString2);
	return statement1.isEqual(statement2);
};

/**
 * Formats a token object into a string representation.
 * @method formatObject
 * @static
 * @param {Object} obj The token to be formatted
 * @return {String} the formatted token into a Statement String
 */
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


/**
 * NOT YET TESTED.
 * matches a Backbone course object with a Statement.
 * returns true if the course matches the Statement.
 * @method matchCourse
 * @param {Course} course A backbone course object
 * @return {Boolean} true if the course matches the statement,
 * false otherwise
 */
Statement.prototype.matchCourse = function(course) {
	var i, n, courseToken, college;
	for (i = 0, n = this.tokens.length; i < n; ++i) {
		courseToken = CourseCodeTokenizer.parse(course.get('courseCode'));
		try {
			if (!CourseCodeTokenizer.matchObject(courseToken, this.tokens[i])) {
				return false;
			}
		} catch (e) {
			if (this.tokens[i].query === '^') {
				college = Statement.collegeMap(this.tokens[i].school);
				if (this.tokens[i].not && college === course.get('college')) {
					return false;
				} else if (!this.tokens[i].not && college !== course.get('college')){
					return false;
				}
			} else if (this.tokens[i].query === '~') {
				if (this.tokens[i].not && this.tokens[i].category === course.get('category')) {
					return false;
				} else if (!this.tokens[i].not && this.tokens[i].category !== course.get('category')) {
					return false;
				}
			}
		}	
	}
	return true;
};


/**
 * Iterates through the tokens in the internal representation
 * of the statement and removes unneeded or redundant 
 * tokens that are present within the Statement.
 * @method refactor
 * @return {Boolean} true if the refactoring was successful, false
 * if the Statement has contradictory tokens and should be removed
 * entirely
 */
Statement.prototype.refactor = function() {
	var self = this;
	return Statement.refactorCollection.reduce(function(memo, funct) {
		//make sure to pass in the correct context to the function
		return memo && funct.call(self);
	}, true);
	
};

/**
 * NOT YET TESTED
 * converts a college abbreviation to the actual name
 * of the college.  This is used to convert tokens to actual
 * colleges.  This is considered a 'private' method and should
 * not be called directly.  This method is used by the matchCourse
 * method and other methods on the server side tokenizer.  SE: 
 * School of Engineering.  AS: College of Arts and Science. BL: 
 * Blair School of Music.  PB: Peabody College.
 * @method collegeMap
 * @param {String} abbreviation An abbreviation for the College
 * @return {String} the actual college name.
 */
Statement.collegeMap = function(abbreviation) {
	if (abbreviation.toUpperCase() === 'SE') {
		return "School of Engineering";
	} else if (abbreviation.toUpperCase() === 'AS') {
		return "College of Arts and Science";
	} else if (abbreviation.toUpperCase() === 'BL') {
		return "Blair School of Music";
	} else if (abbreviation.toUpperCase() === "PB") {
		return "Peabody College";
	}
	return null;
};

/**
 * An array of functions that are iterated and called by the refactor
 * method for various refactoring tests.  Each function within the array
 * performs refacotring within the context of the statement, then 
 * returns true if the refactoring was successful, and false if a
 * contradiction was found
 * @property refactorCollection
 * @static
 * @type Array 
 */
Statement.refactorCollection = [
	//single courses
	function() {
		var singleCourses = this.tokens.filter(function(token) {return !token.query;}),
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
				this.tokens = this.tokens.filter(function(token) {
					return token.query || token === representative;
				});
			}
		}
		return true;
	},
	//check for any queries that are exclusively made of
	//anti queries
	function() {
		return this.tokens.length !== this.tokens.filter(function(token) {return token.not;}).length;
	},
	//compare a single course against all other queries
	function() {
		var i,n,
			singleTokens = this.tokens.filter(function(token) {
				return !token.not && !token.query;
			}),
		//there should only be 1 single token since the single courses 
		//refactoring function was run before this
			singleToken = (singleTokens.length) ? singleTokens[0] : null;


		if (singleToken) {
			//compare the sinlge token to all other tokens
			for (i = 0, n = this.tokens.length; i < n; ++i) {
				if (this.tokens[i] !== singleToken) {
					try {
						if (!CourseCodeTokenizer.matchObject(singleToken, this.tokens[i])) {
							return false;
						} else {
							this.tokens[i] = null;
						}
					} catch (e) {}
				}
			}
			this.tokens = this.tokens.filter(function(token) {return token;});
		}
		return true;
	}

];
 


/**
 * A collection of statements that are used
 * for more powerful matching and querying
 * @class StatementCollection
 * @constructor
 * @param {Array} statements An array of statements or statement strings
 */
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
		
		this.collection = StatementCollection.collapseStatements(statements);
		this.refactor();
	}
};

/**
 * Checks if the course code is matched by ANY of the Statements in
 * the collection
 * @method has
 * @param {String} courseCode string that is checked between the Statements
 * @return {Boolean} true if the course code exists within any of the Statements
 * of the collection
 * @throws Error if the StatementCollection has a Statement containing token for ^ (school) or (~) 
 * category query, neither of which can be resolved from a course code
 */
StatementCollection.prototype.has = function(courseCode) {
	var i, n;
	for (i = 0, n = this.collection.length; i < n; ++i) {
		if (this.collection[i].has(courseCode)) {
			return true;
		}
	}
	return false;
};

/**
 * Takes an array of course codes and checks if these course codes 
 * exist within any of the Statements of the collection
 * @method filter
 * @param {Array} courseCodes An array of course codes (in the form of strings)
 * @throws Error if the StatementCollection has a Statement containing token for ^ (school) or (~) 
 * category query, neither of which can be resolved from a course code
 */
StatementCollection.prototype.filter = function(courseCodes) {

	return courseCodes.filter(function(courseCode) {
		return this.has(courseCode);
	}, this).map(function(courseCode) {
		return Statement.formatStatement(courseCode);
	});
};

/**
 * Creates a logical copy of the Statement collection
 * @method copy
 * @return {StatementCollection} A logical, deep copy 
 * of the StatementCollection
 */
StatementCollection.prototype.copy = function() {
	return new StatementCollection(this.collection);
};

/**
 * Returns an array of Statement Strings, formatted for capitalization
 * and spacing
 * @method toArray
 * @return {Array} An array of statement strings
 */
StatementCollection.prototype.toArray = function() {
	return this.collection.map(function(statement) {
		return statement.toString();
	});
};

/**
 * appends a Statement to the StatementCollection
 * @method append
 * @param {String, Statement} statement Either a Statement Object or a string 
 * representation of a Statement Object
 */
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

/**
 * Iterates through the statement in a collection and supplies statement
 * and index to the callback
 * @method each
 * @param {Function} callback callback function that takes a Statement Object
 * and the index of that Statement Object within the collection
 * @param {Object} context=this The context to run the callback function in
 */
StatementCollection.prototype.each = function(callback, context) {
	var _context = (context) ? context : this,
	i, n;

	for (i = 0, n = this.collection.length; i < n; ++i) {
		callback.call(_context, this.collection[i], i);
	}
};

/**
 * Get the length of the statement collection.  Note that 
 * the value for the length might not be as expected, since 
 * anti-statements are collapsed.  The length of the StatementCollection
 * is most likely the number of positive statements within the collection
 * @method length
 * @returns {Number} the length of the Statement Collection
 */
StatementCollection.prototype.length = function() {
	return this.collection.length;
};
/**
 * Combines a statement collection with this Statement Collection, 
 * removing any redundant Statements that are shared between the collections
 * @method union
 * @param {StatementCollection} collection The collection to union this
 * StatementCollection with
 */
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


/**
 * Static union method for unioning two statement collections. Note: The parameters
 * can either be an array of Statement Strings or a Statement Collection.  No matter which
 * type is used as the parameter, both parameters have to be of that type, for consistency
 * @method union
 * @static
 * @param {StatementCollection, Array} collection1 Either an array of
 * statemnt strings or a StatementCollection object
 * @param {StatementCollection, Array} collection2 Either an array of
 * statemnt strings or a StatementCollection object
 * @return {StatementCollection} A StatementCollection Object that results of the
 * unioning of the two collections
 */
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

/**
 * Takes statements and collapse them together, so that no anti-statements
 * exist by themselves and all the statements are correctly represented in a
 * boolean fashion.  This method is used by the StatementCollection constructor
 * and should not be called directly
 * @method collapseStatements
 * @static
 * @param {Array} statements An array of statement objects
 * @return {Array} An array of Statement objects that have been collapsed
 * into a condensed representation
 */
StatementCollection.collapseStatements = function(statements) {
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


StatementCollection.prototype.matchCourse = function(course) {
	var i, n;
	for (i = 0, n = this.collection.length; i < n; ++i) {
		if (this.collection[i].matchCourse(course)) {
			return true;
		}
	}
	return false;
};

/**
 * Cleans up the Statements within the collection by removing 
 * redundancies and removing any Statements that have contradictory tokens
 * @method refactor
 */
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



