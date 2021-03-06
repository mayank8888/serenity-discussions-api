'use strict';

var paths = {
  js: ['*.js', 'api/**/*.js', '!test/coverage/**', '!bower_components/**']
};

module.exports = function(grunt) {
  var databaseUrl;

  if (process.env.NODE_ENV !== 'production') {
    require('time-grunt')(grunt);
  }

  var envConfig = require('config');
  databaseUrl = envConfig.get('app.pgURL') ||
      'postgres://' + envConfig.get('app.pg.username') +
      ':' + envConfig.get('app.pg.password') +
      '@' + envConfig.get('app.pg.host') +
      ':' + envConfig.get('app.pg.port') +
      '/' + envConfig.get('app.pg.database');


  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      js: {
        files: paths.js,
        tasks: ['jshint']
      }
    },
    jshint: {
      all: {
        src: paths.js,
        options: {
          jshintrc: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          args: [],
          ignore: ['node_modules/**'],
          ext: 'js,html',
          nodeArgs: ['--debug'],
          delayTime: 1,
          cwd: __dirname
        }
      }
    },
    concurrent: {
      tasks: ['nodemon', 'watch'],
      options: {
        logConcurrentOutput: true
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: [
            'app.js'
          ]
        },
        src: ['test/**/*.js']
      }
    },
    migrate: {
      options: {
        env: {
          DATABASE_URL: databaseUrl   // the databaseUrl is resolved at the beginning based on the NODE_ENV
        },
        'migrations-dir': 'config/schema-migrations', // defines the dir for the migration scripts
        verbose: true   // tell me more stuff
      }
    },
    env: {
      test: {
        NODE_ENV: 'test',
        A127_APPROOT: __dirname
      },
      local: {
        NODE_ENV: 'local'
      }
    }
  });

  //Load NPM tasks
  require('load-grunt-tasks')(grunt);

  //Default task(s).
  if (process.env.NODE_ENV === 'production') {
    grunt.registerTask('default', ['jshint', 'concurrent']);
  } else {
    grunt.registerTask('default', ['env:local', 'jshint', 'concurrent']);
  }

  //Test task.
  grunt.registerTask('test', ['env:test', 'mochaTest']);

  // For Heroku users only.
  grunt.registerTask('heroku:production', ['jshint']);

  // db migrate
  grunt.registerTask('dbmigrate', 'db up all the appliable scripts', function () {
    grunt.task.run('migrate:up');
  });
  grunt.registerTask('dbdown', 'db down all the appliable scripts', function () {
    grunt.task.run('migrate:down');
  });
};
