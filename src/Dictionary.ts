/*
 * Copyright (c) 2016 David Sehnal, licensed under MIT License, See LICENSE file for more info.
 */

namespace CIFTools {
    "use strict";

    /**
     * Represents a "CIF FILE" with one or more data blocks.
     */
    export interface File {
        dataBlocks: DataBlock[];
        toJSON(): any;
    }

    /**
     * Represents a single CIF data block that contains categories and possibly 
     * additonal data such as save frames.
     * 
     * Example:
     * data_HEADER
     * _category1.field1
     * ...
     * ...
     * _categoryN.fieldN
     */
    export interface DataBlock {
        header: string;
        categories: Category[];
        additionalData: { [name: string]: any };
        getCategory(name: string): Category;
        toJSON(): any;
    }

    /**
     * Represents that CIF category with multiple fields represented as columns.
     * 
     * Example:
     * _category.field1
     * _category.field2
     * ...
     */
    export interface Category {
        name: string;
        rowCount: number;
        columnCount: number;
        columnNames: string[];

        /**
         * If a field with the given name is not present, returns UndefinedColumn. 
         * 
         * Columns are accessed by their field name only, i.e.
         * _category.field is accessed by
         * category.getColumn('field')
         */
        getColumn(name: string): Column;

        toJSON(): any;
    }

    export const enum ValuePresence {
        Present = 0,
        NotSpecified = 1,
        Unknown = 2
    }

    /**
     * A columns represents a single field of a CIF category.
     */
    export interface Column {
        isDefined: boolean;

        getString(row: number): string | null;
        getInteger(row: number): number;
        getFloat(row: number): number;

        getValuePresence(row: number): ValuePresence;

        areValuesEqual(rowA: number, rowB: number): boolean;
        stringEquals(row: number, value: string): boolean;
    }

    /**
     * Represents a column that is not present.
     */
    class _UndefinedColumn implements Column {
        isDefined = false;
        getString(row: number): string | null { return null; };
        getInteger(row: number): number { return 0; }
        getFloat(row: number): number { return 0.0; }
        getValuePresence(row: number): ValuePresence { return ValuePresence.NotSpecified; }
        areValuesEqual(rowA: number, rowB: number): boolean { return true; }
        stringEquals(row: number, value: string): boolean { return value === null; }
    }
    export const UndefinedColumn = <Column>new _UndefinedColumn();

    /**
     * Helper functions for categoies.
     */
    export namespace Category {
        /**
         * Extracts a matrix from a category from a specified rowIndex.
         * 
         * _category.matrix[1][1] v11
         * ....
         * ....
         * _category.matrix[rows][cols] vRowsCols
         */
        export function getMatrix(category: Category, field: string, rows: number, cols: number, rowIndex: number) {
            let ret: number[][] = [];
            for (let i = 1; i <= rows; i++) {
                let row: number[] = [];
                for (let j = 1; j <= cols; j++) {
                    row[j - 1] = category.getColumn(field + "[" + i + "][" + j + "]").getFloat(rowIndex);
                }
                ret[i - 1] = row;
            }
            return ret;
        }

        /**
         * Extracts a vector from a category from a specified rowIndex.
         * 
         * _category.matrix[1][1] v11
         * ....
         * ....
         * _category.matrix[rows][cols] vRowsCols
         */
        export function getVector(category: Category, field: string, rows: number, cols: number, rowIndex: number): number[] {
            let ret: number[] = [];
            for (let i = 1; i <= rows; i++) {
                ret[i - 1] = category.getColumn(field + "[" + i + "]").getFloat(rowIndex);
            }
            return ret;
        }
    }
}