import { ImmutableDictionary } from "../../src/dictionary/ImmutableDictionary";
import { KeyValuePair } from "../../src/dictionary/KeyValuePair";
import { test } from "vitest";

describe("ImmutableDictionary", () => {
    describe("#add()", () => {
        test("should add values to the dictionary with a string key", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            const newDictionary = dictionary.add("key3", "value3");
            expect(dictionary.size()).to.equal(2);
            expect(dictionary.get("key3")).to.be.null;
            expect(newDictionary.get("key3")).to.equal("value3");
            expect(newDictionary.length).to.equal(3);
            expect(newDictionary.size()).to.equal(3);
            expect(newDictionary.containsKey("key1")).to.be.true;
            expect(newDictionary.containsKey("key2")).to.be.true;
        });
    });
    describe("#clear()", () => {
        test("should clear the dictionary", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            const newDictionary = dictionary.clear();
            expect(dictionary.size()).to.equal(2);
            expect(dictionary.isEmpty()).to.be.false;
            expect(newDictionary.size()).to.equal(0);
            expect(newDictionary.isEmpty()).to.be.true;
        });
    });
    describe("#containsKey()", () => {
        test("should return true if the key exists in the dictionary", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            expect(dictionary.containsKey("key1")).to.be.true;
            expect(dictionary.containsKey("key2")).to.be.true;
            expect(dictionary.containsKey("key3")).to.be.false;
        });
    });
    describe("#containsValue()", () => {
        test("should return true if the value exists in the dictionary", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            expect(dictionary.containsValue("value1")).to.be.true;
            expect(dictionary.containsValue("value2")).to.be.true;
            expect(dictionary.containsValue("value3")).to.be.false;
        });
    });
    describe("#create()", () => {
        test("should create an empty ImmutableDictionary", () => {
            const dictionary = ImmutableDictionary.create();
            expect(dictionary.size()).to.equal(0);
        });
        test("should create an ImmutableDictionary from an iterable of KeyValuePair objects", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            expect(dictionary.size()).to.equal(2);
            expect(dictionary.get("key1")).to.equal("value1");
            expect(dictionary.get("key2")).to.equal("value2");
        });
        test("should create an ImmutableDictionary from an iterable of [key, value] pairs", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    ["key1", "value1"],
                    ["key2", "value2"]
                ]
            );
            expect(dictionary.size()).to.equal(2);
            expect(dictionary.get("key1")).to.equal("value1");
            expect(dictionary.get("key2")).to.equal("value2");
        });
    });
    describe("#entries()", () => {
        test("should return an IterableIterator of [key, value] pairs", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            const iterator = dictionary.entries();
            expect(iterator.next().value).to.deep.equal(["key1", "value1"]);
            expect(iterator.next().value).to.deep.equal(["key2", "value2"]);
            expect(iterator.next().done).to.be.true;
        });
    });
    describe("#get()", () => {
        test("should return the value associated with the key", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            expect(dictionary.get("key1")).to.equal("value1");
            expect(dictionary.get("key2")).to.equal("value2");
            expect(dictionary.get("key3")).to.be.null;
        });
    });
    describe("#keys()", () => {
        test("should return a set of keys", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            const keys = dictionary.keys();
            expect(keys.size()).to.equal(2);
            expect(keys.contains("key1")).to.be.true;
            expect(keys.contains("key2")).to.be.true;
            expect(keys.contains("key3")).to.be.false;
        });
    });
    describe("#put()", () => {
        test("should add a value to the dictionary", () => {
            const dictionary = ImmutableDictionary.create();
            const newDictionary = dictionary.put("key1", "value1");
            expect(dictionary.size()).to.equal(0);
            expect(dictionary.get("key1")).to.be.null;
            expect(newDictionary.size()).to.equal(1);
            expect(newDictionary.get("key1")).to.equal("value1");
        });
        test("should update the value of the key if the key already exists", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1")
                ]
            );
            const newDictionary = dictionary.put("key1", "value2");
            expect(dictionary.size()).to.equal(1);
            expect(dictionary.get("key1")).to.equal("value1");
            expect(newDictionary.size()).to.equal(1);
            expect(newDictionary.get("key1")).to.equal("value2");
        });
        test("should put the value in the dictionary if the key does not exist", () => {
            type KeyType = "K1" | "K2" | "K3";
            const dictionary = ImmutableDictionary.create<KeyType, boolean>();
            const newDictionary = dictionary.put("K1", false);
            expect(dictionary.size()).to.equal(0);
            expect(dictionary.get("K1")).to.be.null;
            expect(newDictionary.size()).to.equal(1);
            expect(newDictionary.get("K1")).to.be.false;
        });
    });
    describe("#remove()", () => {
        test("should remove the key and its associated value from the dictionary", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1")
                ]
            );
            const newDictionary = dictionary.remove("key1");
            expect(dictionary.size()).to.equal(1);
            expect(dictionary.get("key1")).to.equal("value1");
            expect(newDictionary.size()).to.equal(0);
            expect(newDictionary.get("key1")).to.be.null;
        });
    });
    describe("#set()", () => {
        test("should set the value of the key", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1")
                ]
            );
            const newDictionary = dictionary.set("key1", "value2");
            expect(dictionary.size()).to.equal(1);
            expect(dictionary.get("key1")).to.equal("value1");
            expect(newDictionary.size()).to.equal(1);
            expect(newDictionary.get("key1")).to.equal("value2");
        });
    });
    describe("#size()", () => {
        test("should return the number of elements in the dictionary", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1")
                ]
            );
            expect(dictionary.size()).to.equal(1);
        });
    });
    describe("#values()", () => {
        test("should return a collection of values", () => {
            const dictionary = ImmutableDictionary.create(
                [
                    new KeyValuePair("key1", "value1"),
                    new KeyValuePair("key2", "value2")
                ]
            );
            const values = dictionary.values();
            expect(values.size()).to.equal(2);
            expect(values.contains("value1")).to.be.true;
            expect(values.contains("value2")).to.be.true;
            expect(values.contains("value3")).to.be.false;
        });
    });
});
