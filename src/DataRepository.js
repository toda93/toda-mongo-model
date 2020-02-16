import { ErrorException, NOT_INIT_METHOD, NOT_EXISTS } from '@azteam/error';

class DataRepository {
    constructor() {
        this._model = null;
        this._fks = [];
    }
    init(model, fks = []) {
        this._model = model;
        this._fks = fks;
    }
    getModel() {
        if (this._model) {
            return this._model;
        } else {
            throw new ErrorException(NOT_INIT_METHOD);
        }
    }
    async get(options = {}) {
        const Model = this.getModel();
        return Model.find(options);
    }
    async first(options = {}) {
        const Model = this.getModel();
        return Model.findOne(options);
    }
    async firstById(id) {
        const Model = this.getModel();
        return Model.findById(id);
    }
    async createByUser(user_id = null, data = {}, guard = []) {
        const Model = this.getModel();
        const item = new Model();
        if (user_id) {
            item.created_id = user_id;
            item.updated_id = user_id;
        }
        return this._save(item, data, guard);
    }
    async create(data, guard = []) {
        return this.createByUser(null, data, guard);
    }
    async updateByUser(user_id = null, model_id, data = {}, guard = []) {

        const item = this.firstById(model_id);
        if (item) {
            if (user_id) {
                item.updated_id = user_id;
            }
            return this._save(item, data, guard);
        }
        throw new ErrorException(NOT_EXISTS);
    }
    async update(data, guard = []) {
        return this.updateByUser(null, data, guard);
    }
    async beforeLoadData(data) {
        return data;
    }
    async _save(item, data, guard = []) {
        data = await this.beforeLoadData(data);
        item.loadData(data, guard);
        return await item.save();
    }
}
export default DataRepository;