/* Printliminator */
function csstricksPrintliminator( jQ ) {
	// remove conflicts with other javascript libraries
	var $ = jQ.noConflict(),
	history = [],
	dont = false,
	// programmically added stylesheets
	root = '', // '//css-tricks.com/examples/ThePrintliminator/';
	styles = '' +
		'._print_controls { position: fixed; top: 25px; right: 25px; width: 162px; height: 182px; z-index: 10000;' +
			'-moz-user-select: none; -webkit-user-select: none; -ms-user-select: none;' +
			'background: url(' + root + 'images/printliminator2.png) no-repeat; }' +
		'._print_controls_close { position: absolute; top: -20px; right: -20px; width: 33px; height: 33px;' +
			'background: url(' + root + 'images/printliminator2.png) -222px -3px no-repeat; }' +
		'._print_controls_close:hover { background-position: -222px -39px; }' +
		'._print_controls_remove_graphics, ._print_controls_print, ._print_controls_undo, ._print_controls_stylize {' +
			'position: absolute; height: 74px; width: 74px;' +
			'background: url(' + root + 'images/printliminator2.png) no-repeat; }' +
		'._print_controls_remove_graphics { top: 6px; left: 6px; background-position: 0px -182px; }' +
		'._print_controls_remove_graphics:hover { background-position: 0 -256px; }' +
		'._print_controls_remove_graphics.active { background-position: 0 -330px; }' +
		'._print_controls_print { top: 83px; left: 83px; background-position: -74px -182px; }' +
		'._print_controls_print:hover { background-position: -74px -256px; }' +
		'._print_controls_print.active { background-position: -74px -330px; }' +
		'._print_controls_undo { top: 83px; left: 6px; background-position: -148px -182px; }' +
		'._print_controls_undo:hover { background-position: -148px -256px; }' +
		'._print_controls_undo.active { background-position: -148px -330px; }' +
		'._print_controls_stylize { top: 6px; left: 83px; background-position: -222px -182px; }' +
		'._print_controls_stylize:hover { background-position: -222px -256px; }' +
		'._print_controls_stylize.active { background-position: -222px -330px; }' +
		'._print_removed { display: none !important; }' +
		'._printliminator_highlight { outline: 3px solid red; }' +
		'@media print{ ._print_controls { display: none; } }',

	printstylesheet = '@media print, screen {' +
		'body { margin:0; padding:0; line-height: 1.4; word-spacing: 1.1pt; letter-spacing: 0.2pt;' +
			'font-family: Garamond, "Times New Roman", serif; color: #000; background: none; font-size: 12pt; }' +
		'h1, h2, h3, h4, h5, h6 { font-family: Helvetica, Arial, sans-serif; }' +
		'h1 { font-size: 19pt; }' +
		'h2 { font-size: 17pt; }' +
		'h3 { font-size: 15pt; }' +
		'h4, h5, h6 { font-size: 12pt; }' +
		'code { font: 10pt Courier, monospace; }' +
		'blockquote { margin: 1.3em; padding: 1em;  font-size: 10pt; }' +
		'hr { background-color: #ccc; }' +
		'img { float: left; margin: 1em 1.5em 1.5em 0; }' +
		'a img { border: none; }' +
		'table { margin: 1px; text-align: left; border-collapse: collapse; }' +
		'th { border: 1px solid #333;  font-weight: bold; }' +
		'td { border: 1px solid #333; }' +
		'th, td { padding: 4px 10px; }' +
		'tfoot { font-style: italic; }' +
		'caption { background: #fff; margin-bottom: 20px; text-align: left; }' +
		'thead {display: table-header-group; }' +
		'tr { page-break-inside: avoid; }' +
		'} @media screen { body { padding: 20px; } }';

	$( '<style id="_print_controls_styles">' )
		.text( styles )
		.appendTo( 'head' );

	$( 'body *:not(._print_controls, ._print_controls *)' )
		.live( 'click', function( e ) {
			if ( !dont ) {
				e.preventDefault();
				var $done,
					$this = $( this );
				if ( e.altKey ) {
					$done = $( 'body *' )
						.not( '._print_controls, ._print_controls *, style' )
						.not( $this.parents().andSelf() )
						.not( $this.find( '*' ) )
						.addClass( '_print_removed' );
				} else {
					$done = $this;
				}
				$done.addClass( '_print_removed' );
				history.push( $done );
			}
		})
		.live( 'mouseover', function() {
			if ( !dont ) { $(this).addClass( '_printliminator_highlight' ); }
		})
		.live( 'mouseout', function() {
			if ( !dont ) { $(this).removeClass( '_printliminator_highlight' ); }
		});

	var $controls = $( '<div class="_print_controls">' )
		.appendTo( 'body' );

	// fix IE6, which doesn't support position: fixed
	if ( $controls.css( 'position' ) !== 'fixed' ) {
		$controls.css( 'position', 'absolute' );
	}

	// Remove Graphics
	$( '<div class="_print_controls_remove_graphics">' )
		.click( function() {
			var indx, $el, bkgd,
				bkgds = [],
				$done = $( 'img, iframe, object, embed, input[type=image], ins' ),
				$item = $( 'body *:not(._print_controls, ._print_controls *)' ),
				len = $item.length;
			for ( indx = 0; indx < len; indx++ ) {
				$el = $item.eq( indx );
				bkgd = $el.css( 'background-image' );
				if ( bkgd !== 'none' ) {
					bkgds.push( [ $el, bkgd ] );
					$el.css( 'background-image', 'none' );
				}
			}
			$done.addClass( '_print_removed' );

			history.push( function() {
				$done.removeClass( '_print_removed' );
				var $el,
					len = bkgds.length;
				for ( indx = 0; indx < len; indx++ ) {
					$el = bkgds[ indx ][ 0 ];
					$el.css( 'background-image', bkgds[ indx ][ 1 ] );
				}
			});
		})
		.appendTo( $controls );

	// Print Stylize
	$( '<div class="_print_controls_stylize">' )
		.click( function() {
			window.print();
		})
		.appendTo( $controls );

	// Print
	$( '<div class="_print_controls_print">' )
		.click( function() {
			var links = $( 'link[rel="stylesheet"], style:not(#_print_controls_styles)' ).remove(),
			// cache and remove inline styles
			inline = $( 'body *:not(._print_controls, ._print_controls > *, ._print_removed)' ).map( function() {
				var $this = $( this ),
					style = $this.attr( 'style' );
				$this.attr( 'style', '' );
				return {
					el: this,
					style: style
				};
			}),
			print = $( '<style id="_print_controls_printstylesheet">' )
				.text( printstylesheet )
				.appendTo( 'head' );

			history.push( function() {
				print.remove();
				links.appendTo( 'head' );
				inline.each( function() {
					$( this.el ).attr( 'style', this.style );
				});
			});
		})
		.appendTo( $controls );

	// Close
	$( '<div class="_print_controls_close">' )
		.click( function() {
			$( '._print_controls, #_print_controls_styles' ).remove();
		})
		.appendTo( $controls );

	// Undo
	$( '<div class="_print_controls_undo">' )
		.click( function() {
			var last = history.pop();
			if ( last ) {
				if ( typeof last !== 'function' ) {
					last.removeClass( '_print_removed' );
				} else {
					last.call();
				}
			}
		})
		.appendTo( $controls );

	// active state
	$( '._print_controls_remove_graphics, ._print_controls_print, ._print_controls_undo, ._print_controls_stylize' )
		.bind( 'mousedown', function() {
			$( this ).addClass( 'active' );
		})
		.bind( 'mouseleave mouseup', function() {
			$( this ).removeClass( 'active' );
		});

}
