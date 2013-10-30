var fs = require('fs');
var csv = require('csv');
var redis = require('redis');
var http = require('http');
var https = require('https');

var argv = require('optimist')
	.usage('\nImport a csv containing meta tag data for urls.\n\nUsage: $0 <file|"url">\n\n*note: if using a url - be sure to put quotes around it.')
	.default('p', 6379)
	.describe('p', 'redis port')
	.alias('p', 'port')
	.default('h', 'localhost')
	.describe('h', 'redis host')
	.alias('h', 'host')
	.default('a','meta-tag')
	.describe('a','prefix redis key to namespace your data')
	.alias('a','prefix')
	.demand(1)
	.argv;

var client = redis.createClient(argv.p, argv.h, {});

console.log('process file: ' + argv._[0]);

if (/^http/.test(argv._[0])) {
	streamCsv(argv._[0], parseCsv);
} else {
	readCsv(argv._[0], parseCsv);
}

function streamCsv(url, cb) {
	if (/^https/.test(url)) {
		https.get(url, function(res) {
			parseCsv(res);
		});
	} else {
		http.get(url, function(res) {
			parseCsv(res);
		});
	}
}

function readCsv(path, cb) {
	var s = fs.createReadStream(argv._[0]);
	parseCsv(s);
}


function parseCsv(stream) {
	console.log('parse csv');
	csv()
		.from.stream(stream, {
			delimiter: ',',
			columns:true
		})
		.to.array(function(data) {
			/* TODO: support a header row */
			for (var i = 0; i < data.length; i++) {
				var row = data[i];
				metaData = {};
				Object.keys(row).forEach(function(k,i) {
					var u = k.toUpperCase();
					console.log(u +': ' + row[k]);
					metaData[u] = row[k];
				})
				console.log(metaData);
				client.hmset(argv.a + ':' + metaData['URL'], metaData);
			};
			process.exit(0);
		});
}
