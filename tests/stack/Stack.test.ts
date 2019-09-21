import { expect } from "chai";
import { Stack } from "../../src/stack/Stack";
import { Person } from "../models/Person";

describe("Stack", () => {
    const person: Person     = new Person("Alice", "Rivermist", 23);
    const person2: Person    = new Person("Mel", "Bluesky", 9);
    const person3: Person    = new Person("Senna", "Hikaru", 10);
    const person4: Person    = new Person("Lenka", "Polakova", 16);
    const person5: Person    = new Person("Jane", "Green", 16);
    describe("#clear()", () => {
        it("size should be equal to 0", () => {
            const stack: Stack<Person> = new Stack<Person>();
            stack.push(person);
            stack.push(person2);
            stack.clear();
            expect(stack.size()).to.equal(0);
        });
    });
    describe("#contains()", () => {
        const stack: Stack<Person> = new Stack<Person>();
        stack.push(person);
        stack.push(null);
        stack.push(person2);
        it("should contain person", () => {
            const exists = stack.contains(person);
            expect(exists).to.equal(true);
        });
        it("should contain null item", () => {
            expect(stack.contains(null)).to.eq(true);
        });
        it("should not contain person", () => {
            expect(stack.contains(person4)).to.eq(false);
        });
    });
    describe("#peek()", () => {
        it("should throw InvalidOperationException ['stack is empty.]", () => {
            const stack: Stack<Person> = new Stack<Person>();
            expect(() => stack.peek()).to.throw("stack is empty.");
        });
        it("should return a person with the name Jane", () => {
            const stack: Stack<Person> = new Stack<Person>();
            stack.push(person);
            stack.push(person3);
            stack.push(person5);
            const first = stack.peek();
            expect(first.Name).to.equal("Jane");
        });
        it("size should not change", () => {
            const stack: Stack<Person> = new Stack<Person>();
            stack.push(person);
            stack.push(person2);
            stack.push(person3);
            stack.push(person5);
            const fc = stack.size();
            stack.peek();
            expect(stack.size()).to.eq(fc);
        });
    });
    describe("#pop()", () => {
        it("should throw InvalidOperationException ['stack is empty.]", () => {
            const stack: Stack<Person> = new Stack<Person>();
            expect(() => stack.pop()).to.throw("stack is empty.");
        });
        it("should return a person with the name Jane", () => {
            const stack: Stack<Person> = new Stack<Person>();
            stack.push(person);
            stack.push(person3);
            stack.push(person5);
            const top = stack.pop();
            expect(top.Name).to.equal("Jane");
        });
        it("size should be equal to 3", () => {
            const stack: Stack<Person> = new Stack<Person>();
            stack.push(person);
            stack.push(person2);
            stack.push(person3);
            stack.push(person5);
            stack.pop();
            expect(stack.size()).to.eq(3);
        });
    });
    describe("#push()", () => {
        it("should add element to the list", () => {
            const stack: Stack<Person> = new Stack<Person>();
            stack.push(person);
            expect(stack.peek()).to.equal(person);
        });
        it("size should be equal to 1", () => {
            const stack: Stack<Person> = new Stack<Person>();
            stack.push(person);
            expect(stack.size()).to.equal(1);
        });
    });
    
    describe("#toArray()", () => {
        const stack: Stack<Person> = new Stack<Person>();
        stack.push(person);
        stack.push(person2);
        stack.push(person3);
        stack.push(person5);
        const array = stack.toArray();
        it("should have the same size as list", () => {
            expect(stack.size()).to.eq(array.length);
        });
        const personComparer = (ix: number) => {
            it(`should have same person at the index: ${ix}`, () => {
                const p = stack.pop();
                expect(p).deep.equal(array[ix]);
            });
        };
        for (var ix = 0; ix < stack.size(); ++ix){
            personComparer(ix);
        }
    });
});