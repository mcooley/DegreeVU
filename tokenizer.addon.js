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
//to regexp
StatementHelper.queryToRegExp = function(query) {
	if (query.isSingleCourse()) {
		//do something, otherwise don't
	} 
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