import { ICollection, IEnumerable, ISet } from "../imports";
import { EqualityComparator } from "../shared/EqualityComparator";
import { Selector } from "../shared/Selector";
import { KeyValuePair } from "./KeyValuePair";

export interface IReadonlyDictionary<TKey, TValue> extends IEnumerable<KeyValuePair<TKey, TValue>> {
    /**
     * Returns the number of elements in this dictionary.
     */
    get length(): number;

    /**
     * Returns an object representation of this dictionary.
     *
     * {@link toObject} is a more versatile version of this method, as it allows you to select the key and value properties
     * that will be used to generate the object representation.
     * @template TValue The type of the values of the dictionary.
     * @returns {Record<string|number|symbol, TValue>} An object representation of this dictionary.
     */
    asObject<TObjectKey extends string | number | symbol>(): Record<TObjectKey, TValue>;

    /**
     * Checks whether this dictionary contains the specified key.
     * @param key The key to locate in this dictionary.
     * @returns {boolean} true if this dictionary contains an element with the specified key; false otherwise.
     */
    containsKey(key: TKey): boolean;

    /**
     * Checks whether this dictionary contains the specified value.
     * @param value The value to locate in this dictionary.
     * @param comparator The comparator function which will be used to compare the equality of the values.
     * @returns {boolean} true if this dictionary contains an element with the specified value; false otherwise.
     */
    containsValue(value: TValue, comparator?: EqualityComparator<TValue>): boolean;

    /**
     * Returns an IterableIterator that yields a tuple of [key, value].
     */
    entries(): IterableIterator<[TKey, TValue]>;

    /**
     * Returns the value associated with the given key.
     * @param key The key whose associated value will be returned
     * @returns The associated value of the key. If key does not exist, it will return null.
     */
    get(key: TKey): TValue | null;

    /**
     * Checks if the dictionary is empty or not.
     * @returns {boolean} true if the dictionary is empty; false otherwise.
     */
    isEmpty(): boolean;

    /**
     * Returns a set of keys of this dictionary.
     * @returns {ISet} A set of keys of this dictionary.
     */
    keys(): ISet<TKey>;

    /**
     * Returns the number of elements in this dictionary.
     */
    size(): number;

    /**
     * Returns a string representation of this dictionary.
     */
    toString(): string;

    /**
     * Returns a string representation of this dictionary.
     * @param selector The selector that will be used to select the property that will be used to generate the string representation of this dictionary.
     */
    toString(selector?: Selector<KeyValuePair<TKey, TValue>, string>): string;

    /**
     * Returns a list of values of the dictionary.
     * @returns {ICollection} A collection of values of this dictionary.
     */
    values(): ICollection<TValue>;

    get keyValueComparator(): EqualityComparator<KeyValuePair<TKey, TValue>>;

    get valueComparator(): EqualityComparator<TValue>;
}
