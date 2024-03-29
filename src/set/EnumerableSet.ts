import {AbstractSet} from "../../imports";
import {Predicate} from "../shared/Predicate";

export class EnumerableSet<TElement> extends AbstractSet<TElement> {
    private readonly set: Set<TElement>;

    public constructor(iterable: Iterable<TElement> = []) {
        super();
        this.set = new Set(iterable);
        this.updateLength();
    }

    *[Symbol.iterator](): Iterator<TElement> {
        yield* this.set;
    }

    public add(element: TElement): boolean {
        if (this.set.has(element)) {
            return false;
        }
        this.set.add(element);
        this.updateLength();
        return true;
    }

    public clear(): void {
        this.set.clear();
        this.updateLength();
    }

    public override contains(element: TElement): boolean {
        return this.set.has(element);
    }

    public remove(element: TElement): boolean {
        const result = this.set.delete(element);
        this.updateLength();
        return result;
    }

    public removeAll<TSource extends TElement>(collection: Iterable<TSource>): boolean {
        let changed = false;
        for (const element of collection) {
            changed = this.remove(element) || changed;
        }
        this.updateLength();
        return changed;
    }

    public override removeIf(predicate: Predicate<TElement>): boolean {
        let changed = false;
        for (const element of this.set) {
            if (predicate(element)) {
                changed = this.remove(element) || changed;
            }
        }
        this.updateLength();
        return changed;
    }

    public override retainAll<TSource extends TElement>(collection: Iterable<TSource>): boolean {
        let changed = false;
        const removedElements: TElement[] = [];
        for (const element of this.set) {
            const iterator = collection[Symbol.iterator]();
            let next = iterator.next();
            let found = false;
            while (!next.done) {
                if (this.comparer(element, next.value)) {
                    found = true;
                    break;
                }
                next = iterator.next();
            }
            if (!found) {
                removedElements.push(element);
            }
        }
        this.removeAll(removedElements);
        this.updateLength();
        return changed;
    }

    public override size(): number {
        return this.set.size;
    }

}