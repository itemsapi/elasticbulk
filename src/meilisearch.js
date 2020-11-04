const _ = require('lodash');
const Promise = require('bluebird');
const isStream = require('is-stream');
const MeiliSearch = require('meilisearch')

var client;

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

  if (!options.index_name) {
    return Promise.reject('Please define index name')
  }

  if (isStream(data)) {
    data.pause();
  }

  client = new MeiliSearch({
    host: options.host,
    apiKey: options.api_key
  })

  index = null;
  //index = client.getIndex(options.index_name);


  return Promise.resolve()
  .then(function(res) {
    return client.getOrCreateIndex(options.index_name, {
      primaryKey: 'id'
    }).then(res => {
      index = res;
      return client.getIndex(options.index_name).updateSettings(schema);
    })
  })
  .then(function(res) {

    if (isStream(data)) {
      return module.exports.addItemsStream(data, options)
    } else {

      return Promise.all(_.chunk(data))
      .map(v => {
        return module.exports.addBulkItems(v, options)
      }, {
        concurrency: 1
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

    console.log('stream')

    stream.on('data', function (item) {



      ++counter
      items.push(item)

      if (counter >= counter_limit) {
        stream.pause();

        console.log(items)

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

    stream.on('end', function (data) {

      if (!items.length) {
        return resolve()
      }

      return module.exports.addBulkItems(items, options)
      .then(function(res) {
        console.log('Last ' + added + ' series added!');
        return resolve()
      })
    })

    /*
     stream.on('close', function (data) {
      console.log('close');
      return resolve()
    })*/

    stream.on('error', function (err) {
      console.log('error');
      return reject(err)
    })

    /**
     * it waits until creating schema is not finished
     */
    stream.resume();
  })
}

module.exports.addBulkItems = function(items, options, schema) {

  var body = [];
  for (var i = 0 ; i < items.length ; ++i) {
    body.push(items[i]);
  }

  //console.log(body);

  return index.addDocuments(body)
  .then(v => {

    console.log(v);
    console.log('indexed');

    if (options.debug && v.errors) {
      console.log(JSON.stringify(v, null, 2));
    }
  })
}
