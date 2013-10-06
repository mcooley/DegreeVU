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

	fetchCourses: function(statementCollection) {
		this.url = 'courses/lookup?q=' + encodeURIComponent(statementCollection.toArray().join(','));
		this.fetch();
	}
	
});

