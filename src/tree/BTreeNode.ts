import { InternalBTreeException } from "../shared/InternalBTreeException";
import { OrderComparator } from "../shared/OrderComparator";

export class BTreeNode<TElement> {
    public readonly degree: number; // Minimum degree (t)
    public children: (BTreeNode<TElement> | null)[];
    public isLeaf: boolean;
    public keys: TElement[];
    public numKeys: number;

    public constructor(degree: number, isLeaf: boolean) {
        this.degree = degree;
        this.isLeaf = isLeaf;
        this.keys = new Array(2 * degree - 1);
        this.children = new Array(2 * degree);
        this.numKeys = 0;
    }

    /** Borrows a key from children[idx+1] and places it in children[idx] */
    public borrowFromNext(idx: number): void {
        const child = this.children[idx];
        const sibling = this.children[idx + 1];

        if (!child || !sibling) {
            throw new InternalBTreeException("Missing node during borrowFromNext.");
        }

        child.keys[child.numKeys] = this.keys[idx];

        if (!child.isLeaf) {
            if (!sibling.children[0]) {
                throw new InternalBTreeException("Sibling child missing during borrowFromNext.");
            }
            child.children[child.numKeys + 1] = sibling.children[0];
        }

        this.keys[idx] = sibling.keys[0];

        for (let i = 1; i < sibling.numKeys; ++i) {
            sibling.keys[i - 1] = sibling.keys[i];
        }

        if (!sibling.isLeaf) {
            const originalSiblingNumKeys = sibling.numKeys;
            for (let i = 1; i <= originalSiblingNumKeys; ++i) {
                sibling.children[i - 1] = sibling.children[i];
            }
            sibling.children[originalSiblingNumKeys] = null;
        }

        child.numKeys += 1;
        sibling.numKeys -= 1;
    }

    /** Borrows a key from children[idx-1] and places it in children[idx] */
    public borrowFromPrev(idx: number): void {
        const child = this.children[idx];
        const sibling = this.children[idx - 1];

        if (!child || !sibling) {
            throw new InternalBTreeException("Missing node during borrowFromPrev.");
        }

        for (let i = child.numKeys - 1; i >= 0; --i) {
            child.keys[i + 1] = child.keys[i];
        }

        if (!child.isLeaf) {
            for (let i = child.numKeys; i >= 0; --i) {
                child.children[i + 1] = child.children[i];
            }
        }

        child.keys[0] = this.keys[idx - 1];

        if (!child.isLeaf) {
            if (!sibling.children[sibling.numKeys]) {
                throw new InternalBTreeException("Sibling child missing during borrowFromPrev.");
            }
            child.children[0] = sibling.children[sibling.numKeys];
            sibling.children[sibling.numKeys] = null;
        }

        this.keys[idx - 1] = sibling.keys[sibling.numKeys - 1];
        child.numKeys += 1;
        sibling.numKeys -= 1;
    }

    /** Fills the child node children[idx] which has less than degree-1 keys */
    public fillChild(idx: number): void {
        const prevChild = this.children[idx - 1];
        const nextChild = this.children[idx + 1];

        if (idx !== 0 && prevChild && prevChild.numKeys >= this.degree) {
            this.borrowFromPrev(idx);
        }
        else if (idx !== this.numKeys && nextChild && nextChild.numKeys >= this.degree) {
            this.borrowFromNext(idx);
        }
        else {
            if (idx !== this.numKeys && nextChild) {
                this.mergeChildren(idx);
            } else if (idx !== 0 && prevChild) {
                this.mergeChildren(idx - 1);
            } else {
                throw new InternalBTreeException("Cannot fill child; no siblings to borrow/merge with sufficient keys, and not a root adjustment case.");
            }
        }
    }

    /** Finds the index of the first key that is greater than or equal to k */
    public findKeyIndex(key: TElement, compare: OrderComparator<TElement>): number {
        let idx = 0;
        while (idx < this.numKeys && compare(this.keys[idx], key) < 0) {
            ++idx;
        }
        return idx;
    }

