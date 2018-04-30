/****
Filename: Find tests
Version: 1.0
Notes:
Todos:
****/

const assert = require('chai').assert;
var Dbhelper = require('../index.js');
var testDb = new Dbhelper('mongodb://localhost:27017', 'sas-dbhelper');

describe('Db Helper', function () {


  /****
  BLOCK 1: Query tests
  ****/


  it('"Create" creates an object in the database.', function() {
    return new Promise ( (resolve, reject) => {
      testDb.create({email: 'chris@gmail.com', password: 'tester1234', collection: 'testDB'}, (obj, wasCreated) => {
        assert.equal(wasCreated, true, 'wasCreated should equal true.');
        assert.typeOf(obj, 'object', 'Response data should be an object.');
        resolve();
      });
    })

  });

  it('"DeleteOne" deletes an object.', function (done) {
    testDb.deleteOne({email: 'chris@gmail.com', password: 'tester1234', collection: 'testDB'}, (obj) => {
      assert.notEqual(obj, false, "Response object should be true.");
      done();
    });
  });

  it('"FindOne" finds one object in the database.', function(done) {
    testDb.create({email: 'chris@gmail.com', password: 'tester1234', collection: 'testDB'}, (obj, wasCreated) => {
      assert.equal(wasCreated, true, 'wasCreated should equal true.');

      testDb.findOne({email: 'chris@gmail.com', password: 'tester1234', collection: 'testDB'}, (obj, wasCreated) => {
        assert.typeOf(obj, 'object', 'Response data should be an object.');
        assert.include(obj, {email: 'chris@gmail.com', password: 'tester1234'}, 'Response object should include keys "email" and "password"');
        done();
      });
    });
  });

  it('"Find" find all objects in the database that match.', function(done) {
    testDb.find({email: 'chris@gmail.com', collection: 'testDB'}, (array, wasCreated) => {
      assert.typeOf(array, 'array', 'Response data should be an array of objects.');
      assert.include(array[0], {email: 'chris@gmail.com', password: 'tester1234'}, 'Response array should include an object with keys "email" and "password"');
      done();
    });
  });

  it('"findOrCreate" finds an object found in the db.', function (done) {
    testDb.findOrCreate({email: 'chris@gmail.com', password: "tester1234", collection: 'testDB'}, (obj, wasCreated) => {
      assert.equal(wasCreated, false)
      assert.typeOf(obj, 'object', 'Response data should be an object.');
      assert.include(obj, {email: 'chris@gmail.com', password: 'tester1234'}, 'Response object should include keys "email" and "password"');
      done();
    });
  });

  it('"findOrCreate" creates an object.', function (done) {
    testDb.findOrCreate({email: 'chris@gmail.com', password: 'tester123', collection: 'testDB'}, (obj, wasCreated) => {
      assert.equal(wasCreated, true)
      assert.typeOf(obj, 'object', 'Response data should be an object.');
      done();
    });
  });

  it('"Update" updates an object.', function (done) {
    testDb.updateOne({email: 'chris@gmail.com', password: 'tester1234', collection: 'testDB'}, {email: 'chris@gmail.com', password: 'tester12345'}, (obj, wasUpdated) => {
      assert.equal(wasUpdated, true);
      assert.typeOf(obj, 'object', 'Response data should be an object.');
      done();
    });
  });


  /****
  BLOCK 2: .validate tests
  ****/


  it('"Validate" validates an object against a schema.', function () {

    testDb.schema({
      email: {type: 'string'},
      password: {type: 'string'}
    });

    return new Promise( (resolve, reject) => {
      resolve(testDb.validate({email: 'chris@gmail.com', password: 'tester1234'}));
    })
    .then( obj => {
      assert.typeOf(obj, 'object');
    })
  });

  it('"Validate" returns an error when required field isn\'t supplied.', function (done) {
    testDb.schema({
      email: {type: 'string'},
      password: {type: 'string', required: true}
    })

    testDb.validate({email: 'chris@gmail.com'})
    .catch(err => {
      assert.typeOf(err, 'error');
      done();
    })

  });

  it('"Validate" sets password to default value if required is set to true.', function () {

    testDb.schema({
      email: {type: 'string'},
      password: {type: 'string', required: true, default: "tester1234"}
    })

    return new Promise( (resolve, reject) => {
      resolve(testDb.validate({email: 'chris@gmail.com'}));
    })
    .then( obj => {
      assert.typeOf(obj, 'object');
      assert.equal(obj.password, 'tester1234');
    })
  });

  it('"Validate" returns type error when value type does not match the one set in schema.', function (done) {
    testDb.validate({email: 'chris@gmail.com', password: 12345})
    .catch(err => {
      assert.typeOf(err, 'error');
      done();
    })

  });


  /****
  BLOCK 3: Clean collection tests
  ****/


  it('Cleans test collection.', function () {
    return new Promise( (resolve, reject) => {
      testDb.deleteOne({email: 'chris@gmail.com', password: 'tester12345', collection: 'testDB'}, (obj) => {
        assert.notEqual(obj, true, "Response object should be true.");
        resolve(obj);
      });
    })
    .then( () => {
      testDb.deleteOne({email: 'chris@gmail.com', password: 'tester123', collection: 'testDB'}, (obj) => {
        assert.notEqual(obj, false, "Response object should be true.");
      });
    })
  });

});
