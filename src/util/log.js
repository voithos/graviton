/**
 * log -- Logging functions
 */
export default {
    config: {
        logLevel: null
    },

    write: function(message, level) {
        if (typeof console !== 'undefined') {
            var now = new Date();
            var stamp = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + 'T' +
                now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ':' + now.getMilliseconds();

            message = stamp + ' ' + message;

            level = (level || this.config.logLevel || 'debug').toLowerCase();

            // Write to console -- currently, `log`, `debug`, `info`, `warn`, and `error`
            // are available
            if (console[level]) {
                console[level](message);
            } else {
                throw new TypeError('Log level does not exist.');
            }
        }
    },

    setLevel: function(level) {
        level = level.toLowerCase();

        if (console[level]) {
            config.logLevel = level;
        } else {
            throw new TypeError('Log level does not exist.');
        }
    }
};