    /** Gets the predecessor key for keys[idx] in the subtree rooted at this node */
    public getPredecessor(idx: number): TElement {
        let cur = this.children[idx];
        if (!cur) {
            throw new InternalBTreeException("Left child missing for getPredecessor.");
        }
        while (!cur.isLeaf) {
            const nextChild = cur.children[cur.numKeys] as BTreeNode<TElement> | null;
            if (!nextChild) {
                throw new InternalBTreeException("Child missing during getPredecessor traversal.");
            }
            cur = nextChild;
        }
        if (cur.numKeys === 0) {
            throw new InternalBTreeException("Predecessor node has no keys.");
        }
        return cur.keys[cur.numKeys - 1];
    }

    /** Gets the successor key for keys[idx] in the subtree rooted at this node */
    public getSuccessor(idx: number): TElement {
        let cur = this.children[idx + 1]
        if (!cur) {
            throw new InternalBTreeException("Right child missing for getSuccessor.");
        }
        while (!cur.isLeaf) {
            const nextChild = cur.children[0] as BTreeNode<TElement> | null;
            if (!nextChild) {
                throw new InternalBTreeException("Child missing during getSuccessor traversal.");
            }
            cur = nextChild;
        }
        if (cur.numKeys === 0) {
            throw new InternalBTreeException("Successor node has no keys.");
        }
        return cur.keys[0];
    }

    public insertNonFull(key: TElement, compare: OrderComparator<TElement>): void {
        let i: number = this.numKeys - 1;

        if (this.isLeaf) {
            while (i >= 0 && compare(this.keys[i], key) > 0) {
                this.keys[i + 1] = this.keys[i];
                i--;
            }
            this.keys[i + 1] = key;
            this.numKeys = this.numKeys + 1;
        } else {
            while (i >= 0 && compare(this.keys[i], key) > 0) {
                i--;
            }

            const targetChild = this.children[i + 1];
            if (!targetChild) {
                throw new InternalBTreeException("Found null child during insertNonFull traversal.");
            }

            if (targetChild.numKeys === 2 * this.degree - 1) {
                this.splitChild(i + 1, targetChild);
                if (compare(this.keys[i + 1], key) < 0) {
                    i++;
                }
            }
            const childToInsertIn = this.children[i + 1];
            if (!childToInsertIn) {
                throw new InternalBTreeException("Child node missing after potential split during insertNonFull.");
            }
            childToInsertIn.insertNonFull(key, compare);
        }
    }

    /** Merges children[idx] with children[idx+1] */
    public mergeChildren(idx: number): void {
        const child = this.children[idx];
        const sibling = this.children[idx + 1];

        if (!child || !sibling) {
            throw new InternalBTreeException("Missing node during mergeChildren.");
        }

        child.keys[this.degree - 1] = this.keys[idx];

        for (let i = 0; i < sibling.numKeys; ++i) {
            child.keys[i + this.degree] = sibling.keys[i];
        }

        if (!child.isLeaf) {
            for (let i = 0; i <= sibling.numKeys; ++i) {
                child.children[i + this.degree] = sibling.children[i];
                sibling.children[i] = null;
            }
        }

        const originalParentNumKeys = this.numKeys;
        for (let i = idx + 1; i < originalParentNumKeys; ++i) {
            this.keys[i - 1] = this.keys[i];
        }

        for (let i = idx + 2; i <= originalParentNumKeys; ++i) {
            this.children[i - 1] = this.children[i];
        }
        this.children[originalParentNumKeys] = null;
        child.numKeys += sibling.numKeys + 1;
        this.numKeys--;
    }

