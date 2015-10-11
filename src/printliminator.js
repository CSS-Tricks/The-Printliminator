/* Printliminator v{version}
 * https://github.com/CSS-Tricks/The-Printliminator
 */
/*jshint expr:false */
/*globals thePrintliminatorVars */
;( function() {
'use strict';

var pl = window.thePrintliminator = {

	version : '{version}',

	// preprocess is used to echo in settings from options.json
	css : {
		hilite    : '/* @echo settings.hilite */',
		fullWidth : '/* @echo settings.fullWidth */',
		hidden    : '/* @echo settings.hidden */',
		// class name added to body when print styles applied (used in printliminator.css)
		stylized  : '/* @echo settings.stylized */',
		messages  : '/* @echo settings.messages */',

		// @if MODE='BOOKMARKLET'
		noSelection: '/* @echo settings.noSelection */', // class on body while dragging
		// exposed in main document
		stylesheet : '/* @echo settings.stylesheet */', // stylesheet ID
		wrap       : '/* @echo settings.wrap */',
		controls   : '/* @echo settings.controls */',
		drag       : '/* @echo settings.drag */',
		dragActive : '/* @echo settings.dragActive */',
		// inside bookmarklet iframe
		icon       : '/* @echo settings.icon */',
		noGraphics : '/* @echo settings.noGraphics */',
		stylize    : '/* @echo settings.stylize */',
		print      : '/* @echo settings.print */',
		close      : '/* @echo settings.close */',
		undo       : '/* @echo settings.undo */',
		busy       : '/* @echo settings.busy */',
		keyboard   : '/* @echo settings.keyboard */',
		toggle     : '/* @echo settings.toggle */'
		// @endif

		// @if MODE='EXT'
		// class name used by popup.js to prevent multiple js injection
		enabled   : '/* @echo settings.enabled */'
		// @endif
	},

	// @if MODE='EXT'
	// message options
	messageOptions : {
		show      : /* @echo settings.messageShow */,    // show messages (F1 to toggle)
		limit     : /* @echo settings.messageLimit */,   // messages on screen
		fade      : /* @echo settings.messageFade */,    // message fadeout (ms)
		duration  : /* @echo settings.messageDuration */ // message visible (ms)
	},

	messages : {
		fullWidthApply    : 'Made selection full width',
		fullWidthRestore  : 'Removed full width',
		oppositeApply     : 'Removed everything but',
		oppositeNothing   : 'Nothing to remove',
		hideUsingClick    : 'Removed',
		hideUsingKeyboard : 'Removed',
		findParent        : 'Found wrapper',
		findChild         : 'Found inside',
		findNext          : 'Found next',
		findPrev          : 'Found previous',
		fontUp            : 'Set font size: ',
		fontDown          : 'Set font size: ',
		fontReset         : 'Reset font size',
		stylizeAdd        : 'Added print stylesheet',
		stylizeRemove     : 'Removed print stylesheet',
		noGraphicsApply   : 'Removed graphics',
		noGraphicsRestore : 'Restored graphics',
		undo              : 'Restored'
	},
	// @endif

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

		// @if MODE='EXT'
		messages  : 112, // F1
		// @endif

		// use event key below
		opposite  : 'altKey',  // alt + click
		fullWidth : 'shiftKey' // shift + click
	},

	// elements hidden when "remove graphics" is selected
	noGraphics  : 'img, iframe:not(./* @echo settings.controls */), object, embed, audio, video, input[type=image], svg',
	// elements to ignore while traversing
	ignoredElm  : /^(br|meta|style|link|script)$/i,

	// @if MODE='BOOKMARKLET'
	// iframe height with keyboard open/closed
	keyboardOpen   : /* @echo settings.keyboardOpen */,
	keyboardClosed : /* @echo settings.keyboardClosed */,

	// Bookmarklet popup - dragging parameters stored here
	drag : {
		el : null,
		pos : [ 0, 0 ],
		elm : [ 0, 0 ]
	},
	// @endif

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

			// @if MODE='BOOKMARKLET'
			pl.addStyles();
			// @endif
		}


		// @if MODE='BOOKMARKLET'
		pl.addControls();
		// @endif

		// @if MODE='EXT'
		// add messages
		if ( !document.querySelector( 'ul.' + pl.css.messages ) ) {
			el = document.createElement( 'ul' );
			pl.addClass( el, pl.css.messages );
			body.appendChild( el );
		}

		// don't reapply event listeners when
		// javascript is injected more than once
		if ( pl.hasClass( body, pl.css.enabled ) ) {
			return;
		}
		pl.addClass( body, pl.css.enabled );
		// @endif

		// highlighting elements & keyboard binding
		pl.addEvent( body, 'click', pl.bodyClick );
		pl.addEvent( body, 'mouseover', pl.bodyMouseover );
		pl.addEvent( body, 'mouseout', pl.removeHighlight );
		pl.addEvent( document, 'keyup', pl.bodyKeyUp );
		pl.addEvent( document, 'keydown', pl.bodyKeyDown );

		// @if MODE='BOOKMARKLET'
		// drag
		pl.addEvent( document, 'mouseup', pl.docMouseUp );
		pl.addEvent( document, 'mousemove', pl.docMouseMove );
		// @endif
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
						// @if MODE='EXT'
						pl.showMessage( msg.fullWidthRestore, hilite );
						// @endif
						pl.removeClass( hilite, pl.css.fullWidth );
					});
					// @if MODE='EXT'
					pl.showMessage( msg.fullWidthApply, hilite );
					// @endif
				}
			} else {
				// show opposite
				// Alt + click
				if ( event[ pl.keys.opposite ] ) {
					done = pl.getOpposite( hilite );
					sel = done.length;
					if ( sel ) {
						opposite = true;
						// @if MODE='EXT'
						pl.showMessage( msg.oppositeApply, hilite );
						// @endif
					} else {
						// nothing left to remove
						// @if MODE='EXT'
						pl.showMessage( msg.oppositeNothing );
						// @endif
						return;
					}
				} else {
					// hide clicked element
					done = [ hilite ];
					// @if MODE='EXT'
					pl.showMessage( msg.hideUsingClick, hilite );
					// @endif
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
		// @if MODE='BOOKMARKLET'
		if ( !pl.hasClass( event.target, pl.css.controls ) ) {
		// @endif
		// @if MODE='EXT'
		if ( !pl.hasClass( event.target, pl.css.messages ) ) {
		// @endif
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

			// @if MODE='EXT'
			// F1 toggle messages
			case pl.keys.messages:
				pl.messageOptions.show = !pl.messageOptions.show;
				break;
			// @endif
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
						// @if MODE='EXT'
						pl.showMessage( msg.findParent, els );
						// @endif
						pl.addClass( els, highlight );
					}
					break;

				case pl.keys.child1 : // pageDown
				case pl.keys.child2 : // down arrow
					elm = pl.getFirstChild( el );
					if ( elm ) {
						pl.removeClass( el, highlight );
						// first visible child element
						// @if MODE='EXT'
						pl.showMessage( msg.findChild, elm );
						// @endif
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.nextSib : // right arrow (siblings)
					elm = pl.getNext( el );
					if ( !isBody && elm ) {
						pl.removeClass( el, highlight );
						// @if MODE='EXT'
						pl.showMessage( msg.findNext, elm );
						// @endif
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.prevSib : // left arrow (siblings)
					elm = pl.getPrev( el );
					if ( !isBody && elm ) {
						pl.removeClass( el, highlight );
						// @if MODE='EXT'
						pl.showMessage( msg.findPrev, elm );
						// @endif
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.hide : // enter
					if ( !isBody ) {
						// @if MODE='EXT'
						pl.showMessage( msg.hideUsingKeyboard, el );
						// @endif
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
				// @if MODE='EXT'
				pl.showMessage( msg.fontUp + body.style.fontSize );
				// @endif
				break;

			case pl.keys.fontDown1 : // Numpad - = Decrease font size
			case pl.keys.fontDown2 : // -
				body.style.fontSize = ( parseFloat( n ) - 1 ) + suffix;
				// @if MODE='EXT'
				pl.showMessage( msg.fontDown + body.style.fontSize );
				// @endif
				break;

			case pl.keys.fontReset1 : // Numpad * = reset font-size
			case pl.keys.fontReset2 : // 8 (unshifted *)
				body.style.fontSize = '';
				// @if MODE='EXT'
				pl.showMessage( msg.fontReset );
				// @endif
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
			// @if MODE='BOOKMARKLET'
			// not controls
			!pl.hasClass( elm, pl.css.controls ) &&
			// @endif
			// not hidden
			!( pl.hasClass( elm, pl.css.hidden ) || elm.style.display === 'none' );
	},

	getOpposite : function( el ) {
		var sibs,
			done = [];
		// @if MODE='EXT'
		// hide messaging to prevent code from targeting it
		pl.hideMsgContainer();
		// @endif

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
			// @if MODE='EXT'
			pl.showMessage( pl.messages.noGraphicsApply );
			// @endif

			thePrintliminatorVars.history.push( function() {
				// @if MODE='EXT'
				pl.showMessage( pl.messages.noGraphicsRestore );
				// @endif
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
			// @if MODE='EXT'
			pl.hideMsgContainer();
			// @endif
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
			// @if MODE='EXT'
			pl.showMessage( pl.messages.stylizeAdd );
			// @endif

			thePrintliminatorVars.history.push( function() {
				// @if MODE='EXT'
				pl.showMessage( pl.messages.stylizeRemove );
				// @endif
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
		// @if MODE='BOOKMARKLET'
		var frame = document.body.querySelector( 'iframe.' + pl.css.controls ).contentWindow.document;
		pl.addClass( frame.querySelector( 'li.' + pl.css.print ), pl.css.busy );
		// @endif

		pl.removeHighlight();
		// @if MODE='EXT'
		pl.hideMsgContainer();
		window.print();
		// @endif

		// @if MODE='BOOKMARKLET'
		// use setTimeout to allow class to render
		setTimeout( function() {
			window.print();
			pl.busy( function() {
				pl.removeClass( frame.querySelector( 'li.' + pl.css.print ), pl.css.busy );
			});
		}, 10);
		// @endif
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
				// @if MODE='EXT'
				pl.showMessage( pl.messages.undo, last );
				// @endif
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

		// @if MODE='BOOKMARKLET'
		// drag
		pl.removeEvent( document, 'mouseup', pl.docMouseUp );
		pl.removeEvent( document, 'mousemove', pl.docMouseMove );
		body.removeChild( document.querySelector( '.' + pl.css.wrap ) );
		// @endif

		// @if MODE='EXT'
		body.removeChild( document.querySelector( 'ul.' + pl.css.messages ) );
		// @endif
	},

	// @if MODE='BOOKMARKLET'
	addStyles : function() {
		var el,
		body = document.body,
		// programmically added stylesheets
		styles = '{styles}';

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
		frame.write('{popupHTML}<style>{popupCSS}</style>');

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
	// @endif

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

	// @if MODE='EXT'
	hideMsgContainer : function() {
		pl.addClass( document.querySelector( 'ul.' + pl.css.messages ), pl.css.hidden );
	},

	showMessage : function( txt, el ) {
		if ( pl.messageOptions.show ) {
			var msg = document.createElement( 'li' ),
				msgBox = document.querySelector( 'ul.' + pl.css.messages );
			pl.addClass( msg, pl.css.messages );
			if ( el ) {
				// make sure we only have one element
				if ( el.length ) {
					el = el[ 0 ];
				}
				txt += ': &lt;' + el.nodeName.toLowerCase() +
					(
						( el.classList.length > 1 && el.classList[ 0 ] !== pl.css.hilite ) ?
							' class="' + el.classList[0] + '"' :
							''
					) + '&gt;';
			}
			msgBox.appendChild( msg );
			msg.innerHTML = txt;
			// message element may get hidden
			pl.removeClass( msgBox, pl.css.hidden );
			thePrintliminatorVars.messageCache.push( msg );
		}
		if ( thePrintliminatorVars.messageCache.length > pl.messageOptions.limit ) {
			el = thePrintliminatorVars.messageCache.shift();
			el.parentNode.removeChild( el );
		} else if ( thePrintliminatorVars.messageCache.length ) {
			setTimeout( pl.clearMessage, pl.messageOptions.duration );
		}
	},

	clearMessage : function() {
		var s, step,
			msg = thePrintliminatorVars.messageCache.shift();
		// https://plainjs.com/javascript/effects/animate-an-element-property-44/
		if ( msg ) {
			s = msg.style;
			s.opacity = s.opacity || 1;
			step = 25 / ( pl.messageOptions.fade || 300 );
			( function fade() {
				if ( ( s.opacity -= step ) < 0 ) {
					s.display = 'none';
					msg.parentNode.removeChild( msg );
				} else {
					setTimeout( fade, 25 );
				}
			})();
		}
	},
	// @endif

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
