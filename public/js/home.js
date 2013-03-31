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
	
	var sched = Schedule.getInstance(gradYear);

	var scheduleView = new ScheduleView({collection: sched, el:'#scheduleGrid'});
	scheduleView.render();
	
	var majorId = getQueryString('major');
	if (majorId) {
		var	major = new Goal({
			id: majorId
		});
		
		major.fetch();
		
	} else {
		var major = undefined;
	}
	

	//var goalsList = new GoalsList([major], {el:'#goals'});	
	
	
	var testCourse = new Course({_id: '5157a473f99cc15bf8a06e92'});
	testCourse.fetch();
	var testCourse2 = new Course({_id: '5157a473f99cc15bf8a06e93'});
	testCourse2.fetch();
	
	window.setTimeout(function() {
		var view = new CourseView({model: testCourse, el:'#testCourseHome'});
		view.render();
		var view2 = new CourseView({model: testCourse2, el:'#testCourseHome2'});
		view2.render();
		
		
		var goalView = new GoalView({
			model:major,
			el:'#goal1'
		});
		goalView.render();
		
		$('.scheduleBlock').draggable({
			appendTo: 'body',
			cursor: 'move',
			opacity: 0.75,
			distance: 5,
			helper: 'clone',
			connectToSortable: '.scheduleColBody'
		});
		
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
		
	}, 100);
});

var Course = Backbone.Model.extend({
	url: function() {
		return '/courses/' + this.get('_id');
	},
	getColorId: function() {
		//TODO: actually check the requirements and stuff
		return 1;
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
		this.$el.append('<div class="scheduleBlockHeader color' + this.model.getColorId() + '">' + this.model.get('courseNumber') + '</div><div class="scheduleBlockBody">' + this.model.get('courseName') + '</div>');
		this.$el.find('.scheduleBlockBody').css('height', this.pixelsPerHour * (this.model.getHours() - 1));
		
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
	
	hasCourse: function(course) {
		return this.contains(course);
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
			// trigger event on ui.item?
			
			// Problem: we don't have a reference to the courseModel.
			
			// Moving course within the schedule
			console.log('Move course within schedule.');
		}
	},
	
	updateHoursCount: function() {
		//TODO: change this to count semester-by-semester
		var h = this.collection.reduce(function(memo, model) {
			return memo + (model.get('numOfCredits'))[0];
		}, 0);
		this.$el.find('.hoursCount').text('(' + h + ')');
	}
});





// Goals stuff (not yet implemented)
var GoalList = Backbone.Collection.extend({
	model:Goal
});

var GoalListView = Backbone.View.extend({

});


var CourseCollection = Backbone.Collection.extend({
	model:Course
});

var Goal = Backbone.Model.extend({
	urlRoot: '/goals',
	
	initialize:function() {
		this.on('sync', (this.loadCourses).bind(this));
	},
	
	loadCourses:function() {
		console.log('ran loadCourses!');
		_.each(this.get('items'), (function(item, i, items) {
			console.log(item);
			var courseCollection = new CourseCollection([], {
				url: '/courses/lookup?q=' + item.courses.map(encodeURIComponent).join(',')
			});
			courseCollection.fetch();
			
		}).bind(this));
	}
});

var GoalView = Backbone.View.extend({
	render: function() {
		_.each(this.model.get('items'), (function(item, i) {
			this.$el.append('<div class="goalSection color' + ((i % 9) + 1) + '"><h2>' + item.title + '</h2></div>');
			//TODO: deal with item.courses
		}).bind(this));
	}
});