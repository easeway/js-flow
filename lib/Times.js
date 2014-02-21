var Class = require('js-class'),
    Flow  = require('./Flow');

var State = Class(Flow.State, {
    constructor: function (flow, opts, done) {
        Flow.State.prototype.constructor.apply(this, arguments);
        this.times = parseInt(flow._times);
        if (isNaN(this.times) || this.times < 0) {
            this.times = 0;
        }
    },

    _count: function () {
        return this.times;
    },

    _item: function (n) {
        return { k: n, v: n };
    }
});

var Times = Class(Flow, {
    constructor: function () {
        Flow.prototype.constructor.apply(this, arguments);
    },

    times: function (times) {
        this._times = times;
        return this;
    },

    map: function (enabled) {
        return this.collect.apply(this, arguments);
    },

    _run: function (args, callback) {
        new State(this, { args: args }, callback).start();
    }
}, {
    statics: {
        State: State
    }
});

module.exports = Times;
