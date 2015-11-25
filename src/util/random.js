/**
 * random -- A collection of random generator functions
 */
export default {
    /**
     * Generate a random number between the given start and end points
     */
    number(from, to=null) {
        if (to === null) {
            to = from;
            from = 0;
        }

        return Math.random() * (to - from) + from;
    },

    /**
     * Generate a random integer between the given positions
     */
    integer(...args) {
        return Math.floor(this.number(...args));
    },

    /**
     * Generate a random number, with a random sign, between the given
     * positions
     */
    directional(...args) {
        let rand = this.number(...args);
        if (Math.random() > 0.5) {
            rand = -rand;
        }
        return rand;
    },

    /**
     * Generate a random hexadecimal color
     */
    color() {
        return '#' + ('00000' + Math.floor(Math.random() * 0x1000000).toString(16)).substr(-6);
    }
};
