var Class = require('js-class'),
    Parallel = require('./Parallel');

var Steps = Class(Parallel, {
    constructor: function () {
        Parallel.prototype.constructor.apply(this, arguments);
        this.concurrent(1);
        delete this.concurrent;
    },

    chain: function (enabled) {
        this._chain = arguments.length == 0 || !!enabled;
        return this;
    },

    next: function () {
        return this.do.apply(this, arguments);
    },

    _createState: function (opts, callback) {
        opts.chain = this._chain;
        return Parallel.prototype._createState.call(this, opts, callback);
    }
});

module.exports = Steps;
