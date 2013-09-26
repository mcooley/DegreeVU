var Dummy = {};

Dummy.CS101 = {
	_id: 1,
	courseCode: 'CS 101',
	numOfCredits: [3,3],
	courseName: 'Introduction to Programming'
};
Dummy.CS201 = {
	_id: 2,
	courseCode: 'CS 201',
	numOfCredits: [3,3],
	courseName: 'Abstract Data Structures'
};
Dummy.CS251 = {
	_id: 3,
	courseCode: 'CS 251',
	numOfCredits: [3,3],
	courseName: 'Intermediate Software Design'
};
Dummy.BSCI110A = {
	_id: 4,
	courseCode: 'BSCI 110A',
	numOfCredits: [3, 3],
	courseName: "Introduction to Biology"
}
Dummy.BSCI111A = {
	_id: 5,
	courseCode: 'BSCI 111B',
	numOfCredits: [1, 1],
	courseName: "Introduction to Biology Lab"
};
Dummy.NSC201 = {
	_id: 6,
	courseCode: 'NSC 201',
	numOfCredits: [3, 3],
	courseName: 'Introduction to Neuroscience'
};
Dummy.MATH155A = {
	_id: 7,
	courseCode: 'MATH 155A',
	numOfCredits: [3,3],
	courseName: 'Intro to Calculus 1'
};
Dummy.MATH155B = {
	_id: 8,
	courseCode: 'MATH 155B',
	numOfCredits: [3, 3],
	courseName: 'Intro to Calculus 2'
}


Dummy.ShallowRequirement1 = {
	isRoot: true,
	title: "Math",
	//optional elements
	subtitle: "This is optional",
	details: "This is also optional",

	//coursesLocked and ignoreLocked hold true for all courses
	//that are beneath this branch, both are optional and have
	//default values

	coursesLocked: true, //defaults to false
	ignoreLocked: false, //defaults to false

	//items refers to the courses or nested 
	//validation objects that are used
	//courses are strings in the form of course codes
	//while validation objects are in the form of objects
	//the items either all have to be strings
	//or all have to be objects, there should never be a mix
	//of the two...
	items: 
	[
		"MATH 150B",
		"MATH 155A",
		"MATH 155B"
	],

	
	//relational flags, indicates how the items are related
	//to form the requirement, whether all have to be satisfied,
	//a number of hours, or a number of items, only 1 of the following
	//properties should be set, never both

	//takeHours: 6,
	take: 2 //or a number, such as 2
};


Dummy.ShallowRequirement2 = {
	title: 'Computer Science',
	items: ["CS 101", "CS 103", "CS 251"],
	take: 'all'
};

Dummy.ShallowRequirement3 = {
	title: "Third Dummy Requirement",
	items: 
	[
		"CS 101", "CS 201", "CS 200+"
	],

	takeHours: 9 
};

//this should not initialize because of an error with the 
//types
Dummy.ShallowRequirement4 = {
	title: "Third Dummy Requirement",
	items: 
	[
		"CS 101", "CS 201", "CS 200+"
	],
	take: 'all',
	takeHours: 9 
};

Dummy.DeepRequirement1 = {

	title: "Science",
	subtitle: "This is optional",
	details: "This is optional",
	warning: "This is a warning about the accuracy of this requirement",

	//these are the default values and don"t have to be
	//declared explicitly
	coursesLocked: false,
	ignoreLocked: false,

	items: 
	[
		//these are nested items/requirements
		{
			title: "Sequence 1",
			items: 
			[
				"CS 101", "CS 201"
			],

			take: 1
		},
		{
			title: "Sequence 2",
			items: 
			[
				"BSCI 110a",
				"BSCI 110b",
				"PHYS 116a"
			],

			take: 0
		},
		{
			title: "Sequence 3",
			items:
			[
				"PHYS 116A",
				"PHYS 116B"
			],

			take: "all"
		}
	],

	take: 1
};



Dummy.Goal1 = {
	title: "Computer Science",
	type: "major",
	school: "School of Engineering",
	requirements: 
	[
		{//the first requirement
			title: "Math",
			//optional elements
			subtitle: "This is optional",
			details: "This is also optional",

			//coursesLocked and ignoreLocked hold true for all courses
			//that are beneath this branch, both are optional and have
			//default values

			coursesLocked: true, //defaults to false
			ignoreLocked: false, //defaults to false

			//items refers to the courses or nested 
			//validation objects that are used
			//courses are strings in the form of course codes
			//while validation objects are in the form of objects
			//the items either all have to be strings
			//or all have to be objects, there should never be a mix
			//of the two...
			items: 
			[
				"MATH 150B",
				"MATH 155A",
				"MATH 155B"
			],

			
			//relational flags, indicates how the items are related
			//to form the requirement, whether all have to be satisfied,
			//a number of hours, or a number of items, only 1 of the following
			//properties should be set, never both

			//takeHours: 6,
			take: 2 //or a number, such as 2
		},
		{//the second requirement
			title: "Science",
			subtitle: "This is optional",
			details: "This is optional",
			warning: "This is a warning about the accuracy of this requirement",

			//these are the default values and don"t have to be
			//declared explicitly
			coursesLocked: false,
			ignoreLocked: false,

			items: 
			[
				//these are nested items/requirements
				{
					title: "Sequence 1",
					items: 
					[
						"CS 101", "CS 201"
					],

					take: 1
				},
				{
					title: "Sequence 2",
					items: 
					[
						"BSCI 110a",
						"BSCI 110b",
						"PHYS 116a"
					],

					take: 0
				},
				{
					title: "Sequence 3",
					items:
					[
						"PHYS 116A",
						"PHYS 116B"
					],

					take: "all"
				}
			],

			take: 1
		},
		{//third requirement
			title: 'Computer Science',
			items: [
				{
					title: 'CompSci 1',
					items: [
						"CS 101",
						"CS 103",
						"CS 251"

					],
					take: 1
				},
				{
					title: 'CompSci 2',
					items: [
						"CS 151"
					],
					take: "all"
				}
			],
			take: 'all'
		}
	]
		
}