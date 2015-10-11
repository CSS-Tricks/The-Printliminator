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


		// class name used by popup.js to prevent multiple js injection
		enabled   : '_printliminator_enabled'
	},

	// message options
	messageOptions : {
		show      : true,    // show messages (F1 to toggle)
		limit     : 6,   // messages on screen
		fade      : 300,    // message fadeout (ms)
		duration  : 4000 // message visible (ms)
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

		messages  : 112, // F1

		// use event key below
		opposite  : 'altKey',  // alt + click
		fullWidth : 'shiftKey' // shift + click
	},

	// elements hidden when "remove graphics" is selected
	noGraphics  : 'img, iframe:not(._printliminator_controls), object, embed, audio, video, input[type=image], svg',
	// elements to ignore while traversing
	ignoredElm  : /^(br|meta|style|link|script)$/i,


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

		}



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

		// highlighting elements & keyboard binding
		pl.addEvent( body, 'click', pl.bodyClick );
		pl.addEvent( body, 'mouseover', pl.bodyMouseover );
		pl.addEvent( body, 'mouseout', pl.removeHighlight );
		pl.addEvent( document, 'keyup', pl.bodyKeyUp );
		pl.addEvent( document, 'keydown', pl.bodyKeyDown );

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
						pl.showMessage( msg.fullWidthRestore, hilite );
						pl.removeClass( hilite, pl.css.fullWidth );
					});
					pl.showMessage( msg.fullWidthApply, hilite );
				}
			} else {
				// show opposite
				// Alt + click
				if ( event[ pl.keys.opposite ] ) {
					done = pl.getOpposite( hilite );
					sel = done.length;
					if ( sel ) {
						opposite = true;
						pl.showMessage( msg.oppositeApply, hilite );
					} else {
						// nothing left to remove
						pl.showMessage( msg.oppositeNothing );
						return;
					}
				} else {
					// hide clicked element
					done = [ hilite ];
					pl.showMessage( msg.hideUsingClick, hilite );
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
		if ( !pl.hasClass( event.target, pl.css.messages ) ) {
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

			// F1 toggle messages
			case pl.keys.messages:
				pl.messageOptions.show = !pl.messageOptions.show;
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
						pl.showMessage( msg.findParent, els );
						pl.addClass( els, highlight );
					}
					break;

				case pl.keys.child1 : // pageDown
				case pl.keys.child2 : // down arrow
					elm = pl.getFirstChild( el );
					if ( elm ) {
						pl.removeClass( el, highlight );
						// first visible child element
						pl.showMessage( msg.findChild, elm );
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.nextSib : // right arrow (siblings)
					elm = pl.getNext( el );
					if ( !isBody && elm ) {
						pl.removeClass( el, highlight );
						pl.showMessage( msg.findNext, elm );
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.prevSib : // left arrow (siblings)
					elm = pl.getPrev( el );
					if ( !isBody && elm ) {
						pl.removeClass( el, highlight );
						pl.showMessage( msg.findPrev, elm );
						pl.addClass( elm, highlight );
					}
					break;

				case pl.keys.hide : // enter
					if ( !isBody ) {
						pl.showMessage( msg.hideUsingKeyboard, el );
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
				pl.showMessage( msg.fontUp + body.style.fontSize );
				break;

			case pl.keys.fontDown1 : // Numpad - = Decrease font size
			case pl.keys.fontDown2 : // -
				body.style.fontSize = ( parseFloat( n ) - 1 ) + suffix;
				pl.showMessage( msg.fontDown + body.style.fontSize );
				break;

			case pl.keys.fontReset1 : // Numpad * = reset font-size
			case pl.keys.fontReset2 : // 8 (unshifted *)
				body.style.fontSize = '';
				pl.showMessage( msg.fontReset );
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
			// not hidden
			!( pl.hasClass( elm, pl.css.hidden ) || elm.style.display === 'none' );
	},

	getOpposite : function( el ) {
		var sibs,
			done = [];
		// hide messaging to prevent code from targeting it
		pl.hideMsgContainer();

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
			pl.showMessage( pl.messages.noGraphicsApply );

			thePrintliminatorVars.history.push( function() {
				pl.showMessage( pl.messages.noGraphicsRestore );
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
			pl.hideMsgContainer();
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
			pl.showMessage( pl.messages.stylizeAdd );

			thePrintliminatorVars.history.push( function() {
				pl.showMessage( pl.messages.stylizeRemove );
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

		pl.removeHighlight();
		pl.hideMsgContainer();
		window.print();

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
				pl.showMessage( pl.messages.undo, last );
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


		body.removeChild( document.querySelector( 'ul.' + pl.css.messages ) );
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
