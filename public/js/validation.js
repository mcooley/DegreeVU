//eventually move validation bundle to its own file
ValidationBundle = {};

// Factory for common validators.

//StdValidator methods utilize the helper method "has"
ValidationBundle.StdValidator = {
	takeHours: function(hours) {
		
		return (function(state) {
			
			state.hoursForSet(0).is(hours).mandate();


		});
	},
	takeCourses: function(numOfClasses) {
		//var state = new ValidationBundle.ValidationHelper();
		return function(state) {
			
			state.coursesForSet(0).is(numOfClasses).mandate();
			
		};
	},
	takeAll: function(state) {

		state.completeSet(0).mandate(0);

	}
};

ValidationBundle.FallbackMessaging = {
	onSuccess: {
		Default: "You have completed all the requirements for this item",
		StarWars: "You are learning well, young jedi!",
		Pirates: "Well done, me matey!",
		Surfer: "Rock on duuude!"
	},
	onFailure: {
		Default: "You have not completed all the requirements for this item",
		StarWars: "Completed your requirements, you have not",
		Pirates: "You must take ye classes, or walk the plank!",
		Surfer: "You need to take more broo!"
	}
	
}

ValidationBundle.StdItem = {

	EngModules: {
		title: 'Engineering Modules (3 hours)',
		description: 'You must complete all the engineering modules',
		details: 'Some more elaboration here',
		courses: ['ES 140A', 'ES 140B', 'ES 140C'],
		validator: "StdValidator.takeAll"
	},
	LiberalArtsCore: {
		//needs a lot of work
		title: 'Liberal Arts Core (18 hours)',
		description: 'Liberal arts core for engineering',
		details: 'More elaborate description here',
		courses: ["HCA~", "ENGL 100", "INT~", "ARA 210A", "CHIN 201", "FREN 101A", "GER 101", "GRK 201", "HEBR 111A", "JAPN 200A", "JAPN 200B", "JAPN 201", "LAT 101", "PORT 100A", "RUSS 101", "SPAN 100", "SPAN 101", "US~", "SBS~", "ENGM 244", "P~", "CS 151", "MUSO*", "MUSP*", "MUSC*", "MUSE*"],
		validator: function(schedule) {
			var req1 = schedule.countHours('HCA~', 'ENGL 100');
			    req2 = schedule.countHours('INT~', "ARA 210A", "CHIN 201", "FREN 101A", "GER 101", "GRK 201", "HEBR 111A", "JAPN 200A", "JAPN 200B", "JAPN 201", "LAT 101", "PORT 100A", "RUSS 101", "SPAN 100", "SPAN 101"),
			    req3 = schedule.countHours('US~'),
			    req4 = schedule.countHours('P~', 'CS 151'),
			    req5 = schedule.countHours('MUSE*', 'MUSO*', 'MUSP*', 'MUSC*'),
			    //issue with requirement 6 that needs to be addressed before coding this up
			    req6;

			return this.complete(4, req1 >=3, req2 >= 3, req3 >= 3, req4 >= 3, req5 >= 3, req6 >= 3) && this.complete(1, req1 >= 6, req2 >=6, req3 >= 6, req4 >= 6, req5 >= 6, req6 >= 6);
		}
	}
	
};

ValidationBundle.isValidSchool = (function() {
	var regexp = /^(engineering)|(peabody)|(as)|(blair)$/i;

	return function(school) {
		return regexp.test(school);
	};

})();

//is this the best idea?
//could get this data from a query and load it into this
ValidationBundle.SchoolMapping = {
	ENGINEERING: ['BME', 'CE', 'CS', 'ME'],
	AS: ['BSCI', 'CHEM', 'MATH', 'NSC'],
	PEABODY: ['HOD'],
	BLAIR: ['MUSO']
}

ValidationBundle.DefineSingleSet = function(state) {
	console.log("DefineSingleSet called");
	state.pushSet.apply(state, this.courses);
};

