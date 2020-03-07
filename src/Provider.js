import { ErrorException, NOT_INIT_METHOD } from '@azteam/error';
import mongoose from 'mongoose';

function registerConnection(name, config) {
    let url = `mongodb://`;
    config.shard.map((item, key) => {
        if (key > 0) {
            url += ',';
        }
        url += `${item.host}:${item.port}`;
    });

    const options = {
        dbName: config.database,
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        serverSelectionTimeoutMS: 5000
    };

    config.username && options.user = config.username;
    config.pass && options.user = config.password;


    try {
        return mongoose.createConnection(url, options);
    } catch (e) {
        conssole.log('error', e);
    }
}

class Provider {
    constructor(configs) {
        this.configs = configs;
        this.connections = {};
        this.model = {};
    }

    bindingModel(model) {
        if (!this.model[model.name]) {
            const dbName = model.database_name;
            const connection = this._getConnection(dbName);
            this.model[model.name] = model.register(connection);
        }
        return this.model[model.name];
    }

    _getConnection(name) {
        if (!this.connections[name]) {
            this.connections[name] = registerConnection(name, this.configs[name]);
        }
        return this.connections[name];
    }

}

export default Provider;