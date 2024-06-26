import { Enumerable } from "../../src/imports";
import { List } from "../../src/list/List";
import { ReadonlyList } from "../../src/list/ReadonlyList";

describe("ReadonlyList", () => {
    describe("#entries()", () => {
        test("should return an indexed IterableIterator", () => {
            const list = new ReadonlyList(Enumerable.range(1, 100).toList());
            for (const [index, element] of list.entries()) {
                expect(index + 1).to.eq(element);
                expect(list.get(index)).to.eq(element);
            }
        });
    });

    describe("#get()", () => {
        test("should return the element at the given index", () => {
            const list = new ReadonlyList(Enumerable.range(1, 100).toList());
            for (let i = 0; i < 100; i++) {
                expect(list.get(i)).to.eq(i + 1);
            }
        });
    });

    describe("#getRange()", () => {
        test("should return a new list containing the elements in the given range", () => {
            const list = new ReadonlyList(Enumerable.range(1, 100).toList());
            for (let i = 0; i < 100; i++) {
                const range = list.getRange(i, 100 - i);
                expect(range.size()).to.eq(100 - i);
                for (let j = 0; j < 100 - i; j++) {
                    expect(range.get(j)).to.eq(i + j + 1);
                }
            }
        });
        test("should throw an error if the given index is out of bounds", () => {
            const list = new ReadonlyList(Enumerable.range(1, 100).toList());
            expect(() => list.getRange(-1, 1)).to.throw(Error);
            expect(() => list.getRange(100, 1)).to.throw(Error);
        });
        test("should throw an error if the given count is out of bounds", () => {
            const list = new ReadonlyList(Enumerable.range(1, 100).toList());
            expect(() => list.getRange(0, -1)).to.throw(Error);
            expect(() => list.getRange(0, 101)).to.throw(Error);
        });
    });

    describe("#indexOf()", () => {
        test("should return the index of the given element", () => {
            const list = new ReadonlyList(Enumerable.range(1, 100).toList());
            for (let i = 0; i < 100; i++) {
                expect(list.indexOf(i + 1)).to.eq(i);
            }
        });
    });

    describe("#lastIndexOf()", () => {
        test("should return the last index of the given element", () => {
            const list = new ReadonlyList(Enumerable.range(1, 100).toLinkedList());
            for (let i = 0; i < 100; i++) {
                expect(list.lastIndexOf(i + 1)).to.eq(i);
            }
        });
    });

    describe("#size()", () => {
        test("should return the number of elements in the collection", () => {
            const list = new ReadonlyList(new List([1, 2, 3, 4, 5]));
            expect(list.size()).to.equal(5);
            expect(list.length).to.equal(5);
        });
        test("should reflect changes to the underlying collection", () => {
            const list = new List([1, 2, 3, 4, 5]);
            const readonlyList = new ReadonlyList(list);
            expect(readonlyList.size()).to.equal(5);
            expect(readonlyList.length).to.equal(5);
            list.add(6);
            expect(readonlyList.size()).to.equal(6);
            expect(readonlyList.length).to.equal(6);
        });
    });
});