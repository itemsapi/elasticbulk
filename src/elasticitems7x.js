'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const isStream = require('is-stream');
const elasticsearch = require('elasticsearch');

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

  if (isStream(data)) {
    data.pause();
  }

  var elastic = new elasticsearch.Client({
    host: options.host,
    defer: function () {
      var resolve, reject;
      var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
      });
      return {
        resolve: resolve,
        reject: reject,
        promise: promise
      };
    }
  });

  return Promise.resolve()
  .then(function(res) {

    if (schema) {

      return elastic.indices.create({
        index: options.index,
        body: schema
      })
    }
  })
  .then(function(res) {

    if (isStream(data)) {
      return module.exports.addItemsStream(elastic, data, options)
    } else {

      return Promise.all(_.chunk(data, options.chunk_size))
      .map(items => {
        return module.exports.addBulkItems(elastic, items, options)
      }, {
        concurrency: options.concurrency
      })
    }
  })
  .catch(function(res) {
    console.log(res);
  })
}

/**
 * import data by stream (file, json, psql, etc)
 */
module.exports.addItemsStream = function(elastic, stream, options) {


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

        return module.exports.addBulkItems(elastic, items, options)
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

      module.exports.addBulkItems(elastic, items, options)
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

module.exports.addBulkItems = function(elastic, items, options) {

  const body = items.flatMap(doc => [{
    index: {
      _index: options.index,
      _id: doc.id
    }
  }, doc])

  return elastic.bulk({
    index: options.index,
    body: body
  })
  .then(v => {

    if (options.debug && v.errors) {
      console.log(JSON.stringify(v, null, 2));
    }
  })
}
