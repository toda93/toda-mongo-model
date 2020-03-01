import _ from 'lodash';

import mongoose, { Schema } from 'mongoose';
import Double from '@mongoosejs/double';
import {sanitize} from '@azteam/ultilities';

import {
    ErrorException,
    EMAIL_FORMAT,
    INT_FORMAT,
    JSON_FORMAT,
    NOT_EMPTY,
    PHONE_NUMBER_FORMAT,
    SLUG_FORMAT
} from '@azteam/error';



function convertToSchema(colAttributes) {
    const schema = new Schema(colAttributes);

    schema.pre('save', function(next) {
        const now = Math.floor(Date.now() / 1000);
        this.updated_at = now;
        if (this.isNew) {
            this.created_at = now;
        }
        if (this.isModified()) {
            this.increment();
            this.modified_at = now;
        }
        next();
    });

    schema.methods.refresh = function() {
        this.updated_at = Math.floor(Date.now() / 1000);
        this.save();
    }

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

export const DataTypes = {
    DOUBLE: Double,
    ID: mongoose.Schema.ObjectId,
    INTEGER: mongoose.Decimal128,
    OBJECT: mongoose.Mixed,
    STRING: String,
    NUMBER: Number,
    ARRAY: Array,
};