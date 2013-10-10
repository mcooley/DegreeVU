
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

	/**
	 * Adds lock to the Goal with the id passed in
	 * this method does nothing if the course is already 
	 * locked for this id
	 * @method addLock
	 * @param {String} id the id of the Goal that is being locked
	 */
	addLock:function(id) {
		if (!this.locks) {
			this.locks = [id];
		} else if (!this.isLocked()) {
			this.locks.push(id);
		}
	},

	/**
	 * Reset all the locks that exist on the Course
	 * @method reset
	 */
	reset: function() {
		this.locks = null;
	},
	/**
	 * Checks if the course is locked to the Goal
	 * with the given id
	 * @method isLocked
	 * @param {String} id the id of the Goal
	 * @return {Boolean} true if the Course is locked, false otherwise
	 */
	isLocked: function(id) {
		if (!this.locks) {
			return false;
		} else {
			return this.locks.reduce(function(memo, lockedID) {
				return memo || lockedID === id;
			}, false);
		}
	},
	
}));

/**
 * Collection of Course Objects
 * @class CourseCollection
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

