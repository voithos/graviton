/**
 * random -- A collection of random generator functions
 */
define({
    /**
     * random.number -- Generate a random number between the given start
     * and end points
     */
    number: function(from, to) {
        if (arguments.length === 1) {
            to = from;
            from = 0;
        }

        return Math.random() * (to - from) + from;
    },

    /**
     * random.integer -- Generate a random integer between the given
     * positions
     */
    integer: function() {
        return Math.round(random.number.apply(this, arguments));
    },

    /**
     * random.directional -- Generate a random number, with a random sign,
     * between the given positions
     */
    directional: function() {
        var rand = random.number.apply(this, arguments);
        if (Math.random() > 0.5) {
            rand = -rand;
        }

        return rand;
    },

    /**
     * random.color -- Generate a random hexadecimal color
     */
    color: function() {
        return '#' + ('00000' + Math.floor(Math.random() * 0xffffff).toString(16)).substr(-6);
    }
});
