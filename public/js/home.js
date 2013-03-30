$(document).ready(function () {
	var getQueryString = function (key) {
		var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
		var r=[], m;
		while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
		return r;
	}
	
	console.log();
	
	var gradYear = parseInt(getQueryString('gradYear'), 10);
	if (!_.isFinite(gradYear) || Math.abs(gradYear - 2013) > 4) {
		gradYear = 2016;
	}
	
	var scheduleGrid = new ScheduleGrid({model: new Schedule(gradYear), el:'#scheduleGrid'});
	scheduleGrid.render();
	
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
	
	
	
	$('.scheduleColBody, .goalSectionCourseList').sortable({
		connectWith: '.scheduleColBody, .goalSectionCourseList',
		items: '.scheduleBlock',
		containment: 'body',
		cursor: 'move',
		opacity: 0.75,
		distance: 5,
		appendTo: $('body')
	}).disableSelection();
});

/* Models */

var Course = Backbone.Model.extend({
	urlRoot: '/courses',
	getColorID: function() {
		//TODO: make this return the color ID of its parent requirement
		return 1;
	}
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

var Goal = Backbone.Model.extend({
	urlRoot: '/goals',
	
	initialize: function() {
		// Make requirement objects for each.
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
			this.$el.append('<div class="scheduleCol ' + semester.getSeason().toLowerCase() + '"><div class="scheduleColHeader">' + semester.getName() + '</div><div class="scheduleColBody"></div></div>');
		}).bind(this));
		
		$('.scheduleCol').on('sortreceive', this.handleDropOnColumn);
	},
	
	handleDropOnColumn: function(event, ui) {
		console.log(event);
	}
	
});

// A tab listing the requirements for a goal.
var GoalView = Backbone.View.extend({

	render: function() {
		_.each(this.model.get('requirements'), function(requirement, i) {
			var colorId = i % 9 + 1;
			this.$el.append('<div class="goalSection color' + colorId + '"><h2>' + requirement.description + '</h2><div class="goalSectionCourseList"></div>');
		
			_.each(requirement.req, function(reqitem, i) {
				// If a course, initialize a course model and view and append to .goalSection
				// Make sure the course has an "originReq" property with a reference to a requirement object
				
				// If a requirement, recurse down. Requirements not at the top level inherit their parent's colorId.
				
			});
		})
	}
	
});

// A draggable block representing a course
var CourseView = Backbone.View.extend({
	pixelsPerHour: 21,
	
	render: function() {
		this.$el.addClass('scheduleBlock');
		this.$el.append('<div class="scheduleBlock"><div class="scheduleBlockHeader color' + this.model.getColorId() + '">' + this.model.getShortName() + '	</div><div class="scheduleBlockBody">' + this.model.get('description') + '</div></div>');
		this.$el.find('.scheduleBlockBody').css('height', this.pixelsPerHour * ((this.model.get('numOfCredits'))[0] - 1));
	}
});