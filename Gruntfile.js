
module.exports = function(grunt) {

    var config = require('./.screeps.json');

    grunt.initConfig({

        copy: {
            js: {
                expand: true,
                cwd: 'src/',
                src: ['**/*'],
                dest: 'dist/'
            }
        },

        screeps: {
            options: {
                email: config.email,
                password: config.password,
                branch: config.branch,
                ptr: config.ptr
            },
            dist: {
                src: ['dist/*.js']
            }
        }

    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-screeps');

    // register tasks
    grunt.registerTask('build', [
        'copy:js',
        'screeps'
    ]);

}