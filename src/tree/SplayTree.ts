import { AbstractTree } from "../imports";
import { OrderComparator } from "../shared/OrderComparator";
import { Predicate } from "../shared/Predicate";
import { INode } from "./INode";

class SplayNode<T> implements INode<T> {
    public data: T;
    public left: SplayNode<T> | null = null;
    public parent: SplayNode<T> | null = null;
    public right: SplayNode<T> | null = null;

    public constructor(data: T, parent: SplayNode<T> | null = null) {
        this.data = data;
        this.parent = parent;
    }

    public getData(): T {
        return this.data;
    }

    public getLeft(): SplayNode<T> | null {
        return this.left;
    }

    public getRight(): SplayNode<T> | null {
        return this.right;
    }

    public setData(data: T): void {
        this.data = data;
    }

    public setLeft(node: INode<T> | null): void {
        this.left = node as SplayNode<T> | null;
        if (this.left) {
            this.left.parent = this;
        }
    }

    public setRight(node: INode<T> | null): void {
        this.right = node as SplayNode<T> | null;
        if (this.right) {
            this.right.parent = this;
        }
    }
}

export class SplayTree<TElement> extends AbstractTree<TElement> {
    protected override root: SplayNode<TElement> | null = null;

    constructor(comparator?: OrderComparator<TElement>) {
        super(comparator);
    }

    public add(element: TElement): boolean {
        if (!this.root) {
            this.root = new SplayNode(element);
            this.treeSize++;
            return true;
        }
        let current: SplayNode<TElement> | null = this.root;
        let parent: SplayNode<TElement> | null = null;
        while (current) {
            parent = current;
            const cmp = this.orderComparator(element, current.getData());
            if (cmp < 0) {
                current = current.getLeft() as SplayNode<TElement> | null;
            } else if (cmp > 0) {
                current = current.getRight() as SplayNode<TElement> | null;
            } else {
                this.splay(current);
                return false; // duplicate
            }
        }
        const newNode = new SplayNode(element, parent);
        if (this.orderComparator(element, parent!.getData()) < 0) {
            parent!.setLeft(newNode);
        } else {
            parent!.setRight(newNode);
        }
        this.splay(newNode);
        this.treeSize++;
        return true;
    }

    public override contains(element: TElement): boolean {
        return this.search(element);
    }

    public delete(element: TElement): void {
        if (!this.search(element)) {
            return; // If found, node is splayed at root
         }
        const left = this.root!.getLeft() as SplayNode<TElement> | null;
        const right = this.root!.getRight() as SplayNode<TElement> | null;

        if (left) {
            left.parent = null;
        }
        if (right) {
            right.parent = null;
        }

        if (!left) {
            this.root = right;
        } else {
            // find maximum node in left subtree
            let maxNode = left;
            while (maxNode.getRight()) {
                maxNode = maxNode.getRight() as SplayNode<TElement>;
            }
            this.splay(maxNode);
            this.root!.setRight(right);
            if (right) {
                right.parent = this.root;
            }
        }
        this.treeSize--;
    }

    public insert(element: TElement): void {
        this.add(element);
    }

    public removeAll<TSource extends TElement>(collection: Iterable<TSource>): boolean {
        let removed = false;
        for (const element of collection) {
            const existedBefore = this.contains(element);
            if (existedBefore) {
                this.delete(element);
                removed = true;
            }
        }
        return removed;
    }

    public removeIf(predicate: Predicate<TElement>): boolean {
        const elementsToRemove: TElement[] = [];
        this.inOrderTraversal(node => {
            if (predicate(node.getData())) {
                elementsToRemove.push(node.getData());
            }
        });
        for (const element of elementsToRemove) {
            this.delete(element);
        }
        return elementsToRemove.length > 0;
    }

    public search(element: TElement): boolean {
        let current = this.root;
        let lastNonNull: SplayNode<TElement> | null = this.root;
        while (current) {
            lastNonNull = current;
            const cmp = this.orderComparator(element, current.getData());
            if (cmp < 0) {
                current = current.getLeft() as SplayNode<TElement> | null;
            } else if (cmp > 0) {
                current = current.getRight() as SplayNode<TElement> | null;
            } else {
                this.splay(current);
                return true;
            }
        }
        if (lastNonNull) {
            this.splay(lastNonNull);
        }
        return false;
    }

    private inOrderTraversal(visitor: (node: SplayNode<TElement>) => void): void {
        const traverse = (node: SplayNode<TElement> | null) => {
            if (!node) {
                return;
            }
            traverse(node.getLeft() as SplayNode<TElement> | null);
            visitor(node);
            traverse(node.getRight() as SplayNode<TElement> | null);
        };
        traverse(this.root);
    }

    private rotateLeft(node: SplayNode<TElement>): void {
        const rightChild = node.getRight() as SplayNode<TElement> | null;
        if (rightChild) {
            node.setRight(rightChild.getLeft());
            if (rightChild.getLeft()) {
                (rightChild.getLeft() as SplayNode<TElement>).parent = node;
            }
            rightChild.parent = node.parent;
            if (!node.parent) {
                this.root = rightChild;
            } else if (node === node.parent.getLeft()) {
                (node.parent as SplayNode<TElement>).setLeft(rightChild);
            } else {
                (node.parent as SplayNode<TElement>).setRight(rightChild);
            }
            rightChild.setLeft(node);
            node.parent = rightChild;
        }
    }

    private rotateRight(node: SplayNode<TElement>): void {
        const leftChild = node.getLeft() as SplayNode<TElement> | null;
        if (leftChild) {
            node.setLeft(leftChild.getRight());
            if (leftChild.getRight()) {
                (leftChild.getRight() as SplayNode<TElement>).parent = node;
            }
            leftChild.parent = node.parent;
            if (!node.parent) {
                this.root = leftChild;
            } else if (node === node.parent.getRight()) {
                (node.parent as SplayNode<TElement>).setRight(leftChild);
            } else {
                (node.parent as SplayNode<TElement>).setLeft(leftChild);
            }
            leftChild.setRight(node);
            node.parent = leftChild;
        }
    }

    private splay(node: SplayNode<TElement> | null): void {
        if (!node) {
            return;
        }
        while (node.parent) {
            const parent = node.parent as SplayNode<TElement>;
            const grandParent = parent.parent;
            if (!grandParent) {
                if (node === parent.getLeft()) {
                    this.rotateRight(parent);
                } else {
                    this.rotateLeft(parent);
                }
            } else if (node === parent.getLeft() && parent === grandParent.getLeft()) {
                this.rotateRight(grandParent);
                this.rotateRight(parent);
            } else if (node === parent.getRight() && parent === grandParent.getRight()) {
                this.rotateLeft(grandParent);
                this.rotateLeft(parent);
            } else if (node === parent.getRight() && parent === grandParent.getLeft()) {
                this.rotateLeft(parent);
                this.rotateRight(grandParent);
            } else {
                this.rotateRight(parent);
                this.rotateLeft(grandParent);
            }
        }
        this.root = node;
    }
}
