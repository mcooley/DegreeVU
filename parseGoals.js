var util = require('vm'),
	vm = require('vm')
	fs = require('fs'),
	_ = require('underscore')._,


	generateSandbox = function() {
		//for now...
		return {};
	};


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

//returns after finding the very first error
function findError(requirement) {
	var itemType, i, n, recursiveError = null;
	//check for errors
	if (!requirement.title) {
		return new Error("One of the items is missing a title");
	}

	if (!requirement.items) {
		return new Error("The item titled \"" + requirement.title + "\" is missing its items");
	}

	if (!requirement.take && !requirement.takeHours) {
		return new Error("The item titled \"" + requirement.title + "\" must either have takeHours or take defined");
	}

	if (requirement.take && requirement.takeHours) {
		return new Error("The item titled \"" + requirement.title + "\" cannot have both take and takeHours defined");
	}

	if (requirement.take) {
		if (typeof requirement.take === 'string' && requirement.take !== 'all') {
			return new Error("The item titled \"" + requirement.title + "\" has an invalid value for take property");
		}

		if (typeof requirement.take !== 'string' && typeof requirement.take !== 'number') {
			return new Error("The item titled \"" + requirement.title + "\" has an invalid value for take property");
		}
	}

	if (requirement.takeHours && typeof requirement.takeHours !== 'number') {
		return new Error("The item titled \"" + requirement.title + "\" has an invalid value for takeHours property");
	} 

	//check errors with items
	if (!Array.isArray(requirement.items)) {
		return new Error("The item titled \"" + requirement.title + "\" must have an items property of type array");
	}

	if (!requirement.items.length) {
		return new Error("The item titled \"" + requirement.title + "\" must have at least 1 elements in the items array");
	}
	//check that all the types of the items are consistent
	itemType = typeof requirement.items[0];
	for (i = 1, n = requirement.items.length; i < n; ++i) {
		if (itemType !== typeof requirement.items[i]) {
			return new Error("The item titled \"" + requirement.title + "\" must have all items of a consistent type (either course codes or nested items)");
		}

		if (typeof requirement.items[i] === 'number' || Array.isArray(requirement.items[i])) {
			return new Error("The item titled \"" + requirement.title + "\" must have all items either as a course code or nested item");
		}
	}

	if (itemType === 'object') {
		for (i = 0, n = requirement.items.length; i < n; ++i) {
			recursiveError = recursiveError || findError(requirement.items[i]);
			if (recursiveError) {
				return recursiveError;
			}
		}
	}

	return recursiveError;
	
}


exports.parseFile = function(file, callback) {
	var sandbox = generateSandbox();

	fs.readFile(file, function(err, data) {
		var error = err, i, n;
		if (!err) {
			try {
				vm.runInNewContext(data, sandbox);

				goal = sandbox.goal;
				//find any errors with the implementation
				for (i = 0, n = goal.requirements.length; i < n; ++i) {
					error = findError(goal.requirements[i]);
					if (error) {
						callback(error, goal);
						return;
					}
				}
				callback(error, goal);
				
			} catch(e) {
				error = e;
				callback(error, null);
			}
				
				
		} else {
			callback(error, null);
		}
			
	});
	
}