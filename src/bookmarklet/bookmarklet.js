/*
Don't wrap this code in a self-executing anonymous function, i.e.
  (function(){ CODE })();
because uglify changes it into
  !function(){ CODE }();
and Firefox does not work with that format!
*/
// uncompressed bookmarklet code
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
// dev = src/printliminator.js
// production = //css-tricks.github.io/The-Printliminator/printliminator.min.js
loadScript('{printliminator}', function() {
	thePrintliminator.init();
});
