var assert = require('assert'),
    Try   = require('..').Try,
    each  = require('..').each,
    steps = require('..').steps;

describe('Steps', function () {
    it('run in sequence', function (done) {
        var seq = [];
        steps()
            .next(function (next) {
                setTimeout(function () {
                    seq.push(1);
                    next();
                }, 100);
            })
            .next(function (next) {
                setTimeout(function () {
                    seq.push(2);
                    next();
                }, 50);
            })
            .next(function (next) {
                setTimeout(function () {
                    seq.push(3);
                    next();
                }, 80);
            })
            .run(function () {
                Try.final(function () {
                    assert.deepEqual(seq, [1, 2, 3]);
                }, done);
            });
    });

    it('chains results', function (done) {
        steps()
            .chain()
            .next(function (p1, p2, next) {
                next(null, p1, p2, 1);
            })
            .next(function (p1, p2, p3, next) {
                next(null, p1, p2, p3, 2);
            })
            .next(function (p1, p2, p3, p4, next) {
                next(null, p1, p2, p3, p4, 3);
            })
            .run('a', 'b', function (err) {
                var args = [].slice.call(arguments, 1);
                Try.final(function () {
                    assert.equal(err, null);
                    assert.deepEqual(args, ['a', 'b', 1, 2, 3]);
                }, done);
            });
    });

    it('chain flows', function (done) {
        steps()
            .chain()
            .next(function (p1, p2, next) {
                next(null, p1, p2, 1);
            })
            .next(each(['a', 'b', 'c']).map(function (p1, p2, p3, item, next) {
                    next(item + p1 + p2 + p3);
                })
            )
            .next(function (items, next) {
                next(null, items, 3);
            })
            .run('a', 'b', function (err) {
                var args = [].slice.call(arguments, 1);
                Try.final(function () {
                    assert.equal(err, null);
                    assert.deepEqual(args, [['aab1', 'bab1', 'cab1'], 3]);
                }, done);
            });
    });
});
