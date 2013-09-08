var CourseCodeTokenizer = {
	

	//CALLS TO THIS METHOD SHOULD BE REPLACED BY CALLS TO MATCHQUERY
	/*
	matches:function(courseCode, pattern) {
		
		var myCourse = CourseCodeTokenizer.parse(courseCode);
		var testCourse = CourseCodeTokenizer.parse(pattern);
		if (testCourse.parseChar === '+') {
			return (myCourse.courseNumber >= testCourse.courseNumber && myCourse.coursePrefix === testCourse.coursePrefix);
		} else if (testCourse.parseChar === '*') {
			return myCourse.coursePrefix === testCourse.coursePrefix;
		} else {
			return myCourse.courseCode === testCourse.courseCode;
		}
	},
	
	parse:function(token) {
		
		var coursePrefix = token.match(/[a-z]+/i)[0].toUpperCase(),
		    courseNumber = token.match(/\d+/)[0],
		    courseSuffix = "",
		    parseChar = "",
		    temp = token[token.length - 1].toUpperCase(),
		    courseCode,
		    course,
		    temp2;

		if (temp.match(/[+, !, ~, *]/)) {
			parseChar = temp;
		}
		if (temp.match(/[a-z]/i)) {
			courseSuffix = temp;
		}
		temp2 = token[token.length - 2];
		if (temp2.match(/[a-z]/i)) {
			courseSuffix = temp2;
		}
		courseCode = coursePrefix + " " + courseNumber + courseSuffix;
		course = {
			"coursePrefix" : coursePrefix,
			"courseSuffix" : courseSuffix,
			"courseCode" : courseCode,
			"parseChar" : parseChar
		};

		if (courseNumber) {
			course.courseNumber = parseInt(courseNumber);
		} else {
			course.courseNumber = 0;
		}
		
		return course;
	},
	*/
	isEqual: function(courseCode1, courseCode2) {
		var token1 = CourseCodeTokenizer.parse(courseCode1),
			token2 = CourseCodeTokenizer.parse(courseCode2);

		return _.isEqual(token1, token2);
	},
	parse: function(courseCode) {

		var parsedToken = {
		    	coursePrefix: "",
		    	courseSuffix: "",
		    	queryToken: "",
		    	courseNumber: 0,
		    	category: "",
		    	school: ""
		    },

		    q = courseCode.match(/[+,$,*,~,^]$/),
		    courseCodeToken;

		    parsedToken.queryToken = (q) ? q[0] : "";


		if (parsedToken.queryToken === "") {
			
			//then the query is just a normal course code
			parsedToken.coursePrefix = courseCodeToken.coursePrefix;
			parsedToken.courseSuffix = courseCodeToken.courseSuffix;
			parsedToken.courseNumber = courseCodeToken.courseNumber;

		} else if (parsedToken.queryToken === '$') {
			parsedToken.courseSuffix = courseCode.match(/^[a-z]/i)[0].toUpperCase();
			
			
		} else if (parsedToken.queryToken === '+') {
			parsedToken.courseNumber = +courseCode.match(/\d+/)[0];
			parsedToken.coursePrefix = courseCode.match(/^[a-z]+/i)[0].toUpperCase();

		} else if (parsedToken.queryToken === '~') {
			parsedToken.category = courseCode.match(/^[a-z]+/i)[0].toUpperCase();

		} else if (parsedToken.queryToken === '^') {
			parsedToken.school = courseCode.match(/^[a-z]+/i)[0].toUpperCase();

		} else  {
			parsedToken.coursePrefix = courseCode.match(/^[a-z]+/i)[0].toUpperCase();
			
		}

		return parsedToken;

	},
	//returns true if the courseCode is within the query
	//automatically returns false if the course code parameter
	//is filled with a quey (something with a query character, like +)
	matchQuery: function(courseCode, query) {
		var queryObject = CourseCodeTokenizer.parse(query),
		    tokenObject = CourseCodeTokenizer.parse(courseCode);

		if (queryObject.queryToken === '') {

			return _.isEqual(tokenObject, CourseCodeTokenizer.parse(query));

		} else if (queryObject.queryToken === '$') {

			return queryObject.courseSuffix === tokenObject.courseSuffix;

		} else if (queryObject.queryToken === '*') {

			return queryObject.coursePrefix === tokenObject.coursePrefix;

		} else if (queryObject.queryToken === '+') {

			return queryObject.coursePrefix === tokenObject.coursePrefix && tokenObject.courseNumber >= queryObject.courseNumber;

		} else if (queryObject.queryToken === '^') {
			
		}

		return false;
		
	}
	
};