
module.exports = function(grunt) {

    var config = require('./.screeps.json');

    grunt.initConfig({

        clean: {
            'dist': ['dist']
        },


        copy: {
            js: {
                expand: true,
                cwd: 'src/',
                src: ['**/*'],
                dest: 'dist/',
                filter: 'isFile',
                rename: function(dest, src) {
                    return dest + src.replace(/\//g,'_');
                }
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
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*.js'],
                    flatten: true
                }]
            }
        }

    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-screeps');

    // register tasks
    grunt.registerTask('default', [
        'clean',
        'copy:js',
        'screeps'
    ]);

}