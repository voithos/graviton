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

    // Utility functions
    //==================================================

    /**
     * Lambda library -- Collection of utility functions
     */
    var L = {
        /**
         * bind -- Allow a specific object to be carried
         * with a function reference as the execution context
         */
        bind: function(fn, context) {
            return function() {
                return fn.apply(context, arguments);
            };
        },

        /**
         * remove -- Remove a given element from an array
         */
        remove: function(arr, start, count) {
            return arr.splice(start, count ? count : 1);
        },

        /**
         * addEvent -- Attach an event handler to an element
         */
        addEvent: function(event, el, fn) {
            if (el.addEventListener) {
                el.addEventListener(event, fn, false);
            } else if (el.attachEvent) {
                el.attachEvent('on' + event, method);
            }
        },

        /**
         * width -- Get the width of an element
         */
        width: function(el) {
            // Get window width
            if (el == el.window) {
                return el.document.documentElement.clientWidth;
            }

            // Get document width
            if (el.nodeType === 9) {
                var doc = el.documentElement;

                return Math.max(
                    el.body.scrollWidth, doc.scrollWidth,
                    el.body.offsetWidth, doc.offsetWidth,
                    doc.clientWidth
                );
            }
        },

        /**
         * height -- Get the height of an element
         */
        height: function(el) {
            // Get window height
            if (el == el.window) {
                return el.document.documentElement.clientHeight;
            }

            // Get document height
            if (el.nodeType === 9) {
                var doc = el.documentElement;

                return Math.max(
                    el.body.scrollHeight, doc.scrollHeight,
                    el.body.offsetHeight, doc.offsetHeight,
                    doc.clientHeight
                );
            }
        }
    };

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

    //==================================================


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

            _generateGrid: function(width, height, style, target) {
                // Attach a canvas to the page, to house the simulations
                if (!style)
                    style = {}

                this.grid = document.createElement('canvas');

                this.grid.width = width;
                this.grid.height = height;
                this.grid.style.display = 'block';
                this.grid.style.marginLeft = style.marginLeft || 'auto';
                this.grid.style.marginRight = style.marginRight || 'auto';
                this.grid.style.borderStyle = style.borderStyle || 'solid';
                this.grid.style.borderWidth = style.borderWidth || 'medium';
                this.grid.style.borderColor = style.borderColor || '#CCCCCC';
                this.grid.style.backgroundColor = style.backgroundColor || backgroundColor;

                if (target) {
                    target.appendChild(this.grid);
                } else {
                    document.body.appendChild(this.grid);
                }
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
                        color = random.color();
                    }

                    this.sim.addNewBody({
                        x: random.number(minX, maxX),
                        y: random.number(minY, maxY),
                        velX: random.directional(minVelX, maxVelX),
                        velY: random.directional(minVelY, maxVelY),
                        mass: random.number(minMass, maxMass),
                        radius: random.number(minRadius, maxRadius),
                        color: color
                    });
                }
            },

            _wireupEvents: function() {
                L.addEvent('mousedown', this.grid, L.bind(this._handleClick, this));
                L.addEvent('keydown', document, L.bind(this._handleKeyDown, this));
            },

            _handleClick: function(event) {
                this.sim.addNewBody({
                    x: event.clientX - this.grid.offsetLeft,
                    y: event.clientY - this.grid.offsetTop
                });
            },

            _handleKeyDown: function(event) {
                switch (event.which) {
                    // 'Enter'
                    case 13:
                        // Start or stop simulation
                        this.sim.toggle();
                        break;

                    // 'C'
                    case 67:
                        // Clear simulation
                        this.sim.clear();
                        break;

                    // 'P'
                    case 80:
                        // Toggle trails
                        this.sim.graphics.toggleTrails();
                        break;

                    // 'R'
                    case 82:
                        // Generate random objects
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

        me.options.width = args.width || L.width(document) * 0.95;
        me.options.height = args.height || L.height(document) * 0.95;
        me.options.backgroundColor = args.backgroundColor || '#1F263B';

        me.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

        if (typeof me.grid === 'undefined') {
            me._generateGrid(me.options.width, me.options.height, {backgroundColor: me.options.backgroundColor});

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

            version: '@VERSION',

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
                L.remove(this.bodies, index);
            },

            start: function() {
                if (!this.running) {
                    this.running = true;
                    this.intervalId = setInterval(L.bind(this._run, this), this.options.interval);
                }
            },

            stop: function() {
                this.running = false;
            },

            toggle: function() {
                if (!this.running) {
                    this.start();
                } else {
                    this.stop();
                }
            },

            clear: function() {
                this.bodies.length = 0; // Remove all bodies from collection
                this.stop();
                this.options.trails = false; // Turn off trails
                this.graphics.draw(); // Clear grid
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
                    return L.remove(this.bodies, index);
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
                if (!this.options.trails) {
                    // Setting the width has the side effect
                    // of clearing the canvas
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

            toggleTrails: function() {
                this.options.trails = !this.options.trails;
            }
        };

        if (!args)
            args = {};

        me.options = {};

        me.options.trails = args.trails || false;

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
    global.L = L;
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
