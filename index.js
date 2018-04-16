var mongodb = require('mongodb');
var redis = require('redis'),
    client = redis.createClient();

const MongoClient = require('mongodb').MongoClient;

module.exports = class Dbhelper {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
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
    } else if (options.cache == 1) {
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
    } else if (options.cache == 1) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(query, options, function (payload) {
        cb(payload);
      });
    }
  }

  findOrCreate (query, data, cb, options = {}) {

    if (Object.keys(options).length == 0 || options.cache == 0) {
      let url = this.url;

      MongoClient.connect(url, (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

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
        let filter = {};
        filter["$set"] = data;

        collection.updateOne(query, options, filter, function (err, obj) {
          if (err) throw err;

          obj == null ? cb(false) : cb(obj);
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
    } else if (options.cache == 1) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(query, options, function (payload) {
        cb(payload);
      });
    }
  }

  deleteOne (query, cb = null, options = {}) {

    let mongoQuery = (query, data, options, cb) => {
      let url = this.url;

      MongoClient.connect(url, (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName)
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);
        let filter = {};
        filter["$set"] = data;

        collection.updateOne(query, options, filter, function (err, obj) {
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
    } else if (options.cache == 1) {
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
