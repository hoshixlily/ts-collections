import { KeyValuePair } from "../dictionary/KeyValuePair";
import {
    CircularLinkedList,
    Dictionary,
    EnumerableSet,
    Enumerator,
    IEnumerable,
    IGroup,
    ILookup,
    ImmutableDictionary,
    ImmutableList,
    ImmutablePriorityQueue,
    ImmutableQueue,
    ImmutableSet,
    ImmutableSortedDictionary,
    ImmutableSortedSet,
    ImmutableStack,
    IOrderedEnumerable,
    LinkedList,
    List,
    PriorityQueue,
    Queue,
    SortedDictionary,
    SortedSet,
    Stack
} from "../imports";
import { Accumulator } from "../shared/Accumulator";
import { EqualityComparator } from "../shared/EqualityComparator";
import { IndexedAction } from "../shared/IndexedAction";
import { IndexedPredicate } from "../shared/IndexedPredicate";
import { IndexedSelector } from "../shared/IndexedSelector";
import { InferredType } from "../shared/InferredType";
import { JoinSelector } from "../shared/JoinSelector";
import { ObjectType } from "../shared/ObjectType";
import { OrderComparator } from "../shared/OrderComparator";
import { PairwiseSelector } from "../shared/PairwiseSelector";
import { Predicate } from "../shared/Predicate";
import { Selector } from "../shared/Selector";
import { Zipper } from "../shared/Zipper";

export class Enumerable<TElement> implements IEnumerable<TElement> {
    readonly #enumerator: Enumerator<TElement>;

    public constructor(private readonly iterable: Iterable<TElement>) {
        this.#enumerator = new Enumerator<TElement>(() => iterable);
    }

    /**
     * Creates an empty sequence.
     *
     * @template TElement The type of elements in the sequence.
     * @returns {IEnumerable<TElement>} An empty sequence.
     */
    public static empty<TSource>(): IEnumerable<TSource> {
        return new Enumerable<TSource>([]);
    }

    /**
     * Creates an enumerable sequence from the given source.
     * @template TElement The type of elements in the sequence.
     * @param source The source iterable that will be converted to an enumerable sequence.
     * @returns {IEnumerable<TElement>} An enumerable sequence that contains the elements of the source.
     */
    public static from<TSource>(source: Iterable<TSource>): IEnumerable<TSource> {
        return new Enumerable(source);
    }

    /**
     * Creates a range of numbers starting from the specified start value and containing the specified count of elements.
     * @param {number} start The start value of the range.
     * @param {number} count The number of elements in the range.
     * @returns {IEnumerable<number>} An enumerable range of numbers.
     */
    public static range(start: number, count: number): IEnumerable<number> {
        return new Enumerator(function* () {
            for (let ix = 0; ix < count; ++ix) {
                yield start + ix;
            }
        });
    }

    /**
     * Repeats the specified element a specified number of times.
     *
     * @template TElement The type of the element to repeat.
     * @param {TElement} element The element to repeat.
     * @param {number} count The number of times to repeat the element.
     * @returns {IEnumerable<TElement>} An Iterable representing the repeated elements.
     */
    public static repeat<TSource>(element: TSource, count: number): IEnumerable<TSource> {
        return new Enumerator(function* () {
            for (let ix = 0; ix < count; ++ix) {
                yield element;
            }
        });
    }

    * [Symbol.iterator](): Iterator<TElement> {
        yield* this.iterable;
    }

    public aggregate<TAccumulate = TElement, TResult = TAccumulate>(accumulator: Accumulator<TElement, TAccumulate>, seed?: TAccumulate, resultSelector?: Selector<TAccumulate, TResult>): TAccumulate | TResult {
        return this.#enumerator.aggregate(accumulator, seed, resultSelector);
    }

    public aggregateBy<TKey, TAccumulate = TElement>(keySelector: Selector<TElement, TKey>, seedSelector: Selector<TKey, TAccumulate> | TAccumulate, accumulator: Accumulator<TElement, TAccumulate>, keyComparator?: EqualityComparator<TKey>): IEnumerable<KeyValuePair<TKey, TAccumulate>> {
        return this.#enumerator.aggregateBy(keySelector, seedSelector, accumulator, keyComparator);
    }

    public all(predicate: Predicate<TElement>): boolean {
        return this.#enumerator.all(predicate);
    }

    public any(predicate?: Predicate<TElement>): boolean {
        return this.#enumerator.any(predicate);
    }

    public append(element: TElement): IEnumerable<TElement> {
        return this.#enumerator.append(element);
    }

