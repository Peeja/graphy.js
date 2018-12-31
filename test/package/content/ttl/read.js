/* eslint indent: 0, padded-blocks: 0 */
const assert = require('assert');
const deq = assert.deepEqual;
const eq = assert.strictEqual;
const stream = require('stream');
const expect = require('chai').expect;

let S_GRAPHY_CHANNEL = process.env.GRAPHY_CHANNEL || 'graphy';
const factory = require(`@${S_GRAPHY_CHANNEL}/core.data.factory`);
const dataset_tree = require(`@${S_GRAPHY_CHANNEL}/util.dataset.tree`);
const graphy_reader_interface = require('../../../interfaces/content-reader.js');
const w3c_rdf_specification = require('../../../interfaces/w3c-rdf-specification.js');

const ttl_read = require(`@${S_GRAPHY_CHANNEL}/content.ttl.read`);

const P_IRI_RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const P_IRI_RDF_FIRST = P_IRI_RDF+'first';
const P_IRI_RDF_REST = P_IRI_RDF+'rest';
const P_IRI_RDF_NIL = P_IRI_RDF+'nil';

const P_IRI_XSD = 'http://www.w3.org/2001/XMLSchema#';
const P_IRI_XSD_BOOLEAN = P_IRI_XSD+'boolean';
const P_IRI_XSD_INTEGER = P_IRI_XSD+'integer';
const P_IRI_XSD_DECIMAL = P_IRI_XSD+'decimal';
const P_IRI_XSD_DOUBLE = P_IRI_XSD+'double';

const P_RDF_LANGSTRING = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString';

