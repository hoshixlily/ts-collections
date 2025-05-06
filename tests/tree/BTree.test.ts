import { describe, expect } from "vitest";
import { BTree, Collections, OrderComparator } from "../../src";
import { InvalidArgumentException } from "../../src/shared/InvalidArgumentException";
import { Person } from "../models/Person";

describe("BTree", () => {
    describe("constructor", () => {
        it("should create an empty BTree with a valid degree", () => {
            const tree = new BTree<number>(2);
            expect(tree).toBeDefined();
            expect(tree.degree).toBe(2);
            expect(tree.size()).toBe(0);
            expect(tree.length).toBe(0);
            expect(tree.toArray()).toEqual([]);
        });

        it("should throw InvalidArgumentException for degree less than 2", () => {
            expect(() => new BTree<number>(1)).toThrow(InvalidArgumentException);
            expect(() => new BTree<number>(0)).toThrow(InvalidArgumentException);
            expect(() => new BTree<number>(-1)).toThrow(InvalidArgumentException);
        });

        it("should use the default comparator if none is provided", () => {
            const tree = new BTree<number>(2);
            tree.add(5);
            tree.add(1);
            expect(tree.toArray()).toEqual([1, 5]);
        });

        it("should use a custom comparator if provided", () => {
            const reverseComparator: OrderComparator<number> = (a, b) => b - a;
            const tree = new BTree<number>(2, reverseComparator);
            tree.add(5);
            tree.add(1);
            tree.add(10);
            // Iteration should still be in logical (ascending for the comparator) order
            // but the internal structure reflects the custom comparison.
            // The default iterator is in-order, which respects the comparator.
            expect(tree.toArray()).toEqual([10, 5, 1]);
        });
    });

    describe("add", () => {
        it("should add an item to an empty tree", () => {
            const tree = new BTree<number>(2);
            expect(tree.add(10)).toBe(true);
            expect(tree.size()).toBe(1);
            expect(tree.contains(10)).toBe(true);
            expect(tree.toArray()).toEqual([10]);
        });

        it("should add multiple unique items and maintain order", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(5);
            tree.add(15);
            tree.add(3);
            tree.add(7);
            expect(tree.size()).toBe(5);
            expect(tree.toArray()).toEqual([3, 5, 7, 10, 15]);
        });

        it("should return false and not change size if adding an existing item", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(5);
            expect(tree.size()).toBe(2);
            expect(tree.add(10)).toBe(false);
            expect(tree.size()).toBe(2);
            expect(tree.add(5)).toBe(false);
            expect(tree.size()).toBe(2);
            expect(tree.toArray()).toEqual([5, 10]);
        });

        // Tests for node splitting (degree 2 means max 3 keys, splits when 4th is added to a node)
        // (t=2: max keys = 2t-1 = 3. Node splits when it has 3 keys and one more is added)
        describe("node splitting behavior (degree 2)", () => {
            it("should trigger root split correctly", () => {
                const tree = new BTree<number>(2); // Max keys in a node = 3
                tree.add(10); // [10]
                tree.add(20); // [10,20]
                tree.add(30); // [10,20,30]
                expect(tree.add(15)).toBe(true); // Add 15 -> causes split. Root becomes [15] or [20] depending on median choice
                // Standard B-Tree splits on median, which is 15 or 20.
                // Your implementation splits, new root gets middle key of full node.
                // Original root [10,20,30], adding 15. Key 15 is inserted first.
                // [10,15,20,30] conceptually. Median chosen by `splitChild` is keys[degree-1] = keys[1]=20.
                // Root: [20], Left: [10,15], Right: [30]
                expect(tree.size()).toBe(4);
                expect(tree.toArray()).toEqual([10, 15, 20, 30]);
                // Optional: Could inspect root if BTreeNode structure was public and accessible
                // expect(tree['_root']?.keys[0]).toBe(20);
                // expect(tree['_root']?.children[0]?.keys.slice(0, tree['_root']?.children[0]?.numKeys)).toEqual([10,15]);
                // expect(tree['_root']?.children[1]?.keys.slice(0, tree['_root']?.children[1]?.numKeys)).toEqual([30]);
            });

            it("should trigger internal node split correctly", () => {
                const tree = new BTree<number>(2);
                // Build a tree that will cause an internal split
                // Sequence: 10,20,30,5,15,25,35,12,17 (order matters for structure)
                const items = [10, 20, 30, 5, 15, 25, 35, 12, 17];
                items.forEach(item => tree.add(item));
                expect(tree.size()).toBe(items.length);
                expect(tree.toArray()).toEqual([...new Set(items)].sort((a, b) => a - b));
                // Adding 18 should cause an internal node (e.g. one containing 12,15,17) to split
                tree.add(18);
                expect(tree.size()).toBe(items.length + 1);
                expect(tree.toArray()).toEqual([...new Set([...items, 18])].sort((a, b) => a - b));
            });

            it("should handle adding many numbers in sequence (degree 2)", () => {
                const tree = new BTree<number>(2);
                const count = 100;
                const expected = [];
                for (let i = 1; i <= count; i++) {
                    tree.add(i);
                    expected.push(i);
                }
                expect(tree.size()).toBe(count);
                expect(tree.toArray()).toEqual(expected);
            });

            it("should handle adding many numbers in reverse sequence (degree 2)", () => {
                const tree = new BTree<number>(2);
                const count = 100;
                const expected = [];
                for (let i = count; i >= 1; i--) {
                    tree.add(i);
                    expected.push(i);
                }
                expected.sort((a, b) => a - b);
                expect(tree.size()).toBe(count);
                expect(tree.toArray()).toEqual(expected);
            });

            it("should handle adding many numbers in random sequence (degree 2)", () => {
                const tree = new BTree<number>(2);
                const count = 100;
                const items = Array.from({length: count}, (_, i) => i + 1);
                Collections.shuffle(items);

                items.forEach(item => tree.add(item));

                const expected = Array.from({length: count}, (_, i) => i + 1);
                expect(tree.size()).toBe(count);
                expect(tree.toArray()).toEqual(expected);
            });
        });

        describe("node splitting behavior (degree 3)", () => {
            // t=3: max keys = 2*3-1 = 5. Node splits when it has 5 keys and 6th is added.
            it("should trigger root split correctly (degree 3)", () => {
                const tree = new BTree<number>(3); // Max keys in a node = 5
                tree.add(10);
                tree.add(20);
                tree.add(30);
                tree.add(40);
                tree.add(50); // Node is now [10,20,30,40,50] (full)
                expect(tree.add(25)).toBe(true); // Add 25. Conceptually [10,20,25,30,40,50]. Median is keys[degree-1]=keys[2]=30.
                // Root: [30], Left: [10,20,25], Right: [40,50]
                expect(tree.size()).toBe(6);
                expect(tree.toArray()).toEqual([10, 20, 25, 30, 40, 50]);
            });

            it("should handle adding many numbers in sequence (degree 3)", () => {
                const tree = new BTree<number>(3);
                const count = 100;
                const expected = [];
                for (let i = 1; i <= count; i++) {
                    tree.add(i);
                    expected.push(i);
                }
                expect(tree.size()).toBe(count);
                expect(tree.toArray()).toEqual(expected);
            });
        });
    });

    describe("remove", () => {
        it("should return false when removing from an empty tree", () => {
            const tree = new BTree<number>(2);
            expect(tree.remove(10)).toBe(false);
        });

        it("should return false when removing a non-existent item from a populated tree", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(20);
            expect(tree.remove(15)).toBe(false);
            expect(tree.size()).toBe(2);
        });

        it("should remove an item from a leaf node (leaf has > t-1 keys)", () => {
            const tree = new BTree<number>(2); // t=2, min keys = 1
            tree.add(10);
            tree.add(20);
            tree.add(5); // Root: [5,10,20] (numKeys=3 > t-1=1)
            expect(tree.remove(10)).toBe(true);
            expect(tree.size()).toBe(2);
            expect(tree.toArray()).toEqual([5, 20]);
            expect(tree.contains(10)).toBe(false);
        });

        it("should remove an item from root when it is a leaf and becomes empty", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            expect(tree.remove(10)).toBe(true);
            expect(tree.size()).toBe(0);
            expect(tree.toArray()).toEqual([]);
            expect(tree.contains(10)).toBe(false);
        });

        // Scenarios for t=2 (min degree 2, so min keys in non-root is t-1 = 1)
        // A node with t-1 keys needs filling before recursion if its child is chosen for deletion.
        describe("remove triggering merging/borrowing (degree 2)", () => {
            /*
             Initial state for many tests:
                     [20]
                    /    \
                [10]     [30,40]
             Remove 10. Left child [10] has t-1 keys. Needs filling.
             Cannot borrow from right sibling [30,40] because parent [20] is involved.
             Try borrowFromPrev (doesn't exist). Try borrowFromNext ([30,40]).
             Key 20 from parent moves to left child. Key 30 from sibling moves to parent.
             New state:
                     [30]
                    /    \
                [10,20]  [40]
             Then 10 is removed from [10,20].
            */
            it("case 1: remove from leaf, triggering borrow from right sibling", () => {
                const tree = new BTree<number>(2);
                tree.add(20);
                tree.add(10);
                tree.add(30);
                tree.add(40); // Root [20], L[10], R[30,40]
                expect(tree.remove(10)).toBe(true); // remove 10 from L child [10]
                expect(tree.size()).toBe(3);
                expect(tree.toArray()).toEqual([20, 30, 40]);
            });


            /*
             Initial state:
                     [30]
                    /    \
                [10,20]  [40]
             Remove 40. Right child [40] has t-1 keys. Needs filling.
             Try borrowFromPrev ([10,20]). Key 30 from parent moves to right child. Key 20 from sibling moves to parent.
             New state:
                     [20]
                    /    \
                [10]     [30,40]
             Then 40 is removed from [30,40].
            */
            it("case 2: remove from leaf, triggering borrow from left sibling", () => {
                const tree = new BTree<number>(2);
                tree.add(30);
                tree.add(10);
                tree.add(20);
                tree.add(40); // Root [30], L[10,20], R[40]
                expect(tree.remove(40)).toBe(true);
                expect(tree.size()).toBe(3);
                expect(tree.toArray()).toEqual([10, 20, 30]);
            });


            /*
             Initial state:
                     [20]
                    /    \
                  [10]   [30]
             Remove 10. Left child [10] has t-1 keys. Sibling [30] also has t-1 keys. Merge.
             Parent key 20 moves down.
             New Root/Node: [10,20,30] (becomes leaf)
             Then 10 is removed.
            */
            it("case 3a: remove from leaf, triggering merge with right sibling", () => {
                const tree = new BTree<number>(2);
                tree.add(20);
                tree.add(10);
                tree.add(30); // Root [20], L[10], R[30]
                expect(tree.remove(10)).toBe(true);
                expect(tree.size()).toBe(2);
                expect(tree.toArray()).toEqual([20, 30]);
            });

            it("case 3b: remove from leaf, triggering merge with left sibling", () => {
                const tree = new BTree<number>(2);
                tree.add(20);
                tree.add(10);
                tree.add(30); // Root [20], L[10], R[30]
                expect(tree.remove(30)).toBe(true);
                expect(tree.size()).toBe(2);
                expect(tree.toArray()).toEqual([10, 20]);
            });


            it("remove from internal node (case 2a: predecessor from leaf with >=t keys)", () => {
                const tree = new BTree<number>(2);
                //      [20, 40]
                //     /   |   \
                // [10,15] [30,35] [50,60]
                [20, 40, 10, 15, 30, 35, 50, 60].forEach(k => tree.add(k));
                expect(tree.remove(20)).toBe(true); // Predecessor is 15
                expect(tree.size()).toBe(7);
                expect(tree.toArray()).toEqual([10, 15, 30, 35, 40, 50, 60]);
            });

            it("remove from internal node (case 2b: successor from leaf, left child has < t keys)", () => {
                const tree = new BTree<number>(2); // t=2, min keys = 1
                // Goal: Root [30]. Left child of 30 is [10] (t-1 keys). Right child of 30 is [40,50] (>=t keys).
                // Remove 30. Predecessor path (from [10]) won't be chosen as [10] has only t-1 keys.
                // Successor path (from [40,50]) will be chosen. Successor is 40.
                // Root becomes [40]. Then 40 is removed from leaf [40,50], leaving [50].

                // Structure:
                //      [30]
                //     /    \
                //   [10]  [40,50]  &lt;-- Leaf node
                //  / \     (No children for 10 as it would need splitting before this point for simple setup)
                // This setup is tricky with t=2 because to have [10] as a child of [30],
                // and [40,50] as another child, [30] would need to be part of a larger node or be split.
                // Let's build a slightly different initial tree for simplicity for this specific test.

                // Consider root: [20, 40]
                // Child 0: [10] (t-1 keys)
                // Child 1: [30] (t-1 keys) -- for key 20
                // Child 2: [50, 60] (>=t keys) -- for key 40

                tree.add(20);
                tree.add(40);
                tree.add(10); // child of 20
                tree.add(30); // child of 20 or 40, let's make it child of 20's right
                tree.add(50);
                tree.add(60); // children of 40

                // A possible valid state after these additions might be:
                //         [40]
                //        /    \
                //    [20]      [50,60]
                //   /  \
                // [10]  [30]
                //
                // If we remove 40:
                // Left child of 40 is [20]. numKeys = 1 (t-1).
                // Right child of 40 is [50,60]. numKeys = 2 (>=t).
                // So, getSuccessor path will be taken. Successor of 40 is 50.
                // Root becomes [50]. Node [50,60] will have 50 removed, becoming [60].

                // Re-populating for clarity to force the desired structure before remove:
                tree.clear();
                tree.add(40); // Root
                tree.add(20);
                tree.add(60); // Root: [40], L: [20], R: [60]
                tree.add(10);
                tree.add(30); // L: [10,20,30] -> splits. Root: [20,40], L:[10], Mid:[30], R:[60]
                tree.add(50);
                tree.add(70); // R: [50,60,70] -> splits. This makes it complex.

                // Let's construct a specific state where successor is chosen:
                // Goal: Remove K. K.leftChild.numKeys < t. K.rightChild.numKeys >= t.
                // Tree degree t=2.
                //
                //       [P_Key]
                //      /       \
                //   [...]      [K]
                //             /   \
                //      [C_Left]  [C_Right]
                // numKeys(C_Left) = t-1 = 1
                // numKeys(C_Right) = t   = 2 (or more)
                //
                // Target state before removing K=30:
                //          [Parent_Key(s)]
                //              ...
                //                [30] (K, the node containing key 30)
                //               /    \
                //           [10]    [40, 50] (C_Left) (C_Right)
                //
                // Build this:
                tree.clear();
                // Add items to force key 30 to be an internal node with specific children
                tree.add(20); // Root [20]
                tree.add(40); // Root [20,40]
                tree.add(10); // Root [20,40], LChild of 20 is [10]
                tree.add(30); // Root [20,40], MChild of 20/40 is [30]
                tree.add(50); // Root [20,40,50] -> splits, root becomes [40]
                              // LChild [20], RChild [50].
                              // Add 10 -> LChild of 20. Add 30 -> RChild of 20.
                              // Add 45 -> LChild of 50. Add 60 -> RChild of 50.
                // Simpler construction:
                //      [30]
                //     /    \
                //   [10]  [40,50]
                // To get this:
                // 1. Add 30 (Root [30])
                // 2. Add 10 (Root [30], L:[10])
                // 3. Add 40 (Root [30], L:[10], R:[40])
                // 4. Add 50 (Root [30], L:[10], R:[40,50])
                tree.clear();
                tree.add(30);
                tree.add(10);
                tree.add(40);
                tree.add(50);
                // Current tree:
                //     [30]
                //    /    \
                // [10]    [40,50]
                expect(tree.toArray()).toEqual([10, 30, 40, 50]);
                expect(tree.size()).toBe(4);

                // Now remove 30.
                // In node [30] (root):
                //   leftChild is [10] (numKeys = 1 = t-1)
                //   rightChild is [40,50] (numKeys = 2 >= t)
                //   So, getSuccessor path is taken. Successor is 40.
                //   Root's key becomes 40.
                //   Node [40,50] has 40 removed, becomes [50].
                // Final tree:
                //     [40]
                //    /    \
                // [10]    [50]
                expect(tree.remove(30)).toBe(true);
                expect(tree.size()).toBe(3);
                expect(tree.toArray()).toEqual([10, 40, 50]);
            });

            it("remove from internal node (case 2c: merge children, then remove from merged child)", () => {
                const tree = new BTree<number>(2);
                //    [30]
                //   /    \
                // [20]  [40]
                //  / \   / \
                //[10][25][35][50]
                // Add keys to create this structure: 30, 20, 40, 10, 25, 35, 50
                [30, 20, 40, 10, 25, 35, 50].forEach(k => tree.add(k));
                expect(tree.remove(30)).toBe(true); // Children [20] and [40] both have t-1 keys. Merge.
                // [20] (parent) has its key 20 from child [10,25]
                // and [40] its key 40 from [35,50]
                // Merged node contains [10,20,25,35,40,50], key 30 was removed
                // The structure of tree may change dramatically.
                // Let's test the final state
                expect(tree.size()).toBe(6);
                expect(tree.toArray()).toEqual([10, 20, 25, 35, 40, 50]);
            });

            it("should reduce tree height if root becomes empty and has one child", () => {
                const tree = new BTree<number>(2);
                // Build a tree of height 2: [10,20,30] then add 15 -> root [20], L[10,15], R[30]
                tree.add(10);
                tree.add(20);
                tree.add(30);
                tree.add(15);
                expect(tree.size()).toBe(4);

                // Remove 20 (root key). Successor 30 moves to root. R child becomes empty.
                // Then remove from child to make root.numKeys = 0.
                // Intermediate: root [30], L[10,15]
                tree.remove(20); // Root becomes [15], L[10], R[30] or similar, depending on pred/succ
                                 // Let's trace: remove 20. Successor is 30. Root keys[idx]=30. Child R[30] has remove(30).
                                 // R[30] is leaf, remove 30. R is empty.
                                 // Now this.keys[idx] = 30, this.children[idx]=[10,15], this.children[idx+1]=[] which is invalid.
                                 // The actual logic is: keys[idx] = 20. child[idx]=[10,15], child[idx+1]=[30].
                                 // Remove 20 from internal node. Left child has >=t keys. Predecessor = 15.
                                 // keys[idx]=15. child[idx].remove(15).
                                 // child[idx] = [10,15]. remove 15. child[idx] = [10]. numKeys=1.
                                 // Root is [15], Left child [10], Right child [30].

                expect(tree.toArray()).toEqual([10, 15, 30]);

                tree.remove(15); // Root [15] removed.
                                 // It's an internal node. Left [10], Right [30]. Both t-1 keys. Merge.
                                 // Merged node [10,15,30]. Key to remove is 15.
                                 // Node [10,30]
                expect(tree.toArray()).toEqual([10, 30]);
                expect(tree.size()).toBe(2);
                // At this point, root might be [10] with R[30] or [30] with L[10] etc.
                // Or, if root had 1 key and its child was the merged node, root itself becomes the merged node.
                // Current root has 0 keys (placeholder for merged content), first child is new root.

                tree.remove(10); // Root becomes [30]
                expect(tree.toArray()).toEqual([30]);
                expect(tree.size()).toBe(1);

                tree.remove(30); // Tree becomes empty
                expect(tree.toArray()).toEqual([]);
                expect(tree.size()).toBe(0);
                // expect(tree['_root']).toBeNull(); // If root was inspectable
            });

            it("should correctly remove items leading to multiple merges and height reduction", () => {
                const tree = new BTree<number>(2);
                const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
                items.forEach(i => tree.add(i));
                expect(tree.size()).toBe(15);

                // Remove items in an order that forces complex reorganizations
                Collections.shuffle(items);
                let currentSize = 15;
                for (const item of items) {
                    expect(tree.remove(item)).toBe(true);
                    currentSize--;
                    expect(tree.size()).toBe(currentSize);
                    const currentArray = tree.toArray();
                    // This check is a bit tricky. We need to verify that all remaining items are present and sorted.
                    const remainingExpected = items.filter(i => tree.toArray().includes(i)).sort((a, b) => a - b);
                    expect(currentArray).toEqual(remainingExpected);

                }
                expect(tree.size()).toBe(0);
                expect(tree.toArray()).toEqual([]);
            });

            it("should cover merge with previous sibling in fillChild (rightmost child needs filling)", () => {
                const tree = new BTree<number>(2); // t=2, min keys = 1
                // Goal: Structure where a node P has children C0, C1.
                // C1 needs filling. C0 cannot lend. C1 has no right sibling.
                // So C1 merges with C0.
                // Example:
                //        [50]
                //       /    \
                //    [20]    [80]       &lt;-- Parent P is [80] (or P is root [50] and we are looking at its child [80])
                //   /  \    /  \
                // [10][30] [70][90]     &lt;-- C0=[70], C1=[90]. Both have t-1 keys.

                tree.add(50);
                tree.add(20);
                tree.add(80);
                tree.add(10);
                tree.add(30);
                tree.add(70);
                tree.add(90);
                // Current structure (simplified, root [50]):
                //         [50]
                //        /    \
                //    [20]      [80]
                //   /  \      /  \
                // [10][30]  [70]  [90]

                expect(tree.size()).toBe(7);

                // Remove 90.
                // Path: root [50] -> child [80].
                // In node [80], we want to remove 90 from its child leaf [90].
                // Leaf [90] has 1 key (t-1). It needs filling (or its parent handles it).
                // Parent of leaf [90] is node [80]. fillChild is called for child [90].
                // fillChild for [90] (idx=1 relative to parent [80]):
                // - Cannot borrow from left sibling [70] (it only has 1 key).
                // - No right sibling.
                // - Cannot merge with right sibling.
                // - Will merge with left sibling: mergeChildren(idx-1) i.e., mergeChildren(0) for parent [80].
                //   Node [70] and [90] merge with key 80 from parent. Parent [80] becomes empty of keys.
                //   The merged node becomes [70, 80, 90].
                //   The BTree's main remove logic will then handle the empty [80] node (possibly by reducing height).
                //   Then 90 is removed from [70, 80, 90], leaving [70, 80].

                expect(tree.remove(90)).toBe(true);
                expect(tree.size()).toBe(6);
                expect(tree.toArray()).toEqual([10, 20, 30, 50, 70, 80]);

                // Remove 70, then 80 to further stress merging
                expect(tree.remove(70)).toBe(true);
                expect(tree.size()).toBe(5);
                expect(tree.toArray()).toEqual([10, 20, 30, 50, 80]);

                expect(tree.remove(80)).toBe(true);
                expect(tree.size()).toBe(4);
                expect(tree.toArray()).toEqual([10, 20, 30, 50]);
            });

            it("should cover getSuccessor traversal through an internal node", () => {
                const tree = new BTree<number>(2); // t=2. Max keys = 3. Min keys (non-root) = 1.

                // Objective: Remove key K=50.
                // K's left child (C_L) must have t-1=1 key.
                // K's right child (C_R) must have >=t=2 keys AND be internal.
                // Successor will be the leftmost key in the subtree of C_R.
                //
                // Example structure:
                //                [Parent Key(s)]
                //                     |
                //                    [50]  &lt;-- Key K to remove
                //                   /    \
                //      (C_L)     [40]    [75] (C_R - must be internal and have >=t keys)
                //                       /    \
                //               (Leaf) [60]  [80] (Leaf) &lt;-- 60 is the successor of 50
                //
                // To build this, and ensure [75] is internal and has >=t keys initially for C_R:
                // Add: 50, 40, 75, 60, 80. Then more keys to make [75] definitely internal if needed.
                // Let's try a sequence for t=2:
                // 1. Add 50 (Root: [50])
                // 2. Add 40 (Root: [50], L: [40])
                // 3. Add 75 (Root: [50], L: [40], R: [75])
                // 4. Add 60 (Root: [50], L: [40], R: [75], L-child-of-75: [60]) -> R: [60,75]
                // 5. Add 80 (Root: [50], L: [40], R: [60,75,80]) -> R splits. Root: [50,75], L:[40], M:[60], R:[80]
                // This is not the target structure yet.

                // Let's force the structure by careful insertion order for t=2:
                tree.clear();
                tree.add(50); // Root [50]
                tree.add(25); // Root [25,50]
                tree.add(75); // Root [25,50,75] -> splits. Root [50], L[25], R[75]
                // Current:    [50]
                //            /    \
                //          [25]  [75]

                tree.add(10); // L-child of [25]
                tree.add(40); // R-child of [25] (or causes split if [25] full)
                // [25] becomes [10,25,40] -> splits.
                // L-path from root [50] becomes more complex.

                // Let's build a taller tree then remove to get the desired state, or add carefully.
                // Target state when removing 50:
                //         [Some Root, maybe 50 itself if it's root]
                //                  |
                //                 [50]
                //                /    \
                //  (node w/ 1 key)[X]  [Y, Z] (internal node, e.g. [75])
                //                         /  \
                //                       [S]  [...] (S is successor)
                tree.clear();
                // Degree t=2
                // Build:
                //          (70)
                //         /    \
                //     (30,50)  (80,90)
                //    /   |   \      \
                // (10)(40)(60)     (85)(95)
                //
                // Remove 50. Its left child (parented by 30,50) is (40). numKeys = 1 (t-1).
                // Its right child (parented by 30,50) is (60). numKeys = 1 (t-1).
                // This will trigger a merge for removing 50. Not good for this specific test.

                // New strategy for testing getSuccessor's loop:
                // Remove key K from an internal node.
                // K's left child has t-1 keys.
                // K's right child R has >= t keys AND R is internal.
                // The successor is the leftmost key in R's subtree.
                tree.clear();
                // Degree t=2
                // Keys: 10, 20, 30, 40, 50, 55, 60, 70, 80
                // Target: Remove 50
                // Structure should be such that 50's right child is internal.
                // And 50's left child has t-1 keys.
                //
                // Example state:
                //             [40]
                //            /    \
                //        [20]      [60]
                //       /  \      /    \
                //    [10]  [30]  [50]  [70,80]
                //
                // Removing 40: L child [20] (1 key, t-1), R child [60] (1 key, t-1) -> merge
                //
                // Let's try to build this for removing K=50:
                //          [P]
                //           |
                //          [50] &lt;-- K
                //         /    \
                //      [L_Key] [Internal_R_Child]
                //                 /  \
                //        [Successor] ...
                //
                // Add: 60, 40, 80, 20, 50, 70, 90, 10, 30, 45, 55 (to make 50 an internal node)
                //      52 (to make 50's left child have 1 key after some ops)
                //      65, 75 (to make 50's right child internal)
                [60, 40, 80, 20, 50, 70, 90, 10, 30, 45, 55, 52, 65, 75].forEach(k => tree.add(k));
                // tree.printTree(); // Use this to understand the structure formed

                // Suppose we want to remove key 50.
                // We need to ensure:
                // 1. Node containing 50 is `N`.
                // 2. `N.children[idx_of_50]` (left child of 50's slot) has 1 key.
                // 3. `N.children[idx_of_50 + 1]` (right child of 50's slot) is internal and has >=2 keys.
                //    The successor will be leftmost of `N.children[idx_of_50 + 1]`.

                // A simpler, direct way to test getSuccessor more deeply:
                // Let's remove a value that is a median in a larger node,
                // forcing it to pick a successor from a right child that is multi-level.
                tree.clear();
                // For t=2, node capacity is 3 keys, 4 children.
                // Add 10, 20, 30, 40, 50, 60, 70, 5, 15, 25, 35, 45, 55, 65
                const items_succ = [10, 20, 30, 40, 50, 60, 70, 5, 15, 25, 35, 45, 55, 65];
                items_succ.forEach(item => tree.add(item));
                const sizeBefore = tree.size();

                // Pick a key to remove that is likely an internal node and has a right subtree
                // where successor is not an immediate child. E.g. remove 20 or 40.
                // If we remove 20:
                //   - Its left child might have t-1 keys.
                //   - Its right child needs to be internal for getSuccessor to loop.
                // tree.printTree(); // Crucial to see the structure

                // Example: remove 40.
                // Let's assume a structure (this depends on insertion order)
                //            (... 40 ...) &lt;-- node N
                //           /          \
                // (child_L, keys < 40) (child_R, keys > 40, internal)
                //                        /  \
                //               (leftmost_of_child_R = successor S) (...)
                //
                // If child_L has t-1 keys, and child_R has >= t keys.
                expect(tree.contains(40)).toBe(true);
                expect(tree.remove(40)).toBe(true); // This should call getSuccessor
                expect(tree.size()).toBe(sizeBefore - 1);
                expect(tree.contains(40)).toBe(false);
                // Check that the successor (e.g., 45 if it was structured that way) is now in 40's place or tree is rebalanced.
                // And the successor is removed from its original leaf position.

                // Also, try to remove the absolute minimum element from such a populated tree
                // to ensure predecessor logic is hit (though that's for getPredecessor)
                // And then the next minimum to test successor again if the structure allows.
                const minElement = tree.toArray()[0];
                if (minElement !== undefined) {
                    const sizeBeforeMinRemove = tree.size();
                    expect(tree.remove(minElement)).toBe(true);
                    expect(tree.size()).toBe(sizeBeforeMinRemove - 1);
                    expect(tree.contains(minElement)).toBe(false);
                }
            });
        });
    });

    describe("search", () => {
        it("should return null when searching in an empty tree", () => {
            const tree = new BTree<number>(2);
            expect(tree.search(10)).toBeNull();
        });

        it("should return the item if found", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(5);
            tree.add(15);
            expect(tree.search(10)).toBe(10);
            expect(tree.search(5)).toBe(5);
            expect(tree.search(15)).toBe(15);
        });

        it("should return null if item is not found", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(5);
            expect(tree.search(15)).toBeNull();
            expect(tree.search(1)).toBeNull();
        });
    });

    describe("contains", () => {
        it("should return false when checking in an empty tree", () => {
            const tree = new BTree<number>(2);
            expect(tree.contains(10)).toBe(false);
        });

        it("should return true if item exists", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(5);
            expect(tree.contains(10)).toBe(true);
            expect(tree.contains(5)).toBe(true);
        });

        it("should return false if item does not exist", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            expect(tree.contains(5)).toBe(false);
        });
    });

    describe("clear", () => {
        it("should do nothing on an empty tree", () => {
            const tree = new BTree<number>(2);
            tree.clear();
            expect(tree.size()).toBe(0);
            expect(tree.toArray()).toEqual([]);
        });

        it("should empty a populated tree", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(5);
            tree.add(15);
            tree.clear();
            expect(tree.size()).toBe(0);
            expect(tree.toArray()).toEqual([]);
            expect(tree.contains(10)).toBe(false);
        });
    });

    describe("size/length", () => {
        it("should return 0 for an empty tree", () => {
            const tree = new BTree<number>(2);
            expect(tree.size()).toBe(0);
            expect(tree.length).toBe(0);
        });

        it("should return the correct count after additions", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            expect(tree.size()).toBe(1);
            tree.add(20);
            expect(tree.size()).toBe(2);
            tree.add(10); // Duplicate
            expect(tree.size()).toBe(2);
            expect(tree.length).toBe(2);
        });

        it("should return the correct count after removals", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(20);
            tree.add(30);
            tree.remove(20);
            expect(tree.size()).toBe(2);
            tree.remove(5); // Non-existent
            expect(tree.size()).toBe(2);
            tree.remove(10);
            expect(tree.size()).toBe(1);
            tree.remove(30);
            expect(tree.size()).toBe(0);
            expect(tree.length).toBe(0);
        });
    });

    describe("iterator", () => {
        it("should yield nothing for an empty tree", () => {
            const tree = new BTree<number>(2);
            expect(tree.toArray()).toEqual([]);
        });

        it("should yield items in sorted order", () => {
            const tree = new BTree<number>(2);
            const items = [15, 5, 20, 10, 25, 1, 30];
            items.forEach(item => tree.add(item));
            const expected = [...new Set(items)].sort((a, b) => a - b);
            expect(tree.toArray()).toEqual(expected);
        });

        it("should yield items in sorted order after removals", () => {
            const tree = new BTree<number>(2);
            const items = [15, 5, 20, 10, 25, 1, 30];
            items.forEach(item => tree.add(item));
            tree.remove(10);
            tree.remove(1);
            const remainingItems = items.filter(i => i !== 10 && i !== 1);
            const expected = [...new Set(remainingItems)].sort((a, b) => a - b);
            expect(tree.toArray()).toEqual(expected);
        });
    });

    describe("printTree", () => {
        it("should not throw for an empty tree", () => {
            const tree = new BTree<number>(2);
            expect(() => tree.printTree()).not.toThrow();
        });

        it("should not throw for a populated tree", () => {
            const tree = new BTree<number>(2);
            tree.add(10);
            tree.add(5);
            tree.add(15);
            expect(() => tree.printTree()).not.toThrow();
        });
    });


    describe("complex scenarios", () => {
        it("should handle a sequence of additions and deletions (degree 2)", () => {
            const tree = new BTree<number>(2);
            const added: Set<number> = new Set();
            const operations = [
                {op: "add", val: 50}, {op: "add", val: 30}, {op: "add", val: 70},
                {op: "add", val: 20}, {op: "add", val: 40}, {op: "add", val: 60},
                {op: "add", val: 80}, {op: "remove", val: 30}, {op: "add", val: 35},
                {op: "remove", val: 70}, {op: "add", val: 25}, {op: "remove", val: 50},
                {op: "add", val: 5}, {op: "add", val: 90}, {op: "remove", val: 5},
                {op: "remove", val: 90}, {op: "remove", val: 40}
            ];

            for (const action of operations) {
                if (action.op === "add") {
                    const result = tree.add(action.val);
                    if (!added.has(action.val)) {
                        expect(result).toBe(true);
                        added.add(action.val);
                    } else {
                        expect(result).toBe(false);
                    }
                } else if (action.op === "remove") {
                    const result = tree.remove(action.val);
                    if (added.has(action.val)) {
                        expect(result).toBe(true);
                        added.delete(action.val);
                    } else {
                        expect(result).toBe(false);
                    }
                }
                expect(tree.size()).toBe(added.size);
                expect(tree.toArray()).toEqual(Array.from(added).sort((a, b) => a - b));
            }
        });

        it("intensive random operations (degree 3)", () => {
            const tree = new BTree<number>(3);
            const referenceSet = new Set<number>();
            const N = 200; // Number of operations
            const MAX_VAL = 100;

            for (let i = 0; i < N; i++) {
                const operationType = Math.random();
                const value = Math.floor(Math.random() * MAX_VAL);

                if (operationType < 0.65) { // 65% chance to add
                    const expectedSetResult = !referenceSet.has(value);
                    const treeResult = tree.add(value);
                    if (expectedSetResult) {
                        referenceSet.add(value);
                        expect(treeResult).toBe(true);
                    } else {
                        expect(treeResult).toBe(false);
                    }
                } else { // 35% chance to remove
                    const expectedSetResult = referenceSet.has(value);
                    const treeResult = tree.remove(value);
                    if (expectedSetResult) {
                        referenceSet.delete(value);
                        expect(treeResult).toBe(true);
                    } else {
                        expect(treeResult).toBe(false);
                    }
                }
                expect(tree.size()).toBe(referenceSet.size);
                expect(tree.length).toBe(referenceSet.size);
                expect(tree.toArray()).toEqual(Array.from(referenceSet).sort((a, b) => a - b));
                if (value % 10 === 0) { // Periodically check contains
                    for (let k = 0; k < MAX_VAL; k += 5) {
                        expect(tree.contains(k)).toBe(referenceSet.has(k));
                    }
                }
            }
        });
    });

    describe("with custom comparator (string lengths)", () => {
        const lengthComparator: OrderComparator<string> = (a, b) => {
            if (a.length < b.length) return -1;
            if (a.length > b.length) return 1;
            // Secondary sort alphabetically for stability if lengths are equal
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        };
        let tree: BTree<string>;

        beforeEach(() => {
            tree = new BTree<string>(2, lengthComparator);
        });

        it("should add and maintain order based on string length", () => {
            tree.add("apple");    // 5
            tree.add("banana");   // 6
            tree.add("kiwi");     // 4
            tree.add("fig");      // 3
            tree.add("grape");    // 5
            expect(tree.toArray()).toEqual(["fig", "kiwi", "apple", "grape", "banana"]);
            expect(tree.size()).toBe(5);
        });

        it("should not add duplicate string if length and value are same", () => {
            tree.add("apple");
            expect(tree.add("apple")).toBe(false);
            expect(tree.size()).toBe(1);
        });

        it("should remove based on string length and value", () => {
            tree.add("apple");
            tree.add("banana");
            tree.add("kiwi");
            tree.add("fig");

            expect(tree.remove("apple")).toBe(true);
            expect(tree.toArray()).toEqual(["fig", "kiwi", "banana"]);
            expect(tree.remove("pear")).toBe(false); // Not present
        });

        it("should search based on string length and value", () => {
            tree.add("apple");
            tree.add("banana");
            expect(tree.search("apple")).toBe("apple");
            expect(tree.search("apples")).toBeNull(); // Different string even if length could match
        });
    });

    describe("with custom comparator (Person)", () => {
        let tree: BTree<Person>;

        beforeEach(() => {
            tree = new BTree<Person>(2, (p1, p2) => p1.name.toString().localeCompare(p2.name.toString()));
        });

        it('should not add a person if an identical one (by comparator) already exists\'', () => {
            const alice2 = new Person("Alice", "Willow", 33);
            tree.add(Person.Alice);

            expect(tree.add(alice2)).toBe(false);
            expect(tree.size()).toBe(1);
            expect(tree.contains(Person.Alice)).toBe(true);
        });

    });

    describe("enumerable tests", () => {
        const tree = new BTree<number>(3);
        tree.add(10);
        tree.add(5);
        tree.add(20);
        tree.add(15);
        tree.add(40);
        tree.add(30);
        tree.add(35);
        tree.add(25);
        it("should take first five elements", () => {
            const expected = [5, 10, 15, 20, 25];
            const result = tree.take(5).toArray();
            expect(result).to.deep.equal(expected);
        });
        it("should take last five elements", () => {
            const expected = [20, 25, 30, 35, 40];
            const result = tree.takeLast(5).toArray();
            expect(result).to.deep.equal(expected);
        });
        it("should get first element", () => {
            const expected = 5;
            const first = tree.first();
            expect(first).to.deep.equal(expected);
        });
        it("should get last element", () => {
            const expected = 40;
            const last = tree.last();
            expect(last).to.deep.equal(expected);
        });
    });
});