ValidationBundle.ValidationHelper = (function() {

	var _constructor;


	_constructor = function(schedule) {
		var sets = [],
		    numToComplete = 0,

		    //heirarchy object to be read and parsed
		    //by methods depending on their place in the hierarchy

		    _level1 = {
		    	//current set that the object is referring to
		    	set: 0,
		    	//hours or courses
		    	type: 'hours',
		    	//the total count of hours/courses
		    	//that exist in the schedule
		    	total: 0,
		    	//the total count of hours/courses that exist
		    	//in the schedule minus all the courses marked
		    	//as exclusive (for now, this value is the same
		    	//as the total)
		    	exclusiveTotal: 0
		    };

		//set-defining functions

		//pass in variable number of queries
		this.pushSet = function() {
			var _set = [].slice.call(arguments);
			//add properties cached on the set
			_set.isComplete = false;
			_set.isMandatory = false;
			sets.push(_set);
			return this;
		};

		//level 1 functions

		//pass in the set number
		this.hoursForSet = function(setIndex) {
			_level1.set = setIndex;
			_level1.type = 'hours';
			_level1.total = schedule.countHours.apply(schedule, sets[setIndex])
			_level1.exclusiveTotal = _level1.total;
				
			return this;
		};

		this.coursesForSet = function(setIndex) {
			_level1 = {
				set: setIndex,
				type: 'hours',
				total: schedule.countCourses.apply(schedule, sets[setIndex])
			};
			return this;
		};

		//completeSet does not take
		//a level 2 compliment, this is
		//considered a combination of level
		//1 and level 2
		this.completeSet = function(index) {
			var i, n, allCourses;
			if (index === undefined) {
				//register all sets to complete
				for(i = 0, n = sets.length; i < n; ++i) {
					allCourses = sets[i].length;
					this.coursesForSet(i).is(allCourses);

				}
			} else {
				allCourses = sets[index].length;
				this.coursesForSet(index).is(allCourses);
			}
			
			return this;
		};

		//level 2 functions 
		//pass in the number of courses or the
		//number of hours
		this.is = function(count) {
			
			if (_level1.total >= count) {
				sets[_level1.set].isComplete = true;
			} else {
				sets[_level1.set].isComplete = false;
			}
			return this;
		};

		//takes a variable number of course codes
		this.has = function() {
			sets[_level1.set].isComplete = schedule.has.apply(schedule, [].slice.call(arguments));
			return this;
		};

		//same as is and has functions
		//but does leaves isComplete
		//true if it is already true
		this.orIs = function() {

			if (_level1.total >= count) {
				sets[_level1.set].isComplete = true;
			}

			return this;
		};

		this.orHas = function() {
			sets[_level1.set].isComplete = sets[_level1.set].isComplete || schedule.has.apply(schedule, [].slice.call(arguments));
			return this;
		};

		//pass in the number of sets that need to be completed
		this.complete = function(count) {
			numToComplete = count;
			return this;
		};
		//pass in a variable number of arguments representing the 
		//sets that are mandatory
		this.mandate = function() {
			var i, n;
			if (arguments.length) {
				for (i = 0, n = arguments.length; i < n; ++i) {
					sets[arguments[i]].isMandatory = true;
				}
			} else {
				//mandate the set in the current state
				sets[_level1.set].isMandatory = true;
			}
			
			
			return this;
		};

		this.mandateAll = function() {
			sets.forEach(function(set) {
				set.isMandatory = true;
			});
			return this;
		};

		//getting feedback of state,
		//method that can be called by other objects
		//to determine if the set is
		//completely validatated
		this.isComplete = function() {
			var mandateComplete = true,
				count = sets.reduce(function(count, set) {
					
					if (set.isComplete) {
						count++;
					} else if (set.isMandatory) {

						mandateComplete = false;
					}
					return count;
				}, 0);
			
			return mandateComplete && count >= numToComplete;
		};
	};

	return _constructor;
})();




