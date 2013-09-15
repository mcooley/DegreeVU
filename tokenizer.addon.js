var extend = function(obj) {
	
}

//add ons to tokenizer for server-side querying
//include require statement here

//generates a mongo query from this query

Query.extend = function(obj) {
	var i, deepCopy = {};
	if (i in obj) {
		if (obj.hasOwnProperty(i)) {
			if (typeof obj[i] === 'object') {
				deepCopy[i] = Query.extend(obj[i]);
			} else {
				deepCopy[i] = obj[i];
			}
		}
	}
	return deepCopy;
}
Query.prototype.mongoQuery = function() {
	var mongoQuery = {};
	mongoQuery.$or = [];


	this.array.forEach(function(token) {
		var courseCode;
		if (!token.query) {
			courseCode = "^"+token.coursePrefix+"\\s*"+token.courseNumber.toString();
			courseCode += (token.courseSuffix) ? ("\\s*" + token.courseSuffix) : "";

			if (token.not) {
				if (!mongoQuery.courseCode) {
					mongoQuery.courseCode = {};
				}

				if (!mongoQuery.courseCode.$nin) {
					mongoQuery.courseCode.$nin = [];
				}
				mongoQuery.courseCode.$nin.push(new RegExp(courseCode, 'i'));

			} else {
				if (!mongoQuery.courseCode) {
					mongoQuery.courseCode = {};
				}

				if (!mongoQuery.courseCode.$in) {
					mongoQuery.courseCode.$in = [];
				}
				//should only have 1 element in it, or there is a problem with the query
				mongoQuery.courseCode.$in.push(new RegExp(courseCode, 'i'));
			}
				
		} else if (token.query === '+') {
			//above
			if (token.not) {
				//then it gets complicated...
			} else {

			}

		} else if (token.query === '*') {
			//all
			if (!mongoQuery.coursePrefix) {
				mongoQuery.coursePrefix = {};
			}
			if (token.not) {

				if (!mongoQuery.coursePrefix.$nin) {
					mongoQuery.coursePrefix.$nin = []''
				}
				mongoQuery.coursePrefix.$nin.push(new RegExp(token.coursePrefix, 'i'));
			} else {
				if (!mongoQuery.coursePrefix.$in) {
					mongoQuery.coursePrefix.$in = [];
				}
				mongoQuery.coursePrefix.$in.push(new RegExp(token.coursePrefix, 'i'));
			}

		} else if (token.query === '$') {
			//suffix
			if (token.not) {
				if (!mongoQuery.suffix) {
					mongoQuery.suffix = {};
				}

				if (!mongoQuery.suffix.$nin) {
					mongoQuery.suffix.$nin = [];
				}

				mongoQuery.suffix.$nin.push(new RegExp(token.suffix, 'i'));
			} else {
				if (!mongoQuery.suffix) {
					mongoQuery.suffix = {};
				}

				if (!mongoQuery.suffix.$in) {
					mongoQuery.suffix.$in = [];
				}
				mongoQuery.suffix.$in.push(new RegExp(token.suffix, 'i'));
			}

		} else if (token.query === '~') {
			//category
			if (!mongoQuery.category) {
				mongoQuery.category = {};
			}
			if (token.not) {
				if (!mongoQuery.category.$nin) {
					mongoQuery.category.$nin = [];
				}
				mongoQuery.category.$nin.push(token.category);
			} else {
				if (!mongoQuery.category.$in) {
					mongoQuery.category.$in = [];
				}
				mongoQuery.category.$in.push(token.category);
			}
		}
	});
}

QueryCollection.prototype.mongoQuery = function() {

}