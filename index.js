/*eslint-env node*/
'use strict';

var RSVP = require('rsvp');
var glob  = require('glob');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var path = require('path');
const exec = require('child_process').exec;

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

        this.log('building app with config `' + configFile + '`...', { verbose: true });

        return new RSVP.Promise(function(resolve, reject) {
          exec('webpack --config ' + configFile),
            {maxBuffer: 1024 * 1024 * 32},
            function(err, stdout, stderr)
          {
            if(err) {
              this.log(err, { color: 'red' });
              reject(err);
              return;
            }

            resolve(outputPath);
          }.bind(this);
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
