# Elastic Bulk

Add data in bulk to ElasticSearch. It supports data streaming from PostgreSQL, MSSQL, MySQL, MariaDB, SQLite3, Filesystem and CSV

## Start

```bash
npm install elasticbulk --save
```

```js
const elasticbulk = require('elasticbulk');
```

## Add JSON data to Elasticsearch

```js
const elasticbulk = require('elasticbulk');
// some array data
var data = [];

elasticbulk.import(data, {
  index: 'movies',
  type: 'movies',
  host: 'http://localhost:9200'
})
.then(function(res) {
  console.log(res);
})
```

## Add data to Elasticsearch from JSON file

The `movies.json` is a comma delimited json file.

```js
const elasticbulk = require('elasticbulk');
const stream = fs.createReadStream('./movies.json')
.pipe(JSONStream.parse())

elasticbulk.import(stream, {
  index: 'movies',
  type: 'movies',
  host: 'http://localhost:9200',
})
.then(function(res) {
  console.log(res);
})
```

## Add data to Elasticsearch from CSV

You can also use ElasticBulk for importing data from CSV. It was tested for millions of records

```js
const fs = require('fs');
const csv = require('fast-csv');
const elasticbulk = require('elasticbulk');

var stream = fs.createReadStream('questions.csv')
.pipe(csv({
  headers: true
}))
.transform(function(data){
  // you can transform your data here
  return data;
})

elasticbulk.import(stream, {
  index: 'questions',
  type: 'questions',
  host: 'http://localhost:9200'
})
.then(function(res) {
  console.log(res);
})
```

## Add data to Elasticsearch from PostgreSQL

```js
const Promise = require('bluebird');
const through2 = require('through2');
const db = require('knex');
const elasticbulk = require('elasticbulk');

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

## Add data to Elasticsearch from MongoDB

```js
const elasticbulk = require('.elasticbulk');
const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.connect('mongodb://localhost/your_database_name', {
  useMongoClient: true
});

mongoose.Promise = Promise;

var Page = mongoose.model('Page', new mongoose.Schema({
  title: String,
  categories: Array
}), 'your_collection_name');

// stream query 
var stream = Page.find({
}, {title: 1, _id: 0, categories: 1}).limit(1500000).skip(0).batchSize(500).stream();

elasticbulk.import(stream, {
  index: 'my_index_name',
  type: 'my_type_name',
  host: 'localhost:9200',
}, {
  title: {
    type: 'string'
  },
  categories: {
    type: 'string',
    index: 'not_analyzed'
  }
})
.then(function(res) {
  console.log('Importing finished');
})
```


## Configuration

```js
elasticbulk.import(data, {
  index: 'movies',
  // optional
  type: 'movies',
  // batch size 
  chunk_size: 500,
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

## Tests

```bash
# It tests importing with your ES version. Don't tests on production environment
ES_URL=http://localhost:9200 mocha tests/indexSpec.js -t 100000
```
