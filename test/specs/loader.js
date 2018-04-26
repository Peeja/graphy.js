const assert = require('assert');
const request = require('request');
const graphy = require('../../build/packages/graphy/index.js');

const H_AUTHORS = {
	'>http://blake-regalia.com/#me': {
		a: ['foaf:Person', 'earl:Assertor'],
		'foaf:name': '"Blake Regalia',
		'foaf:email': '"blake.regalia@gmail.com',
		'foaf:homepage': '>http://blake-regalia.com/',
	},
};

// prefixes
const H_PREFIXES = {
	rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
	rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
	dc: 'http://purl.org/dc/terms/',
	doap: 'http://usefulinc.com/ns/doap#',
	earl: 'http://www.w3.org/ns/earl#',
	foaf: 'http://xmlns.com/foaf/0.1/',
	xsd: 'http://www.w3.org/2001/XMLSchema#',
	mf: 'http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#',
	test: 'http://www.w3.org/2013/TurtleTests/',
	manifest: 'http://www.w3.org/2013/TurtleTests/manifest.ttl#',
};

// accepted test types
const A_TEST_TYPES_ACCEPTED = [
	// turtle
	'rdft:TestTurtleEval',
	'rdft:TestTurtleNegativeSyntax',
	'rdft:TestTurtlePositiveSyntax',

	// trig
	'rdft:TestTrigEval',
	'rdft:TestTrigNegativeSyntax',
	'rdft:TestTrigPositiveSyntax',

	// n-triples
	'rdft:TestNTriplesNegativeSyntax',
	'rdft:TestNTriplesPositiveSyntax',

	// n-quads
	'rdft:TestNQuadsNegativeSyntax',
	'rdft:TestNQuadsPositiveSyntax',
];

// graphy iri
const P_GRAPHY = 'https://github.com/blake-regalia/graphy.js#graphy-js';

// struct: result from assertion
class AssertionResult {
	constructor(s_actual, s_expected) {
		Object.assign(this, {
			actual: s_actual,
			expected: s_expected,
		});
	}
}

// test case
class TestCase {
	constructor(p_manifest, pm_format, h_row) {
		Object.assign(this, h_row, {
			manifest: p_manifest,
			format: pm_format,
		});
	}

	// run this test case
	run() {
		return new Promise(async(fk_test, fe_test) => {
			// determine how to handle events from parser given test type
			let h_test_type;
			let p_test_type = this.type.value;
			if(p_test_type.endsWith('Eval')) {
				// eval type must have a result
				if(!this.result) throw new Error(`test case "${this.id.value}" is missing an mf:result`);

				h_test_type = this.eval(fk_test, fe_test);
			}
			else if(p_test_type.endsWith('PositiveSyntax')) {
				h_test_type = await TestCase.syntax_positive(fk_test, fe_test);
			}
			else if(p_test_type.endsWith('NegativeSyntax')) {
				h_test_type = await TestCase.syntax_negative(fk_test, fe_test);
			}
			else {
				throw new Error(`unknown test type: "${p_test_type}"`);
			}

			// fetch test action
			request(this.action.value)
				// pipe to deserializer
				.pipe(graphy.deserialize(this.format, h_test_type));
		});
	}

	// for evaluation types
	eval(fk_eval, fe_eval) {
		// create two new sets to compare actual result with expected result
		let k_set_actual = graphy.set();
		let k_set_expected = graphy.set();

		// wait for expected value to be ready
		let dp_expected = new Promise((fk_expected, fe_expected) => {
			// fetch result file
			request(this.result.value)
				// network error
				.on('error', (e_req) => {
					fe_expected(new Error(`fatal network error: ${e_req.message}\n${e_req.stack}`));
				})

				// http response
				.on('response', (d_res) => {
					// not OK response
					if(200 !== d_res.statusCode) {
						fe_expected(new Error(`${d_res.statusCode} HTTP error: ${d_res.body}`));
					}
				})

				// parse result as N-Triples
				.pipe(graphy.nt.deserializer({
					// each triple in result file
					data(h_triple) {
						// add to expected set
						k_set_expected.add(h_triple);
					},

					// ready for evaluation
					end() {
						// save canonicalized set result
						fk_expected(k_set_expected.canonicalize());
					},
				}));
		});

		// serializer config
		return {
			// default base is given by url of file
			base: `${this.manifest}${this.id.value.slice(1)}.ttl`,

			// each triple in test file
			data(h_triple) {
				// add to actual set
				k_set_actual.add(h_triple);
			},

			// there was an error while parsing
			error(e_parse) {
				fe_eval(e_parse);
			},

			// once input is successfully consumed
			end() {
				// save result
				let s_actual = k_set_actual.canonicalize();

				// resolve with test action
				dp_expected.then((s_expected) => {
					try {
						assert.equal(s_actual, s_expected);
						fk_eval();
					}
					catch(e_assert) {
						fe_eval(new AssertionResult(s_actual, s_expected));
					}
				}).catch((e_expected) => {
					throw new Error(e_expected);
				});
			},
		};
	}

