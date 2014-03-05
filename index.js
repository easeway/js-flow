var Try         = require('./lib/Try'),
    Flow        = require('./lib/Flow'),
    Enumeration = require('./lib/Enumeration'),
    Each        = require('./lib/Each'),
    Parallel    = require('./lib/Parallel'),
    Steps       = require('./lib/Steps'),
    Loop        = require('./lib/Loop'),
    Times       = require('./lib/Times');

module.exports = {
    Try:            Try,
    tries:          Try.tries,
    final:          Try.final,
    br:             Try.br,

    Flow:           Flow,
    Enumeration:    Enumeration,
    Each:           Each,
    Parallel:       Parallel,
    Steps:          Steps,
    Loop:           Loop,
    Times:          Times,

    each: function (items) {
        var f = new Each();
        items && f.in(items);
        return f;
    },

    parallel: function () {
        return new Parallel();
    },

    steps: function () {
        return new Steps();
    },

    loop: function (action) {
        var f = new Loop();
        action && f.do(action);
        return f;
    },

    while: function (condition) {
        return loop().while(condition);
    },

    times: function (n) {
        var f = new Times();
        n != null && f.times(n);
        return f;
    }
};
