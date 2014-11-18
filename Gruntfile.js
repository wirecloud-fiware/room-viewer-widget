/**
 * @file Gruntfile.js
 * @version 0.0.1
 * 
 * @copyright 2014 CoNWeT Lab., Universidad Politécnica de Madrid
 * @license Apache v2 (https://github.com/Wirecloud/room-manager-src/blob/master/LICENSE)
 */

module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    banner: ' * @version <%= pkg.version %>\n' +
            ' * \n' +
            ' * @copyright 2014 <%= pkg.author %>\n' +
            ' * @license <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
            ' */',

    concat: {
      options: {
        stripBanners: true
      },
      dist: {
        options: {
          banner: '/*!\n * @file <%= pkg.name %>.js\n<%= banner %>\n\n'
        },
        src: [
          'src/js/kurento-utils.js',
          'src/js/participant.js',
          'src/js/room-viewer.js'
        ],
        dest: 'build/js/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        preserveComments: false
      },
      dist: {
        options: {
          banner: '/*!\n * @file <%= pkg.name %>.min.js\n<%= banner %>\n'
        },
        src: '<%= concat.dist.dest %>',
        dest: 'build/js/<%= pkg.name %>.min.js'
      }
    },

    less: {
      dist: {
        options: {
          banner: '/*!\n * @file <%= pkg.name %>.css\n<%= banner %>\n\n'
        },
        src: [
          'src/less/widget.less'
        ],
        dest: 'build/css/<%= pkg.name %>.css'
      }
    },

    cssmin: {
      options: {
        keepSpecialComments: 0
      },
      dist: {
        options: {
          banner: '/*!\n * @file <%= pkg.name %>.min.css\n<%= banner %>\n'
        },
        src: '<%= less.dist.dest %>',
        dest: 'build/css/<%= pkg.name %>.min.css'
      }
    },

    compress: {
      widget: {
        options: {
          mode: 'zip',
          archive: 'build/<%= pkg.vendor %>_<%= pkg.name %>_<%= pkg.version %>.wgt'
        },
        files: [
          {expand: true, src: ['lib/**/*', 'fonts/**', 'config.xml', 'index.html'], cwd: 'src'},
          {expand: true, src: ['js/**/*', 'css/**/*'], cwd: 'build'}
        ]
      }
    },
    
    jasmine: {
      src: ['src/js/*.js'],
      options: {
        specs: 'src/test/js/*Spec.js',
        helpers: 'src/test/helpers/*.js'
      }
    },

    replace: {
      version: {
        src: ['src/config.xml'],
        overwrite: true,
        replacements: [{
          from: /version=\"[0-9]+\.[0-9]+\.[0-9]+(-SNAPSHOT)?\"/g,
          to: 'version="<%= pkg.version %>"'
        }]
      }
    },

    clean: ['build'],

    jshint: {
      all: ['src/js/**/*', 'src/test/**/*', '!src/js/kurento-utils.js', 'Gruntfile.js']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('js', ['concat:dist', 'uglify:dist']);
  grunt.registerTask('jsConcat', 'concat:dist');
  grunt.registerTask('css', ['less:dist', 'cssmin:dist']);
  grunt.registerTask('zip', 'compress:widget');
  grunt.registerTask('version', ['replace:version']);

  // grunt.registerTask('default', ['jshint', 'js', 'css', 'version', 'jasmine', 'zip']);
  grunt.registerTask('default', ['jshint', 'jsConcat', 'css', 'version', 'jasmine', 'zip']);
};
