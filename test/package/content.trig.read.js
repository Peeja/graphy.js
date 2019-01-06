/* eslint indent: 0, padded-blocks: 0, quote-props: 0 */
const expect = require('chai').expect;

const S_GRAPHY_CHANNEL = process.env.GRAPHY_CHANNEL || 'graphy';

const factory = require(`@${process.env.GRAPHY_CHANNEL || 'graphy'}/core.data.factory`);
const dataset_tree = require(`@${process.env.GRAPHY_CHANNEL || 'graphy'}/util.dataset.tree`);

const reader_suite = require('../helper/reader.js');

const trig_read = require(`@${S_GRAPHY_CHANNEL || 'graphy'}/content.trig.read`);

reader_suite({
	alias: 'trig',
	reader: trig_read,
	manifest: 'http://w3c.github.io/rdf-tests/trig/manifest.ttl',
	prefixes: {
		'': '#',
	},
}, (reader) => {
	const a_abc = [['z://y/a', 'z://y/b', 'z://y/c', '*']];
	const a_abcg = [['z://y/a', 'z://y/b', 'z://y/c', 'z://y/g']];
	const a_abc_g = [['z://y/a', 'z://y/b', 'z://y/c', '_g']];

	reader.allows({
		'empty': {
			'blank': () => ['', []],
			'whitespace': () => [' \t \n', []],
			'default graph': () => ['{}', []],
			'default graphs': () => ['{}{}{}{}', []],
		},

		'iris & prefixed names w/o graph': {
			'iris': () => ['<z://y/a> <z://y/b> <z://y/c> .', a_abc],

			'iris w/ base': () => ['@base <z://y>. <a> <b> <c> .', a_abc],

			'iris w/ unicode escapes': () => ['<\\u2713> <like> <\\U0001F5F8> .', [
				['\u2713', 'like', '\ud83d\uddf8', '*'],
			]],

			'iris crammed spaces': () => [`
				<z://y/a><z://y/b>"f"^^<z://y/g>.
			`, [
				['z://y/a', 'z://y/b', '^z://y/g"f', '*'],
			]],

			'prefixed names w/ empty prefix id': () => ['@prefix : <z://y/>. :a :b :c .', a_abc],

			'prefixed names w/ trailing colon & mid-stops': () => [`
				@prefix : <z://y/>. :a: :b.b :c:c.c: .
			`, [
				['z://y/a:', 'z://y/b.b', 'z://y/c:c.c:', '*'],
			]],

			'prefixed names w/ non-empty prefix id': () => ['@prefix p: <z://y/>. p:a p:b p:c .', a_abc],

			'prefixed names w/ empty suffix': () => [`
				@prefix pa: <z://y/a>.
				@prefix pb: <z://y/b>.
				@prefix pc: <z://y/c>.
				pa: pb: pc: .
			`, a_abc],

			'prefixed named crammed spaces': () => [`
				@prefix :<z://y/>._:a:b<z://y/c>._:a:b"f"@EN.
			`, [
				['_a', 'z://y/b', 'z://y/c', '*'],
				['_a', 'z://y/b', '@en"f', '*'],
			]],
		},

		'iris & prefixed names w/ default graph': {
			'iris': () => ['{<z://y/a> <z://y/b> <z://y/c>}', a_abc],

			'iris w/ base': () => ['@base <z://y>. {<a> <b> <c>.}', a_abc],

			'iris w/ unicode escapes': () => ['{<\\u2713> <like> <\\U0001F5F8> .}', [
				['\u2713', 'like', '\ud83d\uddf8', '*'],
			]],

			'iris crammed spaces': () => [`
				{<z://y/a><z://y/b>"f"^^<z://y/g>.}
			`, [
				['z://y/a', 'z://y/b', '^z://y/g"f', '*'],
			]],

			'prefixed names w/ empty prefix id': () => ['@prefix : <z://y/>. {:a :b :c .}', a_abc],

			'prefixed names w/ trailing colon & mid-stops': () => [`
				@prefix : <z://y/>. {:a: :b.b :c:c.c: .}
			`, [
				['z://y/a:', 'z://y/b.b', 'z://y/c:c.c:', '*'],
			]],

			'prefixed names w/ non-empty prefix id': () => ['@prefix p: <z://y/>. {p:a p:b p:c .}', a_abc],

			'prefixed names w/ empty suffix': () => [`
				@prefix pa: <z://y/a>.
				@prefix pb: <z://y/b>.
				@prefix pc: <z://y/c>.
				{pa: pb: pc: .}
			`, a_abc],

			'prefixed named crammed spaces': () => [`
				@prefix :<z://y/>.{_:a:b<z://y/c>._:a:b"f"@EN}
			`, [
				['_a', 'z://y/b', 'z://y/c', '*'],
				['_a', 'z://y/b', '@en"f', '*'],
			]],
		},


		'iris & prefixed names w/ named graph': {
			'iris': () => ['<z://y/g> { <z://y/a> <z://y/b> <z://y/c> . }', a_abcg],

			'iris w/ base': () => ['@base <z://y>. <g> { <a> <b> <c> . }', a_abcg],

			'iris w/ comment': () => [`
				@base <z://y>.
				<g> # comment
				{
					<a> <b> <c> .
				}
			`, a_abcg],

			'iris w/ unicode escapes': () => ['<\\u2713\\U0001F5F8> { <\\u2713> <like> <\\U0001F5F8> .}', [
				['\u2713', 'like', '\ud83d\uddf8', '\u2713\ud83d\uddf8'],
			]],

			'iris crammed spaces': () => [`
				<z://y/h>{<z://y/a><z://y/b>"f"^^<z://y/g>}
			`, [
				['z://y/a', 'z://y/b', '^z://y/g"f', 'z://y/h'],
			]],

			'prefixed names w/ empty prefix id': () => ['@prefix : <z://y/>. :g { :a :b :c . }', a_abcg],

			'prefixed names w/ trailing colon & mid-stops': () => [`
				@prefix : <z://y/>. :g:g.g:{:a: :b.b :c:c.c:.}
			`, [
				['z://y/a:', 'z://y/b.b', 'z://y/c:c.c:', 'z://y/g:g.g:'],
			]],

			'prefixed names w/ non-empty prefix id': () => ['@prefix p: <z://y/>. p:g{p:a p:b p:c.}', a_abcg],

			'prefixed names w/ empty suffix': () => [`
				@prefix pa: <z://y/a>.
				@prefix pb: <z://y/b>.
				@prefix pc: <z://y/c>.
				@prefix pg: <z://y/g>.
				pg: { pa: pb: pc: . }
			`, a_abcg],

			'prefixed named crammed spaces': () => [`
				@prefix :<z://y/>.:g{_:a:b<z://y/c>._:a:b"f"@EN}
			`, [
				['_a', 'z://y/b', 'z://y/c', 'z://y/g'],
				['_a', 'z://y/b', '@en"f', 'z://y/g'],
			]],

			'prefixed named w/ comment': () => [`
				@base <z://y>.@prefix :<z://y/>.
				:g # comment
				{
					<a> <b> <c> .
				}
			`, a_abcg],
		},

		'iris & prefixed names w/ blank node graph': {
			'iris': () => ['_:g { <z://y/a> <z://y/b> <z://y/c> . }', a_abc_g],

			'iris w/ base': () => ['@base <z://y>. _:g { <a> <b> <c> . }', a_abc_g],

			'iris w/ comment': () => [`
				@base <z://y>.
				_:g # comment
				{
					<a> <b> <c> .
				}
			`, a_abc_g],

			'iris w/ unicode escapes': () => ['_:g { <\\u2713> <like> <\\U0001F5F8> .}', [
				['\u2713', 'like', '\ud83d\uddf8', '_g'],
			]],

			'iris crammed spaces': () => [`
				_:g{<z://y/a><z://y/b>"f"^^<z://y/g>}
			`, [
				['z://y/a', 'z://y/b', '^z://y/g"f', '_g'],
			]],

			'prefixed names w/ empty prefix id': () => ['@prefix : <z://y/>. _:g { :a :b :c . }', a_abc_g],

			'prefixed names w/ trailing colon & mid-stops': () => [`
				@prefix : <z://y/>. _:g{:a: :b.b :c:c.c:.}
			`, [
				['z://y/a:', 'z://y/b.b', 'z://y/c:c.c:', '_g'],
			]],

			'prefixed names w/ non-empty prefix id': () => ['@prefix p: <z://y/>. _:g{p:a p:b p:c.}', a_abc_g],

			'prefixed names w/ empty suffix': () => [`
				@prefix pa: <z://y/a>.
				@prefix pb: <z://y/b>.
				@prefix pc: <z://y/c>.
				@prefix pg: <z://y/g>.
				_:g { pa: pb: pc: . }
			`, a_abc_g],

			'prefixed named crammed spaces': () => [`
				@prefix :<z://y/>._:g{_:a:b<z://y/c>._:a:b"f"@EN}
			`, [
				['_a', 'z://y/b', 'z://y/c', '_g'],
				['_a', 'z://y/b', '@en"f', '_g'],
			]],

			'prefixed named w/ comment': () => [`
				@base <z://y>.
				_:g # comment
				{
					<a> <b> <c> .
				}
			`, a_abc_g],
		},

		'iris & prefixed names w/ named graph and token': {
			'iris': () => ['graph <z://y/g> { <z://y/a> <z://y/b> <z://y/c> . }', a_abcg],

			'iris w/ base': () => ['@base <z://y>. graph <g> { <a> <b> <c> . }', a_abcg],

			'iris w/ comment': () => [`
				@base <z://y>.
				graph # comment
				<g> # comment
				{
					<a> <b> <c> .
				}
			`, a_abcg],

			'iris w/ unicode escapes': () => ['graph <\\u2713\\U0001F5F8> { <\\u2713> <like> <\\U0001F5F8> .}', [
				['\u2713', 'like', '\ud83d\uddf8', '\u2713\ud83d\uddf8'],
			], true],

			'iris crammed spaces': () => [`
				graph<z://y/h>{<z://y/a><z://y/b>"f"^^<z://y/g>}
			`, [
				['z://y/a', 'z://y/b', '^z://y/g"f', 'z://y/h'],
			]],

			'prefixed names w/ empty prefix id': () => ['@prefix : <z://y/>. graph :g { :a :b :c . }', a_abcg],

			'prefixed names w/ trailing colon & mid-stops': () => [`
				@prefix : <z://y/>. graph :g:g.g:{:a: :b.b :c:c.c:.}
			`, [
				['z://y/a:', 'z://y/b.b', 'z://y/c:c.c:', 'z://y/g:g.g:'],
			]],

			'prefixed names w/ non-empty prefix id': () => ['@prefix p: <z://y/>. graph p:g{p:a p:b p:c.}', a_abcg],

			'prefixed names w/ empty suffix': () => [`
				@prefix pa: <z://y/a>.
				@prefix pb: <z://y/b>.
				@prefix pc: <z://y/c>.
				@prefix pg: <z://y/g>.
				graph pg: { pa: pb: pc: . }
			`, a_abcg],

			'prefixed named crammed spaces': () => [`
				@prefix :<z://y/>.graph :g{_:a:b<z://y/c>._:a:b"f"@EN}
			`, [
				['_a', 'z://y/b', 'z://y/c', 'z://y/g'],
				['_a', 'z://y/b', '@en"f', 'z://y/g'],
			]],

			'prefixed named w/ comment': () => [`
				@base <z://y>.
				graph # comment
				<g> # comment
				{
					<a> <b> <c> .
				}
			`, a_abcg],
		},

		'iris & prefixed names w/ blank node graph and token': {
			'iris': () => ['graph _:g { <z://y/a> <z://y/b> <z://y/c> . }', a_abc_g],

			'iris w/ base': () => ['@base <z://y>. graph _:g { <a> <b> <c> . }', a_abc_g],

			'iris w/ comment': () => [`
				@base <z://y>.
				graph # comment
				<g> # comment
				{
					<a> <b> <c> .
				}
			`, a_abcg],

			'iris w/ unicode escapes': () => ['graph _:g { <\\u2713> <like> <\\U0001F5F8> .}', [
				['\u2713', 'like', '\ud83d\uddf8', '_g'],
			]],

			'iris crammed spaces': () => [`
				graph _:g{<z://y/a><z://y/b>"f"^^<z://y/g>}
			`, [
				['z://y/a', 'z://y/b', '^z://y/g"f', '_g'],
			]],

			'prefixed names w/ empty prefix id': () => ['@prefix : <z://y/>. graph _:g { :a :b :c . }', a_abc_g],

			'prefixed names w/ trailing colon & mid-stops': () => [`
				@prefix : <z://y/>. graph _:g{:a: :b.b :c:c.c:.}
			`, [
				['z://y/a:', 'z://y/b.b', 'z://y/c:c.c:', '_g'],
			]],

			'prefixed names w/ non-empty prefix id': () => ['@prefix p: <z://y/>. graph _:g{p:a p:b p:c.}', a_abc_g],

			'prefixed names w/ empty suffix': () => [`
				@prefix pa: <z://y/a>.
				@prefix pb: <z://y/b>.
				@prefix pc: <z://y/c>.
				@prefix pg: <z://y/g>.
				graph _:g { pa: pb: pc: . }
			`, a_abc_g],

			'prefixed named crammed spaces': () => [`
				@prefix :<z://y/>.graph _:g{_:a:b<z://y/c>._:a:b"f"@EN}
			`, [
				['_a', 'z://y/b', 'z://y/c', '_g'],
				['_a', 'z://y/b', '@en"f', '_g'],
			]],

			'prefixed named w/ comment': () => [`
				@base <z://y>.
				graph # comment
				_:g # comment
				{
					<a> <b> <c> .
				}
			`, a_abc_g],
		},
	});

});


