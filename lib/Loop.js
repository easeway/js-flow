var Class = require('js-class'),
    Flow  = require('./Flow'),
    Steps = require('./Steps');

var Loop = Class(Flow, {
    constructor: function () {
        Flow.prototype.constructor.apply(this, arguments);
    },

    do: function (action) {
        this._action = this._fn(action);
        return this;
    },

    while: function (condition) {
        if (!this._action) {
            this._preCondition = this._fn(condition);
        } else {
            this._postCondition = this._fn(condition);
        }
        return this;
    },

    _run: function (args, callback) {
        var action = this._action;
        action || (action = function (next) { next(); });
        var next = function (err, looping, results) {
            if (err || !looping) {
                results.unshift(err);
                callback.apply(this.context, results);
            } else {
                setImmediate(function () {
                    this._runBody(action, args, next);
                }.bind(this));
            }
        }.bind(this);
        this._runBody(action, args, next);
    },

    _runBody: function (action, args, callback) {
        var results = [];
        new Steps()
            .chain()
            .do(function (next) {
                this._condition(this._preCondition, args.slice(), next);
            })
            .do(function (matched, next) {
                if (matched) {
                    var actionArgs = args.slice();
                    actionArgs.push(function (err) {
                        results = [].slice.call(arguments, 1);
                        if (err === 'break') {
                            next(null, false);
                        } else {
                            next(err, true);
                        }
                    });
                    action.apply(this.context, actionArgs);
                } else {
                    next(null, false);
                }
            })
            .do(function (matched, next) {
                matched ? this._condition(this._postCondition, args.slice(), next) : next(null, false);
            })
            .with(this)
            .run(function (err, looping) {
                callback(err, looping, results);
            });
    },

    _condition: function (condition, args, callback) {
        if (condition) {
            args.push(function (err, result) {
                if (err != null && !(err instanceof Error)) {
                    result = err;
                    err = null;
                }
                callback(err, result);
            });
            condition.apply(this.context, args);
        } else {
            callback(null, true);
        }
    }
});

module.exports = Loop;
