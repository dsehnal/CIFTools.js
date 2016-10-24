var gulp = require('gulp'),
    plugins = {
        ts: require('gulp-typescript'),
        merge: require('merge2'),
        rename: require('gulp-rename'),
        insert: require('gulp-insert'),
        tsc: require('typescript')
    };

function createPre(name) {
    var ret = [
        ("\n; var __" + name + " = function () {"),
        "  'use strict';"
    ];
    return ret.join('\n') + '\n';
}
function createPost(name) {
    var ret = [];
    ret.push("  return " + name + ";");
    ret.push("}");
    // commonjs
    ret.push("if (typeof module === 'object' && typeof module.exports === 'object') {");
    ret.push("  module.exports = __" + name + "();");
    // amd
    ret.push("} else if (typeof define === 'function' && define.amd) {");
    ret.push("  define(['require'], function(require) { return __" + name + "(); })");
    // global
    ret.push("} else {");
    ret.push("  var __target = !!window ? window : this;");
    ret.push("  __target." + name + " = __" + name + "();");
    ret.push("}");
    return ret.join('\n') + '\n\n';
}

function base(tsConfig, name) {
    return function () {
        var project = plugins.ts.createProject(tsConfig, { typescript: plugins.tsc });
        var b = project.src().pipe(plugins.ts(project));
        return plugins.merge([
            b.js.pipe(plugins.rename(name + "-nomodule.js")).pipe(gulp.dest('./build')),
            b.dts.pipe(gulp.dest('./build'))
        ]);
    };
}

function assemble(name) {
    return function () {
        var jsMod = gulp
            .src([("./build/" + name.toLowerCase() + "-nomodule.js")])
            .pipe(plugins.rename(name + ".js"))
            .pipe(plugins.insert.prepend(createPre(name)))
            .pipe(plugins.insert.append(createPost(name)));

        return jsMod.pipe(gulp.dest('./build'));
    };
}

function build(tsConfig, name) {
    var tasks = { base: base(tsConfig, name), assemble: assemble(name) };
    gulp.task(name + "-base", [], function () {
        console.log("Building " + name);
        return tasks.base();
    });
    gulp.task(name + "-assemble", [name + "-base"], tasks.assemble);
    gulp.task(name, [name + "-base", name + "-assemble"]);
    return name;
}

function buildts(tsConfig, outDir) {
    var project = plugins.ts.createProject(tsConfig, { typescript: plugins.tsc });
    var b = project.src().pipe(plugins.ts(project));
    return b.js.pipe(gulp.dest(outDir));
}

function example_basic_read_write() {
    console.log('Building basic_read_write example');
    return buildts('examples/basic_read_write/src/tsconfig.json', 'examples/basic_read_write/build');
}

function example_CIFInspect() {
    console.log('Building CIFInspect example');
    return buildts('examples/CIFInspect/src/tsconfig.json', 'examples/CIFInspect');
}

gulp.task('example_basic_read_write', ['CIFTools'], example_basic_read_write);
gulp.task('example_CIFInspect', ['CIFTools'], example_CIFInspect);

gulp.task('default', [build('./src/tsconfig.json', 'CIFTools'), 'example_basic_read_write', 'example_CIFInspect'], function () { console.log('Done.') });