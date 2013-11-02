define(['underscore', 'backbone', 'goalcollection', 'goalsidebarview', 'goaldetailview', 'tpl!../templates/goalList.ejs', 'backbone_babysitter'],
function(_, Backbone, GoalCollection, GoalSidebarView, GoalDetailView, goalListTemplate, ChildViewContainer) {

return Backbone.View.extend({
	collection: GoalCollection,
	
	initialize: function() {
		this.listenTo(this.collection, 'add', this.onGoalAdded);
		this.listenTo(this.collection, 'remove', this.onGoalRemoved);
		this.listenTo(this.collection, 'reset', this.onGoalReset);
		this.listenTo(this.collection, 'focus', this.onGoalFocused);

		this.sidebarSubviews = new ChildViewContainer();
		this.detailSubviews = new ChildViewContainer();
        
		this.collection.each(function(model) {
			this.sidebarSubviews.add(new GoalSidebarView({ model: model }));
            this.detailSubviews.add(new GoalDetailView({ model: model }));
		});
	},
	
	onGoalAdded: function(goal) {
		this.sidebarSubviews.add(new GoalSidebarView({ model: goal }));
        this.detailSubviews.add(new GoalDetailView({ model: goal }));
		this.render();
	},
	
	onGoalRemoved: function(goal) {
		this.sidebarSubviews.remove(this.sidebarSubviews.findByModel(goal));
        this.detailSubviews.remove(this.sidebarSubviews.findByModel(goal));
		this.render();
	},
	
	onGoalReset: function() {
		this.sidebarSubviews = new ChildViewContainer();
        this.detailSubviews = new ChildViewContainer();
		this.render();
	},
    
    onGoalFocused: function(goal) {
        this.lastFocusedGoal = goal;
        this.render();
    },
	
	render: function() {
		this.$el.html(goalListTemplate());
		var insertPoint = this.$('#addGoal');
		this.sidebarSubviews.each(function(view) {
			view.render();
			insertPoint.before(view.$el);
		});
        
        if (this.lastFocusedGoal) {
            var detailView = this.detailSubviews.findByModel(this.lastFocusedGoal);
        }
        
        if (detailView) {
            detailView.render();
            this.$('#menuDetail').replaceWith(detailView.$el);
        } else if (this.collection.length) {
            var goal = this.collection.at(0);
            goal.trigger('focus', goal); // This will eventually result in a re-render.
        }
        
		return this;
	}
});

});