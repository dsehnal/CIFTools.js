/*
 * Copyright (c) 2016 David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools {
    export interface FieldDesc<Data> {
        name: string,
        string?: (data: Data, i: number) => string | null,
        number?: (data: Data, i: number) => number,
        typedArray?: any,
        encoder?: Binary.Encoder,
        presence?: (data: Data, i: number) => ValuePresence
    }

    export interface CategoryDesc<Data> {
        name: string,
        fields: FieldDesc<Data>[]
    }

    export type CategoryInstance<Data> = { data: any, count: number, desc: CategoryDesc<Data> }
    export type CategoryProvider = (ctx: any) => CategoryInstance<any> | undefined

    export type OutputStream = { writeString: (data: string) => boolean, writeBinary: (data: Uint8Array) => boolean }

    export interface Writer<Context> {
        writeCategory(category: CategoryProvider, contexts?: Context[]): void,
        encode(): void;
        flush(stream: OutputStream): void
    }
}