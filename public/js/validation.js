
//The Requirement constructor should only ever be
//called by the Goal Object, do not call the constructor

var Goal = Backbone.Model.extend({

		//initialize with the JSON goal object
		initialize: function(obj) {

		},
		getTitle: function() {

		},
		//lazy compilation of courses
		//returns array of all courses within the goal
		getCourses: function() {

		},
		//returns array of courses that are taken
		//lazy instantiation
		getTakenCourses: function() {

		},
		//returns the number of levels to the deepest leaf of
		//the requirement structure
		getDepth: function() {

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
			//depth
			//parent object (null if no parent)
			//parent index (-1 if no parent)
		iterate: function(callback, context) {

		},

		isComplete: function() {

		},
		//returns a decimal number between 0 and 1
		//1 being totally complete
		completionProgress: function() {
			return (this.getTakenCourses().length) / (this.getCourses().length);
		}
	}),


	//collection of goals
	Validation = Backbone.Collection.extend({

		
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


