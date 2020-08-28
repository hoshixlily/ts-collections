import {IList} from "./IList";
import {ArgumentNullException} from "../exceptions/ArgumentNullException";
import {ArgumentOutOfRangeException} from "../exceptions/ArgumentOutOfRangeException";
import {ArgumentException} from "../exceptions/ArgumentException";
import {InvalidOperationException} from "../exceptions/InvalidOperationException";
import {IQueue} from "../queue/IQueue";
import {IDeque} from "../queue/IDeque";
import {AbstractCollection} from "../core/AbstractCollection";
import {IEnumerable} from "../core/IEnumerable";
import {IGrouping} from "../core/IGrouping";
import {Grouping} from "../core/Grouping";

export class List<T> extends AbstractCollection<T> implements IList<T>, IQueue<T>, IDeque<T> {
    private data: T[] = [];

    public constructor(data?: T[]) {
        super();
        if (data) {
            this.data = [...data];
        }
    }

    public static from<S>(array: S[]): IList<S> {
        return new List(array);
    }

    public add(item: T): boolean {
        this.data.push(item);
        return true;
    }

    public aggregate<R>(accumulator: (acc: R, item: T) => R, seed?: R): R {
        if (!accumulator) {
            throw new Error("accumulator is null.");
        }
        if (seed == null && this.isEmpty()) {
            throw new Error("Sequence contains no elements.");
        }
        if (seed != null) {
            return this.data.reduce(accumulator, seed);
        } else {
            seed = this.get(0) as unknown as R;
            return this.data.slice(1).reduce(accumulator, seed);
        }
    }

    public all(predicate?: (item: T) => boolean): boolean {
        if (!predicate) {
            return this.size() > 0;
        }
        return this.data.every(predicate);
    }

    public any(predicate?: (item: T) => boolean): boolean {
        if (!predicate) {
            return this.size() > 0;
        }
        return this.data.some(predicate);
    }

    public average(predicate?: (item: T, index?: number) => number): number {
        if (predicate === null) {
            throw new Error("predicate is null.");
        }
        if (this.isEmpty()) {
            throw new Error("Sequence contains no elements.");
        }
        const transformedData = this.data.map((d, dx) => !!predicate ? predicate(d, dx) : d as unknown as number);
        return new List(transformedData).sum(d => d) / transformedData.length;
    }

    public append(item: T): IEnumerable<T> {
        return new List([...this.data, item]);
    }

    public asEnumerable(): IEnumerable<T> {
        return this;
    }

    public clear() {
        this.data.length = 0;
    }

    public concat(enumerable: IEnumerable<T>): IEnumerable<T> {
        return new List([...this.toArray(), ...enumerable.toArray()]);
    }

    public contains(item: T, comparator?: (item1: T, item2: T) => number): boolean {
        if (!comparator) {
            comparator = AbstractCollection.defaultComparator;
        }
        for (const d of this.data) {
            if (comparator(d, item) === 0) {
                return true;
            }
        }
        return false;
    }

    public count(predicate?: (item: T) => boolean): number {
        if (!predicate) {
            return this.size();
        }
        return this.where(predicate).count();
    }

    public defaultIfEmpty(value: T = null): IEnumerable<T> {
        if (this.size() > 0) {
            return this;
        }
        return new List([value]);
    }

    public dequeue(): T {
        if (this.isEmpty()) {
            throw new InvalidOperationException("queue is empty.");
        }
        const item = this.data[0];
        this.data.splice(0, 1);
        return item;
    }

    public dequeueLast(): T {
        if (this.isEmpty()) {
            throw new InvalidOperationException("queue is empty.");
        }
        const item = this.data[this.data.length - 1];
        this.data.splice(this.data.length - 1, 1);
        return item;
    }

    public distinct(comparer?: (item1: T, item2: T) => number): IEnumerable<T> {
        if (!comparer) {
            comparer = AbstractCollection.defaultComparator;
        }
        return this.union([], comparer);
    }

