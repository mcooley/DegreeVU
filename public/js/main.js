
//define dependencies and paths
require.config({
	baseURL: './js',
	paths: {
		jquery: '../lib/jquery/jquery-1.9.1',
		jquery_ui: '../lib/jquery-ui/jquery-ui-1.10.2.custom',
		underscore: '../lib/underscore/underscore-min',
		backbone: '../lib/backbone/backbone-min'
	},
	//list dependencies and exports
	shim: {
		'jquery_ui': ['jquery'],
		'backbone': ['underscore', 'jquery'],
		'views': ['backbone', 'jquery_ui'],
		'home': ['backbone'],
		'goals': ['home']
	}
});



//initial script
define(['home','views', 'goals'], function() {

	getQueryString = function (key) {
		var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
		var r=[], m;
		while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
		return r;
	}

	$(document).ready(function () {
	
		var gradYear = parseInt(getQueryString('gradYear'), 10);
		if (!_.isFinite(gradYear) || Math.abs(gradYear - 2013) > 4) {
			gradYear = 2016;
		}
		
		var scheduleView = new ScheduleView({collection: Schedule.getInstance(gradYear), el:'#scheduleGrid'});
		
		//TEMP GLOBAL
		//goalsList = new GoalList();	
		//var goalsListView = new GoalListView({collection:goalsList, el:'#goals'});
		
		$.getJSON('/ejs/templates', function(data) {
			window.templates = {};
			_.each(data, function(val, index) {
				window.templates[index] = _.template(val);
			});
			
			scheduleView.render();
			//goalsListView.render();
		});
		/*
		var majorId = getQueryString('major');
		if (majorId) {
			var	major = new Goal({
				id: majorId
			});
			
			major.once('sync', function() {
				goalsList.add(this);
			});
			major.fetch();	
		}
		*/

		//Display shim to handle scrolling in the schedule grid
		$('#scheduleGrid').scroll(function() {
			var el = $(this);
			el.css('background-position', '0 ' + (25 - el.scrollTop()) + 'px');
			el.find('.semesterName').css('top', el.scrollTop());
		});
		
	});
});