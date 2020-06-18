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

describe('test bulk import', function() {

  beforeEach(async function() {
    try {
      await elastic.indices.delete({
        index: INDEX
      })
      .delay(1500)
    } catch(err) {
    }
  })

  it('makes bulk import with file streaming and mapping', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/list.json')
    .pipe(JSONStream.parse())

    var mapping = {
      city: {
        type: 'string',
        index: 'not_analyzed'
      },
      tags: {
        type: 'string',
        index: 'not_analyzed'
      }
    }

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 1,
      host: HOST,
      concurrency: 1,
    }, mapping)
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })
    assert.equal(res.count, 5);
  });

  it('makes bulk import with array and mapping', async function test() {

    var mapping = {
      city: {
        type: 'string',
        index: 'not_analyzed'
      },
      tags: {
        type: 'string',
        index: 'not_analyzed'
      }
    }

    await elasticbulk.import(items, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      host: HOST,
    }, mapping)
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })

    assert.equal(res.count, 3);
  });


  it('makes bulk import with array', async function test() {

    await elasticbulk.import(items, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      host: HOST,
    })
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })

    assert.equal(res.count, 3);
  });

  it('makes bulk import with streaming', async function test() {

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

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      host: HOST,
      concurrency: 5,
    })
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })
    assert.equal(res.count, TEST_LIMIT);
  });

  it('makes bulk import with file streaming', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/list.json')
    .pipe(JSONStream.parse())

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      host: HOST,
      concurrency: 5,
    })
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })
    assert.equal(res.count, 5);
  });

  it('makes bulk import with error handling', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/error.json')
    .pipe(JSONStream.parse())

    var mapping = {
      city: {
        type: 'string',
        index: 'not_analyzed'
      },
      rating: {
        type: 'float',
        index: 'not_analyzed'
      },
      tags: {
        type: 'string',
        index: 'not_analyzed'
      }
    }

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 1,
      host: HOST,
      concurrency: 1,
      debug: true
    }, mapping)
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })
    //assert.equal(res.count, 2);
    assert.equal(res.count, 1);
  });

});
