/*
 * Copyright (c) 2016 David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools.Binary {
    "use strict";

    export function parse(data: ArrayBuffer): ParserResult<CIFTools.File> {
        try {
            let array = new Uint8Array(data);
            let unpacked = MessagePack.decode(array);
            let file = new File(unpacked);
            return ParserResult.success(file);
        } catch (e) {
            return ParserResult.error<CIFTools.File>('' + e);
        }
    }
}