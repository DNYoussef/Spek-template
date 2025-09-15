// Agent Validation Test Suite
// Testing Core Development Agents (1-5)

/**
 * Agent 1: CODER - Code generation task
 * Task: Generate a simple JavaScript utility function for string validation
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Agent 2: REVIEWER - Code review task
 * Review findings for the above function:
 * - Security:  Input validation handles null/undefined
 * - Performance:  Efficient regex pattern
 * - Maintainability:  Clear function name and logic
 * - Suggestions: Consider more robust email validation for production
 */

/**
 * Agent 3: TESTER - Test creation task
 * Comprehensive test suite for utility function
 */
function testValidateEmail() {
    const tests = [
        // Valid cases
        { input: 'test@example.com', expected: true, description: 'Valid email' },
        { input: 'user.name@domain.co.uk', expected: true, description: 'Valid email with subdomain' },

        // Invalid cases
        { input: null, expected: false, description: 'Null input' },
        { input: undefined, expected: false, description: 'Undefined input' },
        { input: '', expected: false, description: 'Empty string' },
        { input: 'invalid-email', expected: false, description: 'No @ symbol' },
        { input: '@domain.com', expected: false, description: 'Missing local part' },
        { input: 'test@', expected: false, description: 'Missing domain' },
        { input: '  test@example.com  ', expected: true, description: 'Email with whitespace' }
    ];

    return tests.map(test => ({
        ...test,
        result: validateEmail(test.input),
        passed: validateEmail(test.input) === test.expected
    }));
}

/**
 * Agent 4: PLANNER - Planning task
 * Implementation plan for user authentication system
 */
const authSystemPlan = {
    phase1: {
        title: "Foundation Setup",
        duration: "1 week",
        tasks: [
            "Set up user database schema",
            "Implement password hashing (bcrypt)",
            "Create JWT token management"
        ]
    },
    phase2: {
        title: "Core Authentication",
        duration: "2 weeks",
        tasks: [
            "User registration endpoint",
            "Login/logout functionality",
            "Password reset workflow"
        ]
    },
    phase3: {
        title: "Security & Testing",
        duration: "1 week",
        tasks: [
            "Rate limiting implementation",
            "Security testing suite",
            "Integration testing"
        ]
    }
};

/**
 * Agent 5: RESEARCHER - Research task
 * Best practices for input validation in JavaScript
 */
const validationResearch = {
    findings: [
        "Use explicit type checking before validation",
        "Sanitize inputs to prevent XSS attacks",
        "Implement whitelist validation over blacklist",
        "Use established libraries like validator.js for complex validation",
        "Always validate on both client and server side"
    ],
    sources: [
        "OWASP Input Validation Guidelines",
        "MDN Web Security Best Practices",
        "npm validator.js documentation"
    ]
};

module.exports = {
    validateEmail,
    testValidateEmail,
    authSystemPlan,
    validationResearch
};