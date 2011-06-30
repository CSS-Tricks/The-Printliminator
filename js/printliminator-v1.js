function printlimator() {
    //remove conflicts with other javascript libraries
	var $ = jQuery;
	var dont = false;
	$('body *:not(._print_controls, ._print_controls *)').live('click', function (e) {
	    if (!dont) {
	        e.preventDefault();
	        if(e.altKey) {
	        	$("body *").not("._print_controls, ._print_controls *")
	        			   .not($(this).parents().andSelf())
	        			   .not($(this).find("*"))
	        	.remove();
	       	}
	        else $(this).remove()
	    }
	}).live('mouseover', function () {
	    if (!dont) $(this).css('outline', '3px solid red')
	}).live('mouseout', function () {
	    if (!dont) $(this).css('outline', 'none')
	});
	
	var controls = $('<div>').addClass('_print_controls').css({
	    position: 'fixed',
	    top: 15,
	    right: 15,
	    width: 258,
	    height: 101,
	    background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator.png) no-repeat',
	    zIndex: 10000
	}).mouseover(function () {
	    dont = true
	}).mouseout(function () {
	    dont = false
	}).appendTo('body');
	
	//fix IE6, which doesn't support position: fixed
	if (controls.css('position') != 'fixed') {
	    controls.css('position', 'absolute');
	}
	
	//Remove Graphics
	$('<div>').css({
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator.png) -68px -101px no-repeat',
		position: 'absolute',
		top: 12,
		left: 15,
		width: 68,
		height: 68
    }).click(function () {
    	$('img,iframe,object,embed,input[type=image],ins').remove();
    	$('*:not(._print_controls, ._print_controls *)').css('background-image', 'none');
	}).hover(function(){
	   $(this).css({
	       "background-position": "0 -101px"
	   })
	}, function(){
	   $(this).css({
	       "background-position": "-68px -101px"
	   })
	}).appendTo(controls);
	
	// Print Stylize
	$('<div>').css({
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator.png) no-repeat -68px -237px',
		position: 'absolute',
		top: 12,
		left: 96,
		width: 68,
		height: 68
    }).click(function () {
		$("link[rel='stylesheet'], style:not(#_print_control_styles)").remove();
		$('body *:not(._print_controls, ._print_controls > *)').attr("style", "");
		$("head").append("<link rel='stylesheet' type='text/css' href='http://css-tricks.com/examples/ThePrintliminator/css/printliminator.css'/>");
	}).hover(function(){
	   $(this).css({
	       "background-position": "0 -237px"
	   })
	}, function(){
	   $(this).css({
	       "background-position": "-68px -237px"
	   })
	}).appendTo(controls);
	
	//Print
	$('<div>').css({
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator.png) -68px -169px no-repeat',
		position: 'absolute',
		top: 12,
		left: 176,
		width: 68,
		height: 68
    }).hover(function(){
	   $(this).css({
	       "background-position": "0 -169px"
	   })
	}, function(){
	   $(this).css({
	       "background-position": "-68px -169px"
	   })
	}).click(function () {
		window.print();
	}).appendTo(controls);
	
	//Close
	$('<div>').css({
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator.png) -258px 0 no-repeat',
		position: 'absolute',
		top: -7,
		right: -7,
		width: 23,
		height: 23
	}).hover(function(){
	   $(this).css({
	       "background-position": "-281px 0"
	   })
	}, function(){
	   $(this).css({
	       "background-position": "-258px 0"
	   })
	}).click(function(){
		$('._print_controls').remove();
    }).appendTo(controls);
	
	//make sure that the controls don't get printed
	$('<style id="_print_control_styles">').text('@media print{._print_controls{display:none;}}').appendTo("head");
}