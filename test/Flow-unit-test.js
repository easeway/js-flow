var assert = require('assert'),
    Class  = require('js-class'),
    Flow = require('..').Flow;

describe('Flow', function () {
    it('default dummy callback for run', function () {
        var SubClass = Class(Flow, {
            _run: function (args, callback) {
                assert.equal(typeof(callback), 'function');
            }
        });
        new SubClass().run();
        new SubClass().run(1, 2, 3);
    });

    describe('#_fn', function () {
        var vals;

        var SubFlow = Class(Flow, {
            constructor: function (val) {
                Flow.prototype.constructor.call(this);
                this.value = val;
            },
            _run: function (args, callback) {
                vals.push(this.value);
                this._action && this._action(callback);
            }
        });

        beforeEach(function () {
            vals = [];
        });

        it('method is flow', function () {
            new SubFlow(1).do(new SubFlow(2)).run();
            assert.deepEqual(vals, [1, 2]);
        });

        it('method is function', function () {
            new SubFlow(1).do(function () { vals.push(3); }).run();
            assert.deepEqual(vals, [1, 3]);
        });

        it('method is member function name', function () {
            new SubFlow(1).do('hello').with(Object.create({ hello: function () { vals.push('hello'); } })).run();
            assert.deepEqual(vals, [1, 'hello']);
        });

        it('method not found', function () {
            assert.throws(function () {
                new SubFlow(1).do('hello').with({ }).run();
            }, /method not found/i);
        });

        it('method invalid', function () {
            assert.throws(function () {
                new SubFlow(1).do({}).run();
            }, /invalid/i);
        })
    });
});
