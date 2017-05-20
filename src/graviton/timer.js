/**
 * graviton/timer -- Sim timer and FPS limiter
 */
import env from '../util/env';

export default class {
    constructor(fn, fps=null) {
        this._fn = fn;
        this._fps = fps;
        this._isActive = false;
        this._isAnimation = fps === null;
        this._cancellationId = null;

        this._window = env.getWindow();
    }

    get active() {
        return this._isActive;
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
                this._window.cancelAnimationFrame(this._cancellationId);
            } else {
                this._window.clearInterval(this._cancellationId);
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
        let lastTimestamp = this._window.performance.now();
        let animator = (timestamp) => {
            this._cancellationId = this._window.requestAnimationFrame(animator);
            this._fn(timestamp - lastTimestamp);
            lastTimestamp = timestamp;
        };

        // Delay initial execution until the next tick.
        this._cancellationId = this._window.requestAnimationFrame(animator);
    }

    _beginInterval() {
        // Compute the delay per tick, in milliseconds.
        let timeout = 1000 / this._fps | 0;

        let lastTimestamp = this._window.performance.now();
        this._cancellationId = this._window.setInterval(() => {
            let timestamp = this._window.performance.now();
            this._fn(timestamp - lastTimestamp);
            lastTimestamp = timestamp;
         }, timeout);
    }
} // end graviton/timer
