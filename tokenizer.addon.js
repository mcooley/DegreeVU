//add ons to tokenizer for server-side querying
//include require statement here
var StatementHelper = {};
StatementHelper.addTokenToQuery = function(token, mongoQuery) {

};

//the number of copies held in the query
StatementHelper.queryLength = function(mongoQuery) {

};

//makes a deep copy of the query
StatementHelper.copyQuery = function(mongoQuery) {

};

//takes a query for a single course code and converts it 
//to regexp, this method only converts single courses to regexp
StatementHelper.queryToRegExp = function(query) {
	var course;
	if (query.isSingleCourse()) {
		course = "^\\s*" + query.array[0].coursePrefix + "\\s*" + query.array[0].courseNumber.toString();
		course += (query.array[0].courseSuffix) ? query.array[0].courseSuffix  + "\\s*" : "\\s*$";
		return new RegExp(course, "i");
	} 
	return null;
};

//diagnoses the query and determines the number of copies
//at the root it will need based on the complexity of the query
StatementHelper.copiesNeeded = function(statementArr) {

};
//generates a mongo query from this query


Query.prototype.mongoQuery = function() {
	
};

QueryCollection.prototype.mongoQuery = function() {

};