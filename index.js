var mongodb = require('mongodb');
var ObjectId = require('mongodb').ObjectId;
var redis = require('redis'),
    client = redis.createClient();

const MongoClient = require('mongodb').MongoClient;

module.exports = class Dbhelper {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
    this.schemaObj;
  }

  schema (schemaObj) {
    if (typeof schemaObj == 'object') {
      this.schemaObj = schemaObj;
    } else {
      throw new Error("Schema must be of type object.");
    }
  }

  async validate (obj) {
    let schema = this.schemaObj;
    let schemaKeys = Object.keys(schema);
    let objKeys = Object.keys(obj);

    objKeys.forEach(key => { //Validates data types
      if (schema[key] == undefined) {
        throw new Error(`Schema validation error. '${key}' not found in the Schema`);
      } else {
        if (typeof schema[key] == 'object'){
          if (typeof obj[key] !== schema[key].type) throw new Error(`Data type mismatch. Data for '${key}' is not a ${schema[key].type}`);
        } else {
          if (typeof obj[key] !== schema[key]) throw new Error(`Data type mismatch. Data for '${key}' is not a ${schema[key]}`);
        }
      }
    });

    for(let index = 0; index < schemaKeys.length; index++){// Validates optional rules
      let key = schemaKeys[index];

      if (schema[key].required && objKeys.indexOf(key) === -1) {
        if (schema[key].default || schema[key].default == '') {
          obj[key] = schema[key].default;
        } else {
          throw new Error(`Schema validation error. Missing required key of '${key}'`);
        }
      }

      if (schema[key].via) {
        let ObjectId = require('mongodb').ObjectId;
        let id = new ObjectId(obj[key]);
        let keyId = '_id';
        let filter = {collection: schema[key].via};
        filter[keyId] = id;

        await new Promise( (resolve, reject) =>  {
          this.findOne(filter, response => {
            resolve(response);
          })
        })
        .then( response => obj[key] = response)
      }
    }

    return obj;
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
        ['cache', 'key', 'schema'].forEach(key => delete options[key]);

        collection.find(query, options).toArray(function (err, data) {
          if (err) throw err;

          cb(data);
          client.close();
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

    if (options.cache == false || options.cache == undefined) {
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
        options ? ['cache', 'key', 'schema'].forEach(key => delete options[key]) : options = {};

        collection.findOne(query, options, function (err, obj) {
          if (err) throw err;

          cb(obj);
          client.close();
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

    if (options.cache == false || options.cache == undefined) {
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

  findOrCreate (data, cb, options = {}) {

    if (options.cache == undefined) {
      let url = this.url;

      MongoClient.connect(url, async (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(data.collection);
        ['collection'].forEach(key => delete data[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

        if (options.schema) {
          delete options.schema;
          await new Promise( (resolve, reject) => {
            resolve(this.validate(data));
          })
          .then( payload => data = payload)
        }

        collection.findOne(data, options, function (err, obj) {
          if (err) throw err;

          if (obj == null) {
            collection.insertOne(data, options, function (err, obj) {
              if (err) throw err;
              cb(obj, true);
              client.close();
            });
          } else {
            cb(obj, false);
            client.close();
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

  create (data, cb, options = {}) {

    let mongoQuery = (query, options, cb) => {
      let url = this.url;

      MongoClient.connect(url, async (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

        if (options.schema) {
          delete options.schema;
          await new Promise( (resolve, reject) => {
            resolve(this.validate(data));
          })
          .then( payload => data = payload)
        }

        collection.insertOne(data, options, function (err, obj) {
          if (err) throw err;

          cb(obj, true);
          client.close();
        });
      });
    };

    let redisQuery = (data, options, cb) => {
      client.get(options.key, function (err, reply) {
        switch (true) {
          case err:
            throw err;
            break;
          case !reply:
            let key = options.key;

            mongoQuery(data, options, function (data, wasCreated) {
              if (wasCreated){
                let dataString = JSON.stringify(data);
                client.set(key, dataString, 'EX', 84600);
                cb(data, true);
              }
            });
            break;
          default:
            cb(JSON.parse(reply), true);
        }
      });
    };

    if (Object.keys(options).length == 0 || options.cache == false) {
      mongoQuery(data, options, function (payload) {
        cb(payload, true);
      });
    } else if (options.cache) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(data, options, function (payload, wasCreated) {
        if (wasCreated) cb(payload, true);
      });
    }
  }

  updateOne (query, data, cb, options = {}) {

    let mongoQuery = (query, data, options, cb) => {
      let url = this.url;

      MongoClient.connect(url, async (err, client) => {
        if (err) throw err;

        let dbName = this.dbName;
        let db = client.db(dbName);
        let collection = db.collection(query.collection);
        ['collection'].forEach(key => delete query[key]);
        ['cache', 'key'].forEach(key => delete options[key]);

        if (options.schema) {
          delete options.schema;
          await new Promise( (resolve, reject) => {
            resolve(this.validate(data));
          })
          .then( payload => data = payload)
        }

        let filter = {};
        filter["$set"] = data;

        collection.findOneAndUpdate(query, filter, options, function (err, obj) {
          if (err) throw err;

          obj.value == null ? cb(obj, false) : cb(obj, true);
          client.close();
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
              cb(data, true);
            });
            break;
          default:
            cb(JSON.parse(reply), true);
        }
      });
    };

    if (options.cache == false || options.cache == undefined) {
      mongoQuery(query, data, options, function (payload, wasCreated) {
        wasCreated ? cb(payload, true): cb(payload, false);
      });
    } else if (options.cache) {
      if (!options.key) throw new Error("Cache key not present.");
      redisQuery(query, data, options, function (payload, wasCreated) {
        wasCreated ? cb(payload, true): cb(payload, false);
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
        ['cache', 'key', 'schema'].forEach(key => delete options[key]);

        collection.deleteOne(query, function (err, obj) {
          if (err) throw err;

          obj == null ? cb(false) : cb(obj);
          client.close();
        });
      });
    };

    let redisQuery = (query, data, options, cb) => {
      let deletedObj = mongoQuery(query, data, options, cb);
      deletedObj ? (client.del(options.key), cb(true)) : cb(false);
    }

    if (options.cache == false || options.cache == undefined ) {
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
      ['cache', 'key', 'schema'].forEach(key => delete options[key]);

      collection.deleteMany({}, options, function (err, obj) {
        if (err) throw err;

        cb(obj);
        client.close();
      });
    });
  }
}
