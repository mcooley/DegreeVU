{
    'name': 'Computer Science Major',
    'type': 'major',
    'school': 'School of Engineering',
    'items': [
        {
            'title': 'Mathematics sequence.',
            'comment': 'You must take a calculus sequence, a linear algebra course, a statistics course, and a math electives course.',
            'details': 'Here is where you can elaborate the details',
            'courses': ['MATH 150A', 'MATH 150B', 'MATH 155A', 'MATH 155B', 'MATH 170', 'MATH 175','MATH 194', 'MATH 198', 'MATH 200', 'MATH 204', 'MATH 205A', 'MATH 205B', 'MATH 208+'],
            'validator': function(state) {
                /*
                var calcTrack = this.complete(1, this.has('MATH 150A', 'MATH 150B', 'MATH 170', 'MATH 175'), this.has('MATH 155A', 'MATH 155B', 'MATH 175'), this.has('MATH 155A', 'MATH 155B', 'MATH 205A', 'MATH 205B')),
                    linearAlgebra = this.countCourses('MATH 194', 'MATH 204', 'MATH 205B') === 1,
                    stats = this.countCourses('MATH 216', 'MATH 218', 'MATH 247') === 1,
                    elective = this.hoursQuery('MATH 198', 'MATH 200', 'MATH 208+') === 3;
                */
                state.pushSet('MATH 150A', 'MATH 150B', 'MATH 170', 'MATH 175')
                    .pushSet('MATH 155A', 'MATH 155B', 'MATH 175')
                    .pushSet('MATH 155A', 'MATH 155B', 'MATH 205A', 'MATH 205B')
                    .pushSet('MATH 194', 'MATH 204', 'MATH 205B').mandate()
                    .pushSet('MATH 216', 'MATH 218', 'MATH 247').mandate()
                    .pushSet('MATH 198', 'MATH 200', 'MATH 208+').mandate();

                state.completeSet(0).completeSet(1).completeSet(2)
                    .coursesForSet(3).is(1)
                    .coursesForSet(4).is(1)
                    .hoursForSet(5).is(3);

                state.complete(4);
                
                return state.isComplete();

            }
        },
        {
            "title": "Basic Science Sequence",
            "courses": "You are required to fulfill a sequence of science courses",
            "details": "More elaboration here",
            "courses": ["BSCI 100", "BSCI 110A", "BSCI 110B", "BSCI 111A", "BSCI 111B", "BSCI 218", "BSCI 219", "CHEM 102A", "CHEM 102B", "CHEM 104A", "CHEM 104B", "EES 101", "EES 111", "MSE 150", "PHY 116A", "PHY 116B", "PHY 118A", "PHY 118B"],
            "validator": function() {
                return this.complete(1, 
                        this.has('BSCI 110A', 'BSCI 110B', 'BSCI 111A', 'BSCI 111B'), 
                        this.has('BSCI 100', 'BSCI 218', 'BSCI 219'), 
                        this.has('CHEM 102A', 'CHEM 102B', 'CHEM 104A', 'CHEM 104B'), 
                        this.has('EES 101', 'EES 111'), 
                        this.has('MSE 150'), 
                        this.has('PHY 116A', 'PHY 116B', 'PHY 118A', 'PHY 118B'));

                state.pushSet('BSCI 110A', 'BSCI 110B', 'BSCI 111A', 'BSCI 111B')
                    .pushSet('BSCI 100', 'BSCI 218', 'BSCI 219')
                    .pushSet('CHEM 102A', 'CHEM 102B', 'CHEM 104A', 'CHEM 104B')
                    .pushSet('EES 101',' EES 111')
                    .pushSet('MSE 150')
                    .pushSet('PHYS 116A', 'PHYS 116B','PHY 118A', 'PHY 118B');

                state.completeSet();

                state.complete(1);
                return state.isComplete();
            }
        },
        {
            "title": "Computer Science Core",
            "comments": "You must complete the core requirements for the CS Major",
            "details": "Elaborate here",
            "courses": ["CS 101", "CS 201", "CS 212", "CS 250", "CS 251", "CS 270", "CS 281", "EECE 116", "EECE 116L"],
            "validator": "StdValidator.takeAll"
        },
        {
            "title": "Computer Science Depth",
            "comments": "In depth courses related to computer science",
            "courses": ["CS 240+", "EECE 253", "EECE 254", "EECE 276", "MATH 226", "MATH 253", "MATH 286", "MATH 288"]
            "details": "Elaborate here",
            "validator": function() {
                return this.countHours.apply(this, this.courses) >= 12 && this.countCourses('CS 258','CS 265' 'CS 269', 'CS 274', 'CS 276', 'CS 279', 'CS 282', 'CS 283', 'CS 284', 'CS 285') >= 1;
            }
        },
        {
            "title": "Computer Science Core",
            "courses": 
            "details":
            "validator":
        }
    ]
}