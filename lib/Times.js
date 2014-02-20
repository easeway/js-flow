var Class = require('js-class'),
    Flow  = require('./Flow');


var State = Class({
    constructor: function (flow, args, done) {
        this.context = flow.context;
        this.times = parseInt(flow._times);
        if (isNaN(this.times) || this.times < 0) {
            this.times = 0;
        }
        flow._withResults && (this.results = []);

        this.args = args;
        this.done = done;

        this.running     = true;
        this.enumerated  = 0;
        this.completed   = 0;
        this.concurrency = flow._concurrency != null ? flow._concurrency : this.times;

        flow._errors && (this.errors = []);

        this.iterator = flow._action;
    },

    start: function () {
        if (this.times <= 0) {
            this._enumerationDone(null, []);
        } else {
            this._enumerate();
        }
    },

    _enumerate: function () {
        while (this.running && this.enumerated < this.times &&
               (this.enumerated - this.completed < this.concurrency)) {
            var n = this.enumerated ++;
            var args = this.args.slice();
            args.push(n);
            args.push(this._iterationDone(n));
            setImmediate((function (iterator, args, context) {
                return function () {
                    iterator.apply(context, args);
                };
            })(this.iterator, args, this.context));
        }
    },

    _iterationDone: function (n) {
        return function (err) {
            if (!this.running) {
                return;
            }

            var args = [].slice.call(arguments, 1);
            if (err === 'break') {
                err = null;
                this.running = false;
            } else if (err != null && !(err instanceof Error)) {
                args.unshift(err);
                err = null;
            }

            if (err) {
                this.errors ? (this.errors[n] = err) : (this.running = false);
            } else {
                this.results && (this.results[n] = args[0]);
            }
            if (++ this.completed >= this.times) {
                this.running = false;
            }

            this.running ? this._enumerate() : this._enumerationDone(err, args);
        }.bind(this);
    },

    _enumerationDone: function (err, args) {
        this.results && (args = [this.results]);
        args.unshift(this.errors && this.errors.length > 0 ? this.errors : err);
        this.done.apply(this.context, args);
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

    do: function (action) {
        this._action = this._fn(action);
        return this;
    },

    concurrent: function (limit) {
        if (limit >= 1) {
            this._concurrency = limit;
        } else {
            delete this._concurrency;
        }
        return this;
    },

    series: function () {
        return this.concurrent(1);
    },

    aggregateErrors: function (enabled) {
        this._errors = arguments.length == 0 || !!enabled;
        return this;
    },

    map: function (enabled) {
        this._withResults = arguments.length == 0 || !!enabled;
        return this;
    },

    _run: function (args, callback) {
        new State(this, args, callback).start();
    }
});

module.exports = Times;
