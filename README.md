[![License](http://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://github.com/dsehnal/CIFTools.js/blob/master/LICENSE)

What is CIFTools.js
=======

**CIFTools.js** is a library for handling CIF files as defined by the specification
[here](http://www.iucr.org/resources/cif/spec/version1.1/cifsyntax).
It provides tools for reading and writing CIF files. Additionally, it supports an efficient
binary encoding of CIF, called BinaryCIF.

Getting Started
========

**CIFTools.js** can be used both in the browser and on server (with Node.js). 
It is recommended to use [TypeScript](http://www.typescriptlang.org/) for building apps based 
on CIFTools.js (or any other non-trivial JavaScript app for that matter), 
because you will get code completion and type checking.

Check the `examples` directory for several basic use cases. For a more complicated use
case, please check the mmCIF reader in the [LiteMol](https://github.com/dsehnal/LiteMol) project.

Short example
--------

In browser, include the library:

```HTML
<script src="CIFTools.js" />
```

In Node.js:

```JavaScript
var CIFTools = require('./CIFTools'); // or just 'CIFTools' if you place it in the /node_modules directory. 
```

To parse text CIF, use:

```JavaScript
var parsed = CIFTools.Text.parse(inputString);
```

For BinaryCIF, use:

```JavaScript
var parsed = CIFTools.Binary.parse(inputArrayBuffer);
```

To get data from the result:

```JavaScript
if (parsed.isError) {
    // report error:
    console.log(parsed.toString());
    return;
}

var data = parsed.result.dataBlocks[0];
var _atom_site = data.getCategory('_atom_site');

var Cartn_x = _atom_site.getColumn('Cartn_x');

// gets a float value from the 1st row
var floatValue = Cartn_x.getFloat(0);

// the last residue sequence id
var intValue = _atom_site.getColumn('label_seq_id').getInteger(_atom_site.rowCount - 1);

var stringValue = data.getCategory('_entry').getColumn('id').getString(0);
```

Building
--------

Install Node.js (tested on version 6.6.0).

    npm install -g gulp
    npm install
    gulp

License
=======

This project is licensed under the MIT license. See the `LICENSE` file for more info.

Support
=======

If you have any questions, do not hesitate to email the author or use the GitHub forum. 