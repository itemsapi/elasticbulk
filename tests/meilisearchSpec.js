'use strict';

const expect = require('expect');
const assert = require('assert');
const elasticbulk = require('./../lib');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const JSONStream = require('JSONStream')

const HOST = 'https://sandbox-pool-bwysf2q-3bsbgmeayb75w.ovh-fr-2.platformsh.site';
const INDEX_NAME = 'bulk_test';
const TMP = './tmp.json';
const TEST_LIMIT = 1000;
const API_KEY = 'FqsohPtJRjpbmLXkDScp';

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

    //index = await client.createIndex(INDEX_NAME, {
      //primaryKey: 'id'
    //})
  })

  it('makes bulk import with file streaming and mapping', async function test() {

    var stream = fs.createReadStream('./tests/fixtures/list.json')
    .pipe(JSONStream.parse())


    await elasticbulk.import(stream, {
      chunk_size: 1000,
      engine: 'meilisearch',
      api_key: API_KEY,
      index_name: INDEX_NAME,
      host: HOST,
    }, config)

    var result = await index.search('', {
    })
    console.log(result);

    console.log('wait');
    await Promise.delay(5000);

    var result = await index.search('movie1', {
    })
    console.log(result);

    //var result = await index.search('*')

    //console.log(result);
    //var result = await index.search({});
    //assert.equal(result.pagination.total, 5);
  });
});
