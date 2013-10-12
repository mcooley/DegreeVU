define(['underscore', 'backbone', 'goal', 'tpl!../templates/goal.ejs'], function(_, Backbone, Goal, goalTemplate) {

return Backbone.View.extend({
	model: Goal,
	
	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		this.$el.html(goalTemplate({ goal: this.model }));
		return this;
	}
});

});