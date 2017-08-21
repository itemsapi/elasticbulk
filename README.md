# Elastic Bulk

Add data in bulk to elasticsearch. It supports data streaming from PostgreSQL or Filesystem


## Start

```bash
npm install elasticbulk --save
```

```js
const elasticbulk = require('elasticbulk');
```

## Add JSON data to Elasticsearch

```js
// some data
var data = [];

elasticbulk.import(data, {
  index: 'movies',
  type: 'movies',
  host: 'localhost:9200'
})
.then(function(res) {
  console.log(res);
})
```

## Add data to Elasticsearch from JSON file

The `movies.json` is a comma delimited json file.

```js
var stream = fs.createReadStream('./movies.json')
.pipe(JSONStream.parse())

elasticbulk.import(stream, {
  index: 'movies',
  type: 'movies',
  host: 'localhost:9200',
})
.then(function(res) {
  console.log(res);
})
```

## Add data to Elasticsearch from PostgreSQL stream

```js
const Promise = require('bluebird');
const through2 = require('through2')
const db = require('knex')

var stream = db.select('*').from('movies')
.stream()
.pipe(through2({ objectMode: true, allowHalfOpen: false }, function (chunk, enc, cb) {
  cb(null, chunk)
}))

elasticbulk.import(stream, {
  index: 'movies',
  type: 'movies',
  host: 'localhost:9200',
})
.then(function(res) {
  console.log(res);
})
```

## Configuration

```js
elasticbulk.import(data, {
  index: 'movies',
  // optional
  type: 'movies',
  // batch size 
  limit: 500,
  host: 'localhost:9200',
}, {
  // mapping
  name: {
    type: 'string'
  }
})
.then(function(res) {
  console.log(res);
})
```
