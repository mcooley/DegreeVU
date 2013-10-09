//Brendan McNamara
//last modified: 10/8/2013
// page 317


//WHAT IS EXPECTED OF A GOAL
	// - either take or takeHours is defined per goal, never both
	// - items in a Goal should be ordered by importance, so the 
	// first element in the array is the most important requirement
	// to satsify
	// - the root-level items must be objects, not strings
	// - must set the goal object to global variable 'goal' like below
	// - at the top of the file, should include the last modified date and your name,
	// and the page number the goal exists within the course catalog
//TIPS
	// - the root-level items (the ones that are nested directly inside the goal) should have 
	// elaborate details on the requirements 
	// - add lots of comments in the code so it is easier to read the requirement, in case something 
	// needs to be changed by someone who didn't write the goal (chances are that we are going to be 
	// changing these a lot)

goal = {
	title: 'Computer Science',
	//type can be 'major', 'minor', 'graduation'...
	type: 'major',
	// college abbreviation, always a 2 letter acronym
	// SE = "School of Engineering"
	// AS = "College of Arts and Science"
	// BL = "Blair School of Music"
	// PB = "Peabody College"
	college: 'SE',

	//root-level items: should always be an array of Objects
	//should order the items in importance for satisfying the major,
	//since the goal is validated in this order
	//this is most-likely the order they exist in the catalog
	//DO NOT INCLUDE LIBERAL ARTS CORE IN THE REQUIREMENTS HERE
	//DO NOT INCLUDE INTRODUCTION TO ENGINEERING
	//root-level requirements = elaborate details
	//root-level items are assumed to be 'take all', no need to specify
	items: [
		{ //ROOT-ITEM 1

			//EVERY REQUIREMENT NEEDS A TITLE, EVEN NESTED ONES
			//this is partially used for debugging and better error messages
			title: "Mathematics (20-22 hours)",
			//a brief, 1 sentence description of the Requirement
			//every root-level Requirement needs a subtitle
			subtitle: "Includes a calculus sequence, linear algebra, statistics, and an elective math course",
			//detailed explanation of how to satisfy the Requirement
			//every root-level requirement needs details
			//BUG HERE: MATH 205 clearly can be overlapping two different math requirements
			details: "In order to satisfy the Mathematics Requirement, a calculus sequence must be taken.  Calculus sequence 1: MATH 150A, MATH 150B, MATH 170, MATH 175.  Calculus Sequence 2: MATH 155A, MATH 155B, MATH 175. Calculus Sequence 3: MATH 155A MATH 155B, MATH 205A, MATH 205B.  In addition, a linear algebra course must be taken, either MATH 194, MATH 204, or MATH 205B.  A statistics course must be satisfied, either MATH 216, MATH 218, or MATH 247.  Finally, a math elective, 1 course of either MATH 198, MATH 200, or any math course number 208 or above.",
			
			take: 'all',

			items: [
				{ //calc
					title: 'Calculus Sequence (11-16 hours)',
					//only 1 calc sequence needed
					take: 1,
					items: [
						{ //seq1
							title: 'Calc Sequence 1',
							
							take: 'all',
							//leaf-requirement contains course code strings
							//watch out for spelling
							items: ["MATH 150A", "MATH 150B", "MATH 170", "MATH 175"]
						},
						{
							title: 'Calc Sequence 2',
							take: 'all',
							items: ["MATH 155A", "MATH 155B", "MATH 175"]
						},
						{
							title: 'Calc Sequence 3',
							take: 'all',
							items: ["MATH 155A", "MATH 155B", "MATH 205A", "MATH 205B"]
						}
					]
				},
				{
					title: 'Linear Algebra (3-4 hours)',
					take: 1,
					items: ["MATH 194", "MATH 205", "MATH 205B"]
				},
				{
					title: 'Statistics (3 hours)',
					take: 1,
					items: ["MATH 216", "MATH 218", "MATH 247"]
				},
				{
					title: 'Elective Math Course (3 hours)',
					takeHours: 3,
					items: ["MATH 198", "MATH 200", "MATH 208+"]
				}
			]
		},

		{ //ROOT-ITEM 2: SHOULD ALWAYS LABEL ROOT ITEMS USING COMMENTS, THEY SHOULD BE EASY TO FIND
			title: "Science Sequence (12 hours)",
			subtitle: "You must complete a Science Sequence.  At least 1 sequence must be satisfied.  Biology Sequence 1: BSCI 110A-B, BSCI 111A-B.  Biology Sequence 2: BSCI 100, 218, and 219. Chemisty Sequence: CHEM 102A-B, CHEM 104A-B.  Earth and Environmental Science: EES 101, EES 111. Material Science and Engineering: MSE 150.  Physics Sequence: PHYS 116A-B, PHYS 118A-B. It is recommended for computer science major to take Chemistry or Physics."
			details: "",
			take: 1,
			items: [
				{
					title: "Biology Sequence 1",
					take: 'all',
					items: ["BSCI 110A", "BSCI 110B", "BSCI 111A", "BSCI 111B"]
				},
				{
					title: "Biology Sequence 2",
					take: 'all',
					items: ["BSCI 100", "BSCI 218", "BSCI 219"]
				},
				{
					title: "Chemistry Sequence",
					take: 'all',
					items: ["CHEM 102A", "CHEM 104A", "CHEM 102B", "CHEM 104B"]
				},
				{
					title: "Earth and Environmental Science Sequence",
					take: 'all',
					items: ["EES 101", "EES 111"]
				},
				{
					title: "Material Science and Engineering",
					take: 'all',
					items: ["MSE 150"]
				},
				{
					title: "Physics Sequence",
					take: 'all',
					items: ["PHYS 116A", "PHYS 116B", "PHYS 118A", "PHYS 118B"]
				}
			]
		},
		{ //ROOT-REQUIREMENT 3
			title: "Computer Science Core Curriculum (28 hours)",
			subtitle: "You must fulfill all the fundamental Computer Science courses within the curriculum",
			details: "The Computer Science Core Curriculum includes CS 101, CS 201, CS 251, CS 270, EECE 116, EECE 116L, CS 231, CS 281, CS 212, and CS 250",
			take: 'all',
			items: ["CS 101", "CS 201", "CS 251", "CS 270", "EECE 116", "EECE 116L", "CS 231", "CS 281", "CS 212", "CS 250"]
		},
		{ //ROOT-REQUIREMENT 4
			title: "Computer Science Depth (12 hours)",
			subtitle: "You must fulfill a more advanced set of computer science courses",
			details: "Computer Science Depth courses can be chosen from any course label CS 240 or higher. They may also include EECE 253, 254, or 276.  You may also choose from at most 2 of the following Math Courses: MATH 226, MATH 253, MATH 286, or MATH 288.  In addition, at least 1 computer science course must be a project course.  Here are the following project courses for Computer Science: CS 258, 265, 274, 276, 279, 282, 283, 284, 285.  In total, 12 hours of Computer Science depth most be satisfied following these criteria.",
			//if you have a takeHours requirement, then this tallies the total 
			//hours satisfied within sub-requirements
			takeHours: 12,
			//mandate makes a sub-requirement with the given title mandatory to take,
			//make sure that the title has correct spelling and spacing, best to just copy
			//and pase the title into mandate.  So this requirement is not complete unless at least
			//the mandated courses confirm that they have been completed.  You can only mandate an item
			//that is within the items of this item
			mandate: ["Project Computer Science Courses"],
			items: [
				{ 
					title: "Project Computer Science Courses",
					takeHours: 3,
					//there are no max hours here since this person can take more than 1
					//project course and have it count
					items: ["CS 258", "CS 265", "CS 269", "CS 274", "CS 276", "CS 279", "CS 282", "CS 283", "CS 284", "CS 285"]
				},
				{
					title: "Math Depth Courses",
					takeHours: 0,
					//the maxHours flag makes it so that these are the maximum number of hours
					//that this requirement can satsify.  This when the parent Requirement is trying
					//to calculate something like the total number of hours within sub-requirements,
					//and it needs to make sure not to count too many hours for a single requirement
					maxHours: 6,
					items: ["MATH 226", "MATH 253", "MATH 286", "MATH 288"]
				},
				{
					title: "Advanced Computer Science Courses",
					//make sure not to count project courses or core curriculum computer science courses,
					//such as cs 250
					items: ["CS 240+", "!CS 250", "!CS 251", "!CS 270", "!CS 281", "!CS 248", "!CS 265", "!CS 269", "!CS 274", "!CS 276", "!CS 279", "!CS 282", "!CS 283", "!CS 284", "!CS 285"],
					//setting takeHours to 0 since this item is only here to help tally
					//up the hours for the parent requirement
					takeHours: 0
				},
				{
					title: "EECE courses",
					items: ["EECE 253", "EECE 254", "EECE 276"],
					takeHours: 0
				}
			]
		},
		{//ROOT-REQUIREMENT 5
			title: "Technical Elevtives",
			subtitle: "Must take a total of 6 hours of courses deemed technical courses for computer science",
			details: "You may take courses numbered CS 240 or higher, courses within the school of engineering but outside if computer science number 200 or higher, or from sciences within the College of Arts and Science numbered 200 or higher that are listed in the mathematics and naturals sciences (MNS) distribution requirements in AXLE",
			takeHours: 6,
			items: ["CS 240+", "!CS 250", "!CS 251" "!CS 270", "!CS 281", "SE^ & !CS*", "MNS~"]

		},
		{//ROOT-REQUIREMENT 6
			title: "Computer Ethics (3 hours)",
			subtitle: "Must take 1 course related to Ethics.",
			details: "You must either take CS 151, or PHIL 105",
			take: 1,
			items: ["CS 151", "PHIL 105"]
		},
		{
			title: "Writing Component (3 hours)",
			subtitle: "Must take a writing course",
			details: "Must take 1 course that is labeled as W",
			takeHours 3,
			items: ["W$"]
		}
	]
};