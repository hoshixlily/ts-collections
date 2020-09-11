import {IGrouping} from "./IGrouping";
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

export interface IEnumerable<T> extends Iterable<T> {
    aggregate<R, U = R>(aggregator: Aggregator<T, R>, seed?: R, resultSelector?: Selector<R, U>): R | U;
    all(comparator?: Predicate<T>): boolean;
    any(comparator?: Predicate<T>): boolean;
    append(item: T): IEnumerable<T>;
    average(selector?: Selector<T, number>): number;
    concat(enumerable: IEnumerable<T>): IEnumerable<T>;
    contains(item: T, comparator?: Comparator<T>): boolean;
    count(predicate?: Predicate<T>): number;
    defaultIfEmpty(value?: T): IEnumerable<T>;
    distinct(comparator?: Comparator<T>): IEnumerable<T>;
    elementAt(index: number): T;
    elementAtOrDefault(index: number): T;
    except(enumerable: IEnumerable<T>, comparator?: Comparator<T>): IEnumerable<T>;
    first(predicate?: Predicate<T>): T;
    firstOrDefault(predicate?: Predicate<T>): T;
    groupBy<R>(keySelector: Selector<T, R>, keyComparator?: Comparator<R>): IEnumerable<IGrouping<R, T>>;
    groupJoin<E, K, R>(enumerable: IEnumerable<E>, outerKeySelector: Selector<T, K>, innerKeySelector: Selector<E, K>,
                       resultSelector: JoinSelector<K, IEnumerable<E>, R>, keyComparator?: Comparator<K>): IEnumerable<R>;
    intersect(enumerable: IEnumerable<T>, comparator?: Comparator<T>): IEnumerable<T>;
    join<E, K, R>(enumerable: IEnumerable<E>, outerKeySelector: Selector<T, K>, innerKeySelector: Selector<E, K>,
                  resultSelector: JoinSelector<T, E, R>, keyComparator?: Comparator<K>, leftJoin?: boolean): IEnumerable<R>;
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
    sequenceEqual(enumerable: IEnumerable<T>, comparator?: Comparator<T>): boolean;
    single(predicate?: Predicate<T>): T;
    singleOrDefault(predicate?: Predicate<T>): T;
    skip(count: number): IEnumerable<T>;
    skipLast(count: number): IEnumerable<T>;
    skipWhile(predicate: IndexedPredicate<T>): IEnumerable<T>;
    sum(selector: Selector<T, number>): number;
    take(count: number): IEnumerable<T>;
    takeEvery(step: number): IEnumerable<T>;
    takeLast(count: number): IEnumerable<T>;
    takeWhile(predicate: IndexedPredicate<T>): IEnumerable<T>;
    toArray(): T[];
    toList(): List<T>;
    union(enumerable: IEnumerable<T>, comparator?: Comparator<T>): IEnumerable<T>;
    where(predicate: Predicate<T>): IEnumerable<T>;
    zip<R, U>(enumerable: IEnumerable<R>, zipper?: Zipper<T, R, U>): IEnumerable<[T, R]> | IEnumerable<U>;
}
