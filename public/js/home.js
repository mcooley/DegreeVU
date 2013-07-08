$(document).ready(function () {
	var getQueryString = function (key) {
		var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
		var r=[], m;
		while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
		return r;
	}
	
	var gradYear = parseInt(getQueryString('gradYear'), 10);
	if (!_.isFinite(gradYear) || Math.abs(gradYear - 2013) > 4) {
		gradYear = 2016;
	}
	
	var scheduleView = new ScheduleView({collection: Schedule.getInstance(gradYear), el:'#scheduleGrid'});
	
	var goalsList = new GoalList();	
	var goalsListView = new GoalListView({collection:goalsList, el:'#goals'});
	
	$.getJSON('/ejs/templates', function(data) {
		window.templates = {};
		_.each(data, function(val, index) {
			window.templates[index] = _.template(val);
		});
		
		scheduleView.render();
		goalsListView.render();
	});
	
	var majorId = getQueryString('major');
	if (majorId) {
		var	major = new Goal({
			id: majorId
		});
		
		major.once('sync', function() {
			goalsList.add(this);
		});
		major.fetch();	
	}
});

var Course = Backbone.Model.extend({
	url: function() {
		return '/courses/' + this.get('_id');
	},
	getColorId: function() {
		return this.get('colorId') || 1;
	},
	getHours:function() {
		return (this.get('numOfCredits'))[0];
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
	
	countHours: function(courseArray) {
		return this.reduce(function(memo, course) {
			var courseCode = course.get('courseCode');
			var courseMatches = _.some(courseArray, function(coursePattern) {
				return CourseCodeTokenizer.matches(courseCode, coursePattern);
			});
			
			if (courseMatches) {
				return memo + course.getHours();
			} else {
				return memo;
			}
		}, 0);
	},

	countCourses: function() {
		var courseArray = [].slice.call(arguments), 
		    result = 0,
		    i, n;

		for (i = 0, n = courseArray.length; i < n; ++i) {
			this.each(function(course) {
				
				if (CourseCodeTokenizer.matches(course.get('courseCode'), courseArray[i])) {
					result++;
				}
			});
		}

		return result;
		
	},
	
	countCoursesWithCategory: function(category) {
		return this.reduce(function(memo, course) {
			if (course.get('category') === category) {
				return memo++;
			} else {
				return memo;
			}
		}, 0);
	},
	//accepts an optional parameter of a query, which filters
	//some courses out of the hours count
	getAllHours: function(query) {
		if (!query) {
			return this.reduce(function(memo, course) {
				return memo + course.getHours();
			}, 0);
		}
		

	},
	//accepts a variable number of course codes
	hasTaken: function() {
		var i, n, hasTaken = false;
		for (i =0, n = arguments.length; i < n; ++i) {
			this.each(function(course) {
				if (!CourseCodeTokenizer.matches(arguments[i], course.get('courseCode'))) {
					hasTaken = false;
					return;
				}
			});
		}
		return hasTaken;
	},

	//takes a single number parameter followed by a variable
	//number of boolean parameters and returns true if the number
	//of boolean parameters that are true is at least equal to the number
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

var GoalList = Backbone.Collection.extend({
	model:Goal
});

var CourseCollection = Backbone.Collection.extend({
	model:Course,
	initialize: function(models, options) {
		this.on('add remove reset', (this.doOnLoad).bind(this));
		this._colorId = options.colorId;
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

var Goal = Backbone.Model.extend({
	urlRoot: '/goals',
	
	initialize:function() {
		this.on('sync', (this.loadCourses).bind(this));
		Schedule.getInstance().on('add remove reset', (this.updateValidation).bind(this));
		this.on('error', function() {
			console.log('oh, crap.');
		});
	},
	
	loadCourses:function() {
		_.each(this.get('items'), (function(item, i, items) {
			item.courseCollection = new CourseCollection([], {
				url: '/courses/lookup?q=' + item.courses.map(encodeURIComponent).join(','),
				colorId: ((i % 9) + 1)
			});

			if (item.validator === "StdValidator.takeAll") {
				item.validate = (StdValidator.takeAll).bind(item);
			} else if (item.validator.substr(0, 22) === "StdValidator.takeHours") {
				var num = parseInt(item.validator.match(/\d+/), 10);
				item.validate = (StdValidator.takeHours(num)).bind(item);
			} else if (item.validator.substr(0, 24) === "StdValidator.takeCourses") {
				var num = parseInt(item.validator.match(/\d+/), 10);
				item.validate = (StdValidator.takeCourses(num)).bind(item);
			} else {
				item.validate = (new Function('schedule', '"use strict"; ' + item.validator)).bind(item);
			}
			
			item.courseCollection.on('sync', (this.onCourseCollectionLoad).bind(this));
			item.courseCollection.fetch();
		}).bind(this));
		this.updateValidation();
	},
	
	onCourseCollectionLoad:function(e) {
		this.updateValidation();
		this.trigger('collectionloaded');
	},
	
	updateValidation:function() {
		_.each(this.get('items'), function(item) {
			item.validationStatus = item.validate(Schedule.getInstance());
		});
		this.trigger('revalidated');
	}
});

// Factory for common validators.
var StdValidator = {
	takeHours: function(hours) {

		return (function(schedule) {
			var remainingHours = hours; 
			this.courseCollection.forEach(function(course_b) {
				if (schedule.contains(course_b)) {
					remainingHours = remainingHours - course_b.getHours();	
				}
			});
			
			return (remainingHours <= 0) ? true : 'Yo!! You be missin\' ' + remainingHours + ' hours in yo\' schedule';
		});
	},
	takeCourses: function(numOfClasses) {
		return function(schedule) {
			var remainingClasses = numOfClasses;
			this.courseCollection.forEach(function(course) {
				if (schedule.contains(course)) {
					remainingClasses--;
				}
			});
			return (remainingClasses <= 0) ? true : 'Ahoy!! There be ' + remainingClasses + ' that not be taken, me matey!';
		};
	},
	takeAll: function(schedule) {
		var missingCourses = [];
		this.courseCollection.forEach(function(course) {
			if (!schedule.contains(course)) {
				missingCourses.push(course.get('courseCode'));
			}
		});
	
		if (this.courseCollection.length === 0) {
			return true;
		}
		
		if (missingCourses.length === 0) {
			return true;
		} else {
			var noun = 'course';
			if (missingCourses.length > 1) {
				noun += 's';
			}
			return 'Young Jedi! ' + missingCourses.length + ' ' + noun + ' missing you are.  Take them you must: ' + missingCourses.join(', ') + '.';
		}
	}
};

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
		
		var coursePrefix = token.match(/[a-z]+/i)[0].toUpperCase();
		var courseNumber = token.match(/\d+/)[0];
		var courseSuffix = "";
		var parseChar = "";
		var temp = token[token.length - 1].toUpperCase();

		if (temp.match(/[+, !, ~, *]/)) {
			parseChar = temp;
		}
		if (temp.match(/[a-z]/i)) {
			courseSuffix = temp;
		}
		var temp2 = token[token.length - 2];
		if (temp2.match(/[a-z]/i)) {
			var courseSuffix = temp2;
		}
		var courseCode = coursePrefix + " " + courseNumber + courseSuffix;
		var course = {
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
		    	courseNumber: 0
		    },

		    q = query.match(/[+,$,*]$/),
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

		}else  {
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

		}
		return false;
		
	}
	
};