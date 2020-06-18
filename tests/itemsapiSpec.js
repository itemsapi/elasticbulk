'use strict';

const expect = require('expect');
const assert = require('assert');
const elasticbulk = require('./../lib');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const JSONStream = require('JSONStream')

const HOST = 'http://localhost:3005';
const TMP = './tmp.json';
const TEST_LIMIT = 1000;

const ItemsAPI = require('itemsapi');

const client = new ItemsAPI({
  host: HOST
})
const index = client.getIndex();

const items = [{
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

const config = {
  sorting_fields: ['votes'],
  aggregations: {
    city: {
      conjunction: true
    },
    tags: {
      conjunction: true
    }
  }
}

describe('test bulk import', function() {

  beforeEach(async function() {
    await index.reset();
  })

  it('makes bulk import with file streaming and mapping', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/list.json')
    .pipe(JSONStream.parse())


    await elasticbulk.import(stream, {
      chunk_size: 1000,
      engine: 'itemsapi',
      host: HOST,
    }, config)

    var result = await index.search({});
    assert.equal(result.pagination.total, 5);
  });

  it('makes bulk import with array', async function test() {

    await elasticbulk.import(items, {
      chunk_size: 100,
      engine: 'itemsapi',
      host: HOST,
    }, config)

    var result = await index.search({});
    assert.equal(result.pagination.total, 3);
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
      chunk_size: 100,
      engine: 'itemsapi',
      host: HOST,
    }, config)

    var result = await index.search({});
    assert.equal(result.pagination.total, TEST_LIMIT);
  });
});
