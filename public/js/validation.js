//dependencies include:
    //currentTheme global object
    //underscore library


//for testing
var currentTheme = 'StarWars';

//actual implementation

(function(global) {

    //global bundle
    global.ValidationBundle = {};

    //themes for validation messages
    //could also use themes to change the background colors and 
    //images of the page, or messages that appear when validation
    //succeeds or fails.  Maybe a good idea to move themes outside
    //of validation bundle and put them somewhere else
    ValidationBundle.Themes = ['Default' ,'Pirate' ,'StarWars', 'Surfer'];

    //general types of goals
    ValidationBundle.GoalTypes = ["Major", "Minor", "Degree", "Graduation"]
    //can put the standard validators here
    ValidationBundle.StdValidators = [];
    //stores requirements that can be shared and
    //re-used between multiple goals, such as the 
    //requirement for Engineering Modules
    ValidationBundle.StdRequirements = [];

    //group of functions that can help validate completion
    //of validations and goals
    ValidationBundle.Helper = {};

    //the constructor for a Goal
    ValidationBundle.Goal = (function(theme) {

        //reference to the function space
        //for adding methods and properties
        //here
        var closure = this,
        //private variables for Goal
        //instance and their default values

        //the name of the goal
            name = "",
        //the type of the goal, which is from the list of 
        //goal types
            type = "Major",
        //requirements are the sub-routines
        //of a validation... for example, the engineering
        //module is a requirement of the the Computer
        //Science major
            requirements = [],
        //count is the number of requirements
            count = 0,
        //count of the requirements that have been completed
            completionCount = 0,
        //message that shows up when the 
        //validation for the goal has been satisfied
        //this is an object that contains messages for multiple 
        //themes, if a theme is selected that does not
        //exist in the completion message, then the default
        //theme is used, below are the default completion messages
        //custom ones can be created for specific goals
            completionMessage = {
                Default: "You have finished all your requirements",
                StarWars: "The force is strong with this one",
                Pirates: "Arrrgh!",
                Surfer: "Rock on Dude!"
            }; 

        //returns a constructor for the goal
        //so to instantiate a goal object, 
        //simply do 'new ValidationBundle.Goal()'
        //with the options passed in as the parameter
        return function(options) {
            if (options) {
                name = options.name || name;
                type = options.type || type;
                requirements = options.requirements || requirements;
                count = options.count || count;
                completionMessage = options.completionMessage || completionMessage;
            }
            //add methods here
            this.getName = function() {
                return name;
            };
            this.getType = function() {
                return type;
            };
            this.getRequirements = function() {
                return [].slice.call(requirements);
            };
            this.getCount = function() {
                return count;
            };
            this.isComplete = function() {
                return count === completionCount;
            };
            this.message = function() {
                
                return (completionMessage[theme] === undefined) ? completionMessage['Default'] : completionMessage[theme];
            };

        };

    //assuming there is a currentTheme
    //variable in the global namespace to extract
    //the theme before the instance is created without
    //having to go in manually and set themes
    })(global.currentTheme);


    //constructor for helper methods in validating
    //this object is automatically bound to validate methods
    //within a requirement
    ValidationHelper = function() {
        //check for new keyword
        if (!(this instanceof ValidationHelper)) {
            return new ValidationHelper();
        }
    };

    //the constructor for a Requirement
    //EVENTUALLY CHANGE THIS TO TAKE ACTUAL BACKBONE COURSES
    //INSTEAD OF JUST COURSE CODES
    ValidationBundle.Requirement = (function(theme) {
        //private variables and default values

        var name = "",

            description = "",
            //list of all courses that are relevant
            //to this requirement.  This list never changes
            //after it has been initialized. Array of courseCode strings
            relevantCourses = [],
            //list of courses that still need to be taken.
            //when first initialized, this list contains the same list of
            //courses as the relevant courses list
            remainingCourses = [],
            //the function that is called to check for validation
            //this function.  Returns true if the requirements are
            //complete and false if the requirements are not complete
            validate = function() {
                return true;
            },
            
            onSuccess = {
                Default: "You have completed this requirement",
                StarWars: "Completed this requirement you have",
                Pirate: "Drinks all around, me matey!",
                Surfer: "Duuuuuuude! You're killin' it braw!!"
            },
            onFailure = {
                Default: "You have not completed this requirement",
                StarWars: "More you must do, young Jedi",
                Pirate: "Aaargh! Walk the plank!",
                Surfer: "Not chill braw!"
            },

            helper = new ValidationHelper(),

            //regex strings to parse the course code

            //checks to see if there is a plus at the end of the course code
            plusRegexp = /.+\+$/g,
            //checks for dollar sign at end of course code
            dollarRegexp = /.+\$$/g;

        //private helper methods, private methods
        //should be bound to the object when they
        //are called for execution to work correctly

        //this method takes the courseCode and converts
        //it into a method that can be used
        //to validate the method was selected
        function validationFactory(courseCode) {
            //remove all whitespace from courseCode
            var i,
                n = courseCode.length
                methodCode = "";

            //should do more checks and modifications of the 
            //course code
            for (i =0; i < n; ++i) {
                if (courseCode.charAt(i) !== ' ') {
                    methodCode = methodCode + courseCode.charAt(i);
                }
            }
            //deposit method into the
            //private namespace for local
            //access only and acces by 
            //custom validate method
            this[methodCode] = function() {
                var n = remainingCourses.length,
                    i;
                for (i = 0; i < n; ++i) {
                   
                    if (remainingCourses[i] === courseCode) {
                        return false;
                    }
                }
                return true;
 
            }
        };
        //this method takes a course code and converts it into
        //a method that can be used to get the hours of the course
        function hoursFactory(courseCode) {

        };

        //CONSTRUCTOR
        return function(options) {
            var i, n;
            //set the options
            if (options) {
                name = options.name || name;
                description = options.description || description;
                relevantCourses = options.relevantCourses || relevantCourses;
                remainingCourses = [].slice.call(relevantCourses);
            
                validate = options.validate.bind(helper) || validate;
                
                
                onSuccess = options.onSuccess || onSuccess;
                onFailure = options.onFailure || onFailure;


                //set properties of helper so 
                //the validate method has access to some
                //additional properties
                helper.courses = relevantCourses.slice();
            }

            //set up dynamic binding of validation methods
            for (i = 0, n = relevantCourses.length; i < n; ++i) {
                validationFactory.call(helper, relevantCourses[i]);
            }
            this.getName = function() {
                return name;
            };
            //adds the course to the list of courses
            //taken.  If the course that is added is not
            //relevant to the requirement, nothing happens 
            //and the course is not added.  Note that if
            //course is an array, the array will be manipulated
            this.add = function(course) {
               
                var i, j, 
                    n = remainingCourses.length,
                    length, done;
                if (typeof course === 'string') {
                    console.log("String");
                    for (i = 0; i < n; ++i) {
                        
                        if (remainingCourses[i] === course) {
                            remainingCourses = remainingCourses.slice(0, i).concat(remainingCourses.slice(i+1, n));
                            console.log(remainingCourses);
                            return;
                        }
                    }
                } else if (Array.isArray(course)) {
                    course.forEach(function(course) {
                        
                        this.add(course);
                    }.bind(this));
                }
                
            };
            //removes all courses from the requirement
            this.resetCourses = function() {
                remainingCourses = relevantCourses.slice();
            };
            //if the course being removed cannot 
            //be found, then this method does nothing
            this.removeCourse = function(course) {

            };

            this.isComplete = function() {
                return validate();
            };
            //displays the message for the completion
            //of the courses, with the correct theme
            this.message = function() {
                if (this.isComplete()) {
                    return (onSuccess[theme] === undefined) ? onSuccess['Default'] : onSuccess[theme];
                } else {
                    return (onFailure[theme] === undefined) ? onFailure['Default'] : onFailure[theme];
                }
            };
            this.remainingCourses = function() {
                return [].slice.call(remainingCourses);
            };
            this.takenCourses = function() {
                return _.difference(relevantCourses, remainingCourses);
            };
            this.allCourses = function() {
                return [].slice.call(relevantCourses);
            };
            this.isRelevantCourse = function(courseCode) {

            };



        };

    //prototype methods for validation helper

    //for the requirement constructor
    })(global.currentTheme);

    //helper methods for validation
    //can pass in a single course code or an array of course codes
    ValidationHelper.prototype.isTaken = function(courses) {
        console.log("isTaken was called");
    };

    //can pass in a single course code or an array of course codes
    ValidationHelper.prototype.hours = function(courses) {
        console.log("Hours was called");
    };



})(this);

