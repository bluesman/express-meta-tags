express-meta-tags
==================

This is a very simple meta tag manager for your ExpressJs app. The middleware uses redis to store and manage meta tag data for your webpages.

Install with:

	npm install express-meta-tags

## Features
* Bulk import meta tag data into redis from csv or url (think google doc spreadsheet)
* Meta tag data keyed by req.url and loaded on each request
* Use RegEx to control which urls should have meta tag data fetched
* Support for rel="canonical"

##Usage

## Put together a CSV with your meta tag data

	URL,CANONICAL,TITLE,DESCRIPTION
	/about-us,,"All About Us","A bunch of info about who we are"
	/,,"The Home Page","Description of the home page"
	/index,/,"",""

## Load your meta tag data into redis

	node bin/bulk-load.js -h redis.domain.com -p 6379 --prefix meta-tags meta-tags.csv
	
OR
	
	node bin/bulk-load.js -h redis.domain.com -p 6379 --prefix meta-tags "https://docs.google.com/spreadsheet/pub?key=0AlQen94blI0ddGZXVHBsdkswTlZLaXFMNFhUQlhJZHc&output=csv"
	
### Notes:

* Make sure you put any urls in quotes
* Your CSV must have a header row.  The header values will be uppercased before they are stored in redis.

## Add middleware in your app.js

```js

	app.use(require('express-meta-tags')({
		ignore: /^\/(images|js|css)/,
		prefix:'meta-tags',
		namespace:'meta',
		redis: {
			host: app.settings.redishost || 'localhost',
			port: app.settings.redisport || '6379',
			opts: {}
		}
	}));

	/* if you want it available in your view */
	app.use(function(req, res, next) {
		res.locals.meta = req.meta;
	});

```

##Use your meta tag data in your template

	- var title       = (typeof meta !== "undefined") ? meta.TITLE       : 'A default title';
	- var description = (typeof meta !== "undefined") ? meta.DESCRIPTION : 'A default description';
	- var canonical   = (typeof meta !== "undefined") ? meta.CANONICAL   : false;

	title #{title}
	meta(charset="utf-8")
	meta(name="description", content="#{description}")
	- if (canonical)
  		link(rel="canonical", href="#{canonical}")

##Options

###prefix

a string to prepend to the redis key.  The redis key looks like this: `<prefix>:<req.url>`. for example,

	meta-tags:/about-us

would act as the key for the meta data for the /about-us url

###namespace

a string which will be the key in the req obj.  Essentially, req[opts.namespace] = metaTagData.

###accept

a regular expression. If opts.accept.test(req.url) is true, meta tag data will be fetched using the key: `<prefix>:<req.url>`

###ignore

a regular expression. If opts.ignore.test(req.url) is true, meta tag data will `not` be fetched. If opts.accept is defined, opts.ignore will only be in effect if opts.accept.test(req.url) is false.


###redis

a js object containing the connection config for redis (uses: [node-redis](https://github.com/mranney/node_redis))

```js
	{
		host: <host>,
		port: <port>,
		opts: <node-redis opts>
	}
```

## Importing Data

You can get your meta data into redis using `bin/bulk-load.js`.

	Import a csv containing meta tag data for urls.

	Usage: node ./bulk-load.js <file|"url">

	*note: if using a url - be sure to put quotes around it.

	Options:
  	-p, --port    redis port                               [default: 6379]
  	-h, --host    redis host                               [default: "localhost"]
  	-a, --prefix  prefix redis key to namespace your data  [default: "meta-tag"]

