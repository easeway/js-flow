var Class = require('js-class'),
    Flow  = require('./Flow');

var State = Class({
    constructor: function (flow, opts, done) {
        this.context       = flow.context;
        this.errorsIgnored = flow._errorsIgnored;
        this.withKeys      = flow._withKeys;
        this._concurrency  = flow._concurrency;
        this._results      = flow._results;
        this._errors       = flow._errors;

        this.args = opts.args;
        this.done = done;

        this.iterator = flow._action;
    },

    start: function () {
        if (this._count() <= 0) {
            this._enumerationDone(null, []);
        } else {
            this._results && (this.results = this._initializeResultCollector());
            this._errors  && (this.errors = this._initializeErrorCollector());
            this.running     = true;
            this.enumerated  = 0;
            this.completed   = 0;
            this.concurrency = this._concurrency >= 0 ? this._concurrency : this._count();
            this._enumerate();
        }
    },

    _enumerate: function () {
        while (this.running && this.enumerated < this._count() &&
               (this.enumerated - this.completed < this.concurrency)) {
            var pair = this._item(this.enumerated ++);
            var args = this._iteratorArgs();
            this.withKeys && args.push(pair.k);
            args.push(pair.v);
            args.push(this._iterationDone(pair));
            setImmediate((function (iterator, args, context) {
                return function () {
                    iterator.apply(context, args);
                };
            })(this.iterator, args, this.context));
        }
    },

    _iterationDone: function (pair) {
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

            err && this.errorsIgnored && (err = null);
            if (err) {
                this.errors ? this._collectError(pair, err) : (this.running = false);
            } else {
                this._collectResult(pair, args);
            }

            if (++ this.completed >= this._count()) {
                this.running = false;
            }

            this.running ? this._enumerate() : this._enumerationDone(err, args);
        }.bind(this);
    },

    _enumerationDone: function (err, args) {
        args = this._doneArgs(args);
        args.unshift(this.errors && this.errors.length > 0 ? this.errors : err);
        this.done.apply(this.context, args);
    },

    _initializeErrorCollector: function () {
        return [];
    },

    _initializeResultCollector: function () {
        return [];
    },

    _collectError: function (pair, err) {
        this.errors[pair.k] = err;
    },

    _collectResult: function (pair, args) {
        this.results && (this.results[pair.k] = args[0]);
    },

    _iteratorArgs: function () {
        return this.args.slice();
    },

    _doneArgs: function (args) {
        this.results && (args = [this.results]);
        return args;
    }
});

var Enumeration = Class(Flow, {
    constructor: function () {
        Flow.prototype.constructor.apply(this, arguments);
    },

    ignoreErrors: function (ignored) {
        this._errorsIgnored = arguments.length == 0 || !!ignored;
        return this;
    },

    aggregateErrors: function (enabled) {
        this._errors = arguments.length == 0 || !!enabled;
        return this;
    },

    keys: function (enabled) {
        this._withKeys = arguments.length == 0 || !!enabled;
        return this;
    },

    collect: function (enabled) {
        this._results = arguments.length == 0 || !!enabled;
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
    }
}, {
    statics: {
        State: State
    }
});

module.exports = Enumeration;
