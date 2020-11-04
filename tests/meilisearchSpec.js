'use strict';

const expect = require('expect');
const assert = require('assert');
const elasticbulk = require('./../lib');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const JSONStream = require('JSONStream')

//const HOST = 'https://sandbox-pool-bwysf2q-3bsbgmeayb75w.ovh-fr-2.platformsh.site';
//const API_KEY = 'FqsohPtJRjpbmLXkDScp';
const HOST = 'http://206.189.59.98';
const API_KEY = 'YmQzZGM2OWQ4YjBjMWJhNTRmOGZhYjkz';
const INDEX_NAME = 'bulk_test';
const TMP = './tmp.json';
const TEST_LIMIT = 1000;

const MeiliSearch = require('meilisearch')

const client = new MeiliSearch({
  host: HOST,
  apiKey: API_KEY,
})

const items = [{
  id: 1,
  name: 'movie1',
  tags: ['a', 'b', 'c', 'd'],
  actors: ['a', 'b']
}, {
  id: 2,
  name: 'movie2',
  tags: ['a', 'e', 'f'],
  actors: ['a', 'b']
}, {
  id: 3,
  name: 'movie3',
  tags: ['a', 'c'],
  actors: ['e']
}]

const config = {
  rankingRules: [
    'typo',
  ],
  distinctAttribute: 'id',
  searchableAttributes: [
    'name'
  ],
  displayedAttributes: [
    'name'
  ],
  stopWords: [
  ],
  synonyms: {
  }
}

describe('test bulk import', function() {

  beforeEach(async function() {

    var index;
    try {
      index = await client.getOrCreateIndex(INDEX_NAME)
    } catch (e) {
    }

    if (index) {
      await index.deleteIndex();
    }
  })

  it('makes bulk import with file streaming and mapping', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/list.json')
    .pipe(JSONStream.parse())

    await elasticbulk.import(stream, {
      chunk_size: 1000,
      engine: 'meilisearch',
      api_key: API_KEY,
      timeout: 5000,
      interval: 100,
      primary_key: 'id',
      index_name: INDEX_NAME,
      host: HOST,
    }, config)

    var result = await index.search()
    console.log(result);
    assert.equal(result.nbHits, 5);
  });

  it('makes bulk import with array', async function test() {

    await elasticbulk.import(items, {
      chunk_size: 100,
      engine: 'meilisearch',
      api_key: API_KEY,
      primary_key: 'id',
      timeout: 5000,
      index_name: INDEX_NAME,
      host: HOST,
    }, config)

    var result = await index.search()
    console.log(result);
    assert.equal(result.nbHits, 3);
  });

  it('makes bulk import with streaming', async function test() {

    var ws = fs.createWriteStream(TMP);
    var LIMIT = 1000;

    for (var i = 0 ; i < TEST_LIMIT ; ++i) {

      ws.write(JSON.stringify({
        id: i + 1,
        name: 'name',
        tags: ['tag1', 'tag2']
      }));
    }

    var stream = fs.createReadStream(TMP)
    .pipe(JSONStream.parse())

    await elasticbulk.import(stream, {
      chunk_size: 100,
      engine: 'meilisearch',
      api_key: API_KEY,
      primary_key: 'id',
      timeout: 15000,
      interval: 200,
      index_name: INDEX_NAME,
      host: HOST,
    }, config)

    //await Promise.delay(3000);
    var index = await client.getIndex(INDEX_NAME);
    var result = await index.search()
    console.log(result);
    assert.equal(result.nbHits, TEST_LIMIT);
  });

});
