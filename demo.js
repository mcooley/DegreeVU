//this demo does not work yet because validation is not finished
//this is a sample object that is submitted for validation
{
    name: 'Computer Science Major',
    type: 'Major',
    //sub requirements of a goal
    requirements:
    [   
        {

            name: 'Random Requirements',
            description: 'You must take CS 101, 3 classes above CS 240, and 2 neuroscience classes.',
            //set of courses that need to be fulfilled
            //all course codes are made to be case and white space insensitive, to
            //reduce the number of errors generated when creating validation
            courses: ['CS 101', 'CS 240+', 'NSC*'],
            //validation made easy with a ValidationHelper object that is 
            //bound to validation for quick access.  ValidationHelper
            //comes with a set of premade methods and another set of 
            //dynamically bound methods for straight forward validation
            //functions
            validate: function() {
                return this.CS101() && this.CS(240) >= 3 && this.NSC() >= 2;
            },
            onSuccess: {
                Default: 'You have completed this random requirement',
                StarWars: 'You are learning well, young jedi',
                Pirate: 'Good job, me matey!'
            },
            onFailure: {
                Default: 'You have not completed this random requirement',
                StarWars: 'More classes you must take',
                Pirate: 'Walk the plank!'
            }
        },
        {
            name: 'More randomness',
            description: 'You must complete 10 hours of PSY courses above 200.  You must also do at least 2 of the following: take 2 CS classes; take BSCI 110a, BSCI 110b, PSY 101, and NSC 201; or take any 3 classes of NSC except NSC 216',
            //validation is setup and helper methods are customized for each requirement to make the job
            //of validation as easy as possible
            validate: function() {
                //underscore in a method name indicates hours
                return this._PSY(200) >= 10 && this.complete(2, this.CS() >= 2, this.take('BSCI 110a', 'BSCI 110b', 'PSY 101', 'NSC 201'), this.NSC() >=3);
            }
            //the onSuccess and onFailure objects
            //can be omitted, which will cause the requirement to pick up generic default values
        }
    ],
    message: {
        Default: "You have completed the computer science major",
        StarWars: 'Completed the computer science major you have!',
        Pirate: 'Aaaaargh!'
    }

}

//cases that validation needs to handle
// 1) tell if a class is selected 
// 2) group classes into custom sets
// 3) tell if a certain number of hours are completed in a set
// 4) tell if a certain number of classes are completed in a set
// 5) group sets into larger sets and perform hours and class checks on larger sets
// 6) tell if a class is used to satisfy another requirement (for cases where classes need to be exclusively selected for certain requirements)

