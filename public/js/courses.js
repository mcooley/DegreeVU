
/**
 * Singleton Object containing all the data pertaining to a single course
 * @class Course
 */
var Course = Backbone.UniqueModel(Backbone.Model.extend({
	idAttribute: '_id',
	url: function() {
		return '/courses/' + this.get('_id');
	},
	getHours:function() {
		return (this.get('numOfCredits'))[0];
	},

	
}));

/**
 * Collection of Course Objects
 * @class
 */
var CourseCollection = Backbone.Collection.extend({
	model:Course,

	/**
	 * Fetches courses from the server and places them caches them into the
	 * Course Collection.
	 * @method fetchCourses
	 * @event sync
	 * @async
	 * @param {Array, StatementCollection} An array or statement collection containing the
	 * courses that are being fetched from the server
	 */
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

