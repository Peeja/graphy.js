
// gulp
const gulp = require('gulp');
const soda = require('gulp-soda');

// // pre-test
// gulp.task('pre-test', () => {
// 	return gulp.src('lib/**/*.js')
// 		.pipe($.istanbul({
// 			includeUntested: true,
// 			instrumenter: Instrumenter
// 		}))
// 		.pipe($.istanbul.hookRequire());
// });

// // test basic
// gulp.task('test-basic', ['pre-test'], (cb) => {
// 	let mochaErr;
// 	gulp.src('test/basic/*.js')
// 		.pipe($.plumber())
// 		.pipe($.mocha({reporter: 'spec'}))
// 		.on('error', (err) => {
// 			mochaErr = err;
// 		})
// 		.pipe($.istanbul.writeReports())
// 		.on('end', () => {
// 			cb(mochaErr);
// 		});
// });

// // test
// gulp.task('test', ['pre-test', 'test-basic']);

// // coveralls
// gulp.task('coveralls', ['test'], () => {
// 	if (!process.env.CI) {
// 		return;
// 	}
// 	return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
// 		.pipe($.coveralls());
// });

soda(gulp, {

	//
	domain: {
		graphy: [
			'es5: dist.es5',
			'es6: dist.es6',
		],
		ttl: [
			'builder-es5: dist.es5',
			'builder-es6: dist.es6',
		],
		debug: [
			'es5: dist.es5',
			'es6: dist.es6',
		],
		routers: 'routing',
	},

	//
	range: {
		'builder-es5': [
			'builder-es5',
			'develop: builder-es5',
		],

		'builder-es6': [
			'builder-es6',
			'[test]: mocha',
			'mocha: istanbul',
			'istanbul: builder-es6',
			'develop: builder-es6',
		],

		es5: [
			'transpile',
			'develop: transpile',
		],

		es6: [
			'copy',
			'develop: copy',
		],

		routing: [
			'routing',
			'develop: routing',
		],
	},

	//
	options: {
		'*': {
			test_src: 'test/ttl/*.js',
		},
		routing: {
			map: {
				'ttl.js': 'ttl',
				'index.js': 'dist',
			},
		},
	},

	//
	aliases: {
		test: ['mocha'],
	},
});