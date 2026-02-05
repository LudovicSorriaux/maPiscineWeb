/*

ESP8266 file system builder with PlatformIO support

Copyright (C) 2016 by Xose Pérez <xose dot perez at gmail dot com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

// -----------------------------------------------------------------------------
// File system builder
// -----------------------------------------------------------------------------

const gulp = require('gulp');
const plumber = require('gulp-plumber');
const htmlmin = require('gulp-htmlmin');
const cleancss = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const gzip = require('gulp-gzip');
const del = require('del');
//const del = require("fix-esm").require("del");
const useref = require('gulp-useref');
const gulpif = require('gulp-if');
const inline = require('gulp-inline');
const rename = require("gulp-rename");
const gutil = require('gulp-util');
const pump = require('pump');



/* Clean destination folder */
gulp.task('clean', function() {
    return del(['data/*']);
});

/* Copy static files */
gulp.task('files_old', function() {
    return gulp.src('html/**/*.{jpg,jpeg,png,ico,gif,cfg,json}')
        .pipe(gulp.dest('data/'));
});

gulp.task('files', function() {

    // Flux pour les fichiers à la racine et images 
    const root = gulp.src('html/*.{json,jpeg,png,ico,gif,svg}')
        .pipe(gulp.dest('data/html'));
        
    // Flux pour les images dans html/images
    const images = gulp.src('html/images/**/*.{jpg,jpeg,png,ico,gif,svg}')
        .pipe(gulp.dest('data/html/images'));

    // Flux pour les fichiers de config
    const configs = gulp.src('cfg/**/*.cfg')
        .pipe(gulp.dest('data/cfg'));

    return Promise.all([root, images, configs]); // On s'assure que Gulp attend la fin des trois
});

/* Process HTML, CSS, JS  --- INLINE --- */
gulp.task('inline', function() {
    return gulp.src('html/*.html')
        .pipe(inline({
            base: 'html/',
            js: uglify,
            css: cleancss,
            disabledTypes: ['svg', 'img']
        }))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removecomments: true,
			aside: true,
            minifyCSS: true,
            minifyJS: true
        }))
        .pipe(gzip())
        .pipe(gulp.dest('data'));
})

/* Process HTML, CSS, JS */
gulp.task('html', function() {
    return gulp.src('html/*.html')
        .pipe(useref())
        .pipe(plumber())
        .pipe(gulpif('*.css', cleancss()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.html', htmlmin({
            collapseWhitespace: true,
            removecomments: true,
			aside: true,
            minifyCSS: true,
            minifyJS: true
        })))
        .pipe(gzip())
        .pipe(rename(function (path) {
            // Updates the object in-place
            path.extname = ".lgz";}))
        .pipe(gulp.dest('data/html'));
});

gulp.task("uglify", function () {
    return gulp.src("html/js/*.js")
        .pipe(uglify(/* options */))
		.on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest("data"));
});

gulp.task('uglify-debug', function (cb) {
  pump([
    gulp.src('html/js/*.js'),
    uglify(),
    gulp.dest('data')
  ], cb);
});

/* Build file system */
gulp.task('buildfs', gulp.series('clean', 'files', 'html'));
gulp.task('buildfs2', gulp.series('clean', 'files', 'inline'));
gulp.task('default', gulp.series('buildfs'));

// -----------------------------------------------------------------------------
// PlatformIO support
// -----------------------------------------------------------------------------

const spawn = require('child_process').spawn;
const argv = require('yargs').argv;

var platformio = function(target) {
    var args = ['run'];
    if ("e" in argv) { args.push('-e'); args.push(argv.e); }
    if ("p" in argv) { args.push('--upload-port'); args.push(argv.p); }
    if (target) { args.push('-t'); args.push(target); }
    const cmd = spawn('platformio', args);
    cmd.stdout.on('data', function(data) { console.log(data.toString().trim()); });
    cmd.stderr.on('data', function(data) { console.log(data.toString().trim()); });
}

gulp.task('uploadfs', gulp.series('buildfs', function() { platformio('uploadfs'); }));
gulp.task('upload', function() { platformio('upload'); });
gulp.task('run', function() { platformio(false); });
