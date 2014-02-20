# Asynchronous Flow Programming Library for Node.js

This is a Node.js module which provides a DSL for simplifying asynchronous flow programming in Node.js.

Let example explain:

```javascript
var Class = require('js-class'),
	flow = require('js-flow');

var MyItem = Class({
    constructor: function (num) {
    	this.val = num;
    },

    transform: function (next) {
    	next(Math.floor(this.val * 100));
    }
});

var MyClass = Class({
	run: function (done) {
    	flow.steps()
        	.next('prepare')
            .next('generate')
            .next('execute')
            .next('cleanup')
            .with(this)
            .run(done);
    },

    prepare: function (next) {
    	fs.mkdir('someplace', next);
    },

    generate: function (next) {
    	flow.times(100).do(function (n, next) {
        	next(new MyItem(n * Math.random()));
        }).map().with(this).run(function (err, items) {
        	this.items = items;
            next();
        });
    },

	execute: function (next) {
    	flow.each(this.items)
        	.map('&transform')
            .reduce(function (val, item, next) {
            	next(val + item);
            })
            .with(this)
            .run(100, function (err, result) {
            	fs.writeFile('someplace/result.txt', result, next);
            });
    },

    cleanup: function (next) {
    	fs.rmdir('someplace', next);
    }
});

new MyClass().run();
```

## Installation

```bash
npm install js-flow
```

```javascript
var flow = require('js-flow');
```

## Supported Flows

### Array/Object Enumeration

```javascript
flow.each()
```

Or

```javascript
new flow.Each()
```

Then the following options can be chained (the order is not important):

```javascript
flow.each().in(Array or Object)
flow.each(Array or Object)
```

Both `Array` and `Object` are supported.
If it is an `Array`, index and value in each pair is enumerated.
If it is an `Object`, key and value in each pair is enumerated.

```javascript
flow.each().in(...).do(Function or String)
flow.each().in(...).withIndex().do(...)
```

Specify the iterator.
For `Function`, the arguments is like:

```javascript
function iterator([arguments passed from run,] [index/key,] value, next)
```

If the final `run` method is passed a number of arguments, they will be forward to the iterator. "index/key" is present if `withIndex` is used.

If `String` is provided instead of `Function`, it represents the method name in context provided by `with`. In above example, names are used.
If `String` is prefixed with **&**, the method of iterated object is invoked.

Map/Reduce can also be used:

```javascript
flow.each().in(...).map(Function or String).run(function (err, results) {})
flow.each().in(...).map(...).reduce(Function or String).run(initailVal, function (err, result) { })
flow.each().in(...).reduce(Function or String).run(initialVal, function (err, result) { })
```

When `map` is used, the callback passed to `run` accepts the 2nd parameter with the results of`map`. If `reduce` is used, the arguments passed to `run` is used as initial value for `reduce`.

Also compatible methods as in javascript `Array`:

```javascript
flow.each(...).some(Function or String).run(function (err, true/false) { })
flow.each(...).every(Function or String).run(function (err, true/false) { })
```

The maximum number of concurrent enumeration can be limited using:

```javascript
flow.each(...).concurrent(3)
flow.each(...).series()		// this is equivalent to concurrent(1)
flow.each(...).concurrent()	// allow unlimited concurrentcy
```

### Sequential/Parallel Execution

```javascript
flow.steps()
	.next(Function or String)		// do is alias of next
    .next(...)
    .run([args], function (err) {  })

flow.parallel()
    .do(Function or String)
    .do(...)
    .run([args], function (err) { })
```

For sequential execution, when `chain` is used, the result from previous step can be passed as arguments to next step:

```javascript
flow.steps()
	.chain()
    .next(function (next) { next('abcd'); })
    .next(function (str, next) { next(str + '1'); })
    .run(function (err, result) { })  // here result is 'abcd1'
```

For parallel execution, concurrency can be controlled the same way as Array/Object enumeration.

### Times

This is simple and straightforward:

```javascript
flow.times(10).do(Function or String)
```

Same concurrency control as above.

### Loop

```javascript
flow.loop().do(Function or String)			// infinite loop
flow.loop().while(condition function).do()	// a while () { } loop
flow.while(condition function).do()			// same as above
flow.loop().do().while(...)					// a do {} while() loop
flow.loop().while().do().while(...)			// useless, but a while () { } while () loop
```

In any iteration function (Loop, Enumeration, Times etc), passing string `break` as the first argument of `next` function can terminate the loop/enumeration.

For all function passed in, `bind` is not necessary as `.with(context)` will ensure the functions are invoked with correct context.

## License

MIT/X11 License
