//dependencies include:
    //currentTheme global object
    //underscore library


//for testing
var currentTheme = {};

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
    ValidationBundle.StdValidator = {
        takeAll: function() {
            return function() {
                return this.remainingCourses().length === 0;
            };
        },
        takeNumber: function(number) {
            return function() {
                return this.takenCourses().length >= number;
            }
        },
        takeHours: function(hours) {
            return function() {
                return true; //for now
            }
        }
    };
    //stores requirements that can be shared and
    //re-used between multiple goals, such as the 
    //requirement for Engineering Modules
    ValidationBundle.StdRequirements = [];

    //group of functions that can help validate completion
    //of validations and goals
    ValidationBundle.Helper = {};

    //the constructor for a Goal
    //CONVERT TO BACKBONE MODEL
    ValidationBundle.Goal = (function(theme) {

        //private variables for Goal
        //instance and their default values

        //the name of the goal
        var name = "",
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
        return Backbone.Model.extend({
            initialize: function(options) {
                
                if (options) {
                    this.set('name', options.name || name);
                    this.set('type', options.type || type);
                    requirements = options.requirements || requirements;
                    count = options.count || count;
                    completionMessage = options.completionMessage || completionMessage;
                }
            },
            getName: function() {
                return this.get('name');
            },
            getRequirements: function() {
                return [].slice.call(requirements);
            },
            requirementsCount: function() {
                return count;
            },
            completedRequirementsCount: function() {
                return completionCount;
            },
            isComplete: function() {
                return count === completionCount;
            },
            message: function() {
                return (completionMessage[theme] === undefined) ? completionMessage['Default'] : completionMessage[theme];
            }
        });

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
            courses = [],
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

        function validationFactory() {
            var i, n, prefixes = [], prefixPattern = /[a-z]+/i, nextPattern, j, length, exist;
            for (i = 0, n = courses.length; i < n; ++i) {

                //create individual course methods
                courseCodeFactory.call(helper, courses[i]);

                //locate all the prefixes for the course codes
                if (i === 0) {
                    prefixes.push(prefixPattern.exec(courses[i]).toString());
                } else {
                    for (j = 0, length = prefixes.length, exist = false, nextPattern = prefixPattern.exec(courses[i]).toString(); j < length && !exist; ++j) {
                        //convert object to string for comparison
                        if (prefixes[j] === nextPattern) {
                            
                            exist = true;
                        }
                    }
                    if (!exist) {
                        prefixes.push(nextPattern);
                    }
                }
            }

            for (i = 0, length = prefixes.length; i < length; ++i) {

                helper[prefixes[i]] = (function(prefix) {

                    //use the immediately executing function to lock in
                    //the prefix

                    return function(courseNumber) {
        
                        var courseCount = 0, 
                            takenCourses = helper.takenCourses(),
                            i, n
                            prefixPattern = /[a-z]+/i,
                            numberPattern = /\d+/i;

                        if (typeof courseNumber === 'number') {
                            for (i = 0, n = takenCourses.length; i < n; ++i) {
                                //check for the prefix
                                if (prefixPattern.exec(takenCourses[i]).toString() === prefix) {
                                    //check for the number
                                    if (+numberPattern.exec(takenCourses[i]) >= courseNumber) {
                                        courseCount++;
                                    }
                                }
                            }
                        } else {
                            
                            for (i = 0, n = takenCourses.length; i < n; ++i) {
                                
                                if (prefixPattern.exec(takenCourses[i]).toString() === prefix) {
                                    courseCount++;
                                }
                            }
                        }
                        return courseCount;
                    };


                })(prefixes[i]);
            }
        };
        //this method takes the courseCode and converts
        //it into a method that can be used
        //to validate the method was selected
        function courseCodeFactory(courseCode) {
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
        

        //CONSTRUCTOR
        return function(options) {
            var i, n;
            //set the options
            if (options) {
                name = options.name || name;
                description = options.description || description;
                courses = options.courses || courses;
                remainingCourses = [].slice.call(courses);
            
                validate = options.validate.bind(helper) || validate;
                
                
                onSuccess = options.onSuccess || onSuccess;
                onFailure = options.onFailure || onFailure;


                //set properties of helper so 
                //the validate method has access to some
                //additional properties
                helper.courses = function() {
                    return courses.slice();
                };
                helper.remainingCourses = function() {
                    return remainingCourses.slice();
                };

                helper.takenCourses = function() {
                    return _.difference(courses, remainingCourses);
                };
            }

            //set up dynamic binding of validation methods
            //validation factory should be called after the 
            //helper properties are set
            validationFactory();

            
            this.name = function() {
                return name;
            };
            this.description = function() {
                return description;
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
                    
                    for (i = 0; i < n; ++i) {
                        
                        if (remainingCourses[i] === course) {
                            remainingCourses = remainingCourses.slice(0, i).concat(remainingCourses.slice(i+1, n));
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
                remainingCourses = courses.slice();
            };
            //if the course being removed cannot 
            //be found, then this method does nothing
            this.remove = function(course) {
                var i, n, found;
                if (typeof course === "string") {
                    if (this.isCourse(course)) {
                        //check to see if the course is already in the list of remaining courses
                        for (i = 0, n = remainingCourses.length, found = false; i < n && !found; ++i) {
                            if (remainingCourses[i] === course) {
                                found = true;
                            }
                        }
                        if (!found) {
                            remainingCourses.push(course);
                        }
                    }
                } else if (Array.isArray(course)) {
                    course.forEach(function(course) {
                        this.remove(course);
                    }.bind(this));
                }
                
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
                return _.difference(courses, remainingCourses);
            };
            this.allCourses = function() {
                return [].slice.call(courses);
            };
            this.isCourse = function(courseCode) {
                var i,n;
                for (i = 0, n = courses.length; i < n; ++i) {
                    if (courses[i] === courseCode) {
                        return true;
                    }
                }
                return false;
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

