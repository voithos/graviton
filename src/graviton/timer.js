/**
 * graviton/timer -- Sim timer and FPS limiter
 */
export default class {
    constructor(args) {
        args = args || {};

        this.options = {};
        this.callbacks = [];
        this.running = false;
        this.options.defaultFps = args.defaultFps || 30;
    }

    addCallback(func, context, fps, options) {
        fps = fps || this.options.defaultFps;
        options = options || {};

        // Compute the delay in milliseconds
        let timeout = parseInt(1000 / fps, 10);

        let callback = {
            fn: func,
            context: context,
            delay: timeout,
            intervalId: null,
            started: false,
            nostop: options.nostop || false
        };
        this.callbacks.push(callback);

        // Start interval if running, or if `autostart` is given
        if (this.running || options.autostart) {
            callback.intervalId = setInterval(
                callback.fn.bind(callback.context),
                callback.delay);
            callback.started = true;
        }
    }

    removeCallback(func) {
        for (let i = 0; i < this.callbacks.length; i++) {
            let callback = this.callbacks[i];
            if (callback.fn === func) {
                clearInterval(callback.intervalId);
                this.callbacks.splice(i, 1);
                break;
            }
        }
    }

    start() {
        this.running = true;

        this.callbacks.forEach(function(callback) {
            if (!callback.started) {
                callback.intervalId = setInterval(
                    callback.fn.bind(callback.context),
                    callback.delay);
                callback.started = true;
            }
        });
    }

    stop() {
        this.running = false;

        this.callbacks.forEach(function(callback) {
            if (!callback.nostop) {
                clearInterval(callback.intervalId);
                callback.intervalId = null;
                callback.started = false;
            }
        });
    }

    toggle() {
        if (this.running) {
            this.stop();
        } else {
            this.start();
        }
    }
} // end graviton/timer
