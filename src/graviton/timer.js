/**
 * graviton/timer -- Sim timer and FPS limiter
 */
const requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
        return window.setTimeout(callback, 1000 / 60);
    };

const cancelAnimationFrame = window.cancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    function(timeoutId) {
        window.clearTimeout(timeoutId);
    };

const performance = window.performance || {};
performance.now = performance.now ||
    performance.webkitNow ||
    performance.mozNow ||
    Date.now;


export default class {
    constructor(fn, fps=null) {
        this._fn = fn;
        this._fps = fps;
        this._isActive = false;
        this._isAnimation = fps === null;
        this._cancellationId = null;
    }

    start() {
        if (!this._isActive) {
            if (this._isAnimation) {
                this._beginAnimation();
            } else {
                this._beginInterval();
            }
            this._isActive = true;
        }
    }

    stop() {
        if (this._isActive) {
            if (this._isAnimation) {
                cancelAnimationFrame(this._cancellationId);
            } else {
                clearInterval(this._cancellationId);
            }
            this._isActive = false;
        }
    }

    toggle() {
        if (this._isActive) {
            this.stop();
        } else {
            this.start();
        }
    }

    _beginAnimation() {
        let lastTimestamp = null;
        let animator = (timestamp) => {
            lastTimestamp = lastTimestamp || timestamp;
            this._cancellationId = requestAnimationFrame(animator);
            this._fn(timestamp - lastTimestamp);
            lastTimestamp = timestamp;
        };

        // Delay initial execution until the next tick.
        this._cancellationId = requestAnimationFrame(animator);
    }

    _beginInterval() {
        // Compute the delay per tick, in milliseconds.
        let timeout = 1000 / this._fps | 0;

        let lastTimestamp = performance.now();
        this._cancellationId = setInterval(() => {
            let timestamp = performance.now();
            this._fn(timestamp - lastTimestamp);
            lastTimestamp = timestamp;
         }, timeout);
    }
} // end graviton/timer
