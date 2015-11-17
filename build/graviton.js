(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _app = require('./graviton/app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { app: _app2.default }; /**
                                           * graviton v@VERSION
                                           *
                                           * JavaScript N-body Gravitational Simulator
                                           *
                                           * Copyright (c) 2015 Zaven Muradyan
                                           * Licensed under the MIT license
                                           *
                                           * Revision:
                                           *  @REVISION
                                           */

},{"./graviton/app":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (args) {
    var self = {
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
        main: function main() {
            // Event processing
            //--------------------
            var eventcodes = this.events.eventcodes;

            this.events.qget().forEach(function (event) {
                var retval;

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
                                retval = false;
                                break;

                            case keycodes.K_P:
                                // Toggle trails
                                this.gfx.noclear = !this.gfx.noclear;
                                break;

                            case keycodes.K_R:
                                // Generate random objects
                                this.generateBodies(10, { randomColors: true });
                                break;

                            case keycodes.K_T:
                                this.sim.addNewBody({ x: this.options.width / 2, y: this.options.height / 2, velX: 0, velY: 0, mass: 2000, radius: 50, color: '#5A5A5A' });
                                this.sim.addNewBody({ x: this.options.width - 400, y: this.options.height / 2, velX: 0, velY: 0.000025, mass: 1, radius: 5, color: '#787878' });
                                break;
                        }
                        break; // end KEYDOWN
                }

                return retval;
            }, this);

            // Redraw screen
            this.redraw();
        },

        initComponents: function initComponents() {
            // Create components -- order is important
            this.timer = args.timer = (0, _timer2.default)(args);
            this.events = args.events = (0, _events2.default)(args);
            this.sim = (0, _sim2.default)(args);
            this.gfx = (0, _gfx2.default)(args);
        },

        initTimers: function initTimers() {
            // Add `main` loop, and start immediately
            this.timer.addCallback(this.main, this, 30, { autostart: true, nostop: true });
            this.timer.addCallback(this.sim.step, this.sim, 30);
        },

        start: function start() {
            this.timer.start();
        },

        stop: function stop() {
            this.timer.stop();
        },

        toggle: function toggle() {
            this.timer.toggle();
        },

        redraw: function redraw() {
            this.gfx.clear();
            this.gfx.drawBodies(this.sim.bodies);
        },

        generateGrid: function generateGrid(width, height, style, target) {
            // Attach a canvas to the page, to house the simulations
            if (!style) {
                style = {};
            }

            this.grid = document.createElement('canvas');

            this.grid.width = width;
            this.grid.height = height;
            this.grid.style.display = 'block';
            this.grid.style.marginLeft = style.marginLeft || 'auto';
            this.grid.style.marginRight = style.marginRight || 'auto';
            this.grid.style.backgroundColor = style.backgroundColor || '#000000';

            if (target) {
                target.appendChild(this.grid);
            } else {
                document.body.appendChild(this.grid);
            }
        },

        generateBodies: function generateBodies(num, args) {
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
                    color = _random2.default.color();
                }

                this.sim.addNewBody({
                    x: _random2.default.number(minX, maxX),
                    y: _random2.default.number(minY, maxY),
                    velX: _random2.default.directional(minVelX, maxVelX),
                    velY: _random2.default.directional(minVelY, maxVelY),
                    mass: _random2.default.number(minMass, maxMass),
                    radius: _random2.default.number(minRadius, maxRadius),
                    color: color
                });
            }
        },

        redrawVector: function redrawVector(args) {
            // Erase old vector, and draw new one
            this.eraseVector(args);
            this.drawVector(args);

            // Redraw body
            this.gfx.drawBody(this.interaction.body);

            // Save previous location
            this.interaction.previous = args.to;
        },

        eraseVector: function eraseVector(args) {
            this.gfx.drawLine({
                strokeStyle: this.options.backgroundColor,
                from: args.from,
                to: this.interaction.previous
            });
        },

        drawVector: function drawVector(args) {
            this.gfx.drawLine({
                from: args.from,
                to: args.to
            });
        }
    };

    args = args || {};

    // Process arguments
    //------------------
    self.options.width = args.width || window.innerWidth;
    self.options.height = args.height || window.innerHeight;
    self.options.backgroundColor = args.backgroundColor || '#1F263B';

    // Retrieve canvas, or build one with arguments
    self.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

    if (typeof self.grid === 'undefined') {
        self.generateGrid(self.options.width, self.options.height, { backgroundColor: self.options.backgroundColor });

        // Update grid argument
        args.grid = self.grid;
    }

    // Initialize
    self.initComponents();
    self.initTimers();

    return self;
};

var _random = require('../util/random');

var _random2 = _interopRequireDefault(_random);

var _sim = require('./sim');

var _sim2 = _interopRequireDefault(_sim);

var _gfx = require('./gfx');

var _gfx2 = _interopRequireDefault(_gfx);

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _timer = require('./timer');

var _timer2 = _interopRequireDefault(_timer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

; // end graviton/app
/**
 * graviton/app -- The interactive graviton application
 */

},{"../util/random":10,"./body":3,"./events":4,"./gfx":5,"./sim":6,"./timer":7}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (args) {
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
};

