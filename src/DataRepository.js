import { ErrorException, NOT_INIT_METHOD, NOT_EXISTS } from '@azteam/error';
import { toSlug } from '@azteam/ultilities';

class DataRepository {
    constructor(model, fks = []) {
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
    find(options = {}) {
        const Model = this.getModel();
        return Model.find(options);
    }
    findOne(options = {}) {
        const Model = this.getModel();
        return Model.findOne(options);
    }
    findById(id) {
        const Model = this.getModel();
        return Model.findById(id);
    }
    findBySlug(slug) {
        return this.findOne({
            slug
        });
    }
    create(data, guard = [], user_id = null) {
        const Model = this.getModel();
        const item = new Model();
        if (user_id) {
            item.created_id = user_id;
            item.modified_id = user_id;
        }
        return this._save(item, data, guard);
    }

    createWithMeta(data = {}, guard = [], user_id = null) {
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


    createByUser(user_id, data = {}, guard = []) {
        return this.create(data, guard, user_id);
    }


    createWithMetaByUser(user_id, data = {}, guard = []) {
        this.createWithMeta(data, guard, user_id);
    }


    async modify(model_id, data, guard = [], user_id = null) {

        const item = await this.findById(model_id);
        if (item) {
            if (user_id) {
                item.modified_id = user_id;
            }
            return this._save(item, data, guard);
        }
        throw new ErrorException(NOT_EXISTS);
    }

    modifyByUser(user_id, model_id, data = {}, guard = []) {
        return this.modify(model_id, data, guard, user_id);
    }

    beforeLoadData(data) {

        if ((data.title || data.name) && !data.slug) {
            data.slug = toSlug(data.title);
        }

        return data;
    }


    hardDelete(model_id) {
        const Model = this.getModel();
        return Model.deleteOne({
            _id: model_id
        });

    }

    async _save(item, data, guard = []) {
        data = await this.beforeLoadData(data);
        item.loadData(data, guard);
        return await item.save();
    }
}
export default DataRepository;