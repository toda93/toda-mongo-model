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
        user: config.username,
        pass: config.password,
        useNewUrlParser: true,
        useCreateIndex: true,
        options.useUnifiedTopology: true;
    };

    if (config.shard.length === 1) {
        options.socketOptions = {
            autoReconnect: true
        };
        options.useUnifiedTopology = false;
    }
    return mongoose.createConnection(url, options);
}

class Provider {
    constructor(configs) {
        this.configs = configs;
        this.connections = {};
        this.model = {};
    }

    async bindingModel(model) {
        if (!this.model[model.name]) {
            const dbName = model.database_name;
            const connection = await this._getConnection(dbName);
            this.model[model.name] = model.register(connection);
        }
        return this.model[model.name];
    }

    async _getConnection(name) {
        if (!this.connections[name]) {
            this.connections[name] = await registerConnection(name, this.configs[name]);
        }
        return this.connections[name];
    }

}

export default Provider;