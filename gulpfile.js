var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var browserSync = require('browser-sync').create();
var source = require('vinyl-source-stream');
var del = require('del');

var VIRT_FILE = 'graviton.js';
var ENTRY_FILE = './src/main.js';
var BUILD_PATH = './build';

var WATCHIFY_CONFIG = {
    entries: [ENTRY_FILE],
    cache: {},
    packageCache: {},
    plugin: [watchify]
};


/**
 * Clean the build directory.
 */
var clean = function() {
    return del(BUILD_PATH);
};


var bundler;

/**
 * Get the currently configured browserify bundler instance. If none exists,
 * instantiate and configure it.
 * @param {boolean} isWatcher Whether watchify should be used
 */
var getBundler = function(isWatcher) {
    if (!bundler) {
        bundler = browserify(isWatcher ? WATCHIFY_CONFIG : ENTRY_FILE)
            .transform(babelify, { presets: ['es2015'] });
    }
    return bundler;
};


/**
 * Run the currently configured bundler and save the output in the build
 * directory.
 */
var bundle = function() {
    // We're using native browserify, which doesn't know about gulp,
    // so we pipe it to vinyl-source-stream to convert browserify's
    // text stream to an efficient vinyl stream usable by gulp.
    return getBundler()
        .bundle()
        .pipe(source(VIRT_FILE))
        .pipe(gulp.dest(BUILD_PATH));
};


/**
 * Setup a browser-sync server and add a change listener to the currently
 * configured bundler.
 */
var watch = function() {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });

    var bundler = getBundler(/* isWatcher */ true);
    bundler.on('update', function() {
        gulp.start('watch-reload');
    });
    return bundle();
};


gulp.task('clean', clean);
gulp.task('build', bundle);
gulp.task('watch', watch);
gulp.task('watch-reload', ['build'], function() {
    browserSync.reload();
});

gulp.task('default', ['watch']);
