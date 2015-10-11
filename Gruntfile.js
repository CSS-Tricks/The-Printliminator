/*global module :false*/
module.exports = function( grunt ) {
	'use strict';

	var pkg = grunt.file.readJSON( 'package.json' ),

		config = {

			// key in root directory - **not shared publically**
			chromeKey : 'chrome.pem',

			settings : grunt.file.readJSON( 'src/options.json' ),

			// misc variables
			printliminatorJs : 'printliminator',
			printliminatorFunctionName : 'thePrintliminator',

			// temporary file
			bookmarkletJs : 'bookmarklet',

			// bookmarklet builder URLs
			indexHtml : 'index.html',
			bookmarkHtml : 'bookmark.html',
			production : {
				printliminator : '//css-tricks.github.io/The-Printliminator/printliminator.min.js'
			},
			dev : {
				printliminator : 'dist/bookmarklet/printliminator.js'
			},

			// note to add to dynamically created index.html in the root folder
			note : '<!--\nThis file is dynamically generated\n' +
				'█████▄ ▄████▄   █████▄ ▄████▄ ██████   ███████▄ ▄████▄ █████▄ ██ ██████ ██  ██\n' +
				'██  ██ ██  ██   ██  ██ ██  ██   ██     ██ ██ ██ ██  ██ ██  ██ ██ ██     ██  ██\n' +
				'██  ██ ██  ██   ██  ██ ██  ██   ██     ██ ██ ██ ██  ██ ██  ██ ██ ██▀▀   ▀▀▀▀██\n' +
				'█████▀ ▀████▀   ██  ██ ▀████▀   ██     ██ ██ ██ ▀████▀ █████▀ ██ ██     █████▀\n' +
				'To make changes, modify the "src/bookmarklet/index.html"\n-->'

		};

	grunt.file.defaultEncoding = 'utf8';
	grunt.file.preserveBOM = false;

	// Project configuration.
	grunt.initConfig({
		pkg : pkg,
		config : config,

		jshint : {
			options : {
				globals : {
					'<%= config.printliminatorFunctionName %>' : false
				},
				browser : true,
				undef : true,
				esnext : true
			},
			files : {
				src : [
					'test/spec.js',
					'dist/**/*.js'
				]
			}
		},

		uglify : {
			options : {
				report : 'gzip'
			},
			main : {
				files : {
					'<%= config.printliminatorJs %>.min.js' : [ 'dist/bookmarklet/<%= config.printliminatorJs %>.js' ]
				}
			},
			bookmarklet : {
				files : {
					'<%= config.bookmarkletJs %>.min.js' : [ 'src/bookmarklet/<%= config.bookmarkletJs %>.js' ]
				}
			}
		},

		clean : {
			build : {
				src : [
					'dist/**/**/**/*', // locales
					'dist/**/**/*',
					'dist/**/*',
					config.indexHtml,
					'*.min.js'
				]
			},
			cleanup : {
				src : [
					config.bookmarkletJs + '.min.js',
					'src/printliminator.css',
					'src/chrome/popup.css',
					'src/*-temp.*',
					'src/chrome/*-temp.*',
					'src/bookmarklet/*-temp.*'
				]
			}

		},

		copy : {
			chrome : {
				files : [{
					expand : true,
					dot : true,
					flatten : true,
					src : [
						'src/printliminator.css',
						'src/icons/*.png',
						'src/chrome/manifest.json'
					],
					dest : 'dist/chrome/'
				}]
			},
			chromeLocales : {
				expand : true,
				src : [ '_locales/**/*.json' ],
				dest : 'dist/chrome'
			},
			// Opera can use chrome.crx; just renamed
			opera : {
				src : 'dist/chrome.crx',
				dest : 'dist/opera.nex'
			}
		},

		sass : {
			dist : {
				options : {
					style : 'expanded',
					sourcemap : 'none',
					noCache : true
				},
				files : {
					'src/printliminator.css' : 'src/printliminator-temp.scss',
					'src/bookmarklet/printliminator-temp.css' : 'src/bookmarklet/printliminator-temp.scss',
					'dist/chrome/popup.css' : 'src/chrome/popup-temp.scss',
					'src/bookmarklet/iframe-temp.css' : 'src/bookmarklet/iframe-temp.scss'
				}
			}
		},

		preprocess : {
			extMainScss : {
				src : 'src/printliminator.scss',
				dest : 'src/printliminator-temp.scss',
				options : {
					context : {
						MODE : 'EXT',
						settings : '<%= config.settings %>'
					}
				}
			},
			extBookmarkletScss : {
				src : 'src/printliminator.scss',
				dest : 'src/bookmarklet/printliminator-temp.scss',
				options : {
					context : {
						MODE : 'BOOKMARKLET',
						settings : '<%= config.settings %>'
					}
				}
			},
			extPopupScss : {
				src : 'src/chrome/popup.scss',
				dest : 'src/chrome/popup-temp.scss',
				options : {
					context : '<%= config.settings %>'
				}
			},
			bookmarkletPopupScss : {
				src : 'src/bookmarklet/iframe.scss',
				dest : 'src/bookmarklet/iframe-temp.scss',
				options : {
					context : '<%= config.settings %>'
				}
			},
			extHtml : {
				src : 'src/chrome/popup.html',
				dest : 'dist/chrome/popup.html',
				options : {
					context : '<%= config.settings %>'
				}
			},
			bookmarkletHtml : {
				src : 'src/bookmarklet/iframe.html',
				dest : 'src/bookmarklet/iframe-temp.html',
				options : {
					context : '<%= config.settings %>'
				}
			},
			extPopupJs : {
				src : 'src/chrome/popup.js',
				dest : 'dist/chrome/popup.js',
				options : {
					context : '<%= config.settings %>'
				}
			},
			extJs : {
				src : 'src/printliminator.js',
				dest : 'dist/chrome/printliminator.js',
				options : {
					// inline : true,
					context : {
						MODE : 'EXT',
						settings : '<%= config.settings %>'
					}
				}
			},
			bookmarkletJs : {
				src : 'src/printliminator.js',
				dest : 'dist/bookmarklet/printliminator.js',
				options : {
					// inline : true,
					context : {
						MODE : 'BOOKMARKLET',
						settings : '<%= config.settings %>'
					}
				}
			}
		},

		jasmine : {
			src : 'dist/chrome/printliminator.js',
			options : {
				specs : 'test/*Spec.js'
			}
		},

		compress : {
			chrome : {
				options : {
					archive : 'dist/chrome.zip'
				},
				files : [{
					expand : true,
					cwd : 'dist/chrome/',
					src : ['**'],
					dest : '',
					filter : 'isFile'
				}]
			}
		},

		crx : {
			chrome : {
				options : {
					privateKey : '<%= config.chromeKey %>',
				},
				src : 'dist/chrome/*.*',
				dest : 'dist/chrome.crx',
			}
		}

	});

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-compress' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-jasmine' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-sass' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-crx' );
	grunt.loadNpmTasks( 'grunt-preprocess' );

	grunt.registerTask( 'update', 'update dist files', function() {
		grunt.task.run([
			'default',
			'updateVersions',
			'compress',
			// make Chrome extension
			'crx',
			// Opera extension
			'copy:opera',
			// Firefox extension will match Chrome files in v43+
			// http://techcrunch.com/2015/08/21/chrome-extensions-are-coming-to-firefox/
		]);
	});

	grunt.registerTask( 'default', 'Default build', function() {
		grunt.task.run([
			'clean:build',
			'preprocess',
			'sass',
			'bookmarklet-addStyles',
			'uglify',
			'bookmarklet-create',
			'copy:chrome',
			'copy:chromeLocales',
			'jshint',
			'jasmine',
			'clean:cleanup'
		]);
	});

	grunt.registerTask( 'bookmarklet-addStyles', function() {
		// string replace settings in css & html; add to bookmarklet
		var printliminator = grunt.file.read( 'dist/bookmarklet/printliminator.js' ),
			styles = grunt.file.read( 'src/bookmarklet/printliminator-temp.css' ).replace( /\s+/g, ' ' ),
			popupHTML = grunt.file.read( 'src/bookmarklet/iframe-temp.html' ).replace( /\s+/g, ' ' ),
			popupCSS = grunt.file.read( 'src/bookmarklet/iframe-temp.css' ).replace( /\s+/g, ' ' ),
		printliminator = printliminator
			.replace( /\{styles\}/, styles )
			.replace( /\{popupHTML\}/, popupHTML )
			.replace( /\{popupCSS\}/, popupCSS );
		grunt.file.write( 'dist/bookmarklet/printliminator.js', printliminator );
	});

	grunt.registerTask( 'bookmarklet-create', function(){
		// Add bookmarklet code for both production & development
		// load bookmarket min file
		var content = grunt.file.read( config.bookmarkletJs + '.min.js' ),
			// load index.html template
			baseHtml = grunt.file.read( 'src/bookmarklet/' + config.indexHtml ),
			bookmarkHtml = grunt.file.read( 'src/bookmarklet/' + config.bookmarkHtml ),

			modFile = function( mode ) {
				var regex = new RegExp('\\{' + mode + '\\}'),
				file = content
					.replace( /\{printliminator\}/, config[ mode ].printliminator )
					.replace( /\"/g, "'" )
					// not using encodeURI because it changes "{}" into "%7B%7D"
					// and just makes the bookmarklet bigger & harder to read
					.replace( /\x20/g, '%20' );
				// add javascript to HTML
				baseHtml = baseHtml.replace( regex, file );
				if ( mode === 'production' ) {
					bookmarkHtml = bookmarkHtml.replace( regex, file );
				}
			};

		// update production & dev bookmarklet href
		modFile( 'production' );
		modFile( 'dev' );

		// add note so we don't mistakingly update the wrong index.html
		// then lose all our changes when grunt is run!
		baseHtml = baseHtml.replace( '<!-- src -->', config.note );

		// write modified index.html
		grunt.file.write( config.indexHtml, baseHtml );
		grunt.file.write( config.bookmarkHtml, bookmarkHtml );
	});

	// update version numbers to match the package.json version
	grunt.registerTask( 'updateVersions', function() {
		var i, project, result,
			projectFile = [
				'dist/chrome/manifest.json',
				'dist/chrome/printliminator.js',
				'dist/bookmarklet/printliminator.js'
			],
			len = projectFile.length;
		for ( i = 0; i < len; i++ ) {
			if ( !grunt.file.exists( projectFile[ i ] ) ) {
				grunt.log.error( 'file ' + projectFile[ i ] + ' not found' );
				return true; // return false to abort the execution
			}
			if ( /json$/i.test( projectFile[ i ] ) ) {
				project = grunt.file.readJSON( projectFile[ i ] ); // get file as json object
				project.version = pkg.version;
				result = JSON.stringify( project, null, 2 );
				// write manifest back to src & dist folders
				grunt.file.write( projectFile[ i ], result );
				grunt.file.write( projectFile[ i ].replace( /^dist/, 'src' ), result );
			} else {
				project = grunt.file.read( projectFile[ i ] );
				result = project.replace( /\{version\}/g, pkg.version );
				grunt.file.write( projectFile[ i ], result );
			}
		}
	});

};
