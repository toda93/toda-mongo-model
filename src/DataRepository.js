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


    _getModel() {
        if (this._model) {
            return this._model;
        } else {
            throw new ErrorException(NOT_INIT_METHOD);
        }
    }

    async getAll(options = {}) {
        return await this._getModel().find(options);
    }

    async getOne(options = {}) {
        return this._getModel().findOne(options);
    }

    async getById(id){
        return this._getModel().findById(id);
    }

    async create(data, guard = []) {
        const Model = this._getModel();
        return new Model();
    }


    async beforeLoadData(data) {
        return data;
    }

}

export default DataRepository;
