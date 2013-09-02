var CourseCodeTokenizer = {
	
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
	parseQuery: function(query) {

		var parsedQuery = {
		    	coursePrefix: "",
		    	courseSuffix: "",
		    	queryToken: "",
		    	courseNumber: 0,
		    	category: "",
		    	school: ""
		    },

		    q = query.match(/[+,$,*,~,^]$/),
		    courseCodeToken;

		    parsedQuery.queryToken = (q) ? q[0] : "";


		if (parsedQuery.queryToken === "") {
			
			//then the query is just a normal course code
			courseCodeToken = CourseCodeTokenizer.parse(query);
			parsedQuery.coursePrefix = courseCodeToken.coursePrefix;
			parsedQuery.courseSuffix = courseCodeToken.courseSuffix;
			parsedQuery.courseNumber = courseCodeToken.courseNumber;

		} else if (parsedQuery.queryToken === '$') {
			parsedQuery.courseSuffix = query.match(/^[a-z]/i)[0].toUpperCase();
			
			
		} else if (parsedQuery.queryToken === '+') {
			parsedQuery.courseNumber = +query.match(/\d+/)[0];
			parsedQuery.coursePrefix = query.match(/^[a-z]+/i)[0].toUpperCase();

		} else if (parsedQuery.queryToken === '~') {
			parsedQuery.category = query.match(/^[a-z]+/i)[0].toUpperCase();

		} else if (parsedQuery.queryToken === '^') {
			parsedQuery.school = query.match(/^[a-z]+/i)[0].toUpperCase();

		} else  {
			parsedQuery.coursePrefix = query.match(/^[a-z]+/i)[0].toUpperCase();
			
		}

		return parsedQuery;

	},
	matchQuery: function(token, query) {
		var queryObject = CourseCodeTokenizer.parseQuery(query),
		    tokenObject = CourseCodeTokenizer.parse(token);

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