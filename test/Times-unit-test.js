var assert = require('assert'),
    Try   = require('..').Try,
    times = require('..').times;

describe('Times', function () {
    it('times', function (done) {
        var count = 0;
        times(10).do(function (n, next) {
            count += n;
            next(null, count);
        }).run(function (err) {
            Try.final(function () {
                assert.equal(err, null);
                assert.equal(count, 45);
            }, done);
        });
    });

    it('invalid times', function (done) {
        var count = 0;
        times().do(function (n, next) {
            count ++;
            next();
        }).run(function (err) {
            Try.final(function () {
                assert.equal(err, null);
                assert.equal(count, 0);
            }, done);
        });
    });

    it('#concurrent', function (done) {
        var seq = [];
        times(5).concurrent(3).do(function (n, next) {
            setTimeout(function () {
                seq.push(n);
                next();
            }, n < 3 ? 100 - n * 10 : (90 - n * 20));
        }).run(function () {
            Try.final(function () {
                assert.deepEqual(seq, [2, 1, 0, 4, 3]);
            }, done);
        });
    });

    it('#concurrent unset', function (done) {
        var seq = [];
        times(5).concurrent(3).concurrent().do(function (n, next) {
            setTimeout(function () {
                seq.push(n);
                next();
            }, n < 3 ? 100 - n * 10 : (90 - n * 20));
        }).run(function () {
            Try.final(function () {
                assert.deepEqual(seq, [4, 3, 2, 1, 0]);
            }, done);
        });
    });

    it('#series', function (done) {
        var seq = [];
        times(5).series().do(function (n, next) {
            setTimeout(function () {
                seq.push(n);
                next();
            }, 60 - n * 10);
        }).run(function () {
            Try.final(function () {
                assert.deepEqual(seq, [0, 1, 2, 3, 4]);
            }, done);
        });
    });

    it('#map', function (done) {
        times(5).map().do(function (addend, n, next) {
            next(addend + n);
        }).run(10, function (err, results) {
            Try.final(function () {
                assert.equal(err, null);
                assert.deepEqual(results, [10, 11, 12, 13, 14]);
            }, done);
        });
    });

    it('#aggregateErrors', function (done) {
        times(5).aggregateErrors().do(function (badN, n, next) {
            next(badN.indexOf(n) >= 0 ? new Error('Bad') : null);
        }).run([3, 4], function (errs) {
            Try.final(function () {
                assert.equal(Array.isArray(errs), true);
                assert.equal(errs[0], null);
                assert.equal(errs[1], null);
                assert.equal(errs[2], null);
                assert.ok(errs[3] instanceof Error);
                assert.ok(errs[4] instanceof Error);
            }, done);
        });
    });

    it('failfast', function (done) {
        var count = 0;
        times(5).series().do(function (badN, n, next) {
            count ++;
            next(badN.indexOf(n) >= 0 ? new Error('Bad') : null);
        }).run([3, 4], function (errs) {
            Try.final(function () {
                assert.equal(Array.isArray(errs), false);
                assert.ok(errs instanceof Error);
                assert.equal(count, 4);
            }, done);
        });
    });

    it('break', function (done) {
        var count = 0;
        times(5).series().do(function (badN, n, next) {
            count ++;
            next(badN.indexOf(n) >= 0 ? 'break' : null);
        }).run([3, 4], function (errs) {
            Try.final(function () {
                assert.equal(errs, null);
                assert.equal(count, 4);
            }, done);
        });
    });
});
