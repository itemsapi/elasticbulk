const _ = require('lodash');
const Promise = require('bluebird');
const JSONStream = require('JSONStream')
const fs = Promise.promisifyAll(require('fs'));
const isStream = require('is-stream');
const elasticsearch = require('elasticsearch');

var elastic;

/**
 * data is json array of objects or stream
 */
module.exports.import = function(data, options, schema) {

  options = options || {}
  options.concurrency = options.concurrency || 1
  options.type = options.type || options.index

  if (!options.host) {
    return Promise.reject('Please define host name')
  }

  if (!options.index) {
    return Promise.reject('Please provide index name')
  }

  elastic = new elasticsearch.Client({
    host: options.host,
    defer: function () {
      return Promise.defer();
    }
  });

  return Promise.resolve()
  .then(function(res) {

    if (schema) {

      return elastic.indices.create({
        index: options.index,
        body: {
          mappings: {
            [options.type]: {
              properties: schema
            }
          }
        }
      })
      return elastic.indices.putMapping({
        index: options.index,
        type: options.type,
        ignoreUnavailable: true,
        body: mapping
      })
      /*return elastic.indices.putMapping({
        index: options.index,
        type: options.type,
        ignoreUnavailable: true,
        body: mapping
      })*/
    }
  })
  .then(function(res) {

    if (isStream(data)) {
      return module.exports.addItemsStream(data, options)
    } else {

      return Promise.all(_.chunk(data))
      .map(v => {
        return module.exports.addBulkItems(v, options)
      }, {
        concurrency: options.concurrency
      })
    }
  })
}

/**
 * import data by stream (file, json, psql, etc)
 */
module.exports.addItemsStream = function(stream, options) {

  return new Promise(function(resolve, reject) {
    var counter = 0;
    var global_counter = 0;
    var items = [];
    var counter_limit = options.chunk_size || options.limit || 100
    var concurrency = 1
    var added = 1

    stream.on('data', function (item) {

      ++counter
      items.push(item)

      if (counter >= counter_limit) {
        stream.pause();

        return module.exports.addBulkItems(items, options)
        .then(function(res) {
          counter = 0;
          items = []
          console.log(added + ' series added!');
          added++
          stream.resume()
        })
      }
    })
    .on('end', function (data) {

      if (!items.length) {
        return resolve()
      }

      module.exports.addBulkItems(items, options)
      .then(function(res) {
        console.log('Last ' + added + ' series added!');
        return resolve()
      })
    })
    .on('close', function (data) {
      return resolve()
    })
    .on('error', function (err) {
      return reject(err)
    })
  })
}

module.exports.addBulkItems = function(items, options, schema) {

  var body = [];
  for (var i = 0 ; i < items.length ; ++i) {
    var o = { index: { _id: items[i] ? items[i]._id : undefined } };
    body.push(o);
    body.push(items[i]);
  }

  return elastic.bulk({
    index: options.index,
    type: options.type,
    //refresh: options.refresh || false,
    //consistency: 'one',
    body: body
  });
}
