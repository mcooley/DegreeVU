//This file uses CourseCodeTokenizer, so that object should
//This file uses courseCodes to represent courses in order to 
//prevent the need for the course backbone object


//should not call the requirement constructor,
//the requirements are automatically constructed
//within the Goal object constructor
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
		addCourse: function(courseCode) {
			var i, n, index, done, takenCourses;
			if (this.isLeaf()) {
				done = false;
				index = -1;

				for (i = 0, n = this.getItems().length; i < n && !done; ++i) {
					if (CourseCodeTokenizer.matchQuery(courseCode, this.getItems()[i])) {
						index = i;
						done = true;
					}
				}

				//add the course to the courses taken
				if (index > 0) {
					//then the course was found and an event should be fired
					//EVENT HERE

					if (this.get('takenCourses')) {
						takenCourses = this.get('takenCourses');
						takenCourses.forEach(function(isTaken, _index) {
							if (index === _index) {
								isTaken = true;
							}
						});
						this.set('takenCourses', takenCourses);
					} else {
						takenCourses = new Array(this.getItems().length);
						for (i = 0, n = this.getItems().length; i < n; ++i) {
							if (i === index) {
								takenCourses[i] = true;
							} else {
								takenCourses[i] = false;
							}
						}

						this.set('takenCourses', takenCourses);
					}
				}

			} else {
				this.getItems().forEach(function(req) {
					req.addCourse(courseCode);
				});
			}
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
		getCourses: function() {

			var courses, courseList;
			if (this.isLeaf()) {
				courses = [];
				courses = courses.concat(this.getItems());
			} else {
				courseList = [];
				this.getItems().forEach(function(req) {
					courseList.push(req.getCourses());
				}); 
				courses = this.unionCourses.apply(this, courseList);
			}
			return courses;
		},
		//fetch the courses that have been taken,
		//these courses are cached at the leaves of
		//the requirement tree. The actual taken Courses
		//array is simply an array of booleans that can be mapped
		//to the array of courses
		getTakenCourses: function() {
			var courses;
			if (this.isLeaf()) {

			} else {
				courses = [];

			}
		},
		//hasCourse
		//returns true if this course is included as a course
		//for this requirement.  The course parameter is the course code
		hasCourse: function(courseCode) {
			var i, n;
			if (this.isLeaf()) {
				
				for (i = 0, n = this.getItems().length; i < n; ++i) {
					
					if (CourseCodeTokenizer.matchQuery(courseCode, this.getItems()[i])) {
						return true;
					}
				}

			} else {
				for (i = 0, n = this.getItems().length; i < n; ++i) {
					if (this.getItems()[i].hasCourse(courseCode)) {
						return true;
					}
				}
			
			}
			return false;
		},
		//what type of requirement?
		completionType: function() {
			if (this.get('takeHours')) {
				return 'takeHours';
			}

			if (this.get('take') === 'all') {
				return 'takeAll';
			} else {
				return 'takeCourses';
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
		coursesNeeded: function() {
			if (this.completionType() === 'takeHours') {
				return 0;
			}

			if (this.completionType() === 'takeAll') {
				//cache the courses needed so that you do not 
				//have to traverse the tree for the courses count
				//everytime this method is called
				if (!this.coursesNeeded.memo) {
					this.coursesNeeded.memo = this.getCourses().length;
				}
				return this.coursesNeeded.memo;
			}

			if (this.completionType() === 'takeCourses') {
				return this.get('takeCourses');
			}
		},

		//validation-progress related methods
		//these methods cache values so that the tree
		//is not traversed everytime the methods are
		//called.  When 'update' is called, these methods
		//are flagged so that the next call will reset the cache
		//value since the taken courses have changed


		update: function() {},

		//this method is called by update
		//NEVER CALL THIS
		clearValidationCache: function() {},
		isComplete: function() {},
		//the progress of the requirement to becoming
		//complete, returns a decimal number indicating 
		//the progress, progress is between 0 and 1, 1 being
		//that the requirement is complete
		progress: function() {
			if (!this.progress.memo) {


			}
			return this.progress.memo;
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

		//check if this requirement is the child or parent
		//of another requirement object
		isChildOf: function(req) {
			var parentID = req.get('reqID'),
				myID = this.get('reqID');
			if (myID.substr(0, parentID.length) === parentID) {
				return true;
			}
			return false;
		},
		isImmediateChildOf: function(req) {
			var parentID = req.get('reqID'),
				myID = this.get('reqID');
			if (myID.substr(0, myID.length - 2) === parentID) {
				return true;
			}
			return false;

		},
		isParentOf: function(req) {
			var childID = req.get('reqID'),
				myID = this.get('reqID');
			if (childID.substr(0, myID.length) === myID) {
				return true;
			}
			return false;
		},
		//a variable number of arrays are passed in
		//this returns an array of courses such that there is no
		//repetition of courses from any of the arrays (union of course list)
		unionCourses: function() {
			var i, j, m, n,
				token1, token2,
				courseList = [].slice.call(arguments),
				newList = [];

			newList = newList.concat.apply(newList, courseList);
			console.log("List");
			console.log(courseList);

			for (i = 0, n = newList.length; i < n; ++i) {
				for (j = i + 1, m = newList.length; j < m; ++j) {
					if (newList[i] && newList[j]) {
						token1 = CourseCodeTokenizer.parseQuery(newList[i]);
						token2 = CourseCodeTokenizer.parseQuery(newList[j]);
						if (_.isEqual(token1, token2)) {
							newList[i] = false;
						}
					}
				}
			}
			
			return newList.filter(function(item) {
				return item;
			});

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

			getReqs: function() {
				return this.get('requirements');
			},
			//lazy compilation of courses
			//returns array of all courses within the goal
			getCourses: function() {
				var courses;
				if (!this.get('courses')) {
					courses = [];
					this.getReqs().forEach(function(req) {
						courses = _.union(courses, req.getCourses());
					});
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
