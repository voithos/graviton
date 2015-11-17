/**
 * random -- A collection of random generator functions
 */
export default {
    /**
     * random.number -- Generate a random number between the given start
     * and end points
     */
    number(from, to=null) {
        if (to === null) {
            to = from;
            from = 0;
        }

        return Math.random() * (to - from) + from;
    },

    /**
     * random.integer -- Generate a random integer between the given
     * positions
     */
    integer(...args) {
        return Math.round(this.number(...args));
    },

    /**
     * random.directional -- Generate a random number, with a random sign,
     * between the given positions
     */
    directional(...args) {
        let rand = this.number(...args);
        if (Math.random() > 0.5) {
            rand = -rand;
        }
        return rand;
    },

    /**
     * random.color -- Generate a random hexadecimal color
     */
    color() {
        return '#' + ('00000' + Math.floor(Math.random() * 0xffffff).toString(16)).substr(-6);
    }
};
