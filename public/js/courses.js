var Course = Backbone.UniqueModel(Backbone.Model.extend({
	idAttribute: '_id',
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
}));

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
	},
	//unioning backbone courses
	//remove extra references
	union: function(courseCollection) {
		if (this !== courseCollection) {
			courseCollection.models.each(function(course) {
				if (!this.contains(course)) {
					this.models.push(course);
				}
			}, this);
		}
	}
	
});