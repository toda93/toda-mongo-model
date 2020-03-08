import _ from 'lodash';

import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

import Double from '@mongoosejs/double';
import { sanitize } from '@azteam/ultilities';

import {
    ErrorException,
    EMAIL_FORMAT,
    INT_FORMAT,
    JSON_FORMAT,
    NOT_EMPTY,
    PHONE_NUMBER_FORMAT,
    SLUG_FORMAT
} from '@azteam/error';



export const DataTypes = {
    DOUBLE: Double,
    ID: mongoose.Schema.ObjectId,
    INTEGER: mongoose.Decimal128,
    OBJECT: mongoose.Mixed,
    STRING: String,
    NUMBER: Number,
    ARRAY: Array,
}

export const DefaultAttributes = {
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


function convertToSchema(colAttributes) {
    const schema = new Schema(colAttributes);

    schema.plugin(mongoosePaginate);

    schema.pre('save', function(next) {
        const now = Math.floor(Date.now() / 1000);
        if (this.isNew) {
            this.created_at = now;
        }
        if (this.isModified()) {
            this.increment();
            this.modified_at = now;
        }
        this.updated_at = now;
        next();
    });


    schema.methods.loadData = function(data, guard = []) {

        if (Array.isArray(guard)) {
            guard = [
                ...guard,
                '_id',
                '__v',
                'updated_at',
                'created_at',
                'created_id',
                'modified_at',
                'modified_id',
                'status',
                'message'
            ];
        } else {
            guard = [];
        }

        for (const key in data) {
            if (!guard.includes(key)) {
                this[key] = data[key];
            }
        }
        return this;
    }
    return schema;
}

class Model {
    static register(connection) {

        this.connection = connection;

        const schema = convertToSchema(this.col_attributes);

        return this.connection.model(this.name, schema, this.table_name);
    }
}

export default Model;