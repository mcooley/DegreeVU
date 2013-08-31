//this is a raw file that is converted to JSON by importing it
//to the /goals extension to the degreeVU url

goal = {
	name: "Computer Science",
	type: 'major',
	school: 'School of Engineering',
	items: [
		{ //0
            title: "Mathematics sequence (20-22 hours)",
            description: "You must take a calculus sequence, a linear algebra course, a statistics course, and a math electives course.",
            details: "Here is where you can elaborate the details",
            courses: ["MATH 150A", "MATH 150B", "MATH 155A", "MATH 155B", "MATH 170", "MATH 175", "MATH 194", "MATH 198", "MATH 200", "MATH 204", "MATH 205A", "MATH 205B", "MATH 208+"],
            defineSets: function (state) {
            	state.pushSet('MATH 150A', 'MATH 150B', 'MATH 170', 'MATH 175')
            		.pushSet('MATH 155A', 'MATH 155B', 'MATH 175')
            		.pushSet('MATH 155A', 'MATH 155B', 'MATH 205A', 'MATH 205B')
            		.pushSet('MATH 194', 'MATH 204', 'MATH 205B').mandate()
            		.pushSet('MATH 216', 'MATH 218', 'MATH 247').mandate()
            		.pushSet('MATH 198', 'MATH 200', 'MATH 208+').mandate();
            },
            validator: function (state) {
            	state.completeSet(0)
            		.completeSet(1)
            		.completeSet(2)
            		.coursesForSet(3).is(1)
            		.coursesForSet(4).is(1)
            		.hoursForSet(5).is(3);

            	state.complete(4);
            }
        },
        { //1
            title: "Basic Science Sequence (12 hours)",
            description: "You are required to fulfill a sequence of science courses.",
            details: "More elaboration here",
            courses: ["BSCI 100", "BSCI 110A", "BSCI 110B", "BSCI 111A", "BSCI 111B", "BSCI 218", "BSCI 219", "CHEM 102A", "CHEM 102B", "CHEM 104A", "CHEM 104B", "EES 101", "EES 111", "MSE 150", "PHY 116A", "PHY 116B", "PHY 118A", "PHY 118B"],
            defineSets: function(state) {
            	state.pushSet('BSCI 110A', 'BSCI 110B', 'BSCI 111A', 'BSCI 111B')
	            	.pushSet('BSCI 100', 'BSCI 218', 'BSCI 219')
	            	.pushSet('CHEM 102A', 'CHEM 102B', 'CHEM 104A', 'CHEM 104B')
	            	.pushSet('EES 101',' EES 111')
	            	.pushSet('MSE 150')
	            	.pushSet('PHYS 116A', 'PHYS 116B','PHYS 118A', 'PHYS 118B');
            },
            validator: function(state) {
            	state.completeSet();
            	state.complete(1);
            }
        },
        { //2
            title: "Computer Science Core (28 hours)",
            description: "You must complete the core requirements for the CS Major",
            details: "Elaborate here",
            courses: ["CS 101", "CS 201", "CS 212", "CS 250", "CS 251", "CS 270", "CS 281", "EECE 116", "EECE 116L"],
            defineSets: singleSet,
            validator: StdValidator.takeAll
        },
        { //3
            title: "Computer Science Depth (12 hours)",
            description: "In depth courses related to computer science",
            courses: ["CS 240+", diff(2), "EECE 253", "EECE 254", "EECE 276", "MATH 226", "MATH 253", "MATH 286", "MATH 288"],
            details: "Elaborate here",
            defineSets: singleSet,
            validator: StdValidator.takeCourses(3)
        },
        { //4
            title: "Computer Ethics",
            description: "You must take 3 hours towards ethics",
            details: "No further details needed",
            courses: ["CS 151", "PHIL 105"],
            defineSets: singleSet,
            validator: StdValidator.takeHours(3)
        }
	]
};

{
    calculus: [
        seq1: {
            courses: [],
            validate: function() {

            }
        },

    ]
}
//remove repeating courses from previous course lists

//1) Flash for satsified requirements
//2) requirement hierarchy 
