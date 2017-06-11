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
        this.mass = /* is initialized below */ undefined;
        this.color = args.color || '#AAAAAA';
        this.highlight = args.highlight ||
                colors.toHex(colors.brighten(colors.fromHex(this.color), .25));

        this.adjustSize(0);
    }

    adjustSize(delta) {
        this.radius = Math.max(this.radius + delta, 2);
        // Dorky formula to make mass scale "properly" with radius.
        this.mass = Math.pow(this.radius / 4, 3);
    }
} // end graviton/body
