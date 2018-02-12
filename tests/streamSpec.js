'use strict';

const expect = require('expect');
const assert = require('assert');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const JSONStream = require('JSONStream')


describe('test streams', function() {

  it('load stream data', async function test() {

    var counter = 0;
    var stream = fs.createReadStream('./tests/fixtures/list.json')
    .pipe(JSONStream.parse())
    .on('data', function (item) {
      ++counter;
    })
    .on('end', function (data) {
      console.log('end 1');
      assert.equal(counter, 5);
    })

  });

  it('load stream data but wait before', async function test() {

    var counter = 0;
    var stream = fs.createReadStream('./tests/fixtures/list.json')
    .pipe(JSONStream.parse())

    stream.pause();

    await Promise.resolve()
    .delay(500)
    .then(r => {

      stream.on('data', function (item) {
        ++counter;
      })

      stream.on('end', function (data) {
        console.log('end');
        assert.equal(counter, 5);
      })

      stream.on('close', function (data) {
        console.log('close');
      })

      stream.on('error', function (err) {
        console.log('error');
      })

      stream.resume();
    })
  });
});
