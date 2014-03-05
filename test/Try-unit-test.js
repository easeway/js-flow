var assert = require('assert'),
    Try = require('..').Try;

describe('Try', function () {
    it('#tries success', function () {
        var result = Try.tries(function () {
            return 'done';
        }, function () {
            assert.ok(false);
        });
        assert.ok(result.ok);
        assert.equal(result.result, 'done');
    });

    it('#tries failure', function () {
        var error;
        var result = Try.tries(function () {
            throw new Error('test');
            return 'done';
        }, function (err) {
            error = err;
        });
        assert.equal(result.ok, false);
        assert.ok(result.error instanceof Error);
        assert.ok(error);
    });

    it('#final success', function () {
        var done;
        var result = Try.final(function () {
            return 'done';
        }, function () {
            done = true;
        });
        assert.ok(result.ok);
        assert.equal(result.result, 'done');
        assert.equal(done, true);
    });

    it('#final failure', function () {
        var error;
        var result = Try.final(function () {
            throw new Error('test');
            return 'done';
        }, function (err) {
            error = err;
        });
        assert.equal(result.ok, false);
        assert.ok(result.error instanceof Error);
        assert.ok(error);
    });

    it('#br success', function () {
        var value;
        Try.br(function (val) {
            value = val;
        }, function () {
            assert.ok(false);
        })(null, 101);
        assert.equal(value, 101);
    });

    it('#br failure', function () {
        var value, error;
        Try.br(function (val) {
            value = val;
        }, function (err) {
            error = err;
        })(new Error('test'), 101);
        assert.equal(value, null);
        assert.ok(error);
    });
});
