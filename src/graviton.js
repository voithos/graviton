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
    }; // end Lambda library

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
    var log = (function() {
        var config = {
            logLevel: null
        };

        return {
            write: function(message, level) {
                if (typeof console !== 'undefined') {
                    var now = new Date();
                    var stamp = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + 'T' +
                        now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ':' + now.getMilliseconds();

                    message = stamp + ' ' + message;

                    level = (level || config.logLevel || 'debug').toLowerCase();

                    if (console[level]) {
                        console[level](message);
                    } else {
                        throw new TypeError('Log level does not exist.');
                    }
                }
            },

            setLevel: function(level) {
                level = level.toLowerCase();

                if (console[level]) {
                    config.logLevel = level;
                } else {
                    throw new TypeError('Log level does not exist.');
                }
            }
        };
    })() // end log

    //==================================================


    /**
     * gtApplication -- The interactive graviton application
     */
    var gtApplication = function(args) {
        var me = {
            // Attributes
            //-----------------

            version: '@VERSION',
            options: null,
            sim: null,
            grid: null,
            interaction: {},

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
                this.grid.style.borderRadius = style.borderRadius || '15px';
                this.grid.style.backgroundColor = style.backgroundColor || '#000000';

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

            _redrawVector: function(args) {
                // Erase old vector, and draw new one
                this._eraseVector(args);
                this._drawVector(args);

                // Redraw body
                this.sim.graphics.drawBody(this.interaction.body);

                // Save previous location
                this.interaction.previous = args.to;
            },

            _eraseVector: function(args) {
                this.sim.graphics.drawLine({
                    strokeStyle: this.options.backgroundColor,
                    from: args.from,
                    to: this.interaction.previous
                });
            },

            _drawVector: function(args) {
                this.sim.graphics.drawLine({
                    from: args.from,
                    to: args.to
                });
            },

            _wireupEvents: function() {
                // Grid mouse events
                L.addEvent('mousedown', this.grid, L.bind(this._handleMouseDown, this));
                L.addEvent('mousemove', this.grid, L.bind(this._handleMouseMove, this));
                L.addEvent('mouseup', this.grid, L.bind(this._handleMouseUp, this));

                L.addEvent('keydown', document, L.bind(this._handleKeyDown, this));
            },

            _handleMouseDown: function(event) {
                // Add flag to signal other events
                this.interaction.started = true;

                // Calculate offset on the grid from clientX/Y, because
                // some browsers don't have event.offsetX/Y
                var eventX = event.clientX - this.grid.offsetLeft,
                    eventY = event.clientY - this.grid.offsetTop;

                this.interaction.body = this.sim.addNewBody({
                    x: eventX,
                    y: eventY
                });

                this.interaction.previous = {
                    x: eventX,
                    y: eventY
                };
            },

            _handleMouseMove: function(event) {
                if (this.interaction.started) {
                    this._redrawVector({
                        from: {
                            x: this.interaction.body.x,
                            y: this.interaction.body.y
                        },
                        to: {
                            x: event.offsetX,
                            y: event.offsetY
                        }
                    });
                }
            },

            _handleMouseUp: function(event) {
                if (this.interaction.started) {
                    this.interaction.started = false;
                    
                    var x = event.offsetX,
                        y = event.offsetY,
                        body = this.interaction.body;

                    body.velX = (x - body.x) * 0.0000001;
                    body.velY = (y - body.y) * 0.0000001;

                    this.sim.redraw();
                }
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

            running: false,
            intervalId: 0,
            time: 0,
            options: null,
            bodies: null,
            graphics: null,

            // Functions
            //-----------------

            addNewBody: function(args) {
                var body = gtBody(args);
                var newIndex = this.bodies.push(body);
                this.graphics.clear();
                this.graphics.drawBodies(this.bodies);

                return body;
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

            redraw: function() {
                this.graphics.clear();
                this.graphics.drawBodies(this.bodies);
            },

            clear: function() {
                this.bodies.length = 0; // Remove all bodies from collection
                this.stop();
                this.options.trails = false; // Turn off trails
                this.graphics.clear(); // Clear grid
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
                this.graphics.clear();
                this.graphics.drawBodies(this.bodies);

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
            ref: null
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

            options: null,
            grid: null,
            ctx: null,

            // Functions
            //-----------------

            clear: function() {
                if (!this.options.trails) {
                    // Setting the width has the side effect
                    // of clearing the canvas
                    this.grid.width = this.grid.width;
                }
            },
                    
            drawBodies: function(bodies) {
                for (var i = 0; i < bodies.length; i++) {
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
        me.ctx = me.grid.getContext('2d');

        if (typeof me.grid === 'undefined') {
            throw new TypeError('No usable canvas element was found.');
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
            color: ''

            // Functions
            //-----------------
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
