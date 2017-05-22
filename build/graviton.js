(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _app = require('./graviton/app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { app: _app2.default }; /**
                                           * graviton
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

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/app -- The interactive graviton application
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _random = require('../util/random');

var _random2 = _interopRequireDefault(_random);

var _sim = require('./sim');

var _sim2 = _interopRequireDefault(_sim);

var _gfx = require('./gfx');

var _gfx2 = _interopRequireDefault(_gfx);

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _timer = require('./timer');

var _timer2 = _interopRequireDefault(_timer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GtApp = (function () {
    function GtApp() {
        _classCallCheck(this, GtApp);

        var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.args = args;

        this.options = {};
        this.grid = null;

        this.animTimer = null;
        this.simTimer = null;

        this.events = null;
        this.sim = null;
        this.gfx = null;

        this.noclear = false;
        this.interaction = {};

        this.options.width = args.width = args.width || window.innerWidth;
        this.options.height = args.height = args.height || window.innerHeight;
        this.options.backgroundColor = args.backgroundColor || '#1F263B';

        // Retrieve canvas, or build one with arguments
        this.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

        if (typeof this.grid === 'undefined') {
            this.generateGrid(this.options.width, this.options.height, { backgroundColor: this.options.backgroundColor });
            args.grid = this.grid;
        }

        this.controls = typeof args.controls === 'string' ? document.getElementById(args.controls) : args.controls;

        if (typeof this.controls === 'undefined') {
            this.generateControls();
            args.controls = this.controls;
        }

        this.playBtn = args.playBtn = this.controls.querySelector('#playbtn');
        this.pauseBtn = args.pauseBtn = this.controls.querySelector('#pausebtn');
        this.trailOffBtn = args.trailOffBtn = this.controls.querySelector('#trailoffbtn');
        this.trailOnBtn = args.trailOnBtn = this.controls.querySelector('#trailonbtn');

        // Initialize
        this.initComponents();
        this.initTimers();
    }

    /**
     * main -- Main 'game' loop
     */

    _createClass(GtApp, [{
        key: 'main',
        value: function main() {
            // Event processing
            //--------------------
            this.events.qget().forEach(function (event) {
                var retval = undefined;

                switch (event.type) {
                    case _events.EVENTCODES.MOUSEDOWN:
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

                    case _events.EVENTCODES.MOUSEUP:
                        if (this.interaction.started) {
                            this.interaction.started = false;

                            var body = this.interaction.body;

                            body.velX = (event.position.x - body.x) * 0.0000001;
                            body.velY = (event.position.y - body.y) * 0.0000001;
                        }
                        break;

                    case _events.EVENTCODES.MOUSEMOVE:
                        if (this.interaction.started) {
                            this.interaction.previous = {
                                x: event.position.x,
                                y: event.position.y
                            };
                        }
                        break; // end MOUSEMOVE

                    case _events.EVENTCODES.MOUSEWHEEL:
                        break; // end MOUSEWHEEL

                    case _events.EVENTCODES.KEYDOWN:
                        switch (event.keycode) {
                            case _events.KEYCODES.K_ENTER:
                                this.toggleSim();
                                break;

                            case _events.KEYCODES.K_C:
                                // Clear simulation
                                this.sim.clear();
                                this.gfx.clear();
                                this.simTimer.stop();
                                retval = false;
                                break;

                            case _events.KEYCODES.K_P:
                                this.toggleTrails();
                                break;

                            case _events.KEYCODES.K_R:
                                // Generate random objects
                                this.generateBodies(10, { randomColors: true });
                                break;

                            case _events.KEYCODES.K_T:
                                this.sim.addNewBody({
                                    x: this.options.width / 2, y: this.options.height / 2,
                                    velX: 0, velY: 0,
                                    mass: 2000, radius: 50, color: '#5A5A5A'
                                });
                                this.sim.addNewBody({
                                    x: this.options.width - 400, y: this.options.height / 2,
                                    velX: 0, velY: 0.000025,
                                    mass: 1, radius: 5, color: '#787878'
                                });
                                break;
                        }
                        break; // end KEYDOWN

                    case _events.CONTROLCODES.PLAYBTN:
                        this.toggleSim();
                        break;

                    case _events.CONTROLCODES.PAUSEBTN:
                        this.toggleSim();
                        break;

                    case _events.CONTROLCODES.TRAILOFFBTN:
                        this.toggleTrails();
                        break;

                    case _events.CONTROLCODES.TRAILONBTN:
                        this.toggleTrails();
                        break;
                }

                return retval;
            }, this);

            // Redraw screen
            this.redraw();
        }
    }, {
        key: 'initComponents',
        value: function initComponents() {
            // Create components -- order is important
            this.events = this.args.events = new _events2.default(this.args);
            this.sim = new _sim2.default(this.args);
            this.gfx = new _gfx2.default(this.args);
        }
    }, {
        key: 'initTimers',
        value: function initTimers() {
            // Add `main` loop, and start immediately
            this.animTimer = new _timer2.default(this.main.bind(this));
            this.animTimer.start();
            this.simTimer = new _timer2.default(this.sim.step.bind(this.sim), 60);
        }
    }, {
        key: 'toggleSim',
        value: function toggleSim() {
            if (this.simTimer.active) {
                this.playBtn.style.display = '';
                this.pauseBtn.style.display = 'none';
            } else {
                this.playBtn.style.display = 'none';
                this.pauseBtn.style.display = '';
            }
            this.simTimer.toggle();
        }
    }, {
        key: 'toggleTrails',
        value: function toggleTrails() {
            if (this.noclear) {
                this.trailOffBtn.style.display = '';
                this.trailOnBtn.style.display = 'none';
            } else {
                this.trailOffBtn.style.display = 'none';
                this.trailOnBtn.style.display = '';
            }
            this.noclear = !this.noclear;
        }
    }, {
        key: 'redraw',
        value: function redraw() {
            if (!this.noclear) {
                this.gfx.clear();
            }
            this.drawInteraction();
            this.gfx.drawBodies(this.sim.bodies);
        }
    }, {
        key: 'generateGrid',
        value: function generateGrid(width, height, style) {
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

            document.body.appendChild(this.grid);
        }
    }, {
        key: 'generateControls',
        value: function generateControls() {
            this.controls = document.createElement('menu');
            this.controls.type = 'toolbar';
            this.controls.id = 'controls';
            this.controls.innerHTML = '\n            <menuitem id="playbtn">\n                <img src="assets/play.svg">\n            </menuitem>\n            <menuitem id="pausebtn" style="display: none;">\n                <img src="assets/pause.svg">\n            </menuitem>\n            <menuitem id="trailoffbtn">\n                <img src="assets/trail_off.svg">\n            </menuitem>\n            <menuitem id="trailonbtn" style="display: none;">\n                <img src="assets/trail_on.svg">\n            </menuitem>\n            ';

            document.body.appendChild(this.controls);
        }
    }, {
        key: 'generateBodies',
        value: function generateBodies(num, args) {
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
        }
    }, {
        key: 'drawInteraction',
        value: function drawInteraction() {
            if (this.interaction.started) {
                this.gfx.drawReticleLine({
                    from: {
                        x: this.interaction.body.x,
                        y: this.interaction.body.y
                    },
                    to: this.interaction.previous
                });
            }
        }
    }]);

    return GtApp;
})(); // end graviton/app

exports.default = GtApp;

},{"../util/random":13,"./events":4,"./gfx":5,"./sim":6,"./timer":7}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/body -- The gravitational body
 */

var GtBody = function GtBody(args) {
    _classCallCheck(this, GtBody);

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
}; // end graviton/body

exports.default = GtBody;

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/events -- Event queueing and processing
 */
var KEYCODES = exports.KEYCODES = {
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
};

var MOUSECODES = exports.MOUSECODES = {
    M_LEFT: 0,
    M_MIDDLE: 1,
    M_RIGHT: 2
};

var EVENTCODES = exports.EVENTCODES = {
    MOUSEDOWN: 1000,
    MOUSEUP: 1001,
    MOUSEMOVE: 1002,
    MOUSEWHEEL: 1003,
    CLICK: 1004,
    DBLCLICK: 1005,

    KEYDOWN: 1010,
    KEYUP: 1011
};

var CONTROLCODES = exports.CONTROLCODES = {
    PLAYBTN: 2000,
    PAUSEBTN: 2001,
    TRAILOFFBTN: 2002,
    TRAILONBTN: 2003
};

var GtEvents = (function () {
    function GtEvents(args) {
        _classCallCheck(this, GtEvents);

        args = args || {};

        this.queue = [];

        if (typeof args.grid === 'undefined') {
            throw Error('No usable canvas element was given.');
        }
        this.grid = args.grid;
        this.controls = args.controls;
        this.playBtn = args.playBtn;
        this.pauseBtn = args.pauseBtn;
        this.trailOffBtn = args.trailOffBtn;
        this.trailOnBtn = args.trailOnBtn;

        this.wireupEvents();
    }

    _createClass(GtEvents, [{
        key: 'qadd',
        value: function qadd(event) {
            this.queue.push(event);
        }
    }, {
        key: 'qpoll',
        value: function qpoll() {
            return this.queue.shift();
        }
    }, {
        key: 'qget',
        value: function qget() {
            // Replacing the reference is faster than `splice()`
            var ref = this.queue;
            this.queue = [];
            return ref;
        }
    }, {
        key: 'qclear',
        value: function qclear() {
            this.queue = [];
        }
    }, {
        key: 'wireupEvents',
        value: function wireupEvents() {
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

            // Control events
            this.playBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.PLAYBTN));
            this.pauseBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.PAUSEBTN));
            this.trailOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.TRAILOFFBTN));
            this.trailOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.TRAILONBTN));
        }
    }, {
        key: 'handleClick',
        value: function handleClick(event) {
            this.qadd({
                type: EVENTCODES.CLICK,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleDblClick',
        value: function handleDblClick(event) {
            this.qadd({
                type: EVENTCODES.DBLCLICK,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleMouseDown',
        value: function handleMouseDown(event) {
            this.qadd({
                type: EVENTCODES.MOUSEDOWN,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleMouseUp',
        value: function handleMouseUp(event) {
            this.qadd({
                type: EVENTCODES.MOUSEUP,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleMouseMove',
        value: function handleMouseMove(event) {
            this.qadd({
                type: EVENTCODES.MOUSEMOVE,
                position: this.getPosition(event),
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleMouseWheel',
        value: function handleMouseWheel(event) {
            // Account for discrepancies between Firefox and Webkit
            var delta = event.wheelDelta ? event.wheelDelta / 120 : event.detail / -3;

            this.qadd({
                type: EVENTCODES.MOUSEWHEEL,
                position: this.getPosition(event),
                wheeldelta: delta,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });

            // Prevent the window from scrolling
            event.preventDefault();
        }
    }, {
        key: 'handleKeyDown',
        value: function handleKeyDown(event) {
            // Account for browser discrepancies
            var key = event.keyCode || event.which;

            this.qadd({
                type: EVENTCODES.KEYDOWN,
                keycode: key,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleKeyUp',
        value: function handleKeyUp(event) {
            // Account for browser discrepancies
            var key = event.keyCode || event.which;

            this.qadd({
                type: EVENTCODES.KEYUP,
                keycode: key,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleControlClick',
        value: function handleControlClick(type, event) {
            this.qadd({
                type: type,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'getPosition',
        value: function getPosition(event) {
            // Calculate offset on the grid from clientX/Y, because
            // some browsers don't have event.offsetX/Y
            return {
                x: event.clientX - this.grid.offsetLeft,
                y: event.clientY - this.grid.offsetTop
            };
        }
    }]);

    return GtEvents;
})(); // end graviton/events

exports.default = GtEvents;

},{}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/gfx -- The graphics object
 */

var GtGfx = (function () {
    function GtGfx(args) {
        _classCallCheck(this, GtGfx);

        args = args || {};

        this.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

        if (typeof this.grid === 'undefined') {
            throw Error('No usable canvas element was given.');
        }

        this.ctx = this.grid.getContext('2d');
    }

    _createClass(GtGfx, [{
        key: 'clear',
        value: function clear() {
            // Setting the width has the side effect
            // of clearing the canvas
            this.grid.width = this.grid.width;
        }
    }, {
        key: 'drawBodies',
        value: function drawBodies(bodies) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = bodies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var body = _step.value;

                    this.drawBody(body);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: 'drawBody',
        value: function drawBody(body) {
            this.ctx.fillStyle = body.color;

            this.ctx.beginPath();
            this.ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);

            this.ctx.fill();
        }
    }, {
        key: 'drawReticleLine',
        value: function drawReticleLine(args) {
            var grad = this.ctx.createLinearGradient(args.from.x, args.from.y, args.to.x, args.to.y);
            grad.addColorStop(0, 'rgba(31, 75, 130, 1)');
            grad.addColorStop(1, 'rgba(31, 75, 130, 0.1)');
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = 'round';

            // Draw initial background line.
            this.ctx.beginPath();
            this.ctx.moveTo(args.from.x, args.from.y);
            this.ctx.lineTo(args.to.x, args.to.y);
            this.ctx.stroke();

            // Draw overlay line.
            this.ctx.strokeStyle = '#3477CA';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(args.from.x, args.from.y);
            this.ctx.lineTo(args.to.x, args.to.y);
            this.ctx.stroke();
        }
    }]);

    return GtGfx;
})(); // end graviton/gfx

exports.default = GtGfx;

},{}],6:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/sim -- The gravitational simulator
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _log = require('../util/log');

var _log2 = _interopRequireDefault(_log);

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

var _tree = require('./tree');

var _tree2 = _interopRequireDefault(_tree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GtSim = (function () {
    function GtSim(args) {
        _classCallCheck(this, GtSim);

        args = args || {};

        this.options = {};
        this.bodies = [];
        this.tree = new _tree2.default(args.width, args.height);
        this.time = 0;

        // Temporary workspace
        this.D = {};

        this.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.options.multiplier = args.multiplier || 1500; // Timestep
        this.options.collisions = args.collision || true;
        this.options.scatterLimit = args.scatterLimit || 10000;
    }

    _createClass(GtSim, [{
        key: 'step',
        value: function step(elapsed) {
            for (var i = 0; i < this.bodies.length; i++) {
                var body = this.bodies[i];
                if (this.options.collisions === true) {
                    // TODO: Is this useful?
                    this.detectCollision(body, i);
                }

                this.calculateNewPosition(body, i, elapsed * this.options.multiplier);

                i = this.removeScattered(body, i);
            }

            this.time += elapsed; // Increment runtime
        }
    }, {
        key: 'calculateNewPosition',
        value: function calculateNewPosition(body, index, deltaT) {
            var netFx = 0;
            var netFy = 0;

            // Iterate through all bodies and sum the forces exerted
            for (var i = 0; i < this.bodies.length; i++) {
                var attractor = this.bodies[i];
                if (i !== index) {
                    // Get the distance and position deltas
                    this.calculateDistance(body, attractor);

                    // Calculate force using Newtonian gravity, separate out into x and y components
                    var F = this.options.G * body.mass * attractor.mass / Math.pow(this.D.r, 2);
                    var Fx = F * (this.D.dx / this.D.r);
                    var Fy = F * (this.D.dy / this.D.r);

                    netFx += Fx;
                    netFy += Fy;
                }
            }

            // Calculate accelerations
            var ax = netFx / body.mass;
            var ay = netFy / body.mass;

            // Calculate new velocities, normalized by the 'time' interval
            body.velX += deltaT * ax;
            body.velY += deltaT * ay;

            // Calculate new positions after timestep deltaT
            body.x += deltaT * body.velX;
            body.y += deltaT * body.velY;
        }
    }, {
        key: 'calculateDistance',
        value: function calculateDistance(body, other) {
            // Calculate the change in position along the two dimensions
            this.D.dx = other.x - body.x;
            this.D.dy = other.y - body.y;

            // Obtain the distance between the objects (hypotenuse)
            this.D.r = Math.sqrt(Math.pow(this.D.dx, 2) + Math.pow(this.D.dy, 2));
        }
    }, {
        key: 'detectCollision',
        value: function detectCollision(body, index) {
            for (var i = 0; i < this.bodies.length; i++) {
                var collider = this.bodies[i];
                if (i !== index) {
                    this.calculateDistance(body, collider);
                    var clearance = body.radius + collider.radius;

                    if (this.D.r <= clearance) {
                        // Collision detected
                        _log2.default.write('Collision detected!!', 'debug');
                    }
                }
            }
        }
    }, {
        key: 'removeScattered',
        value: function removeScattered(body, index) {
            if (body.x > this.options.scatterLimit || body.x < -this.options.scatterLimit || body.y > this.options.scatterLimit || body.y < -this.options.scatterLimit) {
                // Remove from body collection
                this.bodies.splice(index, 1);
                return index - 1;
            }
            return index;
        }
    }, {
        key: 'addNewBody',
        value: function addNewBody(args) {
            var body = new _body2.default(args);
            this.bodies.push(body);
            this.tree.addBody(body);

            return body;
        }
    }, {
        key: 'removeBody',
        value: function removeBody(index) {
            this.bodies.splice(index, 1);
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.bodies.length = 0; // Remove all bodies from collection
        }
    }]);

    return GtSim;
})(); // end graviton/sim

exports.default = GtSim;

},{"../util/log":12,"./body":3,"./tree":8}],7:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/timer -- Sim timer and FPS limiter
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _env = require('../util/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GtTimer = (function () {
    function GtTimer(fn) {
        _classCallCheck(this, GtTimer);

        var fps = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        this._fn = fn;
        this._fps = fps;
        this._isActive = false;
        this._isAnimation = fps === null;
        this._cancellationId = null;

        this._window = _env2.default.getWindow();
    }

    _createClass(GtTimer, [{
        key: 'start',
        value: function start() {
            if (!this._isActive) {
                if (this._isAnimation) {
                    this._beginAnimation();
                } else {
                    this._beginInterval();
                }
                this._isActive = true;
            }
        }
    }, {
        key: 'stop',
        value: function stop() {
            if (this._isActive) {
                if (this._isAnimation) {
                    this._window.cancelAnimationFrame(this._cancellationId);
                } else {
                    this._window.clearInterval(this._cancellationId);
                }
                this._isActive = false;
            }
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            if (this._isActive) {
                this.stop();
            } else {
                this.start();
            }
        }
    }, {
        key: '_beginAnimation',
        value: function _beginAnimation() {
            var _this = this;

            var lastTimestamp = this._window.performance.now();
            var animator = function animator(timestamp) {
                _this._cancellationId = _this._window.requestAnimationFrame(animator);
                _this._fn(timestamp - lastTimestamp);
                lastTimestamp = timestamp;
            };

            // Delay initial execution until the next tick.
            this._cancellationId = this._window.requestAnimationFrame(animator);
        }
    }, {
        key: '_beginInterval',
        value: function _beginInterval() {
            var _this2 = this;

            // Compute the delay per tick, in milliseconds.
            var timeout = 1000 / this._fps | 0;

            var lastTimestamp = this._window.performance.now();
            this._cancellationId = this._window.setInterval(function () {
                var timestamp = _this2._window.performance.now();
                _this2._fn(timestamp - lastTimestamp);
                lastTimestamp = timestamp;
            }, timeout);
        }
    }, {
        key: 'active',
        get: function get() {
            return this._isActive;
        }
    }]);

    return GtTimer;
})(); // end graviton/timer

exports.default = GtTimer;

},{"../util/env":11}],8:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/tree -- The gravitational body tree structure
 */

var GtTreeNode = (function () {
    function GtTreeNode(x, y, width, height) {
        _classCallCheck(this, GtTreeNode);

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;

        this.midX = this.x + this.halfWidth;
        this.midY = this.y + this.halfHeight;

        this.mass = 0;
        this.massX = 0;
        this.massY = 0;

        // [NW, NE, SW, SE]
        this.children = new Array(4);
    }

    _createClass(GtTreeNode, [{
        key: "addBody",
        value: function addBody(body) {
            this.updateMass(body);
            var quadrant = this.getQuadrant(body);

            if (!this.children[quadrant]) {
                this.children[quadrant] = body;
            } else {
                var existing = this.children[quadrant];
                var quadX = existing.x > this.midX ? this.midX : this.x;
                var quadY = existing.y > this.midY ? this.midY : this.y;
                var node = new GtTreeNode(quadX, quadY, this.halfWidth, this.halfHeight);

                node.addBody(existing);
                node.addBody(body);

                this.children[quadrant] = node;
            }
        }
    }, {
        key: "updateMass",
        value: function updateMass(body) {
            var newMass = this.mass + body.mass;
            var newMassX = (this.massX * this.mass + body.x * body.mass) / newMass;
            var newMassY = (this.massY * this.mass + body.y * body.mass) / newMass;
            this.mass = newMass;
            this.massX = newMassX;
            this.massY = newMassY;
        }
    }, {
        key: "getQuadrant",
        value: function getQuadrant(body) {
            var xIndex = Number(body.x > this.midX);
            var yIndex = Number(body.y > this.midY) * 2;
            return xIndex + yIndex;
        }
    }]);

    return GtTreeNode;
})();

var GtTree = (function () {
    function GtTree(width, height) {
        _classCallCheck(this, GtTree);

        this.width = width;
        this.height = height;
        this.root = undefined;
    }

    _createClass(GtTree, [{
        key: "addBody",
        value: function addBody(body) {
            if (this.root instanceof GtTreeNode) {
                this.root.addBody(body);
            } else if (!this.root) {
                this.root = body;
            } else {
                var existing = this.root;
                this.root = new GtTreeNode(0, 0, this.width, this.height);
                this.root.addBody(existing);
                this.root.addBody(body);
            }
        }
    }]);

    return GtTree;
})(); // end graviton/tree

exports.default = GtTree;

},{}],9:[function(require,module,exports){
'use strict';

require('./polyfills');

var _graviton = require('./graviton');

var _graviton2 = _interopRequireDefault(_graviton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.onload = function () {
    // Start the main graviton app.
    window.graviton = new _graviton2.default.app();
};

},{"./graviton":1,"./polyfills":10}],10:[function(require,module,exports){
"use strict";

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
    return window.setTimeout(callback, 1000 / 60);
};

window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || function (timeoutId) {
    window.clearTimeout(timeoutId);
};

window.performance = window.performance || {};
window.performance.now = window.performance.now || window.performance.webkitNow || window.performance.mozNow || Date.now;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * env - Environment retrieval methods.
 */
exports.default = {
    getWindow: function getWindow() {
        return window;
    }
};

},{}],12:[function(require,module,exports){
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
            /* eslint-disable no-console */
            if (console[level]) {
                console[level](message);
            } else {
                throw Error('Log level does not exist.');
            }
            /* eslint-enable no-console */
        }
    },
    setLevel: function setLevel(level) {
        level = level.toLowerCase();

        if (console[level]) {
            // eslint-disable-line no-console
            this.config.logLevel = level;
        } else {
            throw Error('Log level does not exist.');
        }
    }
};

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * random -- A collection of random generator functions
 */
exports.default = {
    /**
     * Generate a random number between the given start and end points
     */

    number: function number(from) {
        var to = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (to === null) {
            to = from;
            from = 0;
        }

        return Math.random() * (to - from) + from;
    },

    /**
     * Generate a random integer between the given positions
     */
    integer: function integer() {
        return Math.floor(this.number.apply(this, arguments));
    },

    /**
     * Generate a random number, with a random sign, between the given
     * positions
     */
    directional: function directional() {
        var rand = this.number.apply(this, arguments);
        if (Math.random() > 0.5) {
            rand = -rand;
        }
        return rand;
    },

    /**
     * Generate a random hexadecimal color
     */
    color: function color() {
        return '#' + ('00000' + Math.floor(Math.random() * 0x1000000).toString(16)).substr(-6);
    }
};

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL2xvZy5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7OztrQkNhZSxFQUFFLEdBQUcsZUFBTyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ0pSLEtBQUs7QUFDdEIsYUFEaUIsS0FBSyxHQUNDOzhCQUROLEtBQUs7O1lBQ1YsSUFBSSx5REFBRyxFQUFFOztBQUNqQixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzs7QUFFakIsWUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDOztBQUVyQixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixZQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztBQUNoQixZQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQzs7QUFFaEIsWUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDckIsWUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7O0FBRXRCLFlBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDO0FBQ2xFLFlBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDO0FBQ3RFLFlBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLElBQUksU0FBUzs7O0FBQUMsQUFHakUsWUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxHQUNyQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FDbEMsSUFBSSxDQUFDLElBQUksQ0FBQzs7QUFFZCxZQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7QUFDbEMsZ0JBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQ2pELEVBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFDLENBQUMsQ0FBQztBQUN6RCxnQkFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1NBQ3pCOztBQUVELFlBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLFFBQVEsR0FDN0MsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUM7O0FBRWxCLFlBQUksT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLFdBQVcsRUFBRTtBQUN0QyxnQkFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsZ0JBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztTQUNqQzs7QUFFRCxZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDdEUsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3pFLFlBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNsRixZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDOzs7QUFBQyxBQUcvRSxZQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ3JCOzs7OztBQUFBO2lCQWpEZ0IsS0FBSzs7K0JBc0RmOzs7QUFHSCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBUyxLQUFLLEVBQUU7QUFDdkMsb0JBQUksTUFBTSxZQUFBLENBQUM7O0FBRVgsd0JBQVEsS0FBSyxDQUFDLElBQUk7QUFDZCx5QkFBSyxRQWhFUSxVQUFVLENBZ0VQLFNBQVM7O0FBRXJCLDRCQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7O0FBRWhDLDRCQUFJLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztBQUN4Qyw2QkFBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQiw2QkFBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzt5QkFDdEIsQ0FBQyxDQUFDOztBQUVILDRCQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsR0FBRztBQUN4Qiw2QkFBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQiw2QkFBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzt5QkFDdEIsQ0FBQztBQUNGLDhCQUFNOztBQUFBLEFBRVYseUJBQUssUUEvRVEsVUFBVSxDQStFUCxPQUFPO0FBQ25CLDRCQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQzFCLGdDQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7O0FBRWpDLGdDQUFJLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQzs7QUFFakMsZ0NBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFBLEdBQUksU0FBUyxDQUFDO0FBQ3BELGdDQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQSxHQUFJLFNBQVMsQ0FBQzt5QkFDdkQ7QUFDRCw4QkFBTTs7QUFBQSxBQUVWLHlCQUFLLFFBMUZRLFVBQVUsQ0EwRlAsU0FBUztBQUNyQiw0QkFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUMxQixnQ0FBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEdBQUc7QUFDeEIsaUNBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsaUNBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7NkJBQ3RCLENBQUM7eUJBQ0w7QUFDRCw4QkFBTTs7QUFBQSxBQUVWLHlCQUFLLFFBbkdRLFVBQVUsQ0FtR1AsVUFBVTtBQUN0Qiw4QkFBTTs7QUFBQSxBQUVWLHlCQUFLLFFBdEdRLFVBQVUsQ0FzR1AsT0FBTztBQUNuQixnQ0FBUSxLQUFLLENBQUMsT0FBTztBQUNqQixpQ0FBSyxRQXhHVixRQUFRLENBd0dXLE9BQU87QUFDakIsb0NBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNqQixzQ0FBTTs7QUFBQSxBQUVWLGlDQUFLLFFBNUdWLFFBQVEsQ0E0R1csR0FBRzs7QUFFYixvQ0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNqQixvQ0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNqQixvQ0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNyQixzQ0FBTSxHQUFHLEtBQUssQ0FBQztBQUNmLHNDQUFNOztBQUFBLEFBRVYsaUNBQUssUUFwSFYsUUFBUSxDQW9IVyxHQUFHO0FBQ2Isb0NBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNwQixzQ0FBTTs7QUFBQSxBQUVWLGlDQUFLLFFBeEhWLFFBQVEsQ0F3SFcsR0FBRzs7QUFFYixvQ0FBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBQyxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM5QyxzQ0FBTTs7QUFBQSxBQUVWLGlDQUFLLFFBN0hWLFFBQVEsQ0E2SFcsR0FBRztBQUNiLG9DQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztBQUNoQixxQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztBQUNyRCx3Q0FBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUNoQix3Q0FBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTO2lDQUMzQyxDQUFDLENBQUM7QUFDSCxvQ0FBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDaEIscUNBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUM7QUFDdkQsd0NBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVE7QUFDdkIsd0NBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUztpQ0FDdkMsQ0FBQyxDQUFDO0FBQ0gsc0NBQU07QUFBQSx5QkFDYjtBQUNELDhCQUFNOztBQUFBLEFBRVYseUJBQUssUUE1SW9CLFlBQVksQ0E0SW5CLE9BQU87QUFDckIsNEJBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNqQiw4QkFBTTs7QUFBQSxBQUVWLHlCQUFLLFFBaEpvQixZQUFZLENBZ0puQixRQUFRO0FBQ3RCLDRCQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDakIsOEJBQU07O0FBQUEsQUFFVix5QkFBSyxRQXBKb0IsWUFBWSxDQW9KbkIsV0FBVztBQUN6Qiw0QkFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3BCLDhCQUFNOztBQUFBLEFBRVYseUJBQUssUUF4Sm9CLFlBQVksQ0F3Sm5CLFVBQVU7QUFDeEIsNEJBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNwQiw4QkFBTTtBQUFBLGlCQUNiOztBQUVELHVCQUFPLE1BQU0sQ0FBQzthQUNqQixFQUFFLElBQUksQ0FBQzs7O0FBQUMsQUFHVCxnQkFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2pCOzs7eUNBRWdCOztBQUViLGdCQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLHFCQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6RCxnQkFBSSxDQUFDLEdBQUcsR0FBRyxrQkFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEMsZ0JBQUksQ0FBQyxHQUFHLEdBQUcsa0JBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ25DOzs7cUNBRVk7O0FBRVQsZ0JBQUksQ0FBQyxTQUFTLEdBQUcsb0JBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNuRCxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN2QixnQkFBSSxDQUFDLFFBQVEsR0FBRyxvQkFBWSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2pFOzs7b0NBRVc7QUFDUixnQkFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUN0QixvQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNoQyxvQkFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQzthQUN4QyxNQUFNO0FBQ0gsb0JBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDcEMsb0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7YUFDcEM7QUFDRCxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUMxQjs7O3VDQUVjO0FBQ1gsZ0JBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNkLG9CQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ3BDLG9CQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO2FBQzFDLE1BQU07QUFDSCxvQkFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUN4QyxvQkFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzthQUN0QztBQUNELGdCQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUNoQzs7O2lDQUVRO0FBQ0wsZ0JBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2Ysb0JBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDcEI7QUFDRCxnQkFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3ZCLGdCQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hDOzs7cUNBRVksS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7O0FBRS9CLGdCQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1IscUJBQUssR0FBRyxFQUFFLENBQUM7YUFDZDs7QUFFRCxnQkFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUU3QyxnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ3hCLGdCQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDMUIsZ0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDbEMsZ0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQztBQUN4RCxnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDO0FBQzFELGdCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsSUFBSSxTQUFTLENBQUM7O0FBRXJFLG9CQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEM7OzsyQ0FFa0I7QUFDZixnQkFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9DLGdCQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7QUFDL0IsZ0JBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztBQUM5QixnQkFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLCtmQWFsQixDQUFDOztBQUVOLG9CQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDNUM7Ozt1Q0FFYyxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQ3RCLGdCQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7QUFFbEIsZ0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQzFCLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQzNDLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUMxQixnQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7QUFFNUMsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDO0FBQ2hDLGdCQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQztBQUN0QyxnQkFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7QUFDaEMsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDOztBQUV0QyxnQkFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7QUFDaEMsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDOztBQUVsQyxnQkFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUM7QUFDcEMsZ0JBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDOztBQUVyQyxnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzs7QUFFdkIsaUJBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDMUIsb0JBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLEVBQUU7QUFDNUIseUJBQUssR0FBRyxpQkFBTyxLQUFLLEVBQUUsQ0FBQztpQkFDMUI7O0FBRUQsb0JBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ2hCLHFCQUFDLEVBQUUsaUJBQU8sTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7QUFDNUIscUJBQUMsRUFBRSxpQkFBTyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztBQUM1Qix3QkFBSSxFQUFFLGlCQUFPLFdBQVcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQzFDLHdCQUFJLEVBQUUsaUJBQU8sV0FBVyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFDMUMsd0JBQUksRUFBRSxpQkFBTyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztBQUNyQywwQkFBTSxFQUFFLGlCQUFPLE1BQU0sQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO0FBQzNDLHlCQUFLLEVBQUUsS0FBSztpQkFDZixDQUFDLENBQUM7YUFDTjtTQUNKOzs7MENBRWlCO0FBQ2QsZ0JBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7QUFDMUIsb0JBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDO0FBQ3JCLHdCQUFJLEVBQUU7QUFDRix5QkFBQyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUIseUJBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUM3QjtBQUNELHNCQUFFLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRO2lCQUNoQyxDQUFDLENBQUM7YUFDTjtTQUNKOzs7V0FyU2dCLEtBQUs7OztrQkFBTCxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7SUNOTCxNQUFNLEdBQ3ZCLFNBRGlCLE1BQU0sQ0FDWCxJQUFJLEVBQUU7MEJBREQsTUFBTTs7QUFFbkIsUUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7O0FBRWxCLFFBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNoQixRQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDaEIsUUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7QUFDMUQsY0FBTSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztLQUNqRTs7QUFFRCxRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQzNCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7O0FBRTNCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7QUFDNUIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztBQUMvQixRQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDO0NBQ3hDOztrQkFoQmdCLE1BQU07Ozs7Ozs7Ozs7Ozs7Ozs7QUNBcEIsSUFBTSxRQUFRLFdBQVIsUUFBUSxHQUFHO0FBQ3BCLFVBQU0sRUFBRSxFQUFFO0FBQ1YsUUFBSSxFQUFFLEVBQUU7QUFDUixXQUFPLEVBQUUsRUFBRTtBQUNYLFVBQU0sRUFBRSxFQUFFOztBQUVWLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFOztBQUVQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7O0FBRVAsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsRUFBRTtBQUNULFNBQUssRUFBRSxFQUFFO0FBQ1QsU0FBSyxFQUFFLEdBQUc7QUFDVixTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7QUFDVixTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHOztBQUVWLGVBQVcsRUFBRSxDQUFDO0FBQ2QsU0FBSyxFQUFFLENBQUM7QUFDUixXQUFPLEVBQUUsRUFBRTtBQUNYLFdBQU8sRUFBRSxFQUFFO0FBQ1gsVUFBTSxFQUFFLEVBQUU7QUFDVixTQUFLLEVBQUUsRUFBRTtBQUNULFNBQUssRUFBRSxFQUFFO0FBQ1QsV0FBTyxFQUFFLEVBQUU7Q0FDZCxDQUFDOztBQUVLLElBQU0sVUFBVSxXQUFWLFVBQVUsR0FBRztBQUN0QixVQUFNLEVBQUUsQ0FBQztBQUNULFlBQVEsRUFBRSxDQUFDO0FBQ1gsV0FBTyxFQUFF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Q0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7QUFDN0MsZ0JBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7QUFDL0MsZ0JBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUM1QixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLGdCQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxPQUFPOzs7QUFBQyxBQUczQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNyQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7OztBQUFDLEFBR2xCLGdCQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7QUFDakMsZ0JBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUN2QixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNyQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNy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LGdCQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7U0FDaEMsTUFBTTtBQUNILGtCQUFNLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1NBQzVDO0tBQ0o7Q0FDSjs7Ozs7Ozs7Ozs7a0JDcENjOzs7OztBQUlYLFVBQU0sa0JBQUMsSUFBSSxFQUFXO1lBQVQsRUFBRSx5REFBQyxJQUFJOztBQUNoQixZQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDYixjQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ1YsZ0JBQUksR0FBRyxDQUFDLENBQUM7U0FDWjs7QUFFRCxlQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFBLEFBQUMsR0FBRyxJQUFJLENBQUM7S0FDN0M7Ozs7O0FBS0QsV0FBTyxxQkFBVTtBQUNiLGVBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFBLENBQVgsSUFBSSxZQUFnQixDQUFDLENBQUM7S0FDM0M7Ozs7OztBQU1ELGVBQVcseUJBQVU7QUFDakIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sTUFBQSxDQUFYLElBQUksWUFBZ0IsQ0FBQztBQUNoQyxZQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLEVBQUU7QUFDckIsZ0JBQUksR0FBRyxDQUFDLElBQUksQ0FBQztTQUNoQjtBQUNELGVBQU8sSUFBSSxDQUFDO0tBQ2Y7Ozs7O0FBS0QsU0FBSyxtQkFBRztBQUNKLGVBQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFGO0NBQ0oiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBncmF2aXRvblxuICpcbiAqIEphdmFTY3JpcHQgTi1ib2R5IEdyYXZpdGF0aW9uYWwgU2ltdWxhdG9yXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IFphdmVuIE11cmFkeWFuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqXG4gKiBSZXZpc2lvbjpcbiAqICBAUkVWSVNJT05cbiAqL1xuaW1wb3J0IEd0QXBwIGZyb20gJy4vZ3Jhdml0b24vYXBwJztcblxuZXhwb3J0IGRlZmF1bHQgeyBhcHA6IEd0QXBwIH07XG4iLCIvKipcbiAqIGdyYXZpdG9uL2FwcCAtLSBUaGUgaW50ZXJhY3RpdmUgZ3Jhdml0b24gYXBwbGljYXRpb25cbiAqL1xuaW1wb3J0IHJhbmRvbSBmcm9tICcuLi91dGlsL3JhbmRvbSc7XG5pbXBvcnQgR3RTaW0gZnJvbSAnLi9zaW0nO1xuaW1wb3J0IEd0R2Z4IGZyb20gJy4vZ2Z4JztcbmltcG9ydCBHdEV2ZW50cywgeyBLRVlDT0RFUywgRVZFTlRDT0RFUywgQ09OVFJPTENPREVTIH0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IEd0VGltZXIgZnJvbSAnLi90aW1lcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0QXBwIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzID0ge30pIHtcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ncmlkID0gbnVsbDtcblxuICAgICAgICB0aGlzLmFuaW1UaW1lciA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaW0gPSBudWxsO1xuICAgICAgICB0aGlzLmdmeCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24gPSB7fTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSBhcmdzLndpZHRoID0gYXJncy53aWR0aCB8fCB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IGFyZ3MuaGVpZ2h0ID0gYXJncy5oZWlnaHQgfHwgd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yID0gYXJncy5iYWNrZ3JvdW5kQ29sb3IgfHwgJyMxRjI2M0InO1xuXG4gICAgICAgIC8vIFJldHJpZXZlIGNhbnZhcywgb3IgYnVpbGQgb25lIHdpdGggYXJndW1lbnRzXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUdyaWQodGhpcy5vcHRpb25zLndpZHRoLCB0aGlzLm9wdGlvbnMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB7YmFja2dyb3VuZENvbG9yOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yfSk7XG4gICAgICAgICAgICBhcmdzLmdyaWQgPSB0aGlzLmdyaWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRyb2xzID0gdHlwZW9mIGFyZ3MuY29udHJvbHMgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuY29udHJvbHMpIDpcbiAgICAgICAgICAgIGFyZ3MuY29udHJvbHM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbnRyb2xzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUNvbnRyb2xzKCk7XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzID0gdGhpcy5jb250cm9scztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3BsYXlidG4nKTtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwYXVzZWJ0bicpO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuID0gYXJncy50cmFpbE9mZkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3RyYWlsb2ZmYnRuJyk7XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0biA9IGFyZ3MudHJhaWxPbkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3RyYWlsb25idG4nKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplXG4gICAgICAgIHRoaXMuaW5pdENvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VGltZXJzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbWFpbiAtLSBNYWluICdnYW1lJyBsb29wXG4gICAgICovXG4gICAgbWFpbigpIHtcbiAgICAgICAgLy8gRXZlbnQgcHJvY2Vzc2luZ1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHRoaXMuZXZlbnRzLnFnZXQoKS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBsZXQgcmV0dmFsO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VET1dOOlxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgZmxhZyB0byBzaWduYWwgb3RoZXIgZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5ib2R5ID0gdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQucG9zaXRpb24ueVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDogZXZlbnQucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBvc2l0aW9uLnlcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRURPV05cblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRVVQOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJvZHkgPSB0aGlzLmludGVyYWN0aW9uLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkudmVsWCA9IChldmVudC5wb3NpdGlvbi54IC0gYm9keS54KSAqIDAuMDAwMDAwMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkudmVsWSA9IChldmVudC5wb3NpdGlvbi55IC0gYm9keS55KSAqIDAuMDAwMDAwMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRU1PVkU6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogZXZlbnQucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBldmVudC5wb3NpdGlvbi55XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VNT1ZFXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VXSEVFTDpcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRVdIRUVMXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuS0VZRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChldmVudC5rZXljb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfRU5URVI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0M6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgc2ltdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbVRpbWVyLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR2YWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1A6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlQm9kaWVzKDEwLCB7cmFuZG9tQ29sb3JzOiB0cnVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19UOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLyAyLCB5OiB0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVsWDogMCwgdmVsWTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMjAwMCwgcmFkaXVzOiA1MCwgY29sb3I6ICcjNUE1QTVBJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLSA0MDAsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLjAwMDAyNSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMSwgcmFkaXVzOiA1LCBjb2xvcjogJyM3ODc4NzgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBLRVlET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QTEFZQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlBBVVNFQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAvLyBSZWRyYXcgc2NyZWVuXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XG4gICAgfVxuXG4gICAgaW5pdENvbXBvbmVudHMoKSB7XG4gICAgICAgIC8vIENyZWF0ZSBjb21wb25lbnRzIC0tIG9yZGVyIGlzIGltcG9ydGFudFxuICAgICAgICB0aGlzLmV2ZW50cyA9IHRoaXMuYXJncy5ldmVudHMgPSBuZXcgR3RFdmVudHModGhpcy5hcmdzKTtcbiAgICAgICAgdGhpcy5zaW0gPSBuZXcgR3RTaW0odGhpcy5hcmdzKTtcbiAgICAgICAgdGhpcy5nZnggPSBuZXcgR3RHZngodGhpcy5hcmdzKTtcbiAgICB9XG5cbiAgICBpbml0VGltZXJzKCkge1xuICAgICAgICAvLyBBZGQgYG1haW5gIGxvb3AsIGFuZCBzdGFydCBpbW1lZGlhdGVseVxuICAgICAgICB0aGlzLmFuaW1UaW1lciA9IG5ldyBHdFRpbWVyKHRoaXMubWFpbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5hbmltVGltZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5zaW1UaW1lciA9IG5ldyBHdFRpbWVyKHRoaXMuc2ltLnN0ZXAuYmluZCh0aGlzLnNpbSksIDYwKTtcbiAgICB9XG5cbiAgICB0b2dnbGVTaW0oKSB7XG4gICAgICAgIGlmICh0aGlzLnNpbVRpbWVyLmFjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5wbGF5QnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMucGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGxheUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaW1UaW1lci50b2dnbGUoKTtcbiAgICB9XG5cbiAgICB0b2dnbGVUcmFpbHMoKSB7XG4gICAgICAgIGlmICh0aGlzLm5vY2xlYXIpIHtcbiAgICAgICAgICAgIHRoaXMudHJhaWxPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy50cmFpbE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9jbGVhciA9ICF0aGlzLm5vY2xlYXI7XG4gICAgfVxuXG4gICAgcmVkcmF3KCkge1xuICAgICAgICBpZiAoIXRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRyYXdJbnRlcmFjdGlvbigpO1xuICAgICAgICB0aGlzLmdmeC5kcmF3Qm9kaWVzKHRoaXMuc2ltLmJvZGllcyk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVHcmlkKHdpZHRoLCBoZWlnaHQsIHN0eWxlKSB7XG4gICAgICAgIC8vIEF0dGFjaCBhIGNhbnZhcyB0byB0aGUgcGFnZSwgdG8gaG91c2UgdGhlIHNpbXVsYXRpb25zXG4gICAgICAgIGlmICghc3R5bGUpIHtcbiAgICAgICAgICAgIHN0eWxlID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgICAgICB0aGlzLmdyaWQud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5ncmlkLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUubWFyZ2luTGVmdCA9IHN0eWxlLm1hcmdpbkxlZnQgfHwgJ2F1dG8nO1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUubWFyZ2luUmlnaHQgPSBzdHlsZS5tYXJnaW5SaWdodCB8fCAnYXV0byc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IgfHwgJyMwMDAwMDAnO1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5ncmlkKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZUNvbnRyb2xzKCkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbWVudScpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnR5cGUgPSAndG9vbGJhcic7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaWQgPSAnY29udHJvbHMnO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInBsYXlidG5cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wbGF5LnN2Z1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInBhdXNlYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3BhdXNlLnN2Z1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb2ZmYnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb2ZmLnN2Z1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb25idG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb24uc3ZnXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgYDtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuY29udHJvbHMpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQm9kaWVzKG51bSwgYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICBsZXQgbWluWCA9IGFyZ3MubWluWCB8fCAwO1xuICAgICAgICBsZXQgbWF4WCA9IGFyZ3MubWF4WCB8fCB0aGlzLm9wdGlvbnMud2lkdGg7XG4gICAgICAgIGxldCBtaW5ZID0gYXJncy5taW5ZIHx8IDA7XG4gICAgICAgIGxldCBtYXhZID0gYXJncy5tYXhZIHx8IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG5cbiAgICAgICAgbGV0IG1pblZlbFggPSBhcmdzLm1pblZlbFggfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFggPSBhcmdzLm1heFZlbFggfHwgMC4wMDAwMTtcbiAgICAgICAgbGV0IG1pblZlbFkgPSBhcmdzLm1pblZlbFkgfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFkgPSBhcmdzLm1heFZlbFkgfHwgMC4wMDAwMTtcblxuICAgICAgICBsZXQgbWluTWFzcyA9IGFyZ3MubWluTWFzcyB8fCAxO1xuICAgICAgICBsZXQgbWF4TWFzcyA9IGFyZ3MubWF4TWFzcyB8fCAxNTA7XG5cbiAgICAgICAgbGV0IG1pblJhZGl1cyA9IGFyZ3MubWluUmFkaXVzIHx8IDE7XG4gICAgICAgIGxldCBtYXhSYWRpdXMgPSBhcmdzLm1heFJhZGl1cyB8fCAxNTtcblxuICAgICAgICBsZXQgY29sb3IgPSBhcmdzLmNvbG9yO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcmdzLnJhbmRvbUNvbG9ycyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gcmFuZG9tLmNvbG9yKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgIHg6IHJhbmRvbS5udW1iZXIobWluWCwgbWF4WCksXG4gICAgICAgICAgICAgICAgeTogcmFuZG9tLm51bWJlcihtaW5ZLCBtYXhZKSxcbiAgICAgICAgICAgICAgICB2ZWxYOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWCwgbWF4VmVsWCksXG4gICAgICAgICAgICAgICAgdmVsWTogcmFuZG9tLmRpcmVjdGlvbmFsKG1pblZlbFksIG1heFZlbFkpLFxuICAgICAgICAgICAgICAgIG1hc3M6IHJhbmRvbS5udW1iZXIobWluTWFzcywgbWF4TWFzcyksXG4gICAgICAgICAgICAgICAgcmFkaXVzOiByYW5kb20ubnVtYmVyKG1pblJhZGl1cywgbWF4UmFkaXVzKSxcbiAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0ludGVyYWN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5kcmF3UmV0aWNsZUxpbmUoe1xuICAgICAgICAgICAgICAgIGZyb206IHtcbiAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5pbnRlcmFjdGlvbi5ib2R5LngsXG4gICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuaW50ZXJhY3Rpb24uYm9keS55XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0bzogdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9hcHBcbiIsIi8qKlxuICogZ3Jhdml0b24vYm9keSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBib2R5XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0Qm9keSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnggPSBhcmdzLng7XG4gICAgICAgIHRoaXMueSA9IGFyZ3MueTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnggIT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignQ29ycmVjdCBwb3NpdGlvbnMgd2VyZSBub3QgZ2l2ZW4gZm9yIHRoZSBib2R5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52ZWxYID0gYXJncy52ZWxYIHx8IDA7XG4gICAgICAgIHRoaXMudmVsWSA9IGFyZ3MudmVsWSB8fCAwO1xuXG4gICAgICAgIHRoaXMubWFzcyA9IGFyZ3MubWFzcyB8fCAxMDtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBhcmdzLnJhZGl1cyB8fCA0O1xuICAgICAgICB0aGlzLmNvbG9yID0gYXJncy5jb2xvciB8fCAnI0ZGRkZGRic7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vYm9keVxuIiwiLyoqXG4gKiBncmF2aXRvbi9ldmVudHMgLS0gRXZlbnQgcXVldWVpbmcgYW5kIHByb2Nlc3NpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IEtFWUNPREVTID0ge1xuICAgIEtfTEVGVDogMzcsXG4gICAgS19VUDogMzgsXG4gICAgS19SSUdIVDogMzksXG4gICAgS19ET1dOOiA0MCxcblxuICAgIEtfMDogNDgsXG4gICAgS18xOiA0OSxcbiAgICBLXzI6IDUwLFxuICAgIEtfMzogNTEsXG4gICAgS180OiA1MixcbiAgICBLXzU6IDUzLFxuICAgIEtfNjogNTQsXG4gICAgS183OiA1NSxcbiAgICBLXzg6IDU2LFxuICAgIEtfOTogNTcsXG5cbiAgICBLX0E6IDY1LFxuICAgIEtfQjogNjYsXG4gICAgS19DOiA2NyxcbiAgICBLX0Q6IDY4LFxuICAgIEtfRTogNjksXG4gICAgS19GOiA3MCxcbiAgICBLX0c6IDcxLFxuICAgIEtfSDogNzIsXG4gICAgS19JOiA3MyxcbiAgICBLX0o6IDc0LFxuICAgIEtfSzogNzUsXG4gICAgS19MOiA3NixcbiAgICBLX006IDc3LFxuICAgIEtfTjogNzgsXG4gICAgS19POiA3OSxcbiAgICBLX1A6IDgwLFxuICAgIEtfUTogODEsXG4gICAgS19SOiA4MixcbiAgICBLX1M6IDgzLFxuICAgIEtfVDogODQsXG4gICAgS19VOiA4NSxcbiAgICBLX1Y6IDg2LFxuICAgIEtfVzogODcsXG4gICAgS19YOiA4OCxcbiAgICBLX1k6IDg5LFxuICAgIEtfWjogOTAsXG5cbiAgICBLX0tQMTogOTcsXG4gICAgS19LUDI6IDk4LFxuICAgIEtfS1AzOiA5OSxcbiAgICBLX0tQNDogMTAwLFxuICAgIEtfS1A1OiAxMDEsXG4gICAgS19LUDY6IDEwMixcbiAgICBLX0tQNzogMTAzLFxuICAgIEtfS1A4OiAxMDQsXG4gICAgS19LUDk6IDEwNSxcblxuICAgIEtfQkFDS1NQQUNFOiA4LFxuICAgIEtfVEFCOiA5LFxuICAgIEtfRU5URVI6IDEzLFxuICAgIEtfU0hJRlQ6IDE2LFxuICAgIEtfQ1RSTDogMTcsXG4gICAgS19BTFQ6IDE4LFxuICAgIEtfRVNDOiAyNyxcbiAgICBLX1NQQUNFOiAzMlxufTtcblxuZXhwb3J0IGNvbnN0IE1PVVNFQ09ERVMgPSB7XG4gICAgTV9MRUZUOiAwLFxuICAgIE1fTUlERExFOiAxLFxuICAgIE1fUklHSFQ6IDJcbn07XG5cbmV4cG9ydCBjb25zdCBFVkVOVENPREVTID0ge1xuICAgIE1PVVNFRE9XTjogMTAwMCxcbiAgICBNT1VTRVVQOiAxMDAxLFxuICAgIE1PVVNFTU9WRTogMTAwMixcbiAgICBNT1VTRVdIRUVMOiAxMDAzLFxuICAgIENMSUNLOiAxMDA0LFxuICAgIERCTENMSUNLOiAxMDA1LFxuXG4gICAgS0VZRE9XTjogMTAxMCxcbiAgICBLRVlVUDogMTAxMVxufTtcblxuZXhwb3J0IGNvbnN0IENPTlRST0xDT0RFUyA9IHtcbiAgICBQTEFZQlROOiAyMDAwLFxuICAgIFBBVVNFQlROOiAyMDAxLFxuICAgIFRSQUlMT0ZGQlROOiAyMDAyLFxuICAgIFRSQUlMT05CVE46IDIwMDNcbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RFdmVudHMge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgYXJncy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHVzYWJsZSBjYW52YXMgZWxlbWVudCB3YXMgZ2l2ZW4uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncmlkID0gYXJncy5ncmlkO1xuICAgICAgICB0aGlzLmNvbnRyb2xzID0gYXJncy5jb250cm9scztcbiAgICAgICAgdGhpcy5wbGF5QnRuID0gYXJncy5wbGF5QnRuO1xuICAgICAgICB0aGlzLnBhdXNlQnRuID0gYXJncy5wYXVzZUJ0bjtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0biA9IGFyZ3MudHJhaWxPZmZCdG47XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0biA9IGFyZ3MudHJhaWxPbkJ0bjtcblxuICAgICAgICB0aGlzLndpcmV1cEV2ZW50cygpO1xuICAgIH1cblxuICAgIHFhZGQoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICB9XG5cbiAgICBxcG9sbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuc2hpZnQoKTtcbiAgICB9XG5cbiAgICBxZ2V0KCkge1xuICAgICAgICAvLyBSZXBsYWNpbmcgdGhlIHJlZmVyZW5jZSBpcyBmYXN0ZXIgdGhhbiBgc3BsaWNlKClgXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnF1ZXVlO1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgICAgIHJldHVybiByZWY7XG4gICAgfVxuXG4gICAgcWNsZWFyKCkge1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgfVxuXG4gICAgd2lyZXVwRXZlbnRzKCkge1xuICAgICAgICAvLyBHcmlkIG1vdXNlIGV2ZW50c1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLmhhbmRsZURibENsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZU1vdXNlRG93bi5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmhhbmRsZU1vdXNlVXAuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCB0aGlzLmhhbmRsZU1vdXNlV2hlZWwuYmluZCh0aGlzKSk7XG4gICAgICAgIC8vIEZpcmVmb3gtc3BlY2lmaWMgRE9NIHNjcm9sbFxuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCB0aGlzLmhhbmRsZU1vdXNlV2hlZWwuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gR3JpZCBrZXkgZXZlbnRzXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5oYW5kbGVLZXlVcC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBDb250cm9sIGV2ZW50c1xuICAgICAgICB0aGlzLnBsYXlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QTEFZQlROKSk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QQVVTRUJUTikpO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPRkZCVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPTkJUTikpO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLkNMSUNLLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlRGJsQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuREJMQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZURvd24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VET1dOLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRVVQLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFTU9WRSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlV2hlZWwoZXZlbnQpIHtcbiAgICAgICAgLy8gQWNjb3VudCBmb3IgZGlzY3JlcGFuY2llcyBiZXR3ZWVuIEZpcmVmb3ggYW5kIFdlYmtpdFxuICAgICAgICBsZXQgZGVsdGEgPSBldmVudC53aGVlbERlbHRhID9cbiAgICAgICAgICAgIChldmVudC53aGVlbERlbHRhIC8gMTIwKSA6XG4gICAgICAgICAgICAoZXZlbnQuZGV0YWlsIC8gLTMpO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFV0hFRUwsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICB3aGVlbGRlbHRhOiBkZWx0YSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBzY3JvbGxpbmdcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlEb3duKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlET1dOLFxuICAgICAgICAgICAga2V5Y29kZToga2V5LFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUtleVVwKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlVUCxcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250cm9sQ2xpY2sodHlwZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRQb3NpdGlvbihldmVudCkge1xuICAgICAgICAvLyBDYWxjdWxhdGUgb2Zmc2V0IG9uIHRoZSBncmlkIGZyb20gY2xpZW50WC9ZLCBiZWNhdXNlXG4gICAgICAgIC8vIHNvbWUgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBldmVudC5vZmZzZXRYL1lcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LmNsaWVudFggLSB0aGlzLmdyaWQub2Zmc2V0TGVmdCxcbiAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFkgLSB0aGlzLmdyaWQub2Zmc2V0VG9wXG4gICAgICAgIH07XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vZXZlbnRzXG4iLCIvKipcbiAqIGdyYXZpdG9uL2dmeCAtLSBUaGUgZ3JhcGhpY3Mgb2JqZWN0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0R2Z4IHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHVzYWJsZSBjYW52YXMgZWxlbWVudCB3YXMgZ2l2ZW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuZ3JpZC5nZXRDb250ZXh0KCcyZCcpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICAvLyBTZXR0aW5nIHRoZSB3aWR0aCBoYXMgdGhlIHNpZGUgZWZmZWN0XG4gICAgICAgIC8vIG9mIGNsZWFyaW5nIHRoZSBjYW52YXNcbiAgICAgICAgdGhpcy5ncmlkLndpZHRoID0gdGhpcy5ncmlkLndpZHRoO1xuICAgIH1cblxuICAgIGRyYXdCb2RpZXMoYm9kaWVzKSB7XG4gICAgICAgIGZvciAobGV0IGJvZHkgb2YgYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdCb2R5KGJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0JvZHkoYm9keSkge1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBib2R5LmNvbG9yO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5hcmMoYm9keS54LCBib2R5LnksIGJvZHkucmFkaXVzLCAwLCBNYXRoLlBJICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuICAgIH1cblxuICAgIGRyYXdSZXRpY2xlTGluZShhcmdzKSB7XG4gICAgICAgIGxldCBncmFkID0gdGhpcy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoYXJncy5mcm9tLngsIGFyZ3MuZnJvbS55LCBhcmdzLnRvLngsIGFyZ3MudG8ueSk7XG4gICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDMxLCA3NSwgMTMwLCAxKScpO1xuICAgICAgICBncmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgzMSwgNzUsIDEzMCwgMC4xKScpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGdyYWQ7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDY7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuXG4gICAgICAgIC8vIERyYXcgaW5pdGlhbCBiYWNrZ3JvdW5kIGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oYXJncy5mcm9tLngsIGFyZ3MuZnJvbS55KTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKGFyZ3MudG8ueCwgYXJncy50by55KTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgLy8gRHJhdyBvdmVybGF5IGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJyMzNDc3Q0EnO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAyO1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGFyZ3MuZnJvbS54LCBhcmdzLmZyb20ueSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyhhcmdzLnRvLngsIGFyZ3MudG8ueSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2dmeFxuIiwiLyoqXG4gKiBncmF2aXRvbi9zaW0gLS0gVGhlIGdyYXZpdGF0aW9uYWwgc2ltdWxhdG9yXG4gKi9cbmltcG9ydCBsb2cgZnJvbSAnLi4vdXRpbC9sb2cnO1xuaW1wb3J0IEd0Qm9keSBmcm9tICcuL2JvZHknO1xuaW1wb3J0IEd0VHJlZSBmcm9tICcuL3RyZWUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFNpbSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ib2RpZXMgPSBbXTtcbiAgICAgICAgdGhpcy50cmVlID0gbmV3IEd0VHJlZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCk7XG4gICAgICAgIHRoaXMudGltZSA9IDA7XG5cbiAgICAgICAgLy8gVGVtcG9yYXJ5IHdvcmtzcGFjZVxuICAgICAgICB0aGlzLkQgPSB7fTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMuRyA9IGFyZ3MuRyB8fCA2LjY3Mzg0ICogTWF0aC5wb3coMTAsIC0xMSk7IC8vIEdyYXZpdGF0aW9uYWwgY29uc3RhbnRcbiAgICAgICAgdGhpcy5vcHRpb25zLm11bHRpcGxpZXIgPSBhcmdzLm11bHRpcGxpZXIgfHwgMTUwMDsgLy8gVGltZXN0ZXBcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbGxpc2lvbnMgPSBhcmdzLmNvbGxpc2lvbiB8fCB0cnVlO1xuICAgICAgICB0aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0ID0gYXJncy5zY2F0dGVyTGltaXQgfHwgMTAwMDA7XG4gICAgfVxuXG4gICAgc3RlcChlbGFwc2VkKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29sbGlzaW9ucyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IElzIHRoaXMgdXNlZnVsP1xuICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0Q29sbGlzaW9uKGJvZHksIGkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZU5ld1Bvc2l0aW9uKGJvZHksIGksIGVsYXBzZWQgKiB0aGlzLm9wdGlvbnMubXVsdGlwbGllcik7XG5cbiAgICAgICAgICAgIGkgPSB0aGlzLnJlbW92ZVNjYXR0ZXJlZChib2R5LCBpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGltZSArPSBlbGFwc2VkOyAvLyBJbmNyZW1lbnQgcnVudGltZVxuICAgIH1cblxuICAgIGNhbGN1bGF0ZU5ld1Bvc2l0aW9uKGJvZHksIGluZGV4LCBkZWx0YVQpIHtcbiAgICAgICAgbGV0IG5ldEZ4ID0gMDtcbiAgICAgICAgbGV0IG5ldEZ5ID0gMDtcblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGJvZGllcyBhbmQgc3VtIHRoZSBmb3JjZXMgZXhlcnRlZFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyYWN0b3IgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCkge1xuICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgZGlzdGFuY2UgYW5kIHBvc2l0aW9uIGRlbHRhc1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRGlzdGFuY2UoYm9keSwgYXR0cmFjdG9yKTtcblxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBmb3JjZSB1c2luZyBOZXd0b25pYW4gZ3Jhdml0eSwgc2VwYXJhdGUgb3V0IGludG8geCBhbmQgeSBjb21wb25lbnRzXG4gICAgICAgICAgICAgICAgbGV0IEYgPSAodGhpcy5vcHRpb25zLkcgKiBib2R5Lm1hc3MgKiBhdHRyYWN0b3IubWFzcykgLyBNYXRoLnBvdyh0aGlzLkQuciwgMik7XG4gICAgICAgICAgICAgICAgbGV0IEZ4ID0gRiAqICh0aGlzLkQuZHggLyB0aGlzLkQucik7XG4gICAgICAgICAgICAgICAgbGV0IEZ5ID0gRiAqICh0aGlzLkQuZHkgLyB0aGlzLkQucik7XG5cbiAgICAgICAgICAgICAgICBuZXRGeCArPSBGeDtcbiAgICAgICAgICAgICAgICBuZXRGeSArPSBGeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBhY2NlbGVyYXRpb25zXG4gICAgICAgIGxldCBheCA9IG5ldEZ4IC8gYm9keS5tYXNzO1xuICAgICAgICBsZXQgYXkgPSBuZXRGeSAvIGJvZHkubWFzcztcblxuICAgICAgICAvLyBDYWxjdWxhdGUgbmV3IHZlbG9jaXRpZXMsIG5vcm1hbGl6ZWQgYnkgdGhlICd0aW1lJyBpbnRlcnZhbFxuICAgICAgICBib2R5LnZlbFggKz0gZGVsdGFUICogYXg7XG4gICAgICAgIGJvZHkudmVsWSArPSBkZWx0YVQgKiBheTtcblxuICAgICAgICAvLyBDYWxjdWxhdGUgbmV3IHBvc2l0aW9ucyBhZnRlciB0aW1lc3RlcCBkZWx0YVRcbiAgICAgICAgYm9keS54ICs9IGRlbHRhVCAqIGJvZHkudmVsWDtcbiAgICAgICAgYm9keS55ICs9IGRlbHRhVCAqIGJvZHkudmVsWTtcbiAgICB9XG5cbiAgICBjYWxjdWxhdGVEaXN0YW5jZShib2R5LCBvdGhlcikge1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNoYW5nZSBpbiBwb3NpdGlvbiBhbG9uZyB0aGUgdHdvIGRpbWVuc2lvbnNcbiAgICAgICAgdGhpcy5ELmR4ID0gb3RoZXIueCAtIGJvZHkueDtcbiAgICAgICAgdGhpcy5ELmR5ID0gb3RoZXIueSAtIGJvZHkueTtcblxuICAgICAgICAvLyBPYnRhaW4gdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIG9iamVjdHMgKGh5cG90ZW51c2UpXG4gICAgICAgIHRoaXMuRC5yID0gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuRC5keCwgMikgKyBNYXRoLnBvdyh0aGlzLkQuZHksIDIpKTtcbiAgICB9XG5cbiAgICBkZXRlY3RDb2xsaXNpb24oYm9keSwgaW5kZXgpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY29sbGlkZXIgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRGlzdGFuY2UoYm9keSwgY29sbGlkZXIpO1xuICAgICAgICAgICAgICAgIGxldCBjbGVhcmFuY2UgPSBib2R5LnJhZGl1cyArIGNvbGxpZGVyLnJhZGl1cztcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLkQuciA8PSBjbGVhcmFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29sbGlzaW9uIGRldGVjdGVkXG4gICAgICAgICAgICAgICAgICAgIGxvZy53cml0ZSgnQ29sbGlzaW9uIGRldGVjdGVkISEnLCAnZGVidWcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW1vdmVTY2F0dGVyZWQoYm9keSwgaW5kZXgpIHtcbiAgICAgICAgaWYgKGJvZHkueCA+IHRoaXMub3B0aW9ucy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgIGJvZHkueCA8IC10aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0IHx8XG4gICAgICAgICAgICBib2R5LnkgPiB0aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0IHx8XG4gICAgICAgICAgICBib2R5LnkgPCAtdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCkge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGZyb20gYm9keSBjb2xsZWN0aW9uXG4gICAgICAgICAgICB0aGlzLmJvZGllcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4IC0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuXG4gICAgYWRkTmV3Qm9keShhcmdzKSB7XG4gICAgICAgIGxldCBib2R5ID0gbmV3IEd0Qm9keShhcmdzKTtcbiAgICAgICAgdGhpcy5ib2RpZXMucHVzaChib2R5KTtcbiAgICAgICAgdGhpcy50cmVlLmFkZEJvZHkoYm9keSk7XG5cbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfVxuXG4gICAgcmVtb3ZlQm9keShpbmRleCkge1xuICAgICAgICB0aGlzLmJvZGllcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmJvZGllcy5sZW5ndGggPSAwOyAvLyBSZW1vdmUgYWxsIGJvZGllcyBmcm9tIGNvbGxlY3Rpb25cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9zaW1cbiIsIi8qKlxuICogZ3Jhdml0b24vdGltZXIgLS0gU2ltIHRpbWVyIGFuZCBGUFMgbGltaXRlclxuICovXG5pbXBvcnQgZW52IGZyb20gJy4uL3V0aWwvZW52JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RUaW1lciB7XG4gICAgY29uc3RydWN0b3IoZm4sIGZwcz1udWxsKSB7XG4gICAgICAgIHRoaXMuX2ZuID0gZm47XG4gICAgICAgIHRoaXMuX2ZwcyA9IGZwcztcbiAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faXNBbmltYXRpb24gPSBmcHMgPT09IG51bGw7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gbnVsbDtcblxuICAgICAgICB0aGlzLl93aW5kb3cgPSBlbnYuZ2V0V2luZG93KCk7XG4gICAgfVxuXG4gICAgZ2V0IGFjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQWN0aXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkludGVydmFsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9jYW5jZWxsYXRpb25JZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jbGVhckludGVydmFsKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfYmVnaW5BbmltYXRpb24oKSB7XG4gICAgICAgIGxldCBsYXN0VGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICBsZXQgYW5pbWF0b3IgPSAodGltZXN0YW1wKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgICAgICAgICAgdGhpcy5fZm4odGltZXN0YW1wIC0gbGFzdFRpbWVzdGFtcCk7XG4gICAgICAgICAgICBsYXN0VGltZXN0YW1wID0gdGltZXN0YW1wO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIERlbGF5IGluaXRpYWwgZXhlY3V0aW9uIHVudGlsIHRoZSBuZXh0IHRpY2suXG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgfVxuXG4gICAgX2JlZ2luSW50ZXJ2YWwoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGRlbGF5IHBlciB0aWNrLCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICAgIGxldCB0aW1lb3V0ID0gMTAwMCAvIHRoaXMuX2ZwcyB8IDA7XG5cbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIGxldCB0aW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90aW1lclxuIiwiLyoqXG4gKiBncmF2aXRvbi90cmVlIC0tIFRoZSBncmF2aXRhdGlvbmFsIGJvZHkgdHJlZSBzdHJ1Y3R1cmVcbiAqL1xuY2xhc3MgR3RUcmVlTm9kZSB7XG4gICAgY29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmhhbGZXaWR0aCA9IHdpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5oYWxmSGVpZ2h0ID0gaGVpZ2h0IC8gMjtcblxuICAgICAgICB0aGlzLm1pZFggPSB0aGlzLnggKyB0aGlzLmhhbGZXaWR0aDtcbiAgICAgICAgdGhpcy5taWRZID0gdGhpcy55ICsgdGhpcy5oYWxmSGVpZ2h0O1xuXG4gICAgICAgIHRoaXMubWFzcyA9IDA7XG4gICAgICAgIHRoaXMubWFzc1ggPSAwO1xuICAgICAgICB0aGlzLm1hc3NZID0gMDtcblxuICAgICAgICAvLyBbTlcsIE5FLCBTVywgU0VdXG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBuZXcgQXJyYXkoNCk7XG4gICAgfVxuXG4gICAgYWRkQm9keShib2R5KSB7XG4gICAgICAgIHRoaXMudXBkYXRlTWFzcyhib2R5KTtcbiAgICAgICAgY29uc3QgcXVhZHJhbnQgPSB0aGlzLmdldFF1YWRyYW50KGJvZHkpO1xuXG4gICAgICAgIGlmICghdGhpcy5jaGlsZHJlbltxdWFkcmFudF0pIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5jaGlsZHJlbltxdWFkcmFudF07XG4gICAgICAgICAgICBjb25zdCBxdWFkWCA9IGV4aXN0aW5nLnggPiB0aGlzLm1pZFggPyB0aGlzLm1pZFggOiB0aGlzLng7XG4gICAgICAgICAgICBjb25zdCBxdWFkWSA9IGV4aXN0aW5nLnkgPiB0aGlzLm1pZFkgPyB0aGlzLm1pZFkgOiB0aGlzLnk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbmV3IEd0VHJlZU5vZGUocXVhZFgsIHF1YWRZLCB0aGlzLmhhbGZXaWR0aCwgdGhpcy5oYWxmSGVpZ2h0KTtcblxuICAgICAgICAgICAgbm9kZS5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShib2R5KTtcblxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBub2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlTWFzcyhib2R5KSB7XG4gICAgICAgIGNvbnN0IG5ld01hc3MgPSB0aGlzLm1hc3MgKyBib2R5Lm1hc3M7XG4gICAgICAgIGNvbnN0IG5ld01hc3NYID0gKHRoaXMubWFzc1ggKiB0aGlzLm1hc3MgKyBib2R5LnggKiBib2R5Lm1hc3MpIC8gbmV3TWFzcztcbiAgICAgICAgY29uc3QgbmV3TWFzc1kgPSAodGhpcy5tYXNzWSAqIHRoaXMubWFzcyArIGJvZHkueSAqIGJvZHkubWFzcykgLyBuZXdNYXNzO1xuICAgICAgICB0aGlzLm1hc3MgPSBuZXdNYXNzO1xuICAgICAgICB0aGlzLm1hc3NYID0gbmV3TWFzc1g7XG4gICAgICAgIHRoaXMubWFzc1kgPSBuZXdNYXNzWTtcbiAgICB9XG5cbiAgICBnZXRRdWFkcmFudChib2R5KSB7XG4gICAgICAgIGNvbnN0IHhJbmRleCA9IE51bWJlcihib2R5LnggPiB0aGlzLm1pZFgpO1xuICAgICAgICBjb25zdCB5SW5kZXggPSBOdW1iZXIoYm9keS55ID4gdGhpcy5taWRZKSAqIDI7XG4gICAgICAgIHJldHVybiB4SW5kZXggKyB5SW5kZXg7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRyZWUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgR3RUcmVlTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMucm9vdCkge1xuICAgICAgICAgICAgdGhpcy5yb290ID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yb290O1xuICAgICAgICAgICAgdGhpcy5yb290ID0gbmV3IEd0VHJlZU5vZGUoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoZXhpc3RpbmcpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90cmVlXG4iLCJpbXBvcnQgJy4vcG9seWZpbGxzJztcbmltcG9ydCBndCBmcm9tICcuL2dyYXZpdG9uJztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFN0YXJ0IHRoZSBtYWluIGdyYXZpdG9uIGFwcC5cbiAgICB3aW5kb3cuZ3Jhdml0b24gPSBuZXcgZ3QuYXBwKCk7XG59O1xuIiwid2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcbiAgICB9O1xuXG53aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICBmdW5jdGlvbih0aW1lb3V0SWQpIHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH07XG5cbndpbmRvdy5wZXJmb3JtYW5jZSA9IHdpbmRvdy5wZXJmb3JtYW5jZSB8fCB7fTtcbndpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93IHx8XG4gICAgd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdyB8fFxuICAgIHdpbmRvdy5wZXJmb3JtYW5jZS5tb3pOb3cgfHxcbiAgICBEYXRlLm5vdztcbiIsIi8qKlxuICogZW52IC0gRW52aXJvbm1lbnQgcmV0cmlldmFsIG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXRXaW5kb3coKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxufTtcbiIsIi8qKlxuICogbG9nIC0tIExvZ2dpbmcgZnVuY3Rpb25zXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgbG9nTGV2ZWw6IG51bGxcbiAgICB9LFxuXG4gICAgd3JpdGUobWVzc2FnZSwgbGV2ZWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBsZXQgc3RhbXAgPSBub3cuZ2V0RnVsbFllYXIoKSArICctJyArIG5vdy5nZXRNb250aCgpICsgJy0nICsgbm93LmdldERhdGUoKSArICdUJyArXG4gICAgICAgICAgICAgICAgbm93LmdldEhvdXJzKCkgKyAnOicgKyBub3cuZ2V0TWludXRlcygpICsgJzonICsgbm93LmdldFNlY29uZHMoKSArICc6JyArIG5vdy5nZXRNaWxsaXNlY29uZHMoKTtcblxuICAgICAgICAgICAgbWVzc2FnZSA9IHN0YW1wICsgJyAnICsgbWVzc2FnZTtcblxuICAgICAgICAgICAgbGV2ZWwgPSAobGV2ZWwgfHwgdGhpcy5jb25maWcubG9nTGV2ZWwgfHwgJ2RlYnVnJykudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgLy8gV3JpdGUgdG8gY29uc29sZSAtLSBjdXJyZW50bHksIGBsb2dgLCBgZGVidWdgLCBgaW5mb2AsIGB3YXJuYCwgYW5kIGBlcnJvcmBcbiAgICAgICAgICAgIC8vIGFyZSBhdmFpbGFibGVcbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgICAgIGlmIChjb25zb2xlW2xldmVsXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGVbbGV2ZWxdKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignTG9nIGxldmVsIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0TGV2ZWwobGV2ZWwpIHtcbiAgICAgICAgbGV2ZWwgPSBsZXZlbC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChjb25zb2xlW2xldmVsXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmxvZ0xldmVsID0gbGV2ZWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignTG9nIGxldmVsIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsIi8qKlxuICogcmFuZG9tIC0tIEEgY29sbGVjdGlvbiBvZiByYW5kb20gZ2VuZXJhdG9yIGZ1bmN0aW9uc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyIGJldHdlZW4gdGhlIGdpdmVuIHN0YXJ0IGFuZCBlbmQgcG9pbnRzXG4gICAgICovXG4gICAgbnVtYmVyKGZyb20sIHRvPW51bGwpIHtcbiAgICAgICAgaWYgKHRvID09PSBudWxsKSB7XG4gICAgICAgICAgICB0byA9IGZyb207XG4gICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKHRvIC0gZnJvbSkgKyBmcm9tO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gdGhlIGdpdmVuIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGludGVnZXIoLi4uYXJncykge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLm51bWJlciguLi5hcmdzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciwgd2l0aCBhIHJhbmRvbSBzaWduLCBiZXR3ZWVuIHRoZSBnaXZlblxuICAgICAqIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGRpcmVjdGlvbmFsKC4uLmFyZ3MpIHtcbiAgICAgICAgbGV0IHJhbmQgPSB0aGlzLm51bWJlciguLi5hcmdzKTtcbiAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgICAgICAgIHJhbmQgPSAtcmFuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmFuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaGV4YWRlY2ltYWwgY29sb3JcbiAgICAgKi9cbiAgICBjb2xvcigpIHtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMDAwMDAnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwKS50b1N0cmluZygxNikpLnN1YnN0cigtNik7XG4gICAgfVxufTtcbiJdfQ==
