//eventually move validation bundle to its own file
ValidationBundle = {};

// Factory for common validators.

//StdValidator methods utilize the helper method "has"
ValidationBundle.StdValidator = {
	takeHours: function(hours) {

		return (function(schedule) {
			
			var remainingHours = hours; 
			this._courses.forEach(function(course) {
				if (schedule.has(course)) {
					remainingHours -= schedule.countHours(course);	
				}
			});
			
			return remainingHours <= 0;
		});
	},
	takeCourses: function(numOfClasses) {
		return function(schedule) {
			var remainingClasses = numOfClasses;
			this._courses.forEach(function(course) {
				if (schedule.has(course)) {
					remainingClasses--;
				}
			});
			return remainingClasses <= 0;
		};
	},
	takeAll: function(schedule) {
		//check if any courses were defined in the file
		//use courses instead of _courses because they are loaded
		//faster
		var foundAllCourses = true;
		if (this.courses.length === 0) {
			
			return true;
		}
		this._courses.forEach(function(course) {
			
			if (!schedule.has(course)) {
				foundAllCourses = false;
				return;
			}
		});
		
		return foundAllCourses;
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
		courses: ["HCA~", "INT~", "US~", "SBS~", "P~", "MUSO*", "MUSP*", "MUSC*", "MUSE*"],
		validator: "return false;"
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