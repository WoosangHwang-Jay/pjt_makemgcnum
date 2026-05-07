const { evaluate } = require('../utils/parser');

const testCases = [
    { expr: "5 + 5", expected: 10 },
    { expr: "2 * 5", expected: 10 },
    { expr: "20 / 2", expected: 10 },
    { expr: "15 - 5", expected: 10 },
    { expr: "3 * 3 + 1", expected: 10 },
    { expr: "(2 + 3) * 2", expected: 10 },
    { expr: "√9 + 7", expected: 10 },
    { expr: "3² + 1", expected: 10 },
    { expr: "3! + 4", expected: 10 },
    { expr: "(1 + 1)! + 8", expected: 10 }
];

console.log("=== Make Magic Number Parser Unit Tests ===");
let passed = 0;

testCases.forEach((tc, i) => {
    try {
        const result = evaluate(tc.expr);
        if (result === tc.expected) {
            console.log(`✅ Test ${i + 1} Passed: "${tc.expr}" = ${result}`);
            passed++;
        } else {
            console.error(`❌ Test ${i + 1} Failed: "${tc.expr}" expected ${tc.expected}, but got ${result}`);
        }
    } catch (e) {
        console.error(`❌ Test ${i + 1} Error: "${tc.expr}" threw error: ${e.message}`);
    }
});

console.log(`\nSummary: ${passed}/${testCases.length} tests passed.`);
if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
