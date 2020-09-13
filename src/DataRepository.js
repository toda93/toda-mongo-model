import _ from 'lodash';

import { ErrorException, NOT_INIT_METHOD, NOT_EXISTS } from '@azteam/error';

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


    count(query) {
        const Model = this.getModel();
        return Model.countDocuments(query);
    }

    find(query = {}, options = {}) {
        const Model = this.getModel();

        if (Model.softDelete && !options.force) {
            query.deleted_at = 0;
        }

        if (options.page) {
            return Model.paginate(query, options);

        } else {
            let queryBuilder = Model.find(query);
            if (!options.sort) {
                options.sort = {
                    modified_at: 'desc'
                }
            }
            queryBuilder = queryBuilder.sort(options.sort);

            const limit = options.limit && options.limit < 2000 ? options.limit : 2000;
            return queryBuilder.limit(limit);
        }
    }

    findOne(query = {}, options = {}) {
        const Model = this.getModel();
        if (Model.softDelete && !options.force) {
            query.deleted_at = 0;
        }
        return Model.findOne(query);
    }

    findOneById(_id, options = {}) {
        return this.findOne({
            _id
        });
    }

    findOneBySlug(slug) {
        return this.findOne({
            slug
        });
    }


    async findOneOrCreate(query, data, guard = []) {
        let model = await this.findOne(query);
        if (!model) {
            model = await this.create(data, guard);
        }
        return model;
    }


    create(data = {}, guard = [], allows = [], user_id = null) {
        const Model = this.getModel();
        const model = new Model();
        return this._save(model, data, guard, allows);
    }


    createByUser(user_id, data = {}, guard = [], allows = []) {
        const Model = this.getModel();
        const model = new Model();

        model.created_id = user_id;
        model.modified_id = user_id;

        return this._save(model, data, guard, allows);

    }


    async modify(model, data, guard = [], allows = [], user_id = null) {
        return this._save(model, data, guard, allows);
    }

    modifyByUser(user_id, model, data = {}, guard = [], allows = []) {
        model.modified_id = user_id;
        return this._save(model, data, guard, allows);
    }


    delete(model) {
        if (typeof model.deleted_at !== 'undefined') {
            return this._softDelete(model);
        }
        return this._hardDelete(model);
    }

    destroy(model) {
        return this._hardDelete(model);
    }

    restore(model) {
        model.deleted_at = 0;
        return model.save();
    }

    _hardDelete(model) {
        const Model = this.getModel();
        return Model.deleteOne({
            _id: model._id
        });
    }

    _softDelete(model) {
        model.deleted_at = Math.floor(Date.now() / 1000);
        model.save();
    }


    beforeLoadData(data) {
        return data;
    }


    async _save(model, data, guard = [], allows = []) {
        data = this.beforeLoadData(data);
        model.loadData(data, guard, allows);
        return await model.save();
    }
}

export default DataRepository;