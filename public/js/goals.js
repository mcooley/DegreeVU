


/**
 * An object that resides within a goal, that relates
 * a set of courses and keeps track of whether courses have been 
 * taken or not to validate if they have satisfied 
 * a portion of the overall goal.  Requirements are a recursive
 * object that can have other Requirements nested within them for
 * increased complexity
 * @class Requirement
 */
var isServerSide = typeof require === 'function' && typeof exports === 'object' && typeof module === 'object';
if (isServerSide) {
	Backbone = require('Backbone');
}
var Requirement = Backbone.Model.extend({

		/**
		 * Constructor that is called when a Requirement
		 * is initialized.
		 * @constructor
		 * @param {obj} obj A raw JSON object that is the requirement in declarive form
		 */
		initialize: function(obj) {
			
			var items, i, n;
			if (typeof obj.items[0] === 'object') {
				//then the item is a nested Requirement

				items = [];
				for (i = 0, n = obj.items.length; i < n; ++i) {
					obj.items[i].reqID = Requirement.generateRequirementID(i, this.get('reqID'));
					obj.items[i].isRoot = false;
					items[i] = new Requirement(obj.items[i]);
				}
				
				this.set('items', items, {silent: true});
				this.set('isLeaf', false, {silent: true});
				
			} else {
				//typeof items are strings, need to convert the items
				//into a query collection
				this.set('isLeaf', true, {silent: true});
				items = new StatementCollection(obj.items);
				this.set('items', items, {silent: true});
			}
			
		},

		/**
		 * Fetches all the courses at the leaf requirements and stores them 
		 * within CourseCollection objects.  Fires an event 'sync' to signify that 
		 * the fetching has completed
		 * @method fetch
		 * @event sync
		 * @async
		 */
		fetch: function() {
			var courses, itemCount, fetchFunct, i, n;
			if (this.isLeaf()) {
				courses = new CourseCollection(null, []);
				this.set('courses', courses, {silent: true});
				courses.once('sync', function() {
					//keep a courseMap that caches whether the course
					//is in the schedule or not, and initialize all the 
					//values to false
					this.courseMap = new Array(courses.length);
					for (i = 0, n = this.courseMap.length; i < n; ++i) {
						this.courseMap[i] = false;
					}
					//trigger sync on requirements
					this.trigger('sync');
				}, this);
				
				//fetch courses using the StatementCollection
				courses.fetchCourses(this.get('items'));

			} else {
				itemCount = this.get('items').length;
				fetchFunct = function() {
					itemCount -= 1;
					if (itemCount === 0) {
						this.trigger('sync');
					}
				};
				this.get('items').forEach(function(req) {
					req.once('sync', fetchFunct, this);
					req.fetch();
				}, this);
			}
		},
		
		/**
		 * Getter for the title of the requirement
		 * @method getTitle
		 * @return {String} title of the requirement
		*/
		getTitle: function() {
			return this.get('title');
		},
		
		/**
		 * Getter for the requirements items.  If the Requirement Object is a 
		 * leaf Requirement, then this will return a StatementCollection.  Otherwise,
		 * this will return an array of Requirements
		 * @method getItems
		 * @return {Array, StatementCollection} An array of Requirements, if the Requirement
		 * object has nested Requirements, or a StatementCollection, if the Requirement Object
		 * is a leaf Requirement
		 */
		getItems: function() {
			return this.get('items');
		},
		
		/**
		 * Indicates if the Requirements, or any nested Requirements,
		 * contains the indicated course.  A Requirement Contains a course
		 * despite whether the course has been added to the schedule or not, so 
		 * if a course is added to the schedule, the Requirement will still contain
		 * that course.  Throws error "CourseCollection not yet fetched" if the courses
		 * for the requirement were not yet fetched from the server when this method is
		 * called
		 * @method contains
		 * @param {Course} course A Course Object
		 * @return {Boolean} true if the Requirement contains this course
		 * @throws "CourseCollection not yet fetched"
		 */
		contains: function(course) {
			var i,n;
			if (this.isLeaf()) {
				if (!this.getCourses()) {
					throw new Error("CourseCollection not yet fetched");
				}

				for (i = 0, n = this.getCourses().length; i < n; ++i) {
					if (course === this.getCourses().models[i]) {
						return true;
					}
				}
				return false;

			} else {
				return this.getItems().reduce(function(memo, req) {
					return memo || req.contains(course);
				}, false);
			}
		},

		/**
		 * Getter for courseCollection.  Returns null if the courseCollection has not
		 * yet been fetched.  If this is called on a Requirement that is not a leaf, then
		 * all courses from sub-requirements will be fetched and unioned to remove redundancies.
		 * @method getCourses
		 * @return {CourseCollection} A CourseCollection Backbone Object containing the 
		 * courses for the requirement
		 */
		getCourses: function() {
			var collection, i, n, j;
			if (this.isLeaf()) {
				if (this.get('courses')) {
					return this.get('courses');
				}
				//null for courses not yet fetched
				return null;
			} else {
				collection = new CourseCollection(null, []);
				this.getItems().forEach(function(req) {
					var tempColl = req.getCourses();
					if (tempColl) {
						collection.add(tempColl.models);
					}
				});

				//union here
				for (i = 0, n = collection.length; i < n; ++i) {
					if (collection.models[i]) {
						for (j = i + 1; j < n; ++j) {
							if (collection.models[i] === collection.models[j]) {
								collection.models[j] = null;
							}
						}
					}	
				}
				collection.models = collection.filter(function(course) {
					return course;
				});
				return collection;
			}
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
		 * For adding a singe Backbone course to a requirement
		 * This method is considered 'private'.  Should call 'addCollection'
		 * method if adding courses.  This method does nothing if the schedule has
		 * not yet been fetched.  This method is meant to be called on leaf Requirements,
		 * but if it is called on higher-level requirements, it will add the course to all
		 * sub-requirements
		 * @param {Course} course A backbone course being added to this requirement
		 * @return {Boolean} true if the course was successfully added, false otherwise
		 */
		addCourse: function(course) {
			var i, n;
			if (this.isLeaf()) {
				if (this.getCourses()) {
					for (i = 0, n = this.getCourses().length; i < n; ++i) {
						if (this.getCourses().models[i] === course) {
							this.courseMap[i] = true;
							return true;
						}
					}
				}
				return false;
			} else {
				return this.getItems().reduce(function(memo, req) {
					//make sure that add course is called on all
					//sub-requirements, so separate out boolean with
					//addCourse call
					var added = req.addCourse(course);
					return memo || added;
				}, false);
			}
		},

		/**
		 * Adds a course collection to the requirement and all 
		 * sub-requirements.  This method resets the Requirements,
		 * so any courses that were previously held in the collection are removed 
		 * and all the new courses are added.  The course collection that is passed
		 * in as a parameter will be modified as different requirements iterate through
		 * courses and remove courses that they "claim".  This is a "private" method, should
		 * call addCollection exclusively on the Goal Object or GoalList Object. Fires an event
		 * 'reset' when the Requirement is done resetting its validation.  This method depends
		 * on the implementation of 'contains' and 'courseDemand'.  This method does nothing
		 * if the courses have not yet been fetched from the server.
		 * @method addCollection
		 * @event reset
		 * @param {CourseCollection} courseCollection A backbone CourseCollection Object.  This
		 * method makes changes to courseCollection by removing courses as they are claimed
		 * by requirements
		 */
		addCollection: function(courseCollection) {
			var i, n, done;
			if (this.isLeaf()) {
				if (this.getCourses()) {
					toRemove = [];
					for (i = 0, n = courseCollection.length, done = false; i < n && !done; ++i) {
						this.addCourse(courseCollection.models[i]);
						if (this.isComplete()) {
							done = true;
						}
					}
				}	
			} else {
				//reset the Requirements before adding courses
				if (this.isRoot()) {
					this.reset();
				}
				
				//now insert courses into requirements in order that the courses
				//are in the course collection and in the order the requirements are
				this.getItems().forEach(function(req) {
					req.addCollection(courseCollection);
				});
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
				//get the length of a StatementCollection if it is a leaf,
				//otherwise, get the length of an array
				return (this.isLeaf()) ? this.getItems().length() : this.getItems().length;
			} else {
				//takeCourses
				return this.get('take');
			}
		},

		/**
		 * Calculates the hours taken for a requirement.  This method
		 * returns 0 if the courses have not yet been fetched. If the requirement
		 * has a maxHours flag, then any additional hours beyond the maxHours will
		 * be truncated out, and this method will just return the maxHours.  If the 
		 * Requirement is not a leaf Requirement, this method tallies up the total number
		 * of hours in the sub-requirements.  Note that this can result in courses being
		 * counted more than once.
		 * @method hoursTaken
		 * @return {Number} the number of hours satisfied for this Requirement
		 */
		hoursTaken: function() {
			var hours;
			if (this.isLeaf()) {
				hours =  (this.getCourses()) ? this.getCourses().reduce(function(memo, course, index) {
					return (this.courseMap[index]) ? memo + course.getHours() : memo;
				}.bind(this), 0) : 0;

				//check for a max hours flag
				return (this.get('maxHours') && this.get('maxHours') < hours) ? this.get('maxHours') : hours;

			} else {
				return this.getItems().reduce(function(memo, req) {
					return memo + req.hoursTaken();
				}, 0)
			}
		},

		/**
		 * Calculates the number of items taken.  If courses have not yet been fetched, this will
		 * return a 0.  If this is not a leaf requirement, this will return the number of sub-requirements
		 * that are complete
		 * @method itemsTaken
		 * @return {Number} the number of items that are satisfied within the Requirement
		 */
		itemsTaken: function() {
			if (this.isLeaf()) {
				return (this.getCourses()) ? this.getCourses().reduce(function(memo, course, index) {
					return (this.courseMap[index]) ? memo + 1 : memo;
				}.bind(this), 0) : 0;
			} else {

				return this.getItems().reduce(function(memo, req) {
					return (req.isComplete()) ? memo + 1 : memo;
				}, 0);
			}
		},

		/**
		 * Indicates if the requirement has been satisfied.  Throws an exception,
		 * "CourseCollection not yet fetched", if the Requirement has not yet fetched
		 * courses from the server
		 * @method isComplete
		 * @return {Boolean} true if the Requirement has been completed.  Returns false
		 * if the courses have not yet been fetched from the server
		 */
		isComplete: function() {
			return this.progress() === 1;
		},
		/**
		 * Returns a decimal number to indicate how close someone is to
		 * completing this requirement. A value of 1 means that the requirement
		 * is complete, and a value of 0 means that the requirement has no validated
		 * courses.  This method returns 0 if the courses have not yet been fetched
		 * @method progress
		 * @return {Number} A decimal number between 0 and 1 (inclusive) to indicate
		 * the progress towards completion of the Requirement 
		 */
		progress: function() {
			//for now, keep it simple, each sub-requirement is weighted equally,
			//no matter how many nested requirements it the sub-requirement has
			var count, total;
			if (this.isLeaf()) {
				if (this.getCourses()) {
					if (this.completionType() !== 'takeHours') {
						count = this.courseMap.reduce(function(memo, isTaken) {
							return (isTaken) ? memo + 1 : memo;
						}, 0);
						total = this.itemsNeeded();
					} else {
						//takeHours completion type
						total = this.hoursNeeded();
						count = this.getCourses().reduce(function(memo, course, index) {
							return (courseMap[index]) ? memo + course.getHours() : memo;
						}, 0);
					} 
					return (count >= total) ? 1 : count / total;
				}
				return 0;
					
			} else {
				if (this.completionType() !== 'takeHours') {
					total = this.itemsNeeded();
					count = this.getItems().reduce(function(memo, req) {
						return (req.isComplete()) ? memo + 1 : memo; 
					}, 0);
					return (count >= total) ? 1 : count / total;
				} else {
					//completion type is takeHours
					console.log("Completion type of take hours not at a leaf");
					return 0;
				}
					

				
			}
		},

		/**
		 * Returns the number of leaf requirements that contain this course as a requirement.
		 * If this Requirement is a leaf requirement, this method either returns 0 or 1. This method is
		 * used in the process of determining the best way to allocate courses so that as many requirements
		 * as possible are satisfied.  The course demand does not change whether courses are added or removed
		 * to the schedule.  This method does not take into consideration any validation.  This method throws
		 * an exception, "CourseCollection not yet fetched", if courses have not been fetched before this
		 * method was called
		 * @method courseDemand
		 * @param {Course} course A backbone course
		 * @return {Number} the number of root requirements that satisfy this course
		 * @throws "CourseCollection not yet fetched"
		 */
		courseDemand: function(course) {
			if (this.isLeaf()) {
				if (!this.getCourses()) {
					throw new Error("CourseCollection not yet fetched");
				}
				return (this.contains(course)) ? 1 : 0;
			} else {
				return this.getItems().reduce(function(memo, req) {
					return memo + req.courseDemand(course);
				}, 0);
			}
		},

		/**
		 * Resets the course mappings that cache which courses have been 
		 * satsifed within this requirement.  Should not be called directly,
		 * used by the Goal to reset before adding a new collection
		 * @method reset
		 */
		reset: function() {
			var i, n;
			if (this.isLeaf() && this.getCourses()) {
				for (i = 0, n = this.courseMap.length; i < n; ++i) {
					this.courseMap[i] = false;
				}
			} else if (!this.isLeaf()) {
				this.getItems().forEach(function(req) {
					req.reset();
				});
			}
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
		 * meaning that it has no parents that are Requirement Objects.
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
		/**
		 * STUCTURAL METHOD.  Generates ID's for requirements that help
		 * identify where the Requirements are located in the Goal's tree structure
		 * @method generateRequirementID
		 * @static
		 * @param {Number} index The index the Requirement is within its parent
		 * @param {String} parentID The ID number of the parent
		 * return {String} the ID that is to be assigned to the requirement 
		 */
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

	/**
	 * An object that represents large-scale goals, such as Major and Minors,
	 * and keeps track of someone's progress towards satisfying the Goals. Methods marked 
	 * as Structural Methods should not be called outside of the class, and are considered
	 * "private"
	 * @class Goal 
	 */
	Goal = Backbone.Model.extend({

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
				//the head requirement
				this.head = new Requirement(
					{
						title: 'root',
						isRoot: true,
						items: obj.items, 
						take: 'all'
					});
				
			},
			/**
			 * Performs an asynchronous fetching of the courses that are relevant
			 * to the goal and inserts the Course Objects into the nested properties
			 * @method fetch
			 * @param {Function} callback A callback function that is invoked after the
			 * asynchronous call is executed.  The callback function is given a CourseCollection
			 * object with the fetched courses as a parameter
			 * @async
			 */
			fetch: function(callback) {
				this.head.fetch();
			},
			/**
			 * Getter for the CourseCollection Object of the goal that contains all
			 * the courses.  Courses must first be fetched from the server before the 
			 * getter can be called
			 * @method getCourses
			 * @return {CourseCollection} A course collection object containing the courses
			 * for the goal
			 * @throws Error if the courses have not first been fetched from the goal: 
			 * "Must first fetch courses from server before getCourses getter is called"
			 */
			getCourses: function() {
				if (!this.getCourses.cache) {
					this.getCourses.cache = this.head.getCourses();
				}
				return this.getCourses.cache;
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
		}),

	/**
	 * A collection of goals that make up all the goals that a person is trying to
	 * satisfy
	 * @class GoalList 
	 */
	GoalList = Backbone.Collection.extend(
		{
			model: Goal,

		},
		{
			/**
			 * A static method for getting a cached instance of the Goal list for
			 * the current session
			 * @method getInstance
			 * @static
			 * @return {GoalList} the cached GoalList instance
			 */
			getInstance: function() {

			}
		});

if (isServerSide) {
	exports.Requirement = Requirement;
	exports.Goal = Goal;
	exports.GoalList = GoalList;
}
