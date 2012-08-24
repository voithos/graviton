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
    'use strict';

    // Utility functions
    //==================================================

    /**
     * Lambda library -- Collection of utility functions
     */
    var L = {
        /**
         * isArray -- Test if an object is an array
         */
        isArray: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },

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
         * foreach -- Iterate through a collection (array or object) using an
         * iterator function
         */
        foreach: function(obj, fn, context) {
            var returned;

            // Use native `forEach` if available
            if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
                obj.forEach(fn, context);
            } else if (L.isArray(obj)) {
                // Loop through arrays
                for (var i = 0; i < obj.length; i++) {
                    returned = iterator.call(context, obj[i], i, obj);

                    // Break if signaled
                    if (returned === false) {
                        return;
                    }
                }
            } else {
                // Assume object
                for (var key in obj) {
                    returned = iterator.call(context, obj[key], key, obj);

                    // Break if signaled
                    if (returned === false) {
                        return;
                    }
                }
            }
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

                    // Write to console -- currently, `log`, `debug`, `info`, `warn`, and `error`
                    // are available
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
    })(); // end log

    //==================================================


    /**
     * gtApplication -- The interactive graviton application
     */
    var gtApplication = function(args) {
        var me = {
            // Attributes
            //-----------------

            version: '@VERSION',
            options: {},
            grid: null,

            events: null,
            timer: null,

            sim: null,
            gfx: null,

            interaction: {},

            // Functions
            //------------------

            /**
             * main -- Main 'game' loop
             */
            main: function() {
                // Event processing
                //--------------------
                var eventcodes = this.events.eventcodes;

                L.foreach(this.events.qget(), function(event, i) {
                    switch (event.type) {
                        case eventcodes.MOUSEDOWN:
                            // Add flag to signal other events
                            this.interaction.started = true;

                            this.interaction.body = this.sim.addNewBody({
                                x: event.position.x,
                                y: event.position.y
                            });

                            this.interaction.previous = {
                                x: event.position.x,
                                y: event.position.y
                            };
                            break; // end MOUSEDOWN

                        case eventcodes.MOUSEUP:
                            if (this.interaction.started) {
                                this.interaction.started = false;

                                var body = this.interaction.body;

                                body.velX = (event.position.x - body.x) * 0.0000001;
                                body.velY = (event.position.y - body.y) * 0.0000001;
                            }
                            break;

                        case eventcodes.MOUSEMOVE:
                            if (this.interaction.started) {
                                this.redrawVector({
                                    from: {
                                        x: this.interaction.body.x,
                                        y: this.interaction.body.y
                                    },
                                    to: {
                                        x: event.position.x,
                                        y: event.position.y
                                    }
                                });
                            }
                            break; // end MOUSEMOVE

                        case eventcodes.MOUSEWHEEL:
                            break; // end MOUSEWHEEL

                        case eventcodes.KEYDOWN:
                            var keycodes = this.events.keycodes;

                            switch (event.keycode) {
                                case keycodes.K_ENTER:
                                    // Start or stop simulation
                                    this.toggle();
                                    break;

                                case keycodes.K_C:
                                    // Clear simulation
                                    this.sim.clear();
                                    this.gfx.clear();
                                    this.timer.stop();
                                    return false;
                                    break;

                                case keycodes.K_P:
                                    // Toggle trails
                                    this.gfx.noclear = !this.gfx.noclear;
                                    break;

                                case keycodes.K_R:
                                    // Generate random objects
                                    this.generateBodies(10, {randomColors: true});
                                    break;

                                case keycodes.K_T:
                                    this.sim.addNewBody({x: this.options.width / 2, y: this.options.height / 2, velX: 0, velY: 0, mass: 2000, radius: 50, color: '#5A5A5A'});
                                    this.sim.addNewBody({x: this.options.width - 400, y: this.options.height / 2, velX: 0, velY: 0.000025, mass: 1, radius: 5, color: '#787878'});
                                    break;
                            }
                            break; // end KEYDOWN
                    }
                }, this);

                // Redraw screen
                this.redraw();
            },

            initComponents: function() {
                // Create components -- order is important
                this.timer = args.timer = gtTimer(args);
                this.events = args.events = gtEvents(args);
                this.sim = gtSimulation(args);
                this.gfx = gtGraphics(args);
            },

            initTimers: function() {
                // Add `main` loop, and start immediately
                this.timer.addCallback(this.main, this, 30, {autostart: true, nostop: true});
                this.timer.addCallback(this.sim.step, this.sim, 30);
            },

            start: function() {
                this.timer.start();
            },

            stop: function() {
                this.timer.stop();
            },

            toggle: function() {
                this.timer.toggle();
            },

            redraw: function() {
                this.gfx.clear();
                this.gfx.drawBodies(this.sim.bodies);
            },

            generateGrid: function(width, height, style, target) {
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

            generateBodies: function(num, args) {
                args = args || {};

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

            redrawVector: function(args) {
                // Erase old vector, and draw new one
                this.eraseVector(args);
                this.drawVector(args);

                // Redraw body
                this.gfx.drawBody(this.interaction.body);

                // Save previous location
                this.interaction.previous = args.to;
            },

            eraseVector: function(args) {
                this.gfx.drawLine({
                    strokeStyle: this.options.backgroundColor,
                    from: args.from,
                    to: this.interaction.previous
                });
            },

            drawVector: function(args) {
                this.gfx.drawLine({
                    from: args.from,
                    to: args.to
                });
            }
        };

        args = args || {};

        // Process arguments
        //------------------
        me.options.width = args.width || L.width(document) * 0.95;
        me.options.height = args.height || L.height(document) * 0.95;
        me.options.backgroundColor = args.backgroundColor || '#1F263B';

        // Retrieve canvas, or build one with arguments
        me.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

        if (typeof me.grid === 'undefined') {
            me.generateGrid(me.options.width, me.options.height, {backgroundColor: me.options.backgroundColor});

            // Update grid argument
            args.grid = me.grid;
        }

        // Initialize
        me.initComponents();
        me.initTimers();

        return me;
    }; // end gtApplication

    /**
     * gtSimulation -- The gravitational simulator
     */
    var gtSimulation = function(args) {
        var me = {
            // Attributes
            //-----------------

            options: {},
            bodies: [],
            time: 0,

            // Functions
            //-----------------

            step: function() {
                L.foreach(this.bodies, function(body, i) {
                    if (this.options.collisions === true) {
                        this.detectCollision(this.bodies[i], i);
                    }

                    this.calculateNewPosition(body, i, this.options.deltaT);

                    this.removeScattered(body, i);
                }, this);

                this.time += this.options.deltaT; // Increment runtime
            },

            calculateNewPosition: function(body, index, deltaT) {
                var netFx = 0;
                var netFy = 0;

                // Iterate through all bodies and sum the forces exerted
                L.foreach(this.bodies, function(attractor, i) {
                    if (i !== index) {
                        // Get the distance and position deltas
                        var D = this.calculateDistance(body, attractor);

                        // Calculate force using Newtonian gravity, separate out into x and y components
                        var F = (this.options.G * body.mass * attractor.mass) / Math.pow(D.r, 2);
                        var Fx = F * (D.dx / D.r);
                        var Fy = F * (D.dy / D.r);

                        netFx += Fx;
                        netFy += Fy;
                    }
                }, this);

                // Calculate accelerations
                var ax = netFx / body.mass;
                var ay = netFy / body.mass;

                // Calculate new velocities, normalized by the 'time' interval
                body.velX += deltaT * ax;
                body.velY += deltaT * ay;

                // Calculate new positions after timestep deltaT
                body.x += deltaT * body.velX;
                body.y += deltaT * body.velY;
            },

            calculateDistance: function(body, other) {
                var D = {};

                // Calculate the change in position along the two dimensions
                D.dx = other.x - body.x;
                D.dy = other.y - body.y;

                // Obtain the distance between the objects (hypotenuse)
                D.r = Math.sqrt(Math.pow(D.dx, 2) + Math.pow(D.dy, 2));

                return D;
            },

            detectCollision: function(body, index) {
                L.foreach(this.bodies, function(collider, i) {
                    if (i !== index) {
                        var r = this.calculateDistance(body, collider).r;
                        var clearance = body.radius + collider.radius;

                        if (r <= clearance) {
                            // Collision detected
                            log.write('Collision detected!!', 'debug');
                        }
                    }
                }, this);
            },

            removeScattered: function(body, index) {
                if (body.x > this.options.scatterLimit ||
                    body.x < -this.options.scatterLimit ||
                    body.y > this.options.scatterLimit ||
                    body.y < -this.options.scatterLimit) {
                    // Remove from body collection
                    return L.remove(this.bodies, index);
                }
            },

            addNewBody: function(args) {
                var body = gtBody(args);
                var newIndex = this.bodies.push(body);

                return body;
            },

            removeBody: function(index) {
                L.remove(this.bodies, index);
            },

            clear: function() {
                this.bodies.length = 0; // Remove all bodies from collection
            }
        };

        args = args || {};

        // Process arguments
        //------------------
        me.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        me.options.deltaT = args.deltaT || 25000; // Timestep
        me.options.collisions = args.collision || true;
        me.options.scatterLimit = args.scatterLimit || 10000;

        return me;
    }; // end gtSimulation

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

        args = args || {};

        // Process arguments
        //------------------
        me.x = args.x;
        me.y = args.y;
        if (typeof me.x !== 'number' || typeof me.y !== 'number') {
            throw new TypeError('Correct positions were not given for the body.');
        }

        me.velX = args.velX || 0;
        me.velY = args.velY || 0;
        me.mass = args.mass || 10;
        me.radius = args.radius || 4;

        me.color = args.color || '#FFFFFF';

        return me;
    }; // end gtBody

    /**
     * gtGraphics -- The graphics object
     */
    var gtGraphics = function(args) {
        var me = {
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
            }
        };

        args = args || {};

        // Process arguments
        //------------------
        me.options.noclear = args.noclear || false;

        me.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;
        me.ctx = me.grid.getContext('2d');

        if (typeof me.grid === 'undefined') {
            throw new TypeError('No usable canvas element was given.');
        }

        return me;
    }; // end gtGraphics

    /**
     * gtEvents -- Event queueing and processing
     */
    var gtEvents = function(args) {
        var me = {
            // Constants
            //-----------------

            keycodes: {
                K_LEFT: 37,
                K_UP: 38,
                K_RIGHT: 39,
                K_DOWN: 40,

                K_0: 48,
                K_1: 49,
                K_2: 50,
                K_3: 51,
                K_4: 52,
                K_5: 53,
                K_6: 54,
                K_7: 55,
                K_8: 56,
                K_9: 57,

                K_A: 65,
                K_B: 66,
                K_C: 67,
                K_D: 68,
                K_E: 69,
                K_F: 70,
                K_G: 71,
                K_H: 72,
                K_I: 73,
                K_J: 74,
                K_K: 75,
                K_L: 76,
                K_M: 77,
                K_N: 78,
                K_O: 79,
                K_P: 80,
                K_Q: 81,
                K_R: 82,
                K_S: 83,
                K_T: 84,
                K_U: 85,
                K_V: 86,
                K_W: 87,
                K_X: 88,
                K_Y: 89,
                K_Z: 90,

                K_KP1: 97,
                K_KP2: 98,
                K_KP3: 99,
                K_KP4: 100,
                K_KP5: 101,
                K_KP6: 102,
                K_KP7: 103,
                K_KP8: 104,
                K_KP9: 105,

                K_BACKSPACE: 8,
                K_TAB: 9,
                K_ENTER: 13,
                K_SHIFT: 16,
                K_CTRL: 17,
                K_ALT: 18,
                K_ESC: 27,
                K_SPACE: 32
            },

            mousecodes: {
                M_LEFT: 0,
                M_MIDDLE: 1,
                M_RIGHT: 2
            },

            eventcodes: {
                MOUSEDOWN: 1000,
                MOUSEUP: 1001,
                MOUSEMOVE: 1002,
                MOUSEWHEEL: 1003,
                CLICK: 1004,
                DBLCLICK: 1005,

                KEYDOWN: 1010,
                KEYUP: 1011
            },

            // Attributes
            //-----------------

            queue: [],
            grid: null,

            // Functions
            //------------------

            qadd: function(event) {
                this.queue.push(event);
            },

            qpoll: function() {
                return this.queue.shift();
            },

            qget: function() {
                // Replacing the reference is faster than `splice()`
                var ref = this.queue;
                this.queue = [];
                return ref;
            },

            qclear: function() {
                this.queue = [];
            },

            wireupEvents: function() {
                // Grid mouse events
                L.addEvent('click', this.grid, L.bind(this.handleClick, this));
                L.addEvent('dblclick', this.grid, L.bind(this.handleDblClick, this));

                L.addEvent('mousedown', this.grid, L.bind(this.handleMouseDown, this));
                L.addEvent('mouseup', this.grid, L.bind(this.handleMouseUp, this));
                L.addEvent('mousemove', this.grid, L.bind(this.handleMouseMove, this));
                L.addEvent('mousewheel', this.grid, L.bind(this.handleMouseWheel, this));
                // Firefox-specific DOM scroll
                L.addEvent('DOMMouseScroll', this.grid, L.bind(this.handleMouseWheel, this));

                // Grid key events
                L.addEvent('keydown', document, L.bind(this.handleKeyDown, this));
                L.addEvent('keyup', document, L.bind(this.handleKeyUp, this));
            },

            handleClick: function(event) {
                this.qadd({
                    type: this.eventcodes.CLICK,
                    position: this.getPosition(event),
                    button: event.button,
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    timestamp: event.timeStamp
                });
            },

            handleDblClick: function(event) {
                log.write('Double click: ' + event.button, 'debug');

                this.qadd({
                    type: this.eventcodes.DBLCLICK,
                    position: this.getPosition(event),
                    button: event.button,
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    timestamp: event.timeStamp
                });
            },

            handleMouseDown: function(event) {
                log.write('Mouse down: ' + event.button, 'debug');

                this.qadd({
                    type: this.eventcodes.MOUSEDOWN,
                    position: this.getPosition(event),
                    button: event.button,
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    timestamp: event.timeStamp
                });
            },

            handleMouseUp: function(event) {
                log.write('Mouse up: ' + event.button, 'debug');

                this.qadd({
                    type: this.eventcodes.MOUSEUP,
                    position: this.getPosition(event),
                    button: event.button,
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    timestamp: event.timeStamp
                });
            },

            handleMouseMove: function(event) {
                this.qadd({
                    type: this.eventcodes.MOUSEMOVE,
                    position: this.getPosition(event),
                    timestamp: event.timeStamp
                });
            },

            handleMouseWheel: function(event) {
                // Account for discrepancies between Firefox and Webkit
                var delta = event.wheelDelta ?
                    (event.wheelDelta / 120) :
                    (event.detail / -3);

                log.write('Scroll delta: ' + delta, 'debug');

                this.qadd({
                    type: this.eventcodes.MOUSEWHEEL,
                    position: this.getPosition(event),
                    wheeldelta: delta,
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    timestamp: event.timeStamp
                });

                // Prevent the window from scrolling
                event.preventDefault();
            },

            handleKeyDown: function(event) {
                // Account for browser discrepancies
                var key = event.keyCode || event.which;

                log.write('Key down: ' + key, 'debug');

                this.qadd({
                    type: this.eventcodes.KEYDOWN,
                    keycode: key,
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    timestamp: event.timeStamp
                });
            },

            handleKeyUp: function(event) {
                // Account for browser discrepancies
                var key = event.keyCode || event.which;

                log.write('Key up: ' + key, 'debug');

                this.qadd({
                    type: this.eventcodes.KEYUP,
                    keycode: key,
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    timestamp: event.timeStamp
                });
            },

            getPosition: function(event) {
                // Calculate offset on the grid from clientX/Y, because
                // some browsers don't have event.offsetX/Y
                return {
                    x: event.clientX - this.grid.offsetLeft,
                    y: event.clientY - this.grid.offsetTop
                };
            }
        };

        args = args || {};

        if (typeof args.grid === 'undefined') {
            throw new TypeError('No usable canvas element was given.');
        }
        me.grid = args.grid;

        me.wireupEvents();

        return me;
    }; // end gtEvents

    /**
     * gtTimer -- Sim timer and FPS limiter
     */
    var gtTimer = function(args) {
        var me = {
            // Attributes
            //-----------------

            callbacks: [],
            running: false,

            // Functions
            //------------------

            addCallback: function(func, context, fps, options) {
                fps = fps || 30;
                options = options || {};

                // Compute the delay in milliseconds
                var timeout = parseInt(1000 / fps, 10);

                var callback = {
                    fn: func,
                    context: context,
                    delay: timeout,
                    intervalId: null,
                    started: false,
                    nostop: options.nostop || false
                };
                this.callbacks.push(callback);

                // Start interval if running, or if `autostart` is given
                if (this.running || options.autostart) {
                    callback.intervalId = setInterval(L.bind(callback.fn, callback.context), callback.delay);
                    callback.started = true;
                }
            },

            removeCallback: function(func) {
                L.foreach(this.callbacks, function(callback, i) {
                    if (callback.fn === func) {
                        clearInterval(callback.intervalId);
                        L.remove(this.callbacks, i);
                        return false;
                    }
                }, this);
            },

            start: function() {
                this.running = true;

                L.foreach(this.callbacks, function(callback) {
                    if (!callback.started) {
                        callback.intervalId = setInterval(L.bind(callback.fn, callback.context), callback.delay);
                        callback.started = true;
                    }
                }, this);
            },

            stop: function() {
                this.running = false;

                L.foreach(this.callbacks, function(callback) {
                    if (!callback.nostop) {
                        clearInterval(callback.intervalId);
                        callback.intervalId = null;
                        callback.started = false;
                    }
                }, this);
            },

            toggle: function() {
                if (this.running) {
                    this.stop();
                } else {
                    this.start();
                }
            }
        };

        return me;
    };

    // Export utilities
    global.L = L;
    global.random = random;
    global.log = log;

    // Export components
    global.gt = {
        app: gtApplication,
        sim: gtSimulation,
        body: gtBody,
        gfx: gtGraphics,
        events: gtEvents,
        timer: gtTimer
    };

})(this);
