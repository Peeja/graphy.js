const bkit = require('bkit');

const X_TOKEN_ABSOLUTE_IRI = 0x01;
const X_TOKEN_BLANK_NODE = 0x02;
const X_TOKEN_PREFIX_FOLLOWS = 0x03;
// const X_TOKEN_UTF_16 = 0x03;
const X_TOKEN_CONTENTS = bkit.encode_utf_8('"');
const X_TOKEN_LANGUAGE = bkit.encode_utf_8('@');
const X_TOKEN_DATATYPE = bkit.encode_utf_8('^');

const X_CODE_HEADER = 0x01;
const X_CODE_DICTIONARY = 0x02;
const X_CODE_CHAPTER_PREFIXES = 0x10;
const X_CODE_CHAPTER_HOPS = 0x11;
const X_CODE_CHAPTER_HOPS_ABSOLUTE = 0x12;
const X_CODE_CHAPTER_HOPS_PREFIXED = 0x13;
const X_CODE_CHAPTER_SUBJECTS = 0x14;
const X_CODE_CHAPTER_SUBJECTS_ABSOLUTE = 0x15;
const X_CODE_CHAPTER_SUBJECTS_PREFIXED = 0x16;
const X_CODE_CHAPTER_PREDICATES = 0x17;
const X_CODE_CHAPTER_PREDICATES_ABSOLUTE = 0x18;
const X_CODE_CHAPTER_PREDICATES_PREFIXED = 0x19;
const X_CODE_CHAPTER_OBJECTS = 0x1a;
const X_CODE_CHAPTER_OBJECTS_ABSOLUTE = 0x1b;
const X_CODE_CHAPTER_OBJECTS_PREFIXED = 0x1c;
const X_CODE_CHAPTER_LITERALS = 0x1d;
const X_CODE_CHAPTER_LITERALS_PLAIN = 0x1e;
const X_CODE_CHAPTER_LITERALS_LANGUAGED = 0x1f;
const X_CODE_CHAPTER_LITERALS_DATATYPED = 0x20;
const X_CODE_CHAPTER_LITERALS_DATATYPED_ABSOLUTE = 0x21;
const X_CODE_CHAPTER_LITERALS_DATATYPED_PREFIXED = 0x22;

const S_TOKEN_ABSOLUTE_IRI = String.fromCharCode(X_TOKEN_ABSOLUTE_IRI);
const S_TOKEN_BLANK_NODE = String.fromCharCode(X_TOKEN_BLANK_NODE);
const S_TOKEN_PREFIX_FOLLOWS = String.fromCharCode(X_TOKEN_PREFIX_FOLLOWS);

const AB_ZERO = Buffer.from([0x00]);
const AB_TOKEN_ABSOLUTE_IRI = Buffer.from([X_TOKEN_ABSOLUTE_IRI]);
const AB_TOKEN_BLANK_NODE = Buffer.from([X_TOKEN_BLANK_NODE]);
// const AB_TOKEN_UTF_16 = Buffer.from([0x04]);
const AB_TOKEN_PREFIX_FOLLOWS = Buffer.from([X_TOKEN_PREFIX_FOLLOWS]);
const AB_TOKEN_CONTENTS = Buffer.from('"', 'utf-8');
const AB_TOKEN_LANGUAGE = Buffer.from('@', 'utf-8');
const AB_TOKEN_DATATYPE = Buffer.from('^', 'utf-8');


const XM_NODE_SUBJECT	= 1 << 0;
const XM_NODE_OBJECT	= 1 << 1;
const XM_NODE_PREDICATE	= 1 << 2;
const XM_NODE_DATATYPE	= 1 << 3;

const XM_NODE_HOP = XM_NODE_SUBJECT | XM_NODE_OBJECT;

