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


    find(query = {}, options = {}) {
        const Model = this.getModel();
        if (options.page) {
            return Model.paginate(query, options);

        } else {
            let queryBuilder = Model.find(query);
            if (options.sort) {
                queryBuilder = queryBuilder.sort(options.sort);
            }
            return queryBuilder.limit(2000);
        }

    }
    findOne(query = {}) {
        const Model = this.getModel();
        return Model.findOne(query);
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


    async findOneOrCreate(query, data, guard = []) {
        let item = await this.findOne(query);
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