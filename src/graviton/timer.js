/**
 * graviton/timer -- Sim timer and FPS limiter
 */
export default function(args) {
    let self = {
        // Attributes
        //-----------------

        options: {},
        callbacks: [],
        running: false,

        // Functions
        //------------------

        addCallback: function(func, context, fps, options) {
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
        },

        removeCallback: function(func) {
            for (let i = 0; i < this.callbacks.length; i++) {
                let callback = this.callbacks[i];
                if (callback.fn === func) {
                    clearInterval(callback.intervalId);
                    this.callbacks.splice(i, 1);
                    break;
                }
            }
        },

        start: function() {
            this.running = true;

            this.callbacks.forEach(function(callback) {
                if (!callback.started) {
                    callback.intervalId = setInterval(
                        callback.fn.bind(callback.context),
                        callback.delay);
                    callback.started = true;
                }
            });
        },

        stop: function() {
            this.running = false;

            this.callbacks.forEach(function(callback) {
                if (!callback.nostop) {
                    clearInterval(callback.intervalId);
                    callback.intervalId = null;
                    callback.started = false;
                }
            });
        },

        toggle: function() {
            if (this.running) {
                this.stop();
            } else {
                this.start();
            }
        }
    };

    self.options.defaultFps = args.defaultFps || 30;

    return self;
} // end graviton/timer
