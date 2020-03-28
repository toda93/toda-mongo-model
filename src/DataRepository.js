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


    find(query = {}, options = {}) {
        const Model = this.getModel();

        if (Model.softDelete && !options.force) {
            query.deleted_at = 0;
        }

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

    findOne(query = {}, options = {}) {

        const Model = this.getModel();

        if (Model.softDelete && !options.force) {
            query.deleted_at = 0;
        }

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
        let model = await this.findOne(query);
        if (!model) {
            model = await this.create(data, guard);
        }
        return model;
    }


    create(data = {}, guard = [], user_id = null) {
        const Model = this.getModel();
        const model = new Model();
        if (user_id) {
            model.created_id = user_id;
            model.modified_id = user_id;
        }
        return this._save(model, data, guard);
    }


    createByUser(user_id, data = {}, guard = []) {
        this.create(data, guard, user_id);
    }


    async modify(model, data, guard = [], user_id = null) {
        if (user_id) {
            model.modified_id = user_id;
        }
        return this._save(model, data, guard);
    }

    modifyByUser(model, data = {}, guard = []) {
        this.modify(data, guard, model);
    }



    deleteOne(model) {
        if (model.deleted_at) {
            return this._softDelete(model);
        }
        return this._hardDelete(model);
    }

    destroy(model) {
        return this._hardDelete(model);
    }

    restore(model) {
        model.deleted_at = 0;
        model.save();
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


    async _save(model, data, guard = []) {
        model.loadData(data, guard);
        return await model.save();
    }
}
export default DataRepository;