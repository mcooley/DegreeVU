DegreeVU
========

Web application to make scheduling classes at Vanderbilt easier.

Intially created by @mcooley, @brenmcnamara, and @MitchKleban for HackVandy 2013. We want to turn our weekend project into a service that's useful for students. Send @mcooley a message if you'd like to help!

Some ideas:
    - have a list of AP classes that can be selected and mapped to equivalent vanderbilt courses
    - class search that allows one to search for classes not in their requirements
        - this could be a separate tab
    - load indicator while the requirements for a course are loading
    - a "details" property for requirements which goes over the course requirements in more detail
    - some of the requirements (like Liberal arts) have a large set of courses, might be a good idea to have a typed search capability for these courses
    - add a disclaimer along the line of: "DegreeVU is not meant to replace your councelor.  You should still talk to you councelor to make sure that you schedule correctly satisfies your major and is a realistic endeavor for the given time constraints"
    - because queries are the most time-consuming process, should create client-side functionality that examines all requirements and combines courses to reduce the amount of repetitive querying.  This function can then distribute courses to the correct requirements upon returning from the query
    - Liberal Arts Core takes about 30 seconds to load!! Try to reduce loading time.  Maybe separate LAC from Majors and make liberal arts core its own goal with
    - improve querying for more complicated operations like "q=CS200+,CS300+!" (returns all courses in between CS 200 and CS 300)