const R_WANTS_PREFIX = /^\s*[(:_[]/;
const S_AUTO_PREFIX = '@prefix : <#>.\n';


const as_triple = function(a_this) {
	let s_subject = a_this[0];
	let s_predicate = a_this[1];
	let z_object = a_this[2];
	return {
		subject: /^[ _]/.test(s_subject)
			? {
				value: s_subject.slice(1),
				isAnonymous: ' ' === s_subject[0],
			} : {
				value: s_subject,
			},
		predicate: {
			value: '->' === s_predicate
				? P_IRI_RDF_FIRST
				: ('>>' === s_predicate
					? P_IRI_RDF_REST
					: s_predicate),
		},
		object: 'string' === typeof z_object
			? (' ' === z_object[0]
				? {value:z_object.slice(1), isAnonymous:true}
				: ('_' === z_object[0]
					? {value:z_object.slice(1), isAnonymous:false}
					: ('.' === z_object
						? {value:P_IRI_RDF_NIL}
						: {value:z_object})))
			: ('number' === typeof z_object
				? {value:z_object+''}
				: z_object),
		graph: {},
	};
};

const err = (s_test, s_ttl, s_err_char, s_err_state) => {
	it(s_test, () => {
		if(R_WANTS_PREFIX.test(s_ttl)) {
			s_ttl = S_AUTO_PREFIX + s_ttl;
		}
		ttl_read(s_ttl, {
			data() {},
			error(e_parse) {
				expect(e_parse).to.be.an('error');
				let s_match = 'failed to parse a valid token'; // starting at '+('string' === typeof s_err_char? '"'+s_err_char+'"': '<<EOF>>');
				expect(e_parse.message).to.have.string(s_match);
				if(s_err_state) {
					expect(/expected (\w+)/.exec(e_parse.message)[1]).to.equal(s_err_state);
				}
			},
			end() {},
		});
	});
};

const deq_quads = (a_quads_a, a_quads_b) => {
	eq(a_quads_a.length, a_quads_b.length, `expected ${a_quads_b.length} quads, read ${a_quads_a.length}`);
	for(let i_quad=0, nl_quads=a_quads_a.length; i_quad<nl_quads; i_quad++) {
		let g_quad_a = a_quads_a[i_quad];
		let g_quad_b = a_quads_b[i_quad];

		if(g_quad_b.graph.isAnonymous) {
			assert.ok(g_quad_a.graph.isAnonymous, 'expected graph to be anonymous');
		}
		else {
			deq(g_quad_a.graph, g_quad_b.graph);
		}

		if(g_quad_a.object.isAnonymous) {
			assert.ok(g_quad_a.object.isAnonymous, 'expected object to be anonymous');
		}
		else {
			deq(g_quad_a.object, g_quad_b.object);
		}

		deq(g_quad_a.predicate, g_quad_b.predicate);

		if(g_quad_a.subject.isAnonymous) {
			assert.ok(g_quad_a.subject.isAnonymous, 'expected subject to be anonymous');
		}
		else {
			deq(g_quad_a.subject, g_quad_b.subject);
		}
	}
};

const survive = (s_test, s_ttl, a_pattern, b_debug=false) => {
	let a_quads = [];
	if(R_WANTS_PREFIX.test(s_ttl)) {
		s_ttl = S_AUTO_PREFIX + s_ttl;
	}
	let a_ttl = s_ttl.split('');
	it(s_test, (fke_done) => {
		(new stream.Readable({
			read() {
				this.push(a_ttl.shift() || null);
			},
		})).pipe(ttl_read({
			debug: b_debug,
			error(e_parse) {
				fke_done(e_parse);
			},
			data(h_triple) {
				a_quads.push(h_triple);
			},
			end() {
				deq_quads(a_quads, a_pattern.map(as_triple));
				fke_done();
			},
		}));
	});
};

const allow = survive;

describe('ttl reader:', () => {
	describe('empty:', () => {
		allow('blank', '', []);

		allow('whitespace', ' \t \n', []);
	});

	describe('iris & prefixed names:', () => {
		const abc = [['z://_/a', 'z://_/b', 'z://_/c']];

		allow('iris', '<z://_/a> <z://_/b> <z://_/c> .', abc);

		allow('iris w/ base', '@base <z://_>. <a> <b> <c> .', abc);

		allow('iris w/ unicode escapes', '<\\u2713> <like> <\\U0001F5F8> .', [
			['\u2713', 'like', '\ud83d\uddf8'],
		]);

		allow('prefixed names w/ empty prefix id', '@prefix : <z://_/>. :a :b :c .', abc);

		allow('prefixed names w/ trailing colon & mid-stops', `
			@prefix : <z://_/>. :a: :b.b :c:c.c: .`,
			[['z://_/a:', 'z://_/b.b', 'z://_/c:c.c:']]);

		allow('prefixed names w/ non-empty prefix id', '@prefix p: <z://_/>. p:a p:b p:c .', abc);

		allow('prefixed names w/ empty suffix', '@prefix pa: <z://_/a>. @prefix pb: <z://_/b>. @prefix pc: <z://_/c>. pa: pb: pc: .', abc);
	});

	describe('base & relative iris:', () => {
		allow('change scheme', `
			@base <scheme://auth/path/end> .
			<//a> <//a/b> <//a/b/d/../c> .`, [
				['scheme://a', 'scheme://a/b', 'scheme://a/b/c'],
			]);

		allow('change root', `
			@base <scheme://auth/path/end> .
			</a> </d/../a/b> </../e/../a/b/d/../c> .
			`, [
				['scheme://auth/a', 'scheme://auth/a/b', 'scheme://auth/a/b/c'],
			]);

		allow('change path up', `
			@base <scheme://auth/path/end> .
			<../a> <../../a/./b> <../d/../../../a/b/c> .

			@base <scheme://auth/path/end/> .
			<../a> <../../a/./b> <../d/../../../a/b/c> .
			`, [
				['scheme://auth/a', 'scheme://auth/a/b', 'scheme://auth/a/b/c'],
				['scheme://auth/path/a', 'scheme://auth/a/b', 'scheme://auth/a/b/c'],
			]);

		allow('change path same', `
			@base <scheme://auth/path/end> .
			<./a> <./../a/./b> <./d/../../../a/b/c> .

			@base <scheme://auth/path/end/> .
			<./a> <./../a/./b> <./d/../../../a/b/c> .
			`, [
				['scheme://auth/path/a', 'scheme://auth/a/b', 'scheme://auth/a/b/c'],
				['scheme://auth/path/end/a', 'scheme://auth/path/a/b', 'scheme://auth/a/b/c'],
			]);

		allow('change path down', `
			@base <scheme://auth/path/end> .
			<a> <a/./b> <d/../../../a/b/c> .

			@base <scheme://auth/path/end/> .
			<a> <a/./b> <d/../../../a/b/c> .
			`, [
				['scheme://auth/path/a', 'scheme://auth/path/a/b', 'scheme://auth/a/b/c'],
				['scheme://auth/path/end/a', 'scheme://auth/path/end/a/b', 'scheme://auth/a/b/c'],
			]);

		allow('add hash', `
			@base <scheme://auth/path/end> .
			<#a> <#b> <#c> .

			@base <scheme://auth/path/end/> .
			<#a> <#b> <#c> .
			`, [
				['scheme://auth/path/end#a', 'scheme://auth/path/end#b', 'scheme://auth/path/end#c'],
				['scheme://auth/path/end/#a', 'scheme://auth/path/end/#b', 'scheme://auth/path/end/#c'],
			]);

		allow('add querystring', `
			@base <scheme://auth/path/end> .
			<?a> <?b=/../dots/../> <?c=../dots/..> .

			@base <scheme://auth/path/end/> .
			<?a> <?b=/../dots/../> <?c=../dots/..> .
			`, [
				['scheme://auth/path/end?a', 'scheme://auth/path/end?b=/../dots/../', 'scheme://auth/path/end?c=../dots/..'],
				['scheme://auth/path/end/?a', 'scheme://auth/path/end/?b=/../dots/../', 'scheme://auth/path/end/?c=../dots/..'],
			]);

		allow('chaining', `
			@base <scheme://auth/path/> .
			<a> <./b/../a/b> </a/b/c> .

			@base </a/a> .
			<> <./b> </a/b/c> .

			@prefix : </test/> .
			:a :b :c .
			`, [
				['scheme://auth/path/a', 'scheme://auth/path/a/b', 'scheme://auth/a/b/c'],
				['scheme://auth/a/a', 'scheme://auth/a/b', 'scheme://auth/a/b/c'],
				['scheme://auth/test/a', 'scheme://auth/test/b', 'scheme://auth/test/c'],
			]);
	});

	describe('comments:', () => {
		const abc = [['z://_/a', 'z://_/b', 'z://_/c']];

		allow('breaking triple', `@prefix p: <z://_/>. p:a#comment\np:b#\np:c#comment\n.`, abc);

		allow('breaking base sequence', `@base#\n<z://_/>#\n#c\n.<a><b><c>#comment\n.`, abc);

		allow('breaking prefix sequence', `@prefix#\np:#\n<z://_/>#\n. p:a p:b p:c#comment\n.`, abc);

		allow('crammed spaces', `
			@prefix p:<z://_/>.p:a<z://_/b>p:c,p:d;p:e"f"^^p:g.`, [
				['z://_/a', 'z://_/b', 'z://_/c'],
				['z://_/a', 'z://_/b', 'z://_/d'],
				['z://_/a', 'z://_/e', {value:'f', datatype:{value:'z://_/g'}}],
			]);
	});

	describe('blank nodes:', () => {
		allow('labeled', `
			_:a :b _:c .
			_:c :d _:e .
			`, [
				['_a', '#b', '_c'],
				['_c', '#d', '_e'],
			]);

		allow('labeled spacing', `
			_:a :b _:c.
			<z://c> :d _:e.<z://c> :d _:f.
			`, [
				['_a', '#b', '_c'],
				['z://c', '#d', '_e'],
				['z://c', '#d', '_f'],
			]);

		allow('anonymous', `
			[] :b _:c .
			_:c :d [] .
			[] :e [] .
			`, [
				[' g0', '#b', '_c'],
				['_c', '#d', ' g1'],
				[' g2', '#e', ' g3'],
			]);

		allow('property list nesting', `
			:a0a :b0a [
				:b1a :c1a, :c1b;
				:b1b
					[:b2a :c2a;],
					:c1c,
					[:b2b :c2b],
					:c2d ;
				:b1c :c1c ;
				:b1d []
			].`, [
				['#a0a', '#b0a', ' g0'],
					[' g0', '#b1a', '#c1a'],
					[' g0', '#b1a', '#c1b'],
					[' g0', '#b1b', ' g1'],
						[' g1', '#b2a', '#c2a'],
					[' g0', '#b1b', '#c1c'],
					[' g0', '#b1b', ' g2'],
						[' g2', '#b2b', '#c2b'],
					[' g0', '#b1b', '#c2d'],
					[' g0', '#b1c', '#c1c'],
					[' g0', '#b1d', ' g3'],
			]);
	});


	describe('collections:', () => {
		allow('empty', ':a :b ().', [
			['#a', '#b', '.'],
		]);

		allow('empty nester (lol)', ':a :b (()).', [
			['#a', '#b', ' g0'],
				[' g0', '->', '.'],
				[' g0', '>>', '.'],
		]);

		allow('single iri item', ':a :b (:c).', [
			['#a', '#b', ' g0'],
				[' g0', '->', '#c'],
				[' g0', '>>', '.'],
		]);

		allow('multiple iri items', ':a :b (:c :d).', [
			['#a', '#b', ' g0'],
				[' g0', '->', '#c'],
				[' g0', '>>', ' g1'],
				[' g1', '->', '#d'],
				[' g1', '>>', '.'],
		]);

		allow('single literal item', ':a :b ("1").', [
			['#a', '#b', ' g0'],
				[' g0', '->', 1],
				[' g0', '>>', '.'],
		]);

		allow('multiple literal items', ':a :b ("1" "2").', [
			['#a', '#b', ' g0'],
				[' g0', '->', 1],
				[' g0', '>>', ' g1'],
				[' g1', '->', 2],
				[' g1', '>>', '.'],
		]);

		allow('mixed iri and literal items', ':a :b ("1" :c "2" :d), (:e "3").', [
			['#a', '#b', ' g0'],
				[' g0', '->', 1],
				[' g0', '>>', ' g1'],
				[' g1', '->', '#c'],
				[' g1', '>>', ' g2'],
				[' g2', '->', 2],
				[' g2', '>>', ' g3'],
				[' g3', '->', '#d'],
				[' g3', '>>', '.'],
			['#a', '#b', ' g4'],
				[' g4', '->', '#e'],
				[' g4', '>>', ' g5'],
				[' g5', '->', 3],
				[' g5', '>>', '.'],
		]);

		allow('labeled blank node items (and with label conflicts)', ''
			+':a :b (_:g0 _:b0 _:g1).', [
			['#a', '#b', ' g0'],
				[' g0', '->', '_g1'],
				[' g0', '>>', ' g2'],
				[' g2', '->', '_b0'],
				[' g2', '>>', ' g3'],
				[' g3', '->', '_g4'],
				[' g3', '>>', '.'],
		]);

		allow('as part of an object list', ''
			+':a :b (:c :d), :e.', [
			['#a', '#b', ' g0'],
				[' g0', '->', '#c'],
				[' g0', '>>', ' g1'],
				[' g1', '->', '#d'],
				[' g1', '>>', '.'],
			['#a', '#b', '#e'],
		]);

		allow('nesting 2 levels deep', ''
			+':a :b ((:c :d) (:e) :f). ', [
			['#a', '#b', ' g0'],
			[' g0', '->', ' g1'],
				[' g1', '->', '#c'],
				[' g1', '>>', ' g2'],
				[' g2', '->', '#d'],
				[' g2', '>>', '.'],
			[' g0', '>>', ' g3'],
			[' g3', '->', ' g4'],
				[' g4', '->', '#e'],
				[' g4', '>>', '.'],
			[' g3', '>>', ' g5'],
			[' g5', '->', '#f'],
			[' g5', '>>', '.'],
		]);

		allow('nesting 3 levels deep in the opposite direction', ''
			+':t :u (:v (:w) (:x :y :z)).', [
			['#t', '#u', ' g0'],
				[' g0', '->', '#v'],
				[' g0', '>>', ' g1'],
				[' g1', '->', ' g2'],
					[' g2', '->', '#w'],
					[' g2', '>>', '.'],
				[' g1', '>>', ' g3'],
				[' g3', '->', ' g4'],
					[' g4', '->', '#x'],
					[' g4', '>>', ' g5'],
					[' g5', '->', '#y'],
					[' g5', '>>', ' g6'],
					[' g6', '->', '#z'],
					[' g6', '>>', '.'],
				[' g3', '>>', '.'],
		]);

		allow('nesting 4 levels deep in the middle', ''
			+':a :b (:c (:d (:e (:f) :g) :h) :i). ', [
			['#a', '#b', ' g0'],
				[' g0', '->', '#c'],
				[' g0', '>>', ' g1'],
				[' g1', '->', ' g2'],
					[' g2', '->', '#d'],
					[' g2', '>>', ' g3'],
					[' g3', '->', ' g4'],
						[' g4', '->', '#e'],
						[' g4', '>>', ' g5'],
						[' g5', '->', ' g6'],
							[' g6', '->', '#f'],
							[' g6', '>>', '.'],
						[' g5', '>>', ' g7'],
						[' g7', '->', '#g'],
						[' g7', '>>', '.'],
					[' g3', '>>', ' g8'],
					[' g8', '->', '#h'],
					[' g8', '>>', '.'],
				[' g1', '>>', ' g9'],
				[' g9', '->', '#i'],
				[' g9', '>>', '.'],
		]);

		allow('blank node property list items', ''
			+':a :b ([] ([:c :d])).', [
			['#a', '#b', ' g0'],
				[' g0', '->', ' g1'],
				[' g0', '>>', ' g2'],
				[' g2', '->', ' g3'],
					[' g3', '->', ' g4'],
						[' g4', '#c', '#d'],
					[' g3', '>>', '.'],
				[' g2', '>>', '.'],
		]);

		allow('string literals and nested blank node property lists in collection subject', ''
			+'("1" [:a ("2" [:b "3"] "4")] "5") :c :d .', [
			[' g0', '->', 1],
			[' g0', '>>', ' g1'],
			[' g1', '->', ' g2'],
				[' g2', '#a', ' g3'],
					[' g3', '->', 2],
					[' g3', '>>', ' g4'],
					[' g4', '->', ' g5'],
						[' g5', '#b', 3],
					[' g4', '>>', ' g6'],
					[' g6', '->', 4],
					[' g6', '>>', '.'],
			[' g1', '>>', ' g7'],
			[' g7', '->', 5],
			[' g7', '>>', '.'],
			[' g0', '#c', '#d'],
		]);

		allow('string literals and iris nested in blank node property lists and collections in collection subject', `
			(
				"1"
				[
					:a "2";
					:b (
						"3"
						[
							:c (
								"3"
								[:d "4"]
								"5"
							)
						]
						"6"
					)
				]
				"7"
			) :e :f .`, [
				[' g0', '->', 1],
				[' g0', '>>', ' g1'],
				[' g1', '->', ' g2'],
					[' g2', '#a', 2],
					[' g2', '#b', ' g3'],
						[' g3', '->', 3],
						[' g3', '>>', ' g4'],
						[' g4', '->', ' g5'],
							[' g5', '#c', ' g6'],
							[' g6', '->', 3],
							[' g6', '>>', ' g7'],
							[' g7', '->', ' g8'],
								[' g8', '#d', 4],
							[' g7', '>>', ' g9'],
							[' g9', '->', 5],
							[' g9', '>>', '.'],
						[' g4', '>>', ' g10'],
						[' g10', '->', 6],
						[' g10', '>>', '.'],
				[' g1', '>>', ' g11'],
				[' g11', '->', 7],
				[' g11', '>>', '.'],
				[' g0', '#e', '#f'],
		]);
	});

	describe('string literals:', () => {
		allow('single quotes', `
			:a :b '' .
			:a :b 'c' .
			:a :b '"c\\u002C\\n\\'' .
			`, [
				['#a', '#b', {value:''}],
				['#a', '#b', {value:'c'}],
				['#a', '#b', {value:`"c,\n'`}],
			]);

		allow('double quotes', `
			:a :b "" .
			:a :b "c" .
			:a :b "'c\\u002C\\n\\"" .
			`, [
				['#a', '#b', {value:''}],
				['#a', '#b', {value:'c'}],
				['#a', '#b', {value:`'c,\n"`}],
			]);

		allow('long single quotes', `
			:a :b '''''' .
			:a :b '''\r''' .
			:a :b '''c''' .
			:a :b '''"c\\u002C''\\n'\n''' .
			`, [
				['#a', '#b', {value:''}],
				['#a', '#b', {value:'\r'}],
				['#a', '#b', {value:'c'}],
				['#a', '#b', {value:`"c,''\n'\n`}],
			]);

		allow('long double quotes', `
			:a :b """""" .
			:a :b """c""" .
			:a :b """'c\\u002C""\\n"\n""" .
			`, [
				['#a', '#b', {value:''}],
				['#a', '#b', {value:'c'}],
				['#a', '#b', {value:`'c,""\n"\n`}],
			]);

		allow('escapes & unicode', `
			:a :b "\\"\\\\t = '\\t'\\"",
				"\\"\\"\\"\\"\\"\\"",
				"\\"\\u00C5\\"", "\\"\\U0001D11E\\"\\\\test\\"" .
			`, [
				['#a', '#b', {value:'"\\t = \'\t\'"'}],
				['#a', '#b', {value:'""""""'}],
				['#a', '#b', {value:'"Å"'}],
				['#a', '#b', {value:'"𝄞"\\test"'}],
			]);

		allow('langtag', `
			:a :b "c"@en .
			:d :e "f"@EN .
			`, [
				['#a', '#b', {value:'c', language:'en', datatype:{value:P_RDF_LANGSTRING}}],
				['#d', '#e', {value:'f', language:'en', datatype:{value:P_RDF_LANGSTRING}}],
			]);

		allow('datatype', `
			:a :b "c"^^:x .
			@base <z://_/> .
			:d :e "f"^^<y> .
			:g :h "i"^^<z://_/z> .
			`, [
				['#a', '#b', {value:'c', datatype:{value:'#x'}}],
				['#d', '#e', {value:'f', datatype:{value:'z://_/y'}}],
				['#g', '#h', {value:'i', datatype:{value:'z://_/z'}}],
			]);
	});

	describe('numeric literals:', () => {
		allow('integers', `
			:a :b 0, -2, +20 .
			`, [
				['#a', '#b', {value:'0', number:0}],
				['#a', '#b', {value:'-2', number:-2}],
				['#a', '#b', {value:'+20', number:+20}],
			]);

		allow('decimals', `
			:a :b .0, -0.2, +20.0 .
			`, [
				['#a', '#b', {value:'.0', number:0}],
				['#a', '#b', {value:'-0.2', number:-0.2}],
				['#a', '#b', {value:'+20.0', number:+20.0}],
			]);

		allow('doubles', `
			:a :b 0.e1, -2.0e-1, +0.02e+3 .
			`, [
				['#a', '#b', {value:'0.e1', number:0}],
				['#a', '#b', {value:'-2.0e-1', number:-2.0e-1}],
				['#a', '#b', {value:'+0.02e+3', number:+0.02e+3}],
			]);
	});

	describe('boolean literals:', () => {
		allow('true', `
			:a :b true, TRUE .
			`, [
				['#a', '#b', {value:'true', boolean:true}],
				['#a', '#b', {value:'true', boolean:true}],
			]);

		allow('false', `
			:a :b false, FALSE .
			`, [
				['#a', '#b', {value:'false', boolean:false}],
				['#a', '#b', {value:'false', boolean:false}],
			]);
	});

	describe('emits parsing error for:', () => {
		err('prefix declaration without prefix',
			'@prefix <a> ', '<', 'prefix_id');

		err('prefix declaration without iri',
			'@prefix : .', '.', 'prefix_iri');

		err('prefix declaration without a dot',
			'@prefix : <a> ;', ';', 'full_stop');

		err('invalid collection syntax',
			'<a> <b> (]).', ']', 'collection_object');

		err('blank node predicate',
			'<a> _:b <c>.', '_', 'pairs');

		err('blank node with missing subject',
			'<a> <b> [<c>].', ']', 'object_list');

		err('blank node with only a semicolon',
			'<a> <b> [;].', ';', 'pairs');

		err('invalid blank node full stop',
			'[ <a> <b> .', '.', 'end_of_property_list');

		err('invalid collection full stop',
			'<a> <b> (.).', '.', 'collection_object');

		err('invalid collection property list',
			'<a> <b> (]).', ']', 'collection_object');

		err('no end of triple',
			':a :b :c ', '\0', 'post_object');
	});

	describe('states interrupted by end-of-stream:', () => {
		survive('prefix', '@prefix test: <z://> .', []);

		survive('base', '@base <z://> .', []);

		describe('triples with tokens:', () => {

			survive('prefixed names', ':alpha :bravo :charlie .', [
				['#alpha', '#bravo', '#charlie'],
			]);

			survive('iris', '<alpha> <bravo> <charlie> .', [
				['alpha', 'bravo', 'charlie'],
			]);

			survive('string literals', ':a :b "charlie"^^<z://delta> .', [
				['#a', '#b', {value:'charlie', datatype:{value:'z://delta'}}],
			]);

			survive('numeric literals', ':a :b 25.12e-1 .', [
				['#a', '#b', {value:'25.12e-1', number:25.12e-1}],
			]);
		});

		survive('prefixed names with dots', ':a :b :c.d. :a :b "c"^^:d.e.', [
			['#a', '#b', '#c.d'],
			['#a', '#b', {value:'c', datatype:{value:'#d.e'}}],
		]);

		survive('property list nesting', `
			:a0a :b0a[:b1a :c1a,:c1b;:b1b[:b2a :c2a;],:c1c,[:b2b :c2b],:c2d;:b1c :c1c;:b1d[]].`, [
				['#a0a', '#b0a', ' g0'],
					[' g0', '#b1a', '#c1a'],
					[' g0', '#b1a', '#c1b'],
					[' g0', '#b1b', ' g1'],
						[' g1', '#b2a', '#c2a'],
					[' g0', '#b1b', '#c1c'],
					[' g0', '#b1b', ' g2'],
						[' g2', '#b2b', '#c2b'],
					[' g0', '#b1b', '#c2d'],
					[' g0', '#b1c', '#c1c'],
					[' g0', '#b1d', ' g3'],
			]);

		survive('comments', `
			# comment
			<a> <b> <c> .`, [
				['a', 'b', 'c'],
			]);
	});


	// Special thanks to Ruben Verborgh for the following test cases:
	describe('n3 test cases:', () => {
		allow('should parse statements with an empty list in the subject',
			'() <a> <b>.', [
				[P_IRI_RDF_NIL, 'a', 'b'],
		]);

		allow('should parse statements with an empty list in the object',
			'<a> <b> ().', [
				['a', 'b', '.'],
		]);

		allow('should parse statements with a single-element list in the subject',
			'(<x>) <a> <b>.', [
				[' g0', '->', 'x'],
				[' g0', '>>', '.'],
				[' g0', 'a', 'b'],
		]);

		allow('should parse statements with a single-element list in the object',
			'<a> <b> (<x>).', [
				['a', 'b', ' g0'],
				[' g0', '->', 'x'],
				[' g0', '>>', '.'],
		]);

		allow('should parse statements with a multi-element list in the subject',
			'(<x> <y>) <a> <b>.', [
				[' g0', '->', 'x'],
				[' g0', '>>', ' g1'],
				[' g1', '->', 'y'],
				[' g1', '>>', '.'],
				[' g0', 'a', 'b'],
		]);

		allow('should parse statements with a multi-element list in the object',
			'<a> <b> (<x> <y>).', [
				['a', 'b', ' g0'],
				[' g0', '->', 'x'],
				[' g0', '>>', ' g1'],
				[' g1', '->', 'y'],
				[' g1', '>>', '.'],
		]);

		allow('should parse statements with prefixed names in lists',
			'@prefix a: <a#>. <a> <b> (a:x a:y).', [
				['a', 'b', ' g0'],
				[' g0', '->', 'a#x'],
				[' g0', '>>', ' g1'],
				[' g1', '->', 'a#y'],
				[' g1', '>>', '.'],
		]);

		allow('should parse statements with blank nodes in lists',
			'<a> <b> (_:x _:y).', [
				['a', 'b', ' g0'],
				[' g0', '->', '_x'],
				[' g0', '>>', ' g1'],
				[' g1', '->', '_y'],
				[' g1', '>>', '.'],
		]);

		allow('should parse statements with a list containing strings',
			'("1") <a> <b>.', [
				[' g0', '->', 1],
				[' g0', '>>', '.'],
				[' g0', 'a', 'b'],
		]);

		allow('should parse statements with a nested empty list',
			'<a> <b> (<x> ()).', [
				['a', 'b', ' g0'],
				[' g0', '->', 'x'],
				[' g0', '>>', ' g1'],
				[' g1', '->', '.'],
				[' g1', '>>', '.'],
		]);

		allow('should parse statements with non-empty nested lists',
			'<a> <b> (<x> (<y>)).', [
				['a', 'b', ' g0'],
				[' g0', '->', 'x'],
				[' g0', '>>', ' g1'],
				[' g1', '->', ' g2'],
				[' g2', '->', 'y'],
				[' g2', '>>', '.'],
				[' g1', '>>', '.'],
		]);

		allow('should parse statements with a list containing a blank node',
			'([]) <a> <b>.', [
				[' g0', '->', ' g1'],
				[' g0', '>>', '.'],
				[' g0', 'a', 'b'],
		]);

		allow('should parse statements with a list containing multiple blank nodes',
			'([] [<x> <y>]) <a> <b>.', [
				[' g0', '->', ' g1'],
				[' g0', '>>', ' g2'],
				[' g2', '->', ' g3'],
				[' g3', 'x', 'y'],
				[' g2', '>>', '.'],
				[' g0', 'a', 'b'],
		]);

		allow('should parse statements with a blank node containing a list',
			'[<a> (<b>)] <c> <d>.', [
				[' g0', 'a', ' g1'],
				[' g1', '->', 'b'],
				[' g1', '>>', '.'],
				[' g0', 'c', 'd'],
		]);
	});

	describe('graphy reader interface', () => {
		let k_tree_expect = dataset_tree();

		k_tree_expect.add(factory.quad(...[
			factory.namedNode('test://a'),
			factory.namedNode('test://b'),
			factory.namedNode('test://c'),
		]));

		graphy_reader_interface({
			reader: ttl_read,
			input: /* syntax: ttl */ `
				@base <base://> .
				@prefix : <test://> .
				@prefix test: <test://test#> .
				:a :b :c .
			`,
			events: {
				base(a_bases) {
					expect(a_bases).to.eql([
						['base://'],
					]);
				},

				prefix(a_prefixes) {
					expect(a_prefixes).to.eql([
						['', 'test://'],
						['test', 'test://test#'],
					]);
				},

				data(a_events) {
					let k_tree_actual = dataset_tree();
					for(let [g_quad] of a_events) {
						k_tree_actual.add(g_quad);
					}

					expect(k_tree_actual.equals(k_tree_expect)).to.be.true;
				},

				eof(a_eofs) {
					expect(a_eofs).to.have.length(1);
				},
			},
		});
	});

	describe('w3c rdf specification', async() => {
		await w3c_rdf_specification({
			reader: ttl_read,
			package: 'content.ttl.read',
			manifest: 'http://w3c.github.io/rdf-tests/turtle/manifest.ttl',
		});
	});
});
