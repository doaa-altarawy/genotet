// Build tasks
var gulp = require('gulp');
var runSequence = require('run-sequence');

// Build with code minification.
gulp.task('build', function(cb) {
  runSequence(
    'clean',
    ['copy', 'index', 'sass', 'compile'],
    cb);
});

// Build without code minification.
gulp.task('build-dev', function(cb) {
  runSequence(
    'clean',
    ['copy', 'index-dev', 'sass-dev', 'concat-src', 'concat-src-dev'],
    cb);
});
