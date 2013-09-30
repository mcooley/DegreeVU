
var tokenizer = require('../tokenizer.addon'),
	_ = require('underscore'),


	CourseCodeTokenizer = tokenizer.CourseCodeTokenizer,
	Statement = tokenizer.Statement,
	StatementCollection = tokenizer.StatementCollection,
	StatementHelper = tokenizer.StatementHelper;


describe("Tokenizer Testing Suite:", function() {

	beforeEach(function() {
		this.addMatchers({
			toThrowAnything: function() {
				var errorThrown = false,
					not, name;
				if (typeof this.actual !== 'function') {
					throw new Error("Actual must be a function");
				}

				try{
					this.actual();
				} catch(e) {
					errorThrown = true;
				}

				if (this.isNot) {
					not = " not ";
				} else {
					not = " ";
				}

				if (this.actual.name) {
					name = this.actual.name;
				} else {
					name = "function"
				}
				this.message = function() {
					return "Expected " + name + not + "to throw error";
				}

				return errorThrown;

			}
		});
	});
	describe("Course Code Tokenizer", function() {

		it("should parse a correct course code object from a course code string", function() {
			expect(CourseCodeTokenizer.parse("CS 101")).toEqual({coursePrefix: "CS", courseNumber: 101, not: false});
			expect(CourseCodeTokenizer.parse("BSCI 110a")).toEqual({coursePrefix: "BSCI", courseSuffix: "A", courseNumber: 110, not: false});
			expect(CourseCodeTokenizer.parse("math 155A")).toEqual({coursePrefix: "MATH", courseSuffix: "A", courseNumber: 155, not: false});
			expect(CourseCodeTokenizer.parse("MhS 115f")).toEqual({coursePrefix: "MHS", courseSuffix: "F", courseNumber: 115, not: false});
		});

		it("should parse a correct course code object from an anti course code string", function() {
			expect(CourseCodeTokenizer.parse("!CS 101")).toEqual({coursePrefix: "CS", courseNumber: 101, not: true});
			expect(CourseCodeTokenizer.parse("!BSCI110a")).toEqual({coursePrefix: "BSCI", courseSuffix: "A", courseNumber: 110, not: true});
			expect(CourseCodeTokenizer.parse("!math 155A")).toEqual({coursePrefix: "MATH", courseSuffix: "A", courseNumber: 155, not: true});
			expect(CourseCodeTokenizer.parse("!MhS 115f")).toEqual({coursePrefix: "MHS", courseSuffix: "F", courseNumber: 115, not: true});
		
		});

		//all query
		it("should parse a correct * (all) query", function() {
			expect(CourseCodeTokenizer.parse("CS*")).toEqual({coursePrefix: "CS", query: "*", not: false});
			expect(CourseCodeTokenizer.parse("MATH*")).toEqual({coursePrefix: "MATH", query: "*", not: false});
		});

		it("should parse a correct * (all) anti query", function() {
			expect(CourseCodeTokenizer.parse("!CS*")).toEqual({coursePrefix: "CS", query: "*", not: true});
			expect(CourseCodeTokenizer.parse("!MATH*")).toEqual({coursePrefix: "MATH", query: "*", not: true});
		
		});
		//above query
		it("should generate a correct + (above) query", function() {
			expect(CourseCodeTokenizer.parse("CS200+")).toEqual({coursePrefix: "CS", query: "+", courseNumber: 200, not: false});
			expect(CourseCodeTokenizer.parse("MATH151+")).toEqual({coursePrefix: "MATH", query: "+", courseNumber: 151, not: false});
			expect(CourseCodeTokenizer.parse("NSC+")).toEqual({coursePrefix: "NSC", query: "+", courseNumber: 0, not: false})
		});

		it("should parse a correct + (above) anti-query", function() {
			expect(CourseCodeTokenizer.parse("!CS200+")).toEqual({coursePrefix: "CS", query: "+", courseNumber: 200, not: true});
			expect(CourseCodeTokenizer.parse("!MATH151+")).toEqual({coursePrefix: "MATH", query: "+", courseNumber: 151, not: true});
			expect(CourseCodeTokenizer.parse("!NSC+")).toEqual({coursePrefix: "NSC", query: "+", courseNumber: 0, not: true})
		
		});

		//category
		it("should parse a correct ~ (category) query", function() {
			expect(CourseCodeTokenizer.parse("P~")).toEqual({query: "~", category: "P", not: false});
			expect(CourseCodeTokenizer.parse("MNS~")).toEqual({query: "~", category: "MNS", not: false});
		});

		it("should parse a correct ~ (category) anti-query", function() {
			expect(CourseCodeTokenizer.parse("!P~")).toEqual({query: "~", category: "P", not: true});
			expect(CourseCodeTokenizer.parse("!MNS~")).toEqual({query: "~", category: "MNS", not: true});
		});
		//school
		it("should parse a correct ^ (school) query", function() {
			expect(CourseCodeTokenizer.parse("SE^")).toEqual({query: "^", school: "SE", not: false});
			expect(CourseCodeTokenizer.parse("PB^")).toEqual({query: "^", school: "PB", not: false});
			expect(CourseCodeTokenizer.parse("AS^")).toEqual({query: "^", school: "AS", not: false});
			expect(CourseCodeTokenizer.parse("BL^")).toEqual({query: "^", school: "BL", not: false});
		
		});
		it("should parse a correct ^ (school) anti-query", function() {
			expect(CourseCodeTokenizer.parse("!SE^")).toEqual({query: "^", school: "SE", not: true});
			expect(CourseCodeTokenizer.parse("!PB^")).toEqual({query: "^", school: "PB", not: true});
			expect(CourseCodeTokenizer.parse("!AS^")).toEqual({query: "^", school: "AS", not: true});
			expect(CourseCodeTokenizer.parse("!BL^")).toEqual({query: "^", school: "BL", not: true});
		
		});
		it("should throw an error if an invalid school token is parsed", function() {
			function testFunct(token) {
				return function() {
					CourseCodeTokenizer.parse(token);
				}
			}

			expect(testFunct("BR^")).toThrow(new Error("invalid school token BR"));
			expect(testFunct("AL^")).toThrow(new Error("invalid school token AL"));
		});
		//suffix
		it("should parse a correct $ (suffix) query", function() {
			expect(CourseCodeTokenizer.parse("a$")).toEqual({query: "$", courseSuffix: "A", not: false});
			expect(CourseCodeTokenizer.parse("w$")).toEqual({query: "$", courseSuffix: "W", not: false});
			expect(CourseCodeTokenizer.parse("B$")).toEqual({query: "$", courseSuffix: "B", not: false});
		});
		it("should parse a correct $ (suffix) anti-query", function() {
			expect(CourseCodeTokenizer.parse("!a$")).toEqual({query: "$", courseSuffix: "A", not: true});
			expect(CourseCodeTokenizer.parse("!w$")).toEqual({query: "$", courseSuffix: "W", not: true});
			expect(CourseCodeTokenizer.parse("!B$")).toEqual({query: "$", courseSuffix: "B", not: true});
		});


		it("should recognize when two course code tokens are the same", function() {
			expect(CourseCodeTokenizer.isEqual("cs 101", "CS101")).toBeTruthy();
			expect(CourseCodeTokenizer.isEqual("bscI 110A", "BScI110a")).toBeTruthy();
		});
		it("should recognize when two course code tokens are different", function() {
			expect(CourseCodeTokenizer.isEqual("cs 101", "CS101a")).toBeFalsy();
			expect(CourseCodeTokenizer.isEqual("bsci110a", "bsci110b")).toBeFalsy();
		});

		it("should recogize when a course code has itself", function() {
			expect(CourseCodeTokenizer.matchQuery("cs 101", "CS 101")).toBeTruthy();
		});
		it("should recognize when a course code does not match another course code", function() {
			expect(CourseCodeTokenizer.matchQuery("cs 101", "CS 101a")).toBeFalsy();
		});
		it("should recognize when a course code code has an anti course code", function() {
			expect(CourseCodeTokenizer.matchQuery("cs 101", "!cs 101a")).toBeTruthy();
			expect(CourseCodeTokenizer.matchQuery("cs 101", "!cs 101")).toBeFalsy();
		});
		it("should recognize when a course code belongs to a + (above) query", function() {
			expect(CourseCodeTokenizer.matchQuery("nsc 260", "nsc 200+")).toBeTruthy();
			expect(CourseCodeTokenizer.matchQuery("cs 201", "cs 201+")).toBeTruthy();
		});
		it("should recognize when a course code does not belong to a + (above) query", function() {
			expect(CourseCodeTokenizer.matchQuery("nsc 130", "nsc 200+")).toBeFalsy();
			expect(CourseCodeTokenizer.matchQuery("cs 251", "nsc 200+")).toBeFalsy();
		});
		it("should recognize when a course code belongs to a + (above) anti query", function() {
			expect(CourseCodeTokenizer.matchQuery("nsc 100", "!nsc 200+")).toBeTruthy();
			expect(CourseCodeTokenizer.matchQuery("bsci 250", "!nsci 200+")).toBeTruthy();
		});

		it("should recognize when a course code belongs to a * (all) query", function() {
			expect(CourseCodeTokenizer.matchQuery("nsc 101", "NSC*")).toBeTruthy();
		});
		it("should recognize when a course code does not belong to a * (all) query", function() {
			expect(CourseCodeTokenizer.matchQuery("cs 103", "nsc*")).toBeFalsy();
		});
		it("should recognize when a course code belongs to a * (all) anti query", function() {
			expect(CourseCodeTokenizer.matchQuery("cs 101", "!Nsc*")).toBeTruthy();
			expect(CourseCodeTokenizer.matchQuery("bsci 110", "!bsci*")).toBeFalsy();
		});

		it("should recognize when a course belongs to a $ (suffix) query", function() {
			expect(CourseCodeTokenizer.matchQuery("bsci 110A", "a$")).toBeTruthy();
		});
		it("should recognize when a course does not belong to a $ (suffix) query", function() {
			expect(CourseCodeTokenizer.matchQuery("bsci 100a", "w$")).toBeFalsy();
		});
		it("should recognize when a course code belongs to a $ (suffix) anti query", function() {
			expect(CourseCodeTokenizer.matchQuery("Bsci 110a", "!w$")).toBeTruthy();
			expect(CourseCodeTokenizer.matchQuery("cs 101", "!a$")).toBeTruthy();
			expect(CourseCodeTokenizer.matchQuery("bsci 110a", "!a$")).toBeFalsy();
		});

		it("should throw an exception if trying to match a course code to a school query", function() {
			function testFunct(course, query) {
				return function() {
					CourseCodeTokenizer.matchQuery(course, query);
				}
			}

			expect(testFunct("cs 101", "SE^")).toThrow(new Error("cannot match a statement to the school (^) token"));
			expect(testFunct("cs 101", "!SE^")).toThrow(new Error("cannot match a statement to the school (^) token"));
		
		});

		it("should throw an exception if trying to match a course code to a category (~) query", function() {
			function testFunct(course, query) {
				return function() {
					CourseCodeTokenizer.matchQuery(course, query);
				}
			}
			expect(testFunct("cs 101", "mns~")).toThrow("cannot match a statement with the category (~) token");
			expect(testFunct("cs 101", "!p~")).toThrow("cannot match a statement with the category (~) token");
		});

		it("should create correct copies of query objects", function() {
			var token = CourseCodeTokenizer.parse('CS 101'),
				copy = CourseCodeTokenizer.copyToken(token);
			expect(token).toEqual(copy);
			
		});

		it("should create deep copies of query objects", function() {
			var token = CourseCodeTokenizer.parse("CS 101"),
				copy = CourseCodeTokenizer.copyToken(token);
				copy.not = true;
			expect(token).not.toEqual(copy);
		});

	});

	describe("Statement Object", function() {

		it("should construct a Statement object for a single Statement string", function() {
			var statement1 = new Statement("cs 201"),
				statement2 = new Statement("cs*");
			expect(statement1.tokens[0]).toEqual(CourseCodeTokenizer.parse("Cs 201"));
			expect(statement1.tokens.length).toBe(1);
			expect(statement2.tokens[0]).toEqual(CourseCodeTokenizer.parse("CS *"));
			expect(statement2.tokens.length).toBe(1);
		});

		it("should construct multiple Statement objects for a multi Statement string", function() {
			var statement1 = new Statement("cs 200+ & !cs 201"),
				statement2 = new Statement("Cs 250+ & !cs 200 & !bsci110a");

			expect(statement1.tokens.length).toBe(2);
			expect(statement1.tokens[0]).toEqual({coursePrefix: 'CS', courseNumber: 200, query: '+', not: false});
			expect(statement1.tokens[1]).toEqual({coursePrefix: 'CS', courseNumber: 201, not: true});

			expect(statement2.tokens.length).toBe(3);
			expect(statement2.tokens[0]).toEqual({coursePrefix: "CS", not: false, courseNumber: 250, query: '+'})
			expect(statement2.tokens[1]).toEqual({coursePrefix: "CS", not: true, courseNumber: 200});
			expect(statement2.tokens[2]).toEqual({coursePrefix: "BSCI", not: true, courseNumber: 110, courseSuffix: 'A'});
		});

		it('should be able to add queries after initial construction to create a multi statement', function() {
			var statement = new Statement("cs 200+");

			statement.and("!cs 201");
			statement.and("!a$");

			expect(statement.has('cs 200')).toBeTruthy();
			expect(statement.has("cs 201")).toBeFalsy();
			expect(statement.has("cs 101")).toBeFalsy();
			expect(statement.has("cs 300a")).toBeFalsy();
		});


		it("should identify when a Statement is an anti token", function() {
			var statement1 = new Statement('cs 200'),
				statement2 = new Statement('!bsci*');

			expect(statement1.isNegated()).toBeFalsy();
			expect(statement2.isNegated()).toBeTruthy();
		});

		it("should always consider multi queries as never negative queries", function() {
			var statement1 = new Statement("cs 101 & !cs 200"),
				statement2 = new Statement("cs 300+ & cs 200+");

			expect(statement1.isNegated()).toBeFalsy();
			expect(statement2.isNegated()).toBeFalsy();
		});

		it("should identify when a Statement is for a single course code", function() {
			var statement1 = new Statement("cs 200+"),
				statement2 = new Statement("cs 101"),
				statement3 = new Statement("!cs 101"),
				statement4 = new Statement("mns~");

			expect(statement1.isSingleCourse()).toBeFalsy();
			expect(statement2.isSingleCourse()).toBeTruthy();
			expect(statement3.isSingleCourse()).toBeTruthy();
			expect(statement4.isSingleCourse()).toBeFalsy();
		});

		it("should identify when a statement object contains either a single or multi statement", function() {
			var statement1 = new Statement("CS 101"),
				statement2 = new Statement("cs 200+ & cs 101");

			expect(statement1.isSingleStatement()).toBeTruthy();
			expect(statement2.isSingleStatement()).toBeFalsy();
		});

		it("should match a course code for a single Statement", function() {
			var statement1 = new Statement("CS 200+"),
				statement2 = new Statement("Cs *");
				statement3 = new Statement("a$")
				statement4 = new Statement("PHYS 116a");
			expect(statement1.has("cs 251")).toBeTruthy();
			expect(statement1.has("cs 101")).toBeFalsy();
			expect(statement1.has("nsc 201")).toBeFalsy();
			expect(statement2.has("cs 300")).toBeTruthy();
			expect(statement2.has("nsc 200")).toBeFalsy();
			expect(statement3.has("NSC 220a")).toBeTruthy();
			expect(statement3.has("PHIL 110")).toBeFalsy();
			expect(statement4.has("phys116a")).toBeTruthy();
			expect(statement4.has("phys116b")).toBeFalsy();
		});

		it("should match a course code for a multi Statement", function() {
			var statement1 = new Statement("phys 100+ & !phys116a"),
				statement2 = new Statement("cs* & !cs 103");

			
			expect(statement1.has("phys116a")).toBeFalsy();
			expect(statement1.has("phys 100")).toBeTruthy();
			expect(statement1.has("nsc 200")).toBeFalsy();
			expect(statement1.has("Phys 116b")).toBeTruthy();

			expect(statement2.has("Phys 116")).toBeFalsy();
			expect(statement2.has("cs 103")).toBeFalsy();
			expect(statement2.has("cs 103a")).toBeTruthy();
		});

		it("should allow adding queries to the current statement", function() {
			var statement = new Statement("a$");

			statement.and("cs*");

			expect(statement.has("cs 101a")).toBeTruthy();
			expect(statement.has("bsci 101a")).toBeFalsy();
			expect(statement.has("cs 101")).toBeFalsy();
		});

		it("should match a course code with an anti statement as a course code", function() {
			var statement = new Statement("!PHYS 116a");

			expect(statement.has("phys116a")).toBeFalsy();
			expect(statement.has("phys116b")).toBeTruthy();
		});

		it("should match a course code with an anti + (above) query", function() {
			var statement = new Statement("!CS 200+");

			expect(statement.has("cs 151")).toBeTruthy();
			expect(statement.has("cs 251")).toBeFalsy();
			expect(statement.has("nsc 201")).toBeTruthy();
		});

		it("should match a course code with an anti * (all) query", function() {
			var statement = new Statement("!Cs *");

			expect(statement.has("cs 300")).toBeFalsy();
			expect(statement.has("nsc 200")).toBeTruthy();

		});

		it("should match a course code with an anti $ (suffix) query", function() {
			var statement = new Statement("!a$");

			expect(statement.has("NSC 220a")).toBeFalsy();
			expect(statement.has("PHIL 110")).toBeTruthy();
		});
		
		it("should identify queries that are equal", function() {
			var statement1 = new Statement("cs 251"),
				statement2 = new Statement("bsci*"),
				statement3 = new Statement("nsc 150+"),
				statement4 = new Statement("se^"),
				statement5 = new Statement("a$"),
				statement6 = new Statement("mns~");

			expect(statement1.isEqual('cs 251')).toBeTruthy();
			expect(statement2.isEqual("bsci *")).toBeTruthy();
			expect(statement3.isEqual("NSC 150+")).toBeTruthy();
			expect(statement4.isEqual("SE^")).toBeTruthy();
			expect(statement5.isEqual("a$")).toBeTruthy();
			expect(statement6.isEqual("MNS~")).toBeTruthy();
		});

		it("should identify queries that are not equal", function() {
			var statement1 = new Statement("cs 251"),
				statement2 = new Statement("bsci*"),
				statement3 = new Statement("nsc 150+"),
				statement4 = new Statement("se^"),
				statement5 = new Statement("a$"),
				statement6 = new Statement("mns~");

			expect(statement1.isEqual('cs 151')).toBeFalsy();
			expect(statement2.isEqual("bsci 110a")).toBeFalsy();
			expect(statement3.isEqual("NSC 151+")).toBeFalsy();
			expect(statement4.isEqual("as^")).toBeFalsy();
			expect(statement5.isEqual("b$")).toBeFalsy();
			expect(statement6.isEqual("p~")).toBeFalsy();
		});

		it("should identify anti queries that are equal", function() {
			var statement1 = new Statement("!cs 251"),
				statement2 = new Statement("!bsci*"),
				statement3 = new Statement("!nsc 150+"),
				statement4 = new Statement("!se^"),
				statement5 = new Statement("!a$"),
				statement6 = new Statement("!mns~");

			expect(statement1.isEqual('!cs 251')).toBeTruthy();
			expect(statement2.isEqual("!bsci *")).toBeTruthy();
			expect(statement3.isEqual("!NSC 150+")).toBeTruthy();
			expect(statement4.isEqual("!SE^")).toBeTruthy();
			expect(statement5.isEqual("!a$")).toBeTruthy();
			expect(statement6.isEqual("!MNS~")).toBeTruthy();
		});

		it("should identify anti queries that are not equal", function() {
			var statement1 = new Statement("!cs 251"),
				statement2 = new Statement("!bsci*"),
				statement3 = new Statement("!nsc 150+"),
				statement4 = new Statement("!se^"),
				statement5 = new Statement("!a$"),
				statement6 = new Statement("!mns~");

			expect(statement1.isEqual('!cs 151')).toBeFalsy();
			expect(statement2.isEqual("!bsci 110A")).toBeFalsy();
			expect(statement3.isEqual("!NSC 151+")).toBeFalsy();
			expect(statement4.isEqual("!as^")).toBeFalsy();
			expect(statement5.isEqual("!b$")).toBeFalsy();
			expect(statement6.isEqual("!p~")).toBeFalsy();
		});

		it("should identify equal queries despite different ordering of multi-queries", function() {
			var statement1 = new Statement("cs 200+ & !cs 202 & !cs 201"),
				statement2 = new Statement("!cs 201 & cs 200+ & !cs 202");

			expect(statement1.isEqual(statement2)).toBeTruthy();
		});

		it("should reformat queries correctly using the toString method", function() {
			var statement1 = new Statement("CS 101"),
				statement2 = new Statement("cs101 "),
				statement3 = new Statement("a$"),
				statement4 = new Statement("mns~"),
				statement5 = new Statement("bsci 110a");

				expect(statement1.toString()).toBe("CS 101");
				expect(statement2.toString()).toBe("CS 101");
				expect(statement3.toString()).toBe("A$");
				expect(statement4.toString()).toBe("MNS~");
				expect(statement5.toString()).toBe("BSCI 110A");
		});

		it("should reformat anti queries correctly using the toString method", function() {
			var statement1 = new Statement("!CS 101"),
				statement2 = new Statement("!cs101 "),
				statement3 = new Statement("!a$"),
				statement4 = new Statement("!mns~"),
				statement5 = new Statement("!bsci 110a");

				expect(statement1.toString()).toBe("!CS 101");
				expect(statement2.toString()).toBe("!CS 101");
				expect(statement3.toString()).toBe("!A$");
				expect(statement4.toString()).toBe("!MNS~");
				expect(statement5.toString()).toBe("!BSCI 110A");
		});

		it("should reformat queries correctly using the formatstatement static method", function() {
			expect(Statement.formatStatement("CS 101")).toBe("CS 101");
			expect(Statement.formatStatement("cs101")).toBe("CS 101");
			expect(Statement.formatStatement("a$")).toBe("A$");
			expect(Statement.formatStatement("mns~")).toBe("MNS~");
			expect(Statement.formatStatement("bsci110a")).toBe("BSCI 110A");
		});

		it("should reformat queries correctly using the formatStatement static method", function() {
			expect(Statement.formatStatement("!CS 101")).toBe("!CS 101");
			expect(Statement.formatStatement("!cs101")).toBe("!CS 101");
			expect(Statement.formatStatement("!a$")).toBe("!A$");
			expect(Statement.formatStatement("!mns~")).toBe("!MNS~");
			expect(Statement.formatStatement("!bsci110a")).toBe("!BSCI 110A");
		});

		it("should filter and re-format course codes that match the Statement", function() {
			var statement1 = new Statement("cs 101"),
				statement2 = new Statement("cs 200+"),
				statement3 = new Statement("!cs 200+"),
				statement4 = new Statement("a$");

			expect(statement1.filter(["cs 101", "cs 103", "cs 201"])).toEqual(["CS 101"]);
			expect(statement2.filter(["cs 101", "cs 201", "cs251", "cs231"])).toEqual(["CS 201", "CS 251", "CS 231"]);
			expect(statement3.filter(["cs 101", "cs 201", "cs 251", "cs 231"])).toEqual(["CS 101"]);
			expect(statement4.filter(["cs 101", "cs 101a", "bsci110a", "cs 251"])).toEqual(["CS 101A", "BSCI 110A"]);

		});

		it("should create deep copies of itself using the copy method", function() {
			var statement1 = new Statement("cs 101a"),
				statement2 = statement1.copy();

			expect(statement2).toEqual(statement1);
			statement2.tokens[0].not = !statement2.tokens[0].not;
			expect(statement2).not.toEqual(statement1);
		});

		describe("refactoring", function() {
			it("should remove unneeded queries from a statement with at least 1 single course", function() {
				var statement = new Statement("cs 201 & cs 200+");

				expect(statement.refactor()).toBeTruthy();
				expect(statement.toString()).toBe("CS 201");
			});
			it("should remove unneeded queries from a single course statement with extra anti queries present", function() {
				var statement = new Statement("cs 101 & !cs 201 & !cs200+");
				expect(statement.refactor()).toBeTruthy();
				expect(statement.toString()).toBe("CS 101");
			});

			it("should indicate that a statement is contradictory for single courses with more complex anti queries", function() {
				var statement = new Statement("cs 201 & !cs 200+");
				expect(statement.refactor()).toBeFalsy();
			});

			it("should indicate if the statement is conradictory for single course anti-queries", function() {
				var statement = new Statement("cs 101 & !Cs 101");
				expect(statement.refactor()).toBeFalsy();
			});
			it("should indicate if the statement is contradictory from having more than 1 single course", function() {
				var statement = new Statement("cs 101 & cs 102");
				expect(statement.refactor()).toBeFalsy();
			});
			it("should keep portions of multiqueries that cannot be resolved and not throw errors", function() {
				var statement = new Statement("cs 101 & SE^");
				expect(statement.refactor()).toBeTruthy();
				expect(statement.toString()).toBe("CS 101 & SE^");
			});
		});
	});

	describe("Statement Collection", function() {
		var q_collection1,
			q_collection2;

		beforeEach(function() {
			q_collection1 = [new Statement("CS 101"), new Statement("CS 102"), new Statement("CS251"), new Statement("bsci 200+")];
			q_collection2 = [new Statement("a$"), new Statement("!CS 200+")];
		});

		it("should have a constructor that takes Statement objects", function() {
			var testFunct = function() {
				return function() {
					var statement = new StatementCollection(q_collection1);
				}
			}
			expect(testFunct()).not.toThrowAnything();
		});
		it("should have a constructor that takes Statement strings", function() {
			var testFunct = function() {
				return function() {
					var statement = new StatementCollection(["CS 101", "CS 102", "bsci 200+"]);
				}
			}
			expect(testFunct()).not.toThrowAnything();
		});

		it('should throw an error when the constructor parameter is not an array', function() {
			var testFunct = function(param) {
				return function() {
					var statement = new StatementCollection(param);
				}
			}

			expect(testFunct(1)).toThrow(new Error("parameter for StatementCollection constructor should be an array"));
			expect(testFunct()).toThrow(new Error("parameter for StatementCollection constructor should be an array"));
			expect(testFunct("Bad param")).toThrow(new Error("parameter for StatementCollection constructor should be an array"));
			expect(testFunct([])).not.toThrow(new Error("parameter for StatementCollection constructor should be an array"));

		});
		it('should match a course for a simple Statement', function() {
			var queries = new StatementCollection(["CS 101", "CS 102", "bsci 200+"]);

			expect(queries.has("cs 101")).toBeTruthy();
			expect(queries.has("bsci 201")).toBeTruthy();
			expect(queries.has("math 155")).toBeFalsy();
			expect(queries.has("cs 102")).toBeTruthy();
		});

		it('should match a course for a collection containing multiqueries', function() {
			var queries = new StatementCollection(["MATH 155", "Math 200+ & !MATH 209 & !MATH 210"]);

			expect(queries.has("math 155")).toBeTruthy();
			expect(queries.has("Math 209")).toBeFalsy();
			expect(queries.has("math 210")).toBeFalsy();
		});

		it("should match a set of course codes using the filter method", function() {
			var queries = new StatementCollection(["CS 101", "CS 102", "bsci 200+"]);

			expect(queries.filter(["CS 101", "cs 103", "bsci 110a", "bsci 201"])).toEqual(["CS 101", "BSCI 201"]);
		});

		it("should match a set of course codes using a filter method and a complex multi Statement collection", function() {
			var queries = new StatementCollection(["MATH 155A", "MATH 155B", "MATH 200+", "!MATH 208", "!MATH 209"]);
			
			expect(queries.filter(["MATH 155A", "MATH 208", "MATH 300", "BSCI 110a"])).toEqual(["MATH 155A", "MATH 300"]);
		});

		it("should be able to iterate through queries using the each method", function() {
			var queries = new StatementCollection(q_collection1);

			queries.each(function(statement, index) {
				expect(statement).toEqual(q_collection1[index]);
			});
		});

		it("should allow for appending more statement strings", function() {
			var queries = new StatementCollection(["CS 101", "CS 102", "bsci 200+"]);
			queries.append("cs 103");
			expect(queries.has("cs 103")).toBeTruthy();
		});


		it("should allow for appending more Statement objects", function() {
			var queries = new StatementCollection(["MATH 155A", "MATH 155B", "MATH 200+", "!MATH 208", "!MATH 209"]);
			queries.append(new Statement("cs 103"));
			expect(queries.has("cs 103")).toBeTruthy();
			expect(queries.has("Math 209")).toBeFalsy();
		});

		it("should allow for unioning another Statement collection", function() {
			var queries = new StatementCollection(["CS 101", "CS 102", "bsci 200+"]);

			queries.union(new StatementCollection(["MATH 155A", "MATH 155B", "MATH 200+", "!MATH 208", "!MATH 209"]));

			expect(queries.has("cs 101")).toBeTruthy();
			expect(queries.has("math 155a")).toBeTruthy();
			expect(queries.has("cs 103")).toBeFalsy();
		});
		
		it("should remove redundancies when unioning 2 Statement collections", function() {
			var queries = new StatementCollection(["CS 101", "CS 102", "bsci 200+"]);

			queries.union(new StatementCollection(["CS 101", "!CS 103", "CS 200+"]));

			expect(queries.toArray()).toEqual(["CS 101", "CS 102", "BSCI 200+", "CS 200+"]);
		});


		it("should create a deep copy of itself", function() {
			var queries = new StatementCollection(["MATH 155A", "MATH 155B", "MATH 200+", "!MATH 208", "!MATH 209"]),
				queriesCopy = queries.copy();
			expect(queries).toEqual(queriesCopy);
			queriesCopy.append("CS 101");
			expect(queries).not.toEqual(queriesCopy);

		});
		
		it("should return an array of queries", function() {
			var queries = new StatementCollection(["CS 101", "CS 102", "bsci 200+"]);

			expect(queries.toArray()).toEqual(["CS 101", "CS 102", "BSCI 200+"])
		});

		it("should return an array of queries for complex anti Statement collections", function() {
			var collection= new StatementCollection(["MATH 155A", "MATH 155B", "MATH 200+", "!MATH 208", "!MATH 209"]);

			expect(collection.toArray()).toEqual(["MATH 155A", "MATH 155B", "MATH 200+ & !MATH 208 & !MATH 209"]);
		});

		it('should cancel out queries that are opposite to the negation', function() {
			var queries = new StatementCollection(["CS 101", "CS 201", "!CS 101"]);

			expect(queries.toArray()).toEqual(["CS 201"]);
		});

		it("should union correctly with the static union method when given two arrays of strings", function() {
			var queries = StatementCollection.union(["CS 101", "CS 103"], ["CS 101", "!CS 101", "CS 200+"]);

			expect(queries.toArray()).toEqual(["CS 101", "CS 103", "CS 200+"]);
		});

		it("should union correctly with the static union method when given two Statement collections", function() {
			var queries = StatementCollection.union(new StatementCollection(["CS 101", "CS 103"]), new StatementCollection(["CS 101", "!CS 101", "CS 200+"]));

			expect(queries.toArray()).toEqual(["CS 101", "CS 103", "CS 200+"]);
		});
	});

});


