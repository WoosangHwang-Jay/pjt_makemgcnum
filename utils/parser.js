function evaluate(expression) {
    const tokens = tokenize(expression);
    const postfix = shuntingYard(tokens);
    return evaluatePostfix(postfix);
}

function tokenize(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
        const char = str[i];
        if (/\s/.test(char)) {
            i++;
        } else if (/\d/.test(char)) {
            let num = '';
            while (i < str.length && /\d/.test(str[i])) {
                num += str[i];
                i++;
            }
            tokens.push({ type: 'NUMBER', value: parseInt(num) });
        } else if (['+', '-', '*', '/', '(', ')', '√', '²', '!'].includes(char)) {
            tokens.push({ type: 'OPERATOR', value: char });
            i++;
        } else {
            throw new Error(`Unknown character: ${char}`);
        }
    }
    return tokens;
}

const PRECEDENCE = {
    '+': 2,
    '-': 2,
    '*': 3,
    '/': 3,
    '√': 4,
    '²': 4,
    '!': 4
};

function shuntingYard(tokens) {
    const output = [];
    const stack = [];

    tokens.forEach(token => {
        if (token.type === 'NUMBER') {
            output.push(token);
        } else if (token.value === '(') {
            stack.push(token);
        } else if (token.value === ')') {
            while (stack.length && stack[stack.length - 1].value !== '(') {
                output.push(stack.pop());
            }
            stack.pop(); // Remove '('
        } else if (token.type === 'OPERATOR') {
            // Special handling for prefix/postfix can be tricky in basic shunting-yard
            // For simplicity, we treat √ as prefix and others as infix/postfix
            while (stack.length && stack[stack.length - 1].value !== '(' && 
                   PRECEDENCE[stack[stack.length - 1].value] >= PRECEDENCE[token.value]) {
                output.push(stack.pop());
            }
            stack.push(token);
        }
    });

    while (stack.length) {
        output.push(stack.pop());
    }

    return output;
}

function evaluatePostfix(postfix) {
    const stack = [];

    postfix.forEach(token => {
        if (token.type === 'NUMBER') {
            stack.push(token.value);
        } else if (token.type === 'OPERATOR') {
            if (token.value === '√') {
                const a = stack.pop();
                if (![0, 1, 4, 9].includes(a)) throw new Error('Invalid input for √');
                stack.push(Math.sqrt(a));
            } else if (token.value === '²') {
                const a = stack.pop();
                if (a < 0 || a > 9) throw new Error(`${a}²은(는) 계산할 수 없어요. 1~9 숫자만 제곱할 수 있습니다.`);
                stack.push(Math.pow(a, 2));
            } else if (token.value === '!') {
                const a = stack.pop();
                if (a < 0 || a > 7) throw new Error(`${a}!은(는) 계산할 수 없어요. 0~7 숫자만 팩토리얼할 수 있습니다.`);
                stack.push(factorial(a));
            } else {
                const b = stack.pop();
                const a = stack.pop();
                switch (token.value) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': 
                        if (b === 0) throw new Error('Division by zero');
                        stack.push(a / b); 
                        break;
                }
            }
        }
    });

    return stack[0];
}

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

module.exports = { evaluate };
