import { describe } from "vitest";
import { KeyValuePair } from "../../src/dictionary/KeyValuePair";
import { AsyncEnumerable } from "../../src/enumerator/AsyncEnumerable";
import { Enumerable, List } from "../../src/imports";
import { IndexOutOfBoundsException } from "../../src/shared/IndexOutOfBoundsException";
import { InvalidArgumentException } from "../../src/shared/InvalidArgumentException";
import { MoreThanOneElementException } from "../../src/shared/MoreThanOneElementException";
import { MoreThanOneMatchingElementException } from "../../src/shared/MoreThanOneMatchingElementException";
import { NoElementsException } from "../../src/shared/NoElementsException";
import { NoMatchingElementException } from "../../src/shared/NoMatchingElementException";
import { Helper } from "../helpers/Helper";
import { Pair } from "../models/Pair";
import { Person } from "../models/Person";
import { School } from "../models/School";
import { SchoolStudents } from "../models/SchoolStudents";
import { Student } from "../models/Student";

describe("AsyncEnumerable", () => {
    const suspend = (ms: number) => new Promise(resolve => global.setTimeout(resolve, ms));

    const arrayProducer = async function* <T>(numbers: T[], delay: number = 1): AsyncIterable<T> {
        for (let ix = 0; ix < numbers.length; ++ix) {
            await suspend(delay);
            yield numbers[ix];
        }
    };

    const mixedProducer = async function* (list: any[], delay: number = 1): AsyncIterable<number | string> {
        for (let ix = 0; ix < list.length; ++ix) {
            await suspend(delay);
            yield list[ix];
        }
    };

    const numberProducer = async function* (limit: number = 100, delay: number = 1, start: number = 0): AsyncIterable<number> {
        for (let ix = start; ix < limit; ++ix) {
            await suspend(delay);
            yield ix;
        }
    };

    const numericalStringProducer = async function* (limit: number = 100, delay: number = 1): AsyncIterable<string> {
        for (let ix = 0; ix < limit; ++ix) {
            await suspend(delay);
            yield ix.toString();
        }
    };

    const personProducer = async function* (peopleList: Person[] = [], delay: number = 1): AsyncIterable<Person> {
        for (let ix = 0; ix < peopleList.length; ++ix) {
            await suspend(delay);
            yield peopleList[ix];
        }
    };

    const stringProducer = async function* (stringList: string[], delay: number = 1): AsyncIterable<string> {
        for (let ix = 0; ix < stringList.length; ++ix) {
            await suspend(delay);
            yield stringList[ix];
        }
    };

    const keyValuePairProducer = async function* <TKey, TValue>(pairs: Array<[TKey, TValue]>, delay: number = 1): AsyncIterable<KeyValuePair<TKey, TValue>> {
        for (let ix = 0; ix < pairs.length; ++ix) {
            await suspend(delay);
            yield new KeyValuePair<TKey, TValue>(pairs[ix][0], pairs[ix][1]);
        }
    };

    describe("aggregate", () => {
        test("should return 3", async () => {
            const result = await new AsyncEnumerable(numberProducer(3)).aggregate((a, b) => a + b);
            expect(result).to.be.equal(3);
        });
        test("should return 6", async () => {
            const result = await new AsyncEnumerable(arrayProducer([4, 8, 8, 3, 9, 0, 7, 8, 2])).aggregate((total, next) => next % 2 === 0 ? total + 1 : total, 0);
            expect(result).to.be.equal(6);
        });
        test("should return 10", async () => {
            const result = await new AsyncEnumerable(arrayProducer([1, 2, 3, 4])).aggregate((total, next) => total += next);
            expect(result).to.be.equal(10);
        });
        test("should throw error if enumerable is empty and no seed is provided", async () => {
            const result = new AsyncEnumerable(arrayProducer([] as number[])).aggregate((a, b) => a + b);
            await expect(result).rejects.toThrowError(new NoElementsException());
        });
        test("should return see if enumerable is empty and seed is provided", async () => {
            const result = await new AsyncEnumerable(arrayProducer([])).aggregate((a, b) => a + b, 10);
            expect(result).to.be.equal(10);
        });
        test("should use provided result selector and return 100", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4]));
            const result = await enumerable.aggregate((total, next) => total += next, 0, (total) => Math.pow(total, 2));
            expect(result).to.be.equal(100);
        })
    });

    describe("#aggregateBy()", () => {
        test("should aggregate into (name, sum of ages) list", async () => {
            const result = await new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Noemi2, Person.Kaori]
            )).aggregateBy(p => p.name, () => 0, (total, p) => total + p.age)
                .select(p => [p.key, p.value]).toArray();
            expect(result).to.deep.equal([
                ["Alice", 23], ["Noemi", 72], ["Kaori", 10]
            ]);
        });
        test("should use provided key comparer", async () => {
            const LittleKaori = new Person("kaori", "Furuya", 6);
            const result1 = await new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Noemi2, Person.Kaori, LittleKaori]
            )).aggregateBy(p => p.name, () => 0, (total, p) => total + p.age)
                .toObject(p => p.key, p => p.value);
            const result2 = await new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Noemi2, Person.Kaori, LittleKaori]
            )).aggregateBy(p => p.name, () => 0, (total, p) => total + p.age, (n1, n2) => n1.toLowerCase() === n2.toLowerCase())
                .toObject(p => p.key, p => p.value);
            expect(result1).to.deep.equal({ "Alice": 23, "Noemi": 72, "Kaori": 10, "kaori": 6 });
            expect(result2).to.deep.equal({ "Alice": 23, "Noemi": 72, "Kaori": 16 });
        });
        test("should work with non-function seed", async () => {
            const result = await new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Noemi2, Person.Kaori]
            )).aggregateBy(p => p.name, 0, (total, p) => total + p.age).toObject(p => p.key, p => p.value);
            expect(result).to.deep.equal({ "Alice": 23, "Noemi": 72, "Kaori": 10 });
        });
    });

    describe("#all()", () => {
        test("should return true if all elements satisfy the predicate", {timeout: 5000}, async () => {
            const result = await new AsyncEnumerable(numberProducer(10)).all(n => n < 10);
            expect(result).to.eq(true);
        });
        test("should return false if any element does not satisfy the predicate", {timeout: 5000}, async () => {
            const result = await new AsyncEnumerable(numberProducer(10)).all(n => n % 2 === 1);
            expect(result).to.eq(false);
        });
    });

    describe("#any()", () => {
        test("should return true if any element in the enumerable matches the predicate", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.any(n => n % 2 === 0);
            expect(result).to.eq(true);
        });
        test("should return false if no element in the enumerable matches the predicate", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.any(n => n > 10);
            expect(result).to.eq(false);
        });
        test("should return false if the enumerable is empty", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            const result = await enumerable.any(n => n > 10);
            expect(result).to.eq(false);
        });
        test("should return true if the enumerable is not empty and the predicate is not provided", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.any();
            expect(result).to.eq(true);
        });
    });

    describe("#append()", () => {
        test("should append an element to the end of the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.append(10).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });
    });

    describe("#average()", () => {
        test("should return the average of the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.average(n => n);
            expect(result).to.eq(4.5);
        });
        test("should return the average of the enumerable #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.average();
            expect(result).to.eq(4.5);
        });
        test("should throw an error if the enumerable is empty", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.average()).rejects.toThrowError(new NoElementsException());
        });
        test("should convert values to number", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numericalStringProducer(10));
            const result = await enumerable.average(n => parseInt(n, 10));
            expect(result).to.eq(4.5);
        });
    });

    describe("#cast()", () => {
        test("should cast the enumerable to the specified type", {timeout: 5000}, async () => {
            const enumerable1 = new AsyncEnumerable(mixedProducer([1, 2, 3, "4", "5", "6", 7, 8, 9, "10"]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([1, 2, 3, "4", "5", "6", 7, 8, 9, "10"]));
            const numbers = await enumerable1.where(i => typeof i === "number").cast<number>().toArray();
            const strings = await enumerable2.where(i => typeof i === "string").cast<string>().toArray();
            expect(numbers).to.deep.equal([1, 2, 3, 7, 8, 9]);
            expect(strings).to.deep.equal(["4", "5", "6", "10"]);
        });
    });

    describe("#chunk()", () => {
        test("should chunk the enumerable into a collection of arrays", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const resultEnum = await enumerable.chunk(3).toArray();
            const result = resultEnum.map(e => e.toArray());
            expect(result).to.deep.equal([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
        });
        test("should chunk the enumerable into a collection of arrays with a custom chunk size", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const resultEnum = await enumerable.chunk(2).toArray();
            const result = resultEnum.map(e => e.toArray());
            expect(result).to.deep.equal([[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]);
        });
        test("should throw an error if the chunk size is less than 1", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            expect(() => enumerable.chunk(0)).toThrow(new InvalidArgumentException("Invalid argument: size. Size must be greater than 0."));
        });
    });

    describe("#combinations()", () => {
        test("should return all combinations of the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(4));
            const result = await enumerable.combinations(2).select(c => c.toArray()).toArray();
            console.log(result)
            expect(result).to.deep.equal([
                [0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3]
            ]);
        });
        test("should return all combinations of the enumerable #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(4));
            const result = await enumerable.combinations(3).select(c => c.toArray()).toArray();
            expect(result).to.deep.equal([
                [0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]
            ]);
        });
        test("should return all combinations of the enumerable #3", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(4));
            const result = await enumerable.combinations(4).select(c => c.toArray()).toArray();
            expect(result).to.deep.equal([
                [0, 1, 2, 3]
            ]);
        });
        test("should return all combinations of the enumerable #4", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(4));
            const result = await enumerable.combinations(1).select(c => c.toArray()).toArray();
            expect(result).to.deep.equal([
                [0], [1], [2], [3]
            ]);
        });
        test("should return all combinations of the enumerable #5", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(4));
            const result = await enumerable.combinations(0).select(c => c.toArray()).toArray();
            expect(result).to.deep.equal([[]]);
        });
    });

    describe("#concat()", () => {
        test("should concatenate two enumerables", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.concat(new AsyncEnumerable(numberProducer(10))).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe("#contains()", () => {
        test("should return true if the enumerable contains the element", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.contains(5);
            expect(result).to.eq(true);
        });
        test("should return false if the enumerable does not contain the element", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.contains(10);
            expect(result).to.eq(false);
        });
        test("should use provided equality comparer", async () => {
            const personList = [Person.Alice, Person.Noemi, Person.Kaori];
            expect((await new AsyncEnumerable(personProducer(personList)).contains(Person.Alice, (p1, p2) => p1.age === p2.age))).to.eq(true);
            expect((await new AsyncEnumerable(personProducer(personList)).contains(Person.Noemi, (p1, p2) => p1.age === p2.age))).to.eq(true);
            expect((await new AsyncEnumerable(personProducer(personList)).contains(Person.Noemi2, (p1, p2) => p1.age === p2.age))).to.eq(false);
        });
    });

    describe("#count()", () => {
        test("should return the number of elements in the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.count();
            expect(result).to.eq(10);
        });
        test("should return the number of elements in the enumerable that satisfy the predicate", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.count(n => n % 2 === 0);
            expect(result).to.eq(5);
        });
    });

    describe("#countBy()", () => {
        test("should return a key value pair list of names and their counts", {timeout: 5000}, async () => {
            const personList = [Person.Rui, Person.Setsuna, Person.Suzuha, Person.Suzuha2];
            const enumerable = new AsyncEnumerable(personProducer(personList))
            const result1 = enumerable.countBy(p => p.name);
            const suzuhaCount = (await result1.first(p => p.key === "Suzuha")).value;
            expect(suzuhaCount).to.eq(2);
        });
        test("should return a key value pair list of names and their counts with comparer", {timeout: 5000}, async () => {
            const LittleSuzuha = new Person("suzuha", "Amane", 16);
            const personList = [Person.Rui, Person.Setsuna, Person.Suzuha, Person.Suzuha2, LittleSuzuha];
            const enumerable = new AsyncEnumerable(personProducer(personList))
            const result1 = enumerable.countBy(p => p.name, (n1, n2) => n1.toLowerCase().localeCompare(n2.toLowerCase()) === 0);
            const suzuhaCountBig = (await result1.first(p => p.key === "Suzuha")).value;
            expect(suzuhaCountBig).to.eq(3);
        });
    });

    describe("#cycle()", () => {
        test("should cycle through the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(3));
            const result = await enumerable.cycle(1).toArray();
            console.log(result)
            expect(result).to.deep.equal([0, 1, 2]);
        });
        test("should cycle through the enumerable #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(3));
            const result = await enumerable.cycle(2).toArray();
            expect(result).to.deep.equal([0, 1, 2, 0, 1, 2]);
        });
        test("should return an empty enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(3));
            const result = await enumerable.cycle(0).toArray();
            expect(result).to.deep.equal([]);
        });
        test("should throw an error if source is empty", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.cycle().toArray()).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#defaultIfEmpty()", () => {
        test("should return the enumerable if it is not empty", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.defaultIfEmpty(10).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return the default value if the enumerable is empty", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            const result = await enumerable.defaultIfEmpty(10).toArray();
            expect(result).to.deep.equal([10]);
        });
    });

    describe("#distinct()", () => {
        test("should return the distinct elements in the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.distinct().toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return the distinct elements in the enumerable using a custom equality comparer", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Mel, Person.Noemi, Person.Noemi2]
            ));
            const result = await enumerable.distinct((p1, p2) => p1.age === p2.age).toArray();
            expect(result).to.deep.equal([Person.Mel, Person.Noemi, Person.Noemi2]);
        });
        test("should return the distinct elements in the enumerable using a custom equality comparer #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Mel, Person.Noemi, Person.Noemi2]
            ));
            const result = await enumerable.distinct((p1, p2) => p1.name === p2.name).toArray();
            expect(result).to.deep.equal([Person.Mel, Person.Noemi]);
        });
    });

    describe("#distinctBy()", () => {
        test("should return the distinct elements in the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(mixedProducer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1]));
            const result = await enumerable.distinctBy(n => n).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return the distinct elements in the enumerable using a custom equality comparer", {timeout: 5000}, async () => {
            const LittleMel = new Person("mel", "Amane", 9);
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Mel, Person.Noemi, Person.Noemi2, LittleMel]
            ));
            const result = await enumerable.distinctBy(p => p.name, (n1, n2) => n1.toLowerCase() === n2.toLowerCase()).toArray();
            expect(result).to.deep.equal([Person.Mel, Person.Noemi]);
        });
    });

    describe("#elementAt()", () => {
        test("should return the element at the specified index", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.elementAt(5);
            expect(result).to.eq(5);
        });
        test("should throw an error if the index is out of bounds", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            await expect(enumerable.elementAt(10)).rejects.toThrowError(new IndexOutOfBoundsException(10));
        });
        test("should throw an error if the index is out of bounds #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            await expect(enumerable.elementAt(-1)).rejects.toThrowError(new IndexOutOfBoundsException(-1));
        });
    });

    describe("#elementAtOrDefault()", () => {
        test("should return the element at the specified index", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.elementAtOrDefault(5);
            expect(result).to.eq(5);
        });
        test("should return the default value if the index is out of bounds", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.elementAtOrDefault(10);
            expect(result).to.eq(null);
        });
        test("should return the default value if the index is out of bounds #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.elementAtOrDefault(-1);
            expect(result).to.eq(null);
        });
    });

    describe("#empty()", () => {
        test("should return an empty enumerable", {timeout: 5000}, async () => {
            const enumerable = AsyncEnumerable.empty();
            const result = await enumerable.toArray();
            expect(result).to.deep.equal([]);
        });
    });

    describe("#except()", () => {
        test("should return the elements in the enumerable that are not in the other enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.except(new AsyncEnumerable(numberProducer(5))).toArray();
            expect(result).to.deep.equal([5, 6, 7, 8, 9]);
        });
        test("should only have 'Alice', 'Noemi' and 'Senna' in the result", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Mel, Person.Senna, Person.Lenka, Person.Jane]
            ));
            const enumerable2 = new AsyncEnumerable(personProducer(
                [Person.Mel, Person.Lenka, Person.Jane, Person.Noemi2]
            ));
            const result = await enumerable1.except(enumerable2).toArray();
            expect(result).to.deep.equal([Person.Alice, Person.Noemi, Person.Senna]);
        });
        test("should only have 'Alice' and 'Senna' in the result", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Mel, Person.Senna, Person.Lenka, Person.Jane]
            ));
            const enumerable2 = new AsyncEnumerable(personProducer(
                [Person.Mel, Person.Lenka, Person.Jane, Person.Noemi2]
            ));
            const result = await enumerable1.except(enumerable2, (p1, p2) => p1.name === p2.name).toArray();
            expect(result).to.deep.equal([Person.Alice, Person.Senna]);
        });
        test("should return a set of people unique to first enumerable", {timeout: 5000}, async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 100).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const enumerable2 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 50).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const result = await enumerable1.except(enumerable2, (p1, p2) => p1.age === p2.age).toArray();
            const ageCount = Enumerable.from(result).count(p => p.age <= 50);
            expect(ageCount).to.eq(0);
        });
        test("should use order comparator to return a set of people unique to first enumerable", {timeout: 5000}, async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 100).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const enumerable2 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 50).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const result = await enumerable1.except(enumerable2, (p1, p2) => p1.age - p2.age).toArray();
            const ageCount = Enumerable.from(result).count(p => p.age <= 50);
            expect(ageCount).to.eq(0);
        });
    });

    describe("#exceptBy()", () => {
        test("should only have 'Alice' in the result", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, Person.Hanna]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Julia, Person.Hanna2]));
            const result = enumerable1.exceptBy(enumerable2, p => p.name);
            const resultArray = await result.toArray();
            expect(resultArray).to.deep.equal([Person.Alice]);
        });
        test("should return all elements if second enumerable is empty", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, Person.Hanna]));
            const enumerable2 = new AsyncEnumerable(personProducer([]));
            const result = enumerable1.exceptBy(enumerable2, p => p.surname);
            const resultArray = await result.toArray();
            expect(resultArray).to.deep.equal([Person.Alice, Person.Hanna]);
        });
        test("should be empty if first enumerable is empty", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Alice, Person.Hanna]));
            const result = await enumerable1.exceptBy(enumerable2, p => p.surname).toArray();
            expect(result).to.be.empty;
        });
        test("should use provided comparator", async () => {
            const LittleAlice = new Person("alice", "Rivermist", 9);
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, LittleAlice, Person.Hanna]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Eliza, Person.Hanna2]));
            const result = enumerable1.exceptBy(enumerable2, p => p.name, (n1, n2) => n1.toLowerCase() === n2.toLowerCase());
            const resultArray = await result.toArray();
            expect(resultArray).to.deep.equal([Person.Alice]);
        });
        test("should return elements with keys not in second enumerable", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([
                Person.Alice, Person.Noemi, Person.Kaori, Person.Hanna
            ]));
            const enumerable2 = new AsyncEnumerable(personProducer([
                Person.Bella, Person.Emily, Person.Hanna2, Person.Julia, Person.Vanessa
            ]));
            const result = await enumerable1.exceptBy(enumerable2, p => p.age).toArray();
            expect(result).to.deep.equal([Person.Alice, Person.Noemi, Person.Kaori]);
        });
    });

    describe("#first()", () => {
        test("should return the first element of the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.first();
            expect(result).to.eq(0);
        });
        test("should return the first element of the enumerable #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.prepend(-99).first();
            expect(result).to.eq(-99);
        });
        test("should return the first element that satisfies the predicate", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.prepend(-99).skip(2).first(n => n % 5 === 0);
            expect(result).to.eq(5);
        });
        test("should throw an error if the enumerable is empty", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.first()).rejects.toThrowError(new NoElementsException());
        });
        test("should throw an error if no elements satisfy the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            await expect(enumerable.first(n => n > 10)).rejects.toThrowError(new NoMatchingElementException());
        });
        test("should not throw error if source only contains null or undefined", async () => {
            const enumerable = new AsyncEnumerable(mixedProducer([undefined, null]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([null, undefined]));
            const result = await enumerable.first();
            const result2 = await enumerable2.first();
            expect(result).to.eq(undefined);
            expect(result2).to.eq(null);
        });
    });

    describe("#firstOrDefault()", () => {
        test("should return the first element of the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.firstOrDefault();
            expect(result).to.eq(0);
        });
        test("should return the first element of the enumerable #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.prepend(-99).firstOrDefault();
            expect(result).to.eq(-99);
        });
        test("should return the first element that satisfies the predicate", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.prepend(-99).skip(2).firstOrDefault(n => n % 5 === 0);
            expect(result).to.eq(5);
        });
        test("should return the default value if the enumerable is empty", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            const result = await enumerable.firstOrDefault(n => n > 10);
            expect(result).to.be.null;
        });
        test("should return the default value if no elements satisfy the predicate", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.firstOrDefault(n => n > 10);
            expect(result).to.be.null;
        });
        test("should not default to null if the first element is undefined", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(mixedProducer([undefined, null]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([null, undefined]));
            const result = await enumerable.firstOrDefault();
            const result2 = await enumerable2.firstOrDefault();
            expect(result).to.eq(undefined);
            expect(result2).to.eq(null);
        });
    });

    describe("#forEach()", () => {
        test("should iterate over the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result: number[] = [];
            await enumerable.forEach(n => {
                result.push(n);
            });
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should iterate over the enumerable #2", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result: number[] = [];
            await enumerable.where(n => n % 2 === 0).skip(1).forEach(n => {
                result.push(n);
            });
            expect(result).to.deep.equal([2, 4, 6, 8]);
        });
    });

    describe("#from()", () => {
        test("should create an enumerable from an array", async () => {
            const enumerable = AsyncEnumerable.from(arrayProducer([1, 2, 3]));
            const result = await enumerable.toArray();
            expect(result).to.deep.equal([1, 2, 3]);
        });
    });

    describe("#groupBy()", () => {
        test("should group the enumerable by the key selector", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.groupBy(n => n % 2 === 0).toArray();
            expect(result.length).to.eq(2);
            expect(result[0].key).to.be.true;
            expect(result[1].key).to.be.false;
            expect(result[0].source.toArray()).to.deep.equal([0, 2, 4, 6, 8]);
            expect(result[1].source.toArray()).to.deep.equal([1, 3, 5, 7, 9]);
        });
        test("should group people by age", async () => {
            const enumerable = new AsyncEnumerable(personProducer([
                Person.Alice, Person.Mel, Person.Senna, Person.Lenka, Person.Jane, Person.Kaori, Person.Reina
            ]));
            const group = await enumerable.groupBy(p => p.age).toArray();
            const ages: number[] = [];
            const groupedAges: Record<number, number[]> = {};
            for (const ageGroup of group) {
                ages.push(ageGroup.key);
                groupedAges[ageGroup.key] ??= [];
                for (const person of ageGroup.source) {
                    groupedAges[ageGroup.key].push(person.age);
                }
            }
            expect(ages).to.have.all.members([9, 10, 16, 23]);
            for (const g in groupedAges) {
                const sameAges = groupedAges[g];
                const expectedAges = new Array(sameAges.length).fill(sameAges[0]);
                expect(sameAges).to.deep.equal(expectedAges);
            }
        });
    });

    describe("#groupJoin()", () => {
        const schools: School[] = [
            new School(1, "Elementary School"),
            new School(2, "High School"),
            new School(3, "University"),
            new School(5, "Academy")
        ];
        const students: Student[] = [
            new Student(100, "Desireé", "Moretti", 3),
            new Student(200, "Apolline", "Bruyere", 2),
            new Student(300, "Giselle", "García", 2),
            new Student(400, "Priscilla", "Necci", 1),
            new Student(500, "Lucrezia", "Volpe", 4)
        ];
        const schoolProducer = async function* (): AsyncIterableIterator<School> {
            for (const school of schools) {
                await suspend(100);
                yield school;
            }
        };
        const studentProducer = async function* (): AsyncIterableIterator<Student> {
            for (const student of students) {
                await suspend(100);
                yield student;
            }
        };
        test("should join and group by school id", {timeout: 5000}, async () => {
            const schoolsEnumerable = new AsyncEnumerable(schoolProducer());
            const studentsEnumerable = new AsyncEnumerable(studentProducer());
            const joinedData = schoolsEnumerable.groupJoin(studentsEnumerable, sc => sc.id, st => st.schoolId,
                (school, students) => {
                    return new SchoolStudents(school.id, students?.toList() ?? new List<Student>());
                }).orderByDescending(ss => ss.students.size());
            const finalData = await joinedData.toArray();
            const finalOutput: string[] = [];
            for (const sd of finalData) {
                const school = schools.find(s => s.id === sd.schoolId);
                finalOutput.push(`Students of ${school?.name}: `);
                for (const student of sd.students) {
                    finalOutput.push(`[${student.id}] :: ${student.name} ${student.surname}`);
                }
            }
            const expectedOutput: string[] = [
                "Students of High School: ",
                "[200] :: Apolline Bruyere",
                "[300] :: Giselle García",
                "Students of Elementary School: ",
                "[400] :: Priscilla Necci",
                "Students of University: ",
                "[100] :: Desireé Moretti",
                "Students of Academy: "
            ];
            expect(finalOutput).to.deep.equal(expectedOutput);
        });
    });

    describe("#index()", () => {
        test("should return a list of tuples with index and element", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(stringProducer(["a", "b", "c", "d"]));
            const result = await enumerable.index().toArray();
            expect(result).to.deep.equal([
                [0, "a"],
                [1, "b"],
                [2, "c"],
                [3, "d"]
            ]);
        });
    });

    describe("#intersect()", () => {
        test("should return the intersection of two enumerables", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10, 10, 0));
            const enumerable2 = new AsyncEnumerable(numberProducer(15, 10, 5));
            const result = await enumerable.intersect(enumerable2).toArray();
            expect(result).to.deep.equal([5, 6, 7, 8, 9]);
        });
        test("should only have 'Mel', 'Lenka' and 'Jane' in the result", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Mel, Person.Senna, Person.Lenka, Person.Jane]
            ));
            const enumerable2 = new AsyncEnumerable(personProducer(
                [Person.Mel, Person.Lenka, Person.Jane, Person.Noemi2]
            ));
            const result = await enumerable1.intersect(enumerable2).toArray();
            expect(result).to.deep.equal([Person.Mel, Person.Lenka, Person.Jane]);
        });
        test("should only have 'Alice' and 'Senna' in the result", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Noemi, Person.Mel, Person.Senna, Person.Lenka, Person.Jane]
            ));
            const enumerable2 = new AsyncEnumerable(personProducer(
                [Person.Mel, Person.Lenka, Person.Jane, Person.Noemi2]
            ));
            const result = await enumerable1.intersect(enumerable2, (p1, p2) => p1.name === p2.name).toArray();
            expect(result).to.deep.equal([Person.Noemi, Person.Mel, Person.Lenka, Person.Jane]);
        });
        test("should return a set of people shared by both enumerables", {timeout: 5000}, async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 100).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const enumerable2 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 50).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const result = await enumerable1.intersect(enumerable2, (p1, p2) => p1.age === p2.age).toArray();
            const ageCount = Enumerable.from(result).count(p => p.age > 50);
            expect(ageCount).to.eq(0);
        });
        test("should use order comparator to return a set of people shared by both enumerables", {timeout: 5000}, async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 100).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const enumerable2 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 50).select(n => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), n + 1)).toArray(),
                1));
            const result = await enumerable1.intersect(enumerable2, (p1, p2) => p1.age - p2.age).toArray();
            const ageCount = Enumerable.from(result).count(p => p.age > 50);
            expect(ageCount).to.eq(0);
        });
    });

    describe("#intersectBy()", () => {
        test("should only have 'Hanna'", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, Person.Hanna]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Julia, Person.Hanna2]));
            const result = enumerable1.intersectBy(enumerable2, p => p.name);
            const resultArray = await result.toArray();
            expect(resultArray).to.deep.equal([Person.Hanna]);
        });
        test("should be empty", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, Person.Hanna]));
            const enumerable2 = new AsyncEnumerable(personProducer([]));
            const result = enumerable1.intersectBy(enumerable2, p => p.surname);
            const resultArray = await result.toArray();
            expect(resultArray).to.deep.equal([]);
        });
        test("should be empty if first enumerable is empty", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Alice, Person.Hanna]));
            const result = await enumerable1.intersectBy(enumerable2, p => p.surname).toArray();
            expect(result).to.be.empty;
        });
        test("should use provided comparator", async () => {
            const LittleHanna = new Person("hanna", "Amane", 9);
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, LittleHanna]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Eliza, Person.Hanna2]));
            const result = enumerable1.intersectBy(enumerable2, p => p.name, (n1, n2) => n1.toLowerCase() === n2.toLowerCase());
            const resultArray = await result.toArray();
            expect(resultArray).to.deep.equal([LittleHanna]);
        });
    });

    describe("#intersperse()", () => {
        test("should intersperse the enumerable with the specified element", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.intersperse(99).toArray();
            expect(result).to.deep.equal([0, 99, 1, 99, 2, 99, 3, 99, 4, 99, 5, 99, 6, 99, 7, 99, 8, 99, 9]);
        });
        test("should return empty enumerable if source is empty", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            const result = await enumerable.intersperse(99).toArray();
            expect(result).to.deep.equal([]);
        });
    });

    describe("#join()", () => {
        const schools: School[] = [
            new School(1, "Elementary School"),
            new School(2, "High School"),
            new School(3, "University"),
            new School(5, "Academy")
        ];
        const students: Student[] = [
            new Student(100, "Desireé", "Moretti", 3),
            new Student(200, "Apolline", "Bruyere", 2),
            new Student(300, "Giselle", "García", 2),
            new Student(400, "Priscilla", "Necci", 1),
            new Student(500, "Lucrezia", "Volpe", 4)
        ];
        const schoolProducer = async function* (): AsyncIterableIterator<School> {
            for (const school of schools) {
                await suspend(100);
                yield school;
            }
        };
        const studentProducer = async function* (): AsyncIterableIterator<Student> {
            for (const student of students) {
                await suspend(100);
                yield student;
            }
        };
        test("should join students and schools", async () => {
            const schoolsEnumerable = new AsyncEnumerable(schoolProducer());
            const studentsEnumerable = new AsyncEnumerable(studentProducer());
            const joinedData = await studentsEnumerable.join(schoolsEnumerable, st => st.schoolId, sc => sc.id, (student, school) => {
                return `${student.name} ${student.surname} :: ${school?.name}`;
            }).toArray();
            const expectedOutput = [
                "Desireé Moretti :: University",
                "Apolline Bruyere :: High School",
                "Giselle García :: High School",
                "Priscilla Necci :: Elementary School"
                // "Lucrezia Volpe :: Academy"
            ];
            expect(joinedData.length).to.eq(4);
            expect(joinedData).to.deep.equal(expectedOutput);
        });
        test("should set null for school if left join is true", async () => {
            const schoolsEnumerable = new AsyncEnumerable(schoolProducer());
            const studentsEnumerable = new AsyncEnumerable(studentProducer());
            const joinedData = await studentsEnumerable.join(schoolsEnumerable, st => st.schoolId, sc => sc.id, (student, school) => {
                return [student, school];
            }, (stId, scId) => stId === scId, true).toArray();
            for (const [student, school] of joinedData) {
                if (student?.id === 500) {
                    expect(school).to.be.null;
                } else {
                    expect(school).to.not.be.null;
                }
            }
        });
        test("should join key-value pairs", async () => {
            const pairs1 = [
                new Pair(1, "A"),
                new Pair(2, "B"),
                new Pair(3, "C")
            ];
            const pairs2 = [
                new Pair(1, "a1"),
                new Pair(1, "a2"),
                new Pair(1, "a3"),
                new Pair(2, "b1"),
                new Pair(2, "b2")
            ];
            const pairProducer1 = async function* (): AsyncIterableIterator<Pair<number, string>> {
                for (const pair of pairs1) {
                    await suspend(100);
                    yield pair;
                }
            };
            const pairProducer2 = async function* (): AsyncIterableIterator<Pair<number, string>> {
                for (const pair of pairs2) {
                    await suspend(100);
                    yield pair;
                }
            };
            const pairsEnumerable1 = new AsyncEnumerable(pairProducer1());
            const pairsEnumerable2 = new AsyncEnumerable(pairProducer2());
            const joinedData = await pairsEnumerable1.join(pairsEnumerable2, p1 => p1.key, p2 => p2.key, (p1, p2) => [p1.value, p2?.value]).toArray();
            const expectedOutput = [
                ["A", "a1"],
                ["A", "a2"],
                ["A", "a3"],
                ["B", "b1"],
                ["B", "b2"]
            ];
            expect(joinedData.length).to.eq(5);
            expect(joinedData).to.deep.equal(expectedOutput);
        });
    });

    describe("#last()", () => {
        test("should return the last element of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const last = await enumerable.last();
            expect(last).to.eq(9);
        });
        test("should return the last element of the enumerable that satisfies the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const last = await enumerable.last(n => n % 2 === 0);
            expect(last).to.eq(8);
        });
        test("should throw error if no element satisfies the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            await expect(enumerable.last(n => n > 10)).rejects.toThrowError(new NoMatchingElementException());
        });
        test("should throw error if no element is present", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.last()).rejects.toThrowError(new NoElementsException());
        });
        test("should not throw error if source only contains null or undefined", async () => {
            const enumerable = new AsyncEnumerable(mixedProducer([undefined, null]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([null, undefined]));
            const result = await enumerable.last();
            const result2 = await enumerable2.last();
            expect(result).to.eq(null);
            expect(result2).to.eq(undefined);
        });
    });

    describe("#lastOrDefault()", () => {
        test("should return the last element of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const last = await enumerable.lastOrDefault();
            expect(last).to.eq(9);
        });
        test("should return the last element of the enumerable that satisfies the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const last = await enumerable.lastOrDefault(n => n % 2 === 0);
            expect(last).to.eq(8);
        });
        test("should return null if no element satisfies the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            expect(await enumerable.lastOrDefault(n => n > 10)).to.be.null;
        });
        test("should return null if no element is present", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            expect(await enumerable.lastOrDefault()).to.be.null;
        });
        test("should not default to null if last element is undefined", async () => {
            const enumerable = new AsyncEnumerable(mixedProducer([null, undefined]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([undefined, null]));
            const result = await enumerable.lastOrDefault();
            const result2 = await enumerable2.lastOrDefault();
            expect(result).to.eq(undefined);
            expect(result2).to.eq(null);
        });
    });

    describe("#max()", () => {
        test("should return the maximum value of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const max = await enumerable.max();
            expect(max).to.eq(9);
        });
        test("should return the maximum value of the enumerable that satisfies the predicate", async () => {
            const enumerable = new AsyncEnumerable(personProducer([
                Person.Alice,
                Person.Olga,
                Person.Kaori,
                Person.Priscilla
            ]));
            const max = await enumerable.max(p => p.age);
            expect(max).to.eq(77);
        });
        test("should throw error if no element is present", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.max()).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#maxBy()", () => {
        test("should return the maximum value of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const max = await enumerable.maxBy(n => n);
            expect(max).to.eq(9);
        });
        test("should return the oldest person in the enumerable", async () => {
            const enumerable = new AsyncEnumerable(personProducer([
                Person.Alice,
                Person.Olga,
                Person.Kaori,
                Person.Priscilla
            ]));
            const max = await enumerable.maxBy(p => p.age);
            expect(max).to.eq(Person.Olga);
        });
        test("should throw error if no element is present", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.maxBy(n => n)).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#min()", () => {
        test("should return the minimum value of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const min = await enumerable.min();
            expect(min).to.eq(0);
        });
        test("should return the minimum value of the enumerable that satisfies the predicate", async () => {
            const enumerable = new AsyncEnumerable(personProducer([
                Person.Alice,
                Person.Olga,
                Person.Kaori,
                Person.Priscilla
            ]));
            const min = await enumerable.min(p => p.age);
            expect(min).to.eq(9);
        });
        test("should throw error if no element is present", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.min()).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#minBy()", () => {
        test("should return the minimum value of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const min = await enumerable.minBy(n => n);
            expect(min).to.eq(0);
        });
        test("should return the youngest person in the enumerable", async () => {
            const enumerable = new AsyncEnumerable(personProducer([
                Person.Alice,
                Person.Olga,
                Person.Kaori,
                Person.Priscilla
            ]));
            const min = await enumerable.minBy(p => p.age);
            expect(min).to.eq(Person.Priscilla);
        });
        test("should throw error if no element is present", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.minBy(n => n)).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#none()", () => {
        test("should return true if no elements satisfy the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.none(n => n > 10);
            expect(result).to.be.true;
        });
        test("should return false if any element satisfies the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.none(n => n % 2 === 0);
            expect(result).to.be.false;
        });
    });

    describe("#ofType()", () => {
        test("should return only the elements of the specified type", async () => {
            const enumerable1 = new AsyncEnumerable(mixedProducer([1, "a", 2, "b", 3, "c", BigInt(100)]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([1, "a", 2, "b", 3, "c", BigInt(100)]));
            const enumerable3 = new AsyncEnumerable(mixedProducer([1, "a", 2, "b", 3, "c", BigInt(100)]));
            const strings = await enumerable1.ofType("string").toArray();
            const numbers = await enumerable2.ofType(Number).toArray();
            const bigints = await enumerable3.ofType(BigInt).toArray();
            expect(strings).to.deep.equal(["a", "b", "c"]);
            expect(numbers).to.deep.equal([1, 2, 3]);
            expect(bigints).to.deep.equal([BigInt(100)]);
        });
    });

    describe("#orderBy()", () => {
        test("should sort the enumerable in ascending order", async () => {
            const enumerable = new AsyncEnumerable(personProducer([
                Person.Alice,
                Person.Olga,
                Person.Lucrezia,
                Person.Priscilla,
                Person.Reika
            ]));
            const sorted = await enumerable.orderBy(p => p.age).toArray();
            expect(sorted).to.deep.equal([Person.Priscilla, Person.Lucrezia, Person.Alice, Person.Reika, Person.Olga]);
        });

    });

    describe("#orderByDescending()", () => {
        test("should sort the enumerable in descending order", async () => {
            const enumerable = new AsyncEnumerable(personProducer([
                Person.Alice,
                Person.Olga,
                Person.Lucrezia,
                Person.Priscilla,
                Person.Reika
            ]));
            const sorted = await enumerable.orderByDescending(p => p.age).toArray();
            expect(sorted).to.deep.equal([Person.Olga, Person.Reika, Person.Alice, Person.Lucrezia, Person.Priscilla]);
        });
        test("should sort the enumerable in descending order", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const sorted = await enumerable.orderByDescending(n => n).toArray();
            expect(sorted).to.deep.equal([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
        });
    });

    describe("#pairwise()", () => {
        test("should return the pairwise elements of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(stringProducer(["a", "b", "c", "d", "e", "f"]));
            const result = await enumerable.pairwise((prev, curr) => [`->${prev}`, `${curr}<-`]).toArray();
            expect(result).to.deep.equal([["->a", "b<-"], ["->b", "c<-"], ["->c", "d<-"], ["->d", "e<-"], ["->e", "f<-"]]);
        });
        test("should return pairwise elements of the enumerable #2", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.pairwise((prev, curr) => [prev, curr]).toArray();
            expect(result).to.deep.equal([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]]);
        });
    });

    describe("#partition()", () => {
        test("should partition the enumerable into two enumerables", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const [even, odd] = await enumerable.partition(n => n % 2 === 0);
            expect(even.toArray()).to.deep.equal([0, 2, 4, 6, 8]);
            expect(odd.toArray()).to.deep.equal([1, 3, 5, 7, 9]);
        });
    });

    describe("#permutations()", () => {
        test("should return all permutations of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(3));
            const result = await enumerable.permutations().select(p => p.toArray()).toArray();
            expect(result).to.deep.equal([[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]);
        });
        test("should return all permutations that have the length of 2", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(3));
            const result = await enumerable.permutations(2).select(p => p.toArray()).toArray();
            expect(result).to.deep.equal([[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1]]);
        });
        test("should throw if size is less than 1", () => {
            const enumerable = new AsyncEnumerable(numberProducer(3));
            expect(() => enumerable.permutations(0).toArray()).toThrowError("Size must be greater than 0.");
        });
    });

    describe("#prepend()", () => {
        test("should prepend an element to the beginning of the enumerable", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.prepend(10).toArray();
            expect(result).to.deep.equal([10, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe("#product()", () => {
        test("should return the product of the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(11, 1, 1));
            const result = await enumerable.product();
            expect(result).to.eq(3628800);
        });
        test("should return the product of the enumerable #2", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(6, 1, 1));
            const result = await enumerable.product();
            expect(result).to.eq(120);
        });
        test("should throw error if source is empty", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.product()).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#range()", () => {
        test("should create an enumerable that contains a range of values", async () => {
            const enumerable = AsyncEnumerable.range(0, 10);
            expect(await enumerable.toArray()).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe("#repeat()", () => {
        test("should create an enumerable that repeats the value", async () => {
            const enumerable = AsyncEnumerable.repeat("a", 10);
            expect(await enumerable.toArray()).to.deep.equal(["a", "a", "a", "a", "a", "a", "a", "a", "a", "a"]);
        });
    });

    describe("#reverse()", () => {
        test("should reverse the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.reverse().toArray();
            expect(result).to.deep.equal([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
        });
    });

    describe("#scan()", () => {
        test("should scan the enumerable", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4]));
            const result = await enumerable.scan((prev, curr) => prev + curr).toArray();
            expect(result).to.deep.equal([1, 3, 6, 10]);
        });
        test("should create a list of increasing numbers starting with 2", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const result = await enumerable.scan((acc, n) => acc + n, 2).toArray();
            expect(result).to.deep.equal([3, 5, 8, 12, 17]);
        });
        test("should create a list of increasing numbers starting with 1", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 3, 12, 19, 33]));
            const result = await enumerable.scan((acc, n) => acc + n, 0).toArray();
            expect(result).to.deep.equal([1, 4, 16, 35, 68]);
        });
        test("should throw error if no element is present", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.scan((prev, curr) => prev + curr).toArray()).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#select()", () => {
        test("should map values to their squares", {timeout: 5000}, async () => {
            const numbers: number[] = [];
            const enumerable = new AsyncEnumerable(numberProducer(5, 100));
            for await (const num of enumerable.select(p => Math.pow(p, 2))) {
                numbers.push(num);
            }
            expect(numbers).to.deep.equal([0, 1, 4, 9, 16]);
        });
        test("should return an IEnumerable with elements [125, 729]", async () => {
            const result = await new AsyncEnumerable(arrayProducer([2, 5, 6, 9], 100))
                .where(n => n % 2 !== 0).select(n => Math.pow(n, 3)).toArray();
            expect(result.length).to.eq(2);
            expect(result[0]).to.eq(125);
            expect(result[1]).to.eq(729);
        });
        test("should have index as the second parameter", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(5));
            const result = await enumerable.select((n, i) => n + i).toArray();
            expect(result).to.deep.equal([0, 2, 4, 6, 8]);
        });
    });

    describe("#selectMany()", async () => {
        test("should return a flattened array of ages", async () => {
            const people: Person[] = [];
            Person.Viola.friendsArray = [Person.Rebecca];
            Person.Jisu.friendsArray = [Person.Alice, Person.Mel];
            Person.Vanessa.friendsArray = [Person.Viola, Person.Rebecca, Person.Jisu, Person.Alice];
            Person.Rebecca.friendsArray = [Person.Viola];
            people.push(Person.Viola);
            people.push(Person.Rebecca);
            people.push(Person.Jisu);
            people.push(Person.Vanessa);
            const enumerable = new AsyncEnumerable(personProducer(people));
            const friends = await enumerable.selectMany(p => p.friendsArray).select(p => p.age).toArray();
            expect(friends).to.deep.equal([17, 28, 23, 9, 28, 17, 14, 23]);
        });
    });

    describe("#sequenceEqual()", () => {
        test("should return true for two equal enumerables", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.sequenceEqual(new AsyncEnumerable(numberProducer(10)));
            expect(result).to.be.true;
        });
        test("should return true for two equal enumerables #2", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(5));
            const result = await enumerable.sequenceEqual(new AsyncEnumerable(numberProducer(10)).take(5));
            expect(result).to.be.true;
        });
        test("should return false for two unequal enumerables", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.sequenceEqual(new AsyncEnumerable(numberProducer(5)));
            expect(result).to.be.false;
        });
        test("should return false for two unequal enumerables #2", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(5));
            const result = await enumerable.sequenceEqual(new AsyncEnumerable(numberProducer(10)));
            expect(result).to.be.false;
        });
        test("should return false for two unequal enumerables #3", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(5));
            const result = await enumerable.sequenceEqual(new AsyncEnumerable(numberProducer(0)));
            expect(result).to.be.false;
        });
        test("should return false for two unequal enumerables #4", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([0]));
            const result = await enumerable.sequenceEqual(new AsyncEnumerable(arrayProducer([1])));
            expect(result).to.be.false;
        });
        test("should return true if both enumerables are empty", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([]));
            const result = await enumerable.sequenceEqual(new AsyncEnumerable(arrayProducer([])));
            expect(result).to.be.true;
        });
    });

    describe("shuffle()", () => {
        test("should shuffle the enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.shuffle().toArray();
            expect(result).to.not.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe("#single()", () => {
        test("should return the single element in the enumerable", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1]));
            const result = await enumerable.single();
            expect(result).to.eq(1);
        });
        test("should return the single element in the enumerable #2", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const result = await enumerable.single(n => n % 5 === 0);
            expect(result).to.eq(5);
        });
        test("should throw error when enumerable has more than one element and no predicate is provided", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2]));
            await expect(enumerable.single()).rejects.toThrowError(new MoreThanOneElementException());
        });
        test("should throw error if no element matches the predicate", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            await expect(enumerable.single(n => n > 5)).rejects.toThrowError(new NoMatchingElementException());
        });
        test("should throw if enumerable is empty", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([]));
            await expect(enumerable.single()).rejects.toThrowError(new NoElementsException());
        });
        test("should return person with name 'Alice'", async () => {
            const enumerable = new AsyncEnumerable(personProducer([Person.Alice, Person.Bella, Person.Suzuha]));
            const result = await enumerable.single(p => p.name === "Alice");
            expect(result).to.eq(Person.Alice);
        });
        test("should not throw error if source only contains null or undefined", async () => {
            const enumerable = new AsyncEnumerable(mixedProducer([undefined]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([null]));
            const result = await enumerable.single();
            const result2 = await enumerable2.single();
            expect(result).to.eq(undefined);
            expect(result2).to.eq(null);
        });
    });

    describe("#singleOrDefault()", () => {
        test("should return the single element in the enumerable", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1]));
            const result = await enumerable.singleOrDefault();
            expect(result).to.eq(1);
        });
        test("should return the single element in the enumerable #2", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const result = await enumerable.singleOrDefault(n => n % 5 === 0);
            expect(result).to.eq(5);
        });
        test("should return the default value", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const result = await enumerable.singleOrDefault(n => n % 6 === 0);
            expect(result).to.eq(null);
        });
        test("should return the default value if enumerable is empty", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([]));
            const result = await enumerable.singleOrDefault();
            expect(result).to.eq(null);
        });
        test("should throw error when enumerable has more than one element and no predicate is provided", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2]));
            await expect(enumerable.singleOrDefault()).rejects.toThrowError(new MoreThanOneElementException());
        });
        test("should throw error if more than one element", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 4]));
            await expect(enumerable.singleOrDefault(n => n === 4)).rejects.toThrowError(new MoreThanOneMatchingElementException());
        });
        test("should throw error if more than one element that matches the predicate", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4]));
            await expect(enumerable.singleOrDefault(n => n % 2 === 0)).rejects.toThrowError(new MoreThanOneMatchingElementException());
        });
        test("should not throw error if source only contains null or undefined", async () => {
            const enumerable = new AsyncEnumerable(mixedProducer([null]));
            const enumerable2 = new AsyncEnumerable(mixedProducer([undefined]));
            const result = await enumerable.singleOrDefault();
            const result2 = await enumerable2.singleOrDefault();
            expect(result).to.eq(null);
            expect(result2).to.eq(undefined);
        });
    });

    describe("#skip()", () => {
        test("should skip the first n elements", {timeout: 5000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skip(5).toArray();
            expect(result).to.deep.equal([5, 6, 7, 8, 9]);
        });
        test("should return empty enumerable if enumerable contains fewer than skipped elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skip(15).toArray();
            expect(result).to.deep.equal([]);
        });
        test("should return all elements if count is less than zero", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skip(-1).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return all elements if count is zero", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skip(0).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe("#skipLast()", () => {
        test("should skip the last n elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skipLast(5).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4]);
        });
        test("should return empty enumerable if enumerable contains fewer than skipped elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skipLast(15).toArray();
            expect(result).to.deep.equal([]);
        });
        test("should return all elements if count is less than zero", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skipLast(-1).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return all elements if count is zero", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skipLast(0).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe("#skipWhile()", () => {
        test("should skip elements while predicate is true", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skipWhile(n => n < 5).toArray();
            expect(result).to.deep.equal([5, 6, 7, 8, 9]);
        });
        test("should return empty enumerable if predicate is true for all elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.skipWhile(n => n < 15).toArray();
            expect(result).to.deep.equal([]);
        });
    });

    describe("#span()", () => {
        test("should return the first n elements that satisfy the predicate", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.span(n => n < 5)
            expect(result[0].toArray()).to.deep.equal([0, 1, 2, 3, 4]);
            expect(result[1].toArray()).to.deep.equal([5, 6, 7, 8, 9]);
        });
        test("should return all elements if predicate is true for all elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.span(n => n < 15)
            expect(result[0].toArray()).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(result[1].toArray()).to.deep.equal([]);
        });
        test("should return an empty enumerable if predicate is false for all elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.span(n => n < 0);
            expect(result[0].toArray()).to.deep.equal([]);
            expect(result[1].toArray()).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return an empty enumerable if source is empty", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            const result = await enumerable.span(n => n < 0);
            expect(result[0].toArray()).to.deep.equal([]);
            expect(result[1].toArray()).to.deep.equal([]);
        });
    });

    describe("#step()", () => {
        test("should return an enumerable with elements [0, 2, 4, 6, 8]", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.step(2).toArray();
            expect(result).to.deep.equal([0, 2, 4, 6, 8]);
        });
        test("should return an enumerable with elements [0, 3, 6, 9]", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.step(3).toArray();
            expect(result).to.deep.equal([0, 3, 6, 9]);
        });
        test("should return an enumerable with only the first element", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.step(10).toArray();
            expect(result).to.deep.equal([0]);
        });
        test("should return an enumerable with only the first element #2", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.step(1071).toArray();
            expect(result).to.deep.equal([0]);
        });
        test("should throw error if step is less than 1", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            expect(() => enumerable.step(0)).toThrowError("Step must be greater than 0.");
        });
    });

    describe("#sum()", () => {
        test("should return the sum of all elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.sum();
            expect(result).to.eq(45);
        });
        test("should return the sum of all elements #2", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.sum(n => n * 2);
            expect(result).to.eq(90);
        });
        test("should return sum of people's ages", async () => {
            const enumerable = new AsyncEnumerable(personProducer([Person.Alice, Person.Bella, Person.Suzuha]));
            const result = await enumerable.sum(p => p.age);
            expect(result).to.eq(Person.Alice.age + Person.Bella.age + Person.Suzuha.age);
        });
        test("should return 0 for empty enumerable", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(0));
            await expect(enumerable.sum()).rejects.toThrowError(new NoElementsException());
        });
    });

    describe("#take()", () => {
        test("should take the first n elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.take(5).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4]);
        });
        test("should return all elements if enumerable contains fewer than taken elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.take(15).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    describe("#takeLast()", () => {
        test("should take the last n elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.takeLast(5).toArray();
            expect(result).to.deep.equal([5, 6, 7, 8, 9]);
        });
        test("should return all elements if enumerable contains fewer than taken elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.takeLast(15).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return an empty enumerable if count is not positive", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.takeLast(0).toArray();
            expect(result).to.deep.equal([]);
        });
    });

    describe("#takeWhile()", () => {
        test("should take elements while predicate is true", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.takeWhile(n => n < 5).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4]);
        });
        test("should return all elements if predicate is true for all elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.takeWhile(n => n < 15).toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
        test("should return an empty enumerable if predicate is false for all elements", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(10));
            const result = await enumerable.takeWhile(n => n < 0).toArray();
            expect(result).to.deep.equal([]);
        });
    });

    describe("#thenBy()", () => {
        test("should order people by age [asc] then by name[asc]", async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Lenka, Person.Jane, Person.Jisu, Person.Kaori, Person.Mel, Person.Rebecca, Person.Reina, Person.Senna, Person.Vanessa, Person.Viola]
            ));
            const orderedPeople = enumerable.orderBy(p => p.age, (a1, a2) => a1 - a2).thenBy(p => p.name);
            const orderedPeopleNames = orderedPeople.select(p => p.name);
            const expectedNames = ["Mel", "Kaori", "Senna", "Jisu", "Jane", "Lenka", "Rebecca", "Vanessa", "Alice", "Reina", "Viola"];
            expect(await orderedPeopleNames.toArray()).to.deep.equal(expectedNames);
        });
        test("should order people by age [asc] then by name[asc] then by surname[asc]", async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Bella, Person.Amy, Person.Emily, Person.Eliza, Person.Hanna, Person.Hanna2,
                    Person.Suzuha3, Person.Julia, Person.Lucrezia, Person.Megan, Person.Noemi, Person.Olga, Person.Priscilla, Person.Reika, Person.Suzuha, Person.Suzuha2, Person.Noemi2]
            ));
            const orderedPeople = enumerable.orderBy(p => p.age)
                .thenBy(p => p.name, (n1, n2) => n1.localeCompare(n2))
                .thenBy(p => p.surname);
            const expectedOrder: string[] = [
                "[9] :: Priscilla Necci",
                "[19] :: Eliza Jackson",
                "[19] :: Hanna Jackson",
                "[20] :: Hanna Jackson",
                "[21] :: Bella Rivera",
                "[21] :: Lucrezia Volpe",
                "[22] :: Suzuha Mizuki",
                "[22] :: Suzuha Suzuki",
                "[25] :: Emily Redridge",
                "[26] :: Suzuha Mizuki",
                "[29] :: Noemi Waterfox",
                "[32] :: Amy Rivera",
                "[37] :: Reika Kurohana",
                "[43] :: Noemi Waterfox",
                "[44] :: Julia Watson",
                "[44] :: Megan Watson",
                "[77] :: Olga Byakova"
            ];
            const returnedOrder: string[] = [];
            for await (const p of orderedPeople) {
                const personStr = `[${p.age}] :: ${p.name} ${p.surname}`;
                returnedOrder.push(personStr);
            }
            expect(returnedOrder).to.deep.equal(expectedOrder);
        });
        test("should be ignored if followed by an orderBy", async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Bella, Person.Amy, Person.Emily, Person.Eliza, Person.Hanna, Person.Hanna2,
                    Person.Suzuha3, Person.Julia, Person.Lucrezia, Person.Megan, Person.Noemi, Person.Olga, Person.Priscilla, Person.Reika, Person.Suzuha, Person.Suzuha2, Person.Noemi2]
            ));
            const orderedPeople = enumerable.orderByDescending(p => p.age, (a1, a2) => a1 - a2)
                .thenBy(p => p.name)
                .thenByDescending(p => p.surname, (n1, n2) => n1.localeCompare(n2))
                .orderBy(p => p.age).thenBy(p => p.name);
            const expectedOrder: string[] = [
                "[9] :: Priscilla Necci",
                "[19] :: Eliza Jackson",
                "[19] :: Hanna Jackson",
                "[20] :: Hanna Jackson",
                "[21] :: Bella Rivera",
                "[21] :: Lucrezia Volpe",
                "[22] :: Suzuha Suzuki",
                "[22] :: Suzuha Mizuki",
                "[25] :: Emily Redridge",
                "[26] :: Suzuha Mizuki",
                "[29] :: Noemi Waterfox",
                "[32] :: Amy Rivera",
                "[37] :: Reika Kurohana",
                "[43] :: Noemi Waterfox",
                "[44] :: Julia Watson",
                "[44] :: Megan Watson",
                "[77] :: Olga Byakova"
            ];
            const returnedOrder: string[] = [];
            for await (const p of orderedPeople) {
                const personStr = `[${p.age}] :: ${p.name} ${p.surname}`;
                returnedOrder.push(personStr);
            }
            expect(returnedOrder).to.deep.equal(expectedOrder);
        });
    });

    describe("#thenByDescending()", () => {
        test("should order people by age [asc] then by name[desc]", async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Alice, Person.Lenka, Person.Jane, Person.Jisu, Person.Kaori, Person.Mel, Person.Rebecca, Person.Reina, Person.Senna, Person.Vanessa, Person.Viola]
            ));
            const orderedPeople = enumerable.orderBy(p => p.age, (a1, a2) => a1 - a2).thenByDescending(p => p.name);
            const orderedPeopleNames = orderedPeople.select(p => p.name);
            const expectedNames = ["Mel", "Senna", "Kaori", "Jisu", "Lenka", "Jane", "Rebecca", "Vanessa", "Reina", "Alice", "Viola"];
            expect(await orderedPeopleNames.toArray()).to.deep.equal(expectedNames);
        });
        test("should order people by age [desc] then by name[desc] then by surname[desc]", async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Bella, Person.Amy, Person.Emily, Person.Eliza, Person.Hanna, Person.Hanna2,
                    Person.Suzuha3, Person.Julia, Person.Lucrezia, Person.Megan, Person.Noemi, Person.Olga, Person.Priscilla, Person.Reika, Person.Suzuha, Person.Suzuha2, Person.Noemi2]
            ));
            const orderedPeople = enumerable.orderByDescending(p => p.age, (a1, a2) => a1 - a2)
                .thenByDescending(p => p.name)
                .thenByDescending(p => p.surname, (n1, n2) => n1.localeCompare(n2));
            const expectedOrder: string[] = [
                "[77] :: Olga Byakova",
                "[44] :: Megan Watson",
                "[44] :: Julia Watson",
                "[43] :: Noemi Waterfox",
                "[37] :: Reika Kurohana",
                "[32] :: Amy Rivera",
                "[29] :: Noemi Waterfox",
                "[26] :: Suzuha Mizuki",
                "[25] :: Emily Redridge",
                "[22] :: Suzuha Suzuki",
                "[22] :: Suzuha Mizuki",
                "[21] :: Lucrezia Volpe",
                "[21] :: Bella Rivera",
                "[20] :: Hanna Jackson",
                "[19] :: Hanna Jackson",
                "[19] :: Eliza Jackson",
                "[9] :: Priscilla Necci"
            ];
            const returnedOrder: string[] = [];
            for await (const p of orderedPeople) {
                const personStr = `[${p.age}] :: ${p.name} ${p.surname}`;
                returnedOrder.push(personStr);
            }
            expect(returnedOrder).to.deep.equal(expectedOrder);
        });
        test("should be ignored if followed by an orderBy", async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Bella, Person.Amy, Person.Emily, Person.Eliza, Person.Hanna, Person.Hanna2,
                    Person.Suzuha3, Person.Julia, Person.Lucrezia, Person.Megan, Person.Noemi, Person.Olga, Person.Priscilla, Person.Reika, Person.Suzuha, Person.Suzuha2, Person.Noemi2]
            ));
            const orderedPeople = enumerable.orderByDescending(p => p.age, (a1, a2) => a1 - a2)
                .thenByDescending(p => p.name)
                .thenByDescending(p => p.surname, (n1, n2) => n1.localeCompare(n2))
                .orderBy(p => p.age).thenBy(p => p.name);
            const expectedOrder: string[] = [
                "[9] :: Priscilla Necci",
                "[19] :: Eliza Jackson",
                "[19] :: Hanna Jackson",
                "[20] :: Hanna Jackson",
                "[21] :: Bella Rivera",
                "[21] :: Lucrezia Volpe",
                "[22] :: Suzuha Suzuki",
                "[22] :: Suzuha Mizuki",
                "[25] :: Emily Redridge",
                "[26] :: Suzuha Mizuki",
                "[29] :: Noemi Waterfox",
                "[32] :: Amy Rivera",
                "[37] :: Reika Kurohana",
                "[43] :: Noemi Waterfox",
                "[44] :: Julia Watson",
                "[44] :: Megan Watson",
                "[77] :: Olga Byakova"
            ];
            const returnedOrder: string[] = [];
            for await (const p of orderedPeople) {
                const personStr = `[${p.age}] :: ${p.name} ${p.surname}`;
                returnedOrder.push(personStr);
            }
            expect(returnedOrder).to.deep.equal(expectedOrder);
        });
        test("should be ignored if followed by an orderByDescending", async () => {
            const enumerable = new AsyncEnumerable(personProducer(
                [Person.Bella, Person.Amy, Person.Emily, Person.Eliza, Person.Hanna, Person.Hanna2,
                    Person.Suzuha3, Person.Julia, Person.Lucrezia, Person.Megan, Person.Noemi, Person.Olga, Person.Priscilla, Person.Reika, Person.Suzuha, Person.Suzuha2, Person.Noemi2]
            ));
            const orderedPeople = enumerable.orderByDescending(p => p.age, (a1, a2) => a1 - a2)
                .thenByDescending(p => p.name)
                .thenByDescending(p => p.surname, (n1, n2) => n1.localeCompare(n2))
                .orderByDescending(p => p.age).thenBy(p => p.name);
            const expectedOrder: string[] = [
                "[77] :: Olga Byakova",
                "[44] :: Julia Watson",
                "[44] :: Megan Watson",
                "[43] :: Noemi Waterfox",
                "[37] :: Reika Kurohana",
                "[32] :: Amy Rivera",
                "[29] :: Noemi Waterfox",
                "[26] :: Suzuha Mizuki",
                "[25] :: Emily Redridge",
                "[22] :: Suzuha Suzuki",
                "[22] :: Suzuha Mizuki",
                "[21] :: Bella Rivera",
                "[21] :: Lucrezia Volpe",
                "[20] :: Hanna Jackson",
                "[19] :: Eliza Jackson",
                "[19] :: Hanna Jackson",
                "[9] :: Priscilla Necci"
            ];
            const returnedOrder: string[] = [];
            for await (const p of orderedPeople) {
                const personStr = `[${p.age}] :: ${p.name} ${p.surname}`;
                returnedOrder.push(personStr);
            }
            expect(returnedOrder).to.deep.equal(expectedOrder);
        });
    });

    describe("#union", () => {
        test("should return a set of items from two enumerables", async () => {
            const enumerable1 = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5, 5, 5]));
            const enumerable2 = new AsyncEnumerable(arrayProducer([4, 5, 6, 7, 8, 9, 7]));
            const union = enumerable1.union(enumerable2);
            const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            expect(await union.toArray()).to.deep.equal(expected);
        });
        test("should return a set of items from two enumerables with a custom comparer", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, Person.Noemi, Person.Suzuha]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Alice, Person.Noemi2, Person.Suzuha3, Person.Lucrezia]));
            const union = enumerable1.union(enumerable2, (p1, p2) => p1.name === p2.name);
            const expected = [Person.Alice, Person.Noemi, Person.Suzuha, Person.Lucrezia];
            expect(await union.toArray()).to.deep.equal(expected);
        });
        test("should return union of two enumerables", {timeout: 5000}, async () => {
            const enumerable1 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 100).select(() => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), Helper.generateRandomNumber(1, 90))).toArray(),
                1));
            const enumerable2 = new AsyncEnumerable(personProducer(
                Enumerable.range(0, 100).select(() => new Person(Helper.generateRandomString(8), Helper.generateRandomString(10), Helper.generateRandomNumber(1, 50))).toArray(),
                1));
            const exceptionList = enumerable1.union(enumerable2, (p1, p2) => p1.age === p2.age);
            const ageCount = await exceptionList.select(p => p.age).distinct().count();
            expect(ageCount).to.not.greaterThan(90);
        });
    });

    describe("#unionBy()", () => {
        test("should return a set of items from two enumerables", async () => {
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, Person.Noemi, Person.Suzuha]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Alice, Person.Noemi2, Person.Suzuha3, Person.Lucrezia]));
            const union = enumerable1.unionBy(enumerable2, p => p.name);
            const expected = [Person.Alice, Person.Noemi, Person.Suzuha, Person.Lucrezia];
            expect(await union.toArray()).to.deep.equal(expected);
        });
        test("should use a custom comparer", async () => {
            const LittleSuzuha = new Person("suzuha", "Mizuki", 2);
            const enumerable1 = new AsyncEnumerable(personProducer([Person.Alice, Person.Noemi, Person.Suzuha, LittleSuzuha]));
            const enumerable2 = new AsyncEnumerable(personProducer([Person.Alice, Person.Noemi2, Person.Suzuha3, Person.Lucrezia]));
            const union = enumerable1.unionBy(enumerable2, p => p.name, (n1, n2) => n1.toLowerCase().localeCompare(n2.toLowerCase()) === 0);
            const expected = [Person.Alice, Person.Noemi, Person.Suzuha, Person.Lucrezia];
            expect(await union.toArray()).to.deep.equal(expected);
        });
    });

    describe("#where()", () => {
        test("should select values that can be divided to 3", {timeout: 120000}, async () => {
            const enumerable = new AsyncEnumerable(numberProducer(30));
            for await (const num of enumerable.where(p => p % 3 === 0)) {
                expect(num).to.be.greaterThanOrEqual(0);
                expect(num).to.be.lessThan(30);
                expect(num % 3 === 0).to.be.true;
            }
        });
    });

    describe("#windows()", () => {
        test("should return a list of windows of size 3", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const windows = enumerable.windows(3);
            const expected = [[1, 2, 3], [2, 3, 4], [3, 4, 5]];
            const result = await windows.select(w => w.toArray()).toArray();
            console.log(result);
            expect(result).to.deep.equal(expected);
        });
        test("should return a list of windows of size 1", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const windows = enumerable.windows(1);
            const expected = [[1], [2], [3], [4], [5]];
            const result = await windows.select(w => w.toArray()).toArray();
            expect(result).to.deep.equal(expected);
        });
        test("should return a list of windows of size 5", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const windows = enumerable.windows(5);
            const expected = [[1, 2, 3, 4, 5]];
            const result = await windows.select(w => w.toArray()).toArray();
            expect(result).to.deep.equal(expected);
        });
        test("should return an empty list if window size is greater than the enumerable", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const windows = enumerable.windows(6);
            const result = await windows.select(w => w.toArray()).toArray();
            expect(result).to.deep.equal([]);
        });
        test("should throw error if window size is less than 1", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            expect(() => enumerable.windows(0).toArray()).toThrowError("Size must be greater than 0.");
        });
    });

    describe("#zip()", () => {
        test("should zip two enumerable sequence in a tuple", async () => {
            const enumerable1 = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const enumerable2 = new AsyncEnumerable(arrayProducer([6, 7, 8, 9, 10]));
            const zipped = enumerable1.zip(enumerable2);
            const expected = [[1, 6], [2, 7], [3, 8], [4, 9], [5, 10]];
            expect(await zipped.toArray()).to.deep.equal(expected);
        });
        test("should zip two enumerable sequence with a custom selector", async () => {
            const enumerable1 = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const enumerable2 = new AsyncEnumerable(arrayProducer([6, 7, 8, 9, 10]));
            const zipped = enumerable1.zip(enumerable2, (a, b) => a + b);
            const expected = [7, 9, 11, 13, 15];
            expect(await zipped.toArray()).to.deep.equal(expected);
        });
        test("should zip two enumerable sequence with a custom selector #2", async () => {
            const enumerable1 = new AsyncEnumerable(arrayProducer([1, 2, 3, 4, 5]));
            const enumerable2 = new AsyncEnumerable(arrayProducer(["a", "b", "c", "d", "e"]));
            const zipped = enumerable1.zip(enumerable2, (a, b) => {
                return {
                    [a]: b
                }
            });
            const expected = [{1: "a"}, {2: "b"}, {3: "c"}, {4: "d"}, {5: "e"}];
            expect(await zipped.toArray()).to.deep.equal(expected);
        });
    });

    describe("#toArray()", () => {
        test("should convert enumerable to array", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(5));
            const result = await enumerable.toArray();
            expect(result).to.deep.equal([0, 1, 2, 3, 4]);
        });

        test("should convert enumerable of strings to array", async () => {
            const strings = ["a", "b", "c", "d", "e"];
            const enumerable = new AsyncEnumerable(stringProducer(strings));
            const result = await enumerable.toArray();
            expect(result).to.deep.equal(strings);
        });

        test("should convert enumerable of objects to array", async () => {
            const people = [Person.Alice, Person.Noemi, Person.Kaori];
            const enumerable = new AsyncEnumerable(personProducer(people));
            const result = await enumerable.toArray();
            expect(result).to.deep.equal(people);
        });

        test("should handle empty enumerable", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([]));
            const result = await enumerable.toArray();
            expect(result).to.deep.equal([]);
        });

        test("should handle large collections", async () => {
            const size = 500;
            const enumerable = new AsyncEnumerable(numberProducer(size));
            const result = await enumerable.toArray();
            expect(result.length).to.equal(size);
            expect(result[0]).to.equal(0);
            expect(result[size - 1]).to.equal(size - 1);
        }, { timeout: 10000 });

        test("should preserve order of elements", async () => {
            const enumerable = new AsyncEnumerable(arrayProducer([5, 3, 1, 4, 2]));
            const result = await enumerable.toArray();
            expect(result).to.deep.equal([5, 3, 1, 4, 2]);
        });
    });

    describe("#toObject()", () => {
        test("should convert enumerable to object using key and value selectors", async () => {
            const enumerable = new AsyncEnumerable(personProducer([Person.Alice, Person.Noemi, Person.Kaori]));
            const result = await enumerable.toObject(p => p.name, p => p.age);
            expect(result).to.deep.equal({
                "Alice": 23,
                "Noemi": 29,
                "Kaori": 10
            });
        });

        test("should convert enumerable of KeyValuePairs to object", async () => {
            const pairs = [
                ["name", "John"],
                ["age", 30],
                ["city", "New York"]
            ] as [string, string|number][];
            const enumerable = new AsyncEnumerable(keyValuePairProducer(pairs));
            const result = await enumerable.toObject(kv => kv.key, kv => kv.value);
            expect(result).to.deep.equal({
                "name": "John",
                "age": 30,
                "city": "New York"
            });
        });

        test("should handle KeyValuePairs with default selectors", async () => {
            const pairs = [
                ["name", "John"],
                ["age", 30],
                ["city", "New York"]
            ] as [string, string|number][];
            const enumerable = new AsyncEnumerable(keyValuePairProducer(pairs));
            // When item is KeyValuePair and no selectors provided, it should use key/value properties
            const result = await enumerable.toObject(null as any, null as any);
            expect(result).to.deep.equal({
                "name": "John",
                "age": 30,
                "city": "New York"
            });
        });

        test("should handle empty enumerable", async () => {
            const enumerable = new AsyncEnumerable(personProducer([]));
            const result = await enumerable.toObject(p => p.name, p => p.age);
            expect(result).to.deep.equal({});
        });

        test("should use custom key and value selectors", async () => {
            const enumerable = new AsyncEnumerable(numberProducer(5));
            const result = await enumerable.toObject(
                n => `key${n}`,
                n => n * n
            );
            expect(result).to.deep.equal({
                "key0": 0,
                "key1": 1,
                "key2": 4,
                "key3": 9,
                "key4": 16
            });
        });
    });
});