    public elementAt(index: number): T {
        if (index < 0 || index >= this.size()) {
            throw new Error("index is out of bounds.");
        }
        return this.get(index);
    }

    public elementAtOrDefault(index: number): T {
        if (index < 0 || index >= this.size()) {
            return null;
        }
        return this.get(index);
    }

    public enqueue(item: T): void {
        this.add(item);
    }

    public enqueueFirst(item: T): void {
        this.insert(0, item);
    }

    public except(enumerable: IEnumerable<T>, comparator?: (item1: T, item2: T) => number): IEnumerable<T> {
        if (!comparator) {
            comparator = AbstractCollection.defaultComparator;
        }
        const exceptSet: IList<T> = new List();
        for (const item of this.data) {
            const contains = enumerable.contains(item, comparator);
            if (!contains) {
                exceptSet.add(item);
            }
        }
        return exceptSet;
    }

    public exists(predicate: (item: T) => boolean): boolean {
        if (!predicate) {
            throw new ArgumentNullException("predicate is null.");
        }
        return this.data.some(predicate);
    }

    public find(predicate: (item: T) => boolean): T | null {
        const item = this.data.find(predicate);
        return item ?? null;
    }

    public findAll(predicate: (item: T) => boolean): List<T> {
        const foundData = this.data.filter(predicate);
        return new List<T>(foundData);
    }

    public findIndex(predicate: (item: T) => boolean, startIndex?: number, count?: number): number {
        if (!predicate) {
            throw new ArgumentNullException("predicate is null.");
        }

        startIndex = startIndex || 0;
        count = count || this.size() - 1;

        if (startIndex! < 0 || startIndex >= this.size()) {
            throw new ArgumentOutOfRangeException("startIndex is not a valid index.");
        }
        if (count < 0) {
            throw new ArgumentOutOfRangeException("count is less than 0.");
        }
        if (startIndex + count > this.size()) {
            throw new ArgumentOutOfRangeException("startIndex and count do not specify a valid section in the list.");
        }

        let found = false;
        let foundIndex = -1;
        for (let ix = startIndex; ix < startIndex + count; ++ix) {
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
        if (startIndex < 0 || startIndex >= this.size()) {
            throw new ArgumentOutOfRangeException("startIndex is not a valid index.");
        }
        if (count < 0) {
            throw new ArgumentOutOfRangeException("count is less than 0.");
        }
        if (startIndex + count > this.size()) {
            throw new ArgumentOutOfRangeException("startIndex and count do not specify a valid section in the list.");
        }
        startIndex = startIndex || 0;
        count = count || this.size();
        let found = false;
        let foundIndex = -1;
        for (let ix = startIndex + count - 1; ix >= startIndex; --ix) {
            found = predicate(this.data[ix]);
            if (found) {
                foundIndex = ix;
                break;
            }
        }
        return foundIndex;
    }

    public first(predicate?: (item: T) => boolean): T {
        if (this.isEmpty()) {
            throw new Error("Sequence contains no elements.");
        }
        if (!predicate) {
            return this.get(0);
        }
        const foundItem = this.firstOrDefault(predicate);
        if (!foundItem) {
            throw new Error("Sequence contains no matching element.");
        }
        return foundItem;
    }

    public firstOrDefault(predicate?: (item: T) => boolean): T {
        if (this.isEmpty()) {
            return null;
        }
        if (!predicate) {
            return this.get(0);
        }
        return this.find(predicate) ?? null;
    }

    public forEach(action: (item: T) => void): void {
        if (!action) {
            throw new ArgumentNullException("action is null.");
        }
        this.data.forEach(d => d ? action(d) : void 0);
    }

    public get(index: number): T {
        if (index == null) {
            throw new ArgumentNullException("index is null.");
        }
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index >= this.size()) {
            throw new ArgumentOutOfRangeException(`index is greater than or equal to ${this.size()}.`);
        }
        return this.data[index];
    }

