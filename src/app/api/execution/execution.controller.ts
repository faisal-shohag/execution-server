 
import { executeCode } from "./execution.service";

 /**
  * Handles the code submission request, runs test cases, and returns the results.
  * @param {object} req - The Express request object.
  * @param {object} res - The Express response object.
  * @param {function} next - The next middleware function.
  */
 export const handleSubmission = async (req, res) => {
     const { code, testCases, action, func, timeLimit, memoryLimit } = req.body;

     if (!code || !testCases || !action || !func || !timeLimit || !memoryLimit) {
         return res.status(400).json({ error: 'Missing required fields in request body.' });
     }

     const output:any = [];
     let passedTestCases = 0;
     let totalRuntime = 0;
     let totalMemoryUsed = 0;
     let overallStatus = "Accepted";
     const memoryLimitKB = memoryLimit * 1024;

     for (const testCase of testCases) {
         const startTime = performance.now();
         const memoryBefore = process.memoryUsage().heapUsed;

         try {
             const { result, stdout } = await executeCode(code, testCase, func, timeLimit);

             const endTime = performance.now();
             const memoryAfter = process.memoryUsage().heapUsed;

             const runtime = Math.round(endTime - startTime);
             const memoryUsedKB = Math.max(0, Math.round((memoryAfter - memoryBefore) / 1024));

             totalRuntime += runtime;
             totalMemoryUsed += memoryUsedKB;

             const resultStr = result !== undefined ? String(result) : '';
             const expectedStr = String(testCase.output);
             const isTestCasePassed = resultStr === expectedStr;

             let currentStatus = "passed";
             if (runtime > timeLimit) {
                 currentStatus = "failed";
                 if (overallStatus === "Accepted") overallStatus = "Time Limit Exceeded";
             } else if (memoryUsedKB > memoryLimitKB) {
                 currentStatus = "failed";
                 if (overallStatus === "Accepted") overallStatus = "Memory Limit Exceeded";
             } else if (!isTestCasePassed) {
                 currentStatus = "failed";
                 if (overallStatus === "Accepted") overallStatus = "Wrong Answer";
             }

             if (currentStatus === "passed") {
                 passedTestCases++;
             }

             output.push({
                 error: null,
                 output: expectedStr,
                 status: currentStatus,
                 stderr: "",
                 stdout: stdout,
                 yourOutput: resultStr,
                 runtime: runtime,
                 memoryUsed: memoryUsedKB,
             });

             // For 'submit' action, stop at the first failure
             if (action === 'submit' && currentStatus === 'failed') {
                 break;
             }

         } catch (error) {
             let errorStatus = "Runtime Error";
             const errorMessage = error instanceof Error ? error.message : String(error);

             if (error instanceof Error) {
                 if (error.message.includes('SyntaxError')) {
                     errorStatus = "Compilation Error";
                 } else if (error.message.includes('Script execution timed out') || error.message.includes('Maximum console output')) {
                     errorStatus = "Time Limit Exceeded";
                 }
             }

             if (overallStatus === "Accepted") {
                 overallStatus = errorStatus;
             }

             output.push({
                 error: errorMessage,
                 output: String(testCase.output),
                 status: "failed",
                 stderr: error instanceof Error ? error.stack || "" : "",
                 stdout: [],
                 yourOutput: "",
                 runtime: timeLimit,
                 memoryUsed: 0,
             });

             // For 'submit' action, stop at the first error
             if (action === 'submit') {
                 break;
             }
         }
     }

     const response = {
         output,
         passedTestCases,
         version: process.version,
         runtime: totalRuntime,
         memory: totalMemoryUsed,
         status: overallStatus,
         totalTestCases: testCases.length,
     };

     res.status(200).json(response);
 };

