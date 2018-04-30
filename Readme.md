# DB Helper

Db helper is a lightweight wrapper for common db actions that wraps around MongoDB and uses Redis for caching. Db helper is a project package by the [Suits & Sandals](https://suits-sandals.com/) team.

### Warning

Db helper is currently in beta and not suitable for production.

### Prerequisites

To begin, Dbhelper uses Redis & Mongo as a dependency. Make sure you have downloaded, installed, and running Redis in your environment.

```
brew install redis
```
Once installed run the following command:

```
redis-server
```

Db helper will also require you to install and run mongodb. For instructions on setting that up visit the MongoDb docs here: (https://docs.mongodb.com/manual/installation/)

### Installing

Now that Db helper's dependencies have been installed download and install the db helper npm package to your local project.

```
npm install dbhelper --save
```

This will install Db helper to your local project's modules.


## Usage

To use Db helper import it at the top of your file:

```
var Dbhelper = require('sas-dbhelper');
```
Then create a dbhelper object and pass in your Mongo connection url & database name like so:

```
var User = new Dbhelper('YOUR MONGO URL', 'YOUR DBNAME');
```
Db helper comes bundled with database query wrappers for Mongo and Redis. When Redis querying is turned on, db helper will use Redis as a cache: Querying Redis first for the data, and if it not present querying mongo for the data. If data is found in mongo, db helper will cache it to Redis for future requests.

Since Db helper is wrapped around the Mongo native driver for Node, many of the commands will be similar to Mongo native API with one exception: Db helper expects all commands to be passed with a callback to return the data to your app.

~~Because Db helper is a schema-less wrapper, you must be thoughtful of how you store data in Mongo and Redis to ensure consistent data.~~

Optional schema API available as of version 0.2.0

### Available Commands

The following commands are available to you: find, findOne, findOrCreate (no caching), create, updateOne, deleteOne, deleteMany (no caching)

To use caching for find, findOne, create, updateOne, & deleteOne commands you must pass in the options object with a key 'cache' set to 'true'. You will also need to name the key you'd like to [get]('https://redis.io/commands/get') or [set]('https://redis.io/commands/set') in case that the value does not yet exist in your Redis instance. You may also pass in other options in accordance to [Mongo Native's docs]('http://mongodb.github.io/node-mongodb-native/3.0/api/').

#### find

To run a find query using db helper WITHOUT caching use:

```
User.find(query = {email: "auniquemail@gmail.com", collection: "users"}, callback, options);

//Returns data as an object
```

To run a find query WITH caching use:

```
User.find(query = {email: "auniquemail@gmail.com", collection: "users"}, callback, options = {cache: true, key: "auniquemail@gmail.com"});

//Returns data as an object
```

#### findOne

To run a find query using db helper WITHOUT caching use:

```
User.findOne(query = {email: "auniquemail@gmail.com", collection: "users"}, callback, options);

//Returns data as an object
```

To run a find query WITH caching use:

```
User.findOne(query = {email: "auniquemail@gmail.com", collection: "users"}, callback, options = {cache: true, key: "auniquemail@gmail.com"});

//Returns data as an object
```

#### findOrCreate

This command will return two things: A boolean indicating whether or not your object was saved to the db & the object that was found/saved.

To run a find or create query using Db helper use:

```
User.findOrCreate({email: 'auniquemail@gmail.com', collection: 'user'}, callback, options)
```

The variable ```data```, in this example, is what we want to save to the database should the object not be found.

#### create

This command will return two things: A boolean indicating whether or not your object was saved to the db & the object that was saved.

To run a create query using Db helper use:

```
User.create({email: 'auniquemail@gmail.com', collection: 'user'}, callback, options)
```

NOTE: ```create``` now internally uses ```insertOne``` see [Mongo Native Docs]('http://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#insertOne') for more on optional usage instructions.

#### updateOne

To run an update query using db helper WITHOUT caching use:

```
User.updateOne(query = {email: "auniquemail@gmail.com", collection: "users"}, data = {email: "notauniqueemail@gmail.com"}, callback, options);

//Returns modified data as an object
```

To run a find query WITH caching use:

```
User.updateOne(query = {email: "auniquemail@gmail.com", collection: "users"}, data = {email: "notauniqueemail@gmail.com"}, callback, options = {cache: true, key: "auniquemail@gmail.com"});

//Returns modified data as an object
```

NOTE: ```updateOne``` now internally uses ```findOneAndUpdate``` see [Mongo Native Docs]('http://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndUpdate') for more on optional usage instructions.

#### deleteOne

To delete an object from your db WITHOUT caching use:

```
User.deleteOne(query = {email: "auniquemail@gmail.com", collection: "users"}, callback, options);
```

To delete an object from your db WITH caching use:

```
User.deleteOne(query = {email: "auniquemail@gmail.com", collection: "users"}, callback, options = {cache: true, key: "auniquemail@gmail.com"});
```

### Schemas

As of version 0.2.0 of Db helper, you are now free to define a schema object and have it enforced against any query that creates or updates. To define a schema first create an object like so:

```
let mySchemaObj = {
  email: 'string',
  password: {required: 'true', type: 'string'},
  phone: {type: 'number', default: '5515555555'}
}

```
Then pass your schema object to your declared Db helper object like so:

```
User.schema(mySchemaObj);
```

Now to enforce schema, pass an options object in whatever create or update query you're making like so:

```
User.updateOne(query = {email: "auniquemail@gmail.com", collection: "users"}, data = {email: "notauniqueemail@gmail.com"}, callback, options = {schema: true});
```

### Relationships

As of version 0.3.0 of Db helper you may now define a One-to-One relationship with Db helper using the ```via``` key when defining your schema, like so:

```
var mySchemaObj = {
  email: 'string',
  password: {required: 'true', type: 'string'},
  phone: {type: 'number', default: '5515555555'},
  createdBy: {default: '', via: 'user'}
}
```
The example above added the ```via``` flag to the key of createdBy. Now when an ObjectId as a string is passed to it, it will query your collection (as defined by the ```via``` key) and append the key with the result.

### Validate

Version 0.4.0 of Db helper exposes the internal function ```.validate(object)```. This function validates the object passed to it against your schema. It returns the validated object making modifications to any key that has a schema value object with a ```via``` key. It will also create a key if it is ```required``` and has a ```default``` value set in the schema but isn't present in the object being validated.
