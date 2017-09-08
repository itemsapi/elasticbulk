'use strict';

const expect = require('expect');
const assert = require('assert');
const elasticbulk = require('./../lib');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const JSONStream = require('JSONStream')

const INDEX = 'bulkimport-test';
const HOST = process.env.ES_URL || 'http://localhost:9200';
const TMP = './tmp.json';
const TEST_LIMIT = 1000;


const elasticsearch = require('elasticsearch');
const elastic = new elasticsearch.Client({
  host: HOST,
  defer: function () {
    return Promise.defer();
  }
});


describe('test bulk import', function() {

  var items = [{
    name: 'movie1',
    tags: ['a', 'b', 'c', 'd'],
    actors: ['a', 'b']
  }, {
    name: 'movie2',
    tags: ['a', 'e', 'f'],
    actors: ['a', 'b']
  }, {
    name: 'movie3',
    tags: ['a', 'c'],
    actors: ['e']
  }]

  beforeEach(done => {

    elastic.indices.delete({
      index: INDEX
    })
    .then(function(res) {
      done();
    })
    .catch(function(res) {
      // index missing
      done();
    })
  })

  it('makes bulk import with array', function test(done) {

    elasticbulk.import(items, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      host: HOST,
    })
    .delay(1500)
    .then(function(res) {

      return elastic.count({
        index: INDEX
      })
    })
    .then(function(res) {
      assert.equal(res.count, 3);
      done();
    })
  });

  it('makes bulk import with streaming', function test(done) {

    var ws = fs.createWriteStream(TMP);
    var LIMIT = 1000;

    for (var i = 0 ; i < TEST_LIMIT ; ++i) {

      ws.write(JSON.stringify({
        name: 'name',
        tags: ['tag1', 'tag2']
      }));
    }

    var stream = fs.createReadStream(TMP)
    .pipe(JSONStream.parse())

    elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      host: HOST,
      concurrency: 5,
    })
    .delay(1500)
    .then(function(res) {

      return elastic.count({
        index: INDEX
      })
    })
    .then(function(res) {
      assert.equal(res.count, TEST_LIMIT);
      done();
    })
  });
});
