"use strict";
var fs = require('fs');
var Tools = require('../../../build/CIFTools');
// if CIFTools.js is present in node_modules it is possible to use
// import * as Tools from 'CIFTools'
console.log('Version: ', Tools.VERSION);
/**
 * Reading CIF files.
 */
function read_mmCIF(filename) {
    fs.readFile(filename, 'UTF8', function (err, input) {
        console.log('---------------------');
        if (err) {
            console.log(err);
            return;
        }
        var parsed = Tools.Text.parse(input);
        // check if the parsing result in an error
        if (parsed.isError) {
            console.log(parsed.toString());
            return;
        }
        // get the first data block from the file
        var data = parsed.result.dataBlocks[0];
        // get the _entry.id value:
        console.log('ID:', data.getCategory('_entry').getColumn('id').getString(0));
        // write out the categories
        console.log('Categories', data.categories.length);
        console.log(data.categories.map(function (c) { return c.name; }).join(', '));
        // get the atom site category and output the number of rows
        var atom_site = data.getCategory('_atom_site');
        console.log(atom_site.rowCount, 'atoms');
        // sum all values in the _atom_site.Cartn_x column.
        var Cartn_x = atom_site.getColumn('Cartn_x');
        var xSum = 0;
        for (var i = 0, n = atom_site.rowCount; i < n; i++) {
            xSum += Cartn_x.getFloat(i); // for integer values, it is preferred to use .getInteger function instead.
        }
        console.log('Sum of atom X coordinates:', xSum);
    });
}
read_mmCIF('data/1cbs.cif');
function createSampleData() {
    var size = 10;
    var id = new Int32Array(size);
    var token = [];
    var value = new Float32Array(size);
    for (var i = 1; i <= size; i++) {
        id[i - 1] = i;
        token[i - 1] = 'tok_' + i;
        value[i - 1] = Math.sqrt(i);
    }
    return { id: id, token: token, value: value };
}
var E = Tools.Binary.Encoder;
function createMyCategoryCategory(ctx) {
    var fields = [
        { name: 'id', string: function (data, i) { return data.id[i].toString(); }, number: function (data, i) { return data.id[i]; }, typedArray: Int32Array, encoder: E.by(E.delta).and(E.runLength).and(E.integerPacking) },
        { name: 'token', string: function (data, i) { return data.token[i]; } },
        { name: 'value', string: function (data, i) { return '' + Math.round(1000 * data.value[i]) / 1000; }, number: function (data, i) { return data.value[i]; }, typedArray: Float32Array, encoder: E.by(E.fixedPoint(1000)).and(E.delta).and(E.integerPacking) },
    ];
    return {
        data: ctx.data,
        count: ctx.data.id.length,
        desc: {
            name: '_my_category',
            fields: fields
        }
    };
}
function createFileAndWriter(filename) {
    var file = fs.createWriteStream(filename, { encoding: 'utf8' });
    return {
        file: file,
        writer: {
            writeString: function (s) { return file.write(s); },
            writeBinary: function (b) { return file.write(new Buffer(b)); }
        }
    };
}
function create_CIF_and_BinarCIF() {
    var data = createSampleData();
    var ctx = { data: data };
    var textWriter = new Tools.Text.Writer('Example');
    var binaryWriter = new Tools.Binary.Writer('Example', 'Example Writer');
    textWriter.writeCategory(createMyCategoryCategory, [ctx]);
    binaryWriter.writeCategory(createMyCategoryCategory, [ctx]);
    textWriter.encode();
    binaryWriter.encode();
    // in a read app this should of course be in a try/finally block
    var cif = createFileAndWriter('data/example.cif');
    textWriter.flush(cif.writer);
    cif.file.end();
    var bcif = createFileAndWriter('data/example.bcif');
    binaryWriter.flush(bcif.writer);
    bcif.file.end();
    console.log('---------------------');
    console.log('Written example CIF and BinaryCIF.');
}
create_CIF_and_BinarCIF();
/**
 * Read the created BinaryCIF file and write out its content.
 */
function read_sample_BinaryCIF() {
    fs.readFile('data/example.bcif', function (err, buffer) {
        if (err) {
            console.log(err);
            return;
        }
        var input = new Uint8Array(buffer.length);
        for (var i = 0, n = buffer.length; i < n; i++) {
            input[i] = buffer[i];
        }
        var parsed = Tools.Binary.parse(input.buffer);
        // check if the parsing result in an error
        if (parsed.isError) {
            console.log(parsed.toString());
            return;
        }
        console.log('---------------------');
        console.log('example.bcif content:');
        var data = parsed.result.dataBlocks[0];
        console.log('ID', data.header);
        for (var _i = 0, _a = data.categories; _i < _a.length; _i++) {
            var cat = _a[_i];
            console.log(cat.name);
            console.log(cat.columnNames.join('\t'));
            for (var i = 0; i < cat.rowCount; i++) {
                var row = '';
                for (var _b = 0, _c = cat.columnNames; _b < _c.length; _b++) {
                    var colName = _c[_b];
                    // using "getString" on each value is for printing purposes only.
                    // normally, getInteger / getFloat would be preferable.
                    row += cat.getColumn(colName).getString(i) + '\t';
                }
                console.log(row);
            }
        }
    });
}
read_sample_BinaryCIF();
