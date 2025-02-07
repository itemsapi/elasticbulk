'use strict';

const expect = require('expect');
const assert = require('assert');
const elasticbulk = require('./../lib');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const JSONStream = require('JSONStream')
const { Client } = require('@elastic/elasticsearch')

const INDEX = 'bulkimport-test';
const HOST = process.env.ES_URL || 'http://localhost:9200';
const TMP = './tmp.json';
const TEST_LIMIT = 1000;

const elastic = new Client({
  node: HOST
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
      await Promise.delay(1500)
    } catch(err) {
    }
  })

  it('makes bulk import with file streaming and mapping', async function test() {
    var stream = fs.createReadStream('./tests/fixtures/list.jsonl')
    .pipe(JSONStream.parse())

    var mapping = {
      mappings: {
        properties: {
          city: {
            type: 'keyword',
            index: true
          },
          tags: {
            type: 'keyword',
            index: true
          }
        }
      }
    }

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      engine: 'elasticsearch7x',
      chunk_size: 1,
      host: HOST,
      concurrency: 1,
    }, mapping)
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })

    assert.equal(res.body.count, 5);
  });

  it('makes bulk import with array and mapping', async function test() {

    var mapping = {
      mappings: {
        properties: {
          city: {
            type: 'keyword',
            index: true
          },
          tags: {
            type: 'keyword',
            index: true
          }
        }
      }
    }

    await elasticbulk.import(items, {
      index: INDEX,
      type: INDEX,
      engine: 'elasticsearch7x',
      chunk_size: 100,
      debug: true,
      host: HOST,
    }, mapping)
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })
    assert.equal(res.body.count, 3);
  });


  it('makes bulk import with array', async function test() {

    await elasticbulk.import(items, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      engine: 'elasticsearch7x',
      host: HOST,
    })
    await Promise.delay(1500)

    const res = await elastic.count({
      index: INDEX
    })

    assert.equal(res.body.count, 3);
  });





  it('makes bulk import with array and null\'s', async function test() {

    var null_items = [{
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }, {
      name: 'movie2',
      tags: ['a', 'e', 'f'],
      actors: ['a', 'b']
    }, null, {
      name: 'movie3',
      tags: ['a', 'c'],
      actors: ['e']
    }, {
      name: 'movie4',
      tags: ['a', 'c'],
      actors: ['e']
    }, null, null, undefined]

    await elasticbulk.import(null_items, {
      index: INDEX,
      type: INDEX,
      engine: 'elasticsearch7x',
      chunk_size: 100,
      host: HOST,
    })
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })

    assert.equal(res.body.count, 4);
  });

  it('makes bulk import with streaming', async function test() {
    this.timeout(10000);

    var ws = fs.createWriteStream(TMP);
    var LIMIT = 1000;

    for (var i = 0 ; i < TEST_LIMIT ; ++i) {
      ws.write(JSON.stringify({
        name: 'name',
        tags: ['tag1', 'tag2']
      }) + '\n');
    }
    ws.end();

    await new Promise(resolve => ws.on('finish', resolve));

    var stream = fs.createReadStream(TMP)
    .pipe(JSONStream.parse())

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      engine: 'elasticsearch7x',
      host: HOST,
      concurrency: 5,
      refresh: true
    })
    
    await Promise.delay(2000)

    var res = await elastic.count({
      index: INDEX,
      ignore_unavailable: true
    })
    
    assert.equal(res.body.count, TEST_LIMIT);
  });

  it('makes bulk import with file streaming', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/list.jsonl')
    .pipe(JSONStream.parse())

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 100,
      host: HOST,
      engine: 'elasticsearch7x',
      concurrency: 5,
    })
    .delay(1500)

    var res = await elastic.count({
      index: INDEX
    })
    assert.equal(res.body.count, 5);
  });

  it('makes bulk import with error handling', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/error.jsonl')
    .pipe(JSONStream.parse())

    var mapping = {
      mappings: {
        properties: {

          city: {
            type: 'keyword',
            index: true
          },
          rating: {
            type: 'keyword',
            index: true
          },
          tags: {
            type: 'keyword',
            index: true
          }
        }
      }
    }

    await elasticbulk.import(stream, {
      index: INDEX,
      type: INDEX,
      chunk_size: 1,
      engine: 'elasticsearch7x',
      host: HOST,
      concurrency: 1,
      debug: true
    }, mapping)
    .delay(1500)

    //var res = await elastic.count({
      //index: INDEX
    //})
    //assert.equal(res.count, 1);
  });

});
