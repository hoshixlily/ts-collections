// src/shared/InternalBPlusTreeException.ts
export class InternalBPlusTreeException extends Error {
    public constructor(message: string = "Internal B+ Tree exception.") {
        super(message);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InternalBPlusTreeException.prototype);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InternalBPlusTreeException);
        }
        this.name = 'InternalBPlusTreeException';
    }
}
