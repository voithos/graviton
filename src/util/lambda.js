/**
 * Lambda library -- Collection of utility functions
 */
export default {
    /**
     * isArray -- Test if an object is an array
     */
    isArray: function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },

    /**
     * bind -- Allow a specific object to be carried
     * with a function reference as the execution context
     */
    bind: function(fn, context) {
        return function() {
            return fn.apply(context, arguments);
        };
    },

    /**
     * foreach -- Iterate through a collection (array or object) using an
     * iterator function
     */
    foreach: function(obj, fn, context) {
        var returned;

        // Use native `forEach` if available
        if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
            obj.forEach(fn, context);
        } else if (L.isArray(obj)) {
            // Loop through arrays
            for (var i = 0; i < obj.length; i++) {
                returned = fn.call(context, obj[i], i, obj);

                // Break if signaled
                if (returned === false) {
                    return;
                }
            }
        } else {
            // Assume object
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    returned = fn.call(context, obj[key], key, obj);

                    // Break if signaled
                    if (returned === false) {
                        return;
                    }
                }
            }
        }
    },

    /**
     * remove -- Remove a given element from an array
     */
    remove: function(arr, start, count) {
        return arr.splice(start, count ? count : 1);
    },

    /**
     * addEvent -- Attach an event handler to an element
     */
    addEvent: function(event, el, fn) {
        if (el.addEventListener) {
            el.addEventListener(event, fn, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + event, fn);
        }
    },

    /**
     * width -- Get the width of an element
     */
    width: function(el) {
        // Get window width
        if (el === el.window) {
            return el.document.documentElement.clientWidth;
        }

        // Get document width
        if (el.nodeType === 9) {
            var doc = el.documentElement;

            return Math.max(
                el.body.scrollWidth, doc.scrollWidth,
                el.body.offsetWidth, doc.offsetWidth,
                doc.clientWidth
            );
        }
    },

    /**
     * height -- Get the height of an element
     */
    height: function(el) {
        // Get window height
        if (el === el.window) {
            return el.document.documentElement.clientHeight;
        }

        // Get document height
        if (el.nodeType === 9) {
            var doc = el.documentElement;

            return Math.max(
                el.body.scrollHeight, doc.scrollHeight,
                el.body.offsetHeight, doc.offsetHeight,
                doc.clientHeight
            );
        }
    }
};
