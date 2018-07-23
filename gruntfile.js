module.exports = function (grunt){
    grunt.initConfig ({
        copy: {
            main: {
                files: [{
                    cwd: 'src',
                    expand: true,
                    src: ['libwylio/*'],
                    dest: 'out'
                }]
            }
        },
        tslint: {
            options: {
                configuration: 'tslint.json',
                module: 'commonjs'
            },
            files: {
                src: ['src/extenstion.ts', 'src/commands/*.ts']
            }
        },
        ts: {
            default: {
                tsconfig: './tsconfig.json'
            }
        }
    });

    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask ('default', ['copy', 'tslint', 'ts']);
}