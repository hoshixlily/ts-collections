import { expect } from "chai";
import { List } from "../../src/list/List";
import { Person } from "../models/Person";
import { IDeque } from "../../src/queue/IDeque";
import {describe, it} from "mocha";

describe("Deque", () => {
    const person: Person     = new Person("Alice", "Rivermist", 23);
    const person2: Person    = new Person("Mel", "Bluesky", 9);
    const person3: Person    = new Person("Senna", "Hikaru", 10);
    const person4: Person    = new Person("Lenka", "Polakova", 16);
    const person5: Person    = new Person("Jane", "Green", 16);
    describe("#clear()", () => {
        it("size should be equal to 0", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.clear();
            expect(queue.size()).to.equal(0);
        });
    });
    describe("#dequeue()", () => {
        it("should throw InvalidOperationException ['queue is empty.]", () => {
            const queue: IDeque<Person> = new List<Person>();
            expect(() => queue.dequeue()).to.throw("queue is empty.");
        });
        it("should return a person with the name Alice", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const first = queue.dequeue();
            expect(first.Name).to.equal("Alice");
        });
        it("size should be equal to 3", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.enqueue(person3);
            queue.enqueue(person5);
            queue.dequeue();
            expect(queue.size()).to.eq(3);
        });
    });
    describe("#dequeueLast()", () => {
        it("should throw InvalidOperationException ['queue is empty.]", () => {
            const queue: IDeque<Person> = new List<Person>();
            expect(() => queue.dequeueLast()).to.throw("queue is empty.");
        });
        it("should return a person with the name Jane", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const last = queue.dequeueLast();
            expect(last.Name).to.equal("Jane");
        });
        it("size should be equal to 3", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.enqueue(person3);
            queue.enqueue(person5);
            queue.dequeueLast();
            expect(queue.size()).to.eq(3);
        });
    });
    describe("#enqueue()", () => {
        it("should add element to the list", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            expect(queue.peek()).to.equal(person);
        });
        it("size should be equal to 1", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            expect(queue.size()).to.equal(1);
        });
    });
    describe("#enqueueFirst()", () => {
        it("should add element to the deque", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueueFirst(person);
            expect(queue.peek()).to.equal(person);
        });
        it("size should be equal to 1", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            expect(queue.size()).to.equal(1);
        });
        it("should add element to the start of deque", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueueFirst(person);
            queue.enqueueFirst(person2);
            expect(queue.peek()).to.equal(person2);
        });
    });
    describe("#includes()", () => {
        const queue: IDeque<Person> = new List<Person>();
        queue.enqueue(person);
        queue.enqueue(null);
        queue.enqueue(person2);
        it("should contain person", () => {
            const exists = queue.includes(person);
            expect(exists).to.equal(true);
        });
        it("should contain null item", () => {
            expect(queue.includes(null)).to.eq(true);
        });
        it("should not contain person", () => {
            expect(queue.includes(person4)).to.eq(false);
        });
    });
    describe("#peek()", () => {
        it("should return null.", () => {
            const queue: IDeque<Person> = new List<Person>();
            expect(queue.peek()).to.equal(null);
        });
        it("should return a person with the name Alice", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const first = queue.peek();
            expect(first.Name).to.equal("Alice");
        });
        it("size should not change", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const fc = queue.size();
            queue.peek();
            expect(queue.size()).to.eq(fc);
        });
    });
    describe("#peekLast()", () => {
        it("should return null.", () => {
            const queue: IDeque<Person> = new List<Person>();
            expect(queue.peekLast()).to.equal(null);
        });
        it("should return a person with the name Jane", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const first = queue.peekLast();
            expect(first.Name).to.equal("Jane");
        });
        it("size should not change", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const fc = queue.size();
            queue.peekLast();
            expect(queue.size()).to.eq(fc);
        });
    });
    describe("#poll()", () => {
        it("should return null", () => {
            const queue: IDeque<Person> = new List<Person>();
            expect(queue.poll()).to.eq(null);
        });
        it("should return a person with the name Alice", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const first = queue.poll();
            expect(first.Name).to.equal("Alice");
        });
        it("size should be equal to 3", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.enqueue(person3);
            queue.enqueue(person5);
            queue.poll();
            expect(queue.size()).to.eq(3);
        });
    });
    describe("#pollLast()", () => {
        it("should return null", () => {
            const queue: IDeque<Person> = new List<Person>();
            expect(queue.pollLast()).to.eq(null);
        });
        it("should return a person with the name Jane", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person3);
            queue.enqueue(person5);
            const first = queue.pollLast();
            expect(first.Name).to.equal("Jane");
        });
        it("size should be equal to 3", () => {
            const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.enqueue(person3);
            queue.enqueue(person5);
            queue.pollLast();
            expect(queue.size()).to.eq(3);
        });
    });
    describe("#toArray()", () => {
        const queue: IDeque<Person> = new List<Person>();
            queue.enqueue(person);
            queue.enqueue(person2);
            queue.enqueue(person3);
            queue.enqueue(person5);
        const array = queue.toArray();
        it("should have the same size as list", () => {
            expect(queue.size()).to.eq(array.length);
        });
        const personComparer = (ix: number) => {
            it(`should have same person at the index: ${ix}`, () => {
                const p = queue.dequeue();
                expect(p).deep.equal(array[ix]);
            });
        };
        for (var ix = 0; ix < queue.size(); ++ix){
            personComparer(ix);
        }
    });
    describe("#Count getter", () => {
        const queue: IDeque<string> = new List();
        queue.enqueue("Alice");
        queue.enqueue("Rei");
        queue.enqueue("Misaki");
        it("should have the count of 3", () => {
            expect(queue.Count).to.eq(3);
            expect(queue.Count).to.eq(queue.size());
        });
        it("should have the count of 2", () => {
            queue.dequeueLast();
            expect(queue.Count).to.eq(2);
            expect(queue.Count).to.eq(queue.size());
        });
        it("should have the count of 5", () => {
            queue.enqueue("Alice");
            queue.enqueue("Yuzuha");
            queue.enqueue("Megumi");
            expect(queue.Count).to.eq(5);
            expect(queue.Count).to.eq(queue.size());
        });
        it("should throw an error if assigned", () => {
            // @ts-ignore
            expect(() => queue.Count = 10).to.throw();
        });
    });
    describe("#for-of loop", () => {
        const queue: IDeque<number> = new List<number>();
        queue.enqueue(10);
        queue.enqueue(50);
        queue.enqueue(22);
        queue.enqueue(20);
        const numArray: number[] = [];
        for (const num of queue) {
            numArray.push(num);
        }
        it("should have four items", () => {
            expect(numArray.length).to.eq(4);
        });
        it("should loop over the list", () => {
            expect(numArray[0]).to.eq(10);
            expect(numArray[1]).to.eq(50);
            expect(numArray[2]).to.eq(22);
            expect(numArray[3]).to.eq(20);
        });
    });
});
