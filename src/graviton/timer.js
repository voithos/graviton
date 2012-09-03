/**
 * graviton/timer -- Sim timer and FPS limiter
 */
define(['util/lambda'], function(L) {
    'use strict';

    return function(args) {
        var self = {
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
                var timeout = parseInt(1000 / fps, 10);

                var callback = {
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
                        L.bind(callback.fn, callback.context),
                        callback.delay);
                    callback.started = true;
                }
            },

            removeCallback: function(func) {
                L.foreach(this.callbacks, function(callback, i) {
                    if (callback.fn === func) {
                        clearInterval(callback.intervalId);
                        L.remove(this.callbacks, i);
                        return false;
                    }
                }, this);
            },

            start: function() {
                this.running = true;

                L.foreach(this.callbacks, function(callback) {
                    if (!callback.started) {
                        callback.intervalId = setInterval(
                            L.bind(callback.fn, callback.context),
                            callback.delay);
                        callback.started = true;
                    }
                }, this);
            },

            stop: function() {
                this.running = false;

                L.foreach(this.callbacks, function(callback) {
                    if (!callback.nostop) {
                        clearInterval(callback.intervalId);
                        callback.intervalId = null;
                        callback.started = false;
                    }
                }, this);
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
    }; // end graviton/timer
});
