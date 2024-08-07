import { AbstractReadonlyCollection, ICollection, IReadonlyCollection } from "../imports";
import { EqualityComparator } from "../shared/EqualityComparator";

export class ReadonlyCollection<TElement> extends AbstractReadonlyCollection<TElement> {
    readonly #collection: IReadonlyCollection<TElement>;

    public constructor(collection: ICollection<TElement>, comparator?: EqualityComparator<TElement>) {
        super(comparator);
        this.#collection = collection;
    }

    * [Symbol.iterator](): Iterator<TElement> {
        yield* this.#collection;
    }

    public override contains(element: TElement, comparator?: EqualityComparator<TElement>): boolean {
        return this.#collection.contains(element, comparator);
    }

    public override size(): number {
        return this.#collection.size();
    }

    public override get length(): number {
        return this.#collection.length;
    }
}