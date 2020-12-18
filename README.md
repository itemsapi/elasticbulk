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

## Add data to ItemsAPI from JSON file

The `movies.json` is a comma delimited json file.

```js
const elasticbulk = require('elasticbulk');
const stream = fs.createReadStream('./movies.json')
.pipe(JSONStream.parse())

const config = {
  "sorting_fields": ["year", "rating", "votes", "reviews_count"],
  "aggregations": {
    "year": {
      "size": 10,
      "conjunction": true
    },
    "genres": {
      "size": 10,
      "conjunction": false
    },
    "tags": {
      "size": 10,
      "conjunction": true
    },
    "actors": {
      "size": 10,
      "conjunction": true
    },
    "country": {
      "size": 10,
      "conjunction": true
    }
  }
}

elasticbulk.import(stream, {
  engine: 'itemsapi',
  // api_key: '',
  index_name: 'movies',
  host: 'http://localhost:9200',
}, config)
.then(function(res) {
  console.log(res);
})
```

## Add data to Meilisearch from JSON file

The `movies.json` is a comma delimited json file.

```js
const elasticbulk = require('elasticbulk');
const stream = fs.createReadStream('./movies.json')
.pipe(JSONStream.parse())

const config = {
  rankingRules: [
    'typo',
  ],
  distinctAttribute: 'id',
  searchableAttributes: [
    'name'
  ],
  attributesForFaceting: [
    'director',
    'genres'
  ],
  displayedAttributes: [
    'name'
  ],
  stopWords: [
  ],
  synonyms: {
  }
}

elasticbulk.import(stream, {
  chunk_size: 1000,
  timeout: 6000,
  // intervalMs for check internal indexing status
  interval: 100,
  primary_key: 'id',
  engine: 'meilisearch',
  api_key: 'API_KEY',
  index_name: 'movies',
  host: 'http://localhost:9200',
}, config)
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
  debug: true,
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
# Test ES 1.7
docker run -it -d  -p 9200:9200 -p 9300:9300 -v $HOME/elasticsearch1.7/data:/data -v $HOME/elasticsearch1.7/logs:/logs barnybug/elasticsearch:1.7.2
mocha --exit -t 15000 tests/elasticitemsSpec.js

# Test ES 7.x
docker run -it -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.10.1
mocha --exit -t 15000 tests/elasticitems7xSpec.js
```
