var Vow = require('vow'),
    Path = require("path"),
    chokidar = require('chokidar');

var api = {

    _levels: [],

    addLevels: function(levels) {
        var _this = this;

        levels.forEach(function(item, index) {
            if (_this._levels.indexOf(item) === -1) {
                _this._levels.push(item);
            }
        })
    },

    start: function(enbTask) {

        // var promise = Vow.promise();
        var _this = this;

        this.exec().then(function() {

            console.log('Start watch ' + _this._levels.join(', '));

            var watcher = chokidar.watch(_this._levels, {ignored: /^\./, persistent: true});

            watcher
              .on('add', function(path) {console.log('File', path, 'has been added');})
              .on('change', function(path) {console.log('File', path, 'has been changed');})
        })


        // return promise;
    }
}

module.exports = function(config) {
    return config.registerModule('enb-watchfs', api);
}
