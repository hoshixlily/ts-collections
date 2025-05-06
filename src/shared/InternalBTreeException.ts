export class InternalBTreeException extends Error {
    public constructor(message: string = "Internal B-Tree exception.") {
        super(message);
    }
}
