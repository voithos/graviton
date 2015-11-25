/**
 * graviton/gfx -- The graphics object
 */
export default class {
    constructor(args) {
        args = args || {};

        this.noclear = args.noclear || false;

        this.grid = typeof args.grid === 'string' ?
            document.getElementById(args.grid) :
            args.grid;

        if (typeof this.grid === 'undefined') {
            throw Error('No usable canvas element was given.');
        }

        this.ctx = this.grid.getContext('2d');
    }

    clear() {
        // Setting the width has the side effect
        // of clearing the canvas
        this.grid.width = this.grid.width;
    }

    drawBodies(bodies) {
        if (!this.noclear) {
            this.clear();
        }
        for (let body of bodies) {
            this.drawBody(body);
        }
    }

    drawBody(body) {
        this.ctx.fillStyle = body.color;

        this.ctx.beginPath();
        this.ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);

        this.ctx.fill();
    }

    drawLine(args) {
        this.ctx.strokeStyle = args.strokeStyle || '#DD2222';
        this.ctx.beginPath();
        this.ctx.moveTo(args.from.x, args.from.y);
        this.ctx.lineTo(args.to.x, args.to.y);
        this.ctx.stroke();
    }
}; // end graviton/gfx
