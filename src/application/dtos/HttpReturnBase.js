export class HttpReturnBase {
    constructor(
        traceId,
        success,
        code,
        message,
        data
    ) {
        this.traceId = traceId
        this.success = success
        this.code = code
        this.message = message
        this.data = data
    }
}