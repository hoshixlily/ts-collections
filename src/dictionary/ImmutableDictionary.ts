import { Dictionary, ICollection, ISet, ReadonlyDictionary } from "../imports.ts";
import { EqualityComparator } from "../shared/EqualityComparator";
import { AbstractImmutableDictionary } from "./AbstractImmutableDictionary";
import { KeyValuePair } from "./KeyValuePair";

export class ImmutableDictionary<TKey, TValue> extends AbstractImmutableDictionary<TKey, TValue> {
    readonly #dictionary: ReadonlyDictionary<TKey, TValue>;

    private constructor(dictionary: Dictionary<TKey, TValue>) {
        super(dictionary.valueComparator, dictionary.keyValueComparator);
        this.#dictionary = new ReadonlyDictionary(dictionary);
    }

    * [Symbol.iterator](): Iterator<KeyValuePair<TKey, TValue>> {
        yield* this.#dictionary;
    }

    public static create<TKey, TValue>(): ImmutableDictionary<TKey, TValue>;
    public static create<TKey, TValue>(iterable: Iterable<KeyValuePair<TKey, TValue>>, valueComparator?: EqualityComparator<TValue>): ImmutableDictionary<TKey, TValue>;
    public static create<TKey, TValue>(iterable: Iterable<[TKey, TValue]>, valueComparator?: EqualityComparator<TValue>): ImmutableDictionary<TKey, TValue>;
    public static create<TKey, TValue>(iterable: Iterable<KeyValuePair<TKey, TValue>> | Iterable<[TKey, TValue]>, valueComparator?: EqualityComparator<TValue>): ImmutableDictionary<TKey, TValue>;
    public static create<TKey, TValue>(
        iterable: Iterable<KeyValuePair<TKey, TValue>> | Iterable<[TKey, TValue]> = [] as Array<KeyValuePair<TKey, TValue>>,
        valueComparator?: EqualityComparator<TValue>
    ): ImmutableDictionary<TKey, TValue> {
        return new ImmutableDictionary(new Dictionary(iterable, valueComparator));
    }

    public add(key: TKey, value: TValue): ImmutableDictionary<TKey, TValue> {
        const dictionary = this.getCopiedDictionary();
        dictionary.add(key, value);
        return new ImmutableDictionary(dictionary);
    }

    public override clear(): ImmutableDictionary<TKey, TValue> {
        return new ImmutableDictionary(new Dictionary([], this.valueComparator));
    }

    public containsKey(key: TKey): boolean {
        return this.#dictionary.containsKey(key);
    }

    public containsValue(value: TValue, comparator?: EqualityComparator<TValue>): boolean {
        return this.#dictionary.containsValue(value, comparator);
    }

    public* entries(): IterableIterator<[TKey, TValue]> {
        yield* this.#dictionary.entries();
    }

    public get(key: TKey): TValue | null {
        return this.#dictionary.get(key);
    }

    public keys(): ISet<TKey> {
        return this.#dictionary.keys();
    }

    public override put(key: TKey, value: TValue): ImmutableDictionary<TKey, TValue> {
        const dictionary = this.getCopiedDictionary();
        dictionary.put(key, value);
        return new ImmutableDictionary(dictionary);
    }

    public override remove(key: TKey): ImmutableDictionary<TKey, TValue> {
        const dictionary = this.getCopiedDictionary();
        dictionary.remove(key);
        return new ImmutableDictionary(dictionary);
    }

    public override set(key: TKey, value: TValue): ImmutableDictionary<TKey, TValue> {
        const dictionary = this.getCopiedDictionary();
        dictionary.set(key, value);
        return new ImmutableDictionary(dictionary);
    }

    public override size(): number {
        return this.#dictionary.size();
    }

    public values(): ICollection<TValue> {
        return this.#dictionary.values();
    }

    private getCopiedDictionary(): Dictionary<TKey, TValue> {
        return this.#dictionary.toDictionary(p => p.key, p => p.value);
    }

    public override get length(): number {
        return this.#dictionary.length;
    }
}