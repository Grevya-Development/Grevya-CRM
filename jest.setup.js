require('@testing-library/jest-dom');

// jsdom has no ResizeObserver; Radix UI menus and tooltips need one.
if (typeof global.ResizeObserver === 'undefined') {
    global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
