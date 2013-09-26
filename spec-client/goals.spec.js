describe("Goals Testing Suite:", function() {
	
	describe("Shallow Requirement Object", function() {
		var req1, req2, req3; 

		beforeEach(function() {
			req1 = new Requirement(Dummy.ShallowRequirement1);
			req2 = new Requirement(Dummy.ShallowRequirement2);
			req3 = new Requirement(Dummy.ShallowRequirement3);
		});

		afterEach(function() {
			//reset the state
			req1 = new Requirement(Dummy.ShallowRequirement1);
			req2 = new Requirement(Dummy.ShallowRequirement2);
			req3 = new Requirement(Dummy.ShallowRequirement3);
		});

		it("should not initialize if there is more than 1 completion type", function() {
			var req4,
				testFunct = function() {
					return function() {
						req4 = new Requirement(Dummy.ShallowRequirement4);
					}
				};
			expect(testFunct()).toThrow(new Error("Cannot define both take and takeHours in a single requirement object"));
		});

		it('should return the correct title', function() {
			expect(req1.getTitle()).toBe(Dummy.ShallowRequirement1.title);
		});

		it("should return a QueryCollection when calling getItems()", function() {
			expect(req1.getItems().constructor).toBe(QueryCollection);
		});

		it("should return the correct completion type", function() {
			expect(req1.completionType()).toBe("takeItems");
			expect(req2.completionType()).toBe("takeAll");
		});

		it("should return the correct number of items needed", function() {
			expect(req1.itemsNeeded()).toBe(Dummy.ShallowRequirement1.take);
			expect(req2.itemsNeeded()).toBe(Dummy.ShallowRequirement2.items.length);
		});

		it("should return the correct number of hours needed", function() {
			expect(req1.hoursNeeded()).toBe(0);
			expect(req2.hoursNeeded()).toBe(0);
		});
		it("should be able to set backbone courses in cache", function() {
			var collection = new CourseCollection([new Course(Dummy.MATH155A), new Course(Dummy.MATH155B), new Course(Dummy.CS101), new Course(Dummy.CS201), new Course(Dummy.CS251)], {});
			req1.setCourses(collection);
			expect(req1.get('courses').getCourseCodes()).toEqual(["MATH 155A","MATH 155B"]);

		});
		it("should recognize courses that exist within the requirement", function() {

		});

		it("should correctly union backbone courses", function() {});

		it("should be able to add courses correctly", function() {});
		it("should recognize duplicate courses being added", function() {});
		it("should be able to remove courses correctly", function() {});
		it("should recognize duplicate courses being removed", function() {});

		it("should recognize if a 'takeItems' requirement is incomplete", function() {});
		it("should recognize if a 'takeItems' requirement is complete", function() {});
		it("should recognize if a 'takeAll' requirement is incomplete", function() {});
		it("should recognize if a 'takeAll' requirement is complete", function() {});
		it("should recognize if a 'takeHours' requirement is incomplete", function() {});
		it("should recognize if a 'takeHours' requirement is complete", function() {});

		it("should return the correct progress status", function() {});
		it("should return the correct depth from the root", function() {});
		it("should identify root and leaf requirements", function() {
			expect(req1.isLeaf()).toBeTruthy();
			expect(req1.isRoot()).toBeTruthy();
		});
		it("should recognize its overall depth", function() {});

	});

	describe("Deep Requirement Object", function() {
		it("should not initialize if there is more than 1 completion type in any of the nested requirements", function() {});
		it("should set the coursesLocked and ignoreLocked attributes of a child course to match the parent if not explicitly declared", function() {

		});
		it('should return the correct title', function() {});
		it('should return the correct items', function() {});
		it("should union and return nested course queries", function() {});
		it("should return the correct completion type", function() {});
		it("should return the correct number of items needed", function() {});

		it("should return the correct number of hours needed", function() {});
		it("should be able to cache backbone courses in the leaf requirements", function() {});
		it("should recognize courses that exist within the requirement", function() {});
		it("should be able to add courses correctly", function() {});
		it("should recognize duplicate courses being added", function() {});
		it("should be able to remove courses correctly", function() {});
		it("should recognize duplicate courses being removed", function() {});

		it("should recognize if a 'takeItems' requirement is incomplete", function() {});
		it("should recognize if a 'takeItems' requirement is complete", function() {});
		it("should recognize if a 'takeAll' requirement is incomplete", function() {});
		it("should recognize if a 'takeAll' requirement is complete", function() {});
		it("should recognize if a 'takeHours' requirement is incomplete", function() {});
		it("should recognize if a 'takeHours' requirement is complete", function() {});

		it("should return the correct progress status", function() {});

		it("should return the correct depth from the root", function() {});
		it("should identify itself as a root requirement", function() {});

		it("should recognize its overall depth", function() {});
		it("should recognize the depth of its most nested child", function() {});

	});
	describe("Goal Object", function() {});
	
	
});