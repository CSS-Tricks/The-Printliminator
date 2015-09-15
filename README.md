The Printliminator is a bookmarklet with some simple tools you can use to makes websites print better.
One click to activate, and then click to remove elements from the page, remove graphics, and apply better
print styling.

![screenshot](https://cloud.githubusercontent.com/assets/136959/9867743/caff5512-5b36-11e5-92e5-2b2e022be437.png)

[Get the Bookmarklet here](//css-tricks.github.io/The-Printliminator/)

### Limitations

* Due to Content Security Policy directives on some sites, the Printliminator script is not able to load on some sites (e.g. GitHub). To get around this problem, a Chrome extension is being developed. Hopefully, Opera, Firefox &amp; Safari extensions/addons will quickly follow.

### To Do

* [ ] Add documentation to the wiki pages.

### Credits

* By [Chris Coyier](http://chriscoyier.net) and [Devon Govett](http://devongovett.wordpress.com/).
* Some contributions by [Rob Garrison](http://wowmotty.blogspot.com/).
* Icons by [Function](http://wefunction.com/2008/07/function-free-icon-set/).
* Print stylesheet based on [Hartija](http://code.google.com/p/hartija/).

### Recent Changes

#### Version 3.1.2 (9/15/2015)

* Add missing <kbd>Shift</kbd>+Click functionality.
* Make drag area larger while dragging. Fixes [issue #4](https://github.com/CSS-Tricks/The-Printliminator/issues/4).

#### Version 3.1.1 (9/14/2015)

* Readme: Fix screenshot
* Design update!
* A `bookmark.html` was added to the Grunt build. Importing this file into your Bookmarks will allow inclusion of a Bookmarklet icon. Instructions will be added to the wiki pages soon.
* All images were compressed.

#### Version 3.1.0 (9/1/2015)

* Change design of popup (design by Chris Coyier); see screenshot!
* Removed jQuery dependency; lots of internal structural changes made.
* Add keyboard commands. See screenshot for the complete list.
* Make popup draggable.
* Note:
  * This bookmarklet may still not work on some sites that have a strict Content Security directive.
  * We are working on making this bookmarklet into a browser extension!
  * It might be best to include both in this repository; use the bookmarklet for older browsers, or in browsers where an extension has not yet been made.
