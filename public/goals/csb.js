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
            'validator': function() {
                var calcTrack = this.complete(1, this.has('MATH 150A', 'MATH 150B', 'MATH 170', 'MATH 175'), this.has('MATH 155A', 'MATH 155B', 'MATH 175'), this.has('MATH 155A', 'MATH 155B', 'MATH 205A', 'MATH 205B')),
                    linearAlgebra = this.countCourses('MATH 194', 'MATH 204', 'MATH 205B') === 1,
                    stats = this.countCourses('MATH 216', 'MATH 218', 'MATH 247') === 1,
                    elective = this.hoursQuery('MATH 198', 'MATH 200', 'MATH 208+') === 3;

                return calcTrack && linearAlgebra && stats && elective;

            }
        },
        {
            "title": "Basic Science Sequence",
            "courses": "You are required to fulfill a sequence of science courses",
            "details": "More elaboration here",
            "courses": ["BSCI 100", "BSCI 110A", "BSCI 110B", "BSCI 111A", "BSCI 111B", "BSCI 218", "BSCI 219", "CHEM 102A", "CHEM 102B", "CHEM 104A", "CHEM 104B", "EES 101", "EES 111", "MSE 150", "PHY 116A", "PHY 116B", "PHY 118A", "PHY 118B"],
            "validator": function() {
                return this.complete(1, this.has('BSCI 110A', 'BSCI 110B', 'BSCI 111A', 'BSCI 111B'), this.has('BSCI 100', 'BSCI 218', 'BSCI 219'), this.has('CHEM 102A', 'CHEM 102B', 'CHEM 104A', 'CHEM 104B'), this.has('EES 101', 'EES 111'), this.has('MSE 150'), this.has('PHY 116A', 'PHY 116B', 'PHY 118A', 'PHY 118B'));
            }
        },
        {
            'title': 
            'courses':
            'validator':
            'onSuccess':
            'onFailure':
        }
    ]
}