// describe('trig parser:', () => {
// 	describe('empty:', () => {
// 		allow('blank', '', []);

// 		allow('whitespace', ' \t \n', []);
// 	});

// 	describe('iris & prefixed names w/o graph:', () => {
// 		const abc = [['z://_/a', 'z://_/b', 'z://_/c']];

// 		allow('iris', '<z://_/a> <z://_/b> <z://_/c> .', abc);

// 		allow('iris w/ base', '@base <z://_/>. <a> <b> <c> .', abc);

// 		allow('iris w/ unicode escapes', '<\\u2713> <like> <\\U0001F5F8> .', [
// 			['\u2713', 'like', '\ud83d\uddf8', ''],
// 		]);

// 		allow('prefixed names w/ empty prefix id', '@prefix : <z://_/>. :a :b :c .', abc);

// 		allow('prefixed names w/ non-empty prefix id', '@prefix p: <z://_/>. p:a p:b p:c .', abc);

// 		allow('prefixed names w/ empty suffix', '@prefix pa: <z://_/a>. @prefix pb: <z://_/b>. @prefix pc: <z://_/c>. pa: pb: pc: .', abc);
// 	});

// 	describe('iris & prefixed names w/ default graph:', () => {
// 		const abc = [['z://_/a', 'z://_/b', 'z://_/c']];

// 		allow('iris', '{ <z://_/a> <z://_/b> <z://_/c> . }', abc);

// 		allow('iris w/ base', '@base <z://_/>. { <a> <b> <c> . }', abc);

// 		allow('iris w/ unicode escapes', '{ <\\u2713> <like> <\\U0001F5F8> . }', [
// 			['\u2713', 'like', '\ud83d\uddf8', ''],
// 		]);

// 		allow('prefixed names w/ empty prefix id', '@prefix : <z://_/>. { :a :b :c . }', abc);

// 		allow('prefixed names w/ non-empty prefix id', '@prefix p: <z://_/>. { p:a p:b p:c . }', abc);

// 		allow('prefixed names w/ empty suffix', '@prefix pa: <z://_/a>. @prefix pb: <z://_/b>. @prefix pc: <z://_/c>. { pa: pb: pc: . }', abc);
// 	});

// 	describe('iris & prefixed names w/ named graph:', () => {
// 		const abcd = [['z://_/a', 'z://_/b', 'z://_/c', 'z://_/d']];

// 		allow('iris', '<z://_/d> { <z://_/a> <z://_/b> <z://_/c> . }', abcd);

// 		allow('iris w/ base', '@base <z://_/>. <z://_/d> { <a> <b> <c> . }', abcd);

// 		allow('iris w/ unicode escapes', '<z://_/d> { <\\u2713> <like> <\\U0001F5F8> . }', [
// 			['\u2713', 'like', '\ud83d\uddf8', 'z://_/d'],
// 		]);

// 		allow('prefixed names w/ empty prefix id', '@prefix : <z://_/>. <z://_/d> { :a :b :c . }', abcd);

// 		allow('prefixed names w/ non-empty prefix id', '@prefix p: <z://_/>. <z://_/d> { p:a p:b p:c . }', abcd);

// 		allow('prefixed names w/ empty suffix', '@prefix pa: <z://_/a>. @prefix pb: <z://_/b>. @prefix pc: <z://_/c>. <z://_/d> { pa: pb: pc: . }', abcd);
// 	});

// 	describe('graphs:', () => {
// 		allow('multiple iri named', '@prefix : <#>. <#g1> { :a :b :c .} <#g2> { :d :e :f . }',
// 			[
// 				['#a', '#b', '#c', '#g1'],
// 				['#d', '#e', '#f', '#g2'],
// 			]);

// 		allow('multiple prefixed named', ':g1 { :a :b :c. } :g2 { :d :e :f. }',
// 			[
// 				['#a', '#b', '#c', '#g1'],
// 				['#d', '#e', '#f', '#g2'],
// 			]);

// 		allow('multiple labeled blank', '_:g1 { :a :b :c. } _:g2 { :d :e :f. }',
// 			[
// 				['#a', '#b', '#c', '_g1'],
// 				['#d', '#e', '#f', '_g2'],
// 			]);

// 		allow('multiple anonymous blank', '[] { :a :b :c. } [] { :d :e :f. }',
// 			[
// 				['#a', '#b', '#c', ' g0'],
// 				['#d', '#e', '#f', ' g1'],
// 			]);

// 		allow('mixed', '[] { :a :b :c .} _:g1 { :d :e :f. } :g2 { :g :h :i. } <#g3> { :k :l :m. }',
// 			[
// 				['#a', '#b', '#c', ' g0'],
// 				['#d', '#e', '#f', '_g1'],
// 				['#g', '#h', '#i', '#g2'],
// 				['#k', '#l', '#m', '#g3'],
// 			]);

// 		allow('mixed w/ multiple statements & nesting', `
// 			[] {
// 				:a :b :c, :d;
// 					:e "f"^^:g ;
// 					:h [
// 						:i _:j ;
// 						:k (:l "m" [:n :o])
// 					] .
// 			}
// 			_:g10 {
// 				:a :b :c, :d;
// 					:e "f"^^:g ;
// 					:h [
// 						:i _:j ;
// 						:k (:l "m" [:n :o])
// 					] .
// 			}
// 			:g20 {
// 				:a :b :c, :d;
// 					:e "f"^^:g ;
// 					:h [
// 						:i _:j ;
// 						:k (:l "m" [:n :o])
// 					] .
// 			}
// 			<#g30> {
// 				:a :b :c, :d;
// 					:e "f"^^:g ;
// 					:h [
// 						:i _:j ;
// 						:k (:l "m" [:n :o])
// 					] .
// 			}`, [
// 				['#a', '#b', '#c', ' g0'],
// 				['#a', '#b', '#d', ' g0'],
// 				['#a', '#e', {value:'f', datatype:{value:'#g'}}, ' g0'],
// 				['#a', '#h', ' g1', ' g0'],
// 					[' g1', '#i', '_j', ' g0'],
// 					[' g1', '#k', ' g2', ' g0'],
// 						[' g2', '->', '#l', ' g0'],
// 						[' g2', '>>', ' g3', ' g0'],
// 						[' g3', '->', {value:'m'}, ' g0'],
// 						[' g3', '>>', ' g4', ' g0'],
// 						[' g4', '->', ' g5', ' g0'],
// 						[' g5', '#n', '#o', ' g0'],
// 						[' g4', '>>', '.', ' g0'],
// 				['#a', '#b', '#c', '_g10'],
// 				['#a', '#b', '#d', '_g10'],
// 				['#a', '#e', {value:'f', datatype:{value:'#g'}}, '_g10'],
// 				['#a', '#h', ' g6', '_g10'],
// 					[' g6', '#i', '_j', '_g10'],
// 					[' g6', '#k', ' g7', '_g10'],
// 						[' g7', '->', '#l', '_g10'],
// 						[' g7', '>>', ' g8', '_g10'],
// 						[' g8', '->', {value:'m'}, '_g10'],
// 						[' g8', '>>', ' g9', '_g10'],
// 						[' g9', '->', ' g11', '_g10'],
// 						[' g11', '#n', '#o', '_g10'],
// 						[' g9', '>>', '.', '_g10'],
// 				['#a', '#b', '#c', '#g20'],
// 				['#a', '#b', '#d', '#g20'],
// 				['#a', '#e', {value:'f', datatype:{value:'#g'}}, '#g20'],
// 				['#a', '#h', ' g12', '#g20'],
// 					[' g12', '#i', '_j', '#g20'],
// 					[' g12', '#k', ' g13', '#g20'],
// 						[' g13', '->', '#l', '#g20'],
// 						[' g13', '>>', ' g14', '#g20'],
// 						[' g14', '->', {value:'m'}, '#g20'],
// 						[' g14', '>>', ' g15', '#g20'],
// 						[' g15', '->', ' g16', '#g20'],
// 						[' g16', '#n', '#o', '#g20'],
// 						[' g15', '>>', '.', '#g20'],
// 				['#a', '#b', '#c', '#g30'],
// 				['#a', '#b', '#d', '#g30'],
// 				['#a', '#e', {value:'f', datatype:{value:'#g'}}, '#g30'],
// 				['#a', '#h', ' g17', '#g30'],
// 					[' g17', '#i', '_j', '#g30'],
// 					[' g17', '#k', ' g18', '#g30'],
// 						[' g18', '->', '#l', '#g30'],
// 						[' g18', '>>', ' g19', '#g30'],
// 						[' g19', '->', {value:'m'}, '#g30'],
// 						[' g19', '>>', ' g20', '#g30'],
// 						[' g20', '->', ' g21', '#g30'],
// 						[' g21', '#n', '#o', '#g30'],
// 						[' g20', '>>', '.', '#g30'],
// 			]);
// 	});

// 	describe('graphy reader interface', () => {
// 		let k_tree_expect = dataset_tree();

// 		k_tree_expect.add(factory.quad(...[
// 			factory.namedNode('test://a'),
// 			factory.namedNode('test://b'),
// 			factory.namedNode('test://c'),
// 		]));

// 		k_tree_expect.add(factory.quad(...[
// 			factory.namedNode('test://d'),
// 			factory.namedNode('test://e'),
// 			factory.namedNode('test://f'),
// 			factory.namedNode('test://graph'),
// 		]));

// 		k_tree_expect.add(factory.quad(...[
// 			factory.namedNode('test://g'),
// 			factory.namedNode('test://h'),
// 			factory.namedNode('test://i'),
// 		]));

// 		graphy_reader_interface({
// 			reader: trig_read,
// 			input: /* syntax: trig */ `
// 				@base <base://> .
// 				@prefix : <test://> .
// 				@prefix test: <test://test#> .
// 				:a :b :c .
// 				:graph {
// 					:d :e :f .
// 				}
// 				:g :h :i .
// 			`,
// 			events: {
// 				base(a_bases) {
// 					expect(a_bases).to.eql([
// 						['base://'],
// 					]);
// 				},

// 				prefix(a_prefixes) {
// 					expect(a_prefixes).to.eql([
// 						['', 'test://'],
// 						['test', 'test://test#'],
// 					]);
// 				},

// 				enter(a_opens) {
// 					expect(a_opens).to.have.length(1);
// 				},

// 				exit(a_exits) {
// 					expect(a_exits).to.have.length(1);
// 				},

// 				data(a_events) {
// 					let k_tree_actual = dataset_tree();
// 					for(let [g_quad] of a_events) {
// 						k_tree_actual.add(g_quad);
// 					}

// 					expect(k_tree_actual.equals(k_tree_expect)).to.be.true;
// 				},

// 				eof(a_eofs) {
// 					expect(a_eofs).to.have.length(1);
// 				},
// 			},
// 		});
// 	});

// 	describe('w3c rdf specification', async() => {
// 		await w3c_rdf_specification({
// 			reader: trig_read,
// 			package: 'content.trig.read',
// 			manifest: 'http://w3c.github.io/rdf-tests/trig/manifest.ttl',
// 		});
// 	});
// });


