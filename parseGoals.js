var util = require('vm'),
	vm = require('vm')
	fs = require('fs'),
	_ = require('underscore')._;


generateSandbox = (function() {

	var StdValidator = {
		takeAll: 'StdValidator.takeAll',
		takeHours: function(hours) {
			return 'StdValidator.takeHours(' + hours + ')';
		},
		takeCourses: function(courses) {
			return 'StdValidator.takeCourses(' + courses + ')';
		}
	};
	//static helper functions
	function diff(itemIndex) {
		//should be called on goal
		return function() {
			return this.items[itemIndex].courses.filter(function(course) {
				return course.charAt(0) !== '!';
			}).map(function(course) {
				return '!' + course;
			});
		};
		
	}

	function add(itemIndex) {
		//should be called on goal
		return function() {
			
			return this.items[itemIndex].courses;
			
		};
	}

	return function() {
		var instance = {
			goal: {},
			//helper methods
			diff: diff,
			add: add,

			//string substitutions
			StdValidator: StdValidator,
			singleSet: 'singleSet'
		};
		return instance;
		
	};
})();

//removes whitespace from a function with the exception of whitespace 
//that exists within quotations
function removeWhitespace(text) {
	var i, n, inQuote = false, nextChar, modifiedText = "";
	for (i =0, n = text.length; i < n; ++i) {
		nextChar = text.charAt(i);
		if (!nextChar.match(/\s/)) {
			modifiedText = modifiedText + nextChar;
		} else if (inQuote) {
			modifiedText = modifiedText + nextChar;
		}
		//this code does not work with nested quotations,
		//should not need to deal with nested quotations
		//if needed to deal with more complex quotation
		//issues, should use stack
		if (nextChar.match(/['"]/)) {
			inQuote = !inQuote;
		}
	}

	return modifiedText;
}
function goalToJSON(goal, callback) {
	var stringFunction, i, n, nextItem, arrayFunctionCalled = false;;

	goal.items.forEach(function(item, index) {

		for (i = 0, n = item.courses.length; i < n; ++i) {
			if (typeof item.courses[i] === 'function') {
				item.courses[i] = item.courses[i].call(goal);
				arrayFunctionCalled = true;
			}
		}
		if (arrayFunctionCalled) {
			item.courses = _.flatten(item.courses);
		}


		if (typeof item.defineSets === 'function') {
			stringFunction = removeWhitespace(item.defineSets.toString());
			if (stringFunction.substr(0, 15) === 'function(state)') {
				item.defineSets = stringFunction.substr(16, stringFunction.length - 17);
				
			} else {
				callback(new Error("Incorrect value for defineSets field of item at index " + index), null);
			}
		}
		if (typeof item.validator === 'function') {
			stringFunction = removeWhitespace(item.validator.toString());
			if (stringFunction.substr(0,15) === 'function(state)') {
				item.validator = stringFunction.substr(16, stringFunction.length - 17);
			} else {
				callback(new Error("Incorrect value for validator field of item at index " + index), null);
			}
		}


	});
	callback(null, JSON.stringify(goal));
};
exports.parseFile = function(file, callback) {
	var sandbox = generateSandbox();

	fs.readFile(file, function(err, data) {
		vm.runInNewContext(data, sandbox);
		goalToJSON(sandbox.goal, function(err, json) {
			callback(err, json);
		});
		

	});
	
}