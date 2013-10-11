define(['backbone', 'goal'], function(Backbone, Goal) {

return Backbone.Collection.extend({
	model: Goal
});

});