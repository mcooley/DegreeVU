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
	scheduleView.render();
	
	var goalsList = new GoalList();	
	var goalsListView = new GoalListView({collection:goalsList, el:'#goals'});
	goalsListView.render();
	
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

var CourseView = Backbone.View.extend({
	pixelsPerHour: 21,
	
	initialize: function() {
		Schedule.getInstance().on('add remove reset', (this.onAddToSchedule).bind(this));
	},
	
	render: function() {
		this.$el.addClass('scheduleBlock');
		this.$el.append('<div class="scheduleBlockHeader color' + this.model.getColorId() + '">' + this.model.get('courseCode') + '</div>');
		if (this.model.getHours() > 1) {
			var x = $('<div class="scheduleBlockBody" style="height:' + (this.pixelsPerHour * (this.model.getHours() - 1)) + 'px;">' + this.model.get('courseName') + '</div>').appendTo(this.$el);
			//x.css('height', this.pixelsPerHour * (this.model.getHours() - 1));
		} else {
			this.$el.find('.scheduleBlockHeader').addClass('oneHour');
		}
		this.$el.draggable({
			appendTo: 'body',
			cursor: 'move',
			opacity: 0.75,
			distance: 5,
			helper: 'clone',
			connectToSortable: '.scheduleColBody'
		}).popover({
			html:true,
			title:this.model.get('courseCode') + ': ' + this.model.get('courseName'),
			placement:'top',
			trigger:'manual',
			content:this.model.get('details')
		}).click(function(event) {
			if (!$(this).hasClass('hasPopoverShowing')) {
				$('.hasPopoverShowing').popover('hide');
				$(this).addClass('hasPopoverShowing').popover('show');
			} else {
				$(this).popover('hide').removeClass('hasPopoverShowing');
			}
			event.stopPropagation();
		});
		
		$(document).click(function() {
			$('.hasPopoverShowing').popover('hide');
		});
		
		
		this.$el.data('courseObj', this.model);
	},
	
	onAddToSchedule: function() {
		if (Schedule.getInstance().contains(this.model)) {
			this.$el.draggable("disable").addClass('placed');
		}
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
	hasCourses: function(courseArray) {
		return _.every(courseArray, function(coursePattern) {
			return this.some(function(course) {
				return CourseCodeTokenizer.matches(course.get('courseCode'), coursePattern);
			});
		});
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
	
	countCourses: function(courseArray) {
		return this.reduce(function(memo, course) {
			var courseCode = course.get('courseCode');
			var courseMatches = _.some(courseArray, function(coursePattern) {
				return CourseCodeTokenizer.matches(courseCode, coursePattern);
			});
			//Wrong!
			if (courseMatches) {
				return memo++;
			} else {
				return memo;
			}
		}, 0);
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
	
	getHoursOfAllCourses: function() {
		return this.reduce(function(memo, course) {
			return memo + course.getHours();
		}, 0);
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

var ScheduleView = Backbone.View.extend({
	initialize: function() {
		//this.collection.on('add remove reset', (this.updateHoursCount).bind(this));
	},
	
	render: function() {
		_.each(this.collection.getSemesters(), (function(semester) {
			this.$el.append('<div class="scheduleCol ' + semester.season.toLowerCase() + '" data-semesterseason="' + semester.season + '" data-semesteryear="' + semester.year + '"><div class="scheduleColHeader">' + (semester.season || '') + (semester.year? ' ' : '') + (semester.year || '') + '</div><div class="scheduleColBody"></div></div>');
		}).bind(this));
		
		$('.scheduleColBody').sortable({
			connectWith: '.scheduleColBody',
			items: '.scheduleBlock',
			cursor: 'move',
			opacity: 0.75,
			distance: 5,
			helper: 'clone',
			appendTo: 'body',
			beforeStop: function(event, ui) {
				ui.item.trigger(event, ui);
			},
			stop: function(event, ui) {
				ui.item.trigger(event, ui);
			}
		}).disableSelection();
		
		
		this.$el.children('.scheduleCol').on('sortreceive', (this.onCourseMoved).bind(this));
	},
	
	onCourseMoved: function(event, ui) {
		var col = $(event.target).parent();
		var semester = {season: col.attr('data-semesterseason'), year:col.attr('data-semesteryear')};
		
		if (ui.sender.parent().is('.goalSectionCourseList')) {
			// Adding course to the schedule
			var courseModel = ui.sender.data('courseObj');
			courseModel.set('semester', semester);
			this.collection.add(courseModel);
		} else if (ui.sender.parent().is('.scheduleCol')) {
			// Moving course within the schedule
			console.log('Move course within schedule.');
		}
		this.updateHeight();
	},
	
	updateHeight:function() {
		var maxHeight = 250;
		$('.scheduleColBody').each(function(i, el) {
			if ($(el).height() > maxHeight) {
				maxHeight = $(el).height() + 40;
			}
		});
		
		maxHeight=300;
		
		$('.scheduleCol').css('height', maxHeight + 'px');
		$('#scheduleGrid').css('height', maxHeight + 'px');
	},
	
	updateHoursCount: function() {
		//TODO: change this to count semester-by-semester
		var h = this.collection.reduce(function(memo, model) {
			return memo + (model.get('numOfCredits'))[0];
		}, 0);
		this.$el.find('.hoursCount').text('(' + h + ')');
	}
});





var GoalList = Backbone.Collection.extend({
	model:Goal
});

var GoalListView = Backbone.View.extend({
	initialize:function() {
		this._goalViews = [];
		this.collection.on('add', (this.addTab).bind(this));
	},
	
	render:function() {
		this.$el.append('<ul class="nav nav-tabs"></ul>');
		this.$el.append('<div class="tab-content"></div>');
	},
	
	addTab:function(model) {
		this.$el.find('ul.nav-tabs').append('<li class="active"><a href="goal' + model.get('_id') + '" data-toggle="tab">' + model.get('name') + ' ' + model.get('type').charAt(0).toUpperCase() + model.get('type').slice(1) + '</a></li>');
		var e = $('<div class="tab-pane active" id="goal' + model.get('_id') + '"></div>').appendTo(this.$el.find('div.tab-content'));
		var view = new GoalView({model:model, el:e});
		this._goalViews.push(view);
		view.render();
	}
});


var CourseCollectionView = Backbone.View.extend({
	initialize:function() {
		this.collection.on('sync', (this.render).bind(this));
	},
	
	render: function() {
		this.collection.each((function(courseModel) {
			var e = $('<div></div>').appendTo(this.$el);
			var courseView = new CourseView({model:courseModel, el:e});
			courseView.render();
		}).bind(this));
	}
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

var GoalView = Backbone.View.extend({
	initialize: function() {
		this._courseCollectionViews = [];
		this.model.on('sync', (this.render).bind(this));
		this.model.on('collectionloaded', (this.render).bind(this));
		this.model.on('revalidated', (this.updateValidation).bind(this));
	},
	
	render: function() {
		_.each(this.model.get('items'), (function(item, i) {
			if (!item.courseCollection) return;
			
			if (!this._courseCollectionViews[i]) {
				var p = $('<div class="goalSection color' + item.courseCollection.getColorId() + '"><div class="goalSectionHeader"><h2>' + item.title + '</h2><span class="validationStatus"></span>' + (item.comment? '<div class="comment">' + item.comment + '</div>' : '') + '</div><div class="goalSectionCourseList"></div></div>').appendTo(this.$el);
			
				var childEl = p.find('.goalSectionCourseList');
				
				this._courseCollectionViews[i] = new CourseCollectionView({collection:item.courseCollection, el:childEl});
			}
		}).bind(this));
		this.updateValidation();
	},
	
	updateValidation: function() {
		_.each(this.model.get('items'), (function(item, i) {
			var status = '';
			if (item.validationStatus === true) {
				status = '<img class="validationIcon" src="/img/check.png">';
			} else {
				status = '<img class="validationIcon" src="/img/x.png">' + item.validationStatus;
			}
			
			this.$el.find('.goalSection:eq(' + i + ') .validationStatus').html(status);
		}).bind(this));
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
		var coursePrefix = token.match(/[a-z]+/i)[0];
		var courseNumber = token.match(/\d+/);
		var courseSuffix = "";
		var parseChar = "";
		var temp = token[token.length - 1];

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
			course.courseNumber = parseInt(courseNumber[0]);
		} else {
			course.courseNumber = 0;
		}

		return course;
	}
	
};