


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
