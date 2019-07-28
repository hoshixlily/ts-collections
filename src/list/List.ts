import { IList } from "./IList";
import { ArgumentNullException } from "../exceptions/ArgumentNullException";
import { ArgumentOutOfRangeException } from "../exceptions/ArgumentOutOfRangeException";
import { ArgumentException } from "../exceptions/ArgumentException";

export class List<T> implements IList<T>, IterableIterator<T> {
    private count: number = 0;
    private data: T[] = [];
    private iteratorIndex: number = 0;
    public constructor(data?: T[]){
        if(data) {
            this.data = [...data];
            this.count = this.data.length;
        }
    }
    public add(item: T) {
        this.data.push(item);
        this.count++;
    }
    public clear() {
        this.data.length = 0;
        this.count = 0;
    }
    public contains(item: T): boolean {
        return  this.indexOf(item) > -1;
    }
    public copyTo(array: T[], arrayIndex: number): void {
        if (!array) {
            throw new ArgumentNullException("array is null.");
        }
        if (arrayIndex < 0) {
            throw new ArgumentOutOfRangeException("array index is less than 0.");
        }
        let index = arrayIndex;
        for(const item of this.data) {
            array.splice(index, 0, item);
            index++;
        }
    }
    public exists(predicate: (item: T) => boolean): boolean {
        if (!predicate) {
            throw new ArgumentNullException("predicate is null.");
        }
        return this.data.some(predicate);
    }
    public find(predicate: (item: T) => boolean): T {
        const item = this.data.find(predicate);
        return item || null;
    }
    public findAll(predicate: (item: T) => boolean): List<T> {
        const foundData = this.data.filter(predicate);
        return new List<T>(foundData);
    }
    public findIndex(predicate: (item: T) => boolean, startIndex?: number, count?: number): number {
        if (!predicate) {
            throw new ArgumentNullException("predicate is null.");
        }
        if (startIndex < 0 || startIndex >= this.Count) {
            throw new ArgumentOutOfRangeException("startIndex is not a valid index.");
        }
        if (count < 0) {
            throw new ArgumentOutOfRangeException("count is less than 0.");
        }
        if (startIndex+count > this.Count) {
            throw new ArgumentOutOfRangeException("startIndex and count do not specify a valid section in the list.");
        }
        startIndex = startIndex || 0;
        count      = count || this.Count;
        let found  = false;
        let foundIndex = -1;
        for (let ix = startIndex; ix <= count; ++ix) {
            found = predicate(this.data[ix]);
            if (found) {
                foundIndex = ix;
                break;
            }
        }
        return foundIndex;
    }
    public findLast(predicate: (item: T) => boolean): T {
        if (!predicate) {
            throw new ArgumentNullException("predicate is null.");
        }
        let found = false;
        let foundItem: T = null;
        for (let ix = this.data.length - 1; ix >= 0; --ix) {
            const elem = this.data[ix];
            found = predicate(elem);
            if (found) {
                foundItem = elem;
                break;
            }
        }
        return foundItem;
    }
    public findLastIndex(predicate: (item: T) => boolean, startIndex?: number, count?: number): number {
        if (!predicate) {
            throw new ArgumentNullException("predicate is null.");
        }
        if (startIndex < 0 || startIndex >= this.Count) {
            throw new ArgumentOutOfRangeException("startIndex is not a valid index.");
        }
        if (count < 0) {
            throw new ArgumentOutOfRangeException("count is less than 0.");
        }
        if (startIndex+count > this.Count) {
            throw new ArgumentOutOfRangeException("startIndex and count do not specify a valid section in the list.");
        }
        startIndex = startIndex || 0;
        count      = count || this.Count;
        let found  = false;
        let foundIndex = -1;
        for (let ix = startIndex+count; ix >= startIndex; --ix) {
            found = predicate(this.data[ix]);
            if (found) {
                foundIndex = ix;
                break;
            }
        }
        return foundIndex;
    }
    public forEach(action: (item: T) => void): void {
        this.data.forEach(d => action(d));
    }
    public get(index: number): T {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index > this.Count) {
            throw new ArgumentOutOfRangeException(`index is greater than ${this.Count}.`);
        }
        return this.data[index];
    }
    public indexOf(item: T): number {
        return this.data.findIndex(d => d === item);
    }
    public insert(index: number, item: T) {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index > this.Count) {
            throw new ArgumentOutOfRangeException(`index is greater than ${this.Count}.`);
        }
        this.data.splice(index, 0, item);
        this.count++;
    }
    public lastIndexOf(item: T): number {
        return this.data.lastIndexOf(item);
    }
    public remove(item: T): boolean {
        const index = this.data.findIndex(d => d === item);
        if (index === -1) return false;
        this.removeAt(index);
        return true;
    }
    public removeAll(predicate: (value: T) => boolean): number {
        const preCount = this.Count;
        this.data = this.data.filter(d => !predicate(d));
        this.count = this.data.length;
        return preCount - this.count;
    }
    public removeAt(index: number): void {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index >= this.Count) {
            throw new ArgumentOutOfRangeException(`index is equal to or greater than ${this.Count}.`);
        }
        this.data.splice(index, 1);
        this.count--;
    }
    public removeRange(index: number, count: number): void {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (count < 0) {
            throw new ArgumentOutOfRangeException("count is less than 0.");
        }
        if (index+count > this.data.length) {
            throw new ArgumentException("index and count do not denote a valid range of elements in the list.");
        }
        let removedCount = 0;
        while(removedCount < count) {
            this.removeAt(index);
            removedCount++;
        }
    }
    public reverse(): void {
        this.data.reverse();
    }
    public set(index: number, item: T): void {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index > this.Count) {
            throw new ArgumentOutOfRangeException(`index is greater than ${this.Count}.`);
        }
        this.data[index] = item;
    }
    public sort(): void {
        const create = <T>(ctor: { new(): T }) => new ctor();
        if (create(List) instanceof Number) {

        }
    }
    public toArray(): T[] {
        return [...this.data];
    }

    public next(): IteratorResult<T> {
        if (this.iteratorIndex >= this.Count) {
            this.iteratorIndex = 0;
            return { done: true, value: null };
        }
        return { done: false, value: this.data[this.iteratorIndex++] };
    }
    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    public get Count() { return this.count; }
}