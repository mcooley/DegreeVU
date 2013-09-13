
//the school tokens are:
	//SE: school of engineering
	//AS: arts and science
	//PB: peabody
	//BL: Blair
//DO NOT USE COURSE CODE TOKENIZER... USE THE QUERY OBJECT BELOW 
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
			
			//then the query is just a normal course code
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
	//returns true if the courseCode is within the query
	//automatically returns false if the course code parameter
	//is filled with a quey (something with a query character, like +)
	matchQuery: function(courseCode, query) {
		var queryObject = CourseCodeTokenizer.parse(query),
			negateQuery,
		    codeObject = CourseCodeTokenizer.parse(courseCode);

		if (!queryObject.query) {
			negateQuery = CourseCodeTokenizer.parse(query);
			negateQuery.not = false;
			return (!queryObject.not && _.isEqual(codeObject, queryObject)) || (queryObject.not && !_.isEqual(codeObject, negateQuery));

		} else if (queryObject.query === '$') {

			return (!queryObject.not && queryObject.courseSuffix === codeObject.courseSuffix) || (queryObject.not && queryObject.courseSuffix !== codeObject.courseSuffix);

		} else if (queryObject.query === '*') {

			return (!queryObject.not && queryObject.coursePrefix === codeObject.coursePrefix) || (queryObject.not && queryObject.coursePrefix !== codeObject.coursePrefix);

		} else if (queryObject.query === '+') {

			return (!queryObject.not && (queryObject.coursePrefix === codeObject.coursePrefix && codeObject.courseNumber >= queryObject.courseNumber)) 
					|| (queryObject.not && (queryObject.coursePrefix !== codeObject.coursePrefix || codeObject.courseNumber < queryObject.courseNumber));

		} else if (queryObject.query === '^') {
			throw new Error("cannot match a query to the school (^) token");
		} else if (queryObject.query === "~") {
			throw new Error("cannot match a query with the category (~) token");
		}

		return false;
		
	}
	
};


//USE THIS CONSTRUCTOR HERE TO CONSTRUCT A QUERY
function Query(queryToken) {
	var array = queryToken.split("&");
	this.array = array.map(function(token) {
		token = token.trim();
		return CourseCodeTokenizer.parse(token);
	});
}

Query.prototype.matches = function(courseCode) {
	var i, n;
	if (this.isSingleQuery()) {
		return CourseCodeTokenizer.matchQuery(courseCode, this.toString());
	} else {
		for (i =0, n = this.array.length; i < n; ++i) {
			if (!CourseCodeTokenizer.matchQuery(courseCode, Query.formatObject(this.array[i]))) {
				return false;
			}
		}
		return true;
	}
}
//takes an array of course codes and returns another array of
//course codes with the codes that do not match 
//the query filtered out
Query.prototype.filter = function(courseCodeArray) {
	var matches = this.matches.bind(this);
	return courseCodeArray.filter(function(courseCode) {
		return matches(courseCode);
	}).map(function(courseCode) {
		return Query.formatQuery(courseCode);
	});
}

//adds an "and" query
//can be a query object or a course code
Query.prototype.and = function(query) {
	this.array.push(CourseCodeTokenizer.parse(query));
}

//returns true if the query is equal to the course code
Query.prototype.isEqual = function(courseCode) {
	var query = new Query(courseCode);
	return _.isEqual(query.array, this.array);
}

//true if the query is just a single course code
Query.prototype.isSingleCourse = function() {
	return this.isSingleQuery && !this.array[0].query;
}

//true if the query is not an ampersand combo query
Query.prototype.isSingleQuery = function() {
	return this.array.length === 1
}

Query.prototype.isNegated = function() {
	return this.isSingleQuery() && this.array[0].not;
}

Query.prototype.toString = function() {
	console.log(this.array);
	console.log(this.array.length);
	var queries = this.array.map(function(query) {
		return Query.formatObject(query);
	});
	return queries.join(" & ");
}

//makes a deep copy and returns the copy
Query.prototype.copy = function() {
	return new Query(this.toString());
}
//static methods

//reformats the query string and returns another
//query string in the new format (capitalization, proper spacing, etc)
Query.formatQuery = function(queryString) {
	var queries = queryString.split("&").map(function(query) {
		var obj = CourseCodeTokenizer.parse(query.trim());
		return Query.formatObject(obj);
	});
	return queries.join(" & ");
}

Query.isEqual = function(queryString1, queryString2) {
	var query1 = new Query(queryString1),
		query2 = new Query(queryString2);
	return _.isEqual(query1.array, query2.array);
}

//should not call these methods, they are "private"

//converts a query object to a query string
//this is for formatting a single query
Query.formatObject = function(obj) {
	
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
}

//collection of queries that are related in some way,
//such as queries that satisfy a single course
//used to bundle queries and optimize processes
//such as matching courses to a set of queries 
//or unioning queries into 1
//takes an array of queries as a parameter
//parameter can either be an array of Query objects
//or array of course code strings, but not a mix 
//of the two, throws an error if the parameter is not
//an array
function QueryCollection(queries) {
	if (!Array.isArray(queries)) {
		throw new Error("parameter for QueryCollection constructor should be an array");
	}

	
	if (queries.length === 0) {
		this.collection = [];
	} 

	else if (typeof queries[0] === 'string') {
		return new QueryCollection(queries.map(function(queryString) {
			return new Query(queryString);
		}));
	}
	else if (queries[0].constructor === Query) {

		this.collection = this.collapseQueries(queries);

	}
}

//returns true if the course code matches
//the query collection
QueryCollection.prototype.matches = function(courseCode) {
	var i, n;
	for (i = 0, n = this.collection.length; i < n; ++i) {
		if (this.collection[i].matches(courseCode)) {
			return true;
		}
	}
	return false;
}

//accepts an array of course codes and returns another array
//of course codes that satisfy the QueryCollection
QueryCollection.prototype.filter = function(courseCodes) {

	return courseCodes.filter(function(courseCode) {
		return this.matches(courseCode);
	}, this).map(function(courseCode) {
		return Query.formatQuery(courseCode);
	});
}

QueryCollection.prototype.copy = function() {

}


QueryCollection.prototype.toString = function() {

}

//pass in either a string, query object
QueryCollection.prototype.append = function(query) {
	var i, n;
	if (typeof query === 'string') {
		this.append(new Query(query));
	} else if (query.constructor === query) {
		if (query.isNegated()) {
			for (i = 0, n = this.collection.length; i < n; ++i) {
				this.collection[i].and(query);
			}
		} else {
			this.collection.push(query);
		}
	}
}

//for any unknown functionality...
QueryCollection.prototype.each = function(callback, context) {
	var _context = (context) ? context : this,
	i, n;

	for (i = 0, n = this.collection.length; i < n; ++i) {
		callback.call(_context, this.collection[i], i);
	}
}

//query collection is unioned into the current query collection
QueryCollection.prototype.union = function(collection) {
	collection.each(function(query) {
		this.collection.push(query);
	}, this);
}


//methods that should be "private"

//takes an array of query objects
QueryCollection.prototype.collapseQueries = function(queries) {
	//make a copy of the queries so that they are not changed
	console.log(queries);
	var i, j,  _queries = queries.slice();

	for (i = _queries.length - 1; i >= 0; --i) {
		if (_queries[i].isSingleCourse() && _queries[i].isNegated()) {
			for (j = i - 1; j >= 0; --j) {
				_queries[j].and(_queries[i]);
			}
		}
	}

	return _queries.filter(function(query) {
		return !query.isNegated();
	});
}


