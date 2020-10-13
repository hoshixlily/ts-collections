import {IEnumerable, ISet, KeyValuePair, List} from "../../imports";
import {EqualityComparator} from "../shared/EqualityComparator";

export interface IDictionary<TKey, TValue> extends IEnumerable<KeyValuePair<TKey, TValue>> {
    add(key: TKey, value: TValue): TValue;
    clear(): void;
    containsKey(key: TKey): boolean;
    containsValue(value: TValue, comparator?: EqualityComparator<TValue>): boolean;
    get(key: TKey): TValue;
    isEmpty(): boolean;
    keys(): ISet<TKey>;
    remove(key: TKey): TValue;
    size(): number;
    tryAdd(key: TKey, value: TValue): boolean;
    values(): List<TValue>;
}
