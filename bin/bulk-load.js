var fs = require('fs');
var csv = require('csv');
var redis = require('redis');
var http = require('http');
var https = require('https');
var async = require('async');

var argv = require('optimist')
	.usage('\nImport a csv containing meta tag data for urls.\n\nUsage: $0 <file|"url">\n\n*note: if using a url - be sure to put quotes around it.')
	.
default ('p', 6379)
	.describe('p', 'redis port')
	.alias('p', 'port')
	.
default ('h', 'localhost')
	.describe('h', 'redis host')
	.alias('h', 'host')
	.
default ('a', 'meta-tag')
	.describe('a', 'prefix redis key to namespace your data')
	.alias('a', 'prefix')
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
	csv()
		.from.stream(stream, {
			delimiter: ',',
			columns: true
		})
		.to.array(function(data) {
			/* TODO: support a header row */
			async.eachSeries(data, function(row, next) {
					var metaData = {};

					async.eachSeries(Object.keys(row), function(k, cb) {

							var u = k.toUpperCase();
							metaData[u] = row[k];
							cb();
						},

						function(err, result) {
							if (err) {
								console.log(err);
							} else {
								client.hmset(argv.a + ':' + metaData['URL'], metaData, function(err, result) {
									next();
								});
							}
						});
				},
				function(err, result) {
					console.log('done.');
					process.exit(0);
				});
		});
}
