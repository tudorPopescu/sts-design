(function () {
  'use strict';

  let gulp = require('gulp'),
    babel = require('gulp-babel'),
    plumber = require('gulp-plumber'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    less = require('gulp-less');

  // Scripts tasks - dev
  gulp.task('scripts-client-dev', () => {
    return gulp.src('public/app/client/**/*.js')
    .pipe(require('gulp-jshint')().on('error', err => console.log(err)))
    .pipe(concat('cliApp.min.js'))
    .pipe(gulp.dest('./public/dist'))
    .pipe(require('gulp-livereload')());
  });

  gulp.task('services-dev', () => {
    return gulp.src('public/app/common/**/*.js')
    .pipe(require('gulp-jshint')().on('error', err => console.log(err)))
    .pipe(concat('service.min.js'))
    .pipe(gulp.dest('./public/dist'))
    .pipe(require('gulp-livereload')());
  });
  // End Scripts task - dev

  // Scripts Task - production
  gulp.task('scripts-client', () => {
    return gulp.src('public/app/client/**/*.js')
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify({mangle: false}))
    .pipe(concat('cliApp.min.js'))
    .pipe(gulp.dest('./public/dist'));
  });

  gulp.task('services', () => {
    return gulp.src('public/app/common/**/*.js')
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify({mangle: false}))
    .pipe(concat('service.min.js'))
    .pipe(gulp.dest('./public/dist'));
  });

  gulp.task('less-dev', () => {
    return gulp.src(['public/app/less/**/*.less'])
    .pipe(plumber())
    .pipe(less())
    .pipe(cssmin())
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest('./public/dist/css'))
    .pipe(require('gulp-livereload')())
    .pipe(plumber.stop());
  });

  gulp.task('less', () => {
    return gulp.src(['public/app/less/**/*.less'])
    .pipe(plumber())
    .pipe(less())
    .pipe(cssmin())
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest('./public/dist/css'))
    .pipe(plumber.stop());
  });
  // END Scripts Task - production

  // PUG Task
  gulp.task('pug', () => {
    return gulp.src('public/app/**/*.pug');
  });

  // Clean Task
  gulp.task('clean', () => {
    return gulp.src('./public/dist/*')
      .pipe(require('gulp-clean')());
  });

  gulp.task('watch', () => {
    require('gulp-livereload').listen();
    gulp.watch('public/app/client/**/*.js', gulp.parallel('scripts-client-dev'));
    gulp.watch('public/app/common/**/*.js', gulp.parallel('services-dev'));
    gulp.watch(['public/app/less/**/*.less'], gulp.parallel('less-dev'));
    gulp.watch('public/app/**/*.pug', gulp.parallel('pug')).on('change', path => {
      gulp.src(path)
        .pipe(require('gulp-livereload')());
    });
  });

  gulp.task('default', gulp.series('clean', gulp.parallel('less-dev', 'scripts-client-dev', 'services-dev', 'pug'), 'watch'));
  // TODO: Make tasks for production
  // LOGO - DESIGN SA FIE CU ALT FONT (DECIDEM CARE), SA FIE NEGRU, SA NU DEPASEASCA LUNGIMEA TEXTULUI STS, SCOT UMBRA DE LA STS, 
  // FONT: FOLOSESC ROBOTO PENTRU HEADINGURI SI LATO PENTRU PARAGRAFE
	// gulp.task('heroku:staging', gulp.parallel('login-less', 'less', 'scripts-admin', 'scripts-client', 'services', 'pug'));
	// gulp.task('heroku:production', gulp.parallel('login-less', 'less', 'scripts-admin', 'scripts-client', 'services', 'pug'));
}());
