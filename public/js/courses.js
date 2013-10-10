var Course = Backbone.UniqueModel(Backbone.Model.extend({
	idAttribute: '_id',
	initialize: function() {
		
	},
	url: function() {
		return '/courses/' + this.get('_id');
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
	doOnLoad: function() {
		this.each((function(model) {
			model.set('colorId', this.getColorId());
		}).bind(this));
	},

	fetchCourses: function(courses) {
		var statementCollection;
		if (Array.isArray(courses)) {
			statementCollection = new StatementCollection(courses);
		} else {
			statementCollection = courses;
		}
		this.url = 'courses/lookup?q=' + encodeURIComponent(statementCollection.toArray().join(','));
		this.fetch();
	}
	
});

