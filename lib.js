const _ = require('lodash');
const Promise = require('bluebird');
//const isStream = require('is-stream');

const elasticsearch = require('./src/elasticitems');
const itemsapi = require('./src/itemsapi');
const meilisearch = require('./src/meilisearch');

/**
 * data is json array of objects or stream
 */
module.exports.import = function(data, options, schema) {

  options = options || {}

  if (options.engine === 'itemsapi') {
    return itemsapi.import(data, options, schema);
  } else if (options.engine === 'meilisearch') {
    return meilisearch.import(data, options, schema);
  } else {
    return elasticsearch.import(data, options, schema);
  }
}
