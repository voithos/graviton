var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

var VIRT_FILE = 'graviton.js';
var ENTRY_FILE = './src/main.js';
var BUILD_PATH = './build';

var build = function() {
    var bundleStream = browserify(ENTRY_FILE)
        .transform(babelify, { presets: ['es2015'] })
        .bundle();

    // We're using native browserify, which doesn't know about gulp,
    // so we pipe it to vinyl-source-stream to convert browserify's
    // text stream to an efficient vinyl stream usable by gulp.
    return bundleStream
        .pipe(source(VIRT_FILE))
        .pipe(gulp.dest(BUILD_PATH));
};

gulp.task('build', build);

gulp.task('default', ['build']);
