module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^react-quill-new$': '<rootDir>/src/test/mocks/reactQuillMock.tsx',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.app.json',
        }],
    },
    collectCoverageFrom: [
        'src/pages/Campaigns.tsx',
        'src/pages/EmailTemplates.tsx',
    ],
};
