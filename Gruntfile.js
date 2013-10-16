/*global module:false*/
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        jshint: {
            all: ['Gruntfile.js', 'ultrabot.js']
        },
        uglify: {
            main: {
                files: {
                    'dist/ultrabot.min.js': ['ultrabot.js'],
                    'dist/thoughts.min.js': ['thoughts.js'],
                    'dist/bots.min.js': ['bots.js']
                }
            }
        }
    });

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('publish', ['uglify']);
};