    public average(selector?: Selector<TElement, number>): number {
        return this.#enumerator.average(selector);
    }

    public cast<TResult>(): IEnumerable<TResult> {
        return this.#enumerator.cast();
    }

    public chunk(size: number): IEnumerable<IEnumerable<TElement>> {
        return this.#enumerator.chunk(size);
    }

    public combinations(size?: number): IEnumerable<IEnumerable<TElement>> {
        return this.#enumerator.combinations(size);
    }

    public concat(iterable: Iterable<TElement>): IEnumerable<TElement> {
        return this.#enumerator.concat(iterable);
    }

    public contains(element: TElement, comparator?: EqualityComparator<TElement>): boolean {
        return this.#enumerator.contains(element, comparator);
    }

    public count(predicate?: Predicate<TElement>): number {
        return this.#enumerator.count(predicate);
    }

    public countBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: EqualityComparator<TKey>): IEnumerable<KeyValuePair<TKey, number>> {
        return this.#enumerator.countBy(keySelector, comparator);
    }

    public cycle(count?: number): IEnumerable<TElement> {
        return this.#enumerator.cycle(count);
    }

    public defaultIfEmpty(value?: TElement | null): IEnumerable<TElement | null> {
        return this.#enumerator.defaultIfEmpty(value);
    }

    public distinct( keyComparator?: EqualityComparator<TElement>): IEnumerable<TElement> {
        return this.#enumerator.distinct(keyComparator);
    }

    public distinctBy<TKey>(keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey>): IEnumerable<TElement> {
        return this.#enumerator.distinctBy(keySelector, keyComparator);
    }

    public elementAt(index: number): TElement {
        return this.#enumerator.elementAt(index);
    }

    public elementAtOrDefault(index: number): TElement | null {
        return this.#enumerator.elementAtOrDefault(index);
    }

    public except(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement> | OrderComparator<TElement>): IEnumerable<TElement> {
        return this.#enumerator.except(iterable, comparator);
    }

    public exceptBy<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey> | OrderComparator<TKey>): IEnumerable<TElement> {
        return this.#enumerator.exceptBy(iterable, keySelector, keyComparator);
    }

    public first(predicate?: Predicate<TElement>): TElement {
        return this.#enumerator.first(predicate);
    }

    public firstOrDefault(predicate?: Predicate<TElement>): TElement | null {
        return this.#enumerator.firstOrDefault(predicate);
    }

    public forEach(action: IndexedAction<TElement>): void {
        this.#enumerator.forEach(action);
    }

    public groupBy<TKey>(keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey>): IEnumerable<IGroup<TKey, TElement>> {
        return this.#enumerator.groupBy(keySelector, keyComparator);
    }

    public groupJoin<TInner, TKey, TResult>(innerEnumerable: IEnumerable<TInner>, outerKeySelector: Selector<TElement, TKey>, innerKeySelector: Selector<TInner, TKey>, resultSelector: JoinSelector<TElement, IEnumerable<TInner>, TResult>, keyComparator?: EqualityComparator<TKey>): IEnumerable<TResult> {
        return this.#enumerator.groupJoin(innerEnumerable, outerKeySelector, innerKeySelector, resultSelector, keyComparator);
    }

    public index(): IEnumerable<[number, TElement]> {
        return this.#enumerator.index();
    }

    public intersect(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement> | OrderComparator<TElement>): IEnumerable<TElement> {
        return this.#enumerator.intersect(iterable, comparator);
    }

    public intersectBy<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, keyComparator?: EqualityComparator<TKey> | OrderComparator<TKey>): IEnumerable<TElement> {
        return this.#enumerator.intersectBy(iterable, keySelector, keyComparator);
    }

    public intersperse<TSeparator = TElement>(separator: TSeparator): IEnumerable<TElement | TSeparator> {
        return this.#enumerator.intersperse(separator);
    }

    public join<TInner, TKey, TResult>(innerEnumerable: IEnumerable<TInner>, outerKeySelector: Selector<TElement, TKey>, innerKeySelector: Selector<TInner, TKey>, resultSelector: JoinSelector<TElement, TInner, TResult>, keyComparator?: EqualityComparator<TKey>, leftJoin?: boolean): IEnumerable<TResult> {
        return this.#enumerator.join(innerEnumerable, outerKeySelector, innerKeySelector, resultSelector, keyComparator, leftJoin);
    }

    public last(predicate?: Predicate<TElement>): TElement {
        return this.#enumerator.last(predicate);
    }

    public lastOrDefault(predicate?: Predicate<TElement>): TElement | null {
        return this.#enumerator.lastOrDefault(predicate);
    }

    public max(selector?: Selector<TElement, number>): number {
        return this.#enumerator.max(selector);
    }

    public maxBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): TElement {
        return this.#enumerator.maxBy(keySelector, comparator);
    }

    public min(selector?: Selector<TElement, number>): number {
        return this.#enumerator.min(selector);
    }

    public minBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): TElement {
        return this.#enumerator.minBy(keySelector, comparator);
    }

    public none(predicate?: Predicate<TElement>): boolean {
        return this.#enumerator.none(predicate);
    }

    public ofType<TResult extends ObjectType>(type: TResult): IEnumerable<InferredType<TResult>> {
        return this.#enumerator.ofType(type);
    }

    public orderBy<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): IOrderedEnumerable<TElement> {
        return this.#enumerator.orderBy(keySelector, comparator);
    }

    public orderByDescending<TKey>(keySelector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): IOrderedEnumerable<TElement> {
        return this.#enumerator.orderByDescending(keySelector, comparator);
    }

    public pairwise(resulSelector?: PairwiseSelector<TElement, TElement>): IEnumerable<[TElement, TElement]> {
        return this.#enumerator.pairwise(resulSelector);
    }

    public partition(predicate: Predicate<TElement>): [IEnumerable<TElement>, IEnumerable<TElement>] {
        return this.#enumerator.partition(predicate);
    }

    public permutations(size?: number): IEnumerable<IEnumerable<TElement>> {
        return this.#enumerator.permutations(size);
    }

    public prepend(element: TElement): IEnumerable<TElement> {
        return this.#enumerator.prepend(element);
    }

    public product(selector?: Selector<TElement, number>): number {
        return this.#enumerator.product(selector);
    }

    public reverse(): IEnumerable<TElement> {
        return this.#enumerator.reverse();
    }

    public scan<TAccumulate = TElement>(accumulator: Accumulator<TElement, TAccumulate>, seed?: TAccumulate): IEnumerable<TAccumulate> {
        return this.#enumerator.scan(accumulator, seed);
    }

    public select<TResult>(selector: IndexedSelector<TElement, TResult>): IEnumerable<TResult> {
        return this.#enumerator.select(selector);
    }

    public selectMany<TResult>(selector: IndexedSelector<TElement, Iterable<TResult>>): IEnumerable<TResult> {
        return this.#enumerator.selectMany(selector);
    }

    public sequenceEqual(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement>): boolean {
        return this.#enumerator.sequenceEqual(iterable, comparator);
    }

    public shuffle(): IEnumerable<TElement> {
        return this.#enumerator.shuffle();
    }

    public single(predicate?: Predicate<TElement>): TElement {
        return this.#enumerator.single(predicate);
    }

    public singleOrDefault(predicate?: Predicate<TElement>): TElement | null {
        return this.#enumerator.singleOrDefault(predicate);
    }

    public skip(count: number): IEnumerable<TElement> {
        return this.#enumerator.skip(count);
    }

    public skipLast(count: number): IEnumerable<TElement> {
        return this.#enumerator.skipLast(count);
    }

    public skipWhile(predicate: IndexedPredicate<TElement>): IEnumerable<TElement> {
        return this.#enumerator.skipWhile(predicate);
    }

    public span(predicate: Predicate<TElement>): [IEnumerable<TElement>, IEnumerable<TElement>] {
        return this.#enumerator.span(predicate);
    }

    public step(step: number): IEnumerable<TElement> {
        return this.#enumerator.step(step);
    }

    public sum(selector?: Selector<TElement, number>): number {
        return this.#enumerator.sum(selector);
    }

    public take(count: number): IEnumerable<TElement> {
        return this.#enumerator.take(count);
    }

    public takeLast(count: number): IEnumerable<TElement> {
        return this.#enumerator.takeLast(count);
    }

    public takeWhile(predicate: IndexedPredicate<TElement>): IEnumerable<TElement> {
        return this.#enumerator.takeWhile(predicate);
    }

    public toArray(): TElement[] {
        return this.#enumerator.toArray();
    }

    public toCircularLinkedList(comparator?: EqualityComparator<TElement, TElement>): CircularLinkedList<TElement> {
        return this.#enumerator.toCircularLinkedList(comparator);
    }

    public toDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, valueComparator?: EqualityComparator<TValue>): Dictionary<TKey, TValue> {
        return this.#enumerator.toDictionary(keySelector, valueSelector, valueComparator);
    }

    public toEnumerableSet(): EnumerableSet<TElement> {
        return this.#enumerator.toEnumerableSet();
    }

    public toImmutableDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, valueComparator?: EqualityComparator<TValue>): ImmutableDictionary<TKey, TValue> {
        return this.#enumerator.toImmutableDictionary(keySelector, valueSelector, valueComparator);
    }

    public toImmutableList(comparator?: EqualityComparator<TElement>): ImmutableList<TElement> {
        return this.#enumerator.toImmutableList(comparator);
    }

    public toImmutablePriorityQueue(comparator?: OrderComparator<TElement>): ImmutablePriorityQueue<TElement> {
        return this.#enumerator.toImmutablePriorityQueue(comparator);
    }

    public toImmutableQueue(comparator?: EqualityComparator<TElement>): ImmutableQueue<TElement> {
        return this.#enumerator.toImmutableQueue(comparator);
    }

    public toImmutableSet(): ImmutableSet<TElement> {
        return this.#enumerator.toImmutableSet();
    }

    public toImmutableSortedDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, keyComparator?: OrderComparator<TKey>, valueComparator?: EqualityComparator<TValue>): ImmutableSortedDictionary<TKey, TValue> {
        return this.#enumerator.toImmutableSortedDictionary(keySelector, valueSelector, keyComparator, valueComparator);
    }

    public toImmutableSortedSet(comparator?: OrderComparator<TElement>): ImmutableSortedSet<TElement> {
        return this.#enumerator.toImmutableSortedSet(comparator);
    }

    public toImmutableStack(comparator?: EqualityComparator<TElement>): ImmutableStack<TElement> {
        return this.#enumerator.toImmutableStack(comparator);
    }

    public toLinkedList(comparator?: EqualityComparator<TElement>): LinkedList<TElement> {
        return this.#enumerator.toLinkedList(comparator);
    }

    public toList(comparator?: EqualityComparator<TElement>): List<TElement> {
        return this.#enumerator.toList(comparator);
    }

    public toLookup<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, keyComparator?: OrderComparator<TKey>): ILookup<TKey, TValue> {
        return this.#enumerator.toLookup(keySelector, valueSelector, keyComparator);
    }

    public toMap<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>): Map<TKey, TValue> {
        return this.#enumerator.toMap(keySelector, valueSelector);
    }

    public toObject<TKey extends string | number | symbol, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>): Record<TKey, TValue> {
        return this.#enumerator.toObject(keySelector, valueSelector);
    }

    public toPriorityQueue(comparator?: OrderComparator<TElement>): PriorityQueue<TElement> {
        return this.#enumerator.toPriorityQueue(comparator);
    }

    public toQueue(comparator?: EqualityComparator<TElement>): Queue<TElement> {
        return this.#enumerator.toQueue(comparator);
    }

    public toSet(): Set<TElement> {
        return this.#enumerator.toSet();
    }

    public toSortedDictionary<TKey, TValue>(keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>, keyComparator?: OrderComparator<TKey>, valueComparator?: EqualityComparator<TValue>): SortedDictionary<TKey, TValue> {
        return this.#enumerator.toSortedDictionary(keySelector, valueSelector, keyComparator, valueComparator);
    }

    public toSortedSet(comparator?: OrderComparator<TElement>): SortedSet<TElement> {
        return this.#enumerator.toSortedSet(comparator);
    }

    public toStack(comparator?: EqualityComparator<TElement>): Stack<TElement> {
        return this.#enumerator.toStack(comparator);
    }

    public union(iterable: Iterable<TElement>, comparator?: EqualityComparator<TElement>): IEnumerable<TElement> {
        return this.#enumerator.union(iterable, comparator);
    }

    public unionBy<TKey>(iterable: Iterable<TElement>, keySelector: Selector<TElement, TKey>, comparator?: EqualityComparator<TKey>): IEnumerable<TElement> {
        return this.#enumerator.unionBy(iterable, keySelector, comparator);
    }

    public where(predicate: IndexedPredicate<TElement>): IEnumerable<TElement> {
        return this.#enumerator.where(predicate);
    }

    public windows(size: number): IEnumerable<IEnumerable<TElement>> {
        return this.#enumerator.windows(size);
    }

    public zip<TSecond, TResult = [TElement, TSecond]>(iterable: Iterable<TSecond>, zipper?: Zipper<TElement, TSecond, TResult>): IEnumerable<[TElement, TSecond]> | IEnumerable<TResult> {
        return this.#enumerator.zip(iterable, zipper);
    }
}
