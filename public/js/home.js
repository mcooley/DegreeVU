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
	
	var defaultSchedule = new Schedule(gradYear);

	var scheduleGrid = new ScheduleGrid({model: defaultSchedule, el:'#scheduleGrid'});
	
	scheduleGrid.render();
	
	
	
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
	check: function(schedule) {
		//TODO: check if schedule meets requrement. Probably use schedule.has* methods. Probably eval some code specific to each requirement.
		//Return true on success or string on a failure
	},
	
	courseCounts: function(course) {
		//TODO: check if course counts toward requirement
	}
});

var Goal = Backbone.Model.extend({

	check: function(schedule) {
		var ok = true;
		
		this.get('requirements').each(function(requirement) {
			var componentResult = requirement.check(schedule);
			
			if (componentResult !== true) {
				ok = componentResult;
			}
		});
		return ok;
	},
	
	courseCounts: function(course) {
		var ok = false;
		this.get('requirements').each(function(requirement) {
			if (requirement.courseCounts(course)) {
				ok = true;
			}
		});
		return ok;
	}
	
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