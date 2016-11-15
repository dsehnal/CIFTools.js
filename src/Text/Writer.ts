/*
 * Copyright (c) 2016 David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools.Text {
    "use strict";

    import StringWriter = Utils.StringWriter;

    export class Writer<Context> implements CIFTools.Writer<Context> {
        private writer = StringWriter.create();
        private encoded = false;
        private dataBlockCreated = false;

        startDataBlock(header: string) {
            this.dataBlockCreated = true;
            StringWriter.write(this.writer, `data_${(header || '').replace(/[ \n\t]/g, '').toUpperCase()}\n#\n`);
        }

        writeCategory(category: CategoryProvider, contexts?: Context[]) {
            if (this.encoded) {
                throw new Error('The writer contents have already been encoded, no more writing.');
            }

            if (!this.dataBlockCreated) {
                throw new Error('No data block created.');
            }

            let src = !contexts || !contexts.length ? [category(<any>void 0)] : contexts.map(c => category(c));
            let data = src.filter(c => c && c.count > 0) as CategoryInstance<any>[];
            if (!data.length) return;
            let count = data.reduce((a, c) => a + (c.count === void 0 ? 1 : c.count), 0);
            if (!count) return;

            else if (count === 1) {
                writeCifSingleRecord(data[0]!, this.writer);
            } else {
                writeCifLoop(data, this.writer);
            }
        }

        encode() {
            this.encoded = true;
        }

        flush(stream: OutputStream) {
            StringWriter.writeTo(this.writer, stream);
        }

        constructor() {
        }
    }

    function isMultiline(value: string) {
        return !!value && value.indexOf('\n') >= 0;
    }

    function writeCifSingleRecord(category: CategoryInstance<any>, writer: StringWriter) {
        let fields = category.desc.fields;
        let data = category.data;
        let width = fields.reduce((w, s) => Math.max(w, s.name.length), 0) + category.desc.name.length + 5;

        for (let f of fields) {
            StringWriter.writePadRight(writer, `${category.desc.name}.${f.name}`, width);

            let presence = f.presence;
            let p: ValuePresence;
            if (presence && (p = presence(data, 0)) !== ValuePresence.Present) {
                if (p === ValuePresence.NotSpecified) writeNotSpecified(writer);
                else writeUnknown(writer);
            } else {
                let val = f.string!(data, 0) !;
                if (isMultiline(val)) {
                    writeMultiline(writer, val);
                    StringWriter.newline(writer);
                } else {
                    writeChecked(writer, val);
                }
            }
            StringWriter.newline(writer);
        }
        StringWriter.write(writer, '#\n');
    }

    function writeCifLoop(categories: CategoryInstance<any>[], writer: StringWriter) {
        writeLine(writer, 'loop_');

        let first = categories[0];
        let fields = first.desc.fields;
        for (let f of fields) {
            writeLine(writer, `${first.desc.name}.${f.name}`);
        }

        for (let category of categories) {
            let data = category.data;
            let count = category.count;
            for (let i = 0; i < count; i++) {
                for (let f of fields) {

                    let presence = f.presence;
                    let p: ValuePresence;
                    if (presence && (p = presence(data, i)) !== ValuePresence.Present) {
                        if (p === ValuePresence.NotSpecified) writeNotSpecified(writer);
                        else writeUnknown(writer);
                    } else {
                        let val = f.string!(data, i) !;
                        if (isMultiline(val)) {
                            writeMultiline(writer, val);
                            StringWriter.newline(writer);
                        } else {
                            writeChecked(writer, val);
                        }
                    }
                }
                StringWriter.newline(writer);
            }
        }
        StringWriter.write(writer, '#\n');
    }

    function writeLine(writer: StringWriter, val: string) {
        StringWriter.write(writer, val);
        StringWriter.newline(writer);
    }

    function writeInteger(writer: StringWriter, val: number) {
        StringWriter.writeSafe(writer, '' + val + ' ');
    }

    /**
        * eg writeFloat(123.2123, 100) -- 2 decim
        */
    function writeFloat(writer: StringWriter, val: number, precisionMultiplier: number) {
        StringWriter.writeSafe(writer, '' + Math.round(precisionMultiplier * val) / precisionMultiplier + ' ')
    }

    /**
        * Writes '. '
        */
    function writeNotSpecified(writer: StringWriter) {
        StringWriter.writeSafe(writer, '. ');
    }

    /**
        * Writes '? '
        */
    function writeUnknown(writer: StringWriter) {
        StringWriter.writeSafe(writer, '? ');
    }

    function writeChecked(writer: StringWriter, val: string) {

        if (!val) {
            StringWriter.writeSafe(writer, '. ');
            return;
        }

        let escape = false, escapeCharStart = '\'', escapeCharEnd = '\' ';
        let hasWhitespace = false; 
        let hasSingle = false;
        let hasDouble = false;
        for (let i = 0, _l = val.length - 1; i < _l; i++) {
            let c = val.charCodeAt(i);

            switch (c) {
                case 9: hasWhitespace = true; break; // \t
                case 10: // \n
                    StringWriter.writeSafe(writer, '\n;' + val);
                    StringWriter.writeSafe(writer, '\n; ')
                    return;
                case 32: hasWhitespace = true; break; // ' '
                case 34: // "
                    if (hasSingle) {
                        StringWriter.writeSafe(writer, '\n;' + val);
                        StringWriter.writeSafe(writer, '\n; ');
                        return;
                    }

                    hasDouble = true;
                    escape = true;
                    escapeCharStart = '\'';
                    escapeCharEnd = '\' ';
                    break;                                
                case 39: // '
                    if (hasDouble) {
                        StringWriter.writeSafe(writer, '\n;' + val);
                        StringWriter.writeSafe(writer, '\n; ');
                        return;
                    }

                    escape = true;
                    hasSingle = true;
                    escapeCharStart = '"';
                    escapeCharEnd = '" ';
                    break;
            }
        }

        let fst = val.charCodeAt(0);
        if (!escape && (fst === 35 /* # */ || fst === 59 /* ; */ || hasWhitespace)) {
            escapeCharStart = '\'';
            escapeCharEnd = '\' ';
            escape = true;
        }

        if (escape) {
            StringWriter.writeSafe(writer, escapeCharStart + val + escapeCharEnd);
        } else {
            StringWriter.write(writer, val);
            StringWriter.writeSafe(writer, ' ');
        }
    }

    function writeMultiline(writer: StringWriter, val: string) {
        StringWriter.writeSafe(writer, '\n;' + val);
        StringWriter.writeSafe(writer, '\n; ');
    }

    function writeToken(writer: StringWriter, data: string, start: number, end: number) {
        let escape = false, escapeCharStart = '\'', escapeCharEnd = '\' ';
        for (let i = start; i < end - 1; i++) {
            let c = data.charCodeAt(i);

            switch (c) {
                case 10: // \n
                    StringWriter.writeSafe(writer, '\n;' + data.substring(start, end));
                    StringWriter.writeSafe(writer, '\n; ')
                    return;
                case 34: // "
                    escape = true;
                    escapeCharStart = '\'';
                    escapeCharEnd = '\' ';
                    break;
                case 39: // '
                    escape = true;
                    escapeCharStart = '"';
                    escapeCharEnd = '" ';
                    break;
            }
        }

        if (!escape && data.charCodeAt(start) === 59 /* ; */) {
            escapeCharStart = '\'';
            escapeCharEnd = '\' ';
            escape = true;
        }

        if (escape) {
            StringWriter.writeSafe(writer, escapeCharStart + data.substring(start, end));
            StringWriter.writeSafe(writer, escapeCharStart);
        } else {
            StringWriter.write(writer, data.substring(start, end));
            StringWriter.writeSafe(writer, ' ');
        }
    }
}