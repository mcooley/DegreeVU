define(['backbone'], function(Backbone) {

var Requirement = Backbone.Model.extend({

/**
 * Constructor that is called when a Requirement
 * is initialized.
 * @constructor
 * @param {obj} obj A raw JSON object that is the requirement in declarive form
 */
parse: function(obj) {
	//TODO: fix this--needs to return the attributes to be set
	var items, i, n, nextItem;
	if (typeof obj.items[0] === 'object') {
		//then the item is a nested Requirement

		items = [];

		
		for (i = 0, n = obj.items.length; i < n; ++i) {
			nextItem = obj.items[i];
			nextItem.reqID = Requirement.generateRequirementID(i, this.get('reqID'));
			nextItem.isRoot = false;
			nextItem.goalID = this.get('goalID');
			//set the flags on the next item
			//inheritted unless explicilty set
			//console.log(JSON.stringify(obj));

			nextItem.lock = (typeof nextItem.lock === 'boolean') ? nextItem.lock : this.get('lock');
			nextItem.ignoreLock = (typeof nextItem.ignoreLock === 'boolean') ? nextItem.ignoreLock : this.get('ignoreLock') ;

			items[i] = new Requirement(nextItem);
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
	//flags, easy access
	this.lock = this.get('lock');
	this.ignoreLock = this.get('ignoreLock');
	this.mandate = this.get('mandate');
	this.maxHours = this.get('maxHours');
	
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
 * Getter for the Requirement's subtitle
 * @method getSubtitle
 * @return {String} The subtitles for the Requirement
 */
getSubtitle: function() {
	return this.get('subtitle');
},

/**
 * Getter for the details
 * @method getDetails
 * @return {String} The details for the Requirement
 */
getDetails: function() {
	return this.get('details');
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
 */
contains: function(course) {
	var i,n;
	if (this.isLeaf()) {
		return this.getItems().matchCourse(course);
		
	} else {
		return this.getItems().reduce(function(memo, req) {
			return memo || req.contains(course);
		}, false);
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
 * method if adding courses. This method is meant to be called on leaf Requirements,
 * but if it is called on higher-level requirements, it will add the course to all
 * sub-requirements
 * @param {Course} course A backbone course being added to this requirement
 * @return {Boolean} true if the course was successfully added, false otherwise
 */
addCourse: function(course) {
	var shouldAddCourse;
	if (this.isLeaf()) {
		if (this.getItems().matchCourse(course)) {
			shouldAddCourse = !this.lock || this.ignoreLock || !course.isLocked(this.goalID());
			if (shouldAddCourse) {
				//lazy instantiation of course collection
				if (!this.courses) {
					console.log("Added course " + course.get('courseCode') + " to " + this.getTitle());
					this.courses = new CourseCollection([course], {});
					
				} else if (!this.courses.contains(course)) {
					console.log("Added course " + course.get('courseCode') + " to " + this.getTitle());
					this.courses.add(course);
					
				}

				if (this.lock) {
					console.log("Locking course " + course.get('courseCode'));
					course.addLock(this.goalID());
				}
				return true;
			}	
		}
		return false;
	} else {
		return this.getItems().reduce(function(memo, req) {
		
			return req.addCourse(course) || memo;
		}, false);
	}
},

/**
 * Getter for the Statement Collection of the Requirement.  If this 
 * is not a leaf requirement, this unions the StatementCollections of the
 * the leaves 
 * @method statementCollection
 * @return {StatementCollection} A StatementCollection object of all the 
 * courses within the Requirement
 */
statementCollection: function() {
	var i, n, collection;
	if (this.isLeaf()) {
		return this.getItems();
	} else {
		collection = new StatementCollection([]);
		for (i = 0, n = this.getItems().length; i< n; ++i) {
			collection.union(this.getItems()[i].statementCollection());
		}
		return collection;
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
 * on the implementation of 'contains' and 'courseDemand'.
 * @method addCollection
 * @event reset
 * @param {CourseCollection} courseCollection A backbone CourseCollection Object.  This
 * method makes changes to courseCollection by removing courses as they are claimed
 * by requirements
 */
addCollection: function(courseCollection) {
	var i, n;
	if (this.isLeaf()) {
		courseCollection.each(function(course) {
			this.addCourse(course);
		}, this);
	} else {
		this.getItems().forEach(function(req) {
			req.addCollection(courseCollection);
		});
	}
	this.trigger('reset');
},

/**
 * The number of hours needed to complete the requirement.
 * If the Requirement has a completion type other than 'takeHours'.
 * This number is the total number of hours needed for completion, despite
 * any courses that have been added previously, then this returns 0
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
 * Calculates the hours taken for a requirement. If the requirement
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
		if (!this.courses) {
			return 0;
		}
		hours = this.courses.reduce(function(memo, course) {
			return memo + course.getHours();
		}, 0);
		return (this.get('maxHours') && this.get('maxHours') < hours) ? this.get('maxHours') : hours;
	} else {
		hours = this.getItems().reduce(function(memo, req) {
			return memo + req.hoursTaken();
		}, 0);
		return (this.get('maxHours') && this.get('maxHours') < hours) ? this.get('maxHours') : hours;
	}
},

/**
 * Calculates the number of items taken.  If this is not a leaf requirement, 
 * this will return the number of sub-requirements
 * that are complete
 * @method itemsTaken
 * @return {Number} the number of items that are satisfied within the Requirement
 */
itemsTaken: function() {
	if (this.isLeaf()) {
		return (this.courses) ? this.courses.length : 0;
	} else {
		return this.getItems().reduce(function(memo, req) {
			return (req.isComplete()) ? memo + 1 : memo;
		}, 0)
	}
},

/**
 * Indicates if the requirement has been satisfied.
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
 * courses.
 * @method progress
 * @return {Number} A decimal number between 0 and 1 (inclusive) to indicate
 * the progress towards completion of the Requirement 
 */
progress: function() {

	//DONT FORGET TO ADD A CHECK FOR THE MANDATE FLAG
	var taken, needed, completionArray, i, n;
	
	if (this.completionType() !== 'takeHours') {
		//either takeAll or takeItems
		taken = this.itemsTaken();
		needed = this.itemsNeeded();
	} else {
		taken = this.hoursTaken();
		needed = this.hoursNeeded();
	}
	return (taken > needed) ? 1 : taken / needed;

},

/**
 * Returns the number of leaf requirements that contain this course as a requirement.
 * If this Requirement is a leaf requirement, this method either returns 0 or 1. This method is
 * used in the process of determining the best way to allocate courses so that as many requirements
 * as possible are satisfied.  The course demand does not change whether courses are added or removed
 * to the schedule.  This method does not take into consideration any validation.
 * @method courseDemand
 * @param {Course} course A backbone course
 * @return {Number} the number of root requirements that satisfy this course
 */
courseDemand: function(course) {
	if (this.isLeaf()) {
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
	if (this.isLeaf()) {
		this.courses = null;

	} else {
		this.getItems().forEach(function(req) {
			req.reset();
		});
	}
},

/**
 * STURCTURAL METHOD.The ID of the parent goal to 
 * this Requirement
 * @method goalID
 * @return {String} The id of the parent goal
 */
goalID: function() {
	return this.get('goalID');
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
});


return Requirement;

});