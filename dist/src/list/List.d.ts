import { IList } from "./IList";
export declare class List<T> implements IList<T> {
    private count;
    private data;
    constructor(data?: T[]);
    add(item: T): void;
    clear(): void;
    contains(item: T): boolean;
    exists(predicate: (item: T) => boolean): boolean;
    find(predicate: (item: T) => boolean): T | null;
    findAll(predicate: (item: T) => boolean): List<T>;
    findIndex(predicate: (item: T) => boolean, startIndex?: number, count?: number): number;
    findLast(predicate: (item: T) => boolean): T;
    findLastIndex(predicate: (item: T) => boolean, startIndex?: number, count?: number): number;
    forEach(action: (item: T) => void): void;
    get(index: number): T;
    indexOf(item: T): number;
    insert(index: number, item: T): void;
    isEmpty(): boolean;
    lastIndexOf(item: T): number;
    remove(item: T): boolean;
    removeAll(predicate: (value: T) => boolean): number;
    removeAt(index: number): void;
    removeRange(index: number, count: number): void;
    reverse(): void;
    set(index: number, item: T): void;
    sort(comparer?: (e1: T, e2: T) => number): void;
    toArray(): T[];
    readonly Count: number;
}
