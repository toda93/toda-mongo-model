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
        return new Model();
    }


    async beforeLoadData(data) {
        return data;
    }

}

export default DataRepository;
