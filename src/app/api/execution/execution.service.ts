import { createContext, Script } from 'vm';
import { ExecutionResult, TestCase } from './execution.interface';



/**
 * Executes user-provided code against a single test case in a sandboxed environment.
 * @param code - The user's code to execute.
 * @param testCase - The test case with input and expected output.
 * @param func - The name of the function to call.
 * @param timeLimit - The execution time limit in milliseconds.
 * @returns A promise that resolves to the result of the execution.
 */
export const executeCode = (
    code: string,
    testCase: TestCase,
    func: string,
    timeLimit: number
): Promise<ExecutionResult> => {
    return new Promise((resolve, reject) => {
        const stdout: string[] = [];
        const customConsole = {
            log: (...args:[]) => {
                const output = args
                    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
                    .join(' ');
                stdout.push(output);

                if (stdout.length > 1000) {
                    throw new Error('Maximum console output limit reached. Potential infinite loop detected.');
                }
            },
        };

        const context = createContext({
            console: customConsole,
            setTimeout,
            clearTimeout,
        });

        const jsFunc = func.includes('_')
            ? func.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
            : func;

        const scriptToExecute = `
            ${code}
            (function() {
                try {
                    if (typeof ${jsFunc} === 'function') {
                        return ${jsFunc}(${testCase.input || ''});
                    } else if (typeof ${func} === 'function') {
                        return ${func}(${testCase.input || ''});
                    } else {
                        const definedFunctions = Object.keys(this).filter(key => 
                            typeof this[key] === 'function' && !['setTimeout', 'clearTimeout'].includes(key)
                        );
                        if (definedFunctions.length > 0) {
                            return this[definedFunctions[0]](${testCase.input || ''});
                        }
                        throw new Error('No valid function found to execute.');
                    }
                } catch (e) {
                    throw e;
                }
            })();
        `;

        try {
            const script = new Script(scriptToExecute);
            const result = script.runInContext(context, { timeout: timeLimit });
            resolve({ result, stdout });
        } catch (error) {
            reject(error);
        }
    });
};