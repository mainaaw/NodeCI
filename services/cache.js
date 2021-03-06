const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;


mongoose.Query.prototype.cache = function (options = {}) {

    this._cache = true;
    this.hashKey = JSON.stringify(options.key || '');

    return this;
};

mongoose.Query.prototype.exec = async function () {


    if(!this._cache) {
    return exec.apply(this,arguments);
    }

    //Define key for redis store
    const key = JSON.stringify(Object.assign({},this.getQuery(), {
     collection: this.mongooseCollection.name
        })
    );

    //See if we have key value in redis
    const cacheValue = await client.hget(this.hashKey,key);

    //If we do, return that

    if(cacheValue) {
        const doc = JSON.parse(cacheValue);

        //Parse depending on whether you get array or single doc
        return Array.isArray(doc)
            ? doc.map(d => new this.model(d))
            : new this.model(doc);
    }

    //Otherwise issue the query and store the result in redis
    const result = await exec.apply(this, arguments);

    client.hset(this.hashKey,key,JSON.stringify(result), 'EX', 10);
    return result;
};


module.exports = {
  clearHash(hashKey) {
      client.del(JSON.stringify(hashKey))

  }
};