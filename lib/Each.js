var Class = require('js-class'),
    Enumeration = require('./Enumeration');

var State = Class(Enumeration.State, {
    constructor: function (flow, opts, done) {
        Enumeration.State.prototype.constructor.apply(this, arguments);

        this.items = opts.items || [];
        this.keys  = Object.keys(this.items);
        flow._reversed && this.keys.reverse();
        this.reducing = opts.reducing;
        if (this.reducing) {
            delete this._results;
            this.results = opts.reduceFrom;
            this._concurrency = 1;
            this.iterator = flow._reducer;
        }
    },

    _count: function () {
        return this.keys.length;
    },

    _item: function (n) {
        return { k: this.keys[n], v: this.items[this.keys[n]] };
    },

    _initializeErrorCollector: function () {
        return Array.isArray(this.items) ? [] : {};
    },

    _initializeResultCollector: function () {
        return Array.isArray(this.items) ? [] : {};
    },

    _collectResult: function (pair, args) {
        if (this.reducing) {
            this.results = args[0];
        } else {
            Enumeration.State.prototype._collectResult.apply(this, arguments);
        }
    },

    _iteratorArgs: function () {
        var args = Enumeration.State.prototype._iteratorArgs.apply(this, arguments);
        this.reducing && args.push(this.results);
        return args;
    },

    _doneArgs: function (args) {
        (this.reducing || this.results) && (args = [this.results]);
        return args;
    }
});

var Each = Class(Enumeration, {
    constructor: function () {
        Enumeration.prototype.constructor.apply(this, arguments);
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
        return this.do(action).collect();
    },

    reduce: function (action, initialValue) {
        this._reducer = this._fn(action);
        this._reducer && this.collect();
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

    _run: function (args, callback) {
        if (this._reducer && !this._action) {
            this._reduce(this._items, args, callback);
        } else if (this._reducer) {
            this._createState({ items: this._items, args: args }, function (err, results) {
                err ? callback.apply(this.context, arguments) : this._reduce(results, args, callback);
            }.bind(this)).start();
        } else {
            this._createState({ items: this._items, args: args }, callback).start();
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
}, {
    statics: {
        State: State
    }
});

module.exports = Each;
