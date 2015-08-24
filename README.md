The Printliminator is a bookmarklet with some simple tools you can use to makes websites print better.
One click to activate, and then click to remove elements from the page, remove graphics, and apply better
print styling.

![screenshot](https://cloud.githubusercontent.com/assets/136959/9445926/649cb622-4a54-11e5-9971-0782ae009a30.png)

[Get the Bookmarklet here](//css-tricks.github.io/The-Printliminator/)

### To Do

* [ ] Add keyboard commands to alter the targeted element. For example:
  * <kbd>pageUp</kbd> to select parent of hovered element
  * <kbd>pageDown</kbd> to select child of hovered element (not sure what to do if the mouse moves though)
  * <kbd>Enter</kbd> to hide outlined element.
  * <kbd>Esc</kbd> to cancel.
* [ ] Make Printliminator window draggable.
* [ ] Add documentation to the wiki pages.
* [ ] Remove jQuery dependency (maybe?)

### Recent Changes

#### Version 3.0.0 (8/24/2015)

* Reformat code (clean up mixed tabs & spaces).
* Add misc config files.
* Update demo page to match original article.
* Internalize all css & modify code to use css class names.
* Save each replaced background image for undo method.
* Add flags to prevent repeated modifications - This also makes the undo easier to use; click add print stylesheet multiple times, but only click undo once to remove it.
* Archive unused files.
* Add demo folder & optimized png files (:heart: https://tinypng.com/).
* Add grunt build process.
  * Make all changes to the `src` folder files as the root `index.html` is now dynamically generated.
  * [Protocol-relative urls](http://www.paulirish.com/2010/the-protocol-relative-url/) are now used in the production bookmarklet.
  * Running root `index.html` in a local environment will alter the bookmarklet to use local files (development mode); so don't save that bookmarklet!
  * The actual bookmarklet code (`src/bookmarklet.js`) is now compressed and added to the `index.html` file during the build.
* Remove unused variable.
* Update readme.

### Credits

* By [Chris Coyier](http://chriscoyier.net) and [Devon Govett](http://devongovett.wordpress.com/).
* Icons by [Function](http://wefunction.com/2008/07/function-free-icon-set/).
* Print stylesheet based on [Hartija](http://code.google.com/p/hartija/).
