define(['underscore', 'backbone', 'goal', 'tpl!../templates/goalSidebar.ejs'], function(_, Backbone, Goal, goalSidebarTemplate) {

return Backbone.View.extend({
	model: Goal,
    
    className: 'goal',
    
    events: { 'click': 'focusGoal' },
    
	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		this.$el.html(goalSidebarTemplate({ goal: this.model }));
		return this;
	},
    
    focusGoal: function() {
        this.model.trigger('focus', this.model);
    }
});

});