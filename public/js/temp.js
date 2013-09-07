//changes that were made that are not in home
/*
	adds an isEqual method to CourseCodeTokenizer
	adds properties to Courses
		- isLocked boolean
		- requirement list
		- inSchedule boolean
*/

getQueryString = function (key) {
	var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
	var r=[], m;
	while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
	return r;
}

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
	isEqual: function(courseCode1, courseCode2) {
		var token1 = CourseCodeTokenizer.parse(courseCode1),
			token2 = CourseCodeTokenizer.parse(courseCode2);

		return _.isEqual(token1, token2);
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





var Course = Backbone.Model.extend({
	initialize: function() {
		this.set('isLocked', false, {silent: true});
		this.set('inSchedule', false, {silent: true});
	},
	url: function() {
		return '/courses/' + this.get('_id');
	},
	getColorId: function() {
		return this.get('colorId') || 1;
	},
	getHours:function() {
		return (this.get('numOfCredits'))[0];
	},
	//add the goals, and each goal can show you which
	//requirements include the class, there are no goals
	//in this course if the course is not in the schedule
	addGoal: function(goal) {
		if (!this.get('goals')) {
			this.set('goal', [goal], {silent: true});
		} else {
			this.get('goal').push(goal);
		}

		//call events here to notify a goal has been added

	},
	getGoals: function() {
		if (!this.get('goals')) {
			this.set('goals', [], {silent: true});
		}
		return this.get('goals');
	}
});

var Schedule = Backbone.Collection.extend({
	model: Course,
	initialize: function(models, options) {		
		var gradYear = options.gradYear;
		
		this._semesters = [
			{season: 'Before College'},
			{season: 'Fall ', year: gradYear - 4},
			{season: 'Spring', year: gradYear - 3},
			{season: 'Fall', year: gradYear - 3},
			{season: 'Spring', year: gradYear - 2},
			{season: 'Fall', year: gradYear - 2},
			{season: 'Spring', year: gradYear - 1},
			{season: 'Fall', year: gradYear - 1},
			{season: 'Spring', year: gradYear}
		];
	},
	
	getSemesters: function() {
		return this._semesters;
	},
	
	//Validation stuff

	//takes multiple course code arguments
	has: function() {
		var i,n, foundCourse, args = arguments;
		for (i=0, n = args.length; i < n; ++i) {
			foundCourse = false;
			this.each(function(course) {
				
				if (CourseCodeTokenizer.matches(args[i], course.get('courseCode'))) {
					foundCourse = true;
					return;
				}
			});
			if (!foundCourse) {
				
				return false;
			}
		}
		
		return true;
	},
	
	//counts the number of courses that satisfies
	//the queries, can pass in multiple arguments,
	//each of which is a query and returns the count
	//of all the courses that match at least one of the queries
	//if no queries are entered, then this method returns the 
	//number of courses in the schedule
	countCourses: function(query1) {
		var queries = arguments, i, n, matchesAll, queryObject;
		if (arguments.length) {

			return this.filter(function(course) {
				for (i = 0, n = queries.length, matchesAny = false; i < n && !matchesAny; ++i) {
					queryObject = CourseCodeTokenizer.parseQuery(queries[i]);
					if (queryObject.queryToken === '~' && queryObject.category === course.get('category')) {
						matchesAny = true;
					}

					if (CourseCodeTokenizer.matchQuery(course.get('courseCode'), queries[i])) {
						matchesAny = true;
					}
				}
				return matchesAny;
			}).length;
		} else {

			return this.models.length;
		}
			
	},
	//similar to countCourses method, except the number of hours are returned instead
	//of the number of courses
	countHours: function(query) {
		var queries = arguments,
		    totalHours = 0,
		    queryObject,
		    courseArray;

		    if (arguments.length) {


		    	courseArray = this.filter(function(course) {
					for (i = 0, n = queries.length, matchesAny = false; i < n && !matchesAny; ++i) {
						queryObject = CourseCodeTokenizer.parseQuery(queries[i]);
						if (queryObject.queryToken === '~' && queryObject.category === course.get('category')) {
							matchesAny = true;
						}
						if (CourseCodeTokenizer.matchQuery(course.get('courseCode'), queries[i])) {
							matchesAny = true;
						}
					}
					return matchesAny;
				});

				courseArray.forEach(function(course) {
					totalHours += course.getHours();
				});

		    } else {

		    	this.each(function(course) {
		    		totalHours += course.getHours();
		    	});
		    }
			    

		return totalHours;
	},
	

	//takes a single number parameter followed by a variable
	//number of boolean parameters and returns true if the number
	//of boolean parameters that are true is at least equal to the number
	//in the first parameter
	complete: function(number) {
		var i, n, count = 0;
		for (i = 1, n = arguments.length; i < n; ++i) {
			if (arguments[i]) {
				count++;
			}

			if (count >= number) {
				return true;
			}
		}
		return false;
	}
	
	
},
{
	_singletonInstance:null,
	getInstance:function(gradYear) {
		if (!this._singletonInstance) {
			this._singletonInstance = new Schedule([], {gradYear:gradYear});
		}
		return this._singletonInstance;
	}
});

var CourseCollection = Backbone.Collection.extend({
	model:Course,
	initialize: function(models, options) {
		this.on('add remove reset', (this.doOnLoad).bind(this));
		//this._colorId = options.colorId;
	},
	
	getColorId: function() {
		return this._colorId;
	},
	
	doOnLoad: function() {
		this.each((function(model) {
			model.set('colorId', this.getColorId());
		}).bind(this));
	},
	
	filterByCourses: function() {
		return this.filter(function(course) {
			var courseCode = course.get('courseCode');
			var courseMatches = _.some(courseArray, function(coursePattern) {
				return CourseCodeTokenizer.matches(courseCode, coursePattern);
			});
			return courseMatches;
		});
	}
	
});

$(document).ready(function () {
	console.log("Setting up");
	var gradYear = parseInt(getQueryString('gradYear'), 10);
	if (!_.isFinite(gradYear) || Math.abs(gradYear - 2013) > 4) {
		gradYear = 2016;
	}
	
	//var scheduleView = new ScheduleView({collection: Schedule.getInstance(gradYear), el:'#scheduleGrid'});
	
	//TEMP GLOBAL
	
	$.getJSON('/ejs/templates', function(data) {
		window.templates = {};
		_.each(data, function(val, index) {
			window.templates[index] = _.template(val);
		});
		
	});
	
	var majorId = getQueryString('major');
	
});