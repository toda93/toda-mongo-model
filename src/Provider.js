import _ from 'lodash';
import mongoose from 'mongoose';
import { ErrorException, NOT_INIT_METHOD } from '@azteam/error';

function registerConnection(name, config) {
    let url = `mongodb+srv://`;
    config.shard.map((item, key) => {
        if (key > 0) {
            url += ',';
        }
        url += `${item.host}:${item.port || 27017}`;
    });

    const options = {
        dbName: config.database,
        user: config.username,
        pass: config.password,
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        // serverSelectionTimeoutMS: 5000
    };
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

    closeAll() {
        _.map(this.connections, (connection) => {
            connection.close();
        });
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