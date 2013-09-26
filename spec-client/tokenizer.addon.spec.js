describe("Tokenizer Addon:", function() {
	describe("Statement Helper", function() {
		var mongoQuery;
		beforeEach(function() {
			mongoQuery = {
				$or: 
				[
					{coursePrefix: "CS"},
					{courseNumber: {$in: [101, 201]}}
				]
			};
		});

		it("should return a correct regexp for a single course query", function() {
			var query1 = new Query("cs 101"),
				query2 = new Query("Cs 101a"),
				regexp1 = StatementHelper.queryToRegExp(query1),
				regexp2 = StatementHelper.queryToRegExp(query2);

			expect(regexp1.test("cs   101")).toBeTruthy();
			expect(regexp1.test("Cs     101a")).toBeFalsy();
			expect(regexp2.test("cS  101A")).toBeTruthy();
			expect(regexp2.test("cs 101")).toBeFalsy();
		});

		it("should return null when attempting to get the regexp of a query not for a single course", function() {
			var query = new Query("Cs 101+"),
				multiQuery = new Query("cs 100+ & !cs 101");
			expect(StatementHelper.queryToRegExp(query)).toBeNull();
			expect(StatementHelper.queryToRegExp(multiQuery)).toBeNull();
		});

		it("should create successful copies of primitives", function() {
			expect(StatementHelper.copyMongoQuery("hello")).toEqual("hello");
		});
		it("should create copies of mongo queries", function() {
			expect(StatementHelper.copyMongoQuery(mongoQuery)).toEqual(mongoQuery);
		});
		it("should create copies of mongo queries that are deep", function() {
			var copy = StatementHelper.copyMongoQuery(mongoQuery);
			copy.prop = "This is a new property";
			expect(copy).not.toEqual(mongoQuery);
		});

	});
		
});