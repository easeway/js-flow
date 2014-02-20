var assert = require('assert'),
    Try      = require('..').Try,
    parallel = require('..').parallel;

describe('Parallel', function () {
    it('run concurrently', function (done) {
        var seq = [];
        parallel()
            .do(function (next) {
                setTimeout(function () {
                    seq.push(1);
                    next();
                }, 100);
            })
            .do(function (next) {
                setTimeout(function () {
                    seq.push(2);
                    next();
                }, 50);
            })
            .do(function (next) {
                setTimeout(function () {
                    seq.push(3);
                    next();
                }, 80);
            })
            .run(function () {
                Try.final(function () {
                    assert.deepEqual(seq, [2, 3, 1]);
                }, done);
            });
    });

    it('run with parameters', function (done) {
        var seq = [];
        parallel()
            .do(function (base, next) {
                setTimeout(function () {
                    seq.push(base + 1);
                    next();
                }, 100);
            })
            .do(function (base, next) {
                setTimeout(function () {
                    seq.push(base + 2);
                    next();
                }, 50);
            })
            .do(function (base, next) {
                setTimeout(function () {
                    seq.push(base + 3);
                    next();
                }, 80);
            })
            .run(5, function () {
                Try.final(function () {
                    assert.deepEqual(seq, [7, 8, 6]);
                }, done);
            });
    });
});
