var assert = require('assert'),
    Try  = require('..').Try,
    loop = require('..').loop;

describe('Loop', function () {
    it('unconditionally', function (done) {
        var count = 0;
        loop().do(function (next) {
            next(++ count < 5000 ? null : 'break');
        }).run(done);
    });

    it('pre-condition', function (done) {
        var count = 0;
        loop().while(function (next) {
            next(count < 0);
        }).do(function (next) {
            count ++;
            next();
        }).run(function (err) {
            Try.final(function () {
                assert.equal(count, 0);
            }, done);
        });
    });

    it('post-condition', function (done) {
        var count = 0;
        loop().do(function (next) {
            count ++;
            next();
        }).while (function (next) {
            next(count < 0);
        }).run(function (err) {
            Try.final(function () {
                assert.equal(count, 1);
            }, done);
        });
    });

    it('all conditions', function (done) {
        var count = 0, pre = 0, post = 0;
        loop()
            .while(function (next) {
                pre ++;
                next(count < 5);
            })
            .do(function (next) {
                count ++;
                next();
            }).while (function (next) {
                post ++;
                next(count < 6);
            }).run(function (err) {
                Try.final(function () {
                    assert.equal(count, 5);
                    assert.equal(pre, 6);
                    assert.equal(post, 5);
                }, done);
            });
    });
});
