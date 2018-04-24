var mongodb = require('mongodb');
var redis = require('redis'),
    client = redis.createClient();

const MongoClient = require('mongodb').MongoClient;

module.exports = class Dbhelper {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
  }

  schema (schemaObj) {
    this.schema = schemaObj;
  }

  validate (obj) {
    let schema = this.schema;
    let schemaKeys = Object.keys(schema);
    let objKeys = Object.keys(obj);

    schemaKeys.forEach(key => {// Validates optional rules
      if (schema[key].includes('{')) {
        let schemaKey = JSON.parse(schema[key])
        if (schemaKey.required && objKeys.indexOf(key) === -1) {
          throw new Error(`Schema validation error. Missing required key of '${key}'`);
        }

        if (schemaKey.default && (obj[key] == undefined || obj[key].length == 0)) {
          obj[key] = schemaKey.default;
        }
      }
    });

    objKeys.forEach(key => { //Validates data types
      if (this.schema[key] == undefined) {
        throw new Error(`Schema validation error. '${key}' not found in the Schema`);
      } else if (schema[key].includes('{')) {
        let schemaKey = JSON.parse(schema[key])
        return obj[key] !== schemaKey.type ? new Error(`Data type mismatch. Data for '${key}' is not a ${this.schema[key]}`): null;
      } else {
        return obj[key] !== schema[key] ? new Error(`Data type mismatch. Data for '${key}' is not a ${this.schema[key]}`): null;
      }
    });

  }

  find (query = {}, cb, options = {}) {

    let mongoQuery = (query, options, cb) => {
      let url = this.url;

      MongoClient.connect(url, (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

        collection.find(query, options).toArray(function (err, data) {
          if (err) throw err;

          cb(data);
        });
      });
    };

    let redisQuery = (query, options, cb) => {
      client.get(options.key, function (err, reply) {
        switch (true) {
          case err:
            throw err;
            break;
          case !reply:
            let key = options.key;
            mongoQuery(query, options, function (data) {
              let dataString = JSON.stringify(data);
              client.set(key, dataString, 'EX', 84600);
              cb(data);
            });
            break;
          default:
            cb(JSON.parse(reply));
        }
      });
    };

    if (Object.keys(options).length == 0 || options.cache == 0) {
      mongoQuery(query, options, function (payload) {
        cb(payload);
      });
    } else if (options.cache) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(query, options, function (payload) {
        cb(payload);
      });
    }
  }

  findOne (query, cb, options = {}) {

    let mongoQuery = (query, options, cb) => {
      let url = this.url;

      MongoClient.connect(url, (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        options ? ['cache', 'key'].forEach(key => delete options[key]) : options = {};

        collection.findOne(query, options, function (err, obj) {
          if (err) throw err;

          cb(obj);
        });
      });
    };

    let redisQuery = (query, options, cb) => {
      client.get(options.key, function (err, reply) {
        switch (true) {
          case err:
            throw err;
            break;
          case !reply:
            let key = options.key;

            mongoQuery(query, options, function (data) {
              let dataString = JSON.stringify(data);
              client.set(key, dataString, 'EX', 84600);
              cb(data);
            });
            break;
          default:
            cb(JSON.parse(reply));
        }
      });
    };

    if (Object.keys(options).length == 0 || options.cache == 0) {
      mongoQuery(query, options, function (payload) {
        cb(payload);
      });
    } else if (options.cache) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(query, options, function (payload) {
        cb(payload);
      });
    }
  }

  findOrCreate (query, data, cb, options = {}) {

    if (options.cache == undefined) {

      let url = this.url;
      MongoClient.connect(url, (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

        if (options.schema) {
          this.validate(data);
        }

        collection.findOne(query, options, function (err, obj) {

          if (err) throw err;

          if (obj == null) {
            collection.insertOne(data, options, function (err, obj) {
              if (err) throw err;

              cb(obj, true);
            })

          } else {
            cb(obj, false);
          }
        });
      });
    } else if (options.key) {
      client.get(options.key, function (err, data) {
        if (err) throw err;
        cb(data);
      });
    }
  }

  updateOne (query, data, cb, options = {}) {

    let mongoQuery = (query, data, options, cb) => {
      let url = this.url;

      MongoClient.connect(url, (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

        if (options.schema) {
          this.validate(data);
        }

        let filter = {};
        filter["$set"] = data;

        collection.updateOne(query, filter, options, function (err, obj) {
          if (err) throw err;

          obj == null ? cb(false) : cb(obj);
        });
      });
    };

    let redisQuery = (query, data, options, cb) => {
      client.get(options.key, function (err, reply) {
        switch (true) {
          case err:
            throw err;
            break;
          case !reply:
            let key = options.key;

            mongoQuery(query, data, options, function (data) {
              let dataString = JSON.stringify(data);
              client.set(key, dataString, 'EX', 84600);
              cb(data);
            });
            break;
          default:
            cb(JSON.parse(reply));
        }
      });
    };

    if (Object.keys(options).length == 0 || options.cache == 0) {
      mongoQuery(query, data, options, function (payload) {
        cb(payload);
      });
    } else if (options.cache) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(query, data, options, function (payload) {
        cb(payload);
      });
    }
  }

  deleteOne (query, cb, options = {}) {

    let mongoQuery = (query, options, cb) => {
      let url = this.url;

      MongoClient.connect(url, (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName)
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

        collection.deleteOne(query, function (err, obj) {
          if (err) throw err;

          obj == null ? cb(false) : cb(obj);
        });
      });
    };

    let redisQuery = (query, data, options, cb) => {
      let deletedObj = mongoQuery(query, data, options, cb);
      deletedObj ? (client.del(options.key), cb(true)) : cb(false);
    }

    if (Object.keys(options).length == 0 || options.cache == 0) {
      mongoQuery(query, options, function (payload) {
        cb(payload);
      });
    } else if (options.cache) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(query, options, function (payload) {
        cb(payload);
      });
    }
  }

  deleteAll (query, cb, options = {}) {

    let url = this.url;

    MongoClient.connect(url, (err, client) => {
      if (err) throw err;

      let dbName = this.dbName;
      let db = client.db(dbName);
      let collection = db.collection(query.collection);
      ['collection'].forEach(key => delete query[key]);
      ['cache', 'key'].forEach(key => delete options[key]);

      collection.deleteMany({}, options, function (err, obj) {
        if (err) throw err;

        cb(obj);
      });
    });
  }
}
