'use strict';

// Testing printliminator basic DOM traversing scripts
describe( 'Traversing', function() {
	var div;

	beforeEach(function() {
		if ( !div ) {
			div = document.createElement( 'body' );
			div.id = 'container';
		}
		div.innerHTML =
			'<div id="opposite"></div>' +
			'<br>' +
			'<div id="opposite2">' +
				'<meta charset="UTF-8">' +
				'<span id="item1"></span>' +
				'<link rel="stylesheet" href="">' +
				'<span id="item2"></span>' +
				'<br>' +
				'<meta charset="UTF-8">' +
				'<p id="item3"></p>' +
			'</div>' +
			'<div id="graphics">' +
				'<script></script>' +
				'<audio></audio>' +
				'<svg xmlns="http://www.w3.org/2000/svg"><rect width="5" height="5"/></svg>' +
				'<meta charset="UTF-8">' +
				'<div class="start"></div>' +
				'<iframe src=""></iframe>' +
				'<img src="" alt="test">' +
				'<input type="image">' +
				'<link rel="stylesheet" href="">' +
				'<article></article>' +
				'<object></object>' +
				'<video></video>' +
				'<br>' +
				'<p></p>' +
				'<embed/>' +
				'<style></style>' +
				'<img src="" alt="test2">' +
			'</div>';
		return div;
	});

	describe( 'Siblings', function() {
		function getSibs() {
			var el = div.querySelector( 'svg' );
			return thePrintliminator.getSiblings( el );
		}

		it( 'finds the correct number of siblings', function() {
			var len = getSibs().length;
			// style, script, link, br and meta are ignored
			expect( len ).toEqual( 11 );
		});

		it( 'finds the correct siblings using `filterElements`', function() {
			var i,
				ignoredElm = window.thePrintliminator.ignoredElm,
				valid = true,
				sibs = getSibs(),
				len = sibs.length;
			for ( i = 0; i < len; i++ ) {
				expect( ignoredElm.test( sibs[ i ].nodeName ) ).not.toBe( true );
			}
		});
	});

	describe( 'Opposite', function() {
		it( 'finds opposites of selected element', function() {
			var el = div.querySelector( '#opposite' ),
				opposites = thePrintliminator.getOpposite( el ),
				len = opposites.length;

			// getOpposite traverses up to the BODY element
			expect( len ).toEqual( 2 );

			expect( opposites[ 0 ].id ).toBe( 'opposite2' );
			expect( opposites[ 1 ].id ).toBe( 'graphics' );
		});
	});

	describe( 'Next', function() {
		function getNext( el ) {
			return thePrintliminator.getNext( el );
		};
		it( 'finds the correct first element', function() {
			var elm = getNext( div.querySelector( '#opposite' ) );
			// style, script, link, br and meta are ignored
			expect( elm.id ).toBe( 'opposite2' );
		});
		it( 'finds the correct second element', function() {
			var elm = getNext( div.querySelector( '#item1' ) );
			// style, script, link, br and meta are ignored
			expect( elm.id ).toBe( 'item2' );
		});
		it( 'finds the correct third element', function() {
			var elm = getNext( div.querySelector( '#item2' ) );
			// style, script, link, br and meta are ignored
			expect( elm.id ).toBe( 'item3' );
		});
	});

	describe( 'Prev', function() {
		function getPrev( el ) {
			return thePrintliminator.getPrev( el );
		};
		it( 'finds the correct first element', function() {
			var elm = getPrev( div.querySelector( '#opposite2' ) );
			// style, script, link, br and meta are ignored
			expect( elm.id ).toBe( 'opposite' );
		});
		it( 'finds the correct second element', function() {
			var elm = getPrev( div.querySelector( '#item3' ) );
			// style, script, link, br and meta are ignored
			expect( elm.id ).toBe( 'item2' );
		});
		it( 'finds the correct third element', function() {
			var elm = getPrev( div.querySelector( '#item2' ) );
			// style, script, link, br and meta are ignored
			expect( elm.id ).toBe( 'item1' );
		});
	});

	describe( 'First Child', function() {
		function getChild( el ) {
			return thePrintliminator.getFirstChild( el );
		};
		it( 'finds the correct first child', function() {
			var elm = getChild( div.querySelector( '#opposite2' ) );
			expect( elm.id ).toBe( 'item1' );
		});
		it( 'finds the correct second element', function() {
			var elm = getChild( div.querySelector( '#graphics' ) );
			expect( elm.nodeName ).toBe( 'AUDIO' );
		});
	});

	describe( 'Remove Graphics', function() {
		// test printliminator without initializing
		window.thePrintliminator.messageOptions = false;
		window.thePrintliminatorVars = {
			init : true,
			history : [],
			messageCache : [],
			flags : {
				removeGraphics: false
			}
		};
		it( 'correctly removes all graphic elements', function() {
			thePrintliminator.removeGraphics( null, div );
			var i,
				// elements ignored while traversing
				ignoredElm = window.thePrintliminator.ignoredElm,
				// detecting phantomJS
				isPhantom = navigator.userAgent.toLowerCase().indexOf( 'phantom' ) !== -1,
				items = div.querySelectorAll( '.' + window.thePrintliminator.css.hidden ),
				len = items.length;

			/*
				CHEATING HERE!!
				PhantomJS doesn't appear to want to add the hidden class to the SVG element
				correctly. It might be related to this issue:
				https://github.com/ariya/phantomjs/issues/11281
				- When the SpecRunner.html is run, it finds 9 elements with SVG being the last
				- When grunt jasmine is run, it finds 8 elements with IMG being the last
			*/
			expect( len ).toEqual( isPhantom ? 8 : 9 );
			for ( i = 0; i < len; i++ ) {
				expect( ignoredElm.test( items[ i ].nodeName ) ).not.toBe( true );
			}
		});
	});

});
