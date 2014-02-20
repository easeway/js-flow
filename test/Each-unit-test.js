var assert = require('assert'),
    Try  = require('..').Try,
    each = require('..').each;

describe('Each', function () {
    it('#in array', function (done) {
        var items = {};
        each()
            .in(['a', 'b', 'c'])
            .do(function (item, next) {
                items[item] = true;
                next();
            })
            .run(function (err) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.ok(items['a']);
                    assert.ok(items['b']);
                    assert.ok(items['c']);
                }, done);
            });
    });

    it('#in array with index', function (done) {
        var items = {};
        each()
            .in(['a', 'b', 'c'])
            .withIndex()
            .do(function (index, item, next) {
                items[item] = index;
                next();
            })
            .run(function (err) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(items['a'], 0);
                    assert.equal(items['b'], 1);
                    assert.equal(items['c'], 2);
                }, done);
            });
    });

    it('#in hash', function (done) {
        var items = {};
        each()
            .in({ 'a': 'va', 'b': 'vb', 'c': 'vc' })
            .do(function (item, next) {
                items[item] = true;
                next();
            })
            .run(function (err) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.ok(items['va']);
                    assert.ok(items['vb']);
                    assert.ok(items['vc']);
                }, done);
            });
    });

    it('#in hash with keys', function (done) {
        var items = {};
        each()
            .in({ 'a': 'va', 'b': 'vb', 'c': 'vc' })
            .withIndex()
            .do(function (key, item, next) {
                items[item] = key;
                next();
            })
            .run(function (err) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(items['va'], 'a');
                    assert.equal(items['vb'], 'b');
                    assert.equal(items['vc'], 'c');
                }, done);
            });
    });

    it('#do item method', function (done) {
        function makeObj(name) {
            return Object.create({
                name: name,
                transform: function (callback) {
                    this.name = this.name.toUpperCase();
                    callback();
                }
            });
        }
        var objs = ['name1', 'Name2', 'iteM'].map(function (name) { return makeObj(name); });
        each()
            .in(objs)
            .do('&transform')
            .run(function (err) {
                Try.final(function () {
                    assert.deepEqual(objs.map(function (obj) { return obj.name; }), ['NAME1', 'NAME2', 'ITEM']);
                }, done);
            });
    });

    it('#run parameters', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .do(function (addend, num, next) {
                seq.push(num + addend);
                next();
            })
            .series()
            .run(10, function () {
                Try.final(function () {
                    assert.deepEqual(seq, [110, 90, 70, 50, 30]);
                }, done);
            });
    });

    it('#concurrent', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .do(function (num, next) {
                setTimeout(function () {
                    seq.push(num);
                    next();
                }, num);
            })
            .run(function () {
                Try.final(function () {
                    assert.deepEqual(seq, [20, 40, 60, 80, 100]);
                }, done);
            });
    });

    it('#concurrent unset', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .series()
            .concurrent()
            .do(function (num, next) {
                setTimeout(function () {
                    seq.push(num);
                    next();
                }, num);
            })
            .run(function () {
                Try.final(function () {
                    assert.deepEqual(seq, [20, 40, 60, 80, 100]);
                }, done);
            });
    });

    it('#series', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .do(function (num, next) {
                setTimeout(function () {
                    seq.push(num);
                    next();
                }, num);
            })
            .series()
            .run(function () {
                Try.final(function () {
                    assert.deepEqual(seq, [100, 80, 60, 40, 20]);
                }, done);
            });
    });

    it('#map', function (done) {
        each()
            .in([100, 80, 60, 40, 20])
            .map(function (num, next) {
                next('a' + num);
            })
            .run(function (err, results) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.deepEqual(results, ['a100', 'a80', 'a60', 'a40', 'a20']);
                }, done);
            });
    });

    it('#map reverse', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .map(function (num, next) {
                seq.push(num);
                next(null, 'a' + num);
            })
            .series()
            .reverse()
            .run(function (err, results) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.deepEqual(seq, [20, 40, 60, 80, 100]);
                    assert.deepEqual(results, ['a100', 'a80', 'a60', 'a40', 'a20']);
                }, done);
            });
    });

    it('#reduce', function (done) {
        each()
            .in([100, 80, 60, 40, 20])
            .reduce(function (result, num, next) {
                next(null, result + num);
            }, 100)
            .run(function (err, result) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(result, 400);
                }, done);
            });
    });

    it('#reduce reverse', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .reduce(function (result, num, next) {
                seq.push(num);
                next(null, result + num);
            }, 100)
            .reverse()
            .run(function (err, result) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(result, 400);
                    assert.deepEqual(seq, [20, 40, 60, 80, 100]);
                }, done);
            });
    });

    it('#map+reduce', function (done) {
        each()
            .in([100, 80, 60, 40, 20])
            .map(function (num, next) {
                next(null, num + 100);
            })
            .reduce(function (result, num, next) {
                next(null, result + num);
            }, 100)
            .run(function (err, result) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(result, 900);
                }, done);
            });
    });

    it('#map+reduce reversed', function (done) {
        var mapSeq = [], redSeq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .series()
            .reverse()
            .map(function (num, next) {
                mapSeq.push(num);
                next(null, num + 100);
            })
            .reduce(function (result, num, next) {
                redSeq.push(num);
                next(null, result + num);
            }, 100)
            .run(function (err, result) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(result, 900);
                    assert.deepEqual(mapSeq, [20, 40, 60, 80, 100]);
                    assert.deepEqual(redSeq, [120, 140, 160, 180, 200]);
                }, done);
            });
    });

    it('#some', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .some(function (num, next) {
                seq.push(num);
                next(null, num < 50);
            })
            .series()
            .run(function (err, matched, item) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(matched, true);
                    assert.equal(item, 40);
                    assert.deepEqual(seq, [100, 80, 60, 40]);
                }, done);
            });
    });

    it('#some false', function (done) {
        each()
            .in([100, 80, 60, 40, 20])
            .some(function (num, next) {
                next(null, num < 10);
            })
            .run(function (err, matched) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(matched, false);
                }, done);
            });
    });

    it('#every', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .every(function (num, next) {
                seq.push(num);
                next(null, num > 10);
            })
            .run(function (err, matched) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(matched, true);
                    assert.deepEqual(seq, [100, 80, 60, 40, 20]);
                }, done);
            });
    });

    it('#every false', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .every(function (num, next) {
                seq.push(num);
                next(null, num > 50);
            })
            .series()
            .run(function (err, matched, item) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(matched, false);
                    assert.equal(item, 40);
                    assert.deepEqual(seq, [100, 80, 60, 40]);
                }, done);
            });
    });

    it('#reverse', function (done) {
        var seq = [];
        each()
            .in([100, 80, 60, 40, 20])
            .reverse()
            .do(function (num, next) {
                seq.push(num);
                next();
            })
            .series()
            .run(function () {
                Try.final(function () {
                    assert.deepEqual(seq, [20, 40, 60, 80, 100]);
                }, done);
            });
    });

    it('#aggregateErrors', function (done) {
        each()
            .in([100, 80, 60, 40, 20])
            .do(function (num, next) { next(new Error(num)); })
            .aggregateErrors()
            .run(function (err) {
                Try.final(function () {
                    assert.ok(Array.isArray(err));
                    assert.deepEqual(err.map(function (e) { return parseInt(e.message); }), [100, 80, 60, 40, 20]);
                }, done);
            });
    });

    it('failfast', function (done) {
        var vals = [];
        each()
            .in([100, 80, 60, 40, 20])
            .do(function (threshold, num, next) {
                vals.push(num);
                next(num < threshold ? new Error(num) : null);
            })
            .series()
            .run(50, function (err) {
                Try.final(function () {
                    assert.equal(Array.isArray(err), false);
                    assert.deepEqual(vals, [100, 80, 60, 40]);
                }, done);
            });
    });

    it('empty items', function (done) {
        var count = 0;
        each().in([]).do(function (next) { count ++; next(); })
            .run(function (err) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(count, 0);
                }, done);
            });
    });

    it('items not set', function (done) {
        var count = 0;
        each().do(function (next) { count ++; next(); })
            .run(function (err) {
                Try.final(function () {
                    assert.equal(err, null);
                    assert.equal(count, 0);
                }, done);
            });
    });

    it('use method name', function (done) {
        var obj = Object.create({
            refs: 0,
            count: function (n, next) {
                this.refs ++;
                next();
            }
        });
        each([1, 2, 3, 4]).do('count').with(obj).run(function () {
            Try.final(function () {
                assert.equal(this.refs, 4);
            }.bind(this), done);
        });
    });

    it('use method from item', function (done) {
        var objs = [1, 2, 3, 4].map(function (id) {
            return Object.create({
                id: id,
                filter: function (next) {
                    next(this.id);
                }
            });
        });
        each(objs).map('&filter').with(this).run(function (err, results) {
            Try.final(function () {
                assert.equal(err, null);
                assert.deepEqual(results, [1, 2, 3, 4]);
            }, done);
        });
    });
});
