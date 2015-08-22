function printlimator() {
    //remove conflicts with other javascript libraries
	var $ = jQuery;

	//like the hover function, but for mousedown state
	$.fn.active = function(fn1, fn2) {
		var el = this;
		$(el).mousedown(fn1);
		$(document).mouseup(function() {
			fn2.call(el);
		});

		return this;
	};

	var history = [];

	var dont = false;
	$('body *:not(._print_controls, ._print_controls *)').live('click', function (e) {
	    if (!dont) {
	        e.preventDefault();
	        var done;
	        if(e.altKey) {
	        	done = $("body *").not("._print_controls, ._print_controls *, style")
	        			   .not($(this).parents().andSelf())
	        			   .not($(this).find("*"))
	        	.hide();
	       	}
	        else done = $(this).hide();

	        done.addClass("_print_removed");
	        history.push(done);
	    }
	}).live('mouseover', function () {
	    if (!dont) $(this).css('outline', '3px solid red')
	}).live('mouseout', function () {
	    if (!dont) $(this).css('outline', 'none')
	});

	var controls = $('<div>').addClass('_print_controls').css({
	    position: 'fixed',
	    top: 25,
	    right: 25,
	    width: 162,
	    height: 182,
	    background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator2.png) no-repeat',
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
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator2.png) 0 -182px no-repeat',
		position: 'absolute',
		top: 6,
		left: 6,
		width: 74,
		height: 74
    }).click(function () {
    	var done = $('img,iframe,object,embed,input[type=image],ins').hide();
    	var bg = $('body *:not(._print_controls, ._print_controls *)').css('background');
    	var item = $('body *:not(._print_controls, ._print_controls *)').css('background', 'none');

    	done.addClass("_print_removed");
    	history.push(function() {
    		done.show();
    		item.css('background', bg);
    	});
	}).hover(function(){
	   $(this).css({ "background-position": "0 -256px" }) }, function() {
	   $(this).css({ "background-position": "0 -182px" })
    }).active(function(){
	   $(this).css({ "background-position": "0 -330px" }) }, function() {
	   $(this).css({ "background-position": "0 -182px" })
    }).appendTo(controls);

	// Print Stylize
	$('<div>').css({
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator2.png) no-repeat -222px -182px',
		position: 'absolute',
		top: 6,
		left: 83,
		width: 74,
		height: 74
    }).click(function () {
		window.print();
	}).hover(function(){
	   $(this).css({ "background-position": "-222px -256px" }) }, function() {
	   $(this).css({ "background-position": "-222px -182px" })
    }).active(function(){
	   $(this).css({ "background-position": "-222px -330px" }) }, function() {
	   $(this).css({ "background-position": "-222px -182px" })
    }).appendTo(controls);

	//Print
	$('<div>').css({
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator2.png) -74px -182px no-repeat',
		position: 'absolute',
		top: 83,
		left: 83,
		width: 74,
		height: 74
    }).hover(function(){
	   $(this).css({ "background-position": "-74px -256px" }) }, function() {
	   $(this).css({ "background-position": "-74px -182px" })
    }).active(function(){
	   $(this).css({ "background-position": "-74px -330px" }) }, function() {
	   $(this).css({ "background-position": "-74px -182px" })
    }).click(function () {
		var links = $("link[rel='stylesheet'], style:not(#_print_control_styles)").remove();
		//cache and remove inline styles
		var inline = $('body *:not(._print_controls, ._print_controls > *, ._print_removed)').map(function() {
			var style = $(this).attr("style");
			$(this).attr("style", "");
			return {
				el: this,
				style: style
			};
		});
		var print = $("<link rel='stylesheet' type='text/css' href='http://css-tricks.com/examples/ThePrintliminator/css/printliminator.css'/>").appendTo("head");

		history.push(function() {
			print.remove();
			links.appendTo("head");
			inline.each(function() {
				$(this.el).attr("style", this.style);
			});
		});
	}).appendTo(controls);

	//Close
	$('<div>').css({
		background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator2.png) -222px -3px no-repeat',
		position: 'absolute',
		top: -20,
		right: -20,
		width: 33,
		height: 33
	}).hover(function(){
	   $(this).css({ "background-position": "-222px -39px" }) }, function(){
	   $(this).css({ "background-position": "-222px -3px" })
	}).click(function(){
		$('._print_controls').remove();
    }).appendTo(controls);

    $("<div>").css({
        background: 'url(http://css-tricks.com/examples/ThePrintliminator/images/printliminator2.png) -148px -182px no-repeat',
		position: 'absolute',
		top: 83,
		left: 6,
		width: 74,
		height: 74
    }).hover(function(){
	   $(this).css({ "background-position": "-148px -256px" }) }, function() {
	   $(this).css({ "background-position": "-148px -182px" })
    }).active(function(){
	   $(this).css({ "background-position": "-148px -330px" }) }, function() {
	   $(this).css({ "background-position": "-148px -182px" })
    }).click(function() {
    	var last = history.pop();
    	if(last) {
    		if(typeof last != 'function')
    			last.removeClass("_print_removed").show();
    		else last.call();
    	}
    }).appendTo(controls);

	//make sure that the controls don't get printed
	$('<style id="_print_control_styles">').text('@media print{._print_controls{display:none;}}').appendTo("head");
}