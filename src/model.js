import _ from 'lodash';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { minify } from 'html-minifier';
import mongoose from 'mongoose';
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

const createCacheName = (prefix, options) => {
    if (_.isEmpty(options)) {
        return prefix;
    }
    return prefix + crypto.createHash('sha1').update(JSON.stringify(options)).digest('hex');
};


function registerConnection(name, config) {
    let url = `mongodb://${config.username}:${config.password}@`;
    config.shard.map((item, key) => {
        if (key > 0) {
            url += ',';
        }
        url += `${item.host}:${item.port}`;
    });
    url = `${url}/${config.database}`;
    return mongoose.createConnection(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    });
}


const DataTypes = {};

class Model {


    static createCacheName(prefix, options) {
        if (_.isEmpty(options)) {
            return prefix;
        }
        return prefix + crypto.createHash('sha1').update(JSON.stringify(options)).digest('hex');
    }

    static removeCache(database, name) {
        // this.cacheService.remove(`${database}_${name}_all_`);
        this.cacheService.remove(`${database}_${name}_`);
    }


    static register(connection, cacheService = null) {

        this.connection = connection;

        if (cacheService) {
            this.cacheService = cacheService;
            this.useCache = true;
        }
    }

}

export default Model;


export {
    DataTypes,
    registerConnection
}