    /** Main remove function for a node */
    public remove(key: TElement, compare: OrderComparator<TElement>): void {
        const idx = this.findKeyIndex(key, compare);

        if (idx < this.numKeys && compare(this.keys[idx], key) === 0) {
            if (this.isLeaf) {
                this.removeKeyFromLeaf(idx);
            } else {
                this.removeKeyFromNonLeaf(idx, compare);
            }
        } else {
            if (this.isLeaf) {
                return;
            }

            const childToDescend = this.children[idx];
            if (!childToDescend) {
                throw new InternalBTreeException("Child is unexpectedly null for a non-leaf node during remove.");
            }

            if (childToDescend.numKeys < this.degree) {
                this.fillChild(idx);
                const newIdxForKeyOrChild = this.findKeyIndex(key, compare);
                const actualChildToRecurse = this.children[newIdxForKeyOrChild];

                if (!actualChildToRecurse) {
                    throw new InternalBTreeException("Child missing for recursive remove after fillChild.");
                }
                actualChildToRecurse.remove(key, compare);

            } else {
                childToDescend.remove(key, compare);
            }
        }
    }

    /** Removes the key present in the idx-th position in this leaf node */
    public removeKeyFromLeaf(idx: number): void {
        for (let i = idx + 1; i < this.numKeys; ++i) {
            this.keys[i - 1] = this.keys[i];
        }
        this.numKeys--;
    }

    /** Removes the key present in the idx-th position in this non-leaf node */
    public removeKeyFromNonLeaf(idx: number, compare: OrderComparator<TElement>): void {
        const keyToRemove = this.keys[idx];

        const leftChild = this.children[idx];
        const rightChild = this.children[idx + 1];

        if (!leftChild || !rightChild) {
            throw new InternalBTreeException("Missing child nodes during non-leaf removal.");
        }

        if (leftChild.numKeys >= this.degree) {
            const predecessor = this.getPredecessor(idx);
            this.keys[idx] = predecessor;
            leftChild.remove(predecessor, compare);
        }
        else if (rightChild.numKeys >= this.degree) {
            const successor = this.getSuccessor(idx);
            this.keys[idx] = successor;
            rightChild.remove(successor, compare);
        }
        else {
            this.mergeChildren(idx);
            const mergedChild = this.children[idx];
            if (!mergedChild) {
                throw new InternalBTreeException("Merged child is unexpectedly null after non-leaf removal.");
            }
            mergedChild.remove(keyToRemove, compare);
        }
    }

    public search(key: TElement, compare: OrderComparator<TElement>): TElement | null {
        let i: number = 0;
        while (i < this.numKeys && compare(key, this.keys[i]) > 0) {
            i++;
        }

        if (i < this.numKeys && compare(key, this.keys[i]) === 0) {
            return this.keys[i];
        }

        if (this.isLeaf) {
            return null;
        }

        const child = this.children[i];
        return child ? child.search(key, compare) : null;
    }

    public splitChild(index: number, fullChild: BTreeNode<TElement>): void {
        const newNode = new BTreeNode<TElement>(fullChild.degree, fullChild.isLeaf);
        newNode.numKeys = this.degree - 1;

        for (let j = 0; j < this.degree - 1; j++) {
            newNode.keys[j] = fullChild.keys[j + this.degree];
        }

        if (!fullChild.isLeaf) {
            for (let j = 0; j < this.degree; j++) {
                newNode.children[j] = fullChild.children[j + this.degree];
                fullChild.children[j + this.degree] = null; // Help GC
            }
        }

        fullChild.numKeys = this.degree - 1;

        for (let j = this.numKeys; j >= index + 1; j--) {
            this.children[j + 1] = this.children[j];
        }

        this.children[index + 1] = newNode;

        for (let j = this.numKeys - 1; j >= index; j--) {
            this.keys[j + 1] = this.keys[j];
        }

        this.keys[index] = fullChild.keys[this.degree - 1];
        this.numKeys = this.numKeys + 1;
    }

    public* traverse(): Generator<TElement, void, undefined> {
        let i: number;
        for (i = 0; i < this.numKeys; i++) {
            if (!this.isLeaf && this.children[i]) {
                yield* this.children[i]!.traverse();
            }
            yield this.keys[i];
        }

        if (!this.isLeaf && this.children[i]) {
            yield* this.children[i]!.traverse();
        }
    }
}
