/**
 * gtBody -- The gravitational body
 */
define(function() {
    'use strict';

    return function(args) {
        var self = {
            // Attributes
            //-----------------

            x: 0,
            y: 0,

            velX: 0,
            velY: 0,

            mass: 0,
            radius: 0,
            color: ''

            // Functions
            //-----------------
        };

        args = args || {};

        // Process arguments
        //------------------
        self.x = args.x;
        self.y = args.y;
        if (typeof self.x !== 'number' || typeof self.y !== 'number') {
            throw new TypeError('Correct positions were not given for the body.');
        }

        self.velX = args.velX || 0;
        self.velY = args.velY || 0;
        self.mass = args.mass || 10;
        self.radius = args.radius || 4;

        self.color = args.color || '#FFFFFF';

        return self;
    }; // end gtBody
});
