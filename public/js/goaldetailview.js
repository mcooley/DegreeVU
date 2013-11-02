define(['underscore', 'backbone', 'goal', 'tpl!../templates/goalDetail.ejs'], function(_, Backbone, Goal, goalTemplate) {

return Backbone.View.extend({
	model: Goal,
	
    className: 'menuDetail',
    
	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
        if (this.model.has('head')) {
		    this.$el.html(goalTemplate({ reqs: this.model.get('head').getRenderableItems() }));
        }
        
        //TODO: scope this correctly
        $('#menu').scrollspy('refresh');
        
		return this;
	}
});

});