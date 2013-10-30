var redis = require("redis");

module.exports = function(opts) {
	var client = redis.createClient(opts.redis.port, opts.redis.host, opts.opts);
	opts.namespace = opts.namespace || 'meta';
	opts.prefix = opts.prefix || 'meta-tag';

	return function(req, res, next) {
		/* use the url as key in redis to find associated meta data */

		/* TODO:load most commonly accessed urls into memory */

		var accept = false;
		if (typeof opts.accept !== "undefined") {
			if (opts.accept.test(req.url)) {
				accept = true;
				fetch(opts.prefix+':'+req.url, function(err, obj) {
					if (obj) {
						req[opts.namespace] = obj;
					}
					next();
				})
			}
		}

		if ((!accept) && (typeof opts.ignore !== "undefined")) {
			if (!opts.ignore.test(req.url)) {
				fetch(opts.prefix+':'+req.url, function(err, obj) {
					if (obj) {
						req[opts.namespace] = obj;
					}
					next();
				})
			}
		}
	}

	function fetch(key, callback) {
		client.hgetall(key, function(err, obj) {
			callback(err, obj);
		});
	}
}
