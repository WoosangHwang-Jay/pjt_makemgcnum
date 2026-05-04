const { evaluate } = require('../utils/parser');

describe('Custom Formula Parser', () => {
    test('evaluates basic addition: 1+2 = 3', () => {
        expect(evaluate('1+2')).toBe(3);
    });

    test('evaluates operator precedence: 1+2*3 = 7', () => {
        expect(evaluate('1+2*3')).toBe(7);
    });

    test('evaluates parentheses: (1+2)*3 = 9', () => {
        expect(evaluate('(1+2)*3')).toBe(9);
    });

    test('evaluates special operator: √9 = 3', () => {
        expect(evaluate('√9')).toBe(3);
    });

    test('fails √8 due to constraint', () => {
        expect(() => evaluate('√8')).toThrow('Invalid input for √');
    });

    test('evaluates special operator: 3! = 6', () => {
        expect(evaluate('3!')).toBe(6);
    });

    test('fails 4! due to constraint', () => {
        expect(() => evaluate('4!')).toThrow('Invalid input for !');
    });

    test('evaluates special operator: 3² = 9', () => {
        expect(evaluate('3²')).toBe(9);
    });

    test('fails 4² due to constraint', () => {
        expect(() => evaluate('4²')).toThrow('Invalid input for ²');
    });

    test('complex expression: (√9 + 1) * 2 + 2 = 10', () => {
        expect(evaluate('(√9 + 1) * 2 + 2')).toBe(10);
    });
});
