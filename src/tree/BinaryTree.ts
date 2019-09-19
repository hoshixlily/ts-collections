import { ITree } from "./ITree";

export declare type TraverseType = "INORDER" | "PREORDER" | "POSTORDER";
class BinaryTreeNode<T extends any> {
    private left: BinaryTreeNode<T>;
    private right: BinaryTreeNode<T>;
    private data: T;
    public constructor(rootData?: T) {
        if (rootData) this.data = rootData;
    }
    public getLeft(): BinaryTreeNode<T> {
        return this.left;
    }
    public getRight(): BinaryTreeNode<T> {
        return this.right;
    }
    public setLeft(node: BinaryTreeNode<T>): void {
        this.left = node;
    }
    public setRight(node: BinaryTreeNode<T>): void {
        this.right = node;
    }
    public setData(data: T): void {
        this.data = data;
    }
    public getData(): T {
        return this.data;
    }
}
export class BinaryTree<T> implements ITree<T> {
    private comparator: Function = null;
    private root: BinaryTreeNode<T>;
    public constructor(comparator: Function) {
        this.root = null;
        this.comparator = comparator;
    }
    public clear(): void {
        this.root = null;
    }
    public contains(item: T): boolean {
        return this.containsRecursive(this.root, item);
    }
    private containsRecursive(root: BinaryTreeNode<T>, item: T): boolean {
        if (root == null) return false;
        if (this.comparator(item, root.getData()) === 0) return true;
        return this.comparator(item, root.getData()) < 0
            ? this.containsRecursive(root.getLeft(), item)
            : this.containsRecursive(root.getRight(), item);
    }
    public insert(item: T): void {
        this.root = this.insertRecursive(this.root, item);
    }
    private insertRecursive(root: BinaryTreeNode<T>, item: T): BinaryTreeNode<T> {
        if (root == null) return new BinaryTreeNode<T>(item);
        if (this.comparator(item, root.getData()) < 0) {
            root.setLeft(this.insertRecursive(root.getLeft(), item));
        } else if (this.comparator(item, root.getData()) > 0) {
            root.setRight(this.insertRecursive(root.getRight(), item));
        } else {
            return root;
        }
        return root;
    }
    public isEmpty(): boolean {
        return this.root == null;
    }
    public getNodeCount(): number {
        return this.countTreeNodes(this.root);
    }
    private countTreeNodes(root: BinaryTreeNode<T>): number {
        if (root == null) return 0;
        return 1 + this.countTreeNodes(root.getLeft()) + this.countTreeNodes(root.getRight());
    }
    public delete(item: T): void {
        this.root = this.deleteRecursive(this.root, item);
    }
    private deleteRecursive(root: BinaryTreeNode<T>, item: T): BinaryTreeNode<T> {
        if (root == null) return null;
        if (this.comparator(item, root.getData()) === 0) {
            if (root.getLeft() == null && root.getRight() == null) {
                return null;
            }
            if (root.getRight() == null) {
                return root.getLeft();
            }
            if (root.getLeft() == null) {
                return root.getRight();
            }
            const smallestValue = this.findSmallestValue(root.getRight());
            root.setData(smallestValue);
            root.setRight(this.deleteRecursive(root.getRight(), smallestValue));
            return root;
        }
        if (this.comparator(item, root.getData()) < 0) {
            root.setLeft(this.deleteRecursive(root.getLeft(), item));
            return root;
        }
        root.setRight(this.deleteRecursive(root.getRight(), item));
        return root;
    }
    public find(predicate: (item: T) => boolean): T {
        if (this.root == null) return null;
        return this.findRecursive(this.root, predicate);
    }
    private findRecursive(root: BinaryTreeNode<T>, predicate: (item: T) => boolean): T {
        if (root == null) return null;
        if (predicate(root.getData())) return root.getData();
        let foundItem: T = this.findRecursive(root.getLeft(), predicate);
        if (foundItem != null){
            return foundItem;
        }
        return this.findRecursive(root.getRight(), predicate);
    }
    private findSmallestValue(root: BinaryTreeNode<T>): T {
        return root.getLeft() == null ? root.getData() : this.findSmallestValue(root.getLeft());
    }
    public forEach(action: (item: T) => void): void {
        if (this.root == null) return;
        this.forEachRecursive(this.root, action);
    }
    private forEachRecursive(root: BinaryTreeNode<T>, action: (item: T) => void): void {
        if (root == null) return;
        this.forEachRecursive(root.getLeft(), action);
        action(root.getData());
        this.forEachRecursive(root.getRight(), action);
    }
    public getRootData(): T {
        return this.root == null ? null : this.root.getData();
    }
    public search(item: T): boolean {
       return this.searchTree(this.root, item);
    }
    private searchTree(root: BinaryTreeNode<T>, item: T): boolean {
        if (this.comparator(item, root.getData()) === 0) return true;
        if (root.getLeft() != null) {
            if (this.searchTree(root.getLeft(), item)) return true;
        }
        if (root.getRight() != null) {
            if (this.searchTree(root.getRight(), item)) return true;
        }
        return false;
    }
    public traverseAndMapToArray<R>(mapper: (item: T) => R, direction: TraverseType = "INORDER"): R[] {
        let array: T[] = [];
        switch(direction) {
            case "INORDER":
                array = this.toArray("INORDER");
                break;
            case "PREORDER":
                array = this.toArray("PREORDER");
                break;
            case "POSTORDER":
                array = this.toArray("POSTORDER");
                break;
        }
        return array.map(v => mapper(v));
    }
    public traverseAndMorph<R>(morpher: (item: T) => R, comparator?: (i1: R, i2: R) => number): BinaryTree<R> {
        const compare  = comparator || this.comparator;
        const tree     = new BinaryTree<R>(compare);
        let array: T[] = [];
        array = this.toArray("PREORDER");
        array.forEach(e => {
            const morphedItem = morpher(e);
            tree.insert(morphedItem);
        });
        return tree;
    }
    public toArray(direction: TraverseType = "INORDER"): T[] {
        const target: T[] = [];
        switch (direction) {
            case "INORDER":
                this.toInorderArray(this.root, target);
                return target;
            case "PREORDER":
                this.toPreorderArray(this.root, target);
                return target;
            case "POSTORDER":
                this.toPostorderArray(this.root, target);
                return target;
            default:
                this.toInorderArray(this.root, target);
                return target;
        }
    }
    private toInorderArray(root: BinaryTreeNode<T>, target: T[]) {
        if (root == null) return;
        this.toInorderArray(root.getLeft(), target);
        target.push(root.getData());
        this.toInorderArray(root.getRight(), target);
    }
    private toPostorderArray(root: BinaryTreeNode<T>, target: T[]) {
        if (root == null) return;
        this.toPostorderArray(root.getLeft(), target);
        this.toPostorderArray(root.getRight(), target);
        target.push(root.getData());
    }
    private toPreorderArray(root: BinaryTreeNode<T>, target: T[]) {
        if (root == null) return;
        target.push(root.getData());
        this.toPreorderArray(root.getLeft(), target);
        this.toPreorderArray(root.getRight(), target);
    }
}