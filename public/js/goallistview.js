define(['underscore', 'backbone', 'goalcollection', 'goalview', 'tpl!../templates/goalList.ejs', 'backbone_babysitter'],
function(_, Backbone, GoalCollection, GoalView, goalListTemplate, ChildViewContainer) {

return Backbone.View.extend({
	collection: GoalCollection,
	
	initialize: function() {
		this.listenTo(this.collection, 'add', this.onGoalAdded);
		this.listenTo(this.collection, 'remove', this.onGoalRemoved);
		this.listenTo(this.collection, 'reset', this.onGoalReset);
		
		this.subviews = new ChildViewContainer();
		
		this.collection.each(function(model) {
			this.subviews.add(new GoalView({ model: model }));
		});
	},
	
	onGoalAdded: function(goal) {
		this.subviews.add(new GoalView({ model: goal }));
		this.render();
	},
	
	onGoalRemoved: function(goal) {
		this.subviews.remove(this.subviews.findByModel(goal));
		this.render();
	},
	
	onGoalReset: function() {
		this.subviews = new ChildViewContainer();
		this.render();
	},
	
	render: function() {
		this.$el.html(goalListTemplate());
		var insertPoint = this.$('#addGoal');
		this.subviews.each(function(view) {
			view.$el = $('<div class="goal"></div>');
			view.render();
			insertPoint.before(view.$el);
		});
		return this;
	}
});

});