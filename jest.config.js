module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    testTimeout: 15000,
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
        testTimeout: 15000,
    },
};