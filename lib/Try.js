var Class = require('js-class');

function tryLogics(logics) {
    var logicFns = Array.isArray(logics) ? logics : [logics];
    var results = [], err;
    if (!logicFns.every(function (logicFn) {
            var result;
            try {
                result = logicFn();
            } catch (e) {
                err = e;
                return false;
            }
            results.push(result);
            return true;
        })) {
        throw err;
    }
    return Array.isArray(logics) ? results : results[0];
}

var Try = Class({
    constructor: function (completeFn) {
        this._complete = completeFn;
    },

    tries: function (logics) {
        var result;
        try {
            result = tryLogics(logics);
        } catch (e) {
            this.done(e);
            return { ok: false, error: e, result: result };
        }
        return { ok: true, result: result };
    },

    final: function (logics) {
        var r = this.tries(logics);
        if (r.ok) {
            this.done();
        }
        return r;
    },

    done: function (err) {
        if (typeof(this._complete) == 'function') {
            this._complete(err);
        }
    }
}, {
    statics: {
        tries: function (logics, completeFn, final) {
            var _try = new Try(completeFn);
            return final ? _try.final(logics) : _try.tries(logics);
        },

        final: function (logics, completeFn) {
            return new Try(completeFn).final(logics);
        },

        br: function (success, failure) {
            return function (err) {
                err ? failure(err) : success.apply(undefined, [].slice.call(arguments, 1));
            };
        }
    }
});

module.exports = Try;
