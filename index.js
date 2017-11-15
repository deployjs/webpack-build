/*eslint-env node*/
'use strict';

var RSVP = require('rsvp');
var glob  = require('glob');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var path = require('path');
var spawn = require('child_process').spawn;

module.exports = {
  name: 'deployjs-webpack-build',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        configFile: 'webpack.config.js'
      },

      build: function(/* context */) {
        var self       = this;
        var configFile = this.readConfig('configFile');
        var outputPath = './dist';

        this.log('building app with config `' + configFile + '`...', { verbose: true });

        return new RSVP.Promise(function(resolve, reject) {
          try {
            var command = spawn('webpack', ['--config', configFile]);
            command.stdout.on('data', function(data) {
              this.log(data, { verbose: true });
            }.bind(this));

            command.stderr.on('data', function(data) {
              this.log(data, { verbose: true });
            }.bind(this));

            command.on('close', function(code) {
              if (code !== 0) {
                reject('build failed with code ' + code);
              } else {
                resolve(outputPath);
              }
            }.bind(this));
          } catch(err) {
            reject(err);
          }
        }.bind(this))
        .then(this._logSuccess.bind(this, outputPath))
        .then(function(files) {
          files = files || [];

          return {
            distDir: outputPath,
            distFiles: files
          };
        })
        .catch(function(error) {
          this.log('build failed', { color: 'red' });
          return RSVP.reject(error);
        }.bind(this));
      },
      _logSuccess: function(outputPath) {
        var self = this;
        var files = glob.sync('**/**/*', { nonull: false, nodir: true, cwd: outputPath });

        if (files && files.length) {
          files.forEach(function(path) {
            self.log('✔  ' + path, { verbose: true });
          });
        }
        self.log('build ok', { verbose: true });

        return RSVP.resolve(files);
      }
    });
    return new DeployPlugin();
  }
};
