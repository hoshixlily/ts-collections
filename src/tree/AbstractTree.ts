import { AbstractRandomAccessCollection } from "../core/AbstractRandomAccessCollection";
import { Comparators } from "../shared/Comparators";
import { EqualityComparator } from "../shared/EqualityComparator";
import { IndexedAction } from "../shared/IndexedAction";
import { OrderComparator } from "../shared/OrderComparator";
import { Predicate } from "../shared/Predicate";
import { Selector } from "../shared/Selector";
import { Stack } from "../stack/Stack";
import { INode } from "./INode";
import { ITree, TraverseType } from "./ITree";

export abstract class AbstractTree<TElement> extends AbstractRandomAccessCollection<TElement> implements ITree<TElement> {
    protected readonly orderComparator: OrderComparator<TElement>;
    protected root: INode<TElement> | null = null;
    protected treeSize: number = 0;

    protected constructor(comparator?: OrderComparator<TElement>) {
        super(((e1: TElement, e2: TElement) => Object.is(e1, e2) || (comparator ?? Comparators.orderComparator)(e1, e2) === 0));
        this.orderComparator = comparator ?? Comparators.orderComparator;
    }

    * [Symbol.iterator](): Iterator<TElement> {
        const stack = new Stack<INode<TElement>>();
        let current = this.root;
        while (current != null || !stack.isEmpty()) {
            while (current != null) {
                stack.push(current);
                current = current.getLeft();
            }
            current = stack.pop();
            if (current != null) {
                yield current.getData();
                current = current.getRight();
            }
        }
    }

    public clear(): void {
        this.root = null;
        this.treeSize = 0;
    }

    public override contains(element: TElement, comparator?: EqualityComparator<TElement>): boolean {
        comparator ??= this.comparer;
        return this.containsRecursive(this.root, element, comparator);
    }

    public find(predicate: Predicate<TElement>): TElement | null {
        if (this.root == null) {
            return null;
        }
        return this.findRecursive(this.root, predicate);
    }

    public findBy<TKey>(key: TKey, selector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): TElement | null {
        if (this.root == null) {
            return null;
        }
        comparator ??= Comparators.orderComparator;
        return this.findByRecursive(this.root, key, selector, comparator);
    }

    public override forEach(action: IndexedAction<TElement>): void {
        if (this.root == null) {
            return;
        }
        super.forEach(action);
    }

    public getRootData(): TElement | null {
        return this.root?.getData() ?? null;
    }

    public override isEmpty(): boolean {
        return this.root == null;
    }

    public remove(element: TElement): boolean {
        if (!this.search(element)) {
            return false;
        }
        this.delete(element);
        return true;
    }

    public removeBy<TKey>(key: TKey, selector: Selector<TElement, TKey>, comparator?: OrderComparator<TKey>): TElement | null {
        if (this.root == null) {
            return null;
        }
        comparator ??= Comparators.orderComparator;
        return this.removeByRecursive(this.root, key, selector, comparator);
    }

    public size(): number {
        return this.treeSize;
    }

    public override toArray(): TElement[] {
        const target: TElement[] = [];
        if (this.isEmpty()) {
            return target;
        }
        this.toArrayRecursive(<INode<TElement>>this.root, target);
        return target;
    }

    public traverseToArray(direction: TraverseType = "INORDER"): TElement[] {
        const array: TElement[] = [];
        switch (direction) {
            case "INORDER":
                this.toInorderArray(this.root, array);
                break;
            case "POSTORDER":
                this.toPostorderArray(this.root, array);
                break;
            case "PREORDER":
                this.toPreorderArray(this.root, array);
                break;
        }
        return array;
    }

    public override get length(): number {
        return this.treeSize;
    }

    protected toInorderArray(root: INode<TElement> | null, target: TElement[]): void {
        if (root == null) return;
        this.toInorderArray(root.getLeft(), target);
        target.push(root.getData());
        this.toInorderArray(root.getRight(), target);
    }

    protected toPostorderArray(root: INode<TElement> | null, target: TElement[]): void {
        if (root == null) return;
        this.toPostorderArray(root.getLeft(), target);
        this.toPostorderArray(root.getRight(), target);
        target.push(root.getData());
    }

    protected toPreorderArray(root: INode<TElement> | null, target: TElement[]): void {
        if (root == null) return;
        target.push(root.getData());
        this.toPreorderArray(root.getLeft(), target);
        this.toPreorderArray(root.getRight(), target);
    }

    private containsRecursive(root: INode<TElement> | null, element: TElement, comparator: EqualityComparator<TElement>): boolean {
        if (root == null) {
            return false;
        }
        const equal = comparator(element, root.getData());
        if (equal) {
            return true;
        }
        const order = this.orderComparator(element, root.getData());
        return order < 0
            ? this.containsRecursive(root.getLeft(), element, comparator)
            : this.containsRecursive(root.getRight(), element, comparator);
    }

    private findByRecursive<TKey>(root: INode<TElement> | null, key: TKey, selector: Selector<TElement, TKey>, comparator: OrderComparator<TKey>): TElement | null {
        if (root == null) {
            return null;
        }
        const order = comparator(key, selector(root.getData()));
        if (order === 0) {
            return root.getData();
        }
        if (order < 0) {
            return this.findByRecursive(root.getLeft(), key, selector, comparator);
        } else {
            return this.findByRecursive(root.getRight(), key, selector, comparator);
        }
    }

    private findRecursive(root: INode<TElement> | null, predicate: Predicate<TElement>): TElement | null {
        if (root == null) {
            return null;
        }
        if (predicate(root.getData())) {
            return root.getData();
        }
        const foundItem: TElement | null = this.findRecursive(root.getLeft(), predicate);
        if (foundItem != null) {
            return foundItem;
        }
        return this.findRecursive(root.getRight(), predicate);
    }

    private removeByRecursive<TKey>(root: INode<TElement> | null, key: TKey, selector: Selector<TElement, TKey>, comparator: OrderComparator<TKey>): TElement | null {
        if (root == null) {
            return null;
        }
        const order = comparator(key, selector(root.getData()));
        if (order === 0) {
            const element = root.getData();
            this.delete(root.getData());
            return element;
        }
        if (order < 0) {
            return this.removeByRecursive(root.getLeft(), key, selector, comparator);
        } else {
            return this.removeByRecursive(root.getRight(), key, selector, comparator);
        }
    }

    private toArrayRecursive(root: INode<TElement> | null, target: TElement[]): void {
        if (root == null) {
            return;
        }
        this.toArrayRecursive(root.getLeft(), target);
        target.push(root.getData());
        this.toArrayRecursive(root.getRight(), target);
    }

    public abstract override add(element: TElement): boolean;

    public abstract delete(element: TElement): void;

    public abstract insert(element: TElement): void;

    public abstract search(element: TElement): boolean;
}
