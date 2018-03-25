const gulp = require('gulp');
const pug = require('gulp-pug');

const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const stylelint = require('gulp-stylelint');
var plumber = require('gulp-plumber');

const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

const del = require('del');

const browserSync = require('browser-sync').create();

const gulpWebpack = require('gulp-webpack');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');
const eslint = require('gulp-eslint');

const paths = {
    root: './build',
    templates: {
        pages: 'src/templates/pages/*.pug',
        src: 'src/templates/**/*.pug'
    },
    styles: {
        src: 'src/styles/**/*.scss',
        dest: 'build/assets/styles/'
    },    
    images: {
        src: 'src/images/**/*.*',
        dest: 'build/assets/images/'
    },
    scripts: {
        src: 'src/scripts/**/*.js',
        dest: 'build/assets/scripts/'
    }
}

// pug
function templates() {
    return gulp.src(paths.templates.pages)
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest(paths.root));
}

//svg
function sprite () {
	return gulp.src(assetsDir + './src/images/icons/*.svg')
	// минифицируем svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// удаляем атрибуты fill, style и stroke, чтобы они не перебивали стили, заданные через css
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// преобразовываем символ ‘>’ в кодировку '&gt.
		.pipe(replace('&gt;', '>'))
		// строим спрайт
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "../sprite.svg",
				}
			}
		}))
		.pipe(gulp.dest(paths.images.dest));
}

// scss
function styles() {
    return gulp.src('./src/styles/app.scss')
        .pipe(plumber())
        .pipe(stylelint({
            reporters: [
            {formatter: 'string', console: true}
            ]
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(sassGlob())
        .pipe(sourcemaps.write())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest))
}

// очистка
function clean() {
    return del(paths.root);
}

// webpack
function scripts() {
    return gulp.src('src/scripts/app.js')
        .pipe(plumber())
        .pipe(eslint({fix: true}))
        .pipe(eslint.format())
        .pipe(gulpWebpack(webpackConfig, webpack)) 
        .pipe(gulp.dest(paths.scripts.dest));
}

// галповский вотчер
function watch() {
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.templates.src, templates);
    gulp.watch(paths.images.src, images);
    gulp.watch(paths.scripts.src, scripts);
}

// локальный сервер + livereload (встроенный)
function server() {
    browserSync.init({
        server: paths.root
    });
    browserSync.watch(paths.root + '/**/*.*', browserSync.reload);
}

// просто переносим картинки
function images() {
    return gulp.src(paths.images.src)
        .pipe(gulp.dest(paths.images.dest));
}

exports.templates = templates;
exports.styles = styles;
exports.clean = clean;
exports.images = images;

gulp.task('default', gulp.series(
    clean,
    gulp.parallel(styles, templates, images, scripts),
    gulp.parallel(watch, server)
));