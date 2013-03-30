$(document).ready(function () {
	
	
	$('.scheduleCol, .goalSectionCourseList').sortable({
		connectWith: '.scheduleCol, .goalSectionCourseList',
		items: '.scheduleBlock',
		containment: 'body'
	}).disableSelection();
	
});