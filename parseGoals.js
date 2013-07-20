var util = require('vm'),
	vm = require('vm')
	fs = require('fs');


generateSandbox = (function() {
	//static helper functions
	function diff(index) {

	}

	return function() {
		return {
			diff: diff
		};
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
	var stringFunction;
	goal.items.forEach(function(item, index) {

		if (typeof item.defineSets === 'function') {
			stringFunction = removeWhitespace(item.defineSets.toString());
			if (stringFunction.substr(0, 15) === 'function(state)') {
				item.defineSets = stringFunction.substr(16, stringFunction.length - 17);
				console.log("Define sets: " + item.defineSets);
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