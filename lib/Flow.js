var Class = require('js-class');

function contextFn(context, method, itemPos) {
    var fn;
    if (method instanceof Flow) {
        fn = method.entry;
    } else if (typeof(method) == 'function') {
        fn = method;
    } else if (typeof(method) == 'string') {
        if (method[0] == '&' && itemPos != null) {
            fn = function () {
                var args = [].slice.call(arguments);
                if (itemPos < 0) {
                    itemPos += args.length;
                }
                var item = args[itemPos];
                args.splice(itemPos, 1);
                item[method.substr(1)].apply(item, args);
            };
        } else {
            fn = context[method];
            if (!fn) {
                throw new Error('Method not found: ' + method);
            }
        }
    } else {
        throw new Error('Invalid method');
    }
    return fn;
}

var Flow = Class({
    constructor: function () {
        this._entry = this.run.bind(this);
    },

    with: function (context) {
        this.context = context;
        return this;
    },

    do: function (action) {
        this._action = this._fn(action);
        return this;
    },

    run: function () {
        var args = [].slice.call(arguments);
        var callback = args[args.length - 1];
        if (typeof(callback) == 'function') {
            args.pop();
        } else {
            callback = function () { };
        }
        this._run(args, callback);
        return this;
    },

    get entry () {
        return this._entry;
    },

    _fn: function (method, itemPos) {
        var fn;
        return function () {
            fn || (fn = contextFn(this.context, method, itemPos));
            fn.apply(this.context, arguments);
        }.bind(this);
    }
});

module.exports = Flow;