; // end graviton/body
/**
 * graviton/body -- The gravitational body
 */

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (args) {
    var self = {
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

        qadd: function qadd(event) {
            this.queue.push(event);
        },

        qpoll: function qpoll() {
            return this.queue.shift();
        },

        qget: function qget() {
            // Replacing the reference is faster than `splice()`
            var ref = this.queue;
            this.queue = [];
            return ref;
        },

        qclear: function qclear() {
            this.queue = [];
        },

        wireupEvents: function wireupEvents() {
            // Grid mouse events
            this.grid.addEventListener('click', this.handleClick.bind(this));
            this.grid.addEventListener('dblclick', this.handleDblClick.bind(this));

            this.grid.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.grid.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.grid.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.grid.addEventListener('mousewheel', this.handleMouseWheel.bind(this));
            // Firefox-specific DOM scroll
            this.grid.addEventListener('DOMMouseScroll', this.handleMouseWheel.bind(this));

            // Grid key events
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this));
        },

        handleClick: function handleClick(event) {
            this.qadd({
                type: this.eventcodes.CLICK,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        },

        handleDblClick: function handleDblClick(event) {
            _log2.default.write('Double click: ' + event.button, 'debug');

            this.qadd({
                type: this.eventcodes.DBLCLICK,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        },

        handleMouseDown: function handleMouseDown(event) {
            _log2.default.write('Mouse down: ' + event.button, 'debug');

            this.qadd({
                type: this.eventcodes.MOUSEDOWN,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        },

        handleMouseUp: function handleMouseUp(event) {
            _log2.default.write('Mouse up: ' + event.button, 'debug');

            this.qadd({
                type: this.eventcodes.MOUSEUP,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        },

        handleMouseMove: function handleMouseMove(event) {
            this.qadd({
                type: this.eventcodes.MOUSEMOVE,
                position: this.getPosition(event),
                timestamp: event.timeStamp
            });
        },

        handleMouseWheel: function handleMouseWheel(event) {
            // Account for discrepancies between Firefox and Webkit
            var delta = event.wheelDelta ? event.wheelDelta / 120 : event.detail / -3;

            _log2.default.write('Scroll delta: ' + delta, 'debug');

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

        handleKeyDown: function handleKeyDown(event) {
            // Account for browser discrepancies
            var key = event.keyCode || event.which;

            _log2.default.write('Key down: ' + key, 'debug');

            this.qadd({
                type: this.eventcodes.KEYDOWN,
                keycode: key,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        },

        handleKeyUp: function handleKeyUp(event) {
            // Account for browser discrepancies
            var key = event.keyCode || event.which;

            _log2.default.write('Key up: ' + key, 'debug');

            this.qadd({
                type: this.eventcodes.KEYUP,
                keycode: key,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        },

        getPosition: function getPosition(event) {
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
    self.grid = args.grid;

    self.wireupEvents();

    return self;
};

var _log = require('../util/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * graviton/events -- Event queueing and processing
 */
; // end graviton/events

},{"../util/log":9}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (args) {
    var self = {
        // Attributes
        //-----------------

        options: {},
        grid: null,
        ctx: null,

        // Functions
        //-----------------

        clear: function clear() {
            // Setting the width has the side effect
            // of clearing the canvas
            this.grid.width = this.grid.width;
        },

        drawBodies: function drawBodies(bodies) {
            for (var i = 0; i < bodies.length; i++) {
                this.drawBody(bodies[i]);
            }
        },

        drawBody: function drawBody(body) {
            this.ctx.fillStyle = body.color;

            this.ctx.beginPath();
            this.ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);

            this.ctx.fill();
        },

        drawLine: function drawLine(args) {
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
        throw new TypeError('No usable canvas element was given.');
    }

    return self;
};

; // end graviton/gfx
/**
 * graviton/gfx -- The graphics object
 */

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (args) {
    var self = {
        // Attributes
        //-----------------

        options: {},
        bodies: [],
        time: 0,

        // Functions
        //-----------------

        step: function step() {
            this.bodies.forEach(function (body, i) {
                if (this.options.collisions === true) {
                    this.detectCollision(this.bodies[i], i);
                }

                this.calculateNewPosition(body, i, this.options.deltaT);

                this.removeScattered(body, i);
            }, this);

            this.time += this.options.deltaT; // Increment runtime
        },

        calculateNewPosition: function calculateNewPosition(body, index, deltaT) {
            var netFx = 0;
            var netFy = 0;

            // Iterate through all bodies and sum the forces exerted
            this.bodies.forEach(function (attractor, i) {
                if (i !== index) {
                    // Get the distance and position deltas
                    var D = this.calculateDistance(body, attractor);

                    // Calculate force using Newtonian gravity, separate out into x and y components
                    var F = this.options.G * body.mass * attractor.mass / Math.pow(D.r, 2);
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

        calculateDistance: function calculateDistance(body, other) {
            var D = {};

            // Calculate the change in position along the two dimensions
            D.dx = other.x - body.x;
            D.dy = other.y - body.y;

            // Obtain the distance between the objects (hypotenuse)
            D.r = Math.sqrt(Math.pow(D.dx, 2) + Math.pow(D.dy, 2));

            return D;
        },

        detectCollision: function detectCollision(body, index) {
            this.bodies.forEach(function (collider, i) {
                if (i !== index) {
                    var r = this.calculateDistance(body, collider).r;
                    var clearance = body.radius + collider.radius;

                    if (r <= clearance) {
                        // Collision detected
                        _log2.default.write('Collision detected!!', 'debug');
                    }
                }
            }, this);
        },

        removeScattered: function removeScattered(body, index) {
            if (body.x > this.options.scatterLimit || body.x < -this.options.scatterLimit || body.y > this.options.scatterLimit || body.y < -this.options.scatterLimit) {
                // Remove from body collection
                return this.bodies.splice(index, 1);
            }
        },

        addNewBody: function addNewBody(args) {
            var body = (0, _body2.default)(args);
            this.bodies.push(body);

            return body;
        },

        removeBody: function removeBody(index) {
            this.bodies.splice(index, 1);
        },

        clear: function clear() {
            this.bodies.length = 0; // Remove all bodies from collection
        }
    };

    args = args || {};

    // Process arguments
    //------------------
    self.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
    self.options.deltaT = args.deltaT || 25000; // Timestep
    self.options.collisions = args.collision || true;
    self.options.scatterLimit = args.scatterLimit || 10000;

    return self;
};

var _log = require('../util/log');

var _log2 = _interopRequireDefault(_log);

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

; // end graviton/sim
/**
 * graviton/sim -- The gravitational simulator
 */

},{"../util/log":9,"./body":3}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (args) {
    var self = {
        // Attributes
        //-----------------

        options: {},
        callbacks: [],
        running: false,

        // Functions
        //------------------

        addCallback: function addCallback(func, context, fps, options) {
            fps = fps || this.options.defaultFps;
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
                callback.intervalId = setInterval(callback.fn.bind(callback.context), callback.delay);
                callback.started = true;
            }
        },

        removeCallback: function removeCallback(func) {
            for (var i = 0; i < this.callbacks.length; i++) {
                var callback = this.callbacks[i];
                if (callback.fn === func) {
                    clearInterval(callback.intervalId);
                    this.callbacks.splice(i, 1);
                    break;
                }
            }
        },

        start: function start() {
            this.running = true;

            this.callbacks.forEach(function (callback) {
                if (!callback.started) {
                    callback.intervalId = setInterval(callback.fn.bind(callback.context), callback.delay);
                    callback.started = true;
                }
            });
        },

        stop: function stop() {
            this.running = false;

            this.callbacks.forEach(function (callback) {
                if (!callback.nostop) {
                    clearInterval(callback.intervalId);
                    callback.intervalId = null;
                    callback.started = false;
                }
            });
        },

        toggle: function toggle() {
            if (this.running) {
                this.stop();
            } else {
                this.start();
            }
        }
    };

    self.options.defaultFps = args.defaultFps || 30;

    return self;
};

; // end graviton/timer
/**
 * graviton/timer -- Sim timer and FPS limiter
 */

},{}],8:[function(require,module,exports){
'use strict';

var _graviton = require('./graviton');

var _graviton2 = _interopRequireDefault(_graviton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.onload = function () {
    // Start the main graviton app.
    window.graviton = _graviton2.default.app();
};

},{"./graviton":1}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * log -- Logging functions
 */
exports.default = {
    config: {
        logLevel: null
    },

    write: function write(message, level) {
        if (typeof console !== 'undefined') {
            var now = new Date();
            var stamp = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + 'T' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ':' + now.getMilliseconds();

            message = stamp + ' ' + message;

            level = (level || this.config.logLevel || 'debug').toLowerCase();

            // Write to console -- currently, `log`, `debug`, `info`, `warn`, and `error`
            // are available
            if (console[level]) {
                console[level](message);
            } else {
                throw new TypeError('Log level does not exist.');
            }
        }
    },

    setLevel: function setLevel(level) {
        level = level.toLowerCase();

        if (console[level]) {
            config.logLevel = level;
        } else {
            throw new TypeError('Log level does not exist.');
        }
    }
};

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * random -- A collection of random generator functions
 */
exports.default = {
    /**
     * random.number -- Generate a random number between the given start
     * and end points
     */
    number: function number(from, to) {
        if (arguments.length === 1) {
            to = from;
            from = 0;
        }

        return Math.random() * (to - from) + from;
    },

    /**
     * random.integer -- Generate a random integer between the given
     * positions
     */
    integer: function integer() {
        return Math.round(this.number.apply(this, arguments));
    },

    /**
     * random.directional -- Generate a random number, with a random sign,
     * between the given positions
     */
    directional: function directional() {
        var rand = this.number.apply(this, arguments);
        if (Math.random() > 0.5) {
            rand = -rand;
        }

        return rand;
    },

    /**
     * random.color -- Generate a random hexadecimal color
     */
    color: function color() {
        return '#' + ('00000' + Math.floor(Math.random() * 0xffffff).toString(16)).substr(-6);
    }
};

},{}]},{},[8]);