// for creating new prefixes
const R_COMPRESS = /^(.*?)([^/#]*)$/;


const S_PREFIXES = 'prefixes';
const S_TERM_HA = 'hops_absolute';
const S_TERM_SA = 'subjects_absolute';
const S_TERM_PA = 'predicates_absolute';
const S_TERM_OA = 'objects_absolute';
const S_TERM_HP = 'hops_prefixed';
const S_TERM_SP = 'subjects_prefixed';
const S_TERM_PP = 'predicates_prefixed';
const S_TERM_OP = 'objects_prefixed';
const S_TERM_LP = 'literals_plain';
const S_TERM_LL = 'literals_languaged';
const S_TERM_LDA = 'literals_datatyped_absolute';
const S_TERM_LDP = 'literals_datatyped_prefixed';


const R_IRI_ENCODING = /^(.*)#(.*)$/;

const P_IRI_BAT_ENCODING = 'http://bat-rdf.link/encoding/';
const PE_DATASET = P_IRI_BAT_ENCODING + 'dataset/partial-graph/1.0#';
const PE_DICTIONARY = P_IRI_BAT_ENCODING + 'dictionary/twelve-section/1.0#';
const PE_DICTIONARY_PP12OC = P_IRI_BAT_ENCODING + 'dictionary/pointers-prefixes-12-optional-chapters/1.0#';
const PE_TRIPLES_BITMAP = P_IRI_BAT_ENCODING + 'triples/bitmap/1.0#';
const PE_TRIPLES_WAVELET = P_IRI_BAT_ENCODING + 'triples/wavelet/1.0#';

const PE_CHAPTER_IC = P_IRI_BAT_ENCODING + 'chapter/indices-contents/1.0#';

// const PE_CHAPTER_FRONT_CODED = 

const PE_CHAPTER_INDICES_DIRECT = P_IRI_BAT_ENCODING + 'chapter-indices/direct/1.0#';
const PE_CHAPTER_CONTENTS_PFC = P_IRI_BAT_ENCODING + 'chapter-contents/pointers-front-coded/1.0#';


const H_CONSTANTS = {
	X_TOKEN_ABSOLUTE_IRI,
	X_TOKEN_BLANK_NODE,
	// X_TOKEN_UTF_16,
	X_TOKEN_PREFIX_FOLLOWS,

	S_TOKEN_ABSOLUTE_IRI,
	S_TOKEN_BLANK_NODE,
	S_TOKEN_PREFIX_FOLLOWS,

	AB_ZERO,

	AB_TOKEN_ABSOLUTE_IRI,

	AB_TOKEN_DATATYPE,
	AB_TOKEN_LANGUAGE,
	AB_TOKEN_CONTENTS,

	X_TOKEN_CONTENTS,
	X_TOKEN_LANGUAGE,
	X_TOKEN_DATATYPE,

	X_CODE_HEADER,
	X_CODE_DICTIONARY,
	X_CODE_CHAPTER_PREFIXES,
	X_CODE_CHAPTER_HOPS,
	X_CODE_CHAPTER_HOPS_ABSOLUTE,
	X_CODE_CHAPTER_HOPS_PREFIXED,
	X_CODE_CHAPTER_SUBJECTS,
	X_CODE_CHAPTER_SUBJECTS_ABSOLUTE,
	X_CODE_CHAPTER_SUBJECTS_PREFIXED,
	X_CODE_CHAPTER_PREDICATES,
	X_CODE_CHAPTER_PREDICATES_ABSOLUTE,
	X_CODE_CHAPTER_PREDICATES_PREFIXED,
	X_CODE_CHAPTER_OBJECTS,
	X_CODE_CHAPTER_OBJECTS_ABSOLUTE,
	X_CODE_CHAPTER_OBJECTS_PREFIXED,
	X_CODE_CHAPTER_LITERALS,
	X_CODE_CHAPTER_LITERALS_PLAIN,
	X_CODE_CHAPTER_LITERALS_LANGUAGED,
	X_CODE_CHAPTER_LITERALS_DATATYPED,
	X_CODE_CHAPTER_LITERALS_DATATYPED_ABSOLUTE,
	X_CODE_CHAPTER_LITERALS_DATATYPED_PREFIXED,

	R_COMPRESS,

	XM_NODE_SUBJECT,
	XM_NODE_OBJECT,
	XM_NODE_PREDICATE,
	XM_NODE_DATATYPE,
	XM_NODE_HOP,


	PE_DATASET,
	PE_DICTIONARY_PP12OC,
	PE_TRIPLES_BITMAP,

	PE_CHAPTER_IC,
	PE_CHAPTER_INDICES_DIRECT,
	PE_CHAPTER_CONTENTS_PFC,


	S_PREFIXES,
	S_TERM_HA,
	S_TERM_SA,
	S_TERM_PA,
	S_TERM_OA,
	S_TERM_HP,
	S_TERM_SP,
	S_TERM_PP,
	S_TERM_OP,
	S_TERM_LP,
	S_TERM_LL,
	S_TERM_LDA,
	S_TERM_LDP,
};



class container_decoder {
	constructor(kbd) {
		this.buffer_decoder = kbd;
	}

	child() {
		let kbd = this.buffer_decoder;

		let [, p_encoding, s_label] = R_IRI_ENCODING.exec(kbd.ntu8_string());
		let n_payload_bytes = kbd.vuint();
		let at_payload = kbd.sub(n_payload_bytes);

		return {
			encoding: p_encoding,
			label: s_label,
			payload: at_payload,
		};
	}

	finished() {
		debugger;
		// return this.buffer_decoder.
	}
}


class key_space {
	static bytes_needed(n_keys) {
		// ranges 0-1
		if(n_keys <= 0xf90b) {
			// range 0
			if(n_keys <= 0xfc) {
				return 1;
			}
			// range 1
			else {
				return 2;
			}
		}
		// ranges 2-3
		else {
			// range 2
			if(n_keys <= 0xf528cc) {
				return 3;
			}
			// range 3
			else {
				return 4;
			}
		}
	}

	constructor(n_key_bytes) {
		Object.assign(this, {
			key_bytes: n_key_bytes,
			i_id: 0,
		});
	}

	produce(a_bytes) {
		while(a_bytes.length < this.key_bytes) {
			a_bytes.unshift(AB_TOKEN_PREFIX_FOLLOWS);
		}

		return Buffer.from(a_bytes);
	}

	encode(i_id) {
		let n_key_bytes = this.key_bytes;
		let ab_write = new Uint8Array(n_key_bytes);
		if(n_key_bytes > 2) {
			if(3 === n_key_bytes) {
				ab_write[0] = ab_write[1] = ab_write[2] = X_TOKEN_PREFIX_FOLLOWS;
			}
			else {
				ab_write[0] = ab_write[1] = X_TOKEN_PREFIX_FOLLOWS;
			}
		}
		else {
			ab_write[0] = X_TOKEN_PREFIX_FOLLOWS;
		}

		// ranges 0-1
		if(i_id < 0xf90b) {
			// range 0
			if(i_id < 0xfc) {
				ab_write[n_key_bytes-1] = i_id + 4;
			}
			// range 1
			else {
				// avoid bytes 0x04 and below
				let x_out = i_id + 0x304 + (Math.trunc(i_id / 0xfc) << 2);

				// write
				ab_write[n_key_bytes-2] = x_out >> 8;
				ab_write[n_key_bytes-1] = x_out & 0xff;
			}
		}
		// ranges 2-3
		else {
			let x_b0 = Math.trunc(i_id / 0xfc) << 2;
			let x_b1 = Math.trunc((i_id - 0xf90c) / 0xf810) << 10;

			// range 2
			if(i_id < 0xf528cc) {
				let x_out = i_id + 0x30704 + x_b1 + x_b0;

				ab_write[n_key_bytes-3] = x_out >> 16;
				ab_write[n_key_bytes-2] = (x_out >> 8) & 0xff;
				ab_write[n_key_bytes-1] = x_out & 0xff;
			}
			// range 3
			else {
				let x_b2 = Math.trunc((i_id - 0xf528cc) / 0xf42fc0) << 18;
				let x_out = i_id + 0x3070704 + x_b2 + x_b1 + x_b0;

				ab_write[n_key_bytes-4] = x_out >> 24;
				ab_write[n_key_bytes-3] = (x_out >> 16) & 0xff;
				ab_write[n_key_bytes-2] = (x_out >> 8) & 0xff;
				ab_write[n_key_bytes-1] = x_out & 0xff;
			}
		}

		return ab_write;
	}

	decode(x_key) {
		let n_key_bytes = this.key_bytes;

		// ranges 0-1
		if(x_key <= 0xffff) {
			// range 0
			if(x_key <= 0xff) {
				return x_key - 4;
			}
			// range 1
			else {
				return (0xfc * (x_key - 0x304)) / 0x100;
			}
		}
	}

	next(ab_write, i_write) {
		// exceeded 1 byte range
		if(this.id > 0xff) {
			this.id = 0x0505;
			this.next = this.next_16;
			return this.next();
		}
		// within range
		else {
			// just set the least significant byte
			ab_write[i_write+this.key_bytes-1] = this.id++;
		}
	}

	next_16(ab_write, i_write) {
		let i_id = this.id;

		// skip 0-4 in b0
		let x_b0 = i_id & 0xff;
		while(x_b0 < 4) x_b0 = (i_id++) &0xff;

		// exceeded 2 byte range
		if(i_id > 0xffff) {
			this.id = 0x050505;
			this.next = this.next_24;
			return this.next();
		}
		// within range
		else {
			this.id = i_id + 1;

			// set b1 and b0
			let n_key_bytes = this.key_bytes;
			ab_write[i_write+n_key_bytes-2] = i_id >> 8;
			ab_write[i_write+n_key_bytes-1] = x_b0;
		}
	}

	next_24(ab_write, i_write) {
		let i_id = this.id;

		// skip 0-4 in b0
		let x_b0 = i_id & 0xff;
		while(x_b0 < 4) x_b0 = (i_id++) &0xff;

		// skip 0-4 in b1
		let x_b1 = (i_id >> 8) & 0xff;
		while(x_b1 < 4) {
			i_id += 0x0100;
			x_b1 = (i_id >> 8) & 0xff;
		}

		// exceeded 3 byte range
		if(i_id > 0xffffff) {
			this.id = 0x05050505;
			this.next = this.next_32;
			return this.next();
		}
		// within range
		else {
			this.id = i_id + 1;

			// set b2, b1 and b0
			let n_key_bytes = this.key_bytes;
			ab_write[i_write+n_key_bytes-3] = i_id >> 16;
			ab_write[i_write+n_key_bytes-2] = x_b1;
			ab_write[i_write+n_key_bytes-1] = x_b0;
		}
	}

	next_32(ab_write, i_write) {
		let i_id = this.id;

		// skip 0-4 in b0
		let x_b0 = i_id & 0xff;
		while(x_b0 < 4) x_b0 = (i_id++) &0xff;

		// skip 0-4 in b1
		let x_b1 = (i_id >> 8) & 0xff;
		while(x_b1 < 4) {
			i_id += 0x0100;
			x_b1 = (i_id >> 8) & 0xff;
		}

		// skip 0-4 in b2
		let x_b2 = (i_id >> 16) & 0xff;
		while(x_b2 < 4) {
			i_id += 0x010000;
			x_b2 = (i_id >> 16) & 0xff;
		}

		// exceeded 4 byte range
		if(i_id > 0xfffffffe) {
			this.next = this.exceeded_range;
			ab_write[i_write+0] = 0xff;
			ab_write[i_write+1] = 0xff;
			ab_write[i_write+2] = 0xff;
			ab_write[i_write+3] = 0xff;
		}
		// within range
		else {
			this.id = i_id + 1;

			// set b3, b2, b1 and b0
			ab_write[i_write+0] = i_id >> 24;
			ab_write[i_write+1] = x_b2;
			ab_write[i_write+2] = x_b1;
			ab_write[i_write+3] = x_b0;
		}
	}

	exceeded_range() {
		throw 'exceeded 32-bit range';
	}
}


module.exports = Object.assign(H_CONSTANTS, {
	key_space,
	container_decoder,
});