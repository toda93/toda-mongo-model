import _ from 'lodash';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { minify } from 'html-minifier';
import mongoose, { Schema } from 'mongoose';
import MongooseDouble from 'mongoose-double';
import {
    ErrorException,
    EMAIL_FORMAT,
    INT_FORMAT,
    JSON_FORMAT,
    NOT_EMPTY,
    PHONE_NUMBER_FORMAT,
    SLUG_FORMAT
} from '@azteam/error';


import QueryBuilder from './QueryBuilder';

MongooseDouble(mongoose);

function sanitize(content) {
    content = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'span', 'h2', 'article']),
        allowedAttributes: {
            a: ['href', 'name', 'target', 'style'],
            img: ['src', 'alt', 'title', 'style'],
            iframe: ['src', 'style'],
            '*': ['style'],
        },
        allowedStyles: {
            '*': {
                // Match HEX and RGB
                'color': [/^\#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
                'text-align': [/^left$/, /^right$/, /^center$/],
                // Match any number with px, em, or %
                'font-size': [/^\d+(?:px|em|%)$/],
                'line-height': [/^.*$/],
                'font-style': [/^.*$/],
                'font-family': [/^.*$/],
                'font-weight': [/^bold$/],
            }
        },
        allowedIframeHostnames: ['www.youtube.com']
    });
    return minify(content.trim(), {
        collapseWhitespace: true
    });
}


function convertToSchema(colAttributes) {
    const schema = new Schema(colAttributes);

    schema.pre('save', function(next) {
        const now = Math.floor(Date.now() / 1000);
        if (this.isNew) {
            this.created_at = now;
        }
        if (this.isModified()) {
            this.increment();
            this.updated_at = now;
        }
        next();
    });

    schema.methods.loadData = function(data, guard = []) {

        guard = [
            ...guard,
            '_id',
            '__v',
            'created_at',
            'created_id',
            'updated_at',
            'updated_id',
            'status'
        ];

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

        return this.connection.model(this.name, schema);
    }


    static query(){
        return new QueryBuilder(this);
    }

}

export default Model;

export const DataTypes = {
    DOUBLE: mongoose.Schema.Types.Double,
    ID: mongoose.Schema.ObjectId,
    INTEGER: mongoose.Decimal128,
    STRING: String,
    NUMBER: Number,
};