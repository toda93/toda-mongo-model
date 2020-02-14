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
        return await this.getModel().get(options);
    }
    async getOne(options = {}) {
        return this.getModel().first(options);
    }

    async getOneBy(key, value) {
        return this.getModel().firstByAttr(key, value);
    }
    async getOneBySlugOrKey(value) {
        return this.getOne({
            where: {
                $or: [
                    { slug: value },
                    { key: value }
                ]
            }
        });
    }

    async create(data, guard = []) {
        const item = new this.getModel()();
        return this._save(item, data, guard);
    }
    async createWithMetadata(data, guard = []) {
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
        return this.create(data, guard);
    }

    async update(id, data, guard = []) {
        const item = await this.getOneBy('id', id);
        return this._save(item, data, guard);
    }
    async updateAll(data, options) {
        return this.getModel().update(data, options);
    }

    async addUnique(attr, data) {
        let item = await this.getModel().firstByAttr(attr, data[attr]);
        if (item) {
            return this.update(item.id, data);
        } else {
            return this.create(data);
        }
    }

    async delete(id, force = false) {
        const item = await this.getOneBy('id', id);
        if (item) {
            if (!force) {
                for (let i = 0; i < this.fks.length; ++i) {
                    const fk = this.fks[i];
                    const model = models[fk.model];
                    const count = await model.count({
                        where: {
                            [fk.foreignKey]: id
                        }
                    });
                    if (count > 0) {
                        throw new ErrorException(EXISTS_ITEMS);
                    }
                }
            }
            return await item.destroy();
        }
        return null;

    }

    async getTotalItem(options = {}) {
        return this.getModel().count(options);
    }

    async runTransaction(callback) {
        return this.getModel().runTransaction(callback);
    }
    async beforeLoadData(data) {
        return data;
    }
    async _save(item, data, guard = []) {
        data = await this.beforeLoadData(data);
        item.loadData(data, [
            'created_at',
            'updated_at',
            '_transaction',
            ...guard
        ]);
        if (data._transaction) {
            return await item.save({ transaction: data._transaction });
        }
        return await item.save();
    }

}

export default DataRepository;