goal = {
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
				"MATH 155A",
				"MATH 150B",
				"MATH 155A",
				"MATH 155B",
			],

			
			//relational flags, indicates how the items are related
			//to form the requirement, whether all have to be satisfied,
			//a number of hours, or a number of items, only 1 of the following
			//properties should be set, never both

			//takeHours: 6,
			take: "all" //or a number, such as 2
		},
		{//the second requirement
			title: "Science",
			subtitle: "This is optional",
			details: "This is optional",

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

					take: "all"
				},
				{
					title: "Sequence 2",
					items: 
					[
						"BSCI 110a",
						"BSCI 110b",
						"PHYS 116a"
					],

					take: "all"
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
		}
	]
		
};