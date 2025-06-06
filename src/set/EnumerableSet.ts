import { AbstractSet } from "../imports";
import { EqualityComparator } from "../shared/EqualityComparator";
import { Predicate } from "../shared/Predicate";

export class EnumerableSet<TElement> extends AbstractSet<TElement> {
    readonly #set: Set<TElement>;

    public constructor(iterable: Iterable<TElement> = []) {
        super();
        this.#set = new Set(iterable);
    }

    * [Symbol.iterator](): Iterator<TElement> {
        yield* this.#set;
    }

    public add(element: TElement): boolean {
        if (this.#set.has(element)) {
            return false;
        }
        this.#set.add(element);
        return true;
    }

    public clear(): void {
        this.#set.clear();
    }

    public override contains(element: TElement): boolean {
        return this.#set.has(element);
    }

    public remove(element: TElement): boolean {
        return this.#set.delete(element);
    }

    public removeAll<TSource extends TElement>(collection: Iterable<TSource>): boolean {
        let changed = false;
        for (const element of collection) {
            changed = this.remove(element) || changed;
        }
        return changed;
    }

    public override removeIf(predicate: Predicate<TElement>): boolean {
        let changed = false;
        for (const element of this.#set) {
            if (predicate(element)) {
                changed = this.remove(element) || changed;
            }
        }
        return changed;
    }

    public override retainAll(collection: Iterable<TElement>): boolean {
        const originalSize = this.#set.size;
        const elementsToRetain = new Set<TElement>(collection); // O(M) to build

        for (const element of this.#set) { // O(N) iteration
            if (!elementsToRetain.has(element as TElement)) { // O(1) average lookup
                this.#set.delete(element); // O(1) average deletion
            }
        }
        return this.#set.size !== originalSize;
    }

    public override size(): number {
        return this.#set.size;
    }

    public override get comparator(): EqualityComparator<TElement> {
        return this.comparer;
    }

    public override get length(): number {
        return this.#set.size;
    }
}
