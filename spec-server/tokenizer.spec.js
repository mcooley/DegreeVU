var tokenizer = require('../tokenizer.addon'),
	CourseCodeTokenizer = tokenizer.CourseCodeTokenizer,
	Query = tokenizer.Query,
	QueryCollection = tokenizer.QueryCollection,
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

		it("should recogize when a course code matches itself", function() {
			expect(CourseCodeTokenizer.matchQuery("cs 101", "CS 101")).toBeTruthy();
		});
		it("should recognize when a course code does not match another course code", function() {
			expect(CourseCodeTokenizer.matchQuery("cs 101", "CS 101a")).toBeFalsy();
		});
		it("should recognize when a course code code matches an anti course code", function() {
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

			expect(testFunct("cs 101", "SE^")).toThrow(new Error("cannot match a query to the school (^) token"));
			expect(testFunct("cs 101", "!SE^")).toThrow(new Error("cannot match a query to the school (^) token"));
		
		});

		it("should throw an exception if trying to match a course code to a category (~) query", function() {
			function testFunct(course, query) {
				return function() {
					CourseCodeTokenizer.matchQuery(course, query);
				}
			}
			expect(testFunct("cs 101", "mns~")).toThrow("cannot match a query with the category (~) token");
			expect(testFunct("cs 101", "!p~")).toThrow("cannot match a query with the category (~) token");
		});

		it("should create correct copies of query objects", function() {
			var query = CourseCodeTokenizer.parse('CS 101'),
				copy = CourseCodeTokenizer.copyQueryObject(query);
			expect(query).toEqual(copy);
			
		});

		it("should create deep copies of query objects", function() {
			var query = CourseCodeTokenizer.parse("CS 101"),
				copy = CourseCodeTokenizer.copyQueryObject(query);
				copy.not = true;
			expect(query).not.toEqual(copy);
		});

	});

	describe("Query Object", function() {

		it("should construct a query object for a single query string", function() {
			var query1 = new Query("cs 201"),
				query2 = new Query("cs*");
			expect(query1.array[0]).toEqual(CourseCodeTokenizer.parse("Cs 201"));
			expect(query1.array.length).toBe(1);
			expect(query2.array[0]).toEqual(CourseCodeTokenizer.parse("CS *"));
			expect(query2.array.length).toBe(1);
		});

		it("should construct multiple query objects for a multi query string", function() {
			var query1 = new Query("cs 200+ & !cs 201"),
				query2 = new Query("Cs 250+ & !cs 200 & !bsci110a");

			expect(query1.array.length).toBe(2);
			expect(query1.array[0]).toEqual({coursePrefix: 'CS', courseNumber: 200, query: '+', not: false});
			expect(query1.array[1]).toEqual({coursePrefix: 'CS', courseNumber: 201, not: true});

			expect(query2.array.length).toBe(3);
			expect(query2.array[0]).toEqual({coursePrefix: "CS", not: false, courseNumber: 250, query: '+'})
			expect(query2.array[1]).toEqual({coursePrefix: "CS", not: true, courseNumber: 200});
			expect(query2.array[2]).toEqual({coursePrefix: "BSCI", not: true, courseNumber: 110, courseSuffix: 'A'});
		});

		it('should be able to add queries after initial construction to create a multi query', function() {
			var query = new Query("cs 200+");

			query.and("!cs 201");
			query.and("!a$");

			expect(query.matches('cs 200')).toBeTruthy();
			expect(query.matches("cs 201")).toBeFalsy();
			expect(query.matches("cs 101")).toBeFalsy();
			expect(query.matches("cs 300a")).toBeFalsy();
		});


		it("should identify when a query is an anti query", function() {
			var query1 = new Query('cs 200'),
				query2 = new Query('!bsci*');

			expect(query1.isNegated()).toBeFalsy();
			expect(query2.isNegated()).toBeTruthy();
		});

		it("should always consider multi queries as never negative queries", function() {
			var query1 = new Query("cs 101 & !cs 200"),
				query2 = new Query("cs 300+ & cs 200+");

			expect(query1.isNegated()).toBeFalsy();
			expect(query2.isNegated()).toBeFalsy();
		});

		it("should identify when a query is for a single course code", function() {
			var query1 = new Query("cs 200+"),
				query2 = new Query("cs 101"),
				query3 = new Query("!cs 101"),
				query4 = new Query("mns~");

			expect(query1.isSingleCourse()).toBeFalsy();
			expect(query2.isSingleCourse()).toBeTruthy();
			expect(query3.isSingleCourse()).toBeTruthy();
			expect(query4.isSingleCourse()).toBeFalsy();
		});

		it("should identify when a query object contains either a single or multi query", function() {
			var query1 = new Query("CS 101"),
				query2 = new Query("cs 200+ & cs 101");

			expect(query1.isSingleQuery()).toBeTruthy();
			expect(query2.isSingleQuery()).toBeFalsy();
		});

		it("should match a course code for a single query", function() {
			var query1 = new Query("CS 200+"),
				query2 = new Query("Cs *");
				query3 = new Query("a$")
				query4 = new Query("PHYS 116a");
			expect(query1.matches("cs 251")).toBeTruthy();
			expect(query1.matches("cs 101")).toBeFalsy();
			expect(query1.matches("nsc 201")).toBeFalsy();
			expect(query2.matches("cs 300")).toBeTruthy();
			expect(query2.matches("nsc 200")).toBeFalsy();
			expect(query3.matches("NSC 220a")).toBeTruthy();
			expect(query3.matches("PHIL 110")).toBeFalsy();
			expect(query4.matches("phys116a")).toBeTruthy();
			expect(query4.matches("phys116b")).toBeFalsy();
		});

		it("should match a course code for a multi query", function() {
			var query1 = new Query("phys 100+ & !phys116a"),
				query2 = new Query("cs* & !cs 103");

			
			expect(query1.matches("phys116a")).toBeFalsy();
			expect(query1.matches("phys 100")).toBeTruthy();
			expect(query1.matches("nsc 200")).toBeFalsy();
			expect(query1.matches("Phys 116b")).toBeTruthy();

			expect(query2.matches("Phys 116")).toBeFalsy();
			expect(query2.matches("cs 103")).toBeFalsy();
			expect(query2.matches("cs 103a")).toBeTruthy();
		});

		it("should allow adding queries to the current query", function() {
			var query = new Query("a$");

			query.and("cs*");

			expect(query.matches("cs 101a")).toBeTruthy();
			expect(query.matches("bsci 101a")).toBeFalsy();
			expect(query.matches("cs 101")).toBeFalsy();
		});

		it("should match a course code with an anti query as a course code", function() {
			var query = new Query("!PHYS 116a");

			expect(query.matches("phys116a")).toBeFalsy();
			expect(query.matches("phys116b")).toBeTruthy();
		});

		it("should match a course code with an anti + (above) query", function() {
			var query = new Query("!CS 200+");

			expect(query.matches("cs 151")).toBeTruthy();
			expect(query.matches("cs 251")).toBeFalsy();
			expect(query.matches("nsc 201")).toBeTruthy();
		});

		it("should match a course code with an anti * (all) query", function() {
			var query = new Query("!Cs *");

			expect(query.matches("cs 300")).toBeFalsy();
			expect(query.matches("nsc 200")).toBeTruthy();

		});

		it("should match a course code with an anti $ (suffix) query", function() {
			var query = new Query("!a$");

			expect(query.matches("NSC 220a")).toBeFalsy();
			expect(query.matches("PHIL 110")).toBeTruthy();
		});
		
		it("should identify queries that are equal", function() {
			var query1 = new Query("cs 251"),
				query2 = new Query("bsci*"),
				query3 = new Query("nsc 150+"),
				query4 = new Query("se^"),
				query5 = new Query("a$"),
				query6 = new Query("mns~");

			expect(query1.isEqual('cs 251')).toBeTruthy();
			expect(query2.isEqual("bsci *")).toBeTruthy();
			expect(query3.isEqual("NSC 150+")).toBeTruthy();
			expect(query4.isEqual("SE^")).toBeTruthy();
			expect(query5.isEqual("a$")).toBeTruthy();
			expect(query6.isEqual("MNS~")).toBeTruthy();
		});

		it("should identify queries that are not equal", function() {
			var query1 = new Query("cs 251"),
				query2 = new Query("bsci*"),
				query3 = new Query("nsc 150+"),
				query4 = new Query("se^"),
				query5 = new Query("a$"),
				query6 = new Query("mns~");

			expect(query1.isEqual('cs 151')).toBeFalsy();
			expect(query2.isEqual("bsci 110a")).toBeFalsy();
			expect(query3.isEqual("NSC 151+")).toBeFalsy();
			expect(query4.isEqual("as^")).toBeFalsy();
			expect(query5.isEqual("b$")).toBeFalsy();
			expect(query6.isEqual("p~")).toBeFalsy();
		});

		it("should identify anti queries that are equal", function() {
			var query1 = new Query("!cs 251"),
				query2 = new Query("!bsci*"),
				query3 = new Query("!nsc 150+"),
				query4 = new Query("!se^"),
				query5 = new Query("!a$"),
				query6 = new Query("!mns~");

			expect(query1.isEqual('!cs 251')).toBeTruthy();
			expect(query2.isEqual("!bsci *")).toBeTruthy();
			expect(query3.isEqual("!NSC 150+")).toBeTruthy();
			expect(query4.isEqual("!SE^")).toBeTruthy();
			expect(query5.isEqual("!a$")).toBeTruthy();
			expect(query6.isEqual("!MNS~")).toBeTruthy();
		});

		it("should identify anti queries that are not equal", function() {
			var query1 = new Query("!cs 251"),
				query2 = new Query("!bsci*"),
				query3 = new Query("!nsc 150+"),
				query4 = new Query("!se^"),
				query5 = new Query("!a$"),
				query6 = new Query("!mns~");

			expect(query1.isEqual('!cs 151')).toBeFalsy();
			expect(query2.isEqual("!bsci 110A")).toBeFalsy();
			expect(query3.isEqual("!NSC 151+")).toBeFalsy();
			expect(query4.isEqual("!as^")).toBeFalsy();
			expect(query5.isEqual("!b$")).toBeFalsy();
			expect(query6.isEqual("!p~")).toBeFalsy();
		});

		it("should reformat queries correctly using the toString method", function() {
			var query1 = new Query("CS 101"),
				query2 = new Query("cs101 "),
				query3 = new Query("a$"),
				query4 = new Query("mns~"),
				query5 = new Query("bsci 110a");

				expect(query1.toString()).toBe("CS 101");
				expect(query2.toString()).toBe("CS 101");
				expect(query3.toString()).toBe("A$");
				expect(query4.toString()).toBe("MNS~");
				expect(query5.toString()).toBe("BSCI 110A");
		});

		it("should reformat anti queries correctly using the toString method", function() {
			var query1 = new Query("!CS 101"),
				query2 = new Query("!cs101 "),
				query3 = new Query("!a$"),
				query4 = new Query("!mns~"),
				query5 = new Query("!bsci 110a");

				expect(query1.toString()).toBe("!CS 101");
				expect(query2.toString()).toBe("!CS 101");
				expect(query3.toString()).toBe("!A$");
				expect(query4.toString()).toBe("!MNS~");
				expect(query5.toString()).toBe("!BSCI 110A");
		});

		it("should reformat queries correctly using the formatQuery static method", function() {
			expect(Query.formatQuery("CS 101")).toBe("CS 101");
			expect(Query.formatQuery("cs101")).toBe("CS 101");
			expect(Query.formatQuery("a$")).toBe("A$");
			expect(Query.formatQuery("mns~")).toBe("MNS~");
			expect(Query.formatQuery("bsci110a")).toBe("BSCI 110A");
		});

		it("should reformat queries correctly using the formatQuery static method", function() {
			expect(Query.formatQuery("!CS 101")).toBe("!CS 101");
			expect(Query.formatQuery("!cs101")).toBe("!CS 101");
			expect(Query.formatQuery("!a$")).toBe("!A$");
			expect(Query.formatQuery("!mns~")).toBe("!MNS~");
			expect(Query.formatQuery("!bsci110a")).toBe("!BSCI 110A");
		});

		it("should filter and re-format course codes that match the query", function() {
			var query1 = new Query("cs 101"),
				query2 = new Query("cs 200+"),
				query3 = new Query("!cs 200+"),
				query4 = new Query("a$");

			expect(query1.filter(["cs 101", "cs 103", "cs 201"])).toEqual(["CS 101"]);
			expect(query2.filter(["cs 101", "cs 201", "cs251", "cs231"])).toEqual(["CS 201", "CS 251", "CS 231"]);
			expect(query3.filter(["cs 101", "cs 201", "cs 251", "cs 231"])).toEqual(["CS 101"]);
			expect(query4.filter(["cs 101", "cs 101a", "bsci110a", "cs 251"])).toEqual(["CS 101A", "BSCI 110A"]);

		});

		it("should use refactor method to remove unneeded queries from a query with at least 1 single course", function() {
			notYetImplemented();
		});


		it("should use refactor method to remove unneeded querying", function() {
			notYetImplemented();
		});

		it("should indicate if the query if conradictory", function() {
			notYetImplemented();
		});

		it("should create deep copies of itself using the copy method", function() {
			var query1 = new Query("cs 101a"),
				query2 = query1.copy();

			expect(_.isEqual(query1, query2)).toBeTruthy();
			query2.array[0].not = !query2.array[0].not;
			expect(_.isEqual(query1, query2)).toBeFalsy();
		});

	});

	describe("Query Collection", function() {

		var s_collection1,
			s_collection2,
			s_collection3,
			s_collection4,
			q_collection1,
			q_collection2;

		beforeEach(function() {

			s_collection1 = ["CS 101", "CS 102", "bsci 200+"],
			s_collection2 = ["MATH 155A", "MATH 155B", "MATH 200+", "!MATH 208", "!MATH 209"];
			s_collection3 = ["MATH100", "!MATH 200", "MATH*"];
			s_collection4 = ["MATH 155", "Math 200+ & !MATH 209 & !MATH 210"];
			q_collection1 = [new Query("CS 101"), new Query("CS 102"), new Query("CS251"), new Query("bsci 200+")];
			q_collection2 = [new Query("a$"), new Query("!CS 200+")];
		});

		it("should have a constructor that takes query objects", function() {
			var testFunct = function() {
				return function() {
					var query = new QueryCollection(q_collection1);
				}
			}
			expect(testFunct()).not.toThrowAnything();
		});
		it("should have a constructor that takes query strings", function() {
			var testFunct = function() {
				return function() {
					var query = new QueryCollection(s_collection1);
				}
			}
			expect(testFunct()).not.toThrowAnything();
		});

		it('should throw an error when the constructor parameter is not an array', function() {
			var testFunct = function(param) {
				return function() {
					var query = new QueryCollection(param);
				}
			}

			expect(testFunct(1)).toThrow(new Error("parameter for QueryCollection constructor should be an array"));
			expect(testFunct()).toThrow(new Error("parameter for QueryCollection constructor should be an array"));
			expect(testFunct("Bad param")).toThrow(new Error("parameter for QueryCollection constructor should be an array"));
			expect(testFunct([])).not.toThrow(new Error("parameter for QueryCollection constructor should be an array"));

		});
		it('should match a course for a simple query', function() {
			var queries = new QueryCollection(s_collection1);

			expect(queries.matches("cs 101")).toBeTruthy();
			expect(queries.matches("bsci 201")).toBeTruthy();
			expect(queries.matches("math 155")).toBeFalsy();
			expect(queries.matches("cs 102")).toBeTruthy();
		});

		it('should match a course for a collection containing multiqueries', function() {
			var queries = new QueryCollection(s_collection4);

			expect(queries.matches("math 155")).toBeTruthy();
			expect(queries.matches("Math 209")).toBeFalsy();
			expect(queries.matches("math 210")).toBeFalsy();
		});

		it("should match a set of course codes using the filter method", function() {
			var queries = new QueryCollection(s_collection1);

			expect(queries.filter(["CS 101", "cs 103", "bsci 110a", "bsci 201"])).toEqual(["CS 101", "BSCI 201"]);
		});

		it("should match a set of course codes using a filter method and a complex multi query collection", function() {
			var queries = new QueryCollection(s_collection2);
			s_collection2 = ["MATH 155A", "MATH 155B", "MATH 200+", "!MATH 208", "!MATH 209"];
			
			expect(queries.filter(["MATH 155A", "MATH 208", "MATH 300", "BSCI 110a"])).toEqual(["MATH 155A", "MATH 300"]);
		});

		it("should be able to iterate through queries using the each method", function() {
			var queries = new QueryCollection(q_collection1);

			queries.each(function(query, index) {
				expect(query).toEqual(q_collection1[index]);
			});
		});

		it("should allow for appending more query strings", function() {
			var queries = new QueryCollection(s_collection1);
			queries.append("cs 103");
			expect(queries.matches("cs 103")).toBeTruthy();
		});


		it("should allow for appending more query objects", function() {
			var queries = new QueryCollection(s_collection2);
			queries.append(new Query("cs 103"));
			expect(queries.matches("cs 103")).toBeTruthy();
			expect(queries.matches("Math 209")).toBeFalsy();
		});

		it("should allow for unioning another query collection", function() {
			var queries = new QueryCollection(s_collection1);

			queries.union(new QueryCollection(s_collection2));

			expect(queries.matches("cs 101")).toBeTruthy();
			expect(queries.matches("math 155a")).toBeTruthy();
			expect(queries.matches("cs 103")).toBeFalsy();
		});

		it('should prevent self union', function() {
			expect(false).toBeTruthy();
		});
		
		it("should remove redundancies when unioning 2 query collections", function() {
			var queries = new QueryCollection(s_collection1);

			queries.union(new QueryCollection(["CS 101", "!CS 103", "CS 200+"]));

			expect(queries.toArray()).toEqual(["CS 101", "CS 102", "BSCI 200+", "CS 200+"]);
		});


		it("should create a deep copy of itself", function() {
			var queries = new QueryCollection(s_collection2),
				queriesCopy = queries.copy();
			expect(queries).toEqual(queriesCopy);
			queriesCopy.append("CS 101");
			expect(queries).not.toEqual(queriesCopy);

		});
		
		it("should return an array of queries", function() {
			var queries = new QueryCollection(s_collection1);

			expect(queries.toArray()).toEqual(["CS 101", "CS 102", "BSCI 200+"])
		});

		it("should return an array of queries for complex anti query collections", function() {
			var queries = new QueryCollection(s_collection2);

			expect(queries.toArray()).toEqual(["MATH 155A", "MATH 155B", "MATH 200+ & !MATH 209 & !MATH 208"]);
		});

		it('should cancel out queries that are opposite to the negation', function() {
			var queries = new QueryCollection(["CS 101", "CS 201", "!CS 101"]);

			expect(queries.toArray()).toEqual(["CS 201"]);
		});

		it("should union correctly with the static union method when given two arrays of strings", function() {
			var queries = QueryCollection.union(["CS 101", "CS 103"], ["CS 101", "!CS 101", "CS 200+"]);

			expect(queries.toArray()).toEqual(["CS 101", "CS 103", "CS 200+"]);
		});

		it("should prevent self-union with the union static method", function() {
			expect(false).toBeTruthy();
		});

		it("should union correctly with the static union method when given two Query collections", function() {
			var queries = QueryCollection.union(new QueryCollection(["CS 101", "CS 103"]), new QueryCollection(["CS 101", "!CS 101", "CS 200+"]));

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

		it("should generate number strings used for plus queries", function() {
			expect(StatementHelper.numberGenerator(1)).toBe('23456789');
			expect(StatementHelper.numberGenerator(4)).toBe('56789');
		});
		it("should generate number strings when a string is passed in as a parameter", function() {
			expect(StatementHelper.numberGenerator("1")).toBe('23456789');
			expect(StatementHelper.numberGenerator("4")).toBe("56789");
		});

		it("should generate number strings starting from the number itself", function() {
			expect(StatementHelper.numberGenerator("1", true)).toBe("123456789");
			expect(StatementHelper.numberGenerator("4", true)).toBe("456789");
		});

		it("should return an empty string when passing in a number > 10 to the number generator", function() {
			expect(StatementHelper.numberGenerator(10)).toBe("");
			expect(StatementHelper.numberGenerator("10")).toBe("");
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

	});
		
});

	