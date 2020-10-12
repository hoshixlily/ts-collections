import {IEnumerable, List} from "../../imports";
import {KeyValuePair} from "./KeyValuePair";
import {EqualityComparator} from "../shared/EqualityComparator";
import {ISet} from "../set/ISet";

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
    values(): List<TValue>;
}
