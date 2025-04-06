import { KeyValuePair } from "../dictionary/KeyValuePair";
import {
    Collections,
    Dictionary,
    Enumerable,
    EnumerableSet,
    Group,
    IEnumerable,
    IGroup,
    ILookup,
    ImmutableDictionary,
    ImmutableList,
    ImmutableQueue,
    ImmutableSet,
    ImmutableSortedDictionary,
    ImmutableSortedSet,
    ImmutableStack,
    IOrderedEnumerable,
    LinkedList,
    List,
    OrderedEnumerator,
    PriorityQueue,
    Queue,
    SortedDictionary,
    SortedSet,
    Stack
} from "../imports";
import { Lookup } from "../lookup/Lookup";
import { Accumulator } from "../shared/Accumulator";
import { Comparators } from "../shared/Comparators";
import { EqualityComparator } from "../shared/EqualityComparator";
import { IndexedAction } from "../shared/IndexedAction";
import { IndexedPredicate } from "../shared/IndexedPredicate";
import { IndexedSelector } from "../shared/IndexedSelector";
import { IndexOutOfBoundsException } from "../shared/IndexOutOfBoundsException";
import { InferredType } from "../shared/InferredType";
import { InvalidArgumentException } from "../shared/InvalidArgumentException";
import { JoinSelector } from "../shared/JoinSelector";
import { MoreThanOneElementException } from "../shared/MoreThanOneElementException";
import { MoreThanOneMatchingElementException } from "../shared/MoreThanOneMatchingElementException";
import { NoElementsException } from "../shared/NoElementsException";
import { NoMatchingElementException } from "../shared/NoMatchingElementException";
import { ClassType, ObjectType } from "../shared/ObjectType";
import { OrderComparator } from "../shared/OrderComparator";
import { PairwiseSelector } from "../shared/PairwiseSelector";
import { Predicate } from "../shared/Predicate";
import { Selector } from "../shared/Selector";
import { Zipper } from "../shared/Zipper";
import { permutationsGenerator } from "./helpers/permutationsGenerator";

export class Enumerator<TElement> implements IOrderedEnumerable<TElement> {

    public constructor(private readonly iterable: () => Iterable<TElement>) {
    }

    * [Symbol.iterator](): Iterator<TElement> {
        yield* this.iterable();
    }

    public aggregate<TAccumulate = TElement, TResult = TAccumulate>(accumulator: Accumulator<TElement, TAccumulate>, seed?: TAccumulate, resultSelector?: Selector<TAccumulate, TResult>): TAccumulate | TResult {
        let accumulatedValue: TAccumulate;
        if (seed == null) {
            if (!this.any()) {
                throw new NoElementsException();
            }
            accumulatedValue = this.first() as unknown as TAccumulate;
            for (const element of this.skip(1)) {
                accumulatedValue = accumulator(accumulatedValue, element);
            }
        } else {
            accumulatedValue = seed;
            for (const element of this) {
                accumulatedValue = accumulator(accumulatedValue, element);
            }
        }
        if (resultSelector) {
            return resultSelector(accumulatedValue);
        } else {
            return accumulatedValue;
        }
    }

   public aggregateBy<TKey, TAccumulate = TElement>(keySelector: Selector<TElement, TKey>, seedSelector: Selector<TKey, TAccumulate> | TAccumulate, accumulator: Accumulator<TElement, TAccumulate>, keyComparator?: EqualityComparator<TKey>): IEnumerable<KeyValuePair<TKey, TAccumulate>> {
        keyComparator ??= Comparators.equalityComparator;
        const groups = this.groupBy(keySelector, keyComparator);
        return groups.select(g => new KeyValuePair(g.key, g.source.aggregate(accumulator, seedSelector instanceof Function ? seedSelector(g.key) : seedSelector )));
   }

    public all(predicate: Predicate<TElement>): boolean {
        for (const d of this) {
            if (!predicate(d)) {
                return false;
            }
        }
        return true;
    }

    public any(predicate?: Predicate<TElement>): boolean {
        if (!predicate) {
            return !this[Symbol.iterator]().next().done;
        }
        for (const element of this) {
            if (predicate(element)) {
                return true;
            }
        }
        return false;
    }

    public append(element: TElement): IEnumerable<TElement> {
        return new Enumerator(() => this.appendGenerator(element));
    }

    public asEnumerable(): IEnumerable<TElement> {
        return this;
    }

    public average(selector?: Selector<TElement, number>): number {
        if (!this.any()) {
            throw new NoElementsException();
        }
        let total: number = 0;
        let count: number = 0;
        for (const d of this) {
            total += selector?.(d) ?? d as unknown as number;
            count++;
        }
        return total / count;
    }

    public cast<TResult>(): IEnumerable<TResult> {
        return new Enumerator<TResult>(() => this.castGenerator());
    }

    public chunk(size: number): IEnumerable<IEnumerable<TElement>> {
        if (size < 1) {
            throw new InvalidArgumentException("Size must be greater than 0.", "size");
        }
        return new Enumerator(() => this.chunkGenerator(size));
    }

