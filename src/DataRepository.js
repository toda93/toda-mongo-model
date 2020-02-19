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


    async create(data, guard = [], user_id = null) {
        const Model = this.getModel();
        const item = new Model();
        if (user_id) {
            item.created_id = user_id;
            item.modified_id = user_id;
        }
        return this._save(item, data, guard);
    }

    async createWithMeta(data = {}, guard = [], user_id = null) {
        if (data.images && _.isString(data.images)) {
            data.images = JSON.parse(data.images);
            data.thumb = data.images.thumb;
        }
        if (data.thumb && _.isString(data.thumb)) {
            data.thumb = JSON.parse(data.thumb);
        }
        data.metadata_title = data.metadata_title ? data.metadata_title : data.title;
        data.metadata_keywords = data.metadata_keywords ? data.metadata_keywords : data.title;
        data.metadata_description = data.metadata_description ? data.metadata_description : (data.text_intro ? data.text_intro : data.title);
        data.metadata_image_url = data.metadata_image_url ? data.metadata_image_url : (data.thumb && data.thumb.original ? data.thumb.original : '');
        return this.create(data, guard, user_id);
    }


    async createByUser(user_id, data = {}, guard = []) {
        return this.create(data, guard, user_id);
    }


    async createWithMetaByUser(user_id, data = {}, guard = []) {
        this.createWithMeta(data, guard, user_id);
    }


    async modify(model_id, data, guard = [], user_id = null) {

        const item = await this.firstById(model_id);
        if (item) {
            if (user_id) {
                item.modified_id = user_id;
            }
            return this._save(item, data, guard);
        }
        throw new ErrorException(NOT_EXISTS);
    }

    async modifyByUser(user_id, model_id, data = {}, guard = []) {
        return this.modify(model_id, data, guard, user_id);
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