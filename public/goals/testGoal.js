//WHAT IS EXPECTED OF A GOAL
	// - takeHours does not exist anywhere other than leaf requirements
	// - either take or takeHours is defined per goal, never both
	// - the root-level items must be objects, not strings
	// - must set the goal object to global variable 'goal' like below
//TIPS
	// - the root-level items (the ones that are nested directly inside the goal) should have 
	// elaborate details on the requirements 
	// - add lots of comments in the code so it is easier to read the requirement, in case something 
	// needs to be changed by someone who didn't write the goal (chances are that we are going to be 
	// changing these a lot)


goal = {
	title: "Computer Science",
	type: "major",
	college: "SE",
	items: 
	[
		{//the first requirement
			title: "Math",
			//optional elements
			subtitle: "This is optional",
			details: "This is also optional",

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
		
};