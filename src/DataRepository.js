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

    _querySoftDelete(query, options, softDelete) {
        if (softDelete) {
            query.deleted_at = 0;
            if (options.force) {
                query.deleted_at = undefined;
            }
            if (options.trash) {
                query.deleted_at = {
                    $ne: 0
                };
            }
        }
        return query;
    }

    count(query, options = {}) {
        const Model = this.getModel();
        query = this._querySoftDelete(query, options, Model.softDelete);
        return Model.countDocuments(query);
    }
    countTrash(query = {}, options = {}) {
        return this.count(query, {
            ...options,
            trash: true
        });
    }

    find(query = {}, options = {}) {
        const Model = this.getModel();
        query = this._querySoftDelete(query, options, Model.softDelete);

        if (!options.sort) {
            options.sort = {
                modified_at: 'desc'
            }
        }

        if (options.forceDisableSort) {
            delete options.sort;
        }


        if (options.page) {
            return Model.paginate(query, options);

        } else {
            let queryBuilder = Model.find(query).sort(options.sort);

            const limit = options.limit && options.limit < 2000 ? options.limit : 2000;
            return queryBuilder.limit(limit);
        }
    }
    findTrash(query = {}, options = {}) {
        return this.find(query, {
            ...options,
            trash: true
        });
    }

    findActivated(query = {}, options = {}) {
        query.status = 1;
        return this.find(query, options);
    }
    findNear(geo = {}, query = {}, options = {}) {
        geo = {
            name: 'geo',
            coords: [],
            ...geo
        }

        if (geo.maxDistance) {
            query[geo.name] = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: geo.coords
                    },
                    $maxDistance: geo.maxDistance
                }
            }
        } else {
            query[geo.name] = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: geo.coords
                    },
                }
            }
        }

        return this.find(query, {
            ...options,
            forceCountFn: true,
            forceDisableSort: true,
        })
    }


    findOne(query = {}, options = {}) {
        const Model = this.getModel();
        query = this._querySoftDelete(query, options, Model.softDelete);
        return Model.findOne(query);
    }

    findOneActivated(query = {}, options = {}) {
        query.status = 1;
        return this.findOne(query, options);
    }

    findOneTrash(query = {}, options = {}) {
        return this.findOne(query, {
            ...options,
            trash: true
        });
    }

    findOneNear(geo = {}, query = {}, options = {}) {
        geo = {
            name: 'geo',
            coords: [],
            ...geo
        }

        if (geo.maxDistance) {
            query[geo.name] = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: geo.coords
                    },
                    $maxDistance: geo.maxDistance
                }
            }
        } else {
            query[geo.name] = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: geo.coords
                    },
                }
            }
        }

        return this.findOne(query, options)
    }


    findOneById(_id) {
        return this.findOne({
            _id
        });
    }

    findOneTrashById(_id) {
        return this.findOneTrash({
            _id
        });
    }

    findOneBySlug(slug) {
        return this.findOne({
            slug
        });
    }


    async findOneOrCreate(query, data, guard = [], allows = []) {
        let model = await this.findOne(query);
        if (!model) {
            model = await this.create(data, guard, allows);
        }
        return model;
    }


    create(data = {}, guard = [], allows = [], user_id = null) {
        const Model = this.getModel();
        const model = new Model();
        if (user_id) {
            model.created_id = user_id;
            model.modified_id = user_id;
        }
        return this._save(model, data, guard, allows);
    }

    createByUser(user_id, data = {}, guard = [], allows = []) {
        return this.create(data, guard, allows, user_id);
    }


    async modify(model, data, guard = [], allows = [], user_id = null) {
        if (user_id) {
            model.modified_id = user_id;
        }
        return this._save(model, data, guard, allows);
    }

    modifyByUser(user_id, model, data = {}, guard = [], allows = []) {
        return this.modify(model, data, guard, allows, user_id);
    }


    delete(model) {
        if (typeof model.deleted_at !== 'undefined') {
            return this._softDelete(model);
        }
        return this._hardDelete(model);
    }

    deleteByUser(user_id, model) {
        if (typeof model.deleted_at !== 'undefined') {
            return this._softDelete(model, user_id);
        }
        return this._hardDelete(model);
    }

    restoreByUser(restored_id, model) {
        model.deleted_at = 0;
        if (restored_id) {
            model.restored_id = restored_id;
        }
        model.save();
    }


    destroy(model) {
        return this._hardDelete(model);
    }

    _hardDelete(model) {
        const Model = this.getModel();
        return Model.deleteOne({
            _id: model._id
        });
    }

    _softDelete(model, deleted_id = '') {
        model.deleted_at = Math.floor(Date.now() / 1000);
        if (deleted_id) {
            model.deleted_id = deleted_id;
        }
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