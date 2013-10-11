
//define dependencies and paths
require.config({
	baseURL: './js',
	paths: {
		jquery: '../lib/jquery/jquery-1.9.1',
		jquery_ui: '../lib/jquery-ui/jquery-ui-1.10.2.custom',
		underscore: '../lib/underscore/underscore-min',
		backbone: '../lib/backbone/backbone-min',
		backbone_uniquemodel: '../lib/backbone-uniqueModel/backbone.uniquemodel',
		tpl: '../lib/requirejs-tpl/tpl'
	},
	//list dependencies
	shim: {
		'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
		},
		'underscore': {
			exports: '_'
		},
		'backbone_uniquemodel': {
			deps: ['backbone'],
			exports: 'Backbone.UniqueModel'
		}
		//'jquery_ui': ['jquery'],
		//'backbone': ['underscore', 'jquery']
		//'backbone_uniquemodel': ['backbone'],
		//'courses': ['backbone_uniquemodel','backbone'],
		//'views': ['goals', 'backbone', 'jquery_ui']
	}
});

require(['jquery', 'underscore', 'backbone', 'scheduleview', 'schedule'], function($, _, Backbone, ScheduleView, Schedule) {
	$(document).ready(function () {
		
		var getQueryString = function (key) {
			var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
			var r=[], m;
			while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
			return r;
		}
	
		var gradYear = parseInt(getQueryString('gradYear'), 10);
		if (!_.isFinite(gradYear) || Math.abs(gradYear - 2013) > 4) {
			gradYear = 2016;
		}
		
		var scheduleView = new ScheduleView({collection: Schedule.getInstance(gradYear), el:'#schedule'});
		scheduleView.render();
		
	});
});