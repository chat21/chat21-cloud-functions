gulp-exit
=========

`gulp-exit` ensures that the task is terminated after finishing.

Some plugins, like [gulp-mocha](https://github.com/sindresorhus/gulp-mocha), have problems with a proper termination after finishing the task. This plugin guarantees that the task will exit successfully.

### Example

```javascript
var mocha = require('gulp-mocha'),
    exit = require('gulp-exit');

gulp.src('test.js')
  .pipe(mocha({
    reporter: 'dot',
    ui: 'bdd',
    growl: true,
    timeout: 2000,
    useColors: true,
    useInlineDiffs: true
  }))
  .pipe(exit());
```
