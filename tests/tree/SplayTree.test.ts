import { SplayTree } from "../../src/tree/SplayTree";
import { Person } from "../models/Person";

describe("SplayTree", () => {
    let tree: SplayTree<number>;
    const numberTreeFactory = () => new SplayTree<number>((a, b) => a - b);

    beforeEach(() => {
        tree = numberTreeFactory();
    });

    it("initially is empty", () => {
        expect(tree.size()).toBe(0);
        expect(tree.toArray()).toEqual([]);
        expect(tree.contains(42)).toBe(false);
    });

    it("inserts elements and maintains size and sorted order", () => {
        expect(tree.add(3)).toBe(true);
        expect(tree.add(1)).toBe(true);
        expect(tree.add(4)).toBe(true);
        expect(tree.add(1)).toBe(false); // duplicate
        expect(tree.add(5)).toBe(true);

        expect(tree.size()).toBe(4);
        expect(tree.toArray()).toEqual([1, 3, 4, 5]);
    });

    it("contains returns true for present and false for absent, and splays last accessed node", () => {
        [10, 20, 30, 40].forEach(x => tree.insert(x));

        expect(tree.contains(30)).toBe(true);
        expect(tree.contains(15)).toBe(false);

        // After searching 30, it should still contain the element
        expect(tree.toArray()).toEqual([10, 20, 30, 40]);
    });

    it("deletes existing elements and updates size and order", () => {
        [2, 4, 6, 8].forEach(x => tree.insert(x));
        expect(tree.size()).toBe(4);

        expect(tree.remove(6)).toBe(true);
        expect(tree.size()).toBe(3);
        expect(tree.toArray()).toEqual([2, 4, 8]);

        // Delete root
        expect(tree.remove(2)).toBe(true);
        expect(tree.size()).toBe(2);
        expect(tree.toArray()).toEqual([4, 8]);
    });

    it("delete on absent element returns false and does not change tree", () => {
        [5, 10, 15].forEach(x => tree.insert(x));
        const originalSize = tree.size();
        const originalArray = tree.toArray();

        expect(tree.remove(999)).toBe(false);
        expect(tree.size()).toBe(originalSize);
        expect(tree.toArray()).toEqual(originalArray);
    });

    it("handles random insertion and deletion sequences", () => {
        const values = [7, 3, 9, 1, 5];
        values.forEach(x => expect(tree.add(x)).toBe(true));

        // random delete order
        [3, 7, 5].forEach(x => expect(tree.remove(x)).toBe(true));

        expect(tree.size()).toBe(2);
        expect(tree.toArray()).toEqual([1, 9]);
    });

    it("removeAll removes all specified elements and returns correct boolean", () => {
        [1, 2, 3, 4, 5].forEach(x => tree.insert(x));
        expect(tree.size()).toBe(5);

        // Remove some existing and some non-existing
        const removed = tree.removeAll([2, 4, 6]);
        expect(removed).toBe(true);
        expect(tree.size()).toBe(3);
        expect(tree.toArray()).toEqual([1, 3, 5]);

        // Removing again should return false and not change the tree
        const removedAgain = tree.removeAll([2, 4, 6]);
        expect(removedAgain).toBe(false);
        expect(tree.size()).toBe(3);
        expect(tree.toArray()).toEqual([1, 3, 5]);
    });

    // New tests for removeIf
    it("removeIf removes elements matching predicate and returns correct boolean", () => {
        [10, 15, 20, 25, 30].forEach(x => tree.insert(x));
        expect(tree.size()).toBe(5);

        // Remove even numbers
        const removedEven = tree.removeIf(x => x % 20 === 0 || x % 2 === 0);
        // In this predicate, 10,20,30 match; 15,25 remain
        expect(removedEven).toBe(true);
        expect(tree.size()).toBe(2);
        expect(tree.toArray()).toEqual([15, 25]);

        // Removing with a predicate that matches nothing
        const removedNone = tree.removeIf(x => x > 100);
        expect(removedNone).toBe(false);
        expect(tree.size()).toBe(2);
        expect(tree.toArray()).toEqual([15, 25]);
    });

    it("tests enumerable support", () => {
        const tree = new SplayTree<Person>((p1, p2) => p1.age - p2.age);
        tree.add(Person.Alice);
        tree.add(Person.Mirei);
        tree.add(Person.Lucrezia);
        tree.add(Person.Priscilla);

        const first = tree.first();
        const first2 = tree.take(1).toArray()[0];

        expect(first).toBe(first2);
    });
});
