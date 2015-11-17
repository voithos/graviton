/**
 * graviton/gfx -- The graphics object
 */
export default function(args) {
    let self = {
        // Attributes
        //-----------------

        options: {},
        grid: null,
        ctx: null,

        // Functions
        //-----------------

        clear: function() {
            // Setting the width has the side effect
            // of clearing the canvas
            this.grid.width = this.grid.width;
        },

        drawBodies: function(bodies) {
            for (let i = 0; i < bodies.length; i++) {
                this.drawBody(bodies[i]);
            }
        },

        drawBody: function(body) {
            this.ctx.fillStyle = body.color;

            this.ctx.beginPath();
            this.ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);

            this.ctx.fill();
        },

        drawLine: function(args) {
            this.ctx.strokeStyle = args.strokeStyle || '#DD2222';
            this.ctx.beginPath();
            this.ctx.moveTo(args.from.x, args.from.y);
            this.ctx.lineTo(args.to.x, args.to.y);
            this.ctx.stroke();
        }
    };

    args = args || {};

    // Process arguments
    //------------------
    self.options.noclear = args.noclear || false;

    self.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;
    self.ctx = self.grid.getContext('2d');

    if (typeof self.grid === 'undefined') {
        throw Error('No usable canvas element was given.');
    }

    return self;
}; // end graviton/gfx
