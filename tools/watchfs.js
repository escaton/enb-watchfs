var Vow = require('vow'),
    inherit = require('inherit'),
    // path = require("path"),
    chokidar = require('chokidar'),
    builder = require('../../enb/lib/server/server-middleware').createBuilder(),
    moduleConfig = require('../../enb/lib/config/module-config');

var api = inherit(moduleConfig, {

    __constructor: function() {
        this.__base();
        this._builder = null;
        this._levels = [];
        this._rules = {};
        this._filesRegExp = /(?:\.)([.\w]+)$/;
        this._logger = null;
        this._queue = {};
    },


    addLevels: function(levels) {
        var _this = this;

        levels.forEach(function(item, index) {
            if (_this._levels.indexOf(item) === -1) {
                _this._levels.push(item);
            }
        });
        return this;
    },

    addRule: function(rule) {
        var _this = this,
            files = (rule.files && [].concat(rule.files)) || [],
            targets = (rule.targets && [].concat(rule.targets)) || [];

        files.forEach(function(item, index) {

            if (_this._rules[item] !== undefined) {
                _this._rules[item].targets.concat(targets);
            } else {
                _this._rules[item] = {targets: targets, buildingState: 'ready'};
            }
        });

    },

    _init: function(enbTask) {
        var _this = this;

        _this._logger = enbTask._logger;
        _this._builder = builder;
        return _this.exec();
    },

    _rebuildTarget: function(rule) {
        var _this = this;

        Vow.all(rule.targets.map(function(item) {
            // if (_this._queue[item] === 'ready') {
            //     _this._queue[item] = 'building';
                return _this._builder(item);
            // } else {
            //     _this._queue[item] = 'needRebuild';
            // }
        })).then(function() {
            // if (this._queue[] === 'needRebuild') {
            //     this._queue[] = 'building';
            //     _this._rebuildTarget(rule);
            // } else {
            //     this._queue[] = 'ready';
            // }
        }, function(err) {
            _this._logger.logErrorAction('Error',err);

        });
    },

    _handleChanges: function(path) {
        var file = this._filesRegExp.exec(path)[1];
        if (this._rules[file] !== undefined) {
            this._rebuildTarget(this._rules[file]);
        }
    },

    start: function(enbTask, config) {

        var promise = Vow.promise();
        var _this = this;

        this._init(enbTask).then(function() {

            enbTask.log('Start watch ' + _this._levels.join(', '));

            var watcher = chokidar.watch(_this._levels, {ignored: /^\./, persistent: true});

            watcher
                .on('add', function(path) {
                    _this._handleChanges(path);
                })
                .on('change', function(path) {
                    _this._handleChanges(path);
                })
                .on('unlink', function(path) {
                    _this._handleChanges(path);
                })
                .on('error', function(error) {
                    _this._logger.logErrorAction('Error happened', error);
                });
        });

        return promise;
    }
});

module.exports = function(config) {
    return config.registerModule('enb-watchfs', new api());
};
