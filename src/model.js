import _ from 'lodash';
import sanitizeHtml from 'sanitize-html';
import { minify } from 'html-minifier';
import mongoose, { Schema } from 'mongoose';
import Double from '@mongoosejs/double';

import {
    ErrorException,
    EMAIL_FORMAT,
    INT_FORMAT,
    JSON_FORMAT,
    NOT_EMPTY,
    PHONE_NUMBER_FORMAT,
    SLUG_FORMAT
} from '@azteam/error';


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

        return this.connection.model(this.name, schema);
    }
}

export default Model;

export const DataTypes = {
    DOUBLE: Double,
    ID: mongoose.Schema.ObjectId,
    INTEGER: mongoose.Decimal128,
    STRING: String,
    NUMBER: Number,
};