'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const isStream = require('is-stream');
const ItemsAPI = require('itemsapi');


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

  if (isStream(data)) {
    data.pause();
  }

  var client = new ItemsAPI({
    host: options.host,
    api_key: options.api_key
  })

  //console.log(options.index_name)

  var index = client.getIndex(options.index_name);

  return Promise.resolve()
  .then(function(res) {

    if (schema) {
      return index.updateConfig(schema);
    }
  })
  .then(function(res) {

    if (isStream(data)) {
      return module.exports.addItemsStream(index, data, options)
    } else {

      return Promise.all(_.chunk(data, options.chunk_size))
      .map(items => {
        return module.exports.addBulkItems(index, items, options)
      }, {
        // itemsapi supports only 1
        concurrency: 1
      })
    }
  })
}

/**
 * import data by stream (file, json, psql, etc)
 */
module.exports.addItemsStream = function(index, stream, options) {


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

        return module.exports.addBulkItems(index, items, options)
        .then(function(res) {
          counter = 0;
          items = []
          console.log(added + ' series added!');
          added++
          stream.resume()
        })
      }
    })

    stream.on('end', function (data) {

      if (!items.length) {
        return resolve()
      }

      module.exports.addBulkItems(index, items, options)
      .then(function(res) {
        console.log('Last ' + added + ' series added!');
        return resolve()
      })
    })

    stream.on('close', function (data) {
      //console.log('close');
      return resolve()
    })

    stream.on('error', function (err) {
      //console.log('error');
      return reject(err)
    })

    /**
     * it waits until creating schema is not finished
     */
    stream.resume();
  })
}

module.exports.addBulkItems = function(index, items, options) {

  var body = [];
  for (var i = 0 ; i < items.length ; ++i) {
    body.push(items[i]);
  }

  return index.addItems(body)
  .then(v => {

    if (options.debug && v.errors) {
      console.log(JSON.stringify(v, null, 2));
    }
  })
}
