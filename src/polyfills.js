window.requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
        return window.setTimeout(callback, 1000 / 60);
    };

window.cancelAnimationFrame = window.cancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    function(timeoutId) {
        window.clearTimeout(timeoutId);
    };

window.performance = window.performance || {};
window.performance.now = window.performance.now ||
    window.performance.webkitNow ||
    window.performance.mozNow ||
    Date.now;
