/**
 * log -- Logging functions
 */
export default {
    config: {
        logLevel: null
    },

    write(message, level) {
        if (typeof console !== 'undefined') {
            let now = new Date();
            let stamp = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + 'T' +
                now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ':' + now.getMilliseconds();

            message = stamp + ' ' + message;

            level = (level || this.config.logLevel || 'debug').toLowerCase();

            // Write to console -- currently, `log`, `debug`, `info`, `warn`, and `error`
            // are available
            if (console[level]) {
                console[level](message);
            } else {
                throw Error('Log level does not exist.');
            }
        }
    },

    setLevel(level) {
        level = level.toLowerCase();

        if (console[level]) {
            config.logLevel = level;
        } else {
            throw Error('Log level does not exist.');
        }
    }
};
