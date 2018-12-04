const fs = require('fs');
const loader = require('./loader.js');


let ds_output = fs.createWriteStream(`./build/${process.env.GRAPHY_CHANNEL || 'graphy'}/.turtle-earl-report.ttl`);

loader({
	manifest: 'https://www.w3.org/2013/TurtleTests/manifest.ttl',
	mime: 'text/turtle',
	output: ds_output,
});
