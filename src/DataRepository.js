import {ErrorException, NOT_INIT_METHOD} from '@azteam/error';

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

    async getAll(options = {}) {
        return await this.getModel().find(options);
    }

    async getOne(options = {}) {
        return this.getModel().findOne(options);
    }

    async getById(id){
        return this.getModel().findById(id);
    }

    async create(data, guard = []) {
        const Model = this.getModel();
        const item = new Model();
        return this._save(item, data, guard);
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
