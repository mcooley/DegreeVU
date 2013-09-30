


/**
 * An object that resides within a goal, that relates
 * a set of courses and keeps track of whether courses have been 
 * taken or not to validate if they have satisfied 
 * a portion of the overall goal.  Requirements are a recursive
 * object that can have other Requirements nested within them for
 * increased complexity
 * @class Requirement
 */
var Requirement = Backbone.Model.extend({

		/**
		 * Constructor that is called when a Requirement
		 * is initialized.
		 * @constructor
		 * @param {obj} obj A raw JSON object that is the requirement in declarive form
		 */
		initialize: function(obj) {
			
			var items, i, n;
			if (obj.take && obj.takeHours) {
				throw new Error("Cannot define both take and takeHours in a single requirement object");
			}
			if (typeof obj.items[0] === 'object') {
				//then the item is a nested Requirement

				items = [];
				for (i = 0, n = obj.items.length; i < n; ++i) {
					obj.items[i].reqID = Requirement.generateRequirementID(i, this.get('reqID'));
					items[i] = new Requirement(obj.items[i]);
				}
				//no events called
				this.set('items', items, {silent: true});
				this.set('isLeaf', false, {silent: true});
				
			} else {
				//typeof items are strings, need to convert the items
				//into a query collection
				this.set('isLeaf', true, {silent: true});
				items = new QueryCollection(obj.items);
				this.set('items', items, {silent: true});
			}
			
		},
		//getter methods
		/**
		 * Getter for the title of the requirement
		 * @method getTitle
		 * @return {String} title of the requirement
		*/
		getTitle: function() {
			return this.get('title');
		},
		
		/**
		 * Getter for the requirements items.  These items can either be
		 * strings or nested requirements
		 * @method getItems
		 * @return {Array} an array of the items, either an array of strings
		 * or an array of Requirement Objects
		 */
		getItems: function() {
			return this.get('items');
		},
		
		/**
		 * Indicates if the Requirements, or any nested Requirements,
		 * contains the indicated course.  A Requirement Contains a course
		 * despite whether the course has been added to the schedule or not, so 
		 * if a course is added to the schedule, the Requirement will still contain
		 * that course
		 * @method contains
		 * @param {Course} course A Course Object
		 * @return {Boolean} true if the Requirement contains this course
		 */
		contains: function(course) {

		},
		/**
		 * returns the completion type of the requirement, whether
		 * it is 'takeHours', 'takeItems', or 'takeAll'
		 * @method completionType
		 * @return {String} the completion type, indicating how the Requirement
		 * needs to be validated ('takeHours', 'takeItems', 'takeAll')
		 */
		completionType: function() {
			if (this.get('takeHours')) {
				return 'takeHours';
			}

			if (this.get('take') === 'all') {
				return 'takeAll';
			} else {
				return 'takeItems';
			}
		},
		/**
		 * The number of hours needed to complete the requirement.
		 * If the Requirement has a completion type other than 'takeHours'.
		 * This number is the total number of hours needed for completion, despite
		 * any courses that have been added previously
		 * then this returns 0
		 * @method hoursNeeded
		 * @return {Number} The number of hours needed to complete this requirement
		 */
		hoursNeeded: function() {
			if (this.completionType() === 'takeHours') {
				return this.get('takeHours');
			}
			return 0;
		},

		/**
		 * The number of items needed to satisfy the requirement.  If 
		 * the completion type is takeHours, this method returns 0; if the
		 * completion type is takeAll, this returns the total number of items,
		 * and if the completion type is takeItems, this returns the number of 
		 * items indicated.  The number of items returned this method is the same, 
		 * despite the number of courses that are added within the schedule
		 * @method itemsNeeded
		 * @return {Number} the number of items needed to take.
		 */
		itemsNeeded: function() {
			if (this.completionType() === 'takeHours') {
				return 0;
			}
			else if (this.completionType() === 'takeAll') {
				return this.getItems().length;
			} else {
				//takeCourses
				return this.get('take');
			}
		},

		/**
		 * Indicates if the requirement has been satisfied
		 * @method isComplete
		 * @return {Boolean} true if the Requirement has been completed
		 */
		isComplete: function() {
			
		},
		/**
		 * Returns a decimal number to indicate how close someone is to
		 * completing this requirement. A value of 1 means that the requirement
		 * is complete, and a value of 0 means that the requirement has no validated
		 * courses
		 * @method progress
		 * @return {Number} A decimal number between 0 and 1 (inclusive) to indicate
		 * the progress towards completion of the Requirement 
		 */
		progress: function() {
			
		},

		/**
		 * STRUCTURAL METHOD.  Indicates the depth this current Requirement is 
		 * from the root goal within the tree structure of the goal
		 * @method getDepthFromRoot
		 * @return {Number} the number of nodes (Requirements) this Requirement is
		 * from the root 
		 */
		getDepthFromRoot: function() {
			return this.get('reqID').length / 2;
		},
		/**
		 * STRUCTURAL METHOD.  Indicates the depth of the deepest child of this requirement
		 * from the root of the tree structure of the goal
		 * @method getDepthOfChild
		 * @return {Number} the number of nodes (Requirements) the deepest child requirement is
		 * from the root
		 */
		getMaxDepthOfChild: function() {
			var maxDepth = 0;
			if (this.isLeaf()) {
				return this.getDepthFromRoot();
			} 

			this.getItems().forEach(function(req) {
				var depth = req.getMaxDepthOfChild();
				if (maxDepth < depth) {
					maxDepth = depth;
				}
			});
			return maxDepth;
			
		},
		/**
		 * STRUCTURAL METHOD.  Gets the index of this Requirement within
		 * its parent Object.
		 * @method getIndex
		 * @return {Number} the index of this elements
		 */
		getIndex: function() {
			var reqID = this.get('reqID');
			return parseInt(reqID.substr(reqID.length - 2, 2), 16);
		},

		/**
		 * STRUCTURAL METHOD.  Indicates if this Requirement is 
		 * a leaf requirement, meaning that it has not nested Requirements
		 * @method isLeaf
		 * @return {Boolean} true if this Requirement has no nested Requirements
		 */
		isLeaf: function() {
			return this.get('isLeaf');
		},
		/**
		 * STURCTURAL METHOD. Indicates if this Requirement is a root requirement,
		 * meaning that it has not parents
		 * @method isRoot
		 * @return {Boolean} true if this Requirement has no parent Requirements
		 */
		isRoot: function() {
			return this.get('isRoot');
		},

		/**
		 * converts this Requirement Object to a JSON object, including all
		 * the nested Requirements
		 * @method toJSON
		 * @return {Object} JSON object representing this requirement 
		 */
		toJSON: function() {

		}

	},
	{
		//used to generate client-side id's for Requirement objects
		//nested inside the Goal Backbone object so that requirements can be
		//identified.  parentID is string or null.  This method is called by the
		//backbone objects below and not part of any API
		generateRequirementID: function(index, parentID) {

			var appendingPortion;

			if (index < 16) {
				appendingPortion = "0" + index.toString(16);
			} else {
				appendingPortion = index.toString(16);
			}

			if (!parentID) {
				return appendingPortion;
			} 

			return parentID + appendingPortion;
		}
	}),

	Goal = Backbone.Model.extend({

			urlRoot: '/goals/',
			//initialize with the JSON goal object
			initialize: function(obj) {
				//reset the requirements object to become
				//nested backbone objects
				var requirements = [],
					i, n;

				for (i = 0, n = obj.requirements.length; i < n; ++i) {
					obj.requirements[i].isRoot = true;
					
					obj.requirements[i].reqID = Requirement.generateRequirementID(i);
					//no parent id at the root
					requirements[i] = new Requirement(obj.requirements[i]);
					//requirements[i] = new Requirement(obj.requirements[i]);
				}
				//no events called
				this.set('requirements', requirements, {silent: true});
			},
			//fetch courses for a Goal from the server
			//this is temporary
			fetch: function(callback) {
				
			},
			//must first fetch them
			getCourses: function(options) {
				
			},
			getTitle: function() {
				return this.get('title');
			},

			getReqs: function() {
				return this.get('requirements');
			},
			
			
			//returns the number of levels to the deepest leaf of
			//the requirement structure
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

			//returns true if the course is represented in the requirements
			//does not indicate if a course is taken or not
			hasCourse: function(courseCode) {
				var i, n;
				for (i = 0, n = this.getReqs().length; i < n; ++i) {
					if (this.getReqs()[i].hasCourse(courseCode)) {
						return true;
					}
				}
				return false;
			},

			//adds course to the list of courses taken only if:
				//1) the course is not already added
				//2) the course is within the list of courses for this goal
			//emits 'courseAdded' event if a course is successfully added
			addCourse: function(course) {
				
			},

			//removes course from the list of courses taken only if:
				//1) the course is in the list of taken courses
				//2) the course is is within the list of courses for the goal
			//emits 'courseRemoved' event if a course is successfully removed
			removeCourse: function(course) {
				
			},

			update: function() {},
			isComplete: function() {
				var i, n;
				for (i = 0, n = this.getReqs().length; i < n; ++i) {

					if (!this.getReqs()[i].isComplete()) {
						return false;
					} else {
						console.log("This is valid");
					}
				}
				return true;
			},
			//returns a decimal number between 0 and 1
			//1 being totally complete
			completionProgress: function() {
				//for now, this is the implementation
				//return (this.getTakenCourses().length) / (this.getCourseQueries().length);
			},

			//generates a StatementCollection that can be passed to 
			//the server in order to search for suggested courses 
			//based on the current goal the person is looking at...
			relevantSearch: function() {
				//this object can include:
					//courses that this person has already taken
						//in this major
					//maybe global variables such as the school this person is in
					//the major...
				return null;
			}
		}),

	GoalList = Backbone.Collection.extend(
		{
			addCourse: function(courseCode) {

			},
			removeCourse: function(courseCode) {
				
			}
		},
		{
			//singleton goal collection
			getInstance: function() {

			}
		});


