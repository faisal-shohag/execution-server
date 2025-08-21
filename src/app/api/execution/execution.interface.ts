export interface TestCase {
    input?: string;
    expectedOutput?: string;
}

export interface ExecutionResult {
    result: [];
    stdout: string[];
}

export interface Output {
    error: null | string;
    output: string
    status: string
    stderr: string
    stdout: string[]
    yourOutput: string
    runtime: number
    memoryUsed: number,
    lineNumber?: number|null

}