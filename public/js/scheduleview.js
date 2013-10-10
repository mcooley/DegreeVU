define(['underscore', 'backbone', 'tpl!../templates/schedulePeriod.ejs'], function(_, Backbone, periodTemplate) {

return Backbone.View.extend({
	initialize: function() {
		//this.collection.on('add remove reset', (this.updateHoursCount).bind(this));
	},
	
	render: function() {
		_.each(this.collection.getSemesters(), (function(semester) {
			this.$el.append(periodTemplate({
				season: semester.season,
				year: semester.year
			}));
		}).bind(this));
	}
});

});