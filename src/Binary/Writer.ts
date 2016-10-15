/*
 * Copyright (c) 2016 David Sehnal, licensed under MIT License, See LICENSE file for more info.
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
        let mask = new Uint8Array(totalCount);
        let presence = field.presence;
        let getter = field.number ? field.number : field.string;
        let allPresent = true;

        let offset = 0;
        for (let _d of data) {
            let d = _d.data;
            for (let i = 0, _b = _d.count; i < _b; i++) {
                let p: ValuePresence;
                if (presence && (p = presence(d, i)) !== ValuePresence.Present) {
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
        let encoder = field.encoder ? field.encoder : Encoder.by(Encoder.stringArray);
        let encoded = encoder.encode(array);

        let maskData: EncodedData | undefined = void 0;

        if (!allPresent) {
            let maskRLE = Encoder.by(Encoder.runLength).and(Encoder.int32).encode(mask);
            if (maskRLE.data.length < mask.length) {
                maskData = maskRLE;
            } else {
                maskData = Encoder.by(Encoder.uint8).encode(mask);
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
        private dataBlock: EncodedDataBlock;
        private encodedData: Uint8Array;

        writeCategory(category: CategoryProvider, contexts?: Context[]) {
            if (!this.data) {
                throw new Error('The writer contents have already been encoded, no more writing.');
            }

            let src = !contexts || !contexts.length ? [category(<any>void 0)] : contexts.map(c => category(c));
            let categories = src.filter(c => c && c.count > 0) as CategoryInstance<any>[];
            if (!categories.length) return;
            let count = categories.reduce((a, c) => a + c!.count, 0);
            if (!count) return;

            let first = categories[0]!;
            let cat: EncodedCategory = { name: first.desc.name, columns: [], rowCount: count };
            let data = categories.map(c => ({ data: c.data, count: c.count }));
            for (let f of first.desc.fields) {
                cat.columns.push(encodeField(f, data, count));
            }
            this.dataBlock.categories.push(cat);
        }

        encode() {
            this.encodedData = MessagePack.encode(this.data);
            this.data = <any>null;
            this.dataBlock = <any>null;
        }

        flush(stream: OutputStream) {
            stream.writeBinary(this.encodedData);
        }

        constructor(header: string, encoder: string) {
            this.dataBlock = {
                header: (header || '').replace(/[ \n\t]/g, '').toUpperCase(),
                categories: []
            };
            this.data = {
                encoder,
                version: Binary.VERSION,
                dataBlocks: [this.dataBlock]
            };
        }
    }
}