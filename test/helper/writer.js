/* eslint indent: 0, padded-blocks: 0 */
import chai from 'chai';
const expect = chai.expect;

// import stream = require('@graphy/core.iso.stream');

import {
	QuadTree,
} from '@graphy/memory';

import util from './util.js';

export class WriterSuite {
	constructor(gc_suite, f_suite) {
		let s_prefix_string = '';
		if(gc_suite.prefixes) {
			let h_prefixes = gc_suite.prefixes;
			for(let [s_prefix_id, p_iri] of Object.entries(h_prefixes)) {
				s_prefix_string += `@prefix ${s_prefix_id}: <${p_iri}> .\n`;
			}
		}

		Object.assign(this, {
			...gc_suite,
			prefix_string: s_prefix_string,
			package: `content.${gc_suite.alias}.write`,
		});

		describe(this.package, () => {
			f_suite(this);
		});
	}

	normalize(st_doc, b_interpret=false) {
		return stream.source(st_doc)
			// read document
			.pipe(((b_interpret && this.interpreter) || this.validator)())

			// canonicalize in dataset
			.pipe(new DatasetTree({
				canonicalize: true,
			}))

			// serialize output
			.pipe(this.writer({
				prefixes: this.prefixes,
			}))

			// return accumulated result
			.bucket();
	}

	validates(h_tree) {
		util.map_tree(h_tree, (s_label, f_leaf) => {
			let {
				debug: b_debug=false,
				write: hcn_write,
				config: w_config={},
				validate: st_validate,
				type: s_type=null,
			} = f_leaf();

			it(s_label, async() => {
				// take concise-triples hash
				let st_output = await stream.source({
					type: s_type || this.type,
					value: hcn_write,
				})
					// pipe it thru turtle writer
					.pipe(this.writer({
						prefixes: this.prefixes,
						...w_config,
					}))

					// accumulate its output
					.bucket();

				// canonicalize output
				let st_result;
				try {
					st_result = await this.normalize(st_output, true);
				}
				catch(e_interpret) {
					throw new Error(`error while validating writer output string: ${e_interpret.stack}\n\n${st_output}`)
				}

				// canonicalize expectation
				let st_expect = await this.normalize(`
					${this.prefix_string}
					${st_validate}
				`);

				// helpful debug
				if(st_expect !== st_result) {
					debugger;
				}

				// assertion
				expect(st_result).to.equal(st_expect);
			});
		});
	}

	outputs(h_tree) {
		describe('output string', () => {
			util.map_tree(h_tree, (s_label, f_leaf) => {
				let {
					write: w_write,
					type: s_type=null,
					config: w_config={},
					output: st_expect,
				} = f_leaf();

				it(s_label, async() => {
					// take concise-triples hash
					let st_output = await stream.source({
						type: s_type || this.type,
						value: w_write,
					})
						// pipe it thru turtle writer
						.pipe(this.writer({
							prefixes: this.prefixes,
							...w_config,
						}))

						// accumulate its output and trim
						.bucket();

					// gobble expectation
					st_expect = util.gobble(st_expect).trim();

					// remove trailing whitespace from each line
					st_expect = st_expect.split(/\n/g).map(s => s.trimRight()).join('\n');
					st_output = st_output.trim().split(/\n/g).map(s => s.trimRight()).join('\n');

					// assertion
					expect(st_output).to.equal(st_expect);
				});
			});
		});
	}

	events(h_tree) {
		describe('emits ordered events', () => {
			util.map_tree(h_tree, (s_label, f_leaf) => {
				let {
					writes: a_writes,
					writer: f_writer=null,
					events: a_events_expect,
				} = f_leaf();

				it(s_label, (fke_test) => {
					let a_events_actual = [];
					let fk_validate = null;

					// create writer
					let ds_writer = this.writer();

					// callback
					if(f_writer) {
						f_writer(ds_writer, (fk_validator) => {
							fk_validate = fk_validator;
						});
					}

					// create interpreter
					let ds_interpreter = (this.interpreter || this.validator)({
						error(e_read) {
							fke_test(e_read);
						},

						finish() {
							// run interpreter callback?
							if(fk_validate) fk_validate();

							// check interpreter events
							expect(a_events_actual).to.have.lengthOf(a_events_expect.length);

							for(let i_event=0; i_event<a_events_actual.length; i_event++) {
								let [s_event_actual, a_event_args] = a_events_actual[i_event];
								let [s_event_expect, f_event_validate] = a_events_expect[i_event];

								// expect same event name
								expect(s_event_actual).to.equal(s_event_expect);

								// validate arguments
								f_event_validate(...a_event_args);
							}

							// end of test
							fke_test();
						},
					});

					// each expected event type
					let as_events_bind = new Set(a_events_expect.map(a => a[0]));
					for(let s_event of as_events_bind) {
						// bind listener
						ds_interpreter.on(s_event, (...a_args) => {
							// push to actual event list
							a_events_actual.push([s_event, a_args]);
						});
					}

					// pipe writer to interpreter
					ds_writer.pipe(ds_interpreter);

					// write each writable data event
					for(let w_write of a_writes) {
						ds_writer.write(w_write);
					}

					// end stream
					ds_writer.end();
				});
			});
		});
	}

	throws(h_tree) {
		describe('throws', () => {
			util.map_tree(h_tree, (s_label, f_leaf) => {
				let {
					write: w_write,
					type: s_type=null,
					config: w_config={},
					match: r_match=null,
				} = f_leaf();

				it(s_label, (fke_test) => {
					// create writer
					let ds_writer = this.writer({
						prefixes: this.prefixes,
						...w_config,

						// pipe to null
						data() {},

						// listen for error, caught error
						error(e_write) {
							// expect message match
							if(r_match) {
								expect(e_write.message).to.match(r_match);
							}

							// done
							fke_test();
						},

						// should not have reached
						eof() {
							fke_test(new Error('never threw an error'));
						},
					});

					// write data to it
					ds_writer.write({
						type: s_type || this.type,
						value: w_write,
					});

					// end stream
					ds_writer.end();
				});
			});
		});
	}
}

export default WriterSuite;
