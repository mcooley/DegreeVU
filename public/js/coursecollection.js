define(['backbone', 'course'], function(Backbone, Course) {
	
/**
 * Collection of Course Objects
 * @class CourseCollection
 */
return Backbone.Collection.extend({
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

});