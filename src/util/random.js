/**
 * random -- A collection of random generator functions
 */
window.mweep = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export default {
    /**
     * Generate a random number between the given start and end points
     */
    number(from, to = null) {
        if (to === null) {
            to = from;
            from = 0;
        }

        return Math.random() * (to - from) + from;
    },

    /**
     * Generate a random integer between the given positions
     */
    integer(...args) { return Math.floor(this.number(...args));},

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
     * Generate a random number from the normal distribution.
     */
    normal() {
        let u = 1 - Math.random();
        let v = 1 - Math.random();
        // Division by 3 is meant to normalize the distribution somewhat.
        return (Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) / 3;
    },

    /**
     * Generate a random number from the normal distribution between a given
     * start and end point.
     */
    normalFromTo(from, to = null) {
        if (to === null) {
            to = from;
            from = 0;
        }
        let gaussian;
        do {
            // Switch range from [-1, 1] to [0, 1).
            gaussian = (this.normal() + 1) / 2;
        } while (gaussian < 0 || gaussian >= 1);
        let idx = Math.floor(gaussian * 10);
        mweep[idx]++;
        return gaussian * (to - from) + from;
    },

    /**
     * Generate a random hexadecimal color
     */
    color() {
        return '#' + ('00000' + Math.floor(Math.random() * 0x1000000).toString(16)).substr(-6);
    }
};
