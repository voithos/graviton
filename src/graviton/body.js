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

        this.nextX = this.x;
        this.nextY = this.y;

        this.velX = args.velX || 0;
        this.velY = args.velY || 0;

        this.radius = args.radius;
        this.mass = args.mass;

        if ('radius' in args && !('mass' in args)) {
            this.forceRadius(args.radius);
        } else if ('mass' in args && !('radius' in args)) {
            this.forceMass(args.mass);
        } else if (!('mass' in args) && !('radius' in args)) {
            // Default to a radius of 10
            this.forceRadius(10);
        }

        this.color = undefined;
        this.highlight = undefined;

        this.updateColor(args.color || '#dbd3c8');
    }

    adjustSize(delta) {
        this.forceRadius(Math.max(this.radius + delta, 2));
    }

    forceRadius(radius) {
        this.radius = radius;
        // Dorky formula to make mass scale "properly" with radius.
        this.mass = Math.pow(this.radius / 4, 3);
    }

    forceMass(mass) {
        // Normally the mass is calculated based on the radius, but we can do the reverse
        this.mass = mass;
        this.radius = Math.pow(this.mass, 1/3) * 4;
    }

    updateColor(color) {
        this.color = color;
        this.highlight = colors.toHex(colors.brighten(colors.fromHex(this.color), .25));
    }

    get speed() {
        // Velocities are tiny, so upscale it (arbitrarily) to make it readable.
        return Math.sqrt(this.velX * this.velX + this.velY * this.velY) * 1e6;
    }
} // end graviton/body
