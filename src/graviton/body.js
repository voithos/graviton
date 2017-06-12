import colors from '../util/colors';

/**
 * graviton/body -- The gravitational body
 */
export default class GtBody {
    constructor(args) {
        args = args || {};

        this.x = args.x;
        this.y = args.y;
        if (typeof this.x !== 'number' || typeof this.y !== 'number') {
            throw Error('Correct positions were not given for the body.');
        }

        this.velX = args.velX || 0;
        this.velY = args.velY || 0;

        this.radius = args.radius || 10;
        // Initialized below.
        this.mass = undefined;
        this.color = undefined;
        this.highlight = undefined;

        this.updateColor(args.color || '#BABABA');
        this.adjustSize(0);
    }

    adjustSize(delta) {
        this.radius = Math.max(this.radius + delta, 2);
        // Dorky formula to make mass scale "properly" with radius.
        this.mass = Math.pow(this.radius / 4, 3);
    }

    updateColor(color) {
        this.color = color;
        this.highlight = colors.toHex(colors.brighten(colors.fromHex(this.color), .25));
    }
} // end graviton/body
