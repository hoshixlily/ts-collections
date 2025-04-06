import { EqualityComparator } from "../../shared/EqualityComparator";

export const findOrCreateGroupEntry = <TInner, TKey>(lookupStore: Array<{
    key: TKey;
    group: TInner[]
}>, key: TKey, keyCompare: EqualityComparator<TKey>): TInner[] => {
    for (const entry of lookupStore) {
        if (keyCompare(entry.key, key)) {
            return entry.group;
        }
    }
    const newGroup: TInner[] = [];
    lookupStore.push({key: key, group: newGroup});
    return newGroup;
}

export const findGroupInStore = <TInner, TKey>(lookupStore: ReadonlyArray<{
    key: TKey;
    group: TInner[]
}>, key: TKey, keyCompare: EqualityComparator<TKey>): ReadonlyArray<TInner> | null => {
    for (const entry of lookupStore) {
        if (keyCompare(entry.key, key)) {
            return entry.group;
        }
    }
    return null;
}
