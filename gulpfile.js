var gulp = require('gulp'),
	sass = require('gulp-sass'),
	concat = require('gulp-concat'),
	sourcemaps = require('gulp-sourcemaps'),
	autoprefixer = require('gulp-autoprefixer'),

	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),

	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	browserify = require('browserify'),
	watchify = require('watchify'),
	babel = require('babelify'),

	fs = require('fs'),
	del = require('del'),
	path = require('path'),
	argv = require('minimist'),
	nn = require('node-notifier'),
	runSequence = require('run-sequence'),
	browserSync = require('browser-sync').create();

var env = argv(process.argv.slice(2)),
	productionBuild = env.production ? true : false;

var options = {
	autoprefixer: {browsers: ['last 4 versions', '> 2%', 'ie >= 9', 'Firefox ESR']},
	sass: {
		errLogToConsole: true,
		outputStyle: productionBuild ? 'compressed' : 'expanded',
		sourceComments: productionBuild ? false : 'normal'
	},
	paths: {
		sass: {
			src: './app/scss/**/*.scss',
			dest: './app/css'
		},
		postcss: {
			src: './app/css/app.css',
			dest: './dist/css'
		},
		js: {
			src: './app/js/app.js',
			destFileName: 'app.js',
			dest: './dist/js'
		}
	}
};


gulp.task('sass', function() {
	return gulp.src(options.paths.sass.src)
		.pipe(sass(options.sass).on('error', sass.logError))
		.on('error', function (error) {
			console.error(error);
			this.emit('end');
		})
		.pipe(gulp.dest(options.paths.sass.dest))
		.pipe(browserSync.stream());
});

gulp.task('postcss', function () {
	var processors = [
		autoprefixer(options.autoprefixer)
	];

	// Use code below to see which properties gets prefixed
	// var info = autoprefixer().info();
	// console.log(info);

	if(productionBuild){
		return gulp.src(options.paths.postcss.src)
			.pipe(postcss(processors))
			.pipe(gulp.dest(options.paths.postcss.dest));
	} else {

		return gulp.src(options.paths.postcss.src)
			.pipe(sourcemaps.init())
			.pipe(postcss(processors))
			.pipe(sourcemaps.write('.'))
			.pipe(gulp.dest(options.paths.postcss.dest));
	}
});

function compileJS(watch) {
	var bundler = browserify(options.paths.js.src, { debug: true }).transform(babel);
	
	if(watch) {
		watchify(bundler);
	}

	function rebundle() {
		bundler.bundle()
			.on('error', function(err) { console.error(err); this.emit('end'); })
			.pipe(source(options.paths.js.destFileName))
			.pipe(buffer())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest(options.paths.js.dest))
			.pipe(browserSync.stream());
	}

	if (watch) {
		bundler.on('update', function() {
			console.log('-> bundling...');
			rebundle();
		});
	}

	rebundle();
}


gulp.task('browserSync', function() {
	browserSync.init({
		server: {
			baseDir: '.'
		}
	});
});

gulp.task('clean:dist', function() {
	return del.sync('dist');
});

gulp.task('styles', function(callback) {
	runSequence('sass', 'postcss', callback);
});

gulp.task('preWatch', ['styles'], function(callback) {
	compileJS(true);
	callback();
});

gulp.task('build', ['styles'], function(callback) {
	compileJS(false);
	callback();
});


gulp.task('watch', ['preWatch', 'browserSync'], function (){
	gulp.watch('app/scss/**/*.scss', ['styles']);
	gulp.watch('*.[html, hbs]', browserSync.reload); 
	gulp.watch('app/js/**/*.js', function(){ return compileJS(true); }, browserSync.reload);
})