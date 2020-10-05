import _ from 'lodash';

import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import Double from '@mongoosejs/double';
import { toSlug } from '@azteam/ultilities';


function createSchema(colAttributes) {
    const decimals = _.reduce(colAttributes, (result, col, key) => {
        if (col.type && col.type.name === 'Decimal128') {
            colAttributes[key].get = (val) => parseInt(val);
            result.push(key);
        }
        return result;
    }, []);

    const schema = new Schema(colAttributes, {
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                decimals.map(key => {
                    ret[key] = parseInt(ret[key]);
                });
                return ret;
            }
        }
    });

    schema.plugin(mongoosePaginate);

    schema.pre('save', function(next) {

        if (this.constructor.name !== 'EmbeddedDocument') {

            this.beforeSave();

            const now = Math.floor(Date.now() / 1000);


            if (!this.forceCreate) {
                if (this.isNew) {
                    if (this.beforeCreate) {
                        this.beforeCreate();
                    }
                    this.created_at = now;
                }
                if (this.isModified() && !this.forceModify) {
                    if (this.beforeModify) {
                        this.beforeModify();
                    }
                    this.increment();
                    this.modified_at = now;
                }
                this.updated_at = now;
            }

        }
        next();
    });

    if (colAttributes.deleted_at) {
        schema.statics.softDelete = true;
    }


    schema.methods.loadData = function(data, guard = [], allows = []) {

        guard = [
            ...guard,
            '_id',
            '__v',
            'deleted_at',
            'updated_at',
            'created_at',
            'created_id',
            'modified_at',
            'modified_id',
            'status',
            'message'
        ];
        if (allows === '*') {
            guard = [];
        } else if (Array.isArray(allows)) {
            guard = _.difference(guard, allows);
        }


        for (const key in data) {
            if (_.isEmpty(guard) || !guard.includes(key)) {
                if (data[key] !== null && data[key] !== undefined) {
                    this[key] = data[key];
                }
            }
        }
        return this;
    }

    schema.virtual('id').get(function() {
        return this._id;
    });

    return schema;
}


export {
    createSchema
}

export const DataTypes = {
    DOUBLE: Double,
    ID: mongoose.Types.ObjectId,
    INTEGER: mongoose.Decimal128,
    OBJECT: mongoose.Mixed,
    STRING: String,
    NUMBER: Number,
    ARRAY: Array
}

export const DefaultAttributes = {
    SOFT_DELETE: {
        deleted_at: {
            type: DataTypes.NUMBER,
            default: 0
        }
    },
    META_DATA: {
        metadata_title: {
            type: DataTypes.STRING,
        },
        metadata_keywords: {
            type: DataTypes.STRING,
        },
        metadata_description: {
            type: DataTypes.STRING,
        },
        metadata_image_url: {
            type: DataTypes.STRING,
        },
        metadata_disable: {
            type: DataTypes.NUMBER,
            default: 0
        },
    },

    MODIFY: {
        message: {
            type: DataTypes.STRING,
        },
        updated_at: {
            type: DataTypes.NUMBER,
            default: 0
        },
        created_at: {
            type: DataTypes.NUMBER,
            default: 0
        },
        created_id: {
            type: DataTypes.ID,
        },
        modified_at: {
            type: DataTypes.NUMBER,
            default: 0
        },
        modified_id: {
            type: DataTypes.ID,
        },
    },
}


class Model {

    beforeSave() {
        if (!this.slug) {
            this.title && (this.slug = toSlug(this.title));
            this.name && (this.slug = toSlug(this.name));
        }
    }

    beforeCreate() {

    }

    beforeModify() {

    }

    static register(connection) {
        const prototypes = [
            ...Object.getOwnPropertyNames(Model.prototype),
            ...Object.getOwnPropertyNames(this.prototype),
        ];

        prototypes.map(method => {
            if (method !== 'constructor') {
                this.schema.methods[method] = this.prototype[method];
            }
        });

        this.connection = connection;

        return this.connection.model(this.name, this.schema, this.table_name);
    }
}

export default Model;