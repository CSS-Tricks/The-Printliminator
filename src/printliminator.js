/* Printliminator v3.1.1 */
/* jshint expr:false */
/* global csstricksPrintliminatorVars */
;( function() {
'use strict';
var pl = {

	version : '3.1.1',

	css : {
		hilite     : '_printliminator_highlight',
		fullWidth  : '_printliminator_full_width',
		hidden     : '_printliminator_hidden',
		stylized   : '_printliminator_stylized', // class name added to body
		noSelection: '_printliminator_noSelection', // class on body while dragging

		// printliminator
		stylesheet : '_print_controls_styles', // stylesheet ID
		controls   : '_print_controls',
		icon       : '_print_controls_icon',
		wrap       : '_print_controls_wrap',
		noGraphics : '_print_controls_remove_graphics',
		stylize    : '_print_controls_stylize',
		print      : '_print_controls_print',
		close      : '_print_controls_close',
		undo       : '_print_controls_undo',
		drag       : '_print_controls_icon_drag',
		dragActive : '_print_controls_drag_active',
		keyboard   : '_print_controls_keyboard'
	},

	keys : {
		parent1   : 33,  // pageUp
		parent2   : 38,  // up arrow
		child1    : 34,  // pageDown
		child2    : 40,  // down arrow
		nextSib   : 39,  // right arrow
		prevSib   : 37,  // left arrow
		hide      : 13,  // enter
		undo      : 8,   // backspace
		fontUp    : 107, // Numpad +
		fontDown  : 109, // Numpad -
		fontReset : 106, // Numpad *
		print     : 44,  // PrtScn (keyup only)
		abort     : 27,  // Esc
		// use event key below
		opposite  : 'altKey',  // alt + click
		fullWidth : 'shiftKey' // shift + click
	},

	// elements hidden when "remove graphics" is selected
	noGraphicsSelectors : 'img, iframe:not(._print_controls), object, embed, audio, video, input[type=image], svg',
	// elements to ignore while traversing
	ignoredElm  : /^(br|meta|style|link|script)$/i,

	// iframe height with keyboard open/closed
	keyboardOpen   : 630,
	keyboardClosed : 220,

	// dragging parameters stored here
	drag : {
		el : null,
		pos : [ 0, 0 ],
		elm : [ 0, 0 ]
	},

	init : function() {

		var body = document.querySelector( 'body' );

		// need a global variable to store history & flags
		if ( typeof window.csstricksPrintliminatorVars === 'undefined' ) {
			// use object separate from pl, otherwise these values get lost
			// upon javascript injection a second time (after uses presses Esc)
			window.csstricksPrintliminatorVars = {
				history : [],
				// flags to prevent multiple applications of same action
				flags : {}
			};

			pl.addStyles();

		}

		pl.addControls();

		// highlighting elements & keyboard binding
		pl.addEvent( body, 'click', pl.bodyClick );
		pl.addEvent( body, 'mouseover', pl.bodyMouseover );
		pl.addEvent( body, 'mouseout', pl.removeHighlight );
		pl.addEvent( document, 'keyup', pl.bodyKeyUp );
		pl.addEvent( document, 'keydown', pl.bodyKeyDown );

		// drag
		pl.addEvent( document, 'mouseup', pl.docMouseUp );
		pl.addEvent( document, 'mousemove', pl.docMouseMove );

	},

	addStyles : function(){
		var el,
		body = document.querySelector( 'body' ),
		prefix = 'body.' + pl.css.stylized + ' ',
		impt = '!important;',

		// programmically added stylesheets
		styles = '' +
			// hide printliminator controls from print
			'@media print{ .' + pl.css.wrap + '{ display: none; } }' +

			// print stylesheet
			'@media print, screen {' +
			prefix + '{ margin: 0; padding: 0; line-height: 1.4;' +
				'word-spacing: 1.1pt; letter-spacing: 0.2pt; font-size: 12pt;' +
				'font-family: Garamond, "Times New Roman", serif; color: #000; background: none; }' +
			prefix + 'h1,' + prefix + 'h2,' + prefix + 'h3,' +
				prefix + 'h4,' + prefix +'h5,' + prefix +'h6' +
				'{ font-family: Helvetica, Arial, sans-serif; }' +
			prefix + 'h1 { font-size: 19pt; }' +
			prefix + 'h2 { font-size: 17pt; }' +
			prefix + 'h3 { font-size: 15pt; }' +
			prefix + 'h4, ' + prefix +'h5,' + prefix + 'h6 { font-size: 12pt; }' +
			prefix + 'code { font: 10pt Courier, monospace; }' +
			prefix + 'blockquote { margin: 1.3em; padding: 1em; font-size: 10pt; }' +
			prefix + 'hr { background-color: #ccc; }' +
			prefix + 'img { float: left; margin: 1em 1.5em 1.5em 0; }' +
			prefix + 'a img { border: none; }' +
			prefix + 'table { margin: 1px; text-align:left; border-collapse: collapse; }' +
			prefix + 'th { border: 1px solid #333; font-weight: bold; }' +
			prefix + 'td { border: 1px solid #333; }' +
			prefix + 'th, ' + prefix +' td { padding: 4px 10px; }' +
			prefix + 'tfoot { font-style: italic; }' +
			prefix + 'caption { background: #fff; margin-bottom: 20px; text-align:left; }' +
			prefix + 'thead { display: table-header-group; }' +
			prefix + 'tr { page-break-inside: avoid; }' +

			// elements hidden by Printliminator
			'.' + pl.css.hidden + ' { display: none' + impt + '}' +
			// elements set to full width/no margins
			'.' + pl.css.fullWidth + ' { width: 100%' + impt + ' min-width: 100%' + impt + ' max-width: 100%' + impt +
				'margin: 0' + impt + '}' +

			'} @media screen {' +
			prefix + '{ padding: 20px; }' +

			// printliminator controls
			'.' + pl.css.wrap + '{ width: 450px' + impt + ' height: ' + pl.keyboardClosed + 'px; position: fixed' + impt +
				'top: 20px; right: 20px; z-index: 999999' + impt + ' box-shadow: 0 0 80px black' + impt + '}' +
			'.' + pl.css.drag + '{ width: 28px' + impt + 'height: 20px' + impt + 'position: absolute' + impt +
				' top: 0' + impt + ' left: 0' + impt + 'cursor: move' + impt + '}' +
			'.' + pl.css.drag + '.' + pl.css.dragActive + '{ width: 120px' + impt + 'height:100px' + impt +
				'top:-40px' + impt + 'left:-40px' + impt + '}' +
			'.' + pl.css.wrap + ' iframe { width: 450px' + impt + ' height: ' + pl.keyboardClosed + 'px; border: 0' + impt +
				'overflow-x: hidden' + impt + ' margin: 0' + impt + ' padding: 0' + impt + '}' +

			// prevent selection
			'body.' + pl.css.noSelection + ',.' + pl.css.hilite + ',.' + pl.css.wrap + ',.' + pl.css.drag + ',.' + pl.css.wrap + ' iframe {' +
				'-webkit-user-select: none' + impt + '-moz-user-select: none' + impt + ' -ms-user-select: none' + impt +
				' user-select: none' + impt + '}' +

			// box highlighting
			'.' + pl.css.hilite + '{ outline: 3px solid red' + impt + 'cursor: default' + impt + '}' +
			'.' + pl.css.hilite + '.' + pl.css.fullWidth + '{ outline-color: blue' + impt + '}';

		// add print stylesheet
		el = document.createElement( 'style' );
		el.id = pl.css.stylesheet;
		el.innerHTML = styles;
		document.querySelector( 'head' ).appendChild( el );

	},

	// create popup
	addControls : function(){
		var frame,
			body = document.querySelector( 'body' ),
			el = document.createElement( 'div' ),

			controls = pl.css.controls,
			prefix = '.' + controls,
			button = '_print_controls_button',
			icon = pl.css.icon,

			logo = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20134.4%208.7%22%3E%0A%3Cg%3E%0A%09%3Cpath%20d%3D%22M3%2C0.7H0.3C0.1%2C0.7%2C0%2C0.6%2C0%2C0.4c0-0.2%2C0.1-0.3%2C0.3-0.3h6c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3c0%2C0.2-0.1%2C0.3-0.3%2C0.3H3.6v7.6%0A%09%09c0%2C0.2-0.1%2C0.3-0.3%2C0.3S3%2C8.4%2C3%2C8.3V0.7z%22%2F%3E%0A%09%3Cpath%20d%3D%22M8.4%2C0.4c0-0.2%2C0.1-0.3%2C0.3-0.3S9%2C0.2%2C9%2C0.4V4h5.4V0.4c0-0.2%2C0.1-0.3%2C0.3-0.3c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3v7.9%0A%09%09c0%2C0.2-0.1%2C0.3-0.3%2C0.3c-0.2%2C0-0.3-0.1-0.3-0.3V4.6H9v3.7c0%2C0.2-0.1%2C0.3-0.3%2C0.3S8.4%2C8.4%2C8.4%2C8.3V0.4z%22%2F%3E%0A%09%3Cpath%20d%3D%22M17.5%2C8.2V0.5c0-0.2%2C0.1-0.3%2C0.3-0.3h5.4c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3c0%2C0.2-0.1%2C0.3-0.3%2C0.3h-5.1V4h4.6C22.9%2C4%2C23%2C4.1%2C23%2C4.3%0A%09%09c0%2C0.2-0.1%2C0.3-0.3%2C0.3h-4.6V8h5.2c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3c0%2C0.2-0.1%2C0.3-0.3%2C0.3h-5.5C17.7%2C8.5%2C17.5%2C8.4%2C17.5%2C8.2z%22%2F%3E%0A%09%3Cpath%20d%3D%22M29%2C0.9c0-0.4%2C0.3-0.7%2C0.7-0.7h2.6c2%2C0%2C3.2%2C1.1%2C3.2%2C2.8v0c0%2C1.9-1.5%2C2.9-3.4%2C2.9h-1.7v2c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.9z%20M32.2%2C4.5C33.3%2C4.5%2C34%2C3.9%2C34%2C3v0c0-1-0.7-1.5-1.8-1.5h-1.7v3H32.2z%22%2F%3E%0A%09%3Cpath%20d%3D%22M37%2C0.9c0-0.4%2C0.3-0.7%2C0.7-0.7h3c1.1%2C0%2C1.9%2C0.3%2C2.4%2C0.8c0.4%2C0.5%2C0.7%2C1.1%2C0.7%2C1.8v0c0%2C1.3-0.8%2C2.2-1.9%2C2.5l1.6%2C2%0A%09%09c0.1%2C0.2%2C0.2%2C0.3%2C0.2%2C0.6c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.3%2C0-0.6-0.2-0.7-0.4l-2-2.6h-1.9v2.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.9z%20M40.7%2C4.3c1.1%2C0%2C1.7-0.6%2C1.7-1.4v0c0-0.9-0.6-1.4-1.7-1.4h-2.1v2.8H40.7z%22%2F%3E%0A%09%3Cpath%20d%3D%22M45.8%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M49.5%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7h0.2c0.4%2C0%2C0.6%2C0.2%2C0.8%2C0.4L55.4%2C6V0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7H56c-0.3%2C0-0.6-0.2-0.8-0.4L51%2C2.6v5.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M61.1%2C1.5h-2c-0.4%2C0-0.7-0.3-0.7-0.7c0-0.4%2C0.3-0.7%2C0.7-0.7h5.6c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-2.1v6.4%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7s-0.7-0.3-0.7-0.7V1.5z%22%2F%3E%0A%09%3Cpath%20d%3D%22M66.8%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v6.4H72c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-4.5%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M74.3%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M78%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7h0.2c0.3%2C0%2C0.5%2C0.2%2C0.7%2C0.4l2.5%2C4l2.6-4c0.2-0.3%2C0.4-0.4%2C0.7-0.4h0.2c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7%0A%09%09v7c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7v-5l-2.1%2C3.1c-0.2%2C0.2-0.3%2C0.4-0.6%2C0.4c-0.3%2C0-0.5-0.1-0.6-0.4l-2-3.1v5%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7S78%2C8.3%2C78%2C7.9V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M88.5%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M92.2%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7h0.2c0.4%2C0%2C0.6%2C0.2%2C0.8%2C0.4L98.1%2C6V0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-0.1c-0.3%2C0-0.6-0.2-0.8-0.4l-4.3-5.6v5.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M101.2%2C7.6l3.1-7c0.2-0.4%2C0.5-0.6%2C0.9-0.6h0.1c0.4%2C0%2C0.7%2C0.2%2C0.9%2C0.6l3.1%2C7c0.1%2C0.1%2C0.1%2C0.2%2C0.1%2C0.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.3%2C0-0.6-0.2-0.7-0.5l-0.7-1.6h-4.1l-0.7%2C1.6c-0.1%2C0.3-0.4%2C0.5-0.7%2C0.5c-0.4%2C0-0.7-0.3-0.7-0.7C101.1%2C7.8%2C101.2%2C7.7%2C101.2%2C7.6z%0A%09%09%20M106.7%2C5.2l-1.5-3.4l-1.5%2C3.4H106.7z%22%2F%3E%0A%09%3Cpath%20d%3D%22M112.1%2C1.5h-2c-0.4%2C0-0.7-0.3-0.7-0.7c0-0.4%2C0.3-0.7%2C0.7-0.7h5.6c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-2.1v6.4%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V1.5z%22%2F%3E%0A%09%3Cpath%20d%3D%22M117%2C4.4L117%2C4.4c0-2.4%2C1.8-4.4%2C4.4-4.4c2.6%2C0%2C4.4%2C2%2C4.4%2C4.3v0c0%2C2.4-1.8%2C4.3-4.4%2C4.3C118.8%2C8.7%2C117%2C6.7%2C117%2C4.4z%0A%09%09%20M124.2%2C4.4L124.2%2C4.4c0-1.7-1.2-3-2.9-3s-2.8%2C1.3-2.8%2C3v0c0%2C1.6%2C1.2%2C3%2C2.9%2C3S124.2%2C6%2C124.2%2C4.4z%22%2F%3E%0A%09%3Cpath%20d%3D%22M127.5%2C0.9c0-0.4%2C0.3-0.7%2C0.7-0.7h3c1.1%2C0%2C1.9%2C0.3%2C2.4%2C0.8c0.4%2C0.5%2C0.7%2C1.1%2C0.7%2C1.8v0c0%2C1.3-0.8%2C2.2-1.9%2C2.5l1.6%2C2%0A%09%09c0.1%2C0.2%2C0.2%2C0.3%2C0.2%2C0.6c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.3%2C0-0.6-0.2-0.7-0.4l-2-2.6H129v2.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.9z%20M131.2%2C4.3c1.1%2C0%2C1.7-0.6%2C1.7-1.4v0c0-0.9-0.6-1.4-1.7-1.4H129v2.8H131.2z%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A',

			sprite = 'data:image/png;base64,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';

		body.appendChild( el );
		pl.addClass( el, pl.css.wrap );
		pl.addClass( el, controls );

		el.innerHTML = '<iframe class="' + pl.css.controls + '"></iframe>' +
			'<div class="' + pl.css.controls + ' ' + pl.css.drag + '"></div>';

		frame = el.querySelector( 'iframe.' + pl.css.controls ).contentWindow.document.body;
		frame.innerHTML = '<div class="' + controls + '_header">' +
			'<div class="' + pl.css.close + ' ' + controls + '_right">CLOSE <span class="' + icon + ' ' + icon + '_close"></span></div>' +
			'<div><span class="' + icon + ' ' + pl.css.drag + '"></span> DRAG</div>' +
			'</div>' +
			'<div class="' + controls + '_top">' +
			'<img class="pl_logo" src="' + logo + '" alt="The Printliminator">' +
			'<h3><span>Just click stuff on page to remove.</span> Alt-click to remove opposite.</h3>' +
			'</div>' +
			'<div class="' + controls + '_footer">' +
			'<h3>Other Useful Superpowers</h3>' +
			'<ul>' +
			'<li class="' + button + ' ' + pl.css.undo + '"><span class="' + icon + ' ' + icon + '_undo"></span>Undo<br>Last</li>' +
			'<li class="' + button + ' ' + pl.css.stylize + '"><span class="' + icon + ' ' + icon + '_stylize"></span>Add Print<br>Styles</li>' +
			'<li class="' + button + ' ' + pl.css.noGraphics + '"><span class="' + icon + ' ' + icon + '_nographics"></span>Remove<br>Graphics</li>' +
			'<li class="' + button + ' ' + pl.css.print + '"><span class="' + icon + ' ' + icon + '_print"></span>Send to<br>print</li>' +
			'</ul>' +

			'<div class="' + controls + '_keyboard-area">' +
			'<p class="keyboard-commands-toggle' + ' ' + pl.css.keyboard + '">View Keyboard Commands</p>' +

			'<table id="' + pl.css.keyboard + '" style="display:none">' +
			'<thead>' +
			'<tr><th class="key">Key</th><th>Command</th></tr>' +
			'</thead>' +
			'<tbody>' +
			'<tr><td><kbd>PageUp</kbd> <span class="lower">or</span> <kbd class="bold" title="Up Arrow">&uarr;</kbd></td><td>Find wrapper of highlighted box</td></tr>' +
			'<tr><td><kbd>PageDown</kbd> <span class="lower">or</span> <kbd class="bold" title="Down Arrow">&darr;</kbd></td><td>Find content of highlighted box</td></tr>' +
			'<tr><td><kbd class="bold" title="Right Arrow">&rarr;</kbd></td><td>Find next box inside same wrapper</td></tr>' +
			'<tr><td><kbd class="bold" title="Left Arrow">&larr;</kbd></td><td>Find previous box inside same wrapper</td></tr>' +
			'<tr><td><kbd>Enter</kbd></td><td>Remove the highlighted box</td></tr>' +
			'<tr><td><kbd>Backspace</kbd></td><td>Undo last action</td></tr>' +
			'<tr><td><kbd title="Numpad Plus">Numpad <span class="bold">+</span></kbd></td><td>Increase font-size by 1</td></tr>' +
			'<tr><td><kbd title="Numpad Minus">NumPad <span class="bold">-</span></kbd></td><td>Decrease font-size by 1</td></tr>' +
			'<tr><td><kbd title="Numpad Asterisk (Multiply)">NumPad <span class="bold asterisk">*</span></kbd></td><td>Reset font-size</td></tr>' +
			'<tr><td><kbd>Alt</kbd> + <span class="' + icon + ' ' + icon + '_left_click" title="left-click on mouse"></span></td>' +
				'<td>Remove everything but highlighted box</td></tr>' +
			'<tr><td><kbd>Shift</kbd> + <span class="' + icon + ' ' + icon + '_left_click" title="left-click on mouse"></span></td>' +
				'<td>Set box width to 100% &amp; margins to zero (highlight turns blue)</td></tr>' +
			'<tr><td><kbd title="Print Screen">PrtScn</kbd></td><td>Print Page</td></tr>' +
			'<tr><td><kbd title="Escape">Esc</kbd></td><td>Disable Printliminator, but save undo history</td></tr>' +
			'</tbody></table></div></div>' +
			'<style>' +
			'html { box-sizing: border-box; height: 100%; } *, *:before, *:after { box-sizing: inherit; }' +
			'html,body { background: #eee; min-height: ' + pl.keyboardClosed + 'px;' +
				'font-size: 14px; margin: 0; padding: 0; cursor: default; overflow: hidden;' +
				'font-family: "Lucida Grande","Lucida Sans Unicode", Tahoma, sans-serif;' +
				'-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }' +
			prefix + '_top { background: #fff; padding: 15px; }' +
			prefix + '_footer { padding: 15px 15px 0 15px; }' +
			prefix + '_keyboard-area { margin: 0 -15px 0 -15px; padding: 15px; background: #ccc; }' +
			'.keyboard-commands-toggle { font-size: 12px; margin: 0 0 15px 0; cursor: pointer; }' +
			'h1, h3 { margin: 0 0  10px; font-weight: normal;' +
				'text-transform: uppercase; }' +
			'.pl_logo { width: 225px; height: 15px; margin: 0 0 5px 0; }' +
			'h3 { font-size: 10px; font-weight: bold; }' +
			prefix + '_top h3 { color: #ccc; margin: 0; }' + prefix + '_top h3 span { color: red; }' +
			'.' + pl.css.icon + '{ display: inline-block; background: url(' + sprite + ') no-repeat;' +
				'width: 25px; height: 25px; vertical-align: middle; }' +
			'.' + pl.css.icon + '.' + pl.css.drag + ' { background-position: 0 0; }' +
			'.' + pl.css.icon + '_print { background-position: -25px 0; }' +
			'.' + pl.css.icon + '_keys  { background-position: -50px 0; }' +
			'.' + pl.css.icon + '_close { background-position: -75px 0; width: 40px; cursor: pointer; }' +
			'.' + pl.css.icon + '_undo  { background-position: 0 -25px; }' +
			'.' + pl.css.icon + '_nographics { background-position: -25px -25px; }' +
			'.' + pl.css.icon + '_left_click { background-position: -50px -25px; }' +
			'.' + pl.css.icon + '_stylize { background-position: -75px -25px; width: 35px; }' +
			prefix + '_header,' + prefix + '_button { background: #111; color: #fff; font-size: 11px; }' +
			prefix + '_header,' + prefix + '_header > div { height: 21px; font-size: 11px; }' +
			prefix + '_header > div,' + prefix + '_button { display: inline-block; }' +
			prefix + '_right { float: right; margin-right: 6px; }' +
			prefix + '_footer ul { margin: 0 0 15px 0; padding: 0;' +
				'list-style-type: none; }' +
			prefix + '_button { padding: 4px 14px 4px 4px; line-height: 12px; font-size: 10px; text-transform: uppercase;' +
				'text-align: left; white-space: nowrap; margin: 2px; cursor: pointer; display: inline-block; }' +
			prefix + '_button:hover { background-color: #333; }' +
			prefix + '_button span { float: left; margin: 0 10px 0 0; text-align: left; }' +
			'.key { width: 30%; }' +
			'table { margin: 0 4px; }' +
			'th { text-align: left; padding: 0 0 10px 0; }' +
			'kbd { background: #fff; border: #000 1px solid; border-radius: 3px;' +
				'padding: 1px 3px; }' +
			'td { border-top: 1px solid #aaa; font-size: 12px; padding: 5px; }' +
			'</style>';

		pl.addEvent( frame.querySelector( '.' + pl.css.noGraphics ), 'click', pl.removeGraphics );
		pl.addEvent( frame.querySelector( '.' + pl.css.print ), 'click', pl.print );
		pl.addEvent( frame.querySelector( '.' + pl.css.undo ), 'click', pl.undo );
		pl.addEvent( frame.querySelector( '.' + pl.css.stylize ), 'click', pl.stylize );
		pl.addEvent( frame.querySelector( '.' + pl.css.close ), 'click', pl.abort );
		pl.addEvent( frame.querySelector( '.' + pl.css.keyboard ), 'click', pl.keyboard );
		// can't drag from within the iframe - the mouse coordinates would be within it
		pl.addEvent( document.querySelector( '.' + pl.css.drag ), 'mousedown', pl.dragInit );
		// include mouseup inside frame to stop the drag
		pl.addEvent( frame, 'mouseup', pl.docMouseUp );

	},

	bodyClick : function( event ) {
		event.preventDefault();
		event.stopImmediatePropagation();

		if ( event.target.nodeName !== 'BODY' && !pl.hasClass( event.target, pl.css.controls ) ) {
			var done, sel,
				hilite = document.querySelector( '.' + pl.css.hilite );


			// Make 100% width & zero margins (set by css)
			// Shift + click
			if ( event[ pl.keys.fullWidth ] ) {
				if ( !pl.hasClass( hilite, pl.css.fullWidth ) ) {
					pl.addClass( hilite, pl.css.fullWidth );
					csstricksPrintliminatorVars.history.push( function() {
						pl.removeClass( hilite, pl.css.fullWidth );
					});
				}
			} else {
				// show opposite (Alt + click)
				if ( event[ pl.keys.opposite ] ) {
					done = pl.getOpposite( hilite );
					sel = done.length;
					if ( !sel ) {
						// nothing left to remove
						return false;
					}
				} else {
					// hide clicked element
					done = [ hilite ];
				}
				pl.hide( done );
				csstricksPrintliminatorVars.history.push( done );
			}

			// remove any text selection
			pl.clearSelection();

		}
	},

	bodyMouseover : function( event ) {
		if ( !pl.hasClass( event.target, pl.css.controls ) ) {
			pl.addClass( event.target, pl.css.hilite );
		}
	},

	removeHighlight : function() {
		// remove all highlight class names, just in case
		var indx,
			// include body as it might also get the highlight class
			hilite = document.querySelectorAll( '.' + pl.css.hilite ),
			len = hilite.length;
		for ( indx = 0; indx < len; indx++ ) {
			pl.removeClass( hilite[ indx ], pl.css.hilite );
		}
	},

	bodyKeyUp : function( event ) {
		event.preventDefault();
		// PrntScrn only works on keyup
		if ( event.which === pl.keys.print ) {
			pl.print();
		}
	},

	bodyKeyDown : function( event ) {
		event.preventDefault();
		var n, suffix, elm, els, isBody,
			body = document.querySelectorAll( 'body' )[ 0 ],
			el = document.querySelectorAll( '.' + pl.css.hilite )[ 0 ],
			hidden = pl.css.hidden,
			highlight = pl.css.hilite;

		if ( el ) {
			isBody = el.nodeName === 'BODY';

			switch ( event.which ) {
				case pl.keys.parent1 : // pageUp
				case pl.keys.parent2 : // up arrow
					if ( !isBody && el.parentNode ) {
						pl.removeClass( el, highlight );
						pl.addClass( el.parentNode, highlight );
					}
					break;

				case pl.keys.child1 : // pageDown
				case pl.keys.child2 : // down arrow
					els = Array.prototype.filter.call( el.children, pl.filterElements );
					if ( els.length ) {
						pl.removeClass( el, highlight );
						pl.addClass( els[0], highlight );
					}
					break;

				case pl.keys.nextSib : // right arrow (siblings)
					elm = pl.getNext( el );
					if ( !isBody && elm ) {
						pl.removeClass( el, highlight );
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.prevSib : // left arrow (siblings)
					elm = pl.getPrev( el );
					if ( !isBody && elm ) {
						pl.removeClass( el, highlight );
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.hide : // enter
					if ( !isBody ) {
						pl.addClass( el, hidden );
						pl.addClass( el.parentNode, highlight );
						csstricksPrintliminatorVars.history.push( el );
					}
					break;

			}
		} else {
			el = event.target;
			pl.addClass( el, highlight );
		}

		n = window.getComputedStyle( body, null ).getPropertyValue( 'font-size' );
		suffix = n.match( /[a-z]+/i )[0];

		switch ( event.which ) {
			case pl.keys.fontUp : // Numpad + = Increase font size
				body.style.fontSize = ( parseFloat( n ) + 1 ) + suffix;
				break;

			case pl.keys.fontDown : // Numpad - = Decrease font size
				body.style.fontSize = ( parseFloat( n ) - 1 ) + suffix;
				break;

			case pl.keys.fontReset : // Numpad * = reset font-size
				body.style.fontSize = '';
				break;

			case pl.keys.undo : // backspace
				pl.undo();
				break;

			case pl.keys.abort : // Esc
				pl.abort();
				break;

		}
	},

	// drag code adapted from http://jsfiddle.net/tovic/Xcb8d/light/
	dragInit : function() {
		var drag = pl.drag;
		pl.addClass( document.querySelector( '.' + pl.css.drag ), pl.css.dragActive );
		drag.el = document.querySelector( '.' + pl.css.wrap );
		drag.elm[0] = drag.pos[0] - drag.el.offsetLeft;
		drag.elm[1] = drag.pos[1] - drag.el.offsetTop;
		// prevent selecting content while dragging
		pl.toggleSelection( true );

	},

	docMouseMove : function( event ) {
		var drag = pl.drag;
		drag.pos[0] = document.all ? window.event.clientX : event.pageX;
		drag.pos[1] = document.all ? window.event.clientY : event.pageY;
		if ( pl.drag.el !== null ) {
			drag.el.style.left = ( drag.pos[0] - drag.elm[0] ) + 'px';
			drag.el.style.top  = ( drag.pos[1] - drag.elm[1] ) + 'px';
		}
	},

	docMouseUp : function() {
		pl.drag.el = null;
		pl.removeClass( document.querySelector( '.' + pl.css.drag ), pl.css.dragActive );
		pl.toggleSelection();
	},

	stopSelection : function() {
		return false;
	},

	clearSelection : function() {
		// remove text selection - http://stackoverflow.com/a/3171348/145346
		var sel = window.getSelection ? window.getSelection() : document.selection;
		if ( sel ) {
			if ( sel.removeAllRanges ) {
				sel.removeAllRanges();
			} else if ( sel.empty ) {
				sel.empty();
			}
		}
	},

	toggleSelection : function( disable ) {
		var body = document.querySelector( 'body' );
		if ( disable ) {
			// save current "unselectable" value
			pl.savedUnsel = body.getAttribute( 'unselectable' );
			body.setAttribute( 'unselectable', 'on' );
			pl.addClass( body, pl.css.noSelection );
			pl.addEvent( body, 'onselectstart', pl.stopSelection );
		} else {
			if ( pl.savedUnsel ) {
				body.setAttribute( 'unselectable', pl.savedUnsel );
			}
			pl.removeClass( body, pl.css.noSelection );
			pl.removeEvent( body, 'onselectstart', pl.stopSelection );
		}
		// clear any selections
		pl.clearSelection();
	},

	removeGraphics : function() {
		if ( !csstricksPrintliminatorVars.flags.removeGraphics ) {
			var indx, bkgd,
				bkgds = [],
				body = document.querySelector( 'body' ),
				done = body.querySelectorAll( pl.noGraphicsSelectors ),
				items = body.querySelectorAll( '*:not(.' + pl.css.controls + ')' ),
				len = items.length;

			for ( indx = 0; indx < len; indx++ ) {
				bkgd = window.getComputedStyle( items[ indx ] ).getPropertyValue( 'background-image' );
				if ( bkgd && bkgd !== 'none' ) {
					bkgds.push( [ items[ indx ], bkgd ] );
					items[ indx ].style.backgroundImage = 'none';
				}
			}

			pl.removeHighlight();
			pl.hide( done );
			csstricksPrintliminatorVars.flags.removeGraphics = true;

			csstricksPrintliminatorVars.history.push( function() {
				csstricksPrintliminatorVars.flags.removeGraphics = false;
				pl.show( done );
				len = bkgds.length;
				for ( indx = 0; indx < len; indx++ ) {
					bkgds[ indx ][ 0 ].style.backgroundImage = bkgds[ indx ][ 1 ];
				}
			});
		}
	},

	// Add print style
	stylize : function() {
		if ( !csstricksPrintliminatorVars.flags.stylize ) {
			var indx,
				inline = [],
				body = document.querySelector( 'body' ),
				links = document.querySelectorAll( 'link[rel="stylesheet"], style' ),
				visibleElms = document.querySelectorAll( 'body *:not(.' + pl.css.hidden + '):not(.' + pl.css.controls + ')' ),
				len = links.length;

			for ( indx = 0; indx < len; indx++ ) {
				if ( links[ indx ].id !== pl.css.stylesheet ) {
					links[ indx ].disabled = true;
				}
			}

			// cache and remove inline styles
			Array.prototype.filter.call( visibleElms, function( elm ) {
				var style = elm.getAttribute( 'style' );
				if ( style !== null ) {
					elm.removeAttribute( 'style' );
					inline.push({
						el: elm,
						style: style
					});
				}
			});

			pl.addClass( body, pl.css.stylized );
			pl.removeHighlight();
			csstricksPrintliminatorVars.flags.stylize = true;

			csstricksPrintliminatorVars.history.push( function() {
				csstricksPrintliminatorVars.flags.stylize = false;
				pl.removeClass( body, pl.css.stylized );
				var indx,
					len = links.length;
				for ( indx = 0; indx < len; indx++ ) {
					links[ indx ].disabled = false;
				}
				len = inline.length;
				for ( indx = 0; indx < len; indx++ ) {
					inline[ indx ].el.setAttribute( 'style', inline[ indx ].style );
				}
			});
		}
	},

	print : function() {
		pl.removeHighlight();
		window.print();
	},

	// Undo
	undo : function() {
		var last = csstricksPrintliminatorVars.history.pop();
		if ( last ) {
			pl.removeHighlight();
			if ( typeof last !== 'function' ) {
				pl.show( last );
			} else {
				last.call();
			}
		}
	},

	keyboard : function() {
		var wrap = document.querySelector( '.' + pl.css.wrap ),
			iframe = wrap.querySelector( 'iframe.' + pl.css.controls ),
			ibody = iframe.contentWindow.document.body,
			kb = ibody.querySelector( '#' + pl.css.keyboard ),
			button = ibody.querySelector( '.' + pl.css.keyboard ),
			disply = kb.style.display,
			makeVisible = disply === 'none';
		button.innerHTML = makeVisible ? 'Hide Keyboard Commands' : 'View Keyboard Commands';
		kb.style.display = makeVisible ? '' : 'none';
		wrap.style.height = ( makeVisible ? pl.keyboardOpen : pl.keyboardClosed ) + 5 + 'px';
		// iframe needs to be a tiny bit taller than the body inside
		iframe.style.height = ( makeVisible ? pl.keyboardOpen : pl.keyboardClosed ) + 5 + 'px';
		ibody.style.height = ( makeVisible ? pl.keyboardOpen : pl.keyboardClosed ) + 20 + 'px';
	},

	abort : function() {
		var body = document.querySelector( 'body' );
		pl.removeHighlight();
		pl.removeEvent( body, 'click', pl.bodyClick );
		pl.removeEvent( body, 'mouseover', pl.bodyMouseover );
		pl.removeEvent( body, 'mouseout', pl.removeHighlight );
		pl.removeEvent( document,'keyup', pl.bodyKeyUp );
		pl.removeEvent( document, 'keydown', pl.bodyKeyDown );
		// drag
		pl.removeEvent( document, 'mouseup', pl.docMouseUp );
		pl.removeEvent( document, 'mousemove', pl.docMouseMove );

		body.removeChild( document.querySelector( '.' + pl.css.wrap ) );

	},

	filterElements : function( elm ) {
		return elm &&
			// element node
			elm.nodeType === 1 &&
			// not an ignored element
			!pl.ignoredElm.test( elm.nodeName ) &&
			// not controls
			!pl.hasClass( elm, pl.css.controls ) &&
			// not hidden
			!( pl.hasClass( elm, pl.css.hidden ) || elm.style.display === 'none' );
	},

	getOpposite : function( el ) {
		var sibs,
			done = [];
		// method: start from highlighted element
		// get siblings & hide them; then go to parent, get siblings & hide them...
		// rinse & repeat until we hit the body element
		while ( el.nodeName !== 'BODY' ) {
			sibs = pl.getSiblings( el );
			done = done.concat( sibs );
			el = el.parentNode;
		}
		return done;
	},

	// modified from
	// https://plainjs.com/javascript/traversing/get-siblings-of-an-element-40/
	getSiblings : function ( el ) {
		var siblings = [],
			sibling = el.parentNode.firstChild;
		for ( ; sibling; sibling = sibling.nextSibling ) {
			if ( sibling !== el && pl.filterElements( sibling ) ) {
				siblings.push( sibling );
			}
		}
		return siblings;
	},

	// modified from
	// https://plainjs.com/javascript/traversing/get-siblings-of-an-element-40/
	getNext : function ( el ) {
		while ( el = el.nextSibling ) { // jshint ignore:line
			if ( el && pl.filterElements( el ) ) {
				return el;
			}
		}
		return null;
	},

	// modified from
	// https://plainjs.com/javascript/traversing/get-siblings-of-an-element-40/
	getPrev : function( el ) {
		while ( el = el.previousSibling ) { // jshint ignore:line
			if ( el && pl.filterElements( el ) ) {
				return el;
			}
		}
		return null;
	},

	hide : function ( els ) {
		if ( els ) {
			var indx,
				len = els.length;
			// single elements have undefined length
			if ( typeof len !== 'undefined' ) {
				for ( indx = 0; indx < len; indx++ ) {
					pl.addClass( els[ indx ], pl.css.hidden );
				}
			} else {
				pl.addClass( els, pl.css.hidden );
			}
		}
	},

	show : function ( els ) {
		if ( els ) {
			var indx,
				len = els.length;
			if ( typeof len !== 'undefined' ) {
				for ( indx = 0; indx < len; indx++ ) {
					pl.removeClass( els[ indx ], pl.css.hidden );
				}
			} else {
				pl.removeClass( els, pl.css.hidden );
			}
		}
	},

	addClass : function( el, name ) {
		if ( el.classList ) {
			el.classList.add( name );
		} else if ( !pl.hasClass( el, name ) ) {
			el.className += ' ' + name;
		}
	},

	removeClass : function( el, name ) {
		if ( el.classList ) {
			el.classList.remove( name );
		} else {
			el.className = el.className.replace( new RegExp( '\\b' + name + '\\b', 'g' ), '' );
		}
	},

	hasClass : function( el, name ) {
		return el.classList ?
			el.classList.contains( name ) :
			new RegExp( '\\b' + name + '\\b' ).test( el.className );
	},

	addEvent : function( el, type, handler ) {
		if ( el.attachEvent ) {
			el.attachEvent( 'on' + type, handler );
		} else {
			el.addEventListener( type, handler );
		}
	},

	removeEvent : function( el, type, handler ) {
		if ( el.detachEvent ) {
			el.detachEvent( 'on' + type, handler );
		} else {
			el.removeEventListener( type, handler );
		}
	}

};

window.csstricksPrintliminator = function() {
	pl.init();
};

})();
