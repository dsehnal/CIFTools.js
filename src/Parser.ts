/*
 * Copyright (c) 2016 David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools {
    "use strict";

    export type ParserResult<T> = ParserSuccess<T> | ParserError

    export namespace ParserResult {
        export function error<T>(message: string, line = -1): ParserResult<T> {
            return new ParserError(message, line);
        }

        export function success<T>(result: T, warnings: string[] = []): ParserResult<T> {
            return new ParserSuccess<T>(result, warnings);
        }
    }

    export class ParserError {
        isError: true = true;

        toString() {
            if (this.line >= 0) {
                return `[Line ${this.line}] ${this.message}`;
            }
            return this.message;
        }

        constructor(
            public message: string,
            public line: number) {
        }
    }

    export class ParserSuccess<T> {
        isError: false = false;

        constructor(public result: T,
            public warnings: string[]) { }
    }
}