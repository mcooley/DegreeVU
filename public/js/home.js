$(document).ready(function () {
	var getQueryString = function (key) {
		var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
		var r=[], m;
		while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
		return r;
	}
	
	console.log();
	
	var gradYear = parseInt(getQueryString('gradYear'), 10);
	if (Math.abs(gradYear - 2013) > 4) {
		gradYear = 2016;
	}
	
	var scheduleGrid = new ScheduleGrid({model: new Schedule(gradYear), el:'#scheduleGrid'});
	scheduleGrid.render();
	
	var majorId = getQueryString('major');
		
	var	major = new Goal({
		_id: majorId
	});
	major.fetch();
	
	var goalsList = new GoalsList([major], {el:'#goals'});	
	
	
	
	$('.scheduleCol, .goalSectionCourseList').sortable({
		connectWith: '.scheduleCol, .goalSectionCourseList',
		items: '.scheduleBlock',
		containment: 'body',
		cursor: 'move'
	}).disableSelection();
});

/* Models */

var Course = Backbone.Model.extend({
	
});

var Schedule = Backbone.Model.extend({
	initialize: function(gradYear) {
		semesters = [
			new Semester(null, {season: 'Before College'}),
			new Semester(null, {season: 'Fall', year: gradYear - 4}),
			new Semester(null, {season: 'Spring', year: gradYear - 3}),
			new Semester(null, {season: 'Fall', year: gradYear - 3}),
			new Semester(null, {season: 'Spring', year: gradYear - 2}),
			new Semester(null, {season: 'Fall', year: gradYear - 2}),
			new Semester(null, {season: 'Spring', year: gradYear - 1}),
			new Semester(null, {season: 'Fall', year: gradYear - 1}),
			new Semester(null, {season: 'Spring', year: gradYear})
		];
		
		this.set('semesters', semesters);
	}
});


var Requirement = Backbone.Model.extend({
});

var Goal = Backbone.Model.extend({
});

/* Collections */

var GoalsList = Backbone.Collection.extend({
	
});

var Semester = Backbone.Collection.extend({
	
	initialize: function(models, options) {
		if (options.season) {
			this._season = options.season;
		}
		if (options.year) {
			this._year = options.year;
		}
	},
	
	getName: function() {
		var name = (this._season || '');
		if (this._year) {
			name += ' ' + this._year;
		}
		return name;
	},
	
	getSeason: function() {
		return this._season;
	},
	
	getYear: function() {
		return this._year;
	}
});

/* Views */

var ScheduleGrid = Backbone.View.extend({
	
	render: function() {
		this.model.get('semesters').forEach((function(semester) {
			this.$el.append('<div class="scheduleCol"><div class="scheduleColHeader">' + semester.getName() + '</div><div class="scheduleColBody"></div></div>');
		}).bind(this));
	}
	
});

// A tab listing the requirements for a goal.
var GoalView = Backbone.View.extend({

	render: function() {
		_.each(this.model.get('requirements'), function(requirement, i) {
			var colorId = i % 9 + 1;
			this.$el.append('<div class="goalSection color' + colorId + '"><h2>' + requirement.description + '</h2><div class="goalSectionCourseList"></div>');
		
			//TODO: go through the courses list and initialize any course views.
		})
	}
	
});

// A draggable block representing a course
var CourseView = Backbone.View.extend({
	
});