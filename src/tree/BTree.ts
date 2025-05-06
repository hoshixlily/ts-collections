import { AbstractCollection } from "../core/AbstractCollection";
import { Comparators } from "../shared/Comparators";
import { InternalBTreeException } from "../shared/InternalBTreeException";
import { InvalidArgumentException } from "../shared/InvalidArgumentException";
import { OrderComparator } from "../shared/OrderComparator";
import { BTreeNode } from "./BTreeNode";

export class BTree<TElement> extends AbstractCollection<TElement> {
    readonly #compare: OrderComparator<TElement>;
    #root: BTreeNode<TElement> | null;
    #size: number;
    public readonly degree: number; // Minimum degree (t)

    public constructor(degree: number, comparator?: OrderComparator<TElement>) {
        super(((e1: TElement, e2: TElement) => Object.is(e1, e2) || (comparator ?? Comparators.orderComparator)(e1, e2) === 0));
        if (degree < 2) {
            throw new InvalidArgumentException("B-Tree degree must be at least 2.");
        }
        this.#root = null;
        this.degree = degree;
        this.#size = 0;
        this.#compare = comparator || Comparators.orderComparator;
    }

    public override [Symbol.iterator](): Iterator<TElement> {
        return this.traverse();
    }

    public override add(item: TElement): boolean {
        if (this.#root === null) {
            this.#root = new BTreeNode<TElement>(this.degree, true);
            this.#root.keys[0] = item;
            this.#root.numKeys = 1;
            this.#size++;
            return true;
        }

        if (this.search(item) !== null) {
            return false;
        }

        if (this.#root.numKeys === 2 * this.degree - 1) {
            const newRoot = new BTreeNode<TElement>(this.degree, false);
            newRoot.children[0] = this.#root;
            newRoot.splitChild(0, this.#root);

            let i = 0;
            if (this.#compare(newRoot.keys[0], item) < 0) {
                i++;
            }
            const childToInsert = newRoot.children[i];
            if (!childToInsert) {
                throw new InternalBTreeException("Child node missing after root split during add.");
            }
            childToInsert.insertNonFull(item, this.#compare);
            this.#root = newRoot;
        } else {
            this.#root.insertNonFull(item, this.#compare);
        }
        this.#size++;
        return true;
    }

    public override clear(): void {
        this.#root = null;
        this.#size = 0;
    }

    public override contains(item: TElement): boolean {
        return this.search(item) !== null;
    }

    public override count(): number {
        return this.#size;
    }

    public printTree(node: BTreeNode<TElement> | null = this.#root, indent: string = "", last: boolean = true): void {
        if (!node) {
            console.log(indent + "└─ (empty tree)");
            return;
        }
        const nodeLabel = `[${node.keys.slice(0, node.numKeys).join(",")}] (${node.isLeaf ? "Leaf" : "Internal"}, Keys: ${node.numKeys}, Children: ${node.isLeaf ? "N/A" : node.children.slice(0, node.numKeys + 1).filter(c => c !== null).length})`;
        console.log(indent + (last ? "└─ " : "├─ ") + nodeLabel);

        indent += last ? "   " : "│  ";

        if (!node.isLeaf) {
            const actualChildren = node.children.slice(0, node.numKeys + 1).filter(c => c !== null);
            let printedChildrenCount = 0;

            for (let i = 0; i <= node.numKeys; i++) {
                const childNode = node.children[i];
                if (childNode) {
                    printedChildrenCount++;
                    const isLastChild = (printedChildrenCount === actualChildren.length);
                    this.printTree(childNode, indent, isLastChild);
                }
            }
        }
    }

    public remove(item: TElement): boolean {
        if (!this.#root) {
            return false;
        }

        const itemExists = this.contains(item);
        if (!itemExists) {
            return false;
        }

        this.#root.remove(item, this.#compare);
        this.#size--;

        if (this.#root.numKeys === 0) {
            if (this.#root.isLeaf) {
                this.#root = null;
            } else {
                const newRootCandidate = this.#root.children[0];
                if (!newRootCandidate && this.#size > 0) {
                    throw new InternalBTreeException("Internal root emptied with no children, but size > 0.");
                }
                this.#root = newRootCandidate;
                if (this.#size === 0) {
                    this.#root = null;
                }
            }
        }
        return true;
    }

    public search(key: TElement): TElement | null {
        return this.#root === null ? null : this.#root.search(key, this.#compare);
    }

    public override size(): number {
        return this.#size;
    }

    public override get length(): number {
        return this.#size;
    }

    private* traverse(): Generator<TElement, void, undefined> {
        if (this.#root !== null) {
            yield* this.#root.traverse();
        }
    }
}
