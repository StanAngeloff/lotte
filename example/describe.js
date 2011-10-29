this.base('http://github.com');
this.title('Describe.js:');

this.open('/', function() {
  this.group('Github', function() {
    this.group('Second Group', function() {
      this.describe('Job 1', function() {
        this.assert.ok(false);
        this.success();
      });
      this.group('Third Group', function() {
        this.describe('Job 2', function() {
          this.assert.ok(true);
          this.success();
        });
      });
    });
  });
});
