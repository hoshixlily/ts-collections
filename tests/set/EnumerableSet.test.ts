import {describe, it} from "mocha";
import {expect} from "chai";
import {Person} from "../models/Person";
import {EnumerableSet} from "../../src/set/EnumerableSet";
import {LinkedList} from "../../src/list/LinkedList";

describe("EnumerableSet", () => {
    describe("#add()", () => {
        it("should add an item to the set", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            expect(set.contains(Person.Bella)).to.be.true;
        });
    });
    describe("#clear()", () => {
        it("should clear the set", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            set.add(Person.Senna);
            set.clear();
            expect(set.contains(Person.Bella)).to.be.false;
            expect(set.length).to.equal(0);
        });
    });
    describe("#contains()", () => {
        it("should return true if the set contains the item", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            expect(set.contains(Person.Bella)).to.be.true;
        });
        it("should return false if the set does not contain the item", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            expect(set.contains(Person.Senna)).to.be.false;
        });
    });

    describe("#intersectWith()", () => {
        const set = new EnumerableSet<Person>([]);
        set.add(Person.Jisu);
        set.add(Person.Amy);
        it("should remove all items from the set", () => {
            expect(set.length).to.eq(2);
            set.intersectWith(new LinkedList([Person.Jisu, Person.Mel]));
            expect(set.size()).to.eq(1);
            expect(set.length).to.eq(1);
            expect(set.contains(Person.Amy)).to.be.false;
            expect(set.contains(Person.Mel)).to.be.false;
            expect(set.contains(Person.Jisu)).to.be.true;
        });
    });

    describe("#remove()", () => {
        it("should remove the item from the set", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            set.remove(Person.Bella);
            expect(set.contains(Person.Bella)).to.be.false;
        });
    });
    describe("#removeAll()", () => {
        it("should remove all items from the set", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            set.add(Person.Senna);
            set.add(Person.Reina);
            set.removeAll([Person.Bella, Person.Reina]);
            expect(set.contains(Person.Bella)).to.be.false;
            expect(set.contains(Person.Reina)).to.be.false;
            expect(set.contains(Person.Senna)).to.be.true;
        });
    });
    describe("#removeIf()", () => {
        it("should remove all items from the set that match the predicate", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            set.add(Person.Senna);
            set.add(Person.Reina);
            set.removeIf(p => p.name === "Bella");
            expect(set.contains(Person.Bella)).to.be.false;
            expect(set.contains(Person.Reina)).to.be.true;
            expect(set.contains(Person.Senna)).to.be.true;
        });
    });
    describe("#retainAll()", () => {
        it("should retain only the items in the set that match the predicate", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            set.add(Person.Senna);
            set.add(Person.Reina);
            set.retainAll([Person.Bella, Person.Reina]);
            expect(set.contains(Person.Bella)).to.be.true;
            expect(set.contains(Person.Reina)).to.be.true;
            expect(set.contains(Person.Senna)).to.be.false;
        });
    });
    describe("#toString()", () => {
        it("should return empty string if set is empty", () => {
            const set = new EnumerableSet<Person>();
            expect(set.toString()).to.equal("");
        });
        it("should return the string representation of the set", () => {
            const set = new EnumerableSet<Person>();
            set.add(Person.Bella);
            set.add(Person.Senna);
            set.add(Person.Reina);
            set.add(Person.Senna);
            expect(set.toString()).to.equal("Bella Rivera, Senna Hikaru, Reina Karuizawa");
        }).timeout(0);
    });
});
