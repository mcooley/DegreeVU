var tokenizer = require('../tokenizer.addon'),
	Query = tokenizer.Query,
	QueryCollection = tokenizer.QueryCollection;


describe("Query", function() {
	it("should succeed too", function() {
		expect(false).toBeFalsy();
	});

	it("should succeed", function() {
		expect(typeof Query).toBe('function');
	});
});