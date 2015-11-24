var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var browserSync = require('browser-sync').create();
var source = require('vinyl-source-stream');
var del = require('del');
var glob = require('glob');
var path = require('path');
var jasmine = require('gulp-jasmine');
var extend = require('extend');

var VIRT_FILE = 'graviton.js';
var VIRT_TEST_FILE = 'graviton_spec.js';
var ENTRY_FILE = './src/main.js';
var BUILD_PATH = './build';
var TEST_PATTERN = './test/**/*_spec.js';

var WATCHIFY_CONFIG = {
    entries: [],
    cache: {},
    packageCache: {},
    plugin: [watchify]
};

var BABELIFY_CONFIG = {
    presets: ['es2015']
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
 * @param {!Array<string>} entries Entry points for browserify
 * @param {boolean=} opt_isWatcher Whether watchify should be used
 */
var getBundler = function(entries, opt_isWatcher) {
    console.log(!!bundler);
    if (!bundler) {
        bundler = browserify(opt_isWatcher ?
                extend({}, WATCHIFY_CONFIG, { entries: entries }) :
                entries)
            .transform(babelify, BABELIFY_CONFIG);
    }
    return bundler;
};


/**
 * Run the currently configured bundler and save the output in the build
 * directory.
 */
var build = function() {
    return getBundler([ENTRY_FILE])
        .bundle()
        // We're using native browserify, which doesn't know about gulp,
        // so we pipe it to vinyl-source-stream to convert browserify's
        // text stream to an efficient vinyl stream usable by gulp.
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

    var bundler = getBundler([ENTRY_FILE], /* isWatcher */ true);
    bundler.on('update', function() {
        gulp.start('watch-reload');
    });
    return build();
};


/**
 * Build ES6 tests into a single bundle in the build directory.
 */
var buildTests = function() {
    var specs = glob.sync(TEST_PATTERN);
    return getBundler(specs)
        .bundle()
        .pipe(source(VIRT_TEST_FILE))
        .pipe(gulp.dest(BUILD_PATH));
};


/**
 * Run built tests with jasmine.
 */
var test = function() {
    return gulp.src(path.join(BUILD_PATH, VIRT_TEST_FILE))
        .pipe(jasmine());
};


/**
 * Setup the watch-test bundler.
 */
var watchTestSetup = function() {
    var specs = glob.sync(TEST_PATTERN);
    var bundler = getBundler(specs, /* isWatcher */ true);
    bundler.on('update', function() {
        gulp.start('test');
    });
};


gulp.task('clean', clean);

// Build
gulp.task('build', build);
gulp.task('watch', watch);
gulp.task('watch-reload', ['build'], function() {
    browserSync.reload();
});

// Tests
gulp.task('build-tests', buildTests);
gulp.task('test', ['build-tests'], test);
gulp.task('watch-test-setup', watchTestSetup);
gulp.task('watch-test', ['watch-test-setup', 'test']);


gulp.task('default', ['watch']);
