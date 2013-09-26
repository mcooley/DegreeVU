describe("Course Testing Suite", function() {

	var CS101,CS201,CS251,BSCI110A, BSCI111A, NSC201, compSci;
	beforeEach(function() {
		CS101 = new Course(Dummy.CS101);
		CS201 = new Course(Dummy.CS201);
		CS251 = new Course(Dummy.CS251);
		BSCI110A = new Course(Dummy.BSCI110A);
		BSCI111A = new Course(Dummy.BSCI111A);
		NSC201 = new Course(Dummy.NSC201);
		compSci = new CourseCollection([CS101, CS201, CS251], {colorId: 1});
	});
	describe("Course", function() {
		
		it("should keep course objects unique based on ID's", function() {
			var course = new Course({_id: 1, courseCode: 'random'});
			expect(CS101).toBe(course);
			expect(CS101.get('courseCode')).toBe('random');
		});
	});
	
	describe("Course Collection", function() {

		it('should return course codes of the courses it contains', function() {

		});
		
		it("should union courses correctly", function() {
			var anotherCollection = new CourseCollection([CS101, CS201, CS251, BSCI110A], {});
			compSci.union(anotherCollection);
			expect(compSci.models.length).toBe(4);
			expect(compSci.contains(CS101)).toBeTruthy();
			expect(compSci.contains(CS201)).toBeTruthy();
			expect(compSci.contains(CS251)).toBeTruthy();
			expect(compSci.contains(BSCI110A)).toBeTruthy();
		});

		it('should union courses using the static union method', function() {
			var anotherCollection = new CourseCollection([CS101, CS201, CS251, BSCI110A], {}),
				unionCollection = CourseCollection.union(compSci, anotherCollection);
			expect(unionCollection.models.length).toBe(4);
			expect(unionCollection.contains(CS101)).toBeTruthy();
			expect(unionCollection.contains(CS201)).toBeTruthy();
			expect(unionCollection.contains(CS251)).toBeTruthy();
			expect(unionCollection.contains(BSCI110A)).toBeTruthy();
		});



});

});


