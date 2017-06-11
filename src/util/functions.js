/**
 * functions -- Functional helpers
 */
export default {
    debounce(fn, delay) {
        let timer = null;
        return function() {
            const ctx = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(ctx, args), delay);
        };
    }
};
