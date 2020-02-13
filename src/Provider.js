import {registerConnection} from './model';

class Provider {
    constructor(configs) {
        this.configs = configs;
        this.connections = {};
        this.model = {};
    }

    async bindingModel(model) {
        if (!this.model[model.name]) {
            const dbName = model.database_name;
            const connection = await this.getConnection(dbName);
            this.model[model.name] = model.register(connection);
        }
    }

    async getConnection(name) {
        if (!this.connections[name]) {
            this.connections[name] = await registerConnection(name, this.configs[name]);
        }
        return this.connections[name];
    }
}

export default Provider;