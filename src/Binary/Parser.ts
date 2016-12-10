/*
 * Copyright (c) 2016 David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools.Binary {
    "use strict";

    function checkVersions(min: number[], current: number[]) {
        for (let i = 0; i < 2; i++) {
            if (min[i] > current[i]) return false;
        }
        return true;
    }

    export function parse(data: ArrayBuffer): ParserResult<CIFTools.File> {
        const minVersion = [0, 3];

        try {
            let array = new Uint8Array(data);
            let unpacked = MessagePack.decode(array);
            if (!checkVersions(minVersion, unpacked.version.match(/(\d)\.(\d)\.\d/).slice(1))) {
                return ParserResult.error<CIFTools.File>(`Unsupported format version. Current ${unpacked.version}, required ${minVersion.join('.')}.`);
            }
            let file = new File(unpacked);
            return ParserResult.success(file);
        } catch (e) {
            return ParserResult.error<CIFTools.File>('' + e);
        }
    }
}