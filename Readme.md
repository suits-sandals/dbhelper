


# DB Helper

Db helper is a lightweight wrapper for common db actions that wraps around MongoDB and Redis.


### Prerequisites

To begin, Dbhelper uses Redis & Mongo as a dependency. Make sure you have downloaded, installed, and running Redis in your environment.

```
brew install redis
```
Once installed run the following command:

```
redis-server
```

Db helper will also require you to install and run mongodb. For instructions on setting that up visit the MongoDb docs here: [https://docs.mongodb.com/manual/installation/]

### Installing

Now that db helper's dependencies have been installed download and install the db helper npm package to your local project.

```
npm install dbhelper --save
```

This will install Db helper to your local project's modules.


## Usage

To use Db helper import it at the top of your file:

```
require('Dbhelper');
```
Then create a dbhelper object and pass in your Mongo connection url & database name like so:

```
var dbhelper = new Dbhelpler('YOUR MONGO URL', 'YOUR DBNAME');
```
Db helper comes bundled with database query wrappers for Mongo and Redis. When Redis querying is turned on, db helper will use Redis as a cache: Querying Redis first for the data, and if it not present querying mongo for the data. If data is found in mongo, db helper will cache it to Redis for future requests.

Since, Db helper is wrapped around the Mongo native driver for node as such, many of the commands will be similar to Mongo native API with one exception: Db helper expects all commands to be passed with a callback to return the data to your app.

Because Db helper is a schema-less wrapper, you must be thoughtful of how you store data in Mongo and Redis to ensure consistent data.

### Available Commands

The following commands are available to you: find, findOne, findOrCreate (no caching), updateOne, deleteOne, deleteMany (no caching)

To use caching for find, findOne, updateOne, & deleteOne commands you must pass in the options object with cache set to 1 and the name of the key you'd like to get or set in case that the value does not yet exist with your Redis db. You may also pass in other options in accordance to Mongo Native's docs but they will only be executed in your for Mongo and not Redis.

#### find

To run a find query using db helper WITHOUT caching use:

```
dbhelper.find(query = {email: "auniquemail@gmail.com", collection: "users"}, options, callback);

//Returns data as an object
```

To run a find query WITH caching use:

```
dbhelper.find(query = {email: "auniquemail@gmail.com", collection: "users"}, options = {cache: 1, key: "auniquemail@gmail.com"}, callback);

//Returns data as an object
```

#### findOne

To run a find query using db helper WITHOUT caching use:

```
dbhelper.findOne(query = {email: "auniquemail@gmail.com", collection: "users"}, options, callback);

//Returns data as an object
```

To run a find query WITH caching use:

```
dbhelper.findOne(query = {email: "auniquemail@gmail.com", collection: "users"}, options = {cache: 1, key: "auniquemail@gmail.com"}, callback);

//Returns data as an object
```

#### updateOne

To run an update query using db helper WITHOUT caching use:

```
dbhelper.updateOne(query = {email: "auniquemail@gmail.com", collection: "users"}, data = {email: "notauniqueemail@gmail.com"}, options, callback);

//Returns modified data as an object
```

To run a find query WITH caching use:

```
dbhelper.updateOne(query = {email: "auniquemail@gmail.com", collection: "users"}, data = {email: "notauniqueemail@gmail.com"}, options = {cache: 1, key: "auniquemail@gmail.com"}, callback);

//Returns modified data as an object
```

#### deleteOne

To delete an object from your db WITHOUT caching use:

```
dbhelper.deleteOne(query = {email: "auniquemail@gmail.com", collection: "users"}, options, callback);
```

To delete an object from your db WITH caching use:

```
dbhelper.deleteOne(query = {email: "auniquemail@gmail.com", collection: "users"}z, options = {cache: 1, key: "auniquemail@gmail.com"}, callback);
```
