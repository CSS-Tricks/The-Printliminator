/*global module:false*/
module.exports = function( grunt ) {
	'use strict';

	var pkg = grunt.file.readJSON( 'package.json' ),

		config = {
			src : 'src/',

			bookmarkletJs : 'bookmarklet',

			printliminatorJs : 'printliminator',
			printliminatorFunctionName : 'csstricksPrintliminator',

			// bookmarklet builder URLs
			indexHtml : 'index.html',
			production : {
				jQuery : '//ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js',
				printliminator : '//css-tricks.github.io/The-Printliminator/printliminator.min.js'
			},
			dev : {
				jQuery : 'http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.js',
				printliminator : 'src/printliminator.js'
			},

			// note to add to dynamically created index.html in the root folder
			note : '<!--\nThis file is dynamically generated\n' +
				'█████▄ ▄████▄   █████▄ ▄████▄ ██████   ███████▄ ▄████▄ █████▄ ██ ██████ ██  ██\n' +
				'██  ██ ██  ██   ██  ██ ██  ██   ██     ██ ██ ██ ██  ██ ██  ██ ██ ██     ██  ██\n' +
				'██  ██ ██  ██   ██  ██ ██  ██   ██     ██ ██ ██ ██  ██ ██  ██ ██ ██▀▀   ▀▀▀▀██\n' +
				'█████▀ ▀████▀   ██  ██ ▀████▀   ██     ██ ██ ██ ▀████▀ █████▀ ██ ██     █████▀\n' +
				'To make changes, modify the "src/index.html"\n-->'

		};

	grunt.file.defaultEncoding = 'utf8';
	grunt.file.preserveBOM = false;

	// Project configuration.
	grunt.initConfig({
		pkg: pkg,
		config: config,

		jshint: {
			options: {
				globals: {
					'<%= config.printliminatorFunctionName %>': false
				},
				'loopfunc': true,
				'jquery': true,
				'browser': true,
				'undef': true
			},
			files: {
				src: [
					'<%= config.src %><%= config.printliminatorJs %>.js', '!<%= config.src %>*.min.js'
				]
			}
		},

		uglify: {
			options: {
				report: 'gzip'
			},
			main: {
				files : {
					'<%= config.printliminatorJs %>.min.js' : [ '<%= config.src %><%= config.printliminatorJs %>.js' ]
				}
			},
			mark: {
				files : {
					'<%= config.bookmarkletJs %>.min.js' : [ '<%= config.src %><%= config.bookmarkletJs %>.js' ]
				}
			}
		},

		clean: {
			build: {
				src: [
					config.indexHtml,
					config.src + '*.min.js',
					'*.min.js'
				]
			},
			cleanup : {
				src: [ config.bookmarkletJs + '.min.js' ]
			}
		}

	});

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	grunt.registerTask( 'writeBookmarklet', function(){
		// Add bookmarklet code for both production & development
		// load bookmarket min file
		var content = grunt.file.read( config.bookmarkletJs + '.min.js' ),
			// load index.html template
			baseHtml = grunt.file.read( config.src + config.indexHtml ),

			modFile = function( mode ) {
				var file = content
					// replace URLs in javascript, depending on mode
					.replace( /\{jQuery\}/, config[ mode ].jQuery )
					.replace( /\{printliminator\}/, config[ mode ].printliminator )
					.replace( /\"/g, "'" )
					// not using encodeURI because it changes "{}" into "%7B%7D"
					// and just makes the bookmarklet bigger & harder to read
					.replace( /\x20/g, '%20' );
				// add javascript to HTML
				baseHtml = baseHtml.replace( new RegExp('\\{' + mode + '\\}'), file );
			};

		// update production & dev bookmarklet href
		modFile( 'production' );
		modFile( 'dev' );

		// add note so we don't mistakingly update the wrong index.html
		// then lose all our changes when grunt is run!
		baseHtml = baseHtml.replace( '<!-- src -->', config.note );

		// write modified index.html
		grunt.file.write( config.indexHtml, baseHtml );
	});

	grunt.registerTask( 'default', 'Default build', function() {
		grunt.task.run([
			'clean:build',
			'jshint',
			'uglify',
			'writeBookmarklet',
			'clean:cleanup'
		]);
	});

};
