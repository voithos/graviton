/**
 * graviton v@VERSION
 *
 * JavaScript N-body Gravitational Simulator
 *
 * Copyright (c) 2012 Zaven Muradyan
 * Licensed under the MIT license
 *
 * Revision:
 *  @REVISION
 */

(function(global) {

    /**
     * Shims for certain utility functions
     */
    if (!Function.prototype.bind) {
        /**
         * bind -- Allow a specific object to be carried
         * with a function reference as the execution context
         */
        Function.prototype.bind = function(context) {
            var fn = this;
            return function() {
                return fn.apply(context, arguments);
            };
        };
    }

    if (!Array.prototype.remove) {
        /**
         * remove -- Remove a given element from an array
         */
        Array.prototype.remove = function(start, count) {
            return this.splice(start, count ? count : 1);
        };
    }

    /**
     * random -- A collection of random generator functions
     */
    var random = {
        /**
         * random.number -- Generate a random number between the given start
         * and end points
         */
        number: function(from, to) {
            if (arguments.length == 1) {
                to = from;
                from = 0;
            }

            return Math.random() * (to - from) + from;
        },

        /**
         * random.integer -- Generate a random integer between the given
         * positions
         */
        integer: function() {
            return Math.round(random.number.apply(this, arguments));
        },

        /**
         * random.directional -- Generate a random number, with a random sign,
         * between the given positions
         */
        directional: function() {
            var rand = random.number.apply(this, arguments);
            if (Math.random() > 0.5) {
                rand = -rand;
            }

            return rand;
        },

        /**
         * random.color -- Generate a random hexadecimal color
         */
        color: function() {
            return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).substr(-6);
        }
    }; // end random

    /**
     * log -- Logging functions
     */
    var log = {
        write: function(message, level) {
            if (typeof console !== 'undefined') {
                var now = new Date();
                var stamp = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + 'T' +
                    now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ':' + now.getMilliseconds();

                message = stamp + ' ' + message;

                level = (level || 'debug').toLowerCase();

                if (console[level]) {
                    console[level](message);
                } else {
                    throw new TypeError('Log level does not exist.');
                }
            }
        }
    }; // end log


    /**
     * gtApplication -- The interactive graviton application
     */
    var gtApplication = function(args) {
        var me = {
            // Attributes
            //-----------------

            version: '@VERSION',

            options: undefined,

            sim: undefined,

            grid: undefined,

            // Functions
            //------------------

            _generateGrid: function(width, height, backgroundColor) {
                // Attach a canvas to the page, to house the simulations
                this.grid = document.createElement('canvas');

                this.grid.width = width;
                this.grid.height = height;
                this.grid.style.display = 'block';
                this.grid.style.marginLeft = 'auto';
                this.grid.style.marginRight = 'auto';
                this.grid.style.borderStyle = 'solid';
                this.grid.style.borderWidth = 'medium';
                this.grid.style.borderColor = '#CCCCCC';
                this.grid.style.backgroundColor = backgroundColor;

                document.body.appendChild(this.grid);
            },

            _generateBodies: function(num, args) {
                if (!args)
                    args = {};

                var minX = args.minX || 0;
                var maxX = args.maxX || this.options.width;
                var minY = args.minY || 0;
                var maxY = args.maxY || this.options.height;

                var minVelX = args.minVelX || 0;
                var maxVelX = args.maxVelX || 0.00001;
                var minVelY = args.minVelY || 0;
                var maxVelY = args.maxVelY || 0.00001;

                var minMass = args.minMass || 1;
                var maxMass = args.maxMass || 150;

                var minRadius = args.minRadius || 1;
                var maxRadius = args.maxRadius || 15;

                var color = args.color;

                for (var i = 0; i < num; i++) {
                    if (args.randomColors === true) {
                        color = randomColor();
                    }

                    this.sim.addNewBody({
                        x: random(minX, maxX),
                        y: random(minY, maxY),
                        velX: randomDirectional(minVelX, maxVelX),
                        velY: randomDirectional(minVelY, maxVelY),
                        mass: random(minMass, maxMass),
                        radius: random(minRadius, maxRadius),
                        color: color});
                }
            },

            _wireupEvents: function() {
                this.grid.addEventListener('click', this._handleClick.bind(this), false);
                document.addEventListener('keydown', this._handleKeyDown.bind(this), false);
            },

            _handleClick: function(event) {
                this.sim.addNewBody({x: event.clientX - this.grid.offsetLeft, y: event.clientY - this.grid.offsetTop});
            },

            _handleKeyDown: function(event) {
                switch (event.which) {
                    // 'Enter' - Start or stop simulation
                    case 13:
                        this.sim.toggle();
                        break;

                    // 'C' - Clear simulation
                    case 67:
                        this.sim.clear();
                        break;

                    // 'P' - Toggle trails
                    case 80:
                        this.sim.togglePaths();
                        break;

                    // 'R' - Generate random objects
                    case 82:
                        this._generateBodies(10, {randomColors: true});
                        break;

                    // T for test
                    case 84:
                        this.sim.addNewBody({x: this.options.width / 2, y: this.options.height / 2, velX: 0, velY: 0, mass: 2000, radius: 50, color: '#5A5A5A'});
                        this.sim.addNewBody({x: this.options.width - 400, y: this.options.height / 2, velX: 0, velY: 0.000025, mass: 1, radius: 5, color: '#787878'});
                        break;
                }
            }
        };

        if (!args) {
            args = {};
        }

        me.options = {};

        me.options.width = args.width || document.body.clientWidth - 50;
        me.options.height = args.height || document.body.clientHeight - 50;
        me.options.backgroundColor = args.backgroundColor || '#1F263B';

        me.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

        if (typeof me.grid === 'undefined') {
            me._generateGrid(me.options.width, me.options.height, me.options.backgroundColor);

            // Update grid argument
            args.grid = me.grid;
        }

        // Create simulation
        me.sim = gtSimulation(args);

        me._wireupEvents();

        return me;
    }; // end gtApplication

    /**
     * gtSimulation -- The gravitational simulator
     */
    var gtSimulation = function(args) {
        var me = {
            // Attributes
            //-----------------

            version: '0.1.0',

            running: false,

            intervalId: 0,

            time: 0,

            options: undefined,

            bodies: undefined,

            graphics: undefined,

            // Functions
            //-----------------

            addNewBody: function(args) {
                var newIndex = this.bodies.push(gtBody(args));
                this.graphics.draw(this.bodies);

                return this.bodies[newIndex];
            },

            removeBody: function(index) {
                this.bodies.remove(index);
            },

            start: function() {
                if (this.running === false) {
                    this.running = true;
                    this.intervalId = setInterval(this._run.bind(this), this.options.interval);
                }
            },

            stop: function() {
                if (this.running === true) {
                    this.running = false;
                }
            },

            toggle: function() {
                if (this.running === false) {
                    this.start();
                } else {
                    this.stop();
                }
            },

            clear: function() {
                this.bodies.length = 0; // Remove all bodies from collection
                this.stop();
                this.setPaths(false); // Turn off residual paths
                this.graphics.draw(); // Clear grid
            },

            setG: function(G) {
                if (typeof G === 'number') {
                    this.options.G = G;
                } else {
                    throw 'setG: Argument was not a number.';
                }
            },

            setDeltaT: function(deltaT) {
                if (typeof deltaT === 'number') {
                    this.options.deltaT = deltaT;
                } else {
                    throw 'setDeltaT: Argument was not a number.';
                }
            },

            setCompInterval: function(interval) {
                if (typeof interval === 'number') {
                    this.options.interval = interval;
                } else {
                    throw 'setCompInterval: Argument was not a number.';
                }
            },

            setCollisions: function(state) {
                if (typeof state === 'boolean') {
                    this.options.collisions = state;
                } else {
                    throw 'setCollisions: Argument was not boolean.';
                }
            },

            setScatterLimit: function(limit) {
                if (typeof limit === 'number') {
                    this.options.scatterLimit = limit;
                } else {
                    throw 'setScatterLimit: Argument was not a number.';
                }
            },

            setPaths: function(paths) {
                this.graphics.setPaths(paths);
            },

            togglePaths: function() {
                this.graphics.togglePaths();
            },

            _run: function() {
                for (var i = 0; i < this.bodies.length; i++) {
                    if (this.options.collisions === true) {
                        this._detectCollision(this.bodies[i], i);
                    }

                    this._calculateNewPosition(this.bodies[i], i, this.options.deltaT);

                    this._removeScattered(this.bodies[i], i);
                }

                this.time += this.options.deltaT; // Increment runtime
                this.graphics.draw(this.bodies);

                // Check if running flag has been lowered
                if (this.running === false) {
                    clearInterval(this.intervalId);
                    this.intervalId = 0;
                }
            },

            _calculateNewPosition: function(body, index, deltaT) {
                var netFx = 0;
                var netFy = 0;

                // Iterate through all bodies and sum the forces exerted
                for (var i = 0; i < this.bodies.length; i++) {
                    if (i !== index) {
                        var attractor = this.bodies[i];

                        // Get the distance and position deltas
                        var D = this._calculateDistance(body, attractor, true);

                        // Calculate force using Newtonian gravity, separate out into x and y components
                        var F = (this.options.G * body.mass * attractor.mass) / Math.pow(D.r, 2);
                        var Fx = F * (D.dx / D.r);
                        var Fy = F * (D.dy / D.r);

                        netFx += Fx;
                        netFy += Fy;
                    }
                }

                // Calculate accelerations
                var ax = netFx / body.mass;
                var ay = netFy / body.mass;

                // Calculate new velocities
                body.velX += deltaT * ax;
                body.velY += deltaT * ay;

                // Calculate new positions after timestep deltaT
                body.x += deltaT * body.velX;
                body.y += deltaT * body.velY;
            },

            _calculateDistance: function(body, other, full) {
                var D = {};

                // Calculate the delta in positions
                D.dx = other.x - body.x;
                D.dy = other.y - body.y;

                // Obtain the distance between the objects (hypotenuse)
                D.r = Math.sqrt(Math.pow(D.dx, 2) + Math.pow(D.dy, 2));

                if (full === true) {
                    return D;
                } else {
                    return D.r;
                }
            },

            _detectCollision: function(body, index) {
                for (var i = 0; i < this.bodies.length; i++) {
                    if (i !== index) {
                        var collider = this.bodies[i];

                        var r = this._calculateDistance(body, collider);
                        var clearance = body.radius + collider.radius;

                        if (r <= clearance) {
                            // Collision detected
                            if (this.options.logging)
                                log.write('Collision detected!!');

                        }
                    }
                }
            },

            _removeScattered: function(body, index) {
                if (body.x > this.options.scatterLimit ||
                    body.x < -this.options.scatterLimit ||
                    body.y > this.options.scatterLimit ||
                    body.y < -this.options.scatterLimit) {
                    // Remove from body collection
                    return this.bodies.remove(index);
                }
            }
        };

        if (!args)
            args = {};

        me.options = {};
        me.bodies = [];

        me.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        me.options.deltaT = args.deltaT || 25000; // Timestep
        me.options.interval = args.interval || 10; // Computation interval
        me.options.collisions = args.collision || true;
        me.options.scatterLimit = args.scatterLimit || 10000;

        me.options.logging = args.logging || true;

        me.graphics = gtGraphics(args); // Pass on the arguments to the graphics object

        return me;
    }; // end gtSimulation

    /**
     * gtData -- The data of the simulator
     */
    var gtData = function(args) {
        var me = {
            ref: undefined
        };

        if (!args)
            args = {};

        me.ref = args.sim;

        return me;
    }; // end gtData

    /**
     * gtGraphics -- The graphics object
     */
    var gtGraphics = function(args) {
        var me = {
            // Attributes
            //-----------------

            options: undefined,

            grid: undefined,

            // Functions
            //-----------------

            draw: function(bodies) {
                if (!this.options.paths) {
                    this.grid.width = this.grid.width;
                }

                if (typeof bodies !== 'undefined') {
                    var ctx = this.grid.getContext('2d');

                    for (var i = 0; i < bodies.length; i++) {
                        var body = bodies[i];

                        ctx.fillStyle = body.color;

                        ctx.beginPath();
                        ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);

                        ctx.fill();
                    }
                }
            },

            setPaths: function(paths) {
                if (typeof paths === 'boolean') {
                    this.options.paths = paths;
                } else {
                    throw 'setPaths: Argument was not boolean.';
                }
            },

            togglePaths: function() {
                this.options.paths = !this.options.paths;
            }

        };

        if (!args)
            args = {};

        me.options = {};

        me.options.paths = args.paths || false;

        me.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;
        if (typeof me.grid === 'undefined') {
            throw 'No usable canvas element was found.';
        }

        return me;
    }; // end gtGraphics

    /**
     * gtBody -- The gravitational body
     */
    var gtBody = function(args) {
        var me = {
            // Attributes
            //-----------------

            x: 0,
            y: 0,

            velX: 0,
            velY: 0,

            mass: 0,
            radius: 0,
            color: '',

            // Functions
            //-----------------

            setColor: function(color) {
                if (typeof color === 'string') {
                    this.color = color;
                } else {
                    throw 'setColor: Argument was not a string.';
                }
            },

            setRadius: function(radius) {
                if (typeof radius === 'number') {
                    this.radius = radius;
                } else {
                    throw 'setRadius: Argument was not a number.';
                }
            }
        };

        if (!args)
            args = {};

        me.x = args.x;
        me.y = args.y;
        if (typeof me.x !== 'number' || typeof me.y !== 'number') {
            throw 'Correct positions were not given for the body.';
        }

        me.velX = args.velX || 0;
        me.velY = args.velY || 0;
        me.mass = args.mass || 10;
        me.radius = args.radius || 4;

        me.color = args.color || '#FFFFFF';

        return me;
    }; // end gtBody


    // Export utilities
    global.random = random;
    global.log = log;

    // Export components
    global.gt = {
        app: gtApplication,
        sim: gtSimulation,
        data: gtData,
        gfx: gtGraphics,
        body: gtBody
    };

})(this);
