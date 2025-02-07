const _ = require('lodash');
const elasticsearch7x = require('./src/elasticitems7x');
const itemsapi = require('./src/itemsapi');

/**
 * data is json array of objects or stream
 */
module.exports.import = function(data, options, schema) {

  options = options || {}

  if (options.engine === 'itemsapi') {
    return itemsapi.import(data, options, schema);
  } else if (options.engine === 'elasticsearch7x') {
    return elasticsearch7x.import(data, options, schema);
  }
}