describe("Tokenizer Addon:", function() {
	describe("Statement Helper", function() {
		var mongoQuery1,
			mongoQuery2;
		beforeEach(function() {
			mongoQuery1 = {
				coursePrefix: "CS",
				courseNumber: {$in: [101, 201]}
			};
			mongoQuery2 = {
				$or: [
					{
						coursePrefix: /cs/i
					},
					{
						coursePrefix: /bsci/i
					}
				]
			};
		});

		it("should convert a course token to regexp", function() {
			var cs101a = StatementHelper.tokenToRegExp({coursePrefix: 'cs', courseSuffix: 'a', courseNumber: 101});

			expect(cs101a.test('cs 101a')).toBeTruthy();
			expect(cs101a.test('cs   101A')).toBeTruthy();
			expect(cs101a.test('Cs 101b')).toBeFalsy();
		});

		describe("number generator method", function() {
			it("should generate exclusive number searches", function() {
				expect(StatementHelper.numberGenerator(1)).toBe('[2-9]');
				expect(StatementHelper.numberGenerator(4)).toBe('[5-9]');
			});
			it("should generate number search when a string is passed in as a parameter", function() {
				expect(StatementHelper.numberGenerator("1")).toBe('[2-9]');
				expect(StatementHelper.numberGenerator("4")).toBe("[5-9]");
			});

			it("should generate inclusive number searches", function() {
				expect(StatementHelper.numberGenerator("1", true)).toBe("[1-9]");
				expect(StatementHelper.numberGenerator("4", true)).toBe("[4-9]");
			});

			it("should generate a \\d search for an inclusive number search of 0", function() {
				expect(StatementHelper.numberGenerator(0, true)).toBe("\\d");
			});
			it("should generate a 9 search for an inclusive 9", function() {
				expect(StatementHelper.numberGenerator(9, true)).toBe("9");
			});
			it("should generate a 9 search for an exclusive 8", function() {
				expect(StatementHelper.numberGenerator(8)).toBe("9");
			});
		});
			
		it("should create successful copies of primitives", function() {
			expect(StatementHelper.copyMongoQuery("hello")).toEqual("hello");
		});
		it("should create copies of mongo queries", function() {
			expect(StatementHelper.copyMongoQuery(mongoQuery1)).toEqual(mongoQuery1);
		});
		it("should create copies of mongo queries that are deep", function() {
			var copy = StatementHelper.copyMongoQuery(mongoQuery1);
			copy.prop = "This is a new property";
			expect(copy).not.toEqual(mongoQuery1);
		});
		describe("plus token regexp", function() {
			var cs101p, cs99p, cs301p, cs1234p, cs0p, cs5p, cs251p;
			beforeEach(function() {
				cs0p = StatementHelper.plusTokenToRegExp({query: '+', coursePrefix: 'cs', courseNumber: 0});
				cs5p = StatementHelper.plusTokenToRegExp({query: '+', coursePrefix: 'cs', courseNumber: 5});
				cs99p = StatementHelper.plusTokenToRegExp({query: '+', coursePrefix: 'cs', courseNumber: 99});
				cs101p = StatementHelper.plusTokenToRegExp({query: '+', coursePrefix: 'cs', courseNumber: 101});
				cs251p = StatementHelper.plusTokenToRegExp({query: '+', coursePrefix: 'cs', courseNumber: 251});
				cs301p = StatementHelper.plusTokenToRegExp({query: '+', coursePrefix: 'cs', courseNumber: 301});
				cs1234p = StatementHelper.plusTokenToRegExp({query: '+', coursePrefix: 'cs', courseNumber: 1234});
				
			});
			it("should correctly format plus tokens for 1 digit course numbers", function() {
				expect(cs0p.test("cs 101")).toBeTruthy();
				expect(cs0p.test("CS 88a")).toBeTruthy();
				expect(cs5p.test("cs 4")).toBeFalsy();
			});
			it("should correctly format plus tokens for 2 digit course numbers", function() {
				expect(cs99p.test("Cs 101")).toBeTruthy();
				expect(cs99p.test("cs 0101")).toBeTruthy();
				expect(cs99p.test("cs 011")).toBeFalsy();
			});
			it("should correctly format plus tokens for 3 digit course numbers", function() {
				expect(cs101p.test("cs 101")).toBeTruthy();
				expect(cs251p.test("Cs 0250")).toBeFalsy();
				expect(cs301p.test("cs 0302")).toBeTruthy();
			});
			it("should correctly format plus tokens for 4 digit course numbers", function() {
				expect(cs1234p.test("cs 1001")).toBeFalsy();
				expect(cs1234p.test("cs 999")).toBeFalsy();
				expect(cs1234p.test("cs 1235")).toBeTruthy();
			});
			it("should correctly identify courses with suffixes", function() {
				expect(cs99p.test("cs 101a")).toBeTruthy();
				expect(cs1234p.test("cs 1245a")).toBeTruthy();
				expect(cs251p.test("cs 200s")).toBeFalsy();

			});

		});
	
		describe("addTokenToMongoQuery method", function() {

		});

	});
	describe("Statement Addons", function() {
		it("should generate mongodb query objects for single course queries", function() {
			
		});
	});

	describe("StatementCollection Addons", function() {
		it("should generate mongodb query objects for single courses", function() {
			var collection = new StatementCollection(["CS 101", "CS 201a"]);
			expect(collection.mongoQuery()).toEqual({ $or : [ { courseCode : /^CS(\s?)+101$/i }, { courseCode : /^CS(\s?)+201A$/i } ] });
		});

		it("should generate mongodb query objects for plus courses", function() {
			var collection = new StatementCollection(["CS 200+"]);
			expect(collection.mongoQuery()).toEqual({ $or : [ { courseCode : /^CS\s?((((020\d)|(02[1-9]\d)|(0[3-9]\d\d)|([^0]\d\d\d)))|(((20\d)|(2[1-9]\d)|([3-9]\d\d))))[a-z]*/i } ] });
		});
	});
});

	