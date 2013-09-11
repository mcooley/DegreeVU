
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


//USE THIS CONSTRUCTOR DOWN HERE TO CONSTRUCT A QUERY
function Query(queryToken) {
	this.obj = CourseCodeTokenizer.parse(queryToken);
}

//toggles query between query and anti query
Query.prototype.negate = function() {
	this.obj.not = !this.obj.not;
}

Query.prototype.matches = function(courseCode) {
	return CourseCodeTokenizer.matchQuery(courseCode, this.toString());
}
//takes an array of course codes and returns another array of
//course codes with the codes that do not match 
//the query filtered out
Query.prototype.filter = function(courseCodeArray) {
	var self = this;
	return courseCodeArray.filter(function(courseCode) {
		return CourseCodeTokenizer.matchQuery(courseCode, self.toString());
	}).map(function(courseCode) {
		return Query.formatQuery(courseCode);
	});
}

//returns true if the query is equal to the course code
Query.prototype.isEqual = function(courseCode) {
	return _.isEqual(CourseCodeTokenizer.parse(courseCode), this.obj);
}

//true if the query is just a single course code
Query.prototype.isSingle = function() {
	return !this.obj.query;
}

Query.prototype.isNegated = function() {
	return this.obj.not;
}

Query.prototype.toString = function() {
	return Query.formatObject(this.obj);
}

//static methods

//reformats the query string and returns another
//query string in the new format (capitalization, proper spacing, etc)
Query.formatQuery = function(queryString) {
	return Query.formatObject(CourseCodeTokenizer.parse(queryString));
}

Query.isEqual = function(queryString1, queryString2) {
	return _.isEqual(CourseCodeTokenizer(queryString1), CourseCodeTokenizer(queryString2));
}

//should not call these methods, they are "private"

//converts a query object to a query string

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

