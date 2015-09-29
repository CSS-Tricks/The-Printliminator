The Printliminator is a simple tool you can use to make websites print better.
One click to activate, and then click to remove elements from the page, remove graphics, and apply
better print styling.

![screenshot](https://cloud.githubusercontent.com/assets/136959/9867743/caff5512-5b36-11e5-92e5-2b2e022be437.png)

Get the:
* [Bookmarklet](//css-tricks.github.io/The-Printliminator/)
* [Chrome Extension](//chrome.google.com/webstore/detail/the-printliminator/nklechikgnfoonbfmcalddjcpmcmgapf?hl=en-US&gl=US)

### Limitations

* Bookmarklet: due to Content Security Policy directives on some sites, the Printliminator bookmarklet script is not able to load on some sites (e.g. GitHub). To get around this problem, use the Chrome or Opera extension. Hopefully, Firefox &amp; Safari extensions/addons will quickly follow.
* Chrome/Opera extension: if a popup window is opened for printing, like Yahoo mail does, then the extension will not work in the popup. [An issue](https://code.google.com/p/chromium/issues/detail?id=530658) was submitted and it sounds like they will be providing a fix.

### To Do

* Support more languages: waiting for willing users to help!

### Credits

* By [Chris Coyier](http://chriscoyier.net) and [Devon Govett](http://devongovett.wordpress.com/).
* Updates & extensions by [Rob Garrison](http://wowmotty.blogspot.com/).
* Icons by [Function](http://wefunction.com/2008/07/function-free-icon-set/).
* Print stylesheet based on [Hartija](http://code.google.com/p/hartija/).

### Recent Changes

#### Version 4.0.3 (9/28/2015)

* Fix icon file name in Chrome manifest which was preventing the extension from working.
* Added, then removed Chrome extension autoupdating code... no longer supported :(

#### Version 4.0.1 (9/28/2015)

* Update your Bookmarklets as the code to execute the loaded Printliminator code has changed!
* Big lumped changes...
  * Created Chrome & Opera extensions (no change needed to support both).
  * Grunt build to include all code for the bookmarklet & extension code in one file.
  * Added English locale file which make it easy to add additional language support.
  * A main `src/options.json` file now contains settings & class names used across all files.
  * Converted all css to SCSS.
  * New The Printliminator logo designed by Chris!
  * Add some basic unit testing for DOM traversing.
  * All production files are now located in the `dist` folder; `printliminator.min.js` is still located in the root.
  * Added [wiki documentation](https://github.com/CSS-Tricks/The-Printliminator/wiki).

#### Version 3.1.2 (9/15/2015)

* Add missing <kbd>Shift</kbd>+Click functionality.
* Make drag area larger while dragging. Fixes [issue #4](https://github.com/CSS-Tricks/The-Printliminator/issues/4).