	// for positive syntax types
	static syntax_positive(fk_syntax, fe_syntax) {
		return {
			// ignore data events
			data() {},

			// an error is a failure
			error(e_parse) {
				fe_syntax(new Error(`failed to accept: "${this.comment.value}"\n\n${e_parse}`));
			},

			// successfully finished
			end() {
				fk_syntax();
			},
		};
	}

	// for negative syntax types
	static syntax_negative(fk_syntax, fe_syntax) {
		return {
			// enable validation for these tests
			validate: true,

			// ignore data events
			data() {},

			// an error is expected
			error(e_parse) {
				fk_syntax(e_parse);
			},

			// error not caught
			end() {
				fe_syntax(`failed to invalidate: "${this.comment.value}"`);
			},
		};
	}
}


// run test on given manifest and pipe to given output stream
module.exports = function test(p_manifest, pm_format, ds_output) {
	// create report
	let ks_report = graphy.ttl.serializer({
		// user-defined prefixes
		prefixes: H_PREFIXES,
	});

	// pipe to output
	ks_report.pipe(ds_output);

	// commit software info
	ks_report.add({
		['>'+P_GRAPHY]: {
			a: ['earl:Software', 'earl:TestSubject', 'earl:Project'],
			'doap:name': '"graphy.js',
			'doap:homepage': '>'+P_GRAPHY,
			'dc:title': '"graphy.js',
		},
	});

	// commit author info
	ks_report.add(H_AUTHORS);

	// for committing each test outcome
	let commit_outcome = (k_test_case, s_outcome) => {
		ks_report.add({
			['>'+k_test_case.id.value]: {
				a: ['earl:TestCriterion', 'earl:TestCase'],
				'dc:title': k_test_case.name,
				'dc:description': k_test_case.comment,
				'mf:action': k_test_case.action,
				'mf:result': k_test_case.result,
				'earl:assertions': graphy.collection([{
					'rdf:type': 'earl:Assertion',
					'earl:assertedBy': Object.keys(H_AUTHORS),
					'earl:test': k_test_case.id,
					'earl:subject': '>'+P_GRAPHY,
					'earl:mode': 'earl:automatic',
					'earl:result': {
						a: 'earl:TestResult',
						'earl:outcome': 'earl:'+s_outcome,
						'dc:date': new Date(),
					},
				}]),
			},
		});
	};

	// fetch manifest file
	request(p_manifest)
		// deserialize
		.pipe(graphy.ttl.deserializer({
			// base is resource url
			base: p_manifest,

			// user-defined prefixes
			prefixes: H_PREFIXES,
		}))
		// pipe into a new store
		.pipe(graphy.store({
			// user-defined prefixes
			prefixes: H_PREFIXES,

			// once store is ready
			async ready(g) {
				// extract test cases from manifest
				let a_test_cases = await g.pattern()
					.object('mf:Manifest').in('rdf:type')
					.subject()
					.fork({
						'rdfs:label': e => e.literal().bind('label'),
						'mf:entries': e => e.collection().bind('test_cases'),
						'mf:entries/rdf:rest*/rdf:first': e => e.objects().gather().bind('test_cases'),
					})
					.exit()
					.rows();

				// each test case
				for(let p_test_case of a_test_cases) {
					// fetch test case
					let h_test_case = await g.pattern()
						.subject(p_test_case).bind('id')
						.fork({
							'rdft:approval': 'rdft:Approved',
							'rdf:type': e => e.node(A_TEST_TYPES_ACCEPTED).bind('type'),
							'mf:name': e => e.literal().bind('name'),
							'rdfs:comment': e => e.literals().gather('comment')
								.map(h => h.value.toLowerCase())
								.save(),
							'mf:action': e => e.node().bind('action'),
							'mf:result?': e => e.node().bind('result'),
						})
						.exit()
						.row();

					// create test case instance
					let k_test_case = new TestCase(p_manifest, pm_format, h_test_case);

					// load test case
					k_test_case.run().then(() => {
						// log to console
						console.log(`${'✓'.green} ${k_test_case.id.value}`);

						// write to report
						commit_outcome(k_test_case, 'passed');
					}).catch((z_reason) => {
						// case label
						let s_case = `${'˟'.red} ${k_test_case.id.value}`;

						// actual vs. expected
						if(z_reason instanceof AssertionResult) {
							console.error(`${s_case}\n\t${z_reason.expected.red}\n\t${z_reason.actual.green}`);
						}
						// error message
						else {
							console.error(`${s_case}\n\t${z_reason.red}`);
						}

						// write to report
						commit_outcome(k_test_case, 'failed');
					});
				}

				// all done!
				ks_report.end();
			},
		}));
};