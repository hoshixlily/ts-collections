import { EqualityComparator } from "./EqualityComparator";
import { OrderComparator } from "./OrderComparator";

export abstract class Comparators {
    /* istanbul ignore next */
    private constructor() {
    }

    public static readonly equalityComparator: EqualityComparator<unknown>
        = <TElement>(e1: TElement, e2: TElement) => Object.is(e1, e2);
    public static readonly orderComparator: OrderComparator<unknown>
        = <TElement>(e1: TElement, e2: TElement) => e1 === e2 ? 0 : e1 > e2 ? 1 : -1;
    public static readonly reverseOrderComparator: OrderComparator<unknown>
        = <TElement>(e1: TElement, e2: TElement) => e1 === e2 ? 0 : e1 > e2 ? -1 : 1;
}
