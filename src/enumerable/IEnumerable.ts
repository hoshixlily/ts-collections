import {Aggregator} from "../shared/Aggregator";
import {Selector} from "../shared/Selector";
import {Predicate} from "../shared/Predicate";
import {Comparator} from "../shared/Comparator";
import {JoinSelector} from "../shared/JoinSelector";
import {IOrderedEnumerable} from "./IOrderedEnumerable";
import {IndexedSelector} from "../shared/IndexedSelector";
import {IndexedPredicate} from "../shared/IndexedPredicate";
import {Zipper} from "../shared/Zipper";
import {List} from "../list/List";
import {EqualityComparator} from "../shared/EqualityComparator";
import {IGrouping} from "./Enumerable";
import {Dictionary} from "../dictionary/Dictionary";

export interface IEnumerable<T> extends Iterable<T> {
    aggregate<R, U = R>(aggregator: Aggregator<T, R>, seed?: R, resultSelector?: Selector<R, U>): R | U;
    all(predicate?: Predicate<T>): boolean;
    any(predicate?: Predicate<T>): boolean;
    append(item: T): IEnumerable<T>;
    average(selector?: Selector<T, number>): number;
    concat(enumerable: IEnumerable<T>): IEnumerable<T>;
    contains(item: T, comparator?: EqualityComparator<T>): boolean;
    count(predicate?: Predicate<T>): number;
    defaultIfEmpty(value?: T): IEnumerable<T>;
    distinct(comparator?: EqualityComparator<T>): IEnumerable<T>;
    elementAt(index: number): T;
    elementAtOrDefault(index: number): T;
    except(enumerable: IEnumerable<T>, comparator?: EqualityComparator<T>): IEnumerable<T>;
    first(predicate?: Predicate<T>): T;
    firstOrDefault(predicate?: Predicate<T>): T;
    groupBy<K>(keySelector: Selector<T, K>, keyComparator?: EqualityComparator<K>): IEnumerable<IGrouping<K, T>>;
    groupJoin<E, K, R>(enumerable: IEnumerable<E>, outerKeySelector: Selector<T, K>, innerKeySelector: Selector<E, K>,
                       resultSelector: JoinSelector<K, IEnumerable<E>, R>, keyComparator?: EqualityComparator<K>): IEnumerable<R>;
    intersect(enumerable: IEnumerable<T>, comparator?: EqualityComparator<T>): IEnumerable<T>;
    join<E, K, R>(enumerable: IEnumerable<E>, outerKeySelector: Selector<T, K>, innerKeySelector: Selector<E, K>,
                  resultSelector: JoinSelector<T, E, R>, keyComparator?: EqualityComparator<K>, leftJoin?: boolean): IEnumerable<R>;
    last(predicate?: Predicate<T>): T;
    lastOrDefault(predicate?: Predicate<T>): T;
    max(selector?: Selector<T, number>): number;
    min(selector?: Selector<T, number>): number;
    orderBy<K>(keySelector: Selector<T, K>, comparator?: Comparator<K>): IOrderedEnumerable<T>;
    orderByDescending<K>(keySelector: Selector<T, K>, comparator?: Comparator<K>): IOrderedEnumerable<T>;
    prepend(item: T): IEnumerable<T>;
    reverse(): IEnumerable<T>;
    select<R>(selector: Selector<T, R>): IEnumerable<R>;
    selectMany<R>(selector: IndexedSelector<T, Iterable<R>>): IEnumerable<R>;
    sequenceEqual(enumerable: IEnumerable<T>, comparator?: EqualityComparator<T>): boolean;
    single(predicate?: Predicate<T>): T;
    singleOrDefault(predicate?: Predicate<T>): T;
    skip(count: number): IEnumerable<T>;
    skipLast(count: number): IEnumerable<T>;
    skipWhile(predicate: IndexedPredicate<T>): IEnumerable<T>;
    sum(selector?: Selector<T, number>): number;
    take(count: number): IEnumerable<T>;
    takeLast(count: number): IEnumerable<T>;
    takeWhile(predicate: IndexedPredicate<T>): IEnumerable<T>;
    toArray(): T[];
    toDictionary<K, V>(keySelector?: Selector<T, K>, valueSelector?: Selector<T, V>, keyComparator?: EqualityComparator<K>): Dictionary<K, V>;
    toList(): List<T>;
    union(enumerable: IEnumerable<T>, comparator?: EqualityComparator<T>): IEnumerable<T>;
    where(predicate: Predicate<T>): IEnumerable<T>;
    zip<R, U=[T,R]>(enumerable: IEnumerable<R>, zipper?: Zipper<T, R, U>): IEnumerable<[T, R]> | IEnumerable<U>;
}
