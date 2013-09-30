//This file uses CourseCodeTokenizer, so that object should
//This file uses courseCodes to represent courses in order to 
//prevent the need for the course backbone object


//should not call the requirement constructor,
//the requirements are automatically constructed
//within the Goal object constructor
var Requirement = Backbone.Model.extend({

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
		addCourse: function(courseCode) {
			
		},
		removeCourse: function(courseCode) {
			
		},
		//getter methods

		getTitle: function() {
			return this.get('title');
		},
		
		getItems: function() {
			return this.get('items');
		},
		getStatements: function() {

			
		},
		//sets an array of backbone course objects at 
		//the leaves of the requirements
		setCourses: function(courseCollection) {
			
		},
		//returns true if the Requirement already has 
		//this course added
		containsCourse: function(courseCode) {

		},
		//returns true if the Requirement accepts this
		//course, ignoring if the course if already added or not
		acceptsCourse: function(courseCode) {

		},
		//what type of requirement?
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
		//get the hours needed for the 
		//requirement, if the completion type
		//is not takeHours, then this returns 0
		hoursNeeded: function() {
			if (this.completionType() === 'takeHours') {
				return this.get('takeHours');
			}
			return 0;
		},

		//get the number of courses needed to complete
		//this requirement, if the completion type
		//is takeHours, this returns 0
		itemsNeeded: function() {
			if (this.completionType() === 'takeHours') {
				return 0;
			}

			if (this.completionType() === 'takeAll') {
				//cache the courses needed so that you do not 
				//have to traverse the tree for the courses count
				//everytime this method is called
				if (!this.itemsNeeded.memo) {
					this.itemsNeeded.memo = this.getCourseQueries().length;
				}
				return this.itemsNeeded.memo;
			}

			if (this.completionType() === 'takeItems') {
				return this.get('take');
			}
		},

		//validation-progress related methods
		//these methods cache values so that the tree
		//is not traversed everytime the methods are
		//called.  When 'update' is called, these methods
		//are flagged so that the next call will reset the cache
		//value since the taken courses have changed


		update: function() {
			this.clearValidationCache();
		},

		//this method is called by update
		//NEVER CALL THIS
		//this is where all the cached values are removed
		//so that subsequent calls will to validation methods 
		//will refresh data
		clearValidationCache: function() {
			this.progress.memo = null;
			this.isComplete.memo = null;
		},

		isComplete: function() {
			
		},
		//the progress of the requirement to becoming
		//complete, returns a decimal number indicating 
		//the progress, progress is between 0 and 1, 1 being
		//that the requirement is complete
		progress: function() {
			
		},

		//tree-related methods

		getDepthFromRoot: function() {
			return this.get('reqID').length / 2;
		},
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
		getIndex: function() {
			var reqID = this.get('reqID');
			return parseInt(reqID.substr(reqID.length - 2, 2), 16);
		},


		isLeaf: function() {
			return this.get('isLeaf');
		},
		//the requirement is a root if it is not
		//nested within any requirement object
		isRoot: function() {
			return this.get('isRoot');
		},

		//recursively converts this object to JSON
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
			//lazy compilation of courses
			//returns array of all courses within the goal
			getStatements: function() {
				
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