    public combinations(size?: number): IEnumerable<IEnumerable<TElement>> {
        if (size != null && size < 0) {
            throw new InvalidArgumentException("Size must be greater than or equal to 0.", "size");
        }
        return new Enumerator(() => this.combinationsGenerator(size));
    }

    public concat(iterable: Iterable<TElement>): IEnumerable<TElement> {
        return new Enumerator(() => this.concatGenerator(iterable));
    }

    public contains(element: TElement, comparator?: EqualityComparator<TElement>): boolean {
        comparator ??= Comparators.equalityComparator;
        for (const e of this) {
            if (comparator(e, element)) {
                return true;
            }
        }
        return false;
    }

    public count(predicate?: Predicate<TElement>): number {
        let count: number = 0;
        if (!predicate) {
            for (const {} of this) {
                ++count;
            }
            return count;
        }
        for (const item of this) {
            if (predicate(item)) {
                ++count;
            }
        }
        return count;
    }

    public countBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: EqualityComparator<TKey>): IEnumerable<KeyValuePair<TKey, number>> {
        comparator ??= Comparators.equalityComparator;
        const groups = this.groupBy(keySelector, comparator);
        return groups.select(g => new KeyValuePair(g.key, g.source.count()));
    }

    public cycle(count?: number): IEnumerable<TElement> {
        return new Enumerator(() => this.cycleGenerator(count));
    }

    public defaultIfEmpty(value?: TElement | null): IEnumerable<TElement | null> {
        return new Enumerator(() => this.defaultIfEmptyGenerator(value));
    }

    public distinct(keyComparator?: EqualityComparator<TElement>): IEnumerable<TElement> {
        const keyCompare = keyComparator ?? Comparators.equalityComparator as EqualityComparator<TElement>;
        return new Enumerator(() => this.unionGenerator(Enumerable.empty(), keyCompare));
    }

    public distinctBy<TKey>(keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey>): IEnumerable<TElement> {
        const keyCompare = keyComparator ?? Comparators.equalityComparator as EqualityComparator<TKey>;
        return new Enumerator(() => this.unionByGenerator(Enumerable.empty(), keySelector, keyCompare));
    }

    public elementAt(index: number): TElement {
        if (index < 0) {
            throw new IndexOutOfBoundsException(index);
        }
        let ix: number = 0;
        for (const item of this) {
            if (index === ix) {
                return item;
            }
            ++ix;
        }
        throw new IndexOutOfBoundsException(index);
    }

    public elementAtOrDefault(index: number): TElement | null {
        let ix: number = 0;
        for (const item of this) {
            if (index === ix) {
                return item;
            }
            ++ix;
        }
        return null;
    }

    public except(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement> | OrderComparator<TElement>): IEnumerable<TElement> {
        comparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.exceptGenerator(iterable, comparator));
    }

    public exceptBy<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey> | OrderComparator<TKey>): IEnumerable<TElement> {
        keyComparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.exceptByGenerator(iterable, keySelector, keyComparator));
    }

    public first(predicate?: Predicate<TElement>): TElement {
        if (!this.any()) {
            throw new NoElementsException();
        }
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return item;
            }
        }
        throw new NoMatchingElementException();
    }

    public firstOrDefault(predicate?: Predicate<TElement>): TElement | null {
        for (const item of this) {
            if (!predicate || predicate(item)) {
                return item;
            }
        }
        return null;
    }

    public forEach(action: IndexedAction<TElement>): void {
        let index = 0;
        for (const item of this) {
            action(item, index++);
        }
    }

    public groupBy<TKey>(keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey>): IEnumerable<IGroup<TKey, TElement>> {
        keyComparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.groupByGenerator(keySelector, keyComparator));
    }

    public groupJoin<TInner, TKey, TResult>(innerEnumerable: IEnumerable<TInner>, outerKeySelector: Selector<TElement, TKey>, innerKeySelector: Selector<TInner, TKey>, resultSelector: JoinSelector<TElement, IEnumerable<TInner>, TResult>, keyComparator?: EqualityComparator<TKey>): IEnumerable<TResult> {
        keyComparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.groupJoinGenerator(innerEnumerable, outerKeySelector, innerKeySelector, resultSelector, keyComparator));
    }

    public index(): IEnumerable<[number, TElement]> {
        return new Enumerator<[number, TElement]>(() => this.indexGenerator());
    }

    public intersect(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement> | OrderComparator<TElement>): IEnumerable<TElement> {
        comparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.intersectGenerator(iterable, comparator));
    }

    public intersectBy<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey> | OrderComparator<TKey>): IEnumerable<TElement> {
        keyComparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.intersectByGenerator(iterable, keySelector, keyComparator));
    }

    public intersperse<TSeparator = TElement>(separator: TSeparator): IEnumerable<TElement | TSeparator> {
        return new Enumerator(() => this.intersperseGenerator(separator));
    }

    public join<TInner, TKey, TResult>(innerEnumerable: IEnumerable<TInner>, outerKeySelector: Selector<TElement, TKey>, innerKeySelector: Selector<TInner, TKey>, resultSelector: JoinSelector<TElement, TInner, TResult>, keyComparator?: EqualityComparator<TKey>, leftJoin?: boolean): IEnumerable<TResult> {
        keyComparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.joinGenerator(innerEnumerable, outerKeySelector, innerKeySelector, resultSelector, keyComparator, leftJoin));
    }

    public last(predicate?: Predicate<TElement>): TElement {
        let found = false;
        let result: TElement | null = null;

        for (const item of this) {
            if (!predicate || predicate(item)) {
                result = item;
                found = true;
            }
        }

        if (!found) {
            throw predicate
                ? new NoMatchingElementException()
                : new NoElementsException();
        }

        return result as TElement;
    }

    public lastOrDefault(predicate?: Predicate<TElement>): TElement | null {
        let result: TElement | null = null;
        for (const item of this) {
            if (!predicate || predicate(item)) {
                result = item;
            }
        }
        return result;
    }

    public max(selector?: Selector<TElement, number>): number {
        let max: number | null = null;
        if (!selector) {
            for (const item of this) {
                max = Math.max(max ?? Number.NEGATIVE_INFINITY, item as unknown as number);
            }
            if (max == null) {
                throw new NoElementsException();
            }
            return max;
        } else {
            for (const item of this) {
                max = Math.max(max ?? Number.NEGATIVE_INFINITY, selector(item));
            }
            if (max == null) {
                throw new NoElementsException();
            }
            return max;
        }
    }

    public maxBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): TElement {
        let max: TElement | null = null;
        let maxKey: TKey | null = null;
        for (const item of this) {
            const key = keySelector(item);
            if (maxKey == null || (comparator ?? Comparators.orderComparator)(key, maxKey) > 0) {
                max = item;
                maxKey = key;
            }
        }
        if (max == null) {
            throw new NoElementsException();
        }
        return max;
    }

    public min(selector?: Selector<TElement, number>): number {
        let min: number | null = null;
        if (!selector) {
            for (const item of this) {
                min = Math.min(min ?? Number.POSITIVE_INFINITY, item as unknown as number);
            }
            if (min == null) {
                throw new NoElementsException();
            }
            return min;
        } else {
            for (const item of this) {
                min = Math.min(min ?? Number.POSITIVE_INFINITY, selector(item));
            }
            if (min == null) {
                throw new NoElementsException();
            }
            return min;
        }
    }

    public minBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): TElement {
        let min: TElement | null = null;
        let minKey: TKey | null = null;
        for (const item of this) {
            const key = keySelector(item);
            if (minKey == null || (comparator ?? Comparators.orderComparator)(key, minKey) < 0) {
                min = item;
                minKey = key;
            }
        }
        if (min == null) {
            throw new NoElementsException();
        }
        return min;
    }

    public none(predicate?: Predicate<TElement>): boolean {
        if (!predicate) {
            return !!this[Symbol.iterator]().next().done;
        }
        for (const d of this) {
            if (predicate(d)) {
                return false;
            }
        }
        return true;
    }

    public ofType<TResult extends ObjectType>(type: TResult): IEnumerable<InferredType<TResult>> {
        return new Enumerator<InferredType<TResult>>(() => this.ofTypeGenerator(type));
    }

    public orderBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): IOrderedEnumerable<TElement> {
        return OrderedEnumerator.createOrderedEnumerable(this, keySelector, true, false, comparator);
    }

    public orderByDescending<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): IOrderedEnumerable<TElement> {
        return OrderedEnumerator.createOrderedEnumerable(this, keySelector, false, false, comparator);
    }

    public pairwise(resultSelector?: PairwiseSelector<TElement, TElement>): IEnumerable<[TElement, TElement]> {
        return new Enumerator(() => this.pairwiseGenerator(resultSelector ??= (first, second) => [first, second]));
    }

    public partition(predicate: Predicate<TElement>): [IEnumerable<TElement>, IEnumerable<TElement>] {
        const trueItems = new List<TElement>();
        const falseItems = new List<TElement>();
        for (const item of this) {
            if (predicate(item)) {
                trueItems.add(item);
            } else {
                falseItems.add(item);
            }
        }
        return [new Enumerable(trueItems), new Enumerable(falseItems)];
    }

    public permutations(size?: number): IEnumerable<IEnumerable<TElement>> {
        if (size != null && size < 1) {
            throw new InvalidArgumentException("Size must be greater than 0.", "size");
        }
        return new Enumerator(() => this.permutationsGenerator(size));
    }

    public prepend(element: TElement): IEnumerable<TElement> {
        return new Enumerator(() => this.prependGenerator(element));
    }

    public product(selector?: Selector<TElement, number>): number {
        if (!this.any()) {
            throw new NoElementsException();
        }
        let total: number = 1;
        for (const d of this) {
            total *= selector?.(d) ?? d as unknown as number;
        }
        return total;
    }

    public reverse(): IEnumerable<TElement> {
        return new Enumerator(() => this.reverseGenerator());
    }

    public scan<TAccumulate = TElement>(accumulator: Accumulator<TElement, TAccumulate>, seed?: TAccumulate): IEnumerable<TAccumulate> {
        return new Enumerator(() => this.scanGenerator(accumulator, seed));
    }

    public select<TResult>(selector: IndexedSelector<TElement, TResult>): IEnumerable<TResult> {
        return new Enumerator<TResult>(() => this.selectGenerator(selector));
    }

    public selectMany<TResult>(selector: IndexedSelector<TElement, Iterable<TResult>>): IEnumerable<TResult> {
        return new Enumerator(() => this.selectManyGenerator(selector));
    }

    public sequenceEqual(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement>): boolean {
        comparator ??= Comparators.equalityComparator;
        const iterator = this[Symbol.iterator]();
        const otherIterator = iterable[Symbol.iterator]();
        let first = iterator.next();
        let second = otherIterator.next();
        if (first.done && second.done) {
            return true;
        }
        while (!first.done && !second.done) {
            if (!comparator(first.value, second.value)) {
                return false;
            }
            first = iterator.next();
            second = otherIterator.next();
            if (first.done && second.done) {
                return true;
            }
        }
        return false;
    }

    public shuffle(): IEnumerable<TElement> {
        return new Enumerator(() => this.shuffleGenerator());
    }

    public single(predicate?: Predicate<TElement>): TElement {
        let result: TElement | null = null;
        let found = false;

        if (!this.any()) {
            throw new NoElementsException();
        }

        for (const item of this) {
            if (!predicate || predicate(item)) {
                if (found) {
                    throw predicate
                        ? new MoreThanOneMatchingElementException()
                        : new MoreThanOneElementException();
                }
                result = item;
                found = true;
            }
        }

        if (!found) {
            throw predicate
                ? new NoMatchingElementException()
                : new NoElementsException();
        }

        return result as TElement;
    }

    public singleOrDefault(predicate?: Predicate<TElement>): TElement | null {
        let result: TElement | null = null;
        let found = false;

        for (const item of this) {
            if (!predicate || predicate(item)) {
                if (found) {
                    throw predicate
                        ? new MoreThanOneMatchingElementException()
                        : new MoreThanOneElementException();
                }
                result = item;
                found = true;
            }
        }
        return result;
    }

    public skip(count: number): IEnumerable<TElement> {
        return new Enumerator(() => this.skipGenerator(count));
    }

    public skipLast(count: number): IEnumerable<TElement> {
        return new Enumerator(() => this.skipLastGenerator(count));
    }

    public skipWhile(predicate: IndexedPredicate<TElement>): IEnumerable<TElement> {
        return new Enumerator(() => this.skipWhileGenerator(predicate));
    }

    public span(predicate: Predicate<TElement>): [IEnumerable<TElement>, IEnumerable<TElement>] {
        const span = new List<TElement>();
        const rest = new List<TElement>();
        let found = false;
        for (const item of this) {
            if (found) {
                rest.add(item);
            } else if (predicate(item)) {
                span.add(item);
            } else {
                found = true;
                rest.add(item);
            }
        }
        return [new Enumerable(span), new Enumerable(rest)];
    }

    public step(step: number): IEnumerable<TElement> {
        if (step < 1) {
            throw new InvalidArgumentException("Step must be greater than 0.", "step");
        }
        return new Enumerator(() => this.stepGenerator(step));
    }

    public sum(selector?: Selector<TElement, number>): number {
        if (!this.any()) {
            throw new NoElementsException();
        }
        let total: number = 0;
        for (const d of this) {
            total += selector?.(d) ?? d as unknown as number;
        }
        return total;
    }

    public take(count: number): IEnumerable<TElement> {
        return new Enumerator(() => this.takeGenerator(count));
    }

    public takeLast(count: number): IEnumerable<TElement> {
        return new Enumerator(() => this.takeLastGenerator(count));
    }

    public takeWhile(predicate: IndexedPredicate<TElement>): IEnumerable<TElement> {
        return new Enumerator(() => this.takeWhileGenerator(predicate));
    }

    public thenBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): IOrderedEnumerable<TElement> {
        return OrderedEnumerator.createOrderedEnumerable(this, keySelector, true, true, comparator);
    }

    public thenByDescending<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): IOrderedEnumerable<TElement> {
        return OrderedEnumerator.createOrderedEnumerable(this, keySelector, false, true, comparator);
    }

    public toArray(): TElement[] {
        return Array.from(this);
    }

    public toDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, valueComparator?: EqualityComparator<TValue>): Dictionary<TKey, TValue> {
        const dictionary = new Dictionary<TKey, TValue>(Enumerable.empty(), valueComparator);
        for (const item of this) {
            const key = item instanceof KeyValuePair ? keySelector?.(item) ?? item.key : keySelector(item);
            const value = item instanceof KeyValuePair ? valueSelector?.(item) ?? item.value : valueSelector(item);
            dictionary.add(key, value);
        }
        return dictionary;
    }

    public toEnumerableSet(): EnumerableSet<TElement> {
        return new EnumerableSet<TElement>(this);
    }

    public toImmutableDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, valueComparator?: EqualityComparator<TValue>): ImmutableDictionary<TKey, TValue> {
        const dictionary = this.toDictionary(keySelector, valueSelector, valueComparator);
        const pairs = dictionary.keys().zip(dictionary.values()).select(x => new KeyValuePair(x[0], x[1]));
        return ImmutableDictionary.create(pairs);
    }

    public toImmutableList(comparator?: EqualityComparator<TElement>): ImmutableList<TElement> {
        return ImmutableList.create(this, comparator);
    }

    public toImmutableQueue(comparator?: EqualityComparator<TElement>): ImmutableQueue<TElement> {
        return ImmutableQueue.create(this, comparator);
    }

    public toImmutableSet(): ImmutableSet<TElement> {
        return ImmutableSet.create(this);
    }

    public toImmutableSortedDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, keyComparator?: OrderComparator<TKey>, valueComparator?: EqualityComparator<TValue>): ImmutableSortedDictionary<TKey, TValue> {
        const dictionary = this.toSortedDictionary(keySelector, valueSelector, keyComparator, valueComparator);
        const pairs = dictionary.keys().zip(dictionary.values()).select(x => new KeyValuePair(x[0], x[1]));
        return ImmutableSortedDictionary.create(pairs);
    }

    public toImmutableSortedSet(comparator?: OrderComparator<TElement>): ImmutableSortedSet<TElement> {
        return ImmutableSortedSet.create(this, comparator);
    }

    public toImmutableStack(comparator?: EqualityComparator<TElement>): ImmutableStack<TElement> {
        return ImmutableStack.create(this, comparator);
    }

    public toLinkedList(comparator?: EqualityComparator<TElement>): LinkedList<TElement> {
        return new LinkedList<TElement>(this, comparator);
    }

    public toList(comparator?: EqualityComparator<TElement>): List<TElement> {
        return new List<TElement>(this, comparator);
    }

    public toLookup<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, keyComparator?: OrderComparator<TKey>): ILookup<TKey, TValue> {
        return Lookup.create(this, keySelector, valueSelector, keyComparator);
    }

    public toMap<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>): Map<TKey, TValue> {
        const map = new Map<TKey, TValue>();
        for (const item of this) {
            const key = item instanceof KeyValuePair ? keySelector?.(item) ?? item.key : keySelector(item);
            const value = item instanceof KeyValuePair ? valueSelector?.(item) ?? item.value : valueSelector(item);
            map.set(key, value);
        }
        return map;
    }

    public toObject<TKey extends string | number | symbol, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>): Record<TKey, TValue> {
        const obj: Record<TKey, TValue> = {} as Record<TKey, TValue>;
        for (const item of this) {
            const key = item instanceof KeyValuePair ? keySelector?.(item) ?? item.key : keySelector(item);
            obj[key] = item instanceof KeyValuePair ? valueSelector?.(item) ?? item.value : valueSelector(item);
        }
        return obj;
    }

    public toPriorityQueue(comparator?: OrderComparator<TElement>): PriorityQueue<TElement> {
        return new PriorityQueue<TElement>(this, comparator);
    }

    public toQueue(comparator?: EqualityComparator<TElement>): Queue<TElement> {
        return new Queue<TElement>(this, comparator);
    }

    public toSet(): Set<TElement> {
        return new Set(this);
    }

    public toSortedDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, keyComparator?: OrderComparator<TKey>, valueComparator?: EqualityComparator<TValue>): SortedDictionary<TKey, TValue> {
        const dictionary = new SortedDictionary<TKey, TValue>([], keyComparator, valueComparator);
        for (const item of this) {
            const key = item instanceof KeyValuePair ? keySelector?.(item) ?? item.key : keySelector(item);
            const value = item instanceof KeyValuePair ? valueSelector?.(item) ?? item.value : valueSelector(item);
            dictionary.add(key, value);
        }
        return dictionary;
    }

    public toSortedSet(comparator?: OrderComparator<TElement>): SortedSet<TElement> {
        return new SortedSet<TElement>(this, comparator);
    }

    public toStack(comparator?: EqualityComparator<TElement>): Stack<TElement> {
        return new Stack<TElement>(this, comparator);
    }

    public union(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement>): IEnumerable<TElement> {
        comparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.unionGenerator(iterable, comparator));
    }

    public unionBy<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, comparator?: EqualityComparator<TKey>): IEnumerable<TElement> {
        comparator ??= Comparators.equalityComparator;
        return new Enumerator(() => this.unionByGenerator(iterable, keySelector, comparator));
    }

    public where(predicate: IndexedPredicate<TElement>): IEnumerable<TElement> {
        return new Enumerator<TElement>(() => this.whereGenerator(predicate));
    }

    public windows(size: number): IEnumerable<IEnumerable<TElement>> {
        if (size < 1) {
            throw new InvalidArgumentException("Size must be greater than 0.", "size");
        }
        return new Enumerator<IEnumerable<TElement>>(() => this.windowsGenerator(size));
    }

    public zip<TSecond, TResult = [TElement, TSecond]>(iterable: Iterable<TSecond>, zipper?: Zipper<TElement, TSecond, TResult>): IEnumerable<[TElement, TSecond]> | IEnumerable<TResult> {
        return new Enumerator(() => this.zipGenerator(iterable, zipper));
    }

    private* appendGenerator(element: TElement): IterableIterator<TElement> {
        yield* this;
        yield element;
    }

    private* castGenerator<TResult>(): IterableIterator<TResult> {
        for (const item of this) {
            yield item as unknown as TResult;
        }
    }

    private* chunkGenerator(size: number): IterableIterator<IEnumerable<TElement>> {
        const iterator = this[Symbol.iterator]();
        let next = iterator.next();
        while (!next.done) {
            const chunk = new List<TElement>();
            for (let index = 0; index < size; ++index) {
                if (next.done) {
                    break;
                }
                chunk.add(next.value);
                next = iterator.next();
            }
            yield chunk;
        }
    }

    private* combinationsGenerator(size?: number): IterableIterator<IEnumerable<TElement>> {
        const iterator = this[Symbol.iterator]();

        let next = iterator.next();
        if (next.done) {
            return yield* [];
        }

        const items = new List<TElement>();
        while (!next.done) {
            items.add(next.value);
            next = iterator.next();
        }

        const combinationCount = 1 << items.length;
        const seen = new Set<string>();

        for (let cx = 0; cx < combinationCount; ++cx) {
            const combination = new List<TElement>();
            for (let vx = 0; vx < items.length; ++vx) {
                if ((cx & (1 << vx)) !== 0) {
                    combination.add(items.elementAt(vx));
                }
            }
            if (size == null || combination.length === size) {
                const key = combination.aggregate((acc, cur) => acc + cur, ",");
                if (!seen.has(key)) {
                    seen.add(key);
                    yield combination;
                }
            }
        }
    }

    private* concatGenerator(enumerable: Iterable<TElement>): IterableIterator<TElement> {
        yield* this;
        yield* enumerable;
    }

    private* cycleGenerator(count?: number): IterableIterator<TElement> {
        if (this.none()) {
            throw new NoElementsException();
        }
        if (count == null) {
            while (true) {
                yield* this;
            }
        } else {
            for (let i = 0; i < count; ++i) {
                yield* this;
            }
        }
    }

    private* defaultIfEmptyGenerator(value?: TElement | null): IterableIterator<TElement | null> {
        if (this.any()) {
            yield* this;
        } else {
            yield value ?? null;
            yield* this;
        }
    }

    private* exceptGenerator(iterable: Iterable<any>, comparator: EqualityComparator<TElement> | OrderComparator<TElement>): IterableIterator<TElement> {
        return yield* this.exceptByGenerator(iterable, x => x, comparator);
    }

    private* exceptByGenerator<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, keyComparator: EqualityComparator<TKey> | OrderComparator<TKey>): IterableIterator<TElement> {
        const keySet = new SortedSet<TKey>([], keyComparator as OrderComparator<TKey>);
        const keyList = new List<TKey>([], keyComparator as EqualityComparator<TKey>);

        const { value: first, done } = new Enumerator<TElement>(() => iterable)[Symbol.iterator]().next();
        if (done) {
            const { value: first, done } = new Enumerator<TElement>(() => this)[Symbol.iterator]().next();
            if (done) {
                return yield* this;
            }
            const firstKey = keySelector(first);
            const keyCollection = typeof keyComparator(firstKey, firstKey) === "number" ? keySet : keyList;
            for (const item of this) {
                const key = keySelector(item);
                if (!keyCollection.contains(key)) {
                    keyCollection.add(key);
                    yield item;
                }
            }
            return;
        }

        const firstKey = keySelector(first);
        const keyCollection = typeof keyComparator(firstKey, firstKey) === "number" ? keySet : keyList;
        for (const item of iterable) {
            const key = keySelector(item);
            if (!keyCollection.contains(key)) {
                keyCollection.add(key);
            }
        }
        for (const item of this) {
            const key = keySelector(item);
            if (!keyCollection.contains(key)) {
                keyCollection.add(key);
                yield item;
            }
        }
    }

    private* groupByGenerator<TKey>(keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey>): IterableIterator<IGroup<TKey, TElement>> {
        const groupMap = new Map<TKey, IGroup<TKey, TElement>>();

        const findKeyInMap = (targetKey: TKey): TKey | undefined => {
            for (const existingKey of groupMap.keys()) {
                if (keyComparator!(existingKey, targetKey)) { // keyComparator is guaranteed to exist here
                    return existingKey;
                }
            }
            return undefined;
        };

        for (const item of this) {
            const key = keySelector(item);
            let group: IGroup<TKey, TElement> | undefined;
            let mapKey: TKey = key;

            if (keyComparator) {
                const existingKey = findKeyInMap(key);
                if (existingKey !== undefined) {
                    group = groupMap.get(existingKey);
                    mapKey = existingKey;
                }
            } else {
                group = groupMap.get(key);
            }

            if (group) {
                (group.source as List<TElement>).add(item);
            } else {
                const newList = new List([item]);
                const newGroup = new Group(key, newList);
                groupMap.set(mapKey, newGroup);
            }
        }
        yield* groupMap.values();
    }

    private* groupJoinGenerator<TInner, TKey, TResult>(innerEnumerable: IEnumerable<TInner>, outerKeySelector: Selector<TElement, TKey>, innerKeySelector: Selector<TInner, TKey>, resultSelector: JoinSelector<TElement, IEnumerable<TInner>, TResult>, keyComparator?: EqualityComparator<TKey>): IterableIterator<TResult> {
        const keyCompare = keyComparator ?? Comparators.equalityComparator;
        for (const element of this) {
            const joinedEntries = innerEnumerable.where(innerElement => keyCompare(outerKeySelector(element), innerKeySelector(innerElement)));
            yield resultSelector(element, joinedEntries);
        }
    }

    private* indexGenerator(): IterableIterator<[number, TElement]> {
        let index = 0;
        for (const item of this) {
            yield [index++, item];
        }
    }

    private* intersectGenerator(iterable: Iterable<TElement>, comparator: EqualityComparator<TElement> | OrderComparator<TElement>): IterableIterator<TElement> {
        return yield* this.intersectByGenerator(iterable, x => x, comparator);
    }

    private* intersectByGenerator<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, keyComparator: EqualityComparator<TKey> | OrderComparator<TKey>): IterableIterator<TElement> {
        const keySet = new SortedSet<TKey>([], keyComparator as OrderComparator<TKey>);
        const keyList = new List<TKey>([], keyComparator as EqualityComparator<TKey>);

        const { value: first, done } = new Enumerator<TElement>(() => iterable)[Symbol.iterator]().next();
        if (done) {
            return yield* Enumerable.empty<TElement>();
        }

        const firstKey = keySelector(first);
        const keyCollection = typeof keyComparator(firstKey, firstKey) === "number" ? keySet : keyList;
        for (const item of iterable) {
            const key = keySelector(item);
            if (!keyCollection.contains(key)) {
                keyCollection.add(key);
            }
        }
        for (const item of this) {
            const key = keySelector(item);
            if (keyCollection.remove(key)) {
                yield item;
            }
        }
    }

    private* intersperseGenerator<TSeparator = TElement>(separator: TSeparator): IterableIterator<TElement | TSeparator> {
        let index = 0;
        for (const item of this) {
            if (index !== 0) {
                yield separator;
            }
            yield item;
            ++index;
        }
    }

    private* joinGenerator<TInner, TKey, TResult>(innerEnumerable: IEnumerable<TInner>, outerKeySelector: Selector<TElement, TKey>, innerKeySelector: Selector<TInner, TKey>, resultSelector: JoinSelector<TElement, TInner, TResult>, keyComparator?: EqualityComparator<TKey>, leftJoin?: boolean): IterableIterator<TResult> {
        const keyCompare = keyComparator ?? Comparators.equalityComparator;
        for (const element of this) {
            const innerItems = innerEnumerable.where(innerElement => keyCompare(outerKeySelector(element), innerKeySelector(innerElement)));
            if (leftJoin && !innerItems.any()) {
                yield resultSelector(element, null);
            } else {
                for (const innerItem of innerItems) {
                    yield resultSelector(element, innerItem);
                }
            }
        }
    }

    private* ofTypeGenerator<TResult extends ObjectType>(type: TResult): IterableIterator<InferredType<TResult>> {
        const isOfType = typeof type === "string"
            ? ((item: unknown): boolean => typeof item === type) as (item: unknown) => item is InferredType<TResult>
            : (item: unknown): item is InferredType<TResult> => item instanceof (ClassType(type) as Function);
        for (const item of this) {
            if (isOfType(item)) {
                yield item;
            }
        }
    }

    private* pairwiseGenerator(resultSelector: PairwiseSelector<TElement, TElement>): IterableIterator<[TElement, TElement]> {
        const iterator = this[Symbol.iterator]();
        let next = iterator.next();
        while (!next.done) {
            const previous = next;
            next = iterator.next();
            if (!next.done) {
                yield resultSelector(previous.value, next.value);
            }
        }
    }

    private* permutationsGenerator(size?: number): IterableIterator<IEnumerable<TElement>> {
        const distinctElements = Array.from(this.distinct());
        yield* permutationsGenerator(distinctElements, size);
    }

    private* prependGenerator(item: TElement): IterableIterator<TElement> {
        yield item;
        yield* this;
    }

    private* reverseGenerator(): IterableIterator<TElement> {
        yield* Array.from(this).reverse();
    }

    private* scanGenerator<TAccumulate>(accumulator: Accumulator<TElement, TAccumulate>, seed?: TAccumulate): IterableIterator<TAccumulate> {
        let accumulatedValue: TAccumulate;
        if (seed == null) {
            if (!this.any()) {
                throw new NoElementsException();
            }
            accumulatedValue = this.first() as unknown as TAccumulate;
            yield accumulatedValue;
            for (const element of this.skip(1)) {
                accumulatedValue = accumulator(accumulatedValue, element);
                yield accumulatedValue;
            }
        } else {
            accumulatedValue = seed;
            for (const element of this) {
                accumulatedValue = accumulator(accumulatedValue, element);
                yield accumulatedValue;
            }
        }
    }

    private* selectGenerator<TResult>(selector: IndexedSelector<TElement, TResult>): IterableIterator<TResult> {
        let index = 0;
        for (const d of this) {
            yield selector(d, index++);
        }
    }

    private* selectManyGenerator<TResult>(selector: IndexedSelector<TElement, Iterable<TResult>>): IterableIterator<TResult> {
        let index = 0;
        for (const item of this) {
            yield* selector(item, index);
            ++index;
        }
    }

    private* shuffleGenerator(): IterableIterator<TElement> {
        const array = Array.from(this);
        Collections.shuffle(array);
        yield* array;
    }

    private* skipGenerator(count: number): IterableIterator<TElement> {
        let index = 0;
        for (const item of this) {
            if (index >= count) {
                yield item;
            }
            ++index;
        }
    }

    private* skipLastGenerator(count: number): IterableIterator<TElement> {
        if (count <= 0) {
            yield* this;
            return;
        }

        const buffer: TElement[] = new Array(count);
        let bufferSize = 0;
        let index = 0;

        for (const item of this) {
            if (bufferSize === count) {
                yield buffer[index];
            }
            buffer[index] = item;
            index = (index + 1) % count;
            if (bufferSize < count) {
                bufferSize++;
            }
        }
    }

    private* skipWhileGenerator(predicate: IndexedPredicate<TElement>): IterableIterator<TElement> {
        let index = 0;
        let skipEnded = false;
        for (const item of this) {
            if (skipEnded) {
                yield item;
            } else if (predicate(item, index)) {
                index++;
            } else {
                skipEnded = true;
                yield item;
            }
        }
    }

    private* stepGenerator(step: number): IterableIterator<TElement> {
        let index = 0;
        for (const item of this) {
            if (index % step === 0) {
                yield item;
            }
            ++index;
        }
    }

    private* takeGenerator(count: number): IterableIterator<TElement> {
        let index = 0;
        for (const item of this) {
            if (index < count) {
                yield item;
                index++;
            } else {
                break;
            }
        }
    }

    private* takeLastGenerator(count: number): IterableIterator<TElement> {
        const allItems: Array<TElement> = [];
        for (const item of this) {
            allItems.push(item);
        }
        const startIndex = Math.max(0, allItems.length - count);
        for (let i = startIndex; i < allItems.length; i++) {
            yield allItems[i];
        }
    }

    private* takeWhileGenerator(predicate: IndexedPredicate<TElement>): IterableIterator<TElement> {
        let index = 0;
        let takeEnded = false;
        for (const item of this) {
            if (!takeEnded) {
                if (predicate(item, index)) {
                    yield item;
                    ++index;
                } else {
                    takeEnded = true;
                }
            } else {
                break;
            }
        }
    }

    private* unionByGenerator<TKey>(enumerable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, comparator: EqualityComparator<TKey>): IterableIterator<TElement> {
        const isDefaultComparator = comparator === Comparators.equalityComparator;
        const seenKeysSet = isDefaultComparator ? new Set<TKey>() : null;
        const seenKeysList = isDefaultComparator ? null : new Array<TKey>();

        for (const source of [this, enumerable]) {
            for (const item of source) {
                const key = keySelector(item);
                let exists = false;

                if (seenKeysSet) {
                    exists = seenKeysSet.has(key);
                    if (!exists) {
                        seenKeysSet.add(key);
                    }
                } else if (seenKeysList) {
                    for (const seenKey of seenKeysList) {
                        if (comparator(key, seenKey)) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        seenKeysList.push(key);
                    }
                }

                if (!exists) {
                    yield item;
                }
            }
        }
    }

    private* unionGenerator(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement>): IterableIterator<TElement> {
        return yield* this.unionByGenerator(iterable, x => x, comparator ?? Comparators.equalityComparator);
    }

    private* whereGenerator(predicate: IndexedPredicate<TElement>): IterableIterator<TElement> {
        let index = 0;
        for (const d of this) {
            if (predicate(d, index)) {
                yield d;
            }
            ++index;
        }
    }

    private* windowsGenerator(size: number): IterableIterator<IEnumerable<TElement>> {
        const iterator = this[Symbol.iterator]();
        const window = new List<TElement>();
        for (let item = iterator.next(); !item.done; item = iterator.next()) {
            window.add(item.value);
            if (window.size() === size) {
                yield window.toImmutableList();
                window.removeAt(0);
            }
        }
    }

    private* zipGenerator<TSecond, TResult = [TElement, TSecond]>(iterable: Iterable<TSecond>, zipper?: Zipper<TElement, TSecond, TResult>): IterableIterator<TResult> {
        const iterator = this[Symbol.iterator]();
        const otherIterator = iterable[Symbol.iterator]();
        while (true) {
            let first = iterator.next();
            let second = otherIterator.next();
            if (first.done || second.done) {
                break;
            } else {
                yield zipper?.(first.value, second.value) ?? [first.value, second.value] as TResult;
            }
        }
    }
}
