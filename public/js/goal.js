if (typeof define !== 'function') { var define = require('amdefine')(module) }

define(['backbone', 'requirement', 'coursecollection'], function(Backbone, Requirement, CourseCollection) {

/**
 * An object that represents large-scale goals, such as Major and Minors,
 * and keeps track of someone's progress towards satisfying the Goals. Methods marked 
 * as Structural Methods should not be called outside of the class, and are considered
 * "private"
 * @class Goal 
 */
return Backbone.Model.extend({

	/**
	 * An array of Requirement Objects, which are the requirements that
	 * need to be satisfied for the goal to be satisfied
	 * @property requirements
	 * @type Array
	 */
	urlRoot: '/goals/',
	
	/**
	 * Constructor for the Goal Object
	 * @constructor
	 * @param {Object} obj Raw JSON object representing the goal 
	 */
	initialize: function(obj) {
		//temp id's until server side id's are created
		this.id = (tempID++).toString();

		//the head requirement
		//set the default flags at the root
		//so they are inheritted by child requirements
		this.head = new Requirement(
			{
				title: 'root',
				isRoot: true,
				lock: true,
				ignoreLock: false,
				items: obj.items, 
				goalID: this.id,
				take: 'all'
			});
		
	},
	
	/**
	 * Getter for the title of the Goal
	 * @method getTitle
	 * @return {String} title of the goal
	 */
	getTitle: function() {
		return this.get('title');
	},
	
	/**
	 * STRUCTURAL METHOD.  Returns the depth of the deepest leaf
	 * within the tree structure of this Goal
	 * @method getDepth
	 * @return {Number} The number of nodes deep the deepest Requirement
	 * leaf resides
	 */
	getDepth: function() {
		var maxDepth;
		if (!this.getDepth.memo) {
			maxDepth = 0;
			this.getReqs().forEach(function(req) {
				var depth = req.getMaxDepthOfChild();
				if (maxDepth < depth) {
					maxDepth = depth;
				}
			});
			this.getDepth.memo = maxDepth + 1;
		}
		return this.getDepth.memo;
	},

	/**
	 * Indicates if a course is within the goal (a course is able to
	 * satsify this Goal).  Does not indicate if the course is already added
	 * to the schedule or not
	 * @method contains
	 * @param {Course} course A Course object
	 * @return {Boolean} true if the course can satisfy the Goal
	 */
	contains: function(course) {
		return this.head.contains(course);
	},
	
	/**
	 * Getter for the top level requirements that are nested
	 * directly within the goals object
	 * @method requirements
	 * @return {Array} An array of Requirement Objects that form
	 * the top level Requirements
	 */
	requirements: function() {
		return this.head.getItems();
	},

	/**
	 * Returns the number of top-level Requirements that exist within 
	 * the Goal
	 * @method length
	 * @return {Number} the number of top-level Requirements
	 */
	length: function() {
		return this.head.getItems().length;
	},
	/**
	 * Adds a course collection to the Goal and inserts the courses into
	 * the nested Requirements. This method resets the validation, so any courses
	 * that previously existed in the Goal are removed and reset using this new course
	 * collection.  Fires an event 'reset' when the Goal is done resetting its validation
	 * @method addCollection
	 * @param {CourseCollection} courseCollection The course collection containing the new
	 * @even reset
	 * courses to validate.  This method makes no changes to courseCollection
	 */
	addCollection: function(courseCollection) {
		//make a copy so the requirement objects do not modify the course collection
		var collectionCopy = new CourseCollection(courseCollection.models.slice(), {});
		this.reset();
		this.head.addCollection(collectionCopy);
		this.trigger('reset');
	},
	/**
	 * Indicates if the Goal is completely satisfied
	 * @method isComplete
	 * @return {Boolean} true if the courses in the schedule are enough to
	 * satisfy this Goal
	 */
	isComplete: function() {
		return this.head.isComplete();
	},

	/**
	 * Indicates the progress towards completing a goal, using a decimal
	 * number between 0 and 1 inclusive.
	 * @method progress
	 * @return {Number} A number between 0 and 1 (inclusive) to indicate the 
	 * progress towards completion, 1 being totally satisfied, and 0 being nothing is 
	 * satisfied, with appropriate values in between
	 */
	progress: function() {
		if (typeof this.progress.cache !== 'number') {
			this.progress.cache = this.head.progress();
		}
		return this.progress.cache;	
	},

	/**
	 * Resets any cached values within the goal object,
	 * and resets the courses within the Goal and sub-requirements,
	 * so that no courses have been satsified for the Goal.  This is a
	 * 'private' method used by 'addCollection' method
	 * @method reset
	 */
	reset: function() {
		this.progress.cache = null;
		this.head.reset();
	},
	/**
	 * An object that checks for relevant classes to the major and returns
	 * a StatementCollection object that can be used to perform queries for
	 * relevant courses to this goal
	 * @method relevantSearch
	 * @return {StatementCollection} a statement collection that can be used
	 * to pass to the server's api and retrieve relevant courses
	 */
	relevantSearch: function() {
		//this object can include:
			//courses that this person has already taken
				//in this major
			//maybe global variables such as the school this person is in
			//the major...
		return null;
	},

	/**
	 * converts this Goal Object to a JSON object, including all
	 * the nested Requirements
	 * @method toJSON
	 * @return {Object} JSON object representing this Goal 
	 */
	toJSON: function() {

	}
});
	
});