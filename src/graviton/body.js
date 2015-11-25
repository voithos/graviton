/**
 * graviton/body -- The gravitational body
 */
export default class {
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
        this.radius = args.radius || 4;
        this.color = args.color || '#FFFFFF';
    }
}; // end graviton/body
