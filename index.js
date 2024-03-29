var Through = require('through2');
var Revisioner = require('./revisioner');
var path = require('path');

var RevAll = (function () {

    var RevAll = function (options) {

        if (!(this instanceof RevAll)) {
            return new RevAll(options);
        }

        this.revisioner = new Revisioner(options);

    };

    RevAll.prototype.revision = function () {

        var revisioner = this.revisioner;

        // Feed the RevAll Revisioner with all the files in the stream, don't emit them until all of them have been processed
        return Through.obj(function (file, enc, callback) {

            if (file.isStream()) {
                throw new Error('Streams are not supported!');
            }
            if (file.isBuffer()) {
                revisioner.processFile(file);
            }

            callback();

        }, function (callback) {

            revisioner.run();

            var files = revisioner.files;
            for (var filename in files) {
                var newfilepath = path.join(files[filename].base, files[filename].revPath);
                files[filename].path = newfilepath;
                this.push(files[filename]);
            }
            callback();

        });

    };

    RevAll.prototype.versionFile = function () {

        var revisioner = this.revisioner;

        // Drop any existing files off the stream, push the generated version file
        return Through.obj(function (file, enc, callback) {

            // Drop any existing files off the stream
            callback();

        }, function (callback) {

            if (revisioner.files.length > 0)
                this.push(revisioner.versionFile());
            callback();

        });

    };

    RevAll.prototype.manifestFile = function () {

        var revisioner = this.revisioner;

        // Drop any existing files off the stream, push the generated manifest file
        return Through.obj(function (file, enc, callback) {

            callback();

        }, function (callback) {

            if (revisioner.files.length > 0)
                this.push(revisioner.manifestFile());
            callback();

        });
    };

    return RevAll;

})();

module.exports = RevAll;
