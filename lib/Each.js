var Class = require('js-class'),
    Flow  = require('./Flow');

var State = Class({
    constructor: function (flow, opts, done) {
        this.context = flow.context;

        var items = opts.items || flow._items || [];
        this.items = items || [];
        this.keys  = Object.keys(items);
        this.reducing = opts.reducing;
        flow._reversed && this.keys.reverse();
        this.withIndex = flow._withIndex;
        if (this.reducing) {
            this.results = opts.reduceFrom;
        } else if (flow._withResults) {
            this.results = Array.isArray(this.items) ? [] : {};
        }

        this.chain = opts.chain;
        this.chain ? (this.prevResults = opts.args) : (this.args = opts.args);
        this.done = done;

        this.running     = true;
        this.enumerated  = 0;
        this.completed   = 0;
        this.concurrency = this.reducing ? 1 : (flow._concurrency != null ? flow._concurrency : this.keys.length);

        flow._errors && (this.errors = Array.isArray(this.items) ? [] : {});

        this.iterator = this.reducing ? flow._reducer : flow._action;
    },

    start: function () {
        if (this.keys.length <= 0) {
            this._enumerationDone(null, []);
        } else {
            this._enumerate();
        }
    },

    _enumerate: function () {
        while (this.running && this.enumerated < this.keys.length &&
               (this.enumerated - this.completed < this.concurrency)) {
            var key = this.keys[this.enumerated ++];
            var args = this.prevResults ? this.prevResults.slice() : this.args.slice();
            this.reducing && args.push(this.results);
            this.withIndex && args.push(key);
            args.push(this.items[key]);
            args.push(this._iterationDone(key));
            setImmediate((function (iterator, args, context) {
                return function () {
                    iterator.apply(context, args);
                };
            })(this.iterator, args, this.context));
        }
    },

    _iterationDone: function (key) {
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
                this.errors ? (this.errors[key] = err) : (this.running = false);
            } else if (this.reducing) {
                this.results = args[0];
            } else {
                this.results && (this.results[key] = args[0]);
                this.chain && (this.prevResults = args.slice());
            }
            if (++ this.completed >= this.keys.length) {
                this.running = false;
            }

            this.running ? this._enumerate() : this._enumerationDone(err, args);
        }.bind(this);
    },

    _enumerationDone: function (err, args) {
        (this.reducing || this.results) && (args = [this.results]);
        args.unshift(this.errors && this.errors.length > 0 ? this.errors : err);
        this.done.apply(this.context, args);
    }
});

var Each = Class(Flow, {
    constructor: function () {
        Flow.prototype.constructor.apply(this, arguments);
        this._withIndex = false;
    },

    in: function (items) {
        this._items = items;
        return this;
    },

    do: function (action) {
        this._action = this._fn(action, -2);
        return this;
    },

    map: function (action) {
        return this.do(action).withResults();
    },

    reduce: function (action, initialValue) {
        this._reducer = this._fn(action);
        this._reducer && this.withResults();
        this._reduceFrom = initialValue;
        return this;
    },

    some: function (action) {
        action = this._fn(action, -2);
        this._action = this._fn(function () {
            var next = arguments[arguments.length - 1];
            var item = arguments[arguments.length - 2];
            var args = [].slice.call(arguments);
            args[args.length - 1] = function (err, matched) {
                !err && matched ? next('break', true, item) : next(err, false);
            };
            action.apply(null, args);
        }, -2);
        return this;
    },

    every: function (action) {
        action = this._fn(action, -2);
        this._action = this._fn(function () {
            var next = arguments[arguments.length - 1];
            var item = arguments[arguments.length - 2];
            var args = [].slice.call(arguments);
            args[args.length - 1] = function (err, matched) {
                !err && !matched ? next('break', false, item) : next(err, true);
            };
            action.apply(null, args);
        }, -2);
        return this;
    },

    reverse: function () {
        this._reversed = true;
        return this;
    },

    withIndex: function (enabled) {
        this._withIndex = arguments.length == 0 || !!enabled;
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

    withResults: function (enabled) {
        this._withResults = arguments.length == 0 || !!enabled;
        return this;
    },

    _run: function (args, callback) {
        if (this._reducer && !this._action) {
            this._reduce(this._items, args, callback);
        } else if (this._reducer) {
            this._createState({ args: args }, function (err, results) {
                err ? callback.apply(this.context, arguments) : this._reduce(results, args, callback);
            }.bind(this)).start();
        } else {
            this._createState({ args: args }, callback).start();
        }
    },

    _reduce: function (items, args, callback) {
        this._createState({
            items: items,
            reducing: true,
            reduceFrom: this._reduceFrom,
            args: args
        }, callback).start();
    },

    _createState: function (opts, callback) {
        return new State(this, opts, callback);
    }
});

module.exports = Each;
