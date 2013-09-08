
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
				
				if (CourseCodeTokenizer.matchQuery(course.get('courseCode'), args[i])) {
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
/*
var GoalList = Backbone.Collection.extend({
	model:Goal
});
*/

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
/*
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
			if (typeof item === 'string') {
				//search stdItems for item
				item = ValidationBundle.StdItem[item];
				//replace the string with the referenced
				//validation object
				this.get('items')[i] = item;
				if (item === undefined) {
					throw new Error("Could not find the item in the StdItem bundle");
				}
				
			}

			item.courseCollection = new CourseCollection([], {
				url: '/courses/lookup?q=' + item.courses.map(encodeURIComponent).join(','),
				colorId: ((i % 9) + 1)
			});
			//preset it so the array exists at least until
			//it is set after course collection is synced
			item._courses = [];
			//create an array of all course codes for easier validation
			item.courseCollection.on('sync', function() {
				item._courses = [].map.call(item.courseCollection.models, function(course) {
					return course.get('courseCode');
				});
			});

			//add validation helper object to the item
			//for easier and more thorough validation
			item.validationHelper = new ValidationBundle.ValidationHelper(Schedule.getInstance(getQueryString('gradYear')));
			if (item.defineSets === "singleSet") {
				
				item.sets = (ValidationBundle.DefineSingleSet).bind(item);
			} else {
				item.sets = (new Function('state', '"use strict"; ' + item.defineSets)).bind(item);
			}
			
			if (item.sets === undefined) {
				throw new Error("Could not find item.sets function");
			}
			item.sets(item.validationHelper);
			

			if (item.validator === "StdValidator.takeAll") {
				
				item.validate = (ValidationBundle.StdValidator.takeAll).bind(item);
				
			} else if (item.validator.substr(0, 22) === "StdValidator.takeHours") {
				var num = parseInt(item.validator.match(/\d+/), 10);
				item.validate = (ValidationBundle.StdValidator.takeHours(num)).bind(item);
			} else if (item.validator.substr(0, 24) === "StdValidator.takeCourses") {
				var num = parseInt(item.validator.match(/\d+/), 10);
				item.validate = (ValidationBundle.StdValidator.takeCourses(num)).bind(item);
			} else {
				//HERE
				item.validate = (new Function('state', '"use strict"; ' + item.validator)).bind(item);
				
			}

			item.message = function() {
				if (item.isValidated) {
					return item.onSuccess[currentTheme];
				} 
				return item.onFailure[currentTheme];
			};

			if (!item.onSuccess) {
				item.onSuccess = ValidationBundle.FallbackMessaging.onSuccess;
			}

			if (!item.onFailure) {
				item.onFailure = ValidationBundle.FallbackMessaging.onFailure;
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

		//HERE
		_.each(this.get('items'), function(item) {
			//update validation
			item.validate(item.validationHelper);
			//get the result
			item.isValidated = item.validationHelper.isComplete();;
		});
		this.trigger('revalidated');
	}
});

*/

