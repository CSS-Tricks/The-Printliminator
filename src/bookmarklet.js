// uncompressed bookmarklet code
(function () {
	function loadScript(url, callback) {
		var script = document.createElement('script'),
			head = document.getElementsByTagName('head')[0],
			done = false;
		script.type = 'text/javascript';
		script.src = url;
		script.onload = script.onreadystatechange = function() {
			if ( !done && ( !this.readyState || this.readyState == 'loaded' || this.readyState == 'complete' ) ) {
				done = true;
				callback();
			}
		};
		head.appendChild(script);
	}
	// dev = http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.js
	// production = //ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
	loadScript('{jQuery}', function() {
		var jQ132 = jQuery.noConflict();
		// dev = src/printliminator.js
		// production = //css-tricks.github.io/The-Printliminator/printliminator.min.js
		loadScript('{printliminator}', function() {
			csstricksPrintliminator( jQ132 );
		});
	});
})();
