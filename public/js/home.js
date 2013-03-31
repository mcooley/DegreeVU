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
	
	var sched = new Schedule([], {gradYear:gradYear});

	var scheduleView = new ScheduleView({collection: sched, el:'#scheduleGrid'});
	scheduleView.render();
	
	/*
	var majorId = getQueryString('major');
	if (majorId) {
		var	major = new Goal({
			id: majorId
		});
		
		major.fetch();
		
	} else {
		var major = undefined;
	}
	

	var goalsList = new GoalsList([major], {el:'#goals'});	
	*/
	
	var testCourse = new Course({id: '51571cbf9c27196b6293f335'});
	testCourse.fetch();
	var testCourse2 = new Course({id: '51571cd69c27196b6293f336'});
	testCourse2.fetch();
	
	window.setTimeout(function() {
		var view = new CourseView({model: testCourse, el:'#testCourseHome'});
		view.render();
		var view2 = new CourseView({model: testCourse2, el:'#testCourseHome2'});
		view2.render();
		
		
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
	urlRoot: '/courses',
	getColorId: function() {
		//TODO: actually check the requirements and stuff
		return 1;
	}
});

var CourseView = Backbone.View.extend({
	pixelsPerHour: 21,
	
	render: function() {
		this.$el.addClass('scheduleBlock');
		this.$el.append('<div class="scheduleBlockHeader color' + this.model.getColorId() + '">' + this.model.get('courseNumber') + '</div><div class="scheduleBlockBody">' + this.model.get('courseName') + '</div>');
		this.$el.find('.scheduleBlockBody').css('height', this.pixelsPerHour * ((this.model.get('numOfCredits'))[0] - 1));
		
		this.$el.data('courseObj', this.model);
	}
});

var Schedule = Backbone.Collection.extend({
	initialize: function(models, options) {		
		var gradYear = options.gradYear;
		
		this._semesters = [
			{season: 'Before College'},
			{season: 'Fall', year: gradYear - 4},
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
	}
});

var ScheduleView = Backbone.View.extend({
	initialize: function() {
		this.collection.on('add remove reset', (this.updateHoursCount).bind(this));
	},
	
	render: function() {
		_.each(this.collection.getSemesters(), (function(semester) {
			this.$el.append('<div class="scheduleCol ' + semester.season.toLowerCase() + '" data-semesterseason="' + semester.season + '" data-semesteryear="' + semester.year + '"><div class="scheduleColHeader">' + (semester.season || '') + (semester.year? ' ' : '') + (semester.year || '') + ' <span class="hoursCount">(0)</span></div><div class="scheduleColBody"></div></div>');
		}).bind(this));
		
		this.$el.children('.scheduleCol').on('sortreceive', (this.onCourseMoved).bind(this));
	},
	
	onCourseMoved: function(event, ui) {
		var col = $(event.target).parent();
		var semester = {season: col.attr('data-semesterseason'), year:col.attr('data-semesteryear')};
		
		if (ui.sender.parent().is('.goalSectionCourseList')) {
			// Adding course to the schedule
			var courseModel = ui.sender.data('courseObj');
			this.collection.add(courseModel);
			console.log(courseModel);
			courseModel.set('semester', semester);
		} else if (ui.sender.parent().is('.scheduleCol')) {
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
	
});

var GoalListView = Backbone.View.extend({
	render: function() {
		
	}
});

var Goal = Backbone.Model.extend({
	urlRoot: '/goals'
});

var GoalView = Backbone.View.extend({
	
});