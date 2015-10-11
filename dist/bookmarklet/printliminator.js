/* Printliminator v4.0.5
 * https://github.com/CSS-Tricks/The-Printliminator
 */
/*jshint expr:false */
/*globals thePrintliminatorVars */
;( function() {
'use strict';

var pl = window.thePrintliminator = {

	version : '4.0.5',

	// preprocess is used to echo in settings from options.json
	css : {
		hilite    : '_printliminator_highlight',
		fullWidth : '_printliminator_full_width',
		hidden    : '_printliminator_hidden',
		// class name added to body when print styles applied (used in printliminator.css)
		stylized  : '_printliminator_stylized',
		messages  : '_printliminator_messages',

		noSelection: '_printliminator_no_selection', // class on body while dragging
		// exposed in main document
		stylesheet : '_printliminator_styles', // stylesheet ID
		wrap       : '_printliminator_wrap',
		controls   : '_printliminator_controls',
		drag       : '_printliminator_drag_icon',
		dragActive : '_printliminator_drag_active',
		// inside bookmarklet iframe
		icon       : 'icon',
		noGraphics : 'no_graphics',
		stylize    : 'stylize',
		print      : 'print',
		close      : 'close',
		undo       : 'undo',
		busy       : 'busy',
		keyboard   : 'keyboard',
		toggle     : 'toggle'

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
		fontUp1   : 107, // Numpad +
		fontUp2   : 187, // = (unshifted +)
		fontDown1 : 109, // Numpad -
		fontDown2 : 189, // -
		fontReset1: 106, // Numpad *
		fontReset2: 56,  // 8 (unshifted *)
		print     : 44,  // PrtScn (keyup only)
		abort     : 27,  // Esc


		// use event key below
		opposite  : 'altKey',  // alt + click
		fullWidth : 'shiftKey' // shift + click
	},

	// elements hidden when "remove graphics" is selected
	noGraphics  : 'img, iframe:not(._printliminator_controls), object, embed, audio, video, input[type=image], svg',
	// elements to ignore while traversing
	ignoredElm  : /^(br|meta|style|link|script)$/i,

	// iframe height with keyboard open/closed
	keyboardOpen   : 615,
	keyboardClosed : 220,

	// Bookmarklet popup - dragging parameters stored here
	drag : {
		el : null,
		pos : [ 0, 0 ],
		elm : [ 0, 0 ]
	},

	init : function() {
		var el,
			body = document.body;

		// need a global variable to store history & flags
		if ( typeof window.thePrintliminatorVars === 'undefined' ) {
			// use object separate from pl, otherwise these values get lost
			// upon javascript injection a second time (after uses presses Esc)
			window.thePrintliminatorVars = {
				init : true,
				history : [],
				messageCache : [],
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

	// delegated event click
	bodyClick : function( event ) {
		event.preventDefault();
		event.stopImmediatePropagation();

		if ( event.target.nodeName !== 'BODY' && !pl.hasClass( event.target, pl.css.messages ) ) {
			var done, sel,
				opposite = false,
				msg = pl.messages,
				hilite = document.body.querySelector( '.' + pl.css.hilite );

			// Make 100% width & zero margins (set by css)
			// Shift + click
			if ( event[ pl.keys.fullWidth ] ) {
				if ( !pl.hasClass( hilite, pl.css.fullWidth ) ) {
					pl.addClass( hilite, pl.css.fullWidth );
					thePrintliminatorVars.history.push( function() {
						pl.removeClass( hilite, pl.css.fullWidth );
					});
				}
			} else {
				// show opposite
				// Alt + click
				if ( event[ pl.keys.opposite ] ) {
					done = pl.getOpposite( hilite );
					sel = done.length;
					if ( sel ) {
						opposite = true;
					} else {
						// nothing left to remove
						return;
					}
				} else {
					// hide clicked element
					done = [ hilite ];
				}

				pl.hide( done );
				thePrintliminatorVars.history.push( done );

				if ( opposite ) {
					// messages will get hidden if alt+click used
					// this is easier than trying to detect it
					pl.removeClass( document.querySelector( 'ul.' + pl.css.messages ), pl.css.hidden );
				}

			}

			// remove any text selection
			pl.clearSelection();

		}
	},

	bodyMouseover : function( event ) {
		if ( !pl.hasClass( event.target, pl.css.controls ) ) {
			pl.addClass( event.target, pl.css.hilite );
		}
		// make sure main window has focus
		window.focus();
	},

	bodyKeyUp : function( event ) {
		event.preventDefault();
		switch ( event.which ) {

			// PrntScrn only works on keyup
			case pl.keys.print:
				pl.print();
				break;

		}
	},

	bodyKeyDown : function( event ) {
		event.preventDefault();
		var n, suffix, elm, els, isBody,
			body = document.body,
			msg = pl.messages,
			el = body.querySelector( '.' + pl.css.hilite ),
			hidden = pl.css.hidden,
			highlight = pl.css.hilite;

		if ( el ) {
			isBody = el.nodeName === 'BODY';

			switch ( event.which ) {
				case pl.keys.parent1 : // pageUp
				case pl.keys.parent2 : // up arrow
					els = el.parentNode;
					if ( !isBody && els ) {
						pl.removeClass( el, highlight );
						pl.addClass( els, highlight );
					}
					break;

				case pl.keys.child1 : // pageDown
				case pl.keys.child2 : // down arrow
					elm = pl.getFirstChild( el );
					if ( elm ) {
						pl.removeClass( el, highlight );
						// first visible child element
						pl.addClass( elm, highlight );
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
						thePrintliminatorVars.history.push( el );
					}
					break;

			}
		}

		n = window.getComputedStyle( body, null ).getPropertyValue( 'font-size' );
		suffix = n.match( /[a-z]+/i )[0];

		switch ( event.which ) {
			case pl.keys.fontUp1 : // Numpad + = Increase font size
			case pl.keys.fontUp2 : // = (unshifted +)
				body.style.fontSize = ( parseFloat( n ) + 1 ) + suffix;
				break;

			case pl.keys.fontDown1 : // Numpad - = Decrease font size
			case pl.keys.fontDown2 : // -
				body.style.fontSize = ( parseFloat( n ) - 1 ) + suffix;
				break;

			case pl.keys.fontReset1 : // Numpad * = reset font-size
			case pl.keys.fontReset2 : // 8 (unshifted *)
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
		while  ( el.nodeName !== 'BODY' ) {
			sibs = pl.getSiblings( el );
			done = done.concat( sibs );
			el = el.parentNode;
		}
		return done;
	},

	getFirstChild : function( el ) {
		var children = Array.prototype.filter.call( el.children, pl.filterElements );
		return children.length ? children[0] : null;
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

	removeGraphics : function( event, body ) {
		if ( !thePrintliminatorVars.flags.removeGraphics ) {
			// for testing
			body = body || document.body;
			var indx, bkgd,
				bkgds = [],
				done = body.querySelectorAll( pl.noGraphics ),
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
			thePrintliminatorVars.flags.removeGraphics = true;

			thePrintliminatorVars.history.push( function() {
				thePrintliminatorVars.flags.removeGraphics = false;
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
		if ( !thePrintliminatorVars.flags.stylize ) {
			var indx,
				inline = [],
				body = document.body,
				links = document.querySelectorAll( 'link[rel="stylesheet"]' ),
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
			thePrintliminatorVars.flags.stylize = true;

			thePrintliminatorVars.history.push( function() {
				thePrintliminatorVars.flags.stylize = false;
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
		var frame = document.body.querySelector( 'iframe.' + pl.css.controls ).contentWindow.document;
		pl.addClass( frame.querySelector( 'li.' + pl.css.print ), pl.css.busy );

		pl.removeHighlight();

		// use setTimeout to allow class to render
		setTimeout( function() {
			window.print();
			pl.busy( function() {
				pl.removeClass( frame.querySelector( 'li.' + pl.css.print ), pl.css.busy );
			});
		}, 10);
	},
	busy : function( callback ) {
		if ( document.readyState !== 'complete' ) {
			var loopy = function( i ) {
				setTimeout(function () {
					// ready state is delayed when a file on the page is not found
					if ( document.readyState === 'complete' || i === 1 ) {
						callback();
						i = 0;
					}
					if ( --i > 0 ) {
						loopy(i);
					}
				}, 1000);
			};
			// repeat 20 times (20 seconds), then just remove the busy class
			loopy( 20 );
		} else {
			callback();
		}
	},

	// Undo
	undo : function() {
		var last = thePrintliminatorVars.history.pop();
		if ( last ) {
			pl.removeHighlight();
			if ( typeof last !== 'function' ) {
				pl.show( last );
			} else {
				last.call();
			}
		}
	},

	abort : function() {
		var body = document.body;
		pl.removeHighlight();
		pl.removeClass( body, pl.css.enabled );
		pl.removeEvent( body, 'click', pl.bodyClick );
		pl.removeEvent( body, 'mouseover', pl.bodyMouseover );
		pl.removeEvent( body, 'mouseout', pl.removeHighlight );
		pl.removeEvent( document, 'keyup', pl.bodyKeyUp );
		pl.removeEvent( document, 'keydown', pl.bodyKeyDown );

		// drag
		pl.removeEvent( document, 'mouseup', pl.docMouseUp );
		pl.removeEvent( document, 'mousemove', pl.docMouseMove );
		body.removeChild( document.querySelector( '.' + pl.css.wrap ) );

	},

	addStyles : function() {
		var el,
		body = document.body,
		// programmically added stylesheets
		styles = '@media print, screen { body._printliminator_stylized { margin: 0 !important; padding: 0 !important; line-height: 1.4 !important; word-spacing: 1.1pt !important; letter-spacing: 0.2pt !important; font-family: Garamond, "Times New Roman", serif !important; color: #000 !important; background: none !important; font-size: 12pt !important; /*Headings */ /* Images */ /* Table */ } body._printliminator_stylized h1, body._printliminator_stylized h2, body._printliminator_stylized h3, body._printliminator_stylized h4, body._printliminator_stylized h5, body._printliminator_stylized h6 { font-family: Helvetica, Arial, sans-serif !important; } body._printliminator_stylized h1 { font-size: 19pt !important; } body._printliminator_stylized h2 { font-size: 17pt !important; } body._printliminator_stylized h3 { font-size: 15pt !important; } body._printliminator_stylized h4, body._printliminator_stylized h5, body._printliminator_stylized h6 { font-size: 12pt !important; } body._printliminator_stylized code { font: 10pt Courier, monospace !important; } body._printliminator_stylized blockquote { margin: 1.3em !important; padding: 1em !important; font-size: 10pt !important; } body._printliminator_stylized hr { background-color: #ccc !important; } body._printliminator_stylized img { float: left !important; margin: 1em 1.5em 1.5em 0 !important; } body._printliminator_stylized a img { border: none !important; } body._printliminator_stylized table { margin: 1px !important; text-align: left !important; border-collapse: collapse !important; } body._printliminator_stylized th { border: 1px solid #333 !important; font-weight: bold !important; } body._printliminator_stylized td { border: 1px solid #333 !important; } body._printliminator_stylized th, body._printliminator_stylized td { padding: 4px 10px !important; } body._printliminator_stylized tfoot { font-style: italic !important; } body._printliminator_stylized caption { background: #fff !important; margin-bottom: 20px !important; text-align: left !important; } body._printliminator_stylized thead { display: table-header-group !important; } body._printliminator_stylized tr { page-break-inside: avoid !important; } ._printliminator_hidden { display: none !important; } ._printliminator_full_width { width: 100% !important; min-width: 100% !important; max-width: 100% !important; margin: 0 !important; } } @media print { ._printliminator_wrap { display: none !important; } } @media screen { body._printliminator_stylized { padding: 20px !important; } ._printliminator_highlight { outline: 3px solid red !important; cursor: default !important; } ._printliminator_highlight._printliminator_full_width { outline-color: blue !important; } ._printliminator_wrap { width: 450px !important; height: 220px; position: fixed !important; top: 20px; right: 20px; z-index: 999999 !important; box-shadow: 0 0 80px black !important; } ._printliminator_wrap iframe { width: 450px !important; height: 220px; border: 0 !important; overflow-x: hidden !important; margin: 0 !important; padding: 0 !important; } ._printliminator_drag_icon { width: 28px !important; height: 20px !important; position: absolute !important; top: 0 !important; left: 0 !important; cursor: move !important; } ._printliminator_drag_icon._printliminator_drag_active { width: 120px !important; height: 100px !important; top: -40px !important; left: -40px !important; } body._printliminator_no_selection, ._printliminator_highlight, ._printliminator_wrap, ._printliminator_drag_icon, ._printliminator_wrap iframe { -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; } } ';

		// add print stylesheet
		el = document.createElement( 'style' );
		el.id = pl.css.stylesheet;
		el.innerHTML = styles;
		document.querySelector( 'head' ).appendChild( el );
	},

	// create popup (bookmarklet)
	addControls : function() {
		var frame,
			body = document.body,
			el = document.createElement( 'div' ),
			controls = pl.css.controls;

		body.appendChild( el );
		pl.addClass( el, pl.css.wrap );
		pl.addClass( el, controls );

		el.innerHTML = '<iframe class="' + controls + '"></iframe>' +
			'<div class="' + controls + ' ' + pl.css.drag + '"></div>';

		frame = el.querySelector( 'iframe.' + controls ).contentWindow.document;
		// Firefox needs script to open, write, then close... innerHTML doesn't work.
		frame.open();
		frame.write('<div class="header"> <div class="close right">CLOSE <span class="icon close"></span></div> <div><span class="icon _printliminator_drag_icon"></span> DRAG</div> </div> <div class="top"> <img class="pl_logo" src="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20134.4%208.7%22%3E%0A%3Cg%3E%0A%09%3Cpath%20d%3D%22M3%2C0.7H0.3C0.1%2C0.7%2C0%2C0.6%2C0%2C0.4c0-0.2%2C0.1-0.3%2C0.3-0.3h6c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3c0%2C0.2-0.1%2C0.3-0.3%2C0.3H3.6v7.6%0A%09%09c0%2C0.2-0.1%2C0.3-0.3%2C0.3S3%2C8.4%2C3%2C8.3V0.7z%22%2F%3E%0A%09%3Cpath%20d%3D%22M8.4%2C0.4c0-0.2%2C0.1-0.3%2C0.3-0.3S9%2C0.2%2C9%2C0.4V4h5.4V0.4c0-0.2%2C0.1-0.3%2C0.3-0.3c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3v7.9%0A%09%09c0%2C0.2-0.1%2C0.3-0.3%2C0.3c-0.2%2C0-0.3-0.1-0.3-0.3V4.6H9v3.7c0%2C0.2-0.1%2C0.3-0.3%2C0.3S8.4%2C8.4%2C8.4%2C8.3V0.4z%22%2F%3E%0A%09%3Cpath%20d%3D%22M17.5%2C8.2V0.5c0-0.2%2C0.1-0.3%2C0.3-0.3h5.4c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3c0%2C0.2-0.1%2C0.3-0.3%2C0.3h-5.1V4h4.6C22.9%2C4%2C23%2C4.1%2C23%2C4.3%0A%09%09c0%2C0.2-0.1%2C0.3-0.3%2C0.3h-4.6V8h5.2c0.2%2C0%2C0.3%2C0.1%2C0.3%2C0.3c0%2C0.2-0.1%2C0.3-0.3%2C0.3h-5.5C17.7%2C8.5%2C17.5%2C8.4%2C17.5%2C8.2z%22%2F%3E%0A%09%3Cpath%20d%3D%22M29%2C0.9c0-0.4%2C0.3-0.7%2C0.7-0.7h2.6c2%2C0%2C3.2%2C1.1%2C3.2%2C2.8v0c0%2C1.9-1.5%2C2.9-3.4%2C2.9h-1.7v2c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.9z%20M32.2%2C4.5C33.3%2C4.5%2C34%2C3.9%2C34%2C3v0c0-1-0.7-1.5-1.8-1.5h-1.7v3H32.2z%22%2F%3E%0A%09%3Cpath%20d%3D%22M37%2C0.9c0-0.4%2C0.3-0.7%2C0.7-0.7h3c1.1%2C0%2C1.9%2C0.3%2C2.4%2C0.8c0.4%2C0.5%2C0.7%2C1.1%2C0.7%2C1.8v0c0%2C1.3-0.8%2C2.2-1.9%2C2.5l1.6%2C2%0A%09%09c0.1%2C0.2%2C0.2%2C0.3%2C0.2%2C0.6c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.3%2C0-0.6-0.2-0.7-0.4l-2-2.6h-1.9v2.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.9z%20M40.7%2C4.3c1.1%2C0%2C1.7-0.6%2C1.7-1.4v0c0-0.9-0.6-1.4-1.7-1.4h-2.1v2.8H40.7z%22%2F%3E%0A%09%3Cpath%20d%3D%22M45.8%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M49.5%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7h0.2c0.4%2C0%2C0.6%2C0.2%2C0.8%2C0.4L55.4%2C6V0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7H56c-0.3%2C0-0.6-0.2-0.8-0.4L51%2C2.6v5.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M61.1%2C1.5h-2c-0.4%2C0-0.7-0.3-0.7-0.7c0-0.4%2C0.3-0.7%2C0.7-0.7h5.6c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-2.1v6.4%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7s-0.7-0.3-0.7-0.7V1.5z%22%2F%3E%0A%09%3Cpath%20d%3D%22M66.8%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v6.4H72c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-4.5%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M74.3%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M78%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7h0.2c0.3%2C0%2C0.5%2C0.2%2C0.7%2C0.4l2.5%2C4l2.6-4c0.2-0.3%2C0.4-0.4%2C0.7-0.4h0.2c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7%0A%09%09v7c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7v-5l-2.1%2C3.1c-0.2%2C0.2-0.3%2C0.4-0.6%2C0.4c-0.3%2C0-0.5-0.1-0.6-0.4l-2-3.1v5%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7S78%2C8.3%2C78%2C7.9V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M88.5%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M92.2%2C0.8c0-0.4%2C0.3-0.7%2C0.7-0.7h0.2c0.4%2C0%2C0.6%2C0.2%2C0.8%2C0.4L98.1%2C6V0.8c0-0.4%2C0.3-0.7%2C0.7-0.7c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7v7.1%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-0.1c-0.3%2C0-0.6-0.2-0.8-0.4l-4.3-5.6v5.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V0.8z%22%2F%3E%0A%09%3Cpath%20d%3D%22M101.2%2C7.6l3.1-7c0.2-0.4%2C0.5-0.6%2C0.9-0.6h0.1c0.4%2C0%2C0.7%2C0.2%2C0.9%2C0.6l3.1%2C7c0.1%2C0.1%2C0.1%2C0.2%2C0.1%2C0.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.3%2C0-0.6-0.2-0.7-0.5l-0.7-1.6h-4.1l-0.7%2C1.6c-0.1%2C0.3-0.4%2C0.5-0.7%2C0.5c-0.4%2C0-0.7-0.3-0.7-0.7C101.1%2C7.8%2C101.2%2C7.7%2C101.2%2C7.6z%0A%09%09%20M106.7%2C5.2l-1.5-3.4l-1.5%2C3.4H106.7z%22%2F%3E%0A%09%3Cpath%20d%3D%22M112.1%2C1.5h-2c-0.4%2C0-0.7-0.3-0.7-0.7c0-0.4%2C0.3-0.7%2C0.7-0.7h5.6c0.4%2C0%2C0.7%2C0.3%2C0.7%2C0.7c0%2C0.4-0.3%2C0.7-0.7%2C0.7h-2.1v6.4%0A%09%09c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.4%2C0-0.7-0.3-0.7-0.7V1.5z%22%2F%3E%0A%09%3Cpath%20d%3D%22M117%2C4.4L117%2C4.4c0-2.4%2C1.8-4.4%2C4.4-4.4c2.6%2C0%2C4.4%2C2%2C4.4%2C4.3v0c0%2C2.4-1.8%2C4.3-4.4%2C4.3C118.8%2C8.7%2C117%2C6.7%2C117%2C4.4z%0A%09%09%20M124.2%2C4.4L124.2%2C4.4c0-1.7-1.2-3-2.9-3s-2.8%2C1.3-2.8%2C3v0c0%2C1.6%2C1.2%2C3%2C2.9%2C3S124.2%2C6%2C124.2%2C4.4z%22%2F%3E%0A%09%3Cpath%20d%3D%22M127.5%2C0.9c0-0.4%2C0.3-0.7%2C0.7-0.7h3c1.1%2C0%2C1.9%2C0.3%2C2.4%2C0.8c0.4%2C0.5%2C0.7%2C1.1%2C0.7%2C1.8v0c0%2C1.3-0.8%2C2.2-1.9%2C2.5l1.6%2C2%0A%09%09c0.1%2C0.2%2C0.2%2C0.3%2C0.2%2C0.6c0%2C0.4-0.3%2C0.7-0.7%2C0.7c-0.3%2C0-0.6-0.2-0.7-0.4l-2-2.6H129v2.3c0%2C0.4-0.3%2C0.7-0.7%2C0.7%0A%09%09c-0.4%2C0-0.7-0.3-0.7-0.7V0.9z%20M131.2%2C4.3c1.1%2C0%2C1.7-0.6%2C1.7-1.4v0c0-0.9-0.6-1.4-1.7-1.4H129v2.8H131.2z%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A" alt="The Printliminator"> <h3><span>Just click stuff on page to remove.</span> Alt-click to remove opposite.</h3> </div> <div class="footer"> <h3>Other Useful Superpowers</h3> <ul> <li class="undo"><span class="icon"></span>Undo<br>Last</li> <li class="stylize"><span class="icon"></span>Add Print<br>Styles</li> <li class="no_graphics"><span class="icon"></span>Remove<br>Graphics</li> <li class="print"><span class="icon"></span>Send to<br>print</li> </ul> <div class="keyboard-area"> <p class="toggle keyboard">View Keyboard Commands</p> <table id="keyboard" style="display:none"> <thead> <tr><th class="key">Key</th><th>Description</th></tr> </thead> <tbody> <tr><td><kbd>PageUp</kbd> <span class="lower">or</span> <kbd class="bold" title="Up Arrow">&uarr;</kbd></td><td>Find wrapper of highlighted box</td></tr> <tr><td><kbd>PageDown</kbd> <span class="lower">or</span> <kbd class="bold" title="Down Arrow">&darr;</kbd></td><td>Find content of highlighted box</td></tr> <tr><td><kbd class="bold" title="Right Arrow">&rarr;</kbd></td><td>Find next box inside same wrapper</td></tr> <tr><td><kbd class="bold" title="Left Arrow">&larr;</kbd></td><td>Find previous box inside same wrapper</td></tr> <tr><td><kbd>Enter</kbd></td><td>Remove the highlighted box</td></tr> <tr><td><kbd>Backspace</kbd></td><td>Undo last action</td></tr> <tr><td><kbd title="Numpad Plus">Numpad <span class="bold">+</span></kbd> <span class="lower">or</span> <kbd title="Plus">+</kbd> </td><td>Increase font-size by 1</td></tr> <tr><td><kbd title="Numpad Minus">NumPad <span class="bold">-</span></kbd> <span class="lower">or</span> <kbd title="Minus">-</kbd></td><td>Decrease font-size by 1</td></tr> <tr><td><kbd title="Numpad Asterisk (Multiply)">NumPad <span class="bold asterisk">*</span></kbd> <span class="lower">or</span> <kbd title="Asterisk">*</kbd></td><td>Reset font-size</td></tr> <tr> <td><kbd>Alt</kbd> + <span class="icon left_click" title="left-click on mouse"></span></td> <td>Remove everything but highlighted box</td> </tr> <tr> <td><kbd>Shift</kbd> + <span class="icon left_click" title="left-click on mouse"></span></td> <td>Set box width to 100% &amp; margins to zero (highlight turns blue)</td> </tr> </tbody> </table> </div> </div><style>*, *:before, *:after { box-sizing: inherit; } html { box-sizing: border-box; height: 100%; } html, body { background: #eee; min-height: 220px; font-family: "Lucida Grande", "Lucida Sans Unicode", Tahoma, sans-serif; font-size: 14px; margin: 0; padding: 0; cursor: default; overflow: hidden; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } .top { background: #fff; padding: 15px; } .top h3 { color: #ccc; margin: 0; } .top h3 span { color: red; } .header, li { background: #111; color: #fff; font-size: 11px; } .header, .header > div { height: 21px; font-size: 11px; } .header > div, li { display: inline-block; } .right { float: right; margin-right: 6px; } .footer { padding: 15px 15px 0 15px; } .footer ul { margin: 0 0 15px 0; padding: 0; list-style-type: none; } .keyboard-area { margin: 0 -15px 0 -15px; /* extend keyboard background outside of popup - accomidate for different row heights in browsers */ padding: 15px 15px 50px 15px; background: #ccc; } .toggle { font-size: 12px; margin: 0 0 15px 0; cursor: pointer; } .pl_logo { width: 225px; height: 15px; margin: 0 0 5px 0; } h1, h3 { margin: 0 0 10px; font-weight: normal; text-transform: uppercase; } h3 { font-size: 10px; font-weight: bold; } .close, ._printliminator_drag_icon { text-transform: uppercase; } .icon { display: inline-block; background: url(data:image/png;base64,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) no-repeat; width: 25px; height: 25px; vertical-align: middle; } ._printliminator_drag_icon .icon { background-position: 0 0; } .print .icon { background-position: -25px 0; } .close .icon { background-position: -75px 0; width: 40px; cursor: pointer; } .undo .icon { background-position: 0 -25px; } .no_graphics .icon { background-position: -25px -25px; } .stylize .icon { background-position: -75px -25px; width: 35px; } .left_click { background-position: -50px -25px; } li.busy .icon { background-position: -50px 0; -webkit-animation: spin 1.5s linear infinite; -moz-animation: spin 1.5s linear infinite; animation: spin 1.5s linear infinite; } @-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } } @-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } } @keyframes spin { 100% { -webkit-transform: rotate(360deg); transform: rotate(360deg); } } li { padding: 4px 14px 4px 4px; line-height: 12px; font-size: 10px; text-transform: uppercase; text-align: left; white-space: nowrap; margin: 2px; cursor: pointer; display: inline-block; } li:hover { background-color: #333; } li span { float: left; margin: 0 10px 0 0; text-align: left; } .key { width: 30%; } table { margin: 0 4px; border-spacing: 0; } th { text-align: left; padding: 0; } kbd { background: #fff; border: #000 1px solid; border-radius: 3px; padding: 1px 3px; } td { border-top: 1px solid #aaa; font-size: 12px; padding: 5px; /* make Firefox match Webkit */ line-height: 18px; } </style>');

		frame.close();

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

	toggleSelection : function( disable ) {
		var body = document.body;
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
		if ( el ) {
			if ( el.classList ) {
				el.classList.add( name );
			} else if ( !pl.hasClass( el, name ) ) {
				el.className += ' ' + name;
			}
		}
	},

	removeClass : function( el, name ) {
		if ( el ) {
			if ( el.classList ) {
				el.classList.remove( name );
			} else {
				el.className = el.className.replace( new RegExp( '\\b' + name + '\\b', 'g' ), '' );
			}
		}
	},

	hasClass : function( el, name ) {
		if ( el ) {
			return el.classList ?
				el.classList.contains( name ) :
				new RegExp( '\\b' + name + '\\b' ).test( el.className );
		}
		return false;
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

})();
