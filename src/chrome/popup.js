/*globals chrome */
// inject printliminator from popup & control from there.
var commands = {
	remove : function() {
		chrome.tabs.executeScript( null, {
			code: 'thePrintliminator.removeGraphics();'
		});
	},
	print : function() {
		document.querySelector( 'li.print' ).classList.add( '/* @echo busy */' );
		// ready state is delayed when a file on the page is not found
		chrome.tabs.executeScript( null, {
			code : 'document.readyState === "complete";'
		}, function( result ) {
			if ( result && result[ 0 ] === true ) {
				window.close();
				chrome.tabs.executeScript( null, {
					code : 'thePrintliminator.print();'
				});
			} else {
				// keep checking ready state for 20 seconds
				// if still not ready, abort, but still call print function
				var loopy = function( i ) {
					setTimeout(function () {
						chrome.tabs.executeScript( null, {
							code : 'document.readyState === "complete";'
						}, function( result ) {
							if ( result && result[ 0 ] === true || i === 1 ) {
								i = 0;
								window.close();
								chrome.tabs.executeScript( null, {
									code : 'thePrintliminator.print();'
								});
							}
							if ( --i > 0 ) {
								loopy(i);
							}
						});
					}, 1000);
				};
				// repeat 20 times (20 seconds), then just close the popup
				loopy( 20 );
			}
		});
	},
	stylize : function() {
		chrome.tabs.executeScript( null, {
			code : 'thePrintliminator.stylize();'
		});
	},
	keyboard : function() {
		var indx,
			table = document.querySelector( '#/* @echo keyboard */' ),
			mode = table.style.display === 'none';
		table.style.display = mode ? '' : 'none';
		this.innerHTML = chrome.i18n.getMessage( mode ? 'hideKeyboardCommands' : 'viewKeyboardCommands' );
	},
	undo : function() {
		chrome.tabs.executeScript( null, {
			code : 'thePrintliminator.undo();'
		});
	},
	setLanguage : function(){
		// update all text content
		commands.getMsg( document.querySelectorAll( '[i18n-text]' ), 'text' );
		commands.getMsg( document.querySelectorAll( '[i18n-title]' ), 'title' );
	},
	getMsg : function( elms, target ) {
		var indx, msgKey, message,
			len = elms.length;
		for ( indx = 0; indx < len; indx++ ) {
			msgKey = elms[ indx ].getAttribute( 'i18n-' + target );
			message = chrome.i18n.getMessage( msgKey );
			if ( target === 'text' ) {
				elms[ indx ].innerHTML += message;
			} else {
				elms[ indx ].title = message.replace( '<br>', ' ' );
			}
		}
	}
};

chrome.windows.getCurrent( function( win ) {
	chrome.tabs.query({
		windowId : win.id,
		active : true
	}, function( tabArray ) {

		// don't try to open a popup on chrome settings pages
		if ( tabArray && /^chrome/.test( tabArray[ 0 ].url || '' ) ) {
			return false;
		}

		// inject css & js only on initial click
		chrome.tabs.executeScript( null, {
			code : 'document.querySelector( "body" ).classList.contains( "/* @echo enabled */" );',
			matchAboutBlank : true
		}, function( result ) {
			if ( result && !result[ 0 ] ) {
				chrome.tabs.insertCSS( null, {
					file : 'printliminator.css',
					matchAboutBlank : true
				});

				chrome.tabs.executeScript( null, {
					file: 'printliminator.js',
					matchAboutBlank : true
				}, function() {
					chrome.tabs.executeScript( null, {
						code : 'thePrintliminator.init();'
					});
				});
			}
			// update Language
			commands.setLanguage();
		});

		// Remove graphics
		var el = document.querySelector( './* @echo noGraphics */' );
		el.removeEventListener( 'click', commands.remove );
		el.addEventListener( 'click', commands.remove );

		// Print
		el = document.querySelector( './* @echo print */' );
		el.removeEventListener( 'click', commands.print );
		el.addEventListener( 'click', commands.print );

		// Add print stylesheet
		el = document.querySelector( './* @echo stylize */' );
		el.removeEventListener( 'click', commands.stylize );
		el.addEventListener( 'click', commands.stylize );

		// Undo
		el = document.querySelector( './* @echo undo */' );
		el.removeEventListener( 'click', commands.undo );
		el.addEventListener( 'click', commands.undo );

		// keyboard
		el = document.querySelector( './* @echo toggle */' );
		el.removeEventListener( 'click', commands.keyboard );
		el.addEventListener( 'click', commands.keyboard );

	});
});
