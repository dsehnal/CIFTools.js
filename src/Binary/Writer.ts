/*
 * Copyright (c) 2016 - now David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools.Binary {
    "use strict";

    function encodeField(field: FieldDesc<any>, data: { data: any, count: number }[], totalCount: number): EncodedColumn {
        let array: any[], isNative = false;
        if (field.typedArray) {
            array = new field.typedArray(totalCount);
        } else {
            isNative = true;
            array = new Array(totalCount);
        }
        const mask = new Uint8Array(totalCount);
        const presence = field.presence;
        const getter = field.number ? field.number : field.string;
        let allPresent = true;

        let offset = 0;
        for (const _d of data) {
            const d = _d.data;
            for (let i = 0, _b = _d.count; i < _b; i++) {
                const p = presence ? presence(data, i) : ValuePresence.Present;
                if (p !== ValuePresence.Present) {
                    mask[offset] = p;
                    if (isNative) array[offset] = null;
                    allPresent = false;
                } else {
                    mask[offset] = ValuePresence.Present;
                    array[offset] = getter!(d, i);
                }
                offset++;
            }
        }
        const encoder = field.encoder ? field.encoder : Encoder.by(Encoder.stringArray);
        const encoded = encoder.encode(array);

        let maskData: EncodedData | undefined = void 0;

        if (!allPresent) {
            const maskRLE = Encoder.by(Encoder.runLength).and(Encoder.byteArray).encode(mask);
            if (maskRLE.data.length < mask.length) {
                maskData = maskRLE;
            } else {
                maskData = Encoder.by(Encoder.byteArray).encode(mask);
            }
        }

        return {
            name: field.name,
            data: encoded,
            mask: maskData
        };
    }

    export class Writer<Context> implements CIFTools.Writer<Context> {
        private data: EncodedFile;
        private dataBlocks: EncodedDataBlock[] = [];
        private encodedData: Uint8Array;

        startDataBlock(header: string) {
            this.dataBlocks.push({
                header: (header || '').replace(/[ \n\t]/g, '').toUpperCase(),
                categories: []
            });
        }

        writeCategory(category: CategoryProvider, contexts?: Context[]) {
            if (!this.data) {
                throw new Error('The writer contents have already been encoded, no more writing.');
            }

            if (!this.dataBlocks.length) {
                throw new Error('No data block created.');
            }

            const src = !contexts || !contexts.length ? [category(<any>void 0)] : contexts.map(c => category(c));
            const categories = src.filter(c => c && c.count > 0) as CategoryInstance<any>[];
            if (!categories.length) return;
            const count = categories.reduce((a, c) => a + c!.count, 0);
            if (!count) return;

            const first = categories[0]!;
            const cat: EncodedCategory = { name: first.desc.name, columns: [], rowCount: count };
            const data = categories.map(c => ({ data: c.data, count: c.count }));
            for (const f of first.desc.fields) {
                cat.columns.push(encodeField(f, data, count));
            }
            this.dataBlocks[this.dataBlocks.length - 1].categories.push(cat);
        }

        encode() {
            this.encodedData = MessagePack.encode(this.data);
            this.data = <any>null;
            this.dataBlocks = <any>null;
        }

        flush(stream: OutputStream) {
            stream.writeBinary(this.encodedData);
        }

        constructor(encoder: string) {
            this.data = {
                encoder,
                version: Binary.VERSION,
                dataBlocks: this.dataBlocks
            };
        }
    }
}