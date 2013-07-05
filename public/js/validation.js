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

        

        //returns a Backbone constructor
        // for the goal
        //so to instantiate a goal object, 
        //simply do 'new ValidationBundle.Goal()'
        //with the options passed in as the parameter
        return Backbone.Model.extend({
            initialize: function(options) {
                if (!options) {
                    throw new Error('Must defined options for the goal object')
                }
                
                    
                //private variables
                //the name of the goal
                this.set('name', options.name || "");
                 //the type of the goal, which is from the list of 
                //goal types
                this.set('type', options.type || "Major");
                //requirements are the sub-routines
                //of a validation... for example, the engineering
                //module is a requirement of the the Computer
                //Science major
                this.set('requirements', options.requirements || []);
                //count is the number of requirements
                this.set('count', options.requirements.length || 0);
                //count of the requirements that have been completed
                this.set('completionCount', 0);
                //message that shows up when the 
                //validation for the goal has been satisfied
                //this is an object that contains messages for multiple 
                //themes, if a theme is selected that does not
                //exist in the completion message, then the default
                //theme is used, below are the default completion messages
                //custom ones can be created for specific goals
                this.set('completionMessage', options.completionMessage || {
                                                                        Default: "You have finished all your requirements",
                                                                        StarWars: "The force is strong with this one",
                                                                        Pirates: "Arrrgh!",
                                                                        Surfer: "Rock on Dude!"
                                                                    });
            },
            getName: function() {
                return this.get('name');
            },
            getReqs: function() {
                //copy 
                return this.get('requirements').slice();
            },
            isComplete: function() {
                return this.get('count') === this.get('completionCount');
            },
            //completion message for goal
            message: function() {
                return (completionMessage[theme] === undefined) ? completionMessage['Default'] : completionMessage[theme];
            },
            //returns the completion message for the requirement in the
            //specified index
            messageForReq: function(index) {
                return this.get('requirements')[i].message();
            },
            //eventaully change to use isCourse before using addCourse
            add: function(course) {
                var i, n, complete, requirements = this.get('requirements');
                if (typeof course === 'string') {

                    for (i = 0, n = requirements.length; i < n; ++i) {
                        complete = requirements[i].isComplete();
                        requirements[i].add(course);
                        
                        if (complete !== requirements[i].isComplete()) {
                            this.set('completionCount', this.get('completionCount') + 1);
                        }
                    }
        
                } else if (Array.isArray(course)) {
                    for (i = 0, n = course.length; i < n; ++i) {
                        
                        this.add(course[i]);
                    }
                }
                
            },
            remove: function(course) {
                var i, n, complete, requirements = this.get('requirements');
                if (typeof course === 'string') {
                    for (i = 0, n = requirements.length; i < n; ++i) {
                        complete = requirements[i].isComplete();
                        requirements[i].remove(course);
                        if (complete != requirements[i].isComplete()) {
                            completionCount--;
                        }
                    }
                } else if (Array.isArray(course)) {
                    for (i = 0, n = course.length; i < n; ++i) {
                        this.remove(course[i]);
                    }
                }
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
        //private static variables
            //regex strings to parse the course code

            //checks to see if there is a plus at the end of the course code
        var plusRegexp = /.+\+$/g,
            //checks for dollar sign at end of course code
            dollarRegexp = /.+\$$/g;

        //private helper methods, private methods
        //should be bound to the object when they
        //are called for execution to work correctly

        function validationFactory(options) {
            var i, n, prefixes = [], prefixPattern = /[a-z]+/i, nextPattern, j, length, exist;
            for (i = 0, n = options.courses.length; i < n; ++i) {

                //create individual course methods, pass private options
                courseCodeFactory.call(options.helper, options.courses[i], options);

                //locate all the prefixes for the course codes
                if (i === 0) {
                    prefixes.push(prefixPattern.exec(options.courses[i]).toString());
                } else {
                    for (j = 0, length = prefixes.length, exist = false, nextPattern = prefixPattern.exec(options.courses[i]).toString(); j < length && !exist; ++j) {
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

                options.helper[prefixes[i]] = (function(prefix) {

                    //use the immediately executing function to lock in
                    //the prefix

                    return function(courseNumber) {
                        
                        
                        var courseCount = 0, 
                            takenCourses = options.helper.takenCourses(),
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
        function courseCodeFactory(courseCode, options) {
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
                var n = options.remainingCourses.length,
                    i;
                for (i = 0; i < n; ++i) {
                   
                    if (options.remainingCourses[i] === courseCode) {
                        return false;
                    }
                }
                return true;
 
            }

        };
        

        //CONSTRUCTOR
        return function(options) {

            //private instance variables
            var _private = {};

            _private.name = options.name || "";

            _private.description = options.description || "";
                //list of all courses that are relevant
                //to this requirement.  This list never changes
                //after it has been initialized. Array of courseCode strings
            _private.courses = options.courses || [];
                //list of courses that still need to be taken.
                //when first initialized, this list contains the same list of
                //courses as the relevant courses list
            _private.remainingCourses = _private.courses.slice();

            _private.helper = new ValidationHelper();
                //the function that is called to check for validation
                //this function.  Returns true if the requirements are
                //complete and false if the requirements are not complete
            _private.validate = (options.validate) ? options.validate.bind(_private.helper) : function() {
                    return true;
                };
                
            _private.onSuccess = options.onSuccess || {
                    Default: "You have completed this requirement",
                    StarWars: "Completed this requirement you have",
                    Pirate: "Drinks all around, me matey!",
                    Surfer: "Duuuuuuude! You're killin' it braw!!"
                };
            _private.onFailure = options.onFailure || {
                    Default: "You have not completed this requirement",
                    StarWars: "More you must do, young Jedi",
                    Pirate: "Aaargh! Walk the plank!",
                    Surfer: "Not chill braw!"
                };

                //variables to help with initialization
                var i, n;
            
            
            _private.helper.courses = function() {
                return courses.slice();
            };
            _private.helper.remainingCourses = function() {
                return _private.remainingCourses.slice();
            };

            _private.helper.takenCourses = function() {
                return _.difference(options.courses, options.remainingCourses);
            };

            //set up dynamic binding of validation methods
            //validation factory should be called after the 
            //helper properties are set.  Pass factory method
            //private variables to finish initialization
            validationFactory(_private);

            
            this.name = function() {
                return _private.name;
            };
            this.description = function() {
                return _private.description;
            };
            //adds the course to the list of courses
            //taken.  If the course that is added is not
            //relevant to the requirement, nothing happens 
            //and the course is not added.  Note that if
            //course is an array, the array will be manipulated
            this.add = function(course) {
               
                var i, j, 
                    n = _private.remainingCourses.length,
                    length, done;
                if (typeof course === 'string') {
                    
                    for (i = 0; i < n; ++i) {
                        
                        if (_private.remainingCourses[i] === course) {
                            _private.remainingCourses = _private.remainingCourses.slice(0, i).concat(_private.remainingCourses.slice(i+1, n));
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
                _private.remainingCourses = _private.courses.slice();
            };
            //if the course being removed cannot 
            //be found, then this method does nothing
            this.remove = function(course) {
                var i, n, found;
                if (typeof course === "string") {
                    if (this.isCourse(course)) {
                        //check to see if the course is already in the list of remaining courses
                        for (i = 0, n = _private.remainingCourses.length, found = false; i < n && !found; ++i) {
                            if (_private.remainingCourses[i] === course) {
                                found = true;
                            }
                        }
                        if (!found) {
                            _private.remainingCourses.push(course);
                        }
                    }
                } else if (Array.isArray(course)) {
                    course.forEach(function(course) {
                        this.remove(course);
                    }.bind(this));
                }
                
            };

            this.isComplete = function() {
                return _private.validate();
            };
            //displays the message for the completion
            //of the courses, with the correct theme
            this.message = function() {
                if (this.isComplete()) {
                    return (_private.onSuccess[theme] === undefined) ? _private.onSuccess['Default'] : _private.onSuccess[theme];
                } else {
                    return (_private.onFailure[theme] === undefined) ? _private.onFailure['Default'] : _private.onFailure[theme];
                }
            };
            this.remainingCourses = function() {
                return [].slice.call(_private.remainingCourses);
            };
            this.takenCourses = function() {
                return _.difference(courses, remainingCourses);
            };
            this.allCourses = function() {
                return [].slice.call(courses);
            };
            this.isCourse = function(courseCode) {
                var i,n;
                for (i = 0, n = _private.courses.length; i < n; ++i) {
                    if (_private.courses[i] === courseCode) {
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


    //a singleton object that stores the course codes of 
    //all the classes to be requested, compiles them
    //so there are no overlapping requests, not necessarily
    //in charge of actually sending the requests and receiving
    //the courses
    ValidationBundle.RequestCompiler = (function() {

        var tokenre = /.+[\+,~,*,\$]$/i;

        function _constructor() {
            var instance;

            //redefine constructor after initial 
            //setup to always return the same
            //instane
            _constructor = function() {
                return instance;
            }

            _constructor.prototype = this;
            instance = new _constructor();
            instance.constructor = _constructor;

            //setup properties here

            //takes a parameter of either a single course code
            //or an array of course codes.  Saves the course codes that
            //are being requested and merges them with the existing set of 
            //course codes
            _constructor.cache = function(requests) {

            };

            //removes the course code or array of course codes 
            //from the cached requests
            _constructor.remove = function(requests) {

            };

            //resets the by removing all course codes
            _constructor.reset = function() {

            };

            //returns all the course codes that are being 
            //requested as an array
            _constructor.get = function() {

            };

            return instance;
        }

        return _constructor();
    });


})(this);
