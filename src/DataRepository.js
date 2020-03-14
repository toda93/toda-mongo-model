import _ from 'lodash';

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


    find(options = {}, paginate = {}) {
        const Model = this.getModel();
        if (_.isEmpty(paginate)) {
            if (options.sort) {
                const sort = options.sort;
                delete options.sort;

                return Model.find(options).sort(sort).limit(2000);
            }
            return Model.find(options).limit(2000);
        } else {
            return Model.paginate(options, paginate);
        }

    }
    findOne(options = {}) {
        const Model = this.getModel();
        return Model.findOne(options);
    }
    findOneById(id) {
        const Model = this.getModel();
        return Model.findById(id);
    }
    findOneBySlug(slug) {
        return this.findOne({
            slug
        });
    }


    async findOneOrCreate(options, data, guard = []) {
        let item = await this.findOne(options);
        if (!item) {
            item = await this.create(data, guard);
        }
        return item;
    }

    async findOneOrCreate(options, data, guard = []) {
        let item = await this.findOne(options);
        if (!item) {
            item = await this.create(data, guard);
        }
        return item;
    }


    create(data = {}, guard = [], user_id = null) {
        const Model = this.getModel();
        const item = new Model();
        if (user_id) {
            item.created_id = user_id;
            item.modified_id = user_id;
        }

        if (data.thumb && _.isString(data.thumb)) {
            data.thumb = JSON.parse(data.thumb);
        }

        if (!data.metadata_title) {
            data.title && (data.metadata_title = data.title);
            data.name && (data.metadata_title = data.name);
        }

        data.metadata_keywords = data.metadata_keywords ? data.metadata_keywords : data.metadata_title;
        data.metadata_description = data.metadata_description ? data.metadata_description : (data.text_intro ? data.text_intro : data.metadata_title);
        data.metadata_image_url = data.metadata_image_url ? data.metadata_image_url : (data.thumb && data.thumb.original ? data.thumb.original : '');


        return this._save(item, data, guard);
    }


    createByUser(user_id, data = {}, guard = []) {
        this.create(data, guard, user_id);
    }


    async modify(model_id, data, guard = [], user_id = null) {
        const item = await this.findOneById(model_id);
        if (item) {
            if (user_id) {
                item.modified_id = user_id;
            }

            if (data.thumb && _.isString(data.thumb)) {
                data.thumb = JSON.parse(data.thumb);
            }

            if (!data.metadata_title) {
                data.title && (data.metadata_title = data.title);
                data.name && (data.metadata_title = data.name);
            }

            data.metadata_keywords = data.metadata_keywords ? data.metadata_keywords : data.metadata_title;
            data.metadata_description = data.metadata_description ? data.metadata_description : (data.text_intro ? data.text_intro : data.metadata_title);
            data.metadata_image_url = data.metadata_image_url ? data.metadata_image_url : (data.thumb && data.thumb.original ? data.thumb.original : '');

            return this._save(item, data, guard);
        }
        throw new ErrorException(NOT_EXISTS);
    }

    modifyByUser(user_id, data = {}, guard = []) {
        this.modify(data, guard, user_id);
    }

    beforeLoadData(data) {

        if (!data.slug) {
            data.title && (data.slug = toSlug(data.title));
            data.name && (data.slug = toSlug(data.name));
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