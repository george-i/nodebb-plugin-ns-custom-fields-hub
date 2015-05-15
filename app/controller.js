(function (Controller) {
    'use strict';

    var async     = require('async'),
        util      = require('util'),
        keyMirror = require('keymirror'),

        settings  = require('./settings'),
        database  = require('./database'),
        constants = require('./constants'),

        Types     = keyMirror({
            input : null,
            select: null
        });

    Controller.createField = function (key, name, type, meta, done) {
        if (!Types[type]) {
            return done(new Error(util.format('%s is not supported', type)));
        }

        database.createField(key, name, type, filterMeta(meta, type, name), done);
    };

    Controller.getUserFields = function (uid, done) {
        async.parallel({
            fields: async.apply(database.getFields),
            data  : async.apply(database.getClientFields, uid)
        }, function (error, result) {
            if (error) {
                return done(error);
            }

            var customFields = [];

            if (result.data) {
                //Reduce to only populated fields
                var i = 0, len = result.fields.length, field;
                for (i; i < len; ++i) {
                    field = result.fields[i];
                    var value = result.data[field.key];
                    if (value) {
                        if (field.type == Types.select) {
                            customFields.push({
                                name : field.name,
                                value: getTextById(value, field.options)
                            });
                        } else {
                            customFields.push({
                                name : field.name,
                                value: value
                            });
                        }
                    }
                }
            }

            done(null, customFields);
        });
    };

    function filterMeta(meta, type, name) {
        var promptMessage = meta.prompt || name;
        var result = {
            prompt: promptMessage
        };

        switch (type) {
            case Types.select:
                //Shallow copy will be enough
                result.options = meta.options;
                break;
        }

        return result;
    }

    function getTextById(id, list) {
        var i = 0, len = list.length, item;
        for (i; i < len; ++i) {
            item = list[i];
            if (item.id == id) {
                return item.text;
            }
        }
    }

})(module.exports);