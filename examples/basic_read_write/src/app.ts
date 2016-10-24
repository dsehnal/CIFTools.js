
import * as fs from 'fs'
const Tools = require('../../../build/CIFTools') as (typeof CIFTools);
// if CIFTools.js is present in node_modules it is possible to use
// import * as Tools from 'CIFTools'

console.log('Version: ', Tools.VERSION);

/**
 * Reading CIF files.
 */

function read_mmCIF(filename: string) {
    fs.readFile(filename, 'UTF8', (err, input) => {
        console.log('---------------------');

        if (err) {
            console.log(err);
            return;
        }

        let parsed = Tools.Text.parse(input);

        // check if the parsing result in an error
        if (parsed.isError) {
            console.log(parsed.toString());
            return;
        }

        // get the first data block from the file
        let data = parsed.result.dataBlocks[0];

        // get the _entry.id value:
        console.log('ID:', data.getCategory('_entry').getColumn('id').getString(0));

        // write out the categories
        console.log('Categories', data.categories.length);
        console.log(data.categories.map(c => c.name).join(', '));

        // get the atom site category and output the number of rows
        let atom_site = data.getCategory('_atom_site');
        console.log(atom_site.rowCount, 'atoms');

        // sum all values in the _atom_site.Cartn_x column.
        let Cartn_x = atom_site.getColumn('Cartn_x');
        let xSum = 0;
        for (let i = 0, n = atom_site.rowCount; i < n; i++) {
            xSum += Cartn_x.getFloat(i); // for integer values, it is preferred to use .getInteger function instead.
        }

        console.log('Sum of atom X coordinates:', xSum);
    });
}

read_mmCIF('data/1cbs.cif');

/**
 * Writing CIF files.
 */


interface Data {
    id: Int32Array,
    token: string[],
    value: Float32Array
}

function createSampleData() {
    const size = 10;

    let id = new Int32Array(size);
    let token: string[] = [];
    let value = new Float32Array(size);

    for (let i = 1; i <= size; i++) {
        id[i - 1] = i;
        token[i - 1] = 'tok_' + i;
        value[i - 1] = Math.sqrt(i);
    }

    return <Data>{ id, token, value };
}

interface Context {
    data: Data
}

const E = Tools.Binary.Encoder

function createMyCategoryCategory(ctx: Context) {
    type T = typeof ctx.data;

    let fields: CIFTools.FieldDesc<T>[] = [
        { name: 'id', string: (data, i) => data.id[i].toString(), number: (data, i) => data.id[i], typedArray: Int32Array, encoder: E.by(E.delta).and(E.runLength).and(E.integerPacking) },
        { name: 'token', string: (data, i) => data.token[i] },
        { name: 'value', string: (data, i) => '' + Math.round(1000 * data.value[i]) / 1000, number: (data, i) => data.value[i], typedArray: Float32Array, encoder: E.by(E.fixedPoint(1000)).and(E.delta).and(E.integerPacking) },
    ];

    return <CIFTools.CategoryInstance<T>>{
        data: ctx.data,
        count: ctx.data.id.length,
        desc: {
            name: '_my_category',
            fields
        }
    };
}

function createFileAndWriter(filename: string) {
    let file = fs.createWriteStream(filename, { encoding: 'utf8' });
    return {
        file,
        writer: <CIFTools.OutputStream>{
            writeString: (s: string) => file.write(s),
            writeBinary: (b: Uint8Array) => file.write(new Buffer(b))
        }
    }
}

function create_CIF_and_BinarCIF() {
    let data = createSampleData();
    let ctx = <Context>{ data };

    let textWriter = new Tools.Text.Writer();
    let binaryWriter = new Tools.Binary.Writer('Example Writer');

    textWriter.startDataBlock('Example');
    binaryWriter.startDataBlock('Example');

    textWriter.writeCategory(createMyCategoryCategory, [ctx]);
    binaryWriter.writeCategory(createMyCategoryCategory, [ctx]);

    textWriter.encode();
    binaryWriter.encode();

    // in a read app this should of course be in a try/finally block
    let cif = createFileAndWriter('data/example.cif');
    textWriter.flush(cif.writer);
    cif.file.end();

    let bcif = createFileAndWriter('data/example.bcif');
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
    fs.readFile('data/example.bcif', (err, buffer) => {
        if (err) {
            console.log(err);
            return;
        }

        let input = new Uint8Array(buffer.length);
        for (let i = 0, n = buffer.length; i < n; i++) {
            input[i] = buffer[i];
        }

        let parsed = Tools.Binary.parse(input.buffer);

        // check if the parsing result in an error
        if (parsed.isError) {
            console.log(parsed.toString());
            return;
        }

        console.log('---------------------');
        console.log('example.bcif content:');

        let data = parsed.result.dataBlocks[0];
        console.log('ID', data.header);

        for (let cat of data.categories) {
            console.log(cat.name);
            console.log(cat.columnNames.join('\t'));
            for (let i = 0; i < cat.rowCount; i++) {
                let row = '';
                for (let colName of cat.columnNames) {
                    // using "getString" on each value is for printing purposes only.
                    // normally, getInteger / getFloat would be preferable.
                    row += cat.getColumn(colName).getString(i) + '\t';
                }
                console.log(row);
            }
        }
    })
}

read_sample_BinaryCIF();