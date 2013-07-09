var CourseView = Backbone.View.extend({
	pixelsPerHour: 18,
	
	initialize: function() {
		Schedule.getInstance().on('add remove reset', (this.onAddToSchedule).bind(this));
	},
	
	render: function() {
		this.$el.addClass('courseBlock').addClass('color' + this.model.getColorId());

		this.$el.html(window.templates['course.ejs']({
			code: this.model.get('courseCode'),
			name: this.model.get('courseName'),
			hours: this.model.getHours()
		}));

		if (this.model.getHours() > 1) {
			this.$el.css('height', ((this.pixelsPerHour * (this.model.getHours() - 1)) - 4) + 'px');
		} else {
			this.$el.addClass('oneHour');
			this.$el.css('height', '0');
		}
		this.$el.draggable({
			appendTo: 'body',
			cursor: 'move',
			opacity: 0.75,
			distance: 5,
			helper: 'clone',
			connectToSortable: '.scheduleCol'
		}).popover({
			html:true,
			title:this.model.get('courseCode') + ': ' + this.model.get('courseName'),
			placement:'top',
			trigger:'manual',
			content:this.model.get('details')
		}).click(function(event) {
			if (!$(this).hasClass('hasPopoverShowing')) {
				$('.hasPopoverShowing').popover('hide');
				$(this).addClass('hasPopoverShowing').popover('show');
			} else {
				$(this).popover('hide').removeClass('hasPopoverShowing');
			}
			event.stopPropagation();
		});
		
		$(document).click(function() {
			$('.hasPopoverShowing').popover('hide');
		});
		
		
		this.$el.data('courseObj', this.model);
	},
	
	onAddToSchedule: function() {
		if (Schedule.getInstance().contains(this.model)) {
			this.$el.draggable("disable").addClass('placed');
		}
	}
});

var ScheduleView = Backbone.View.extend({
	initialize: function() {
		//this.collection.on('add remove reset', (this.updateHoursCount).bind(this));
	},
	
	render: function() {
		_.each(this.collection.getSemesters(), (function(semester) {
			this.$el.append(window.templates['semester.ejs']({
				season: semester.season,
				year: semester.year
			}));
			
		}).bind(this));
		
		$('.scheduleCol').sortable({
			connectWith: '.scheduleCol',
			items: '.courseBlock',
			cursor: 'move',
			opacity: 0.75,
			distance: 5,
			helper: 'clone',
			appendTo: 'body',
			beforeStop: function(event, ui) {
				ui.item.trigger(event, ui);
			},
			stop: function(event, ui) {
				ui.item.trigger(event, ui);
			}
		}).disableSelection();
		
		
		this.$el.children('.scheduleCol').on('sortreceive', (this.onCourseMoved).bind(this));
	},
	
	onCourseMoved: function(event, ui) {
		var col = $(event.target).parent();
		var semester = {season: col.attr('data-semesterseason'), year:col.attr('data-semesteryear')};
		
		if (ui.sender.parent().is('.reqCourseList')) {
			// Adding course to the schedule
			var courseModel = ui.sender.data('courseObj');
			courseModel.set('semester', semester);
			this.collection.add(courseModel);
		} else if (ui.sender.parent().is('.scheduleCol')) {
			// Moving course within the schedule
			console.log('Move course within schedule.');
		}
	},
	
	updateHoursCount: function() {
		//TODO: change this to count semester-by-semester
		var h = this.collection.reduce(function(memo, model) {
			return memo + (model.get('numOfCredits'))[0];
		}, 0);
		this.$el.find('.hoursCount').text('(' + h + ')');
	}
});

var GoalListView = Backbone.View.extend({
	initialize:function() {
		this._goalViews = [];
		this.collection.on('add', (this.addTab).bind(this));
	},
	
	render:function() {
		this.$el.html(window.templates['goalList.ejs']());
	},
	
	addTab:function(model) {
		this.$el.find('ul.nav-tabs').append('<li class="active"><a href="goal' + model.get('_id') + '" data-toggle="tab">' + model.get('name') + ' ' + model.get('type').charAt(0).toUpperCase() + model.get('type').slice(1) + '</a></li>');
		var e = $('<div></div>').appendTo(this.$el.find('div.tab-content'));		
		var view = new GoalView({model:model, el:e});
		this._goalViews.push(view);
		view.render();
		
		if (!this._renderedTab) {
			view.$el.addClass('active');
			this._renderedTab = true;
		}
	}
});

var CourseCollectionView = Backbone.View.extend({
	initialize:function() {
		this.collection.on('sync', (this.render).bind(this));
	},
	
	render: function() {
		this.collection.each((function(courseModel) {
			var e = $('<div></div>').appendTo(this.$el);
			var courseView = new CourseView({model:courseModel, el:e});
			courseView.render();
		}).bind(this));
	}
});



var GoalView = Backbone.View.extend({
	initialize: function() {
		this._courseCollectionViews = [];
		this.model.on('sync', (this.render).bind(this));
		this.model.on('collectionloaded', (this.render).bind(this));
		this.model.on('revalidated', (this.updateValidation).bind(this));
	},
	
	render: function() {
		this.$el.addClass('tab-pane').attr('id', 'goal' + this.model.get('_id'));
		if (!this.$el.has('.reqsSidebar').length) {
			this.$el.append('<div class="reqsSidebar well tabbable span4"><ul class="nav nav-list"><li class="nav-header">Requirements</li></ul></div><div class="tab-content span11">');
		}
		_.each(this.model.get('items'), (function(item, i) {
			if (!item.courseCollection) return;
			
			if (!this._courseCollectionViews[i]) {
				var activity = '';
				if (i === 0) {
					activity = ' active';
				}
			
				var tabId = 'goal' + this.model.get('id') + 'tab' + i;
			
				var sidebarItem = $('<li class="' + activity + ' color' + item.courseCollection.getColorId() + '"><a href="#' + tabId + '" data-toggle="tab">' + item.title + '</a></li>');
				this.$el.find('.reqsSidebar .nav-list').append(sidebarItem);
				
			
				var tabBody = $('<div class="reqPane tab-pane' + activity + '" id="' + tabId + '"><h2>' + item.title + '</h2>' + 
								(item.comment? '<div class="description">' + item.comment + '</div>' : '') + '<div class="validationError"></div><div class="reqCourseList"></div></div>').appendTo(this.$el);
			
				tabBody.appendTo(this.$el.find('.tab-content'));
				
				var childEl = tabBody.find('.reqCourseList');
				
				this._courseCollectionViews[i] = new CourseCollectionView({collection:item.courseCollection, el:childEl});
			}
		}).bind(this));
		this.updateValidation();
	},
	
	updateValidation: function() {
		_.each(this.model.get('items'), (function(item, i) {
			var tabId = 'goal' + this.model.get('id') + 'tab' + i;

			var heading = this.$el.find('#' + tabId + ' > h2');
			var sidebar = this.$el.find('a[href=\'#' + tabId + '\']').parent();
			var statusArea = this.$el.find('#' + tabId + ' > .validationError');
			
			if (item.isValidated) {
				heading.removeClass('no').addClass('yes');
				sidebar.removeClass('no').addClass('yes');
			} else {
				heading.removeClass('yes').addClass('no');
				sidebar.removeClass('yes').addClass('no');
				
			}
			statusArea.text(item.message());
			
		}).bind(this));
	}
});
