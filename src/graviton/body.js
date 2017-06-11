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

        this.mass = args.mass || 10;
        this.radius = args.radius || 15;
        this.color = args.color || '#bababa';
        this.highlight = args.highlight ||
                colors.toHex(colors.brighten(colors.fromHex(this.color), .25));
    }
} // end graviton/body
