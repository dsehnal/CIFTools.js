/*
 * Copyright (c) 2016 - now David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools.Utils {

    const __paddingSpaces: string[] = [];
    (function () {
        let s = '';
        for (let i = 0; i < 512; i++) {
            __paddingSpaces[i] = s;
            s = s + ' ';
        }
    })();

    export interface StringWriter {
        chunkData: string[];
        chunkOffset: number;
        chunkCapacity: number;
        data: string[];
    }

    export namespace StringWriter {
        export function create(chunkCapacity = 512): StringWriter {
            return {
                chunkData: [],
                chunkOffset: 0,
                chunkCapacity,
                data: []
            };
        }

        export function asString(writer: StringWriter) {
            if (!writer.data.length) {
                if (writer.chunkData.length === writer.chunkOffset) return writer.chunkData.join('');
                return writer.chunkData.splice(0, writer.chunkOffset).join('');
            }

            if (writer.chunkOffset > 0) {
                writer.data[writer.data.length] = writer.chunkData.splice(0, writer.chunkOffset).join('');
            }

            return writer.data.join('');
        }

        export function writeTo(writer: StringWriter, stream: OutputStream) {
            finalize(writer);

            for (let s of writer.data) {
                stream.writeString(s);
            }
        }

        function finalize(writer: StringWriter) {
            if (writer.chunkOffset > 0) {
                if (writer.chunkData.length === writer.chunkOffset) writer.data[writer.data.length] = writer.chunkData.join('');
                else writer.data[writer.data.length] = writer.chunkData.splice(0, writer.chunkOffset).join('');
                writer.chunkOffset = 0;
            }
        }

        export function newline(writer: StringWriter) {
            write(writer, '\n');
        }

        export function whitespace(writer: StringWriter, len: number) {
            write(writer, __paddingSpaces[len]);
        }

        export function write(writer: StringWriter, val: string) {
            if (val === undefined || val === null) {
                return;
            }

            if (writer.chunkOffset === writer.chunkCapacity) {
                writer.data[writer.data.length] = writer.chunkData.join('');
                writer.chunkOffset = 0;
            }

            writer.chunkData[writer.chunkOffset++] = val;
        }

        export function writeSafe(writer: StringWriter, val: string) {
            if (writer.chunkOffset === writer.chunkCapacity) {
                writer.data[writer.data.length] = writer.chunkData.join('');
                writer.chunkOffset = 0;
            }

            writer.chunkData[writer.chunkOffset++] = val;
        }

        export function writePadLeft(writer: StringWriter, val: string, totalWidth: number) {
            if (val === undefined || val === null) {
                write(writer, __paddingSpaces[totalWidth]);
            }

            let padding = totalWidth - val.length;
            if (padding > 0) write(writer, __paddingSpaces[padding]);
            write(writer, val);
        }

        export function writePadRight(writer: StringWriter, val: string, totalWidth: number) {
            if (val === undefined || val === null) {
                write(writer, __paddingSpaces[totalWidth]);
            }

            let padding = totalWidth - val.length;
            write(writer, val);
            if (padding > 0) write(writer, __paddingSpaces[padding]);
        }


        export function writeInteger(writer: StringWriter, val: number) {
            write(writer, '' + val);
        }

        export function writeIntegerPadLeft(writer: StringWriter, val: number, totalWidth: number) {
            let s = '' + val;
            let padding = totalWidth - s.length;
            if (padding > 0) write(writer, __paddingSpaces[padding]);
            write(writer, s);
        }

        export function writeIntegerPadRight(writer: StringWriter, val: number, totalWidth: number) {
            let s = '' + val;
            let padding = totalWidth - s.length;
            write(writer, s);
            if (padding > 0) write(writer, __paddingSpaces[padding]);
        }

        /**
         * @example writeFloat(123.2123, 100) -- 2 decim
         */
        export function writeFloat(writer: StringWriter, val: number, precisionMultiplier: number) {
            write(writer, '' + Math.round(precisionMultiplier * val) / precisionMultiplier)
        }

        export function writeFloatPadLeft(writer: StringWriter, val: number, precisionMultiplier: number, totalWidth: number) {
            let s = '' + Math.round(precisionMultiplier * val) / precisionMultiplier;
            let padding = totalWidth - s.length;
            if (padding > 0) write(writer, __paddingSpaces[padding]);
            write(writer, s);
        }

        export function writeFloatPadRight(writer: StringWriter, val: number, precisionMultiplier: number, totalWidth: number) {
            let s = '' + Math.round(precisionMultiplier * val) / precisionMultiplier;
            let padding = totalWidth - s.length;
            write(writer, s);
            if (padding > 0) write(writer, __paddingSpaces[padding]);
        }
    }
}