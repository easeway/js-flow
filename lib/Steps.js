var Class = require('js-class'),
    Each     = require('./Each'),
    Parallel = require('./Parallel');

var State = Class(Each.State, {
    constructor: function (flow, opts, done) {
        Each.State.prototype.constructor.apply(this, arguments);
        this.chain = flow._chain;
    },

    _collectResult: function (pair, args) {
        Each.State.prototype._collectResult.apply(this, arguments);
        this.chain && (this.args = args.slice());
    }
});

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
        return new State(this, opts, callback);
    }
}, {
    statics: {
        State: State
    }
});

module.exports = Steps;
