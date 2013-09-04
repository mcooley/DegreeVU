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
					obj.items[i].reqID = Requirement.generateRequirementID(i, this.get('reqID'));
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
				currentDepth = this.getDepthFromRoot();
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
				if (this.get('takenCourses')) {
					takenCourses = this.get('takenCourses');
					done = false;


					for (i = 0, n = takenCourses.length; i < n && !done; ++i) {
						if (CourseCodeTokenizer.isEqual(courseCode, takenCourses[i])) {
							done = true;
						}
					}

				} else {
					done = false;
					takenCourses = [];
					this.set('takenCourses', takenCourses, {silent: true});
				}
				
				for (i = 0, n = this.getItems().length; i < n && !done; ++i) {
					if (CourseCodeTokenizer.matchQuery(courseCode, this.getItems()[i])) {

						takenCourses.push(courseCode);
						return true;
					}
				}
				return false;

			} else {
				var isAdded = false;
				this.getItems().forEach(function(req) {
					isAdded = isAdded || req.addCourse(courseCode);
				});
				return isAdded;
			}
		},
		removeCourse: function(courseCode) {
			var i, n, takenCourses, index, done;
			if (this.isLeaf()) {
				
				if (this.get('takenCourses')) {
					index = -1;
					done = false;

					takenCourses = this.get('takenCourses');

					for (i = 0, n = takenCourses.length; i < n; ++i) {
						if (CourseCodeTokenizer.isEqual(courseCode, takenCourses[i])) {
							index = i;
						}
					}
					if (index >= 0) {
						takenCourses = takenCourses.slice(0, index).concat(takenCourses.slice(index + 1, takenCourses.length));
						this.set('takenCourses', takenCourses);
						return true;
					}
					
				} 
				return false;
				

			} else {
				var isRemoved = false;
				this.getItems().forEach(function(req) {
					isRemoved = isRemoved || req.removeCourse(courseCode);
				});
				return isRemoved;
			}
		},
		//getter methods

		getTitle: function() {
			return this.get('title');
		},
		
		getItems: function() {
			return this.get('items');
		},
		getCourseQueries: function() {

			var courses, courseList;
			if (this.isLeaf()) {
				courses = [];
				courses = courses.concat(this.getItems());
			} else {
				courseList = [];
				this.getItems().forEach(function(req) {
					courseList.push(req.getCourseQueries());
				}); 
				courses = Requirement.unionCourses.apply(Requirement, courseList);
			}
			return courses;
		},
		//sets an array of backbone course objects at 
		//the leaves of the requirements
		setCourses: function(courses) {
			var courses;

			if (this.isLeaf()) {
				console.log("In requirement: "+ this.getTitle());
				_courses = [];
				courses.forEach(function(course) {
					var i, n, done = false;
					for (i = 0, n = this.getItems().length; i < n && !done; ++i) {
						
						if (CourseCodeTokenizer.matchQuery(course.get('courseCode'), this.getItems()[i])) {
							_courses.push(course);
							done = true;
							
						}
					}
					
				}.bind(this));
				this.set('courses', _courses, {silent: true});
				_courses.forEach(function(course, index) {
					console.log(index + ": " + course.get('courseCode'));
				});
			} else {
				this.getItems().forEach(function(req) {
					req.setCourses(courses);
				});
			}
		},
		//fetch the courses that have been taken,
		//these courses are cached at the leaves of
		//the requirement tree. The actual taken Courses
		//array is simply an array of booleans that can be mapped
		//to the array of courses
		getTakenCourses: function() {
			var courseList, courses, takenCourses, i, n;
			if (this.isLeaf()) {
				//lazy instantiation of taken courses
				if (!this.get('takenCourses')) {
					//note that the takenCourses property
					//should only exist in requirements that are
					//leaves
					takenCourses = [];
					this.set('takenCourses', takenCourses, {silent: true});

				} else {
					takenCourses = this.get('takenCourses');
				}

				return takenCourses;
			} else {
				courseList = [];
				this.getItems().forEach(function(req) {
					courseList.push(req.getTakenCourses());
				});
				courses = Requirement.unionCourses.apply(Requirement, courseList);
				return courses;
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
				return this.get('takeItems');
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

		//recursively converts this object to JSON
		toJSON: function() {

		}

	},

	{//class methods for Requirement

		//a variable number of arrays are passed in
		//this returns an array of courses such that there is no
		//repetition of courses from any of the arrays (union of course list)
		unionCourses: function() {
			var i, j, m, n,
				token1, token2,
				courseList = [].slice.call(arguments),
				newList = [];

			newList = newList.concat.apply(newList, courseList);

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

		},
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
			fetch: function() {
				var courseQueries = this.getCourseQueries();
				var collection = new CourseCollection([],
				{
					url: '/courses/lookup?q=' + courseQueries.toString()
				});
				collection.fetch();
				collection.once('sync', function() {
					//set the courses in the requirements
					//the courses will trickle down to the leaves so that
					//they have a reference to all relevant courses
					console.log(collection.models);
					this.getReqs().forEach(function(req) {
						req.setCourses(collection.models);
					});
					this.trigger('sync');
				}.bind(this));
				this.set('courseCollection', collection);
			},
			//must first fetch them
			getCourses: function() {
				return this.get('courseCollection').models;
			},
			getTitle: function() {
				return this.get('title');
			},

			getReqs: function() {
				return this.get('requirements');
			},
			//lazy compilation of courses
			//returns array of all courses within the goal
			getCourseQueries: function() {
				var courses;
				if (!this.get('courseQueries')) {
					courses = [];
					this.getReqs().forEach(function(req) {
						courses = _.union(courses, req.getCourseQueries());
					});
					this.set('courseQueries', courses, {silent: true});
				}
				return this.get('courseQueries');
			},
			//returns array of courses that are taken
			//lazy instantiation
			getTakenCourses: function() {
				//for now, nothing is cached
				var courseList;
				
				courseList = [];
				this.getReqs().forEach(function(req) {
					courseList.push(req.getTakenCourses());
				});
				this.set('takenCourses', Requirement.unionCourses.apply(Requirement, courseList));
			
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
			addCourse: function(courseCode) {
				var isAdded = false;
				this.getReqs().forEach(function(req) {
					isAdded = isAdded || req.addCourse(courseCode);
				});
				return isAdded;
			},

			//removes course from the list of courses taken only if:
				//1) the course is in the list of taken courses
				//2) the course is is within the list of courses for the goal
			//emits 'courseRemoved' event if a course is successfully removed
			removeCourse: function(courseCode) {
				var isRemoved = false;
				this.getReqs().forEach(function(req) {
					isRemoved = isRemoved || req.removeCourse(courseCode);
				});
				return isRemoved;
			},

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
				return (this.getTakenCourses().length) / (this.getCourseQueries().length);
			},

			//generates an object that can be passed to the server
			//in order to search for suggested courses based on the
			// current goal the person is looking at...
			courseDiagnostic: function() {
				//this object can include:
					//courses that this person has already taken
						//in this major
					//maybe global variables such as the school this person is in
					//the major...
				return null;
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