    public groupBy<R>(keySelector: (item: T) => R, keyComparator?: (item1: R, item2: R) => number): IEnumerable<IGrouping<R, T>> {
        if (!keyComparator) {
            keyComparator = AbstractCollection.defaultComparator;
        }
        return this.select(d => keySelector(d))
            .distinct(keyComparator)
            .select(k => new Grouping(k, this.where(d => keyComparator(k, keySelector(d)) === 0).toArray()));
    }

    public includes(item: T): boolean {
        return this.indexOf(item) > -1;
    }

    public indexOf(item: T): number {
        return this.data.findIndex(d => d === item);
    }

    public insert(index: number, item: T) {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index !== 0 && index >= this.size()) {
            throw new ArgumentOutOfRangeException(`index is greater than or equal to ${this.size()}.`);
        }
        this.data.splice(index, 0, item);
    }

    public intersect(enumerable: IEnumerable<T>, comparator?: (item1: T, item2: T) => number): IEnumerable<any> {
        if (!comparator) {
            comparator = AbstractCollection.defaultComparator;
        }
        const intersectList: IList<T> = new List();
        for (const d of this.data) {
            if (enumerable.contains(d, comparator)) {
                intersectList.add(d);
            }
        }
        return intersectList;
    }

    public isEmpty(): boolean {
        return this.data.length === 0;
    }

    public join<E, K, R>(enumerable: IEnumerable<E>, outerKeySelector: (item: T) => K, innerKeySelector: (item: E) => K,
                         resultSelector: (outerItem: T, innerItem: E) => R,
                         keyComparator?: (item1: K, item2: K) => number, leftJoin: boolean = false): IEnumerable<R> {
        if (!keyComparator) {
            keyComparator = AbstractCollection.defaultComparator;
        }
        const resultList: IList<R> = new List();
        for (let odata of this.data) {
            const outerEntries = enumerable.where(idata => keyComparator(outerKeySelector(odata), innerKeySelector(idata)) === 0);
            if (leftJoin && !outerEntries.any()) {
                resultList.add(resultSelector(odata, null));
            } else {
                outerEntries.toArray().forEach(o => resultList.add(resultSelector(odata, o)));
            }
        }
        return resultList;
    }

    public last(predicate?: (item: T) => boolean): T {
        if (this.isEmpty()) {
            throw new Error("Sequence contains no elements.");
        }
        if (!predicate) {
            return this.get(this.size() - 1);
        }
        const foundItem = this.lastOrDefault(predicate);
        if (!foundItem) {
            throw new Error("Sequence contains no matching element.");
        }
        return foundItem;
    }

    public lastIndexOf(item: T): number {
        return this.data.lastIndexOf(item);
    }

    public lastOrDefault(predicate?: (item: T) => boolean): T {
        if (this.isEmpty()) {
            return null;
        }
        if (!predicate) {
            return this.get(this.size() - 1);
        }
        return this.findLast(predicate) ?? null;
    }

    public max(predicate: (item: T, index?: number) => number): number {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        let max = 0;
        for (const [index, item] of this.data.entries()) {
            if (index === 0) {
                max = predicate(item, index);
            } else {
                max = Math.max(max, predicate(item, index));
            }
        }
        return max;
    }

    public min(predicate: (item: T, index?: number) => number): number {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        let min = 0;
        for (const [index, item] of this.data.entries()) {
            if (index === 0) {
                min = predicate(item, index);
            } else {
                min = Math.min(min, predicate(item, index));
            }
        }
        return min;
    }

    public peek(): T {
        if (this.isEmpty()) {
            return null;
        }
        return this.get(0);
    }

    public peekLast(): T {
        if (this.isEmpty()) {
            return null;
        }
        return this.get(this.size() - 1);
    }

    public poll(): T {
        if (this.isEmpty()) {
            return null;
        }
        const item = this.data[0];
        this.data.splice(0, 1);
        return item;
    }

    public pollLast(): T {
        if (this.isEmpty()) return null;
        const item = this.data[this.size() - 1];
        this.data.splice(this.size() - 1, 1);
        return item;
    }

    public prepend(item: T): IEnumerable<T> {
        return new List([item, ...this.data]);
    }

    public remove(item: T): boolean {
        const index = this.findIndex(d => d === item);
        if (index === -1) return false;
        this.removeAt(index);
        return true;
    }

    public removeAll(predicate: (value: T) => boolean): number {
        if (!predicate) {
            throw new ArgumentNullException("predicate is null.");
        }
        const preCount = this.data.length;
        this.data = this.data.filter(d => !predicate(d));
        return preCount - this.data.length;
    }

    public removeAt(index: number): void {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index >= this.size()) {
            throw new ArgumentOutOfRangeException(`index is greater than or equal to ${this.size()}.`);
        }
        this.data.splice(index, 1);
    }

    public removeRange(index: number, count: number): void {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (count < 0) {
            throw new ArgumentOutOfRangeException("count is less than 0.");
        }
        if (index + count > this.size()) {
            throw new ArgumentException("index and count do not denote a valid range of elements in the list.");
        }
        let removedCount = 0;
        while (removedCount < count) {
            this.removeAt(index);
            removedCount++;
        }
    }

    public repeat(item: T, count: number): IEnumerable<T> {
        if (count < 0) {
            throw new Error("count is out of range.");
        }
        return new List(new Array(count).fill(item)).asEnumerable();
    }

    public reverse(): IEnumerable<T> {
        return new List(this.data.slice().reverse());
    }

    public select<R>(predicate: (item: T, index?: number) => R): IEnumerable<R> {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        return new List(this.data.map(predicate));
    }

    public selectMany<R>(predicate: (item: T, index?: number) => IEnumerable<R>|Array<R>): IEnumerable<R> {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        const list: IList<R> = new List();
        this.data.forEach((d, dx) => {
            const transformedData = predicate(d, dx);
            if (transformedData instanceof Array) {
                transformedData.forEach(td => list.add(td));
            } else {
                transformedData.toArray().forEach(td => list.add(td));
            }
        });
        return list;
    }

    public sequenceEqual(enumerable: IEnumerable<T>, comparator?: (item1: T, item2: T) => number): boolean {
        if (this.count() !== enumerable.count()) {
            return false;
        }
        if (!comparator) {
            comparator = AbstractCollection.defaultComparator;
        }
        for (const [index, item] of this.data.entries()) {
            if (comparator(this.elementAt(index), enumerable.elementAt(index)) !== 0) {
                return false;
            }
        }
        return true;
    }

    public set(index: number, item: T): void {
        if (index < 0) {
            throw new ArgumentOutOfRangeException("index is less than 0.");
        }
        if (index >= this.size()) {
            throw new ArgumentOutOfRangeException(`index is greater than or equal to ${this.size()}.`);
        }
        this.data[index] = item;
    }

    public single(predicate?: (item: T) => boolean): T {
        if (this.size() === 0) {
            throw new Error("Sequence contains no elements.");
        }
        if (!predicate) {
            if (this.size() > 1) {
                throw new Error("Sequence contains more than one element.");
            }
            return this.get(0);
        } else {
            const foundItem = this.singleOrDefault(predicate);
            if (!foundItem) {
                throw new Error("Sequence contains no matching element.");
            }
            return foundItem;
        }
    }

    public singleOrDefault(predicate?: (item: T) => boolean): T {
        if (this.size() === 0) {
            return null;
        }
        if (!predicate) {
            if (this.size() === 1) {
                return this.get(0);
            }
            throw new Error("Sequence contains more than one element.");
        }
        const items = this.where(predicate);
        if (items.count() > 1) {
            throw new Error("Sequence contains more than one matching element.");
        }
        if (items.count() <= 0) {
            return null;
        }
        return items.elementAt(0);
    }

    public size(): number {
        return this.data.length;
    }

    public skip(count: number = 0): IEnumerable<T> {
        if (count > 0) {
            if (this.size() <= count) {
                return new List<T>([]);
            }
            return new List(this.data.slice(count, this.data.length));
        }
        return this;
    }

    public skipLast(count: number = 0): IEnumerable<T> {
        if (count > 0) {
            if (this.size() <= count) {
                return new List<T>([]);
            }
            return new List(this.data.slice(0, this.data.length - count));
        }
        return this;
    }

    public skipWhile(predicate: (item: T, index?: number) => boolean): IEnumerable<T> {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        let startIndex = 0;
        for (const [index, item] of this.data.entries()) {
            if (predicate(item, index)) {
                startIndex++;
            } else {
                break;
            }
        }
        return new List(this.skip(startIndex).toArray());
    }

    public sort(comparer?: (e1: T, e2: T) => number): void {
        if (!comparer) {
            comparer = AbstractCollection.defaultComparator;
        }
        this.data.sort(comparer);
    }

    public sum(predicate: (item: T) => number): number {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        let total = 0;
        this.data.forEach(d => total += predicate(d));
        return total;
    }

    public take(count: number): IEnumerable<T> {
        if (count <= 0) {
            return new List<T>([]);
        }
        if (count >= this.size()) {
            return this;
        }
        return new List(this.data.slice(0, count));
    }

    public takeLast(count: number): IEnumerable<T> {
        if (count <= 0) {
            return new List<T>([]);
        }
        if (count >= this.size()) {
            return this;
        }
        return new List(this.data.slice(this.data.length - count, this.data.length));
    }

    public takeWhile(predicate: (item: T, index?: number) => boolean): IEnumerable<T> {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        let endIndex = 0;
        for (const [index, item] of this.data.entries()) {
            if (predicate(item, index)) {
                endIndex++;
            } else {
                break;
            }
        }
        return new List(this.take(endIndex).toArray());
    }

    public toArray(): T[] {
        return [...this.data];
    }

    public toList(): IList<T> {
        return new List([...this.data]);
    }

    public union(enumerable: IEnumerable<T>|Array<T>, comparator?: (item1: T, item2: T) => number): IEnumerable<T> {
        if (!comparator) {
            comparator = AbstractCollection.defaultComparator;
        }
        const unionList: IList<T> = new List();
        const array = enumerable instanceof Array ? enumerable : enumerable.toArray();
        this.data.forEach(item => {
            let contains = false;
            for (const unionItem of unionList.toArray()) {
                if (comparator(item, unionItem) === 0) {
                    contains = true;
                    break;
                }
            }
            if (!contains) {
                unionList.add(item);
            }
        });
        array.forEach(item => {
            let contains = false;
            for (const unionItem of unionList.toArray()) {
                if (comparator(item, unionItem) === 0) {
                    contains = true;
                    break;
                }
            }
            if (!contains) {
                unionList.add(item);
            }
        });
        return unionList;
    }

    public where(predicate: (item: T) => boolean): IEnumerable<T> {
        if (!predicate) {
            throw new Error("predicate is null.");
        }
        return new List(this.data.filter(predicate));
    }

    public zip<R, U>(enumerable: IEnumerable<R>, zipper: (left: T, right: R) => U): IEnumerable<U> {
        if (!zipper) {
            throw new Error("zipper is null.");
        }
        const sizeFirst = this.count();
        const sizeSecond = enumerable.count();
        let first = this.asEnumerable();
        let second = enumerable;
        if (sizeFirst < sizeSecond) {
            second = second.take(sizeFirst);
        } else {
            first = first.take(sizeSecond);
        }
        const list: IList<U> = new List();
        for (let ix = 0; ix < first.count(); ++ix) {
            const left = first.elementAt(ix);
            const right = second.elementAt(ix);
            list.add(zipper(left, right));
        }
        return list.asEnumerable();
    }

    * [Symbol.iterator](): Iterator<T> {
        for (let item of this.data) {
            yield item;
        }
    }
}
