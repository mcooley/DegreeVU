


//should not  call the requirement constructor
var Requirement = Backbone.Model.extend({

		initialize: function(obj) {
			
			var items, i, n;
			if (typeof obj.items[0] === 'object') {
				items = [];
				for (i = 0, n = obj.items.length; i < n; ++i) {
					obj.items[i].reqID = generateRequirementID(i, this.get('reqID'));
					items[i] = new Requirement(obj.items[i]);
				}
				//no events called
				this.set('items', items, {silent: true});
				this.set('isLeaf', false, {silent: true});
				
			} else {
				//typeof items are strings
				this.set('isLeaf', true, {silent: true});
			}
			
		},

		iterate: function(callback, context) {
			var self,
				reqID,
				currentIndex, 
				currentDepth;
			if (!this.isLeaf()) {

				if (!context) {
					context = this;
				}
				//can use the id property to infer the
				//current depth
				reqID = this.get('reqID');
				currentDepth = this.getDepth();
				currentIndex = this.getIndex();
				self = this;

				this.get('items').forEach(function(requirement, index) {
					callback.call(context, requirement, index, currentDepth + 1, self, currentIndex);
					requirement.iterate(callback, context);
				});
			}
		},
		getTitle: function() {
			return this.get('title');
		},
		update: function() {},
		isComplete: function() {},

		getCourses: function() {},
		getDepth: function() {
			return this.get('reqID').length / 2;
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

		//check if this requirement is the child or parent
		//of another requirement object
		isChild: function(requirement) {

		},
		isImmediateChild: function(requirement) {

		},
		isParent: function(requirement) {

		}

	}),

	Goal = Backbone.Model.extend({

			//initialize with the JSON goal object
			initialize: function(obj) {
				//reset the requirements object to become
				//nested backbone objects
				var requirements = [],
					i, n;

				for (i = 0, n = obj.requirements.length; i < n; ++i) {
					obj.requirements[i].isRoot = true;
					
					obj.requirements[i].reqID = generateRequirementID(i);
					//no parent id at the root
					requirements[i] = new Requirement(obj.requirements[i]);
					//requirements[i] = new Requirement(obj.requirements[i]);
				}
				//no events called
				this.set('requirements', requirements, {silent: true});
			},
			getTitle: function() {
				return this.get('title');
			},
			//lazy compilation of courses
			//returns array of all courses within the goal
			getCourses: function() {
				var courses = [];
				if (!this.get('courses')) {
					console.log("Iterating");
					this.iterate(function(req) {
						if (typeof req.items[0] === 'string') {
							//come up with union that checks for the same
							//course code instead of the same string
							courses = _.union(courses, req.items);
						}
					});
					//set without calling an event
					this.set('courses', courses, {silent: true});
				}
				return this.get('courses');
			},
			//returns array of courses that are taken
			//lazy instantiation
			getTakenCourses: function() {
				if (!this.get('takenCourses')) {
					//set the course without calling an event
					this.set('takenCourses', [], {silent: true});
				}
				return this.get('takenCourses');
			},
			//returns the number of levels to the deepest leaf of
			//the requirement structure
			getDepth: function() {
				if (!this.getDepth.memo) {

				}
				return this.getDepth.memo;
			},

			//adds course to the list of courses taken only if:
				//1) the course is not already added
				//2) the course is within the list of courses for this goal
			//emits 'courseAdded' event if a course is successfully added
			addCourse: function(course) {},

			//removes course from the list of courses taken only if:
				//1) the course is in the list of taken courses
				//2) the course is is within the list of courses for the goal
			//emits 'courseRemoved' event if a course is successfully removed
			removeCourse: function(course) {},

			//iterates through the goal object's requirements
			//at all levels, in a DFS-like manner. The callback parameter:
				//requirement object
				//index within the parent
				//depth (number of levels, 1-based)
				//parent object (null if no parent)
				//parent index (-1 if no parent)
			iterate: function(callback, context) {
				if (!context) {
					context = this;
				}
				this.get('requirements').forEach(function(requirement, index) {
					callback.call(context, requirement, index, 1, null -1);
					requirement.iterate(callback, context);
				});
			},

			update: function() {},
			isComplete: function() {

			},
			//returns a decimal number between 0 and 1
			//1 being totally complete
			completionProgress: function() {
				//for now, this is the implementation
				return (this.getTakenCourses().length) / (this.getCourses().length);
			}
		}),

	//collection of goals
	Validator = Backbone.Collection.extend({

		
		//adds course to all goals in the collection
		addCourse: function(course) {

		},
		//removes course from all goals in the collection
		removeCourse: function(course) {

		},
		//removes all courses from all goals
		reset: function() {

		},
		//iterates through all the goals and the nested
		//requirement in a DFS-like fashion,
		//argument for the callback:
			//requirement object
			//index within the parent
			//depth
			//parent object (null if no parent)
			//parent index (-1 if no parent)
		iterate: function(callback, context) {

		}
		//events emitted by Validation:
			/*
				courseAdded:
					event contains: "courseID" property (mongo id of course added), 
									"goals" property (array of mongo id's of goals the course was added to)
				courseRemoved:
					event contains: "courseID" property (mongo id of course removed)
									"goals" property (array of mongo id's of goals the course was removed from)

			*/
	}, 
	{

		//class properties
		getInstance: function() {
			if (!Validation.instance) {
				Validation.instance = new Validation();
			}
			return Validation.instance;
		}
	});



//used to generate client-side id's for Requirement objects
//nested inside the Goal Backbone object so that requirements can be
//identified.  parentID is string or null.  This method is called by the
//backbone objects below and not part of any API
function generateRequirementID(index, parentID) {
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
