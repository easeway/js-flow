var Class = require('js-class'),
    Each = require('./Each');

var Parallel = Class(Each, {
    constructor: function () {
        Each.prototype.constructor.apply(this, arguments);
        this._items = [];
        this._action = this._step.bind(this);
        ['in', 'map', 'reduce', 'some', 'every', 'reverse', 'keys', 'collect'].forEach(function (method) {
            delete this[method];
        }, this);
    },

    do: function (action) {
        this._items.push(this._fn(action));
        return this;
    },

    _step: function () {
        var next = arguments[arguments.length - 1];
        var step = arguments[arguments.length - 2];
        var args = [].slice.call(arguments);
        args.splice(args.length - 2, 1);
        step.apply(this.context, args);
    }
});

module.exports = Parallel;
