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
/* global jscolor */

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
        this.interaction = { previous: {} };
        this.targetBody = undefined;

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

        this.colorPicker = typeof args.colorPicker === 'string' ? document.getElementById(args.colorPicker) : args.colorPicker;

        if (typeof this.colorPicker === 'undefined') {
            this.colorPicker = document.createElement('input');
            this.colorPicker.className = 'bodycolorpicker';
            document.body.appendChild(this.colorPicker);
            args.colorPicker = this.colorPicker;
        }
        this.jscolor = new jscolor(this.colorPicker, {
            width: 101,
            padding: 0,
            shadow: false,
            borderWidth: 0,
            backgroundColor: 'transparent',
            insetColor: '#000',
            onFineChange: this.updateColor.bind(this)
        });

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
                        if (event.button === /* right click */2) {
                            // Remove body.
                            if (this.targetBody) {
                                this.sim.removeBody(this.targetBody);
                                this.targetBody = undefined;
                            }
                        } else if (event.button === /* middle click */1) {
                            // Color picking
                            if (this.targetBody) {
                                this.colorPicker.style.left = event.position.x + 'px';
                                this.colorPicker.style.top = event.position.y + 'px';
                                this.jscolor.fromString(this.targetBody.color);
                                this.jscolor.show();
                            }
                        } else {
                            // Add flag to signal other events
                            this.interaction.started = true;

                            if (this.targetBody) {
                                this.interaction.body = this.targetBody;
                            } else {
                                this.interaction.body = this.sim.addNewBody({
                                    x: event.position.x,
                                    y: event.position.y
                                });
                            }

                            this.interaction.previous.x = event.position.x;
                            this.interaction.previous.y = event.position.y;
                        }
                        break; // end MOUSEDOWN

                    case _events.EVENTCODES.MOUSEUP:
                        if (this.interaction.started) {
                            this.interaction.started = false;

                            var body = this.interaction.body;

                            body.velX = (event.position.x - body.x) * 0.0000001;
                            body.velY = (event.position.y - body.y) * 0.0000001;
                        }
                        this.updateTarget(event.position.x, event.position.y);
                        break;

                    case _events.EVENTCODES.MOUSEMOVE:
                        this.interaction.previous.x = event.position.x;
                        this.interaction.previous.y = event.position.y;
                        if (!this.interaction.started) {
                            this.updateTarget(event.position.x, event.position.y);
                        }
                        break; // end MOUSEMOVE

                    case _events.EVENTCODES.MOUSEWHEEL:
                        if (this.targetBody) {
                            this.targetBody.adjustSize(event.delta);
                        }
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
            this.gfx.drawBodies(this.sim.bodies, this.targetBody);
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
                this.gfx.drawReticleLine(this.interaction.body, this.interaction.previous);
            }
        }
    }, {
        key: 'updateTarget',
        value: function updateTarget(x, y) {
            this.targetBody = this.sim.getBodyAt(x, y);
        }
    }, {
        key: 'updateColor',
        value: function updateColor() {
            if (this.targetBody) {
                this.targetBody.updateColor(this.jscolor.toHEXString());
            }
        }
    }]);

    return GtApp;
})(); // end graviton/app

exports.default = GtApp;

},{"../util/random":14,"./events":4,"./gfx":5,"./sim":6,"./timer":7}],3:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _colors = require('../util/colors');

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/body -- The gravitational body
 */

var GtBody = (function () {
    function GtBody(args) {
        _classCallCheck(this, GtBody);

        args = args || {};

        this.x = args.x;
        this.y = args.y;
        if (typeof this.x !== 'number' || typeof this.y !== 'number') {
            throw Error('Correct positions were not given for the body.');
        }

        this.velX = args.velX || 0;
        this.velY = args.velY || 0;

        this.radius = args.radius || 10;
        // Initialized below.
        this.mass = undefined;
        this.color = undefined;
        this.highlight = undefined;

        this.updateColor(args.color || '#BABABA');
        this.adjustSize(0);
    }

    _createClass(GtBody, [{
        key: 'adjustSize',
        value: function adjustSize(delta) {
            this.radius = Math.max(this.radius + delta, 2);
            // Dorky formula to make mass scale "properly" with radius.
            this.mass = Math.pow(this.radius / 4, 3);
        }
    }, {
        key: 'updateColor',
        value: function updateColor(color) {
            this.color = color;
            this.highlight = _colors2.default.toHex(_colors2.default.brighten(_colors2.default.fromHex(this.color), .25));
        }
    }]);

    return GtBody;
})(); // end graviton/body

exports.default = GtBody;

},{"../util/colors":11}],4:[function(require,module,exports){
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

            this.grid.addEventListener('contextmenu', this.handleContextMenu.bind(this));
            this.grid.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.grid.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.grid.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.grid.addEventListener('wheel', this.handleMouseWheel.bind(this));

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
        key: 'handleContextMenu',
        value: function handleContextMenu(event) {
            // Prevent right-click menu
            event.preventDefault();
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
            // Reverse the up/down.
            var delta = -event.deltaY / 50;

            this.qadd({
                type: EVENTCODES.MOUSEWHEEL,
                position: this.getPosition(event),
                delta: delta,
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
        value: function drawBodies(bodies, targetBody) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = bodies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var body = _step.value;

                    this.drawBody(body, /* isTargeted */body === targetBody);
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
        value: function drawBody(body, isTargeted) {
            this.ctx.fillStyle = body.color;

            this.ctx.beginPath();
            this.ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);

            this.ctx.fill();
            if (isTargeted) {
                this.ctx.strokeStyle = body.highlight;
                this.ctx.lineWidth = Math.round(body.radius / 8);
                this.ctx.stroke();
            }
        }
    }, {
        key: 'drawReticleLine',
        value: function drawReticleLine(from, to) {
            var grad = this.ctx.createLinearGradient(from.x, from.y, to.x, to.y);
            grad.addColorStop(0, 'rgba(31, 75, 130, 1)');
            grad.addColorStop(1, 'rgba(31, 75, 130, 0.1)');
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = 'round';

            // Draw initial background line.
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.stroke();

            // Draw overlay line.
            this.ctx.strokeStyle = '#3477CA';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
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
                // TODO: Implement for tree.
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
        value: function removeBody(targetBody) {
            for (var i = 0; i < this.bodies.length; i++) {
                var body = this.bodies[i];
                if (body === targetBody) {
                    this.bodies.splice(i, 1);
                    break;
                }
            }
            this.resetTree();
        }
    }, {
        key: 'getBodyAt',
        value: function getBodyAt(x, y) {
            for (var i = this.bodies.length - 1; i >= 0; i--) {
                var body = this.bodies[i];
                var isMatch = Math.abs(x - body.x) <= body.radius && Math.abs(y - body.y) <= body.radius;
                if (isMatch) {
                    return body;
                }
            }
            return undefined;
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.bodies.length = 0; // Remove all bodies from collection
            this.resetTree();
        }
    }, {
        key: 'resetTree',
        value: function resetTree() {
            this.tree.clear();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.bodies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var body = _step.value;

                    this.tree.addBody(body);
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
    }]);

    return GtSim;
})(); // end graviton/sim

exports.default = GtSim;

},{"../util/log":13,"./body":3,"./tree":8}],7:[function(require,module,exports){
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

},{"../util/env":12}],8:[function(require,module,exports){
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
    function GtTreeNode(startX, startY, width, height) {
        _classCallCheck(this, GtTreeNode);

        this.startX = startX;
        this.startY = startY;
        this.width = width;
        this.height = height;
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;

        this.midX = this.startX + this.halfWidth;
        this.midY = this.startY + this.halfHeight;

        this.mass = 0;
        this.x = 0;
        this.y = 0;

        // [NW, NE, SW, SE]
        this.children = new Array(4);
    }

    _createClass(GtTreeNode, [{
        key: "addBody",
        value: function addBody(body) {
            this.updateMass(body);
            var quadrant = this.getQuadrant(body.x, body.y);

            if (!this.children[quadrant]) {
                this.children[quadrant] = body;
            } else {
                var existing = this.children[quadrant];
                var quadX = existing.x > this.midX ? this.midX : this.startX;
                var quadY = existing.y > this.midY ? this.midY : this.startY;
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
            var newX = (this.x * this.mass + body.x * body.mass) / newMass;
            var newY = (this.y * this.mass + body.y * body.mass) / newMass;
            this.mass = newMass;
            this.x = newX;
            this.y = newY;
        }
    }, {
        key: "getQuadrant",
        value: function getQuadrant(x, y) {
            var xIndex = Number(x > this.midX);
            var yIndex = Number(y > this.midY) * 2;
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
    }, {
        key: "clear",
        value: function clear() {
            this.root = undefined;
        }
    }]);

    return GtTree;
})(); // end graviton/tree

exports.default = GtTree;

},{}],9:[function(require,module,exports){
'use strict';

require('./vendor/jscolor');

require('./polyfills');

var _graviton = require('./graviton');

var _graviton2 = _interopRequireDefault(_graviton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.onload = function () {
    // Start the main graviton app.
    window.graviton = new _graviton2.default.app();
};

},{"./graviton":1,"./polyfills":10,"./vendor/jscolor":15}],10:[function(require,module,exports){
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
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * colors -- Color manipulation helpers
 */
exports.default = {
    brighten: function brighten(colorArray, percent) {
        var _colorArray = _slicedToArray(colorArray, 3);

        var r = _colorArray[0];
        var g = _colorArray[1];
        var b = _colorArray[2];

        r = Math.round(Math.min(Math.max(0, r + r * percent), 255));
        g = Math.round(Math.min(Math.max(0, g + g * percent), 255));
        b = Math.round(Math.min(Math.max(0, b + b * percent), 255));
        return [r, g, b];
    },
    fromHex: function fromHex(hex) {
        var h = hex.replace('#', '');
        if (h.length < 6) {
            h = h.replace(/(.)/g, '$1$1');
        }
        return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
    },
    toHex: function toHex(colorArray) {
        var _colorArray2 = _slicedToArray(colorArray, 3);

        var r = _colorArray2[0];
        var g = _colorArray2[1];
        var b = _colorArray2[2];

        return '#' + ('0' + r.toString(16)).substr(r < 16 ? 0 : 1) + ('0' + g.toString(16)).substr(g < 16 ? 0 : 1) + ('0' + b.toString(16)).substr(b < 16 ? 0 : 1);
    }
};

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
/**
 * jscolor - JavaScript Color Picker
 *
 * @link    http://jscolor.com
 * @license For open source use: GPLv3
 *          For commercial use: JSColor Commercial License
 * @author  Jan Odvarko
 * @version 2.0.4
 *
 * See usage examples at http://jscolor.com/examples/
 */

"use strict";

if (!window.jscolor) {
	window.jscolor = (function () {

		var jsc = {

			register: function register() {
				jsc.attachDOMReadyEvent(jsc.init);
				jsc.attachEvent(document, 'mousedown', jsc.onDocumentMouseDown);
				jsc.attachEvent(document, 'touchstart', jsc.onDocumentTouchStart);
				jsc.attachEvent(window, 'resize', jsc.onWindowResize);
			},

			init: function init() {
				if (jsc.jscolor.lookupClass) {
					jsc.jscolor.installByClassName(jsc.jscolor.lookupClass);
				}
			},

			tryInstallOnElements: function tryInstallOnElements(elms, className) {
				var matchClass = new RegExp('(^|\\s)(' + className + ')(\\s*(\\{[^}]*\\})|\\s|$)', 'i');

				for (var i = 0; i < elms.length; i += 1) {
					if (elms[i].type !== undefined && elms[i].type.toLowerCase() == 'color') {
						if (jsc.isColorAttrSupported) {
							// skip inputs of type 'color' if supported by the browser
							continue;
						}
					}
					var m;
					if (!elms[i].jscolor && elms[i].className && (m = elms[i].className.match(matchClass))) {
						var targetElm = elms[i];
						var optsStr = null;

						var dataOptions = jsc.getDataAttr(targetElm, 'jscolor');
						if (dataOptions !== null) {
							optsStr = dataOptions;
						} else if (m[4]) {
							optsStr = m[4];
						}

						var opts = {};
						if (optsStr) {
							try {
								opts = new Function('return (' + optsStr + ')')();
							} catch (eParseError) {
								jsc.warn('Error parsing jscolor options: ' + eParseError + ':\n' + optsStr);
							}
						}
						targetElm.jscolor = new jsc.jscolor(targetElm, opts);
					}
				}
			},

			isColorAttrSupported: (function () {
				var elm = document.createElement('input');
				if (elm.setAttribute) {
					elm.setAttribute('type', 'color');
					if (elm.type.toLowerCase() == 'color') {
						return true;
					}
				}
				return false;
			})(),

			isCanvasSupported: (function () {
				var elm = document.createElement('canvas');
				return !!(elm.getContext && elm.getContext('2d'));
			})(),

			fetchElement: function fetchElement(mixed) {
				return typeof mixed === 'string' ? document.getElementById(mixed) : mixed;
			},

			isElementType: function isElementType(elm, type) {
				return elm.nodeName.toLowerCase() === type.toLowerCase();
			},

			getDataAttr: function getDataAttr(el, name) {
				var attrName = 'data-' + name;
				var attrValue = el.getAttribute(attrName);
				if (attrValue !== null) {
					return attrValue;
				}
				return null;
			},

			attachEvent: function attachEvent(el, evnt, func) {
				if (el.addEventListener) {
					el.addEventListener(evnt, func, false);
				} else if (el.attachEvent) {
					el.attachEvent('on' + evnt, func);
				}
			},

			detachEvent: function detachEvent(el, evnt, func) {
				if (el.removeEventListener) {
					el.removeEventListener(evnt, func, false);
				} else if (el.detachEvent) {
					el.detachEvent('on' + evnt, func);
				}
			},

			_attachedGroupEvents: {},

			attachGroupEvent: function attachGroupEvent(groupName, el, evnt, func) {
				if (!jsc._attachedGroupEvents.hasOwnProperty(groupName)) {
					jsc._attachedGroupEvents[groupName] = [];
				}
				jsc._attachedGroupEvents[groupName].push([el, evnt, func]);
				jsc.attachEvent(el, evnt, func);
			},

			detachGroupEvents: function detachGroupEvents(groupName) {
				if (jsc._attachedGroupEvents.hasOwnProperty(groupName)) {
					for (var i = 0; i < jsc._attachedGroupEvents[groupName].length; i += 1) {
						var evt = jsc._attachedGroupEvents[groupName][i];
						jsc.detachEvent(evt[0], evt[1], evt[2]);
					}
					delete jsc._attachedGroupEvents[groupName];
				}
			},

			attachDOMReadyEvent: function attachDOMReadyEvent(func) {
				var fired = false;
				var fireOnce = function fireOnce() {
					if (!fired) {
						fired = true;
						func();
					}
				};

				if (document.readyState === 'complete') {
					setTimeout(fireOnce, 1); // async
					return;
				}

				if (document.addEventListener) {
					document.addEventListener('DOMContentLoaded', fireOnce, false);

					// Fallback
					window.addEventListener('load', fireOnce, false);
				} else if (document.attachEvent) {
					// IE
					document.attachEvent('onreadystatechange', function () {
						if (document.readyState === 'complete') {
							document.detachEvent('onreadystatechange', arguments.callee);
							fireOnce();
						}
					});

					// Fallback
					window.attachEvent('onload', fireOnce);

					// IE7/8
					if (document.documentElement.doScroll && window == window.top) {
						var tryScroll = function tryScroll() {
							if (!document.body) {
								return;
							}
							try {
								document.documentElement.doScroll('left');
								fireOnce();
							} catch (e) {
								setTimeout(tryScroll, 1);
							}
						};
						tryScroll();
					}
				}
			},

			warn: function warn(msg) {
				if (window.console && window.console.warn) {
					window.console.warn(msg);
				}
			},

			preventDefault: function preventDefault(e) {
				if (e.preventDefault) {
					e.preventDefault();
				}
				e.returnValue = false;
			},

			captureTarget: function captureTarget(target) {
				// IE
				if (target.setCapture) {
					jsc._capturedTarget = target;
					jsc._capturedTarget.setCapture();
				}
			},

			releaseTarget: function releaseTarget() {
				// IE
				if (jsc._capturedTarget) {
					jsc._capturedTarget.releaseCapture();
					jsc._capturedTarget = null;
				}
			},

			fireEvent: function fireEvent(el, evnt) {
				if (!el) {
					return;
				}
				if (document.createEvent) {
					var ev = document.createEvent('HTMLEvents');
					ev.initEvent(evnt, true, true);
					el.dispatchEvent(ev);
				} else if (document.createEventObject) {
					var ev = document.createEventObject();
					el.fireEvent('on' + evnt, ev);
				} else if (el['on' + evnt]) {
					// alternatively use the traditional event model
					el['on' + evnt]();
				}
			},

			classNameToList: function classNameToList(className) {
				return className.replace(/^\s+|\s+$/g, '').split(/\s+/);
			},

			// The className parameter (str) can only contain a single class name
			hasClass: function hasClass(elm, className) {
				if (!className) {
					return false;
				}
				return -1 != (' ' + elm.className.replace(/\s+/g, ' ') + ' ').indexOf(' ' + className + ' ');
			},

			// The className parameter (str) can contain multiple class names separated by whitespace
			setClass: function setClass(elm, className) {
				var classList = jsc.classNameToList(className);
				for (var i = 0; i < classList.length; i += 1) {
					if (!jsc.hasClass(elm, classList[i])) {
						elm.className += (elm.className ? ' ' : '') + classList[i];
					}
				}
			},

			// The className parameter (str) can contain multiple class names separated by whitespace
			unsetClass: function unsetClass(elm, className) {
				var classList = jsc.classNameToList(className);
				for (var i = 0; i < classList.length; i += 1) {
					var repl = new RegExp('^\\s*' + classList[i] + '\\s*|' + '\\s*' + classList[i] + '\\s*$|' + '\\s+' + classList[i] + '(\\s+)', 'g');
					elm.className = elm.className.replace(repl, '$1');
				}
			},

			getStyle: function getStyle(elm) {
				return window.getComputedStyle ? window.getComputedStyle(elm) : elm.currentStyle;
			},

			setStyle: (function () {
				var helper = document.createElement('div');
				var getSupportedProp = function getSupportedProp(names) {
					for (var i = 0; i < names.length; i += 1) {
						if (names[i] in helper.style) {
							return names[i];
						}
					}
				};
				var props = {
					borderRadius: getSupportedProp(['borderRadius', 'MozBorderRadius', 'webkitBorderRadius']),
					boxShadow: getSupportedProp(['boxShadow', 'MozBoxShadow', 'webkitBoxShadow'])
				};
				return function (elm, prop, value) {
					switch (prop.toLowerCase()) {
						case 'opacity':
							var alphaOpacity = Math.round(parseFloat(value) * 100);
							elm.style.opacity = value;
							elm.style.filter = 'alpha(opacity=' + alphaOpacity + ')';
							break;
						default:
							elm.style[props[prop]] = value;
							break;
					}
				};
			})(),

			setBorderRadius: function setBorderRadius(elm, value) {
				jsc.setStyle(elm, 'borderRadius', value || '0');
			},

			setBoxShadow: function setBoxShadow(elm, value) {
				jsc.setStyle(elm, 'boxShadow', value || 'none');
			},

			getElementPos: function getElementPos(e, relativeToViewport) {
				var x = 0,
				    y = 0;
				var rect = e.getBoundingClientRect();
				x = rect.left;
				y = rect.top;
				if (!relativeToViewport) {
					var viewPos = jsc.getViewPos();
					x += viewPos[0];
					y += viewPos[1];
				}
				return [x, y];
			},

			getElementSize: function getElementSize(e) {
				return [e.offsetWidth, e.offsetHeight];
			},

			// get pointer's X/Y coordinates relative to viewport
			getAbsPointerPos: function getAbsPointerPos(e) {
				if (!e) {
					e = window.event;
				}
				var x = 0,
				    y = 0;
				if (typeof e.changedTouches !== 'undefined' && e.changedTouches.length) {
					// touch devices
					x = e.changedTouches[0].clientX;
					y = e.changedTouches[0].clientY;
				} else if (typeof e.clientX === 'number') {
					x = e.clientX;
					y = e.clientY;
				}
				return { x: x, y: y };
			},

			// get pointer's X/Y coordinates relative to target element
			getRelPointerPos: function getRelPointerPos(e) {
				if (!e) {
					e = window.event;
				}
				var target = e.target || e.srcElement;
				var targetRect = target.getBoundingClientRect();

				var x = 0,
				    y = 0;

				var clientX = 0,
				    clientY = 0;
				if (typeof e.changedTouches !== 'undefined' && e.changedTouches.length) {
					// touch devices
					clientX = e.changedTouches[0].clientX;
					clientY = e.changedTouches[0].clientY;
				} else if (typeof e.clientX === 'number') {
					clientX = e.clientX;
					clientY = e.clientY;
				}

				x = clientX - targetRect.left;
				y = clientY - targetRect.top;
				return { x: x, y: y };
			},

			getViewPos: function getViewPos() {
				var doc = document.documentElement;
				return [(window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0), (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)];
			},

			getViewSize: function getViewSize() {
				var doc = document.documentElement;
				return [window.innerWidth || doc.clientWidth, window.innerHeight || doc.clientHeight];
			},

			redrawPosition: function redrawPosition() {

				if (jsc.picker && jsc.picker.owner) {
					var thisObj = jsc.picker.owner;

					var tp, vp;

					if (thisObj.fixed) {
						// Fixed elements are positioned relative to viewport,
						// therefore we can ignore the scroll offset
						tp = jsc.getElementPos(thisObj.targetElement, true); // target pos
						vp = [0, 0]; // view pos
					} else {
							tp = jsc.getElementPos(thisObj.targetElement); // target pos
							vp = jsc.getViewPos(); // view pos
						}

					var ts = jsc.getElementSize(thisObj.targetElement); // target size
					var vs = jsc.getViewSize(); // view size
					var ps = jsc.getPickerOuterDims(thisObj); // picker size
					var a, b, c;
					switch (thisObj.position.toLowerCase()) {
						case 'left':
							a = 1;b = 0;c = -1;break;
						case 'right':
							a = 1;b = 0;c = 1;break;
						case 'top':
							a = 0;b = 1;c = -1;break;
						default:
							a = 0;b = 1;c = 1;break;
					}
					var l = (ts[b] + ps[b]) / 2;

					// compute picker position
					if (!thisObj.smartPosition) {
						var pp = [tp[a], tp[b] + ts[b] - l + l * c];
					} else {
						var pp = [-vp[a] + tp[a] + ps[a] > vs[a] ? -vp[a] + tp[a] + ts[a] / 2 > vs[a] / 2 && tp[a] + ts[a] - ps[a] >= 0 ? tp[a] + ts[a] - ps[a] : tp[a] : tp[a], -vp[b] + tp[b] + ts[b] + ps[b] - l + l * c > vs[b] ? -vp[b] + tp[b] + ts[b] / 2 > vs[b] / 2 && tp[b] + ts[b] - l - l * c >= 0 ? tp[b] + ts[b] - l - l * c : tp[b] + ts[b] - l + l * c : tp[b] + ts[b] - l + l * c >= 0 ? tp[b] + ts[b] - l + l * c : tp[b] + ts[b] - l - l * c];
					}

					var x = pp[a];
					var y = pp[b];
					var positionValue = thisObj.fixed ? 'fixed' : 'absolute';
					var contractShadow = (pp[0] + ps[0] > tp[0] || pp[0] < tp[0] + ts[0]) && pp[1] + ps[1] < tp[1] + ts[1];

					jsc._drawPosition(thisObj, x, y, positionValue, contractShadow);
				}
			},

			_drawPosition: function _drawPosition(thisObj, x, y, positionValue, contractShadow) {
				var vShadow = contractShadow ? 0 : thisObj.shadowBlur; // px

				jsc.picker.wrap.style.position = positionValue;
				jsc.picker.wrap.style.left = x + 'px';
				jsc.picker.wrap.style.top = y + 'px';

				jsc.setBoxShadow(jsc.picker.boxS, thisObj.shadow ? new jsc.BoxShadow(0, vShadow, thisObj.shadowBlur, 0, thisObj.shadowColor) : null);
			},

			getPickerDims: function getPickerDims(thisObj) {
				var displaySlider = !!jsc.getSliderComponent(thisObj);
				var dims = [2 * thisObj.insetWidth + 2 * thisObj.padding + thisObj.width + (displaySlider ? 2 * thisObj.insetWidth + jsc.getPadToSliderPadding(thisObj) + thisObj.sliderSize : 0), 2 * thisObj.insetWidth + 2 * thisObj.padding + thisObj.height + (thisObj.closable ? 2 * thisObj.insetWidth + thisObj.padding + thisObj.buttonHeight : 0)];
				return dims;
			},

			getPickerOuterDims: function getPickerOuterDims(thisObj) {
				var dims = jsc.getPickerDims(thisObj);
				return [dims[0] + 2 * thisObj.borderWidth, dims[1] + 2 * thisObj.borderWidth];
			},

			getPadToSliderPadding: function getPadToSliderPadding(thisObj) {
				return Math.max(thisObj.padding, 1.5 * (2 * thisObj.pointerBorderWidth + thisObj.pointerThickness));
			},

			getPadYComponent: function getPadYComponent(thisObj) {
				switch (thisObj.mode.charAt(1).toLowerCase()) {
					case 'v':
						return 'v';break;
				}
				return 's';
			},

			getSliderComponent: function getSliderComponent(thisObj) {
				if (thisObj.mode.length > 2) {
					switch (thisObj.mode.charAt(2).toLowerCase()) {
						case 's':
							return 's';break;
						case 'v':
							return 'v';break;
					}
				}
				return null;
			},

			onDocumentMouseDown: function onDocumentMouseDown(e) {
				if (!e) {
					e = window.event;
				}
				var target = e.target || e.srcElement;

				if (target._jscLinkedInstance) {
					if (target._jscLinkedInstance.showOnClick) {
						target._jscLinkedInstance.show();
					}
				} else if (target._jscControlName) {
					jsc.onControlPointerStart(e, target, target._jscControlName, 'mouse');
				} else {
					// Mouse is outside the picker controls -> hide the color picker!
					if (jsc.picker && jsc.picker.owner) {
						jsc.picker.owner.hide();
					}
				}
			},

			onDocumentTouchStart: function onDocumentTouchStart(e) {
				if (!e) {
					e = window.event;
				}
				var target = e.target || e.srcElement;

				if (target._jscLinkedInstance) {
					if (target._jscLinkedInstance.showOnClick) {
						target._jscLinkedInstance.show();
					}
				} else if (target._jscControlName) {
					jsc.onControlPointerStart(e, target, target._jscControlName, 'touch');
				} else {
					if (jsc.picker && jsc.picker.owner) {
						jsc.picker.owner.hide();
					}
				}
			},

			onWindowResize: function onWindowResize(e) {
				jsc.redrawPosition();
			},

			onParentScroll: function onParentScroll(e) {
				// hide the picker when one of the parent elements is scrolled
				if (jsc.picker && jsc.picker.owner) {
					jsc.picker.owner.hide();
				}
			},

			_pointerMoveEvent: {
				mouse: 'mousemove',
				touch: 'touchmove'
			},
			_pointerEndEvent: {
				mouse: 'mouseup',
				touch: 'touchend'
			},

			_pointerOrigin: null,
			_capturedTarget: null,

			onControlPointerStart: function onControlPointerStart(e, target, controlName, pointerType) {
				var thisObj = target._jscInstance;

				jsc.preventDefault(e);
				jsc.captureTarget(target);

				var registerDragEvents = function registerDragEvents(doc, offset) {
					jsc.attachGroupEvent('drag', doc, jsc._pointerMoveEvent[pointerType], jsc.onDocumentPointerMove(e, target, controlName, pointerType, offset));
					jsc.attachGroupEvent('drag', doc, jsc._pointerEndEvent[pointerType], jsc.onDocumentPointerEnd(e, target, controlName, pointerType));
				};

				registerDragEvents(document, [0, 0]);

				if (window.parent && window.frameElement) {
					var rect = window.frameElement.getBoundingClientRect();
					var ofs = [-rect.left, -rect.top];
					registerDragEvents(window.parent.window.document, ofs);
				}

				var abs = jsc.getAbsPointerPos(e);
				var rel = jsc.getRelPointerPos(e);
				jsc._pointerOrigin = {
					x: abs.x - rel.x,
					y: abs.y - rel.y
				};

				switch (controlName) {
					case 'pad':
						// if the slider is at the bottom, move it up
						switch (jsc.getSliderComponent(thisObj)) {
							case 's':
								if (thisObj.hsv[1] === 0) {
									thisObj.fromHSV(null, 100, null);
								};break;
							case 'v':
								if (thisObj.hsv[2] === 0) {
									thisObj.fromHSV(null, null, 100);
								};break;
						}
						jsc.setPad(thisObj, e, 0, 0);
						break;

					case 'sld':
						jsc.setSld(thisObj, e, 0);
						break;
				}

				jsc.dispatchFineChange(thisObj);
			},

			onDocumentPointerMove: function onDocumentPointerMove(e, target, controlName, pointerType, offset) {
				return function (e) {
					var thisObj = target._jscInstance;
					switch (controlName) {
						case 'pad':
							if (!e) {
								e = window.event;
							}
							jsc.setPad(thisObj, e, offset[0], offset[1]);
							jsc.dispatchFineChange(thisObj);
							break;

						case 'sld':
							if (!e) {
								e = window.event;
							}
							jsc.setSld(thisObj, e, offset[1]);
							jsc.dispatchFineChange(thisObj);
							break;
					}
				};
			},

			onDocumentPointerEnd: function onDocumentPointerEnd(e, target, controlName, pointerType) {
				return function (e) {
					var thisObj = target._jscInstance;
					jsc.detachGroupEvents('drag');
					jsc.releaseTarget();
					// Always dispatch changes after detaching outstanding mouse handlers,
					// in case some user interaction will occur in user's onchange callback
					// that would intrude with current mouse events
					jsc.dispatchChange(thisObj);
				};
			},

			dispatchChange: function dispatchChange(thisObj) {
				if (thisObj.valueElement) {
					if (jsc.isElementType(thisObj.valueElement, 'input')) {
						jsc.fireEvent(thisObj.valueElement, 'change');
					}
				}
			},

			dispatchFineChange: function dispatchFineChange(thisObj) {
				if (thisObj.onFineChange) {
					var callback;
					if (typeof thisObj.onFineChange === 'string') {
						callback = new Function(thisObj.onFineChange);
					} else {
						callback = thisObj.onFineChange;
					}
					callback.call(thisObj);
				}
			},

			setPad: function setPad(thisObj, e, ofsX, ofsY) {
				var pointerAbs = jsc.getAbsPointerPos(e);
				var x = ofsX + pointerAbs.x - jsc._pointerOrigin.x - thisObj.padding - thisObj.insetWidth;
				var y = ofsY + pointerAbs.y - jsc._pointerOrigin.y - thisObj.padding - thisObj.insetWidth;

				var xVal = x * (360 / (thisObj.width - 1));
				var yVal = 100 - y * (100 / (thisObj.height - 1));

				switch (jsc.getPadYComponent(thisObj)) {
					case 's':
						thisObj.fromHSV(xVal, yVal, null, jsc.leaveSld);break;
					case 'v':
						thisObj.fromHSV(xVal, null, yVal, jsc.leaveSld);break;
				}
			},

			setSld: function setSld(thisObj, e, ofsY) {
				var pointerAbs = jsc.getAbsPointerPos(e);
				var y = ofsY + pointerAbs.y - jsc._pointerOrigin.y - thisObj.padding - thisObj.insetWidth;

				var yVal = 100 - y * (100 / (thisObj.height - 1));

				switch (jsc.getSliderComponent(thisObj)) {
					case 's':
						thisObj.fromHSV(null, yVal, null, jsc.leavePad);break;
					case 'v':
						thisObj.fromHSV(null, null, yVal, jsc.leavePad);break;
				}
			},

			_vmlNS: 'jsc_vml_',
			_vmlCSS: 'jsc_vml_css_',
			_vmlReady: false,

			initVML: function initVML() {
				if (!jsc._vmlReady) {
					// init VML namespace
					var doc = document;
					if (!doc.namespaces[jsc._vmlNS]) {
						doc.namespaces.add(jsc._vmlNS, 'urn:schemas-microsoft-com:vml');
					}
					if (!doc.styleSheets[jsc._vmlCSS]) {
						var tags = ['shape', 'shapetype', 'group', 'background', 'path', 'formulas', 'handles', 'fill', 'stroke', 'shadow', 'textbox', 'textpath', 'imagedata', 'line', 'polyline', 'curve', 'rect', 'roundrect', 'oval', 'arc', 'image'];
						var ss = doc.createStyleSheet();
						ss.owningElement.id = jsc._vmlCSS;
						for (var i = 0; i < tags.length; i += 1) {
							ss.addRule(jsc._vmlNS + '\\:' + tags[i], 'behavior:url(#default#VML);');
						}
					}
					jsc._vmlReady = true;
				}
			},

			createPalette: function createPalette() {

				var paletteObj = {
					elm: null,
					draw: null
				};

				if (jsc.isCanvasSupported) {
					// Canvas implementation for modern browsers

					var canvas = document.createElement('canvas');
					var ctx = canvas.getContext('2d');

					var drawFunc = function drawFunc(width, height, type) {
						canvas.width = width;
						canvas.height = height;

						ctx.clearRect(0, 0, canvas.width, canvas.height);

						var hGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
						hGrad.addColorStop(0 / 6, '#F00');
						hGrad.addColorStop(1 / 6, '#FF0');
						hGrad.addColorStop(2 / 6, '#0F0');
						hGrad.addColorStop(3 / 6, '#0FF');
						hGrad.addColorStop(4 / 6, '#00F');
						hGrad.addColorStop(5 / 6, '#F0F');
						hGrad.addColorStop(6 / 6, '#F00');

						ctx.fillStyle = hGrad;
						ctx.fillRect(0, 0, canvas.width, canvas.height);

						var vGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
						switch (type.toLowerCase()) {
							case 's':
								vGrad.addColorStop(0, 'rgba(255,255,255,0)');
								vGrad.addColorStop(1, 'rgba(255,255,255,1)');
								break;
							case 'v':
								vGrad.addColorStop(0, 'rgba(0,0,0,0)');
								vGrad.addColorStop(1, 'rgba(0,0,0,1)');
								break;
						}
						ctx.fillStyle = vGrad;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					};

					paletteObj.elm = canvas;
					paletteObj.draw = drawFunc;
				} else {
					// VML fallback for IE 7 and 8

					jsc.initVML();

					var vmlContainer = document.createElement('div');
					vmlContainer.style.position = 'relative';
					vmlContainer.style.overflow = 'hidden';

					var hGrad = document.createElement(jsc._vmlNS + ':fill');
					hGrad.type = 'gradient';
					hGrad.method = 'linear';
					hGrad.angle = '90';
					hGrad.colors = '16.67% #F0F, 33.33% #00F, 50% #0FF, 66.67% #0F0, 83.33% #FF0';

					var hRect = document.createElement(jsc._vmlNS + ':rect');
					hRect.style.position = 'absolute';
					hRect.style.left = -1 + 'px';
					hRect.style.top = -1 + 'px';
					hRect.stroked = false;
					hRect.appendChild(hGrad);
					vmlContainer.appendChild(hRect);

					var vGrad = document.createElement(jsc._vmlNS + ':fill');
					vGrad.type = 'gradient';
					vGrad.method = 'linear';
					vGrad.angle = '180';
					vGrad.opacity = '0';

					var vRect = document.createElement(jsc._vmlNS + ':rect');
					vRect.style.position = 'absolute';
					vRect.style.left = -1 + 'px';
					vRect.style.top = -1 + 'px';
					vRect.stroked = false;
					vRect.appendChild(vGrad);
					vmlContainer.appendChild(vRect);

					var drawFunc = function drawFunc(width, height, type) {
						vmlContainer.style.width = width + 'px';
						vmlContainer.style.height = height + 'px';

						hRect.style.width = vRect.style.width = width + 1 + 'px';
						hRect.style.height = vRect.style.height = height + 1 + 'px';

						// Colors must be specified during every redraw, otherwise IE won't display
						// a full gradient during a subsequential redraw
						hGrad.color = '#F00';
						hGrad.color2 = '#F00';

						switch (type.toLowerCase()) {
							case 's':
								vGrad.color = vGrad.color2 = '#FFF';
								break;
							case 'v':
								vGrad.color = vGrad.color2 = '#000';
								break;
						}
					};

					paletteObj.elm = vmlContainer;
					paletteObj.draw = drawFunc;
				}

				return paletteObj;
			},

			createSliderGradient: function createSliderGradient() {

				var sliderObj = {
					elm: null,
					draw: null
				};

				if (jsc.isCanvasSupported) {
					// Canvas implementation for modern browsers

					var canvas = document.createElement('canvas');
					var ctx = canvas.getContext('2d');

					var drawFunc = function drawFunc(width, height, color1, color2) {
						canvas.width = width;
						canvas.height = height;

						ctx.clearRect(0, 0, canvas.width, canvas.height);

						var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
						grad.addColorStop(0, color1);
						grad.addColorStop(1, color2);

						ctx.fillStyle = grad;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					};

					sliderObj.elm = canvas;
					sliderObj.draw = drawFunc;
				} else {
					// VML fallback for IE 7 and 8

					jsc.initVML();

					var vmlContainer = document.createElement('div');
					vmlContainer.style.position = 'relative';
					vmlContainer.style.overflow = 'hidden';

					var grad = document.createElement(jsc._vmlNS + ':fill');
					grad.type = 'gradient';
					grad.method = 'linear';
					grad.angle = '180';

					var rect = document.createElement(jsc._vmlNS + ':rect');
					rect.style.position = 'absolute';
					rect.style.left = -1 + 'px';
					rect.style.top = -1 + 'px';
					rect.stroked = false;
					rect.appendChild(grad);
					vmlContainer.appendChild(rect);

					var drawFunc = function drawFunc(width, height, color1, color2) {
						vmlContainer.style.width = width + 'px';
						vmlContainer.style.height = height + 'px';

						rect.style.width = width + 1 + 'px';
						rect.style.height = height + 1 + 'px';

						grad.color = color1;
						grad.color2 = color2;
					};

					sliderObj.elm = vmlContainer;
					sliderObj.draw = drawFunc;
				}

				return sliderObj;
			},

			leaveValue: 1 << 0,
			leaveStyle: 1 << 1,
			leavePad: 1 << 2,
			leaveSld: 1 << 3,

			BoxShadow: (function () {
				var BoxShadow = function BoxShadow(hShadow, vShadow, blur, spread, color, inset) {
					this.hShadow = hShadow;
					this.vShadow = vShadow;
					this.blur = blur;
					this.spread = spread;
					this.color = color;
					this.inset = !!inset;
				};

				BoxShadow.prototype.toString = function () {
					var vals = [Math.round(this.hShadow) + 'px', Math.round(this.vShadow) + 'px', Math.round(this.blur) + 'px', Math.round(this.spread) + 'px', this.color];
					if (this.inset) {
						vals.push('inset');
					}
					return vals.join(' ');
				};

				return BoxShadow;
			})(),

			//
			// Usage:
			// var myColor = new jscolor(<targetElement> [, <options>])
			//

			jscolor: function jscolor(targetElement, options) {

				// General options
				//
				this.value = null; // initial HEX color. To change it later, use methods fromString(), fromHSV() and fromRGB()
				this.valueElement = targetElement; // element that will be used to display and input the color code
				this.styleElement = targetElement; // element that will preview the picked color using CSS backgroundColor
				this.required = true; // whether the associated text <input> can be left empty
				this.refine = true; // whether to refine the entered color code (e.g. uppercase it and remove whitespace)
				this.hash = false; // whether to prefix the HEX color code with # symbol
				this.uppercase = true; // whether to uppercase the color code
				this.onFineChange = null; // called instantly every time the color changes (value can be either a function or a string with javascript code)
				this.activeClass = 'jscolor-active'; // class to be set to the target element when a picker window is open on it
				this.minS = 0; // min allowed saturation (0 - 100)
				this.maxS = 100; // max allowed saturation (0 - 100)
				this.minV = 0; // min allowed value (brightness) (0 - 100)
				this.maxV = 100; // max allowed value (brightness) (0 - 100)

				// Accessing the picked color
				//
				this.hsv = [0, 0, 100]; // read-only  [0-360, 0-100, 0-100]
				this.rgb = [255, 255, 255]; // read-only  [0-255, 0-255, 0-255]

				// Color Picker options
				//
				this.width = 181; // width of color palette (in px)
				this.height = 101; // height of color palette (in px)
				this.showOnClick = true; // whether to display the color picker when user clicks on its target element
				this.mode = 'HSV'; // HSV | HVS | HS | HV - layout of the color picker controls
				this.position = 'bottom'; // left | right | top | bottom - position relative to the target element
				this.smartPosition = true; // automatically change picker position when there is not enough space for it
				this.sliderSize = 16; // px
				this.crossSize = 8; // px
				this.closable = false; // whether to display the Close button
				this.closeText = 'Close';
				this.buttonColor = '#000000'; // CSS color
				this.buttonHeight = 18; // px
				this.padding = 12; // px
				this.backgroundColor = '#FFFFFF'; // CSS color
				this.borderWidth = 1; // px
				this.borderColor = '#BBBBBB'; // CSS color
				this.borderRadius = 8; // px
				this.insetWidth = 1; // px
				this.insetColor = '#BBBBBB'; // CSS color
				this.shadow = true; // whether to display shadow
				this.shadowBlur = 15; // px
				this.shadowColor = 'rgba(0,0,0,0.2)'; // CSS color
				this.pointerColor = '#4C4C4C'; // px
				this.pointerBorderColor = '#FFFFFF'; // px
				this.pointerBorderWidth = 1; // px
				this.pointerThickness = 2; // px
				this.zIndex = 1000;
				this.container = null; // where to append the color picker (BODY element by default)

				for (var opt in options) {
					if (options.hasOwnProperty(opt)) {
						this[opt] = options[opt];
					}
				}

				this.hide = function () {
					if (isPickerOwner()) {
						detachPicker();
					}
				};

				this.show = function () {
					drawPicker();
				};

				this.redraw = function () {
					if (isPickerOwner()) {
						drawPicker();
					}
				};

				this.importColor = function () {
					if (!this.valueElement) {
						this.exportColor();
					} else {
						if (jsc.isElementType(this.valueElement, 'input')) {
							if (!this.refine) {
								if (!this.fromString(this.valueElement.value, jsc.leaveValue)) {
									if (this.styleElement) {
										this.styleElement.style.backgroundImage = this.styleElement._jscOrigStyle.backgroundImage;
										this.styleElement.style.backgroundColor = this.styleElement._jscOrigStyle.backgroundColor;
										this.styleElement.style.color = this.styleElement._jscOrigStyle.color;
									}
									this.exportColor(jsc.leaveValue | jsc.leaveStyle);
								}
							} else if (!this.required && /^\s*$/.test(this.valueElement.value)) {
								this.valueElement.value = '';
								if (this.styleElement) {
									this.styleElement.style.backgroundImage = this.styleElement._jscOrigStyle.backgroundImage;
									this.styleElement.style.backgroundColor = this.styleElement._jscOrigStyle.backgroundColor;
									this.styleElement.style.color = this.styleElement._jscOrigStyle.color;
								}
								this.exportColor(jsc.leaveValue | jsc.leaveStyle);
							} else if (this.fromString(this.valueElement.value)) {
								// managed to import color successfully from the value -> OK, don't do anything
							} else {
									this.exportColor();
								}
						} else {
							// not an input element -> doesn't have any value
							this.exportColor();
						}
					}
				};

				this.exportColor = function (flags) {
					if (!(flags & jsc.leaveValue) && this.valueElement) {
						var value = this.toString();
						if (this.uppercase) {
							value = value.toUpperCase();
						}
						if (this.hash) {
							value = '#' + value;
						}

						if (jsc.isElementType(this.valueElement, 'input')) {
							this.valueElement.value = value;
						} else {
							this.valueElement.innerHTML = value;
						}
					}
					if (!(flags & jsc.leaveStyle)) {
						if (this.styleElement) {
							this.styleElement.style.backgroundImage = 'none';
							this.styleElement.style.backgroundColor = '#' + this.toString();
							this.styleElement.style.color = this.isLight() ? '#000' : '#FFF';
						}
					}
					if (!(flags & jsc.leavePad) && isPickerOwner()) {
						redrawPad();
					}
					if (!(flags & jsc.leaveSld) && isPickerOwner()) {
						redrawSld();
					}
				};

				// h: 0-360
				// s: 0-100
				// v: 0-100
				//
				this.fromHSV = function (h, s, v, flags) {
					// null = don't change
					if (h !== null) {
						if (isNaN(h)) {
							return false;
						}
						h = Math.max(0, Math.min(360, h));
					}
					if (s !== null) {
						if (isNaN(s)) {
							return false;
						}
						s = Math.max(0, Math.min(100, this.maxS, s), this.minS);
					}
					if (v !== null) {
						if (isNaN(v)) {
							return false;
						}
						v = Math.max(0, Math.min(100, this.maxV, v), this.minV);
					}

					this.rgb = HSV_RGB(h === null ? this.hsv[0] : this.hsv[0] = h, s === null ? this.hsv[1] : this.hsv[1] = s, v === null ? this.hsv[2] : this.hsv[2] = v);

					this.exportColor(flags);
				};

				// r: 0-255
				// g: 0-255
				// b: 0-255
				//
				this.fromRGB = function (r, g, b, flags) {
					// null = don't change
					if (r !== null) {
						if (isNaN(r)) {
							return false;
						}
						r = Math.max(0, Math.min(255, r));
					}
					if (g !== null) {
						if (isNaN(g)) {
							return false;
						}
						g = Math.max(0, Math.min(255, g));
					}
					if (b !== null) {
						if (isNaN(b)) {
							return false;
						}
						b = Math.max(0, Math.min(255, b));
					}

					var hsv = RGB_HSV(r === null ? this.rgb[0] : r, g === null ? this.rgb[1] : g, b === null ? this.rgb[2] : b);
					if (hsv[0] !== null) {
						this.hsv[0] = Math.max(0, Math.min(360, hsv[0]));
					}
					if (hsv[2] !== 0) {
						this.hsv[1] = hsv[1] === null ? null : Math.max(0, this.minS, Math.min(100, this.maxS, hsv[1]));
					}
					this.hsv[2] = hsv[2] === null ? null : Math.max(0, this.minV, Math.min(100, this.maxV, hsv[2]));

					// update RGB according to final HSV, as some values might be trimmed
					var rgb = HSV_RGB(this.hsv[0], this.hsv[1], this.hsv[2]);
					this.rgb[0] = rgb[0];
					this.rgb[1] = rgb[1];
					this.rgb[2] = rgb[2];

					this.exportColor(flags);
				};

				this.fromString = function (str, flags) {
					var m;
					if (m = str.match(/^\W*([0-9A-F]{3}([0-9A-F]{3})?)\W*$/i)) {
						// HEX notation
						//

						if (m[1].length === 6) {
							// 6-char notation
							this.fromRGB(parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16), flags);
						} else {
							// 3-char notation
							this.fromRGB(parseInt(m[1].charAt(0) + m[1].charAt(0), 16), parseInt(m[1].charAt(1) + m[1].charAt(1), 16), parseInt(m[1].charAt(2) + m[1].charAt(2), 16), flags);
						}
						return true;
					} else if (m = str.match(/^\W*rgba?\(([^)]*)\)\W*$/i)) {
						var params = m[1].split(',');
						var re = /^\s*(\d*)(\.\d+)?\s*$/;
						var mR, mG, mB;
						if (params.length >= 3 && (mR = params[0].match(re)) && (mG = params[1].match(re)) && (mB = params[2].match(re))) {
							var r = parseFloat((mR[1] || '0') + (mR[2] || ''));
							var g = parseFloat((mG[1] || '0') + (mG[2] || ''));
							var b = parseFloat((mB[1] || '0') + (mB[2] || ''));
							this.fromRGB(r, g, b, flags);
							return true;
						}
					}
					return false;
				};

				this.toString = function () {
					return (0x100 | Math.round(this.rgb[0])).toString(16).substr(1) + (0x100 | Math.round(this.rgb[1])).toString(16).substr(1) + (0x100 | Math.round(this.rgb[2])).toString(16).substr(1);
				};

				this.toHEXString = function () {
					return '#' + this.toString().toUpperCase();
				};

				this.toRGBString = function () {
					return 'rgb(' + Math.round(this.rgb[0]) + ',' + Math.round(this.rgb[1]) + ',' + Math.round(this.rgb[2]) + ')';
				};

				this.isLight = function () {
					return 0.213 * this.rgb[0] + 0.715 * this.rgb[1] + 0.072 * this.rgb[2] > 255 / 2;
				};

				this._processParentElementsInDOM = function () {
					if (this._linkedElementsProcessed) {
						return;
					}
					this._linkedElementsProcessed = true;

					var elm = this.targetElement;
					do {
						// If the target element or one of its parent nodes has fixed position,
						// then use fixed positioning instead
						//
						// Note: In Firefox, getComputedStyle returns null in a hidden iframe,
						// that's why we need to check if the returned style object is non-empty
						var currStyle = jsc.getStyle(elm);
						if (currStyle && currStyle.position.toLowerCase() === 'fixed') {
							this.fixed = true;
						}

						if (elm !== this.targetElement) {
							// Ensure to attach onParentScroll only once to each parent element
							// (multiple targetElements can share the same parent nodes)
							//
							// Note: It's not just offsetParents that can be scrollable,
							// that's why we loop through all parent nodes
							if (!elm._jscEventsAttached) {
								jsc.attachEvent(elm, 'scroll', jsc.onParentScroll);
								elm._jscEventsAttached = true;
							}
						}
					} while ((elm = elm.parentNode) && !jsc.isElementType(elm, 'body'));
				};

				// r: 0-255
				// g: 0-255
				// b: 0-255
				//
				// returns: [ 0-360, 0-100, 0-100 ]
				//
				function RGB_HSV(r, g, b) {
					r /= 255;
					g /= 255;
					b /= 255;
					var n = Math.min(Math.min(r, g), b);
					var v = Math.max(Math.max(r, g), b);
					var m = v - n;
					if (m === 0) {
						return [null, 0, 100 * v];
					}
					var h = r === n ? 3 + (b - g) / m : g === n ? 5 + (r - b) / m : 1 + (g - r) / m;
					return [60 * (h === 6 ? 0 : h), 100 * (m / v), 100 * v];
				}

				// h: 0-360
				// s: 0-100
				// v: 0-100
				//
				// returns: [ 0-255, 0-255, 0-255 ]
				//
				function HSV_RGB(h, s, v) {
					var u = 255 * (v / 100);

					if (h === null) {
						return [u, u, u];
					}

					h /= 60;
					s /= 100;

					var i = Math.floor(h);
					var f = i % 2 ? h - i : 1 - (h - i);
					var m = u * (1 - s);
					var n = u * (1 - s * f);
					switch (i) {
						case 6:
						case 0:
							return [u, n, m];
						case 1:
							return [n, u, m];
						case 2:
							return [m, u, n];
						case 3:
							return [m, n, u];
						case 4:
							return [n, m, u];
						case 5:
							return [u, m, n];
					}
				}

				function detachPicker() {
					jsc.unsetClass(THIS.targetElement, THIS.activeClass);
					jsc.picker.wrap.parentNode.removeChild(jsc.picker.wrap);
					delete jsc.picker.owner;
				}

				function drawPicker() {

					// At this point, when drawing the picker, we know what the parent elements are
					// and we can do all related DOM operations, such as registering events on them
					// or checking their positioning
					THIS._processParentElementsInDOM();

					if (!jsc.picker) {
						jsc.picker = {
							owner: null,
							wrap: document.createElement('div'),
							box: document.createElement('div'),
							boxS: document.createElement('div'), // shadow area
							boxB: document.createElement('div'), // border
							pad: document.createElement('div'),
							padB: document.createElement('div'), // border
							padM: document.createElement('div'), // mouse/touch area
							padPal: jsc.createPalette(),
							cross: document.createElement('div'),
							crossBY: document.createElement('div'), // border Y
							crossBX: document.createElement('div'), // border X
							crossLY: document.createElement('div'), // line Y
							crossLX: document.createElement('div'), // line X
							sld: document.createElement('div'),
							sldB: document.createElement('div'), // border
							sldM: document.createElement('div'), // mouse/touch area
							sldGrad: jsc.createSliderGradient(),
							sldPtrS: document.createElement('div'), // slider pointer spacer
							sldPtrIB: document.createElement('div'), // slider pointer inner border
							sldPtrMB: document.createElement('div'), // slider pointer middle border
							sldPtrOB: document.createElement('div'), // slider pointer outer border
							btn: document.createElement('div'),
							btnT: document.createElement('span') // text
						};

						jsc.picker.pad.appendChild(jsc.picker.padPal.elm);
						jsc.picker.padB.appendChild(jsc.picker.pad);
						jsc.picker.cross.appendChild(jsc.picker.crossBY);
						jsc.picker.cross.appendChild(jsc.picker.crossBX);
						jsc.picker.cross.appendChild(jsc.picker.crossLY);
						jsc.picker.cross.appendChild(jsc.picker.crossLX);
						jsc.picker.padB.appendChild(jsc.picker.cross);
						jsc.picker.box.appendChild(jsc.picker.padB);
						jsc.picker.box.appendChild(jsc.picker.padM);

						jsc.picker.sld.appendChild(jsc.picker.sldGrad.elm);
						jsc.picker.sldB.appendChild(jsc.picker.sld);
						jsc.picker.sldB.appendChild(jsc.picker.sldPtrOB);
						jsc.picker.sldPtrOB.appendChild(jsc.picker.sldPtrMB);
						jsc.picker.sldPtrMB.appendChild(jsc.picker.sldPtrIB);
						jsc.picker.sldPtrIB.appendChild(jsc.picker.sldPtrS);
						jsc.picker.box.appendChild(jsc.picker.sldB);
						jsc.picker.box.appendChild(jsc.picker.sldM);

						jsc.picker.btn.appendChild(jsc.picker.btnT);
						jsc.picker.box.appendChild(jsc.picker.btn);

						jsc.picker.boxB.appendChild(jsc.picker.box);
						jsc.picker.wrap.appendChild(jsc.picker.boxS);
						jsc.picker.wrap.appendChild(jsc.picker.boxB);
					}

					var p = jsc.picker;

					var displaySlider = !!jsc.getSliderComponent(THIS);
					var dims = jsc.getPickerDims(THIS);
					var crossOuterSize = 2 * THIS.pointerBorderWidth + THIS.pointerThickness + 2 * THIS.crossSize;
					var padToSliderPadding = jsc.getPadToSliderPadding(THIS);
					var borderRadius = Math.min(THIS.borderRadius, Math.round(THIS.padding * Math.PI)); // px
					var padCursor = 'crosshair';

					// wrap
					p.wrap.style.clear = 'both';
					p.wrap.style.width = dims[0] + 2 * THIS.borderWidth + 'px';
					p.wrap.style.height = dims[1] + 2 * THIS.borderWidth + 'px';
					p.wrap.style.zIndex = THIS.zIndex;

					// picker
					p.box.style.width = dims[0] + 'px';
					p.box.style.height = dims[1] + 'px';

					p.boxS.style.position = 'absolute';
					p.boxS.style.left = '0';
					p.boxS.style.top = '0';
					p.boxS.style.width = '100%';
					p.boxS.style.height = '100%';
					jsc.setBorderRadius(p.boxS, borderRadius + 'px');

					// picker border
					p.boxB.style.position = 'relative';
					p.boxB.style.border = THIS.borderWidth + 'px solid';
					p.boxB.style.borderColor = THIS.borderColor;
					p.boxB.style.background = THIS.backgroundColor;
					jsc.setBorderRadius(p.boxB, borderRadius + 'px');

					// IE hack:
					// If the element is transparent, IE will trigger the event on the elements under it,
					// e.g. on Canvas or on elements with border
					p.padM.style.background = p.sldM.style.background = '#FFF';
					jsc.setStyle(p.padM, 'opacity', '0');
					jsc.setStyle(p.sldM, 'opacity', '0');

					// pad
					p.pad.style.position = 'relative';
					p.pad.style.width = THIS.width + 'px';
					p.pad.style.height = THIS.height + 'px';

					// pad palettes (HSV and HVS)
					p.padPal.draw(THIS.width, THIS.height, jsc.getPadYComponent(THIS));

					// pad border
					p.padB.style.position = 'absolute';
					p.padB.style.left = THIS.padding + 'px';
					p.padB.style.top = THIS.padding + 'px';
					p.padB.style.border = THIS.insetWidth + 'px solid';
					p.padB.style.borderColor = THIS.insetColor;

					// pad mouse area
					p.padM._jscInstance = THIS;
					p.padM._jscControlName = 'pad';
					p.padM.style.position = 'absolute';
					p.padM.style.left = '0';
					p.padM.style.top = '0';
					p.padM.style.width = THIS.padding + 2 * THIS.insetWidth + THIS.width + padToSliderPadding / 2 + 'px';
					p.padM.style.height = dims[1] + 'px';
					p.padM.style.cursor = padCursor;

					// pad cross
					p.cross.style.position = 'absolute';
					p.cross.style.left = p.cross.style.top = '0';
					p.cross.style.width = p.cross.style.height = crossOuterSize + 'px';

					// pad cross border Y and X
					p.crossBY.style.position = p.crossBX.style.position = 'absolute';
					p.crossBY.style.background = p.crossBX.style.background = THIS.pointerBorderColor;
					p.crossBY.style.width = p.crossBX.style.height = 2 * THIS.pointerBorderWidth + THIS.pointerThickness + 'px';
					p.crossBY.style.height = p.crossBX.style.width = crossOuterSize + 'px';
					p.crossBY.style.left = p.crossBX.style.top = Math.floor(crossOuterSize / 2) - Math.floor(THIS.pointerThickness / 2) - THIS.pointerBorderWidth + 'px';
					p.crossBY.style.top = p.crossBX.style.left = '0';

					// pad cross line Y and X
					p.crossLY.style.position = p.crossLX.style.position = 'absolute';
					p.crossLY.style.background = p.crossLX.style.background = THIS.pointerColor;
					p.crossLY.style.height = p.crossLX.style.width = crossOuterSize - 2 * THIS.pointerBorderWidth + 'px';
					p.crossLY.style.width = p.crossLX.style.height = THIS.pointerThickness + 'px';
					p.crossLY.style.left = p.crossLX.style.top = Math.floor(crossOuterSize / 2) - Math.floor(THIS.pointerThickness / 2) + 'px';
					p.crossLY.style.top = p.crossLX.style.left = THIS.pointerBorderWidth + 'px';

					// slider
					p.sld.style.overflow = 'hidden';
					p.sld.style.width = THIS.sliderSize + 'px';
					p.sld.style.height = THIS.height + 'px';

					// slider gradient
					p.sldGrad.draw(THIS.sliderSize, THIS.height, '#000', '#000');

					// slider border
					p.sldB.style.display = displaySlider ? 'block' : 'none';
					p.sldB.style.position = 'absolute';
					p.sldB.style.right = THIS.padding + 'px';
					p.sldB.style.top = THIS.padding + 'px';
					p.sldB.style.border = THIS.insetWidth + 'px solid';
					p.sldB.style.borderColor = THIS.insetColor;

					// slider mouse area
					p.sldM._jscInstance = THIS;
					p.sldM._jscControlName = 'sld';
					p.sldM.style.display = displaySlider ? 'block' : 'none';
					p.sldM.style.position = 'absolute';
					p.sldM.style.right = '0';
					p.sldM.style.top = '0';
					p.sldM.style.width = THIS.sliderSize + padToSliderPadding / 2 + THIS.padding + 2 * THIS.insetWidth + 'px';
					p.sldM.style.height = dims[1] + 'px';
					p.sldM.style.cursor = 'default';

					// slider pointer inner and outer border
					p.sldPtrIB.style.border = p.sldPtrOB.style.border = THIS.pointerBorderWidth + 'px solid ' + THIS.pointerBorderColor;

					// slider pointer outer border
					p.sldPtrOB.style.position = 'absolute';
					p.sldPtrOB.style.left = -(2 * THIS.pointerBorderWidth + THIS.pointerThickness) + 'px';
					p.sldPtrOB.style.top = '0';

					// slider pointer middle border
					p.sldPtrMB.style.border = THIS.pointerThickness + 'px solid ' + THIS.pointerColor;

					// slider pointer spacer
					p.sldPtrS.style.width = THIS.sliderSize + 'px';
					p.sldPtrS.style.height = sliderPtrSpace + 'px';

					// the Close button
					function setBtnBorder() {
						var insetColors = THIS.insetColor.split(/\s+/);
						var outsetColor = insetColors.length < 2 ? insetColors[0] : insetColors[1] + ' ' + insetColors[0] + ' ' + insetColors[0] + ' ' + insetColors[1];
						p.btn.style.borderColor = outsetColor;
					}
					p.btn.style.display = THIS.closable ? 'block' : 'none';
					p.btn.style.position = 'absolute';
					p.btn.style.left = THIS.padding + 'px';
					p.btn.style.bottom = THIS.padding + 'px';
					p.btn.style.padding = '0 15px';
					p.btn.style.height = THIS.buttonHeight + 'px';
					p.btn.style.border = THIS.insetWidth + 'px solid';
					setBtnBorder();
					p.btn.style.color = THIS.buttonColor;
					p.btn.style.font = '12px sans-serif';
					p.btn.style.textAlign = 'center';
					try {
						p.btn.style.cursor = 'pointer';
					} catch (eOldIE) {
						p.btn.style.cursor = 'hand';
					}
					p.btn.onmousedown = function () {
						THIS.hide();
					};
					p.btnT.style.lineHeight = THIS.buttonHeight + 'px';
					p.btnT.innerHTML = '';
					p.btnT.appendChild(document.createTextNode(THIS.closeText));

					// place pointers
					redrawPad();
					redrawSld();

					// If we are changing the owner without first closing the picker,
					// make sure to first deal with the old owner
					if (jsc.picker.owner && jsc.picker.owner !== THIS) {
						jsc.unsetClass(jsc.picker.owner.targetElement, THIS.activeClass);
					}

					// Set the new picker owner
					jsc.picker.owner = THIS;

					// The redrawPosition() method needs picker.owner to be set, that's why we call it here,
					// after setting the owner
					if (jsc.isElementType(container, 'body')) {
						jsc.redrawPosition();
					} else {
						jsc._drawPosition(THIS, 0, 0, 'relative', false);
					}

					if (p.wrap.parentNode != container) {
						container.appendChild(p.wrap);
					}

					jsc.setClass(THIS.targetElement, THIS.activeClass);
				}

				function redrawPad() {
					// redraw the pad pointer
					switch (jsc.getPadYComponent(THIS)) {
						case 's':
							var yComponent = 1;break;
						case 'v':
							var yComponent = 2;break;
					}
					var x = Math.round(THIS.hsv[0] / 360 * (THIS.width - 1));
					var y = Math.round((1 - THIS.hsv[yComponent] / 100) * (THIS.height - 1));
					var crossOuterSize = 2 * THIS.pointerBorderWidth + THIS.pointerThickness + 2 * THIS.crossSize;
					var ofs = -Math.floor(crossOuterSize / 2);
					jsc.picker.cross.style.left = x + ofs + 'px';
					jsc.picker.cross.style.top = y + ofs + 'px';

					// redraw the slider
					switch (jsc.getSliderComponent(THIS)) {
						case 's':
							var rgb1 = HSV_RGB(THIS.hsv[0], 100, THIS.hsv[2]);
							var rgb2 = HSV_RGB(THIS.hsv[0], 0, THIS.hsv[2]);
							var color1 = 'rgb(' + Math.round(rgb1[0]) + ',' + Math.round(rgb1[1]) + ',' + Math.round(rgb1[2]) + ')';
							var color2 = 'rgb(' + Math.round(rgb2[0]) + ',' + Math.round(rgb2[1]) + ',' + Math.round(rgb2[2]) + ')';
							jsc.picker.sldGrad.draw(THIS.sliderSize, THIS.height, color1, color2);
							break;
						case 'v':
							var rgb = HSV_RGB(THIS.hsv[0], THIS.hsv[1], 100);
							var color1 = 'rgb(' + Math.round(rgb[0]) + ',' + Math.round(rgb[1]) + ',' + Math.round(rgb[2]) + ')';
							var color2 = '#000';
							jsc.picker.sldGrad.draw(THIS.sliderSize, THIS.height, color1, color2);
							break;
					}
				}

				function redrawSld() {
					var sldComponent = jsc.getSliderComponent(THIS);
					if (sldComponent) {
						// redraw the slider pointer
						switch (sldComponent) {
							case 's':
								var yComponent = 1;break;
							case 'v':
								var yComponent = 2;break;
						}
						var y = Math.round((1 - THIS.hsv[yComponent] / 100) * (THIS.height - 1));
						jsc.picker.sldPtrOB.style.top = y - (2 * THIS.pointerBorderWidth + THIS.pointerThickness) - Math.floor(sliderPtrSpace / 2) + 'px';
					}
				}

				function isPickerOwner() {
					return jsc.picker && jsc.picker.owner === THIS;
				}

				function blurValue() {
					THIS.importColor();
				}

				// Find the target element
				if (typeof targetElement === 'string') {
					var id = targetElement;
					var elm = document.getElementById(id);
					if (elm) {
						this.targetElement = elm;
					} else {
						jsc.warn('Could not find target element with ID \'' + id + '\'');
					}
				} else if (targetElement) {
					this.targetElement = targetElement;
				} else {
					jsc.warn('Invalid target element: \'' + targetElement + '\'');
				}

				if (this.targetElement._jscLinkedInstance) {
					jsc.warn('Cannot link jscolor twice to the same element. Skipping.');
					return;
				}
				this.targetElement._jscLinkedInstance = this;

				// Find the value element
				this.valueElement = jsc.fetchElement(this.valueElement);
				// Find the style element
				this.styleElement = jsc.fetchElement(this.styleElement);

				var THIS = this;
				var container = this.container ? jsc.fetchElement(this.container) : document.getElementsByTagName('body')[0];
				var sliderPtrSpace = 3; // px

				// For BUTTON elements it's important to stop them from sending the form when clicked
				// (e.g. in Safari)
				if (jsc.isElementType(this.targetElement, 'button')) {
					if (this.targetElement.onclick) {
						var origCallback = this.targetElement.onclick;
						this.targetElement.onclick = function (evt) {
							origCallback.call(this, evt);
							return false;
						};
					} else {
						this.targetElement.onclick = function () {
							return false;
						};
					}
				}

				/*
    var elm = this.targetElement;
    do {
    	// If the target element or one of its offsetParents has fixed position,
    	// then use fixed positioning instead
    	//
    	// Note: In Firefox, getComputedStyle returns null in a hidden iframe,
    	// that's why we need to check if the returned style object is non-empty
    	var currStyle = jsc.getStyle(elm);
    	if (currStyle && currStyle.position.toLowerCase() === 'fixed') {
    		this.fixed = true;
    	}
    		if (elm !== this.targetElement) {
    		// attach onParentScroll so that we can recompute the picker position
    		// when one of the offsetParents is scrolled
    		if (!elm._jscEventsAttached) {
    			jsc.attachEvent(elm, 'scroll', jsc.onParentScroll);
    			elm._jscEventsAttached = true;
    		}
    	}
    } while ((elm = elm.offsetParent) && !jsc.isElementType(elm, 'body'));
    */

				// valueElement
				if (this.valueElement) {
					if (jsc.isElementType(this.valueElement, 'input')) {
						var updateField = function updateField() {
							THIS.fromString(THIS.valueElement.value, jsc.leaveValue);
							jsc.dispatchFineChange(THIS);
						};
						jsc.attachEvent(this.valueElement, 'keyup', updateField);
						jsc.attachEvent(this.valueElement, 'input', updateField);
						jsc.attachEvent(this.valueElement, 'blur', blurValue);
						this.valueElement.setAttribute('autocomplete', 'off');
					}
				}

				// styleElement
				if (this.styleElement) {
					this.styleElement._jscOrigStyle = {
						backgroundImage: this.styleElement.style.backgroundImage,
						backgroundColor: this.styleElement.style.backgroundColor,
						color: this.styleElement.style.color
					};
				}

				if (this.value) {
					// Try to set the color from the .value option and if unsuccessful,
					// export the current color
					this.fromString(this.value) || this.exportColor();
				} else {
					this.importColor();
				}
			}

		};

		//================================
		// Public properties and methods
		//================================

		// By default, search for all elements with class="jscolor" and install a color picker on them.
		//
		// You can change what class name will be looked for by setting the property jscolor.lookupClass
		// anywhere in your HTML document. To completely disable the automatic lookup, set it to null.
		//
		jsc.jscolor.lookupClass = 'jscolor';

		jsc.jscolor.installByClassName = function (className) {
			var inputElms = document.getElementsByTagName('input');
			var buttonElms = document.getElementsByTagName('button');

			jsc.tryInstallOnElements(inputElms, className);
			jsc.tryInstallOnElements(buttonElms, className);
		};

		jsc.register();

		return jsc.jscolor;
	})();
}

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL2xvZy5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7OztrQkNhZSxFQUFFLEdBQUcsZUFBTyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNGUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlBQUksQ0FB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QUEsTUFDbEM7QUFDRCxTQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDOzs7QUFBQyxBQUd4QixTQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtBQUMzQixVQUFJLEVBQUUsR0FBRyxDQUNSLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDTCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUNqQixDQUFDO01BQ0YsTUFBTTtBQUNOLFVBQUksRUFBRSxHQUFHLENBQ1IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQ3hCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDckYsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNOLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDcEMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQ2hHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQUFBQyxDQUNqRSxDQUFDO01BQ0Y7O0FBRUQsU0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2QsU0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2QsU0FBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLEdBQUcsVUFBVSxDQUFDO0FBQ3pELFNBQUksY0FBYyxHQUNqQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FB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LElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbEM7O0FBRUQsU0FBSSxHQUFHLEdBQUcsT0FBTyxDQUNoQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUMxQixDQUFDO0FBQ0YsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ3BCLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNqRDtBQUNELFNBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNqQixVQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzlGO0FBQ0QsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7OztBQUFDLEFBRzlGLFNBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVyQixTQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3hCLENBQUM7O0FBR0YsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDdkMsU0FBSSxDQUFDLENBQUM7QUFDTixTQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxDQUFDLEVBQUU7Ozs7QUFJMUQsVUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTs7QUFFdEIsV0FBSSxDQUFDLE9BQU8sQ0FDWCxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzdCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDN0IsUUFBUSxDQUFDLENBQUMsQ0FB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LElBQUksQ0FBQyxDQUFDOztBQUU1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUUzQyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0s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QUFZLENBQUMsS0FBSyxDQUFDLEtBQUs7TUFDckMsQ0FBQztLQUNGOztBQUVELFFBQUksSUFBSSxDQUFDLEtBQUssRUFBRTs7O0FBR2YsU0FBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQ2xELE1BQU07QUFDTixTQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDbkI7SUFDRDs7R0FFRDs7Ozs7Ozs7Ozs7QUFBQyxBQWFGLEtBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQzs7QUFHcEMsS0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxVQUFVLFNBQVMsRUFBRTtBQUNyRCxPQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdkQsT0FBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUV6RCxNQUFHLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQy9DLE1BQUcsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDaEQsQ0FBQzs7QUFHRixLQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBR2YsU0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDO0VBR2xCLENBQUEsRUFBRyxDQUFDO0NBQUUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBncmF2aXRvblxuICpcbiAqIEphdmFTY3JpcHQgTi1ib2R5IEdyYXZpdGF0aW9uYWwgU2ltdWxhdG9yXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IFphdmVuIE11cmFkeWFuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqXG4gKiBSZXZpc2lvbjpcbiAqICBAUkVWSVNJT05cbiAqL1xuaW1wb3J0IEd0QXBwIGZyb20gJy4vZ3Jhdml0b24vYXBwJztcblxuZXhwb3J0IGRlZmF1bHQgeyBhcHA6IEd0QXBwIH07XG4iLCIvKipcbiAqIGdyYXZpdG9uL2FwcCAtLSBUaGUgaW50ZXJhY3RpdmUgZ3Jhdml0b24gYXBwbGljYXRpb25cbiAqL1xuLyogZ2xvYmFsIGpzY29sb3IgKi9cblxuaW1wb3J0IHJhbmRvbSBmcm9tICcuLi91dGlsL3JhbmRvbSc7XG5pbXBvcnQgR3RTaW0gZnJvbSAnLi9zaW0nO1xuaW1wb3J0IEd0R2Z4IGZyb20gJy4vZ2Z4JztcbmltcG9ydCBHdEV2ZW50cywgeyBLRVlDT0RFUywgRVZFTlRDT0RFUywgQ09OVFJPTENPREVTIH0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IEd0VGltZXIgZnJvbSAnLi90aW1lcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0QXBwIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzID0ge30pIHtcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ncmlkID0gbnVsbDtcblxuICAgICAgICB0aGlzLmFuaW1UaW1lciA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaW0gPSBudWxsO1xuICAgICAgICB0aGlzLmdmeCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24gPSB7cHJldmlvdXM6IHt9fTtcbiAgICAgICAgdGhpcy50YXJnZXRCb2R5ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9IGFyZ3Mud2lkdGggPSBhcmdzLndpZHRoIHx8IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gYXJncy5oZWlnaHQgPSBhcmdzLmhlaWdodCB8fCB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IgPSBhcmdzLmJhY2tncm91bmRDb2xvciB8fCAnIzFGMjYzQic7XG5cbiAgICAgICAgLy8gUmV0cmlldmUgY2FudmFzLCBvciBidWlsZCBvbmUgd2l0aCBhcmd1bWVudHNcbiAgICAgICAgdGhpcy5ncmlkID0gdHlwZW9mIGFyZ3MuZ3JpZCA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5ncmlkKSA6XG4gICAgICAgICAgICBhcmdzLmdyaWQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmdyaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlR3JpZCh0aGlzLm9wdGlvbnMud2lkdGgsIHRoaXMub3B0aW9ucy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHtiYWNrZ3JvdW5kQ29sb3I6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3J9KTtcbiAgICAgICAgICAgIGFyZ3MuZ3JpZCA9IHRoaXMuZ3JpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB0eXBlb2YgYXJncy5jb250cm9scyA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5jb250cm9scykgOlxuICAgICAgICAgICAgYXJncy5jb250cm9scztcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuY29udHJvbHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlQ29udHJvbHMoKTtcbiAgICAgICAgICAgIGFyZ3MuY29udHJvbHMgPSB0aGlzLmNvbnRyb2xzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5QnRuID0gYXJncy5wbGF5QnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcGxheWJ0bicpO1xuICAgICAgICB0aGlzLnBhdXNlQnRuID0gYXJncy5wYXVzZUJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3BhdXNlYnRuJyk7XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvZmZidG4nKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuID0gYXJncy50cmFpbE9uQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvbmJ0bicpO1xuXG4gICAgICAgIHRoaXMuY29sb3JQaWNrZXIgPSB0eXBlb2YgYXJncy5jb2xvclBpY2tlciA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5jb2xvclBpY2tlcikgOlxuICAgICAgICAgICAgYXJncy5jb2xvclBpY2tlcjtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuY29sb3JQaWNrZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIuY2xhc3NOYW1lID0gJ2JvZHljb2xvcnBpY2tlcic7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuY29sb3JQaWNrZXIpO1xuICAgICAgICAgICAgYXJncy5jb2xvclBpY2tlciA9IHRoaXMuY29sb3JQaWNrZXI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5qc2NvbG9yID0gbmV3IGpzY29sb3IodGhpcy5jb2xvclBpY2tlciwge1xuICAgICAgICAgICAgd2lkdGg6IDEwMSxcbiAgICAgICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgICAgICBzaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICBpbnNldENvbG9yOiAnIzAwMCcsXG4gICAgICAgICAgICBvbkZpbmVDaGFuZ2U6IHRoaXMudXBkYXRlQ29sb3IuYmluZCh0aGlzKVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJbml0aWFsaXplXG4gICAgICAgIHRoaXMuaW5pdENvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VGltZXJzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbWFpbiAtLSBNYWluICdnYW1lJyBsb29wXG4gICAgICovXG4gICAgbWFpbigpIHtcbiAgICAgICAgLy8gRXZlbnQgcHJvY2Vzc2luZ1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHRoaXMuZXZlbnRzLnFnZXQoKS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBsZXQgcmV0dmFsO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VET1dOOlxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAvKiByaWdodCBjbGljayAqLyAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYm9keS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5yZW1vdmVCb2R5KHRoaXMudGFyZ2V0Qm9keSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gLyogbWlkZGxlIGNsaWNrICovIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbG9yIHBpY2tpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLmxlZnQgPSBldmVudC5wb3NpdGlvbi54ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLnRvcCA9IGV2ZW50LnBvc2l0aW9uLnkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanNjb2xvci5mcm9tU3RyaW5nKHRoaXMudGFyZ2V0Qm9keS5jb2xvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qc2NvbG9yLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBmbGFnIHRvIHNpZ25hbCBvdGhlciBldmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLmJvZHkgPSB0aGlzLnRhcmdldEJvZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uYm9keSA9IHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBldmVudC5wb3NpdGlvbi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnkgPSBldmVudC5wb3NpdGlvbi55O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VVUDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gdGhpcy5pbnRlcmFjdGlvbi5ib2R5O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFggPSAoZXZlbnQucG9zaXRpb24ueCAtIGJvZHkueCkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFkgPSAoZXZlbnQucG9zaXRpb24ueSAtIGJvZHkueSkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYXJnZXQoZXZlbnQucG9zaXRpb24ueCwgZXZlbnQucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFTU9WRTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy54ID0gZXZlbnQucG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy55ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGFyZ2V0KGV2ZW50LnBvc2l0aW9uLngsIGV2ZW50LnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VNT1ZFXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VXSEVFTDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5LmFkanVzdFNpemUoZXZlbnQuZGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VXSEVFTFxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLktFWURPV046XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQua2V5Y29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0VOVEVSOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19DOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHNpbXVsYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2Z4LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW1UaW1lci5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dmFsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19QOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19SOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIHJhbmRvbSBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUJvZGllcygxMCwge3JhbmRvbUNvbG9yczogdHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5hZGROZXdCb2R5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5vcHRpb25zLndpZHRoIC8gMiwgeTogdGhpcy5vcHRpb25zLmhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlbFg6IDAsIHZlbFk6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc3M6IDIwMDAsIHJhZGl1czogNTAsIGNvbG9yOiAnIzVBNUE1QSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5hZGROZXdCb2R5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5vcHRpb25zLndpZHRoIC0gNDAwLCB5OiB0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVsWDogMCwgdmVsWTogMC4wMDAwMjUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc3M6IDEsIHJhZGl1czogNSwgY29sb3I6ICcjNzg3ODc4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgS0VZRE9XTlxuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUExBWUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QQVVTRUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5UUkFJTE9GRkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5UUkFJTE9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmVkcmF3IHNjcmVlblxuICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgIH1cblxuICAgIGluaXRDb21wb25lbnRzKCkge1xuICAgICAgICAvLyBDcmVhdGUgY29tcG9uZW50cyAtLSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICAgICAgdGhpcy5ldmVudHMgPSB0aGlzLmFyZ3MuZXZlbnRzID0gbmV3IEd0RXZlbnRzKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuc2ltID0gbmV3IEd0U2ltKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuZ2Z4ID0gbmV3IEd0R2Z4KHRoaXMuYXJncyk7XG4gICAgfVxuXG4gICAgaW5pdFRpbWVycygpIHtcbiAgICAgICAgLy8gQWRkIGBtYWluYCBsb29wLCBhbmQgc3RhcnQgaW1tZWRpYXRlbHlcbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLm1haW4uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLnNpbS5zdGVwLmJpbmQodGhpcy5zaW0pLCA2MCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltKCkge1xuICAgICAgICBpZiAodGhpcy5zaW1UaW1lci5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheUJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMucGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2ltVGltZXIudG9nZ2xlKCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhaWxzKCkge1xuICAgICAgICBpZiAodGhpcy5ub2NsZWFyKSB7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMudHJhaWxPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy50cmFpbE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5vY2xlYXIgPSAhdGhpcy5ub2NsZWFyO1xuICAgIH1cblxuICAgIHJlZHJhdygpIHtcbiAgICAgICAgaWYgKCF0aGlzLm5vY2xlYXIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcmF3SW50ZXJhY3Rpb24oKTtcbiAgICAgICAgdGhpcy5nZnguZHJhd0JvZGllcyh0aGlzLnNpbS5ib2RpZXMsIHRoaXMudGFyZ2V0Qm9keSk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVHcmlkKHdpZHRoLCBoZWlnaHQsIHN0eWxlKSB7XG4gICAgICAgIC8vIEF0dGFjaCBhIGNhbnZhcyB0byB0aGUgcGFnZSwgdG8gaG91c2UgdGhlIHNpbXVsYXRpb25zXG4gICAgICAgIGlmICghc3R5bGUpIHtcbiAgICAgICAgICAgIHN0eWxlID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgICAgICB0aGlzLmdyaWQud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5ncmlkLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUubWFyZ2luTGVmdCA9IHN0eWxlLm1hcmdpbkxlZnQgfHwgJ2F1dG8nO1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUubWFyZ2luUmlnaHQgPSBzdHlsZS5tYXJnaW5SaWdodCB8fCAnYXV0byc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IgfHwgJyMwMDAwMDAnO1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5ncmlkKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZUNvbnRyb2xzKCkge1xuICAgICAgICB0aGlzLmNvbnRyb2xzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbWVudScpO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLnR5cGUgPSAndG9vbGJhcic7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaWQgPSAnY29udHJvbHMnO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInBsYXlidG5cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wbGF5LnN2Z1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInBhdXNlYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3BhdXNlLnN2Z1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb2ZmYnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb2ZmLnN2Z1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb25idG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb24uc3ZnXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgYDtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuY29udHJvbHMpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQm9kaWVzKG51bSwgYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICBsZXQgbWluWCA9IGFyZ3MubWluWCB8fCAwO1xuICAgICAgICBsZXQgbWF4WCA9IGFyZ3MubWF4WCB8fCB0aGlzLm9wdGlvbnMud2lkdGg7XG4gICAgICAgIGxldCBtaW5ZID0gYXJncy5taW5ZIHx8IDA7XG4gICAgICAgIGxldCBtYXhZID0gYXJncy5tYXhZIHx8IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG5cbiAgICAgICAgbGV0IG1pblZlbFggPSBhcmdzLm1pblZlbFggfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFggPSBhcmdzLm1heFZlbFggfHwgMC4wMDAwMTtcbiAgICAgICAgbGV0IG1pblZlbFkgPSBhcmdzLm1pblZlbFkgfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFkgPSBhcmdzLm1heFZlbFkgfHwgMC4wMDAwMTtcblxuICAgICAgICBsZXQgbWluTWFzcyA9IGFyZ3MubWluTWFzcyB8fCAxO1xuICAgICAgICBsZXQgbWF4TWFzcyA9IGFyZ3MubWF4TWFzcyB8fCAxNTA7XG5cbiAgICAgICAgbGV0IG1pblJhZGl1cyA9IGFyZ3MubWluUmFkaXVzIHx8IDE7XG4gICAgICAgIGxldCBtYXhSYWRpdXMgPSBhcmdzLm1heFJhZGl1cyB8fCAxNTtcblxuICAgICAgICBsZXQgY29sb3IgPSBhcmdzLmNvbG9yO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcmdzLnJhbmRvbUNvbG9ycyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gcmFuZG9tLmNvbG9yKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgIHg6IHJhbmRvbS5udW1iZXIobWluWCwgbWF4WCksXG4gICAgICAgICAgICAgICAgeTogcmFuZG9tLm51bWJlcihtaW5ZLCBtYXhZKSxcbiAgICAgICAgICAgICAgICB2ZWxYOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWCwgbWF4VmVsWCksXG4gICAgICAgICAgICAgICAgdmVsWTogcmFuZG9tLmRpcmVjdGlvbmFsKG1pblZlbFksIG1heFZlbFkpLFxuICAgICAgICAgICAgICAgIG1hc3M6IHJhbmRvbS5udW1iZXIobWluTWFzcywgbWF4TWFzcyksXG4gICAgICAgICAgICAgICAgcmFkaXVzOiByYW5kb20ubnVtYmVyKG1pblJhZGl1cywgbWF4UmFkaXVzKSxcbiAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0ludGVyYWN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5kcmF3UmV0aWNsZUxpbmUodGhpcy5pbnRlcmFjdGlvbi5ib2R5LCB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVRhcmdldCh4LCB5KSB7XG4gICAgICAgIHRoaXMudGFyZ2V0Qm9keSA9IHRoaXMuc2ltLmdldEJvZHlBdCh4LCB5KTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb2xvcigpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5LnVwZGF0ZUNvbG9yKHRoaXMuanNjb2xvci50b0hFWFN0cmluZygpKTtcbiAgICAgICAgfVxuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2FwcFxuIiwiaW1wb3J0IGNvbG9ycyBmcm9tICcuLi91dGlsL2NvbG9ycyc7XG5cbi8qKlxuICogZ3Jhdml0b24vYm9keSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBib2R5XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0Qm9keSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnggPSBhcmdzLng7XG4gICAgICAgIHRoaXMueSA9IGFyZ3MueTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnggIT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignQ29ycmVjdCBwb3NpdGlvbnMgd2VyZSBub3QgZ2l2ZW4gZm9yIHRoZSBib2R5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52ZWxYID0gYXJncy52ZWxYIHx8IDA7XG4gICAgICAgIHRoaXMudmVsWSA9IGFyZ3MudmVsWSB8fCAwO1xuXG4gICAgICAgIHRoaXMucmFkaXVzID0gYXJncy5yYWRpdXMgfHwgMTA7XG4gICAgICAgIC8vIEluaXRpYWxpemVkIGJlbG93LlxuICAgICAgICB0aGlzLm1hc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY29sb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3IoYXJncy5jb2xvciB8fCAnI0JBQkFCQScpO1xuICAgICAgICB0aGlzLmFkanVzdFNpemUoMCk7XG4gICAgfVxuXG4gICAgYWRqdXN0U2l6ZShkZWx0YSkge1xuICAgICAgICB0aGlzLnJhZGl1cyA9IE1hdGgubWF4KHRoaXMucmFkaXVzICsgZGVsdGEsIDIpO1xuICAgICAgICAvLyBEb3JreSBmb3JtdWxhIHRvIG1ha2UgbWFzcyBzY2FsZSBcInByb3Blcmx5XCIgd2l0aCByYWRpdXMuXG4gICAgICAgIHRoaXMubWFzcyA9IE1hdGgucG93KHRoaXMucmFkaXVzIC8gNCwgMyk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29sb3IoY29sb3IpIHtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IGNvbG9ycy50b0hleChjb2xvcnMuYnJpZ2h0ZW4oY29sb3JzLmZyb21IZXgodGhpcy5jb2xvciksIC4yNSkpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2JvZHlcbiIsIi8qKlxuICogZ3Jhdml0b24vZXZlbnRzIC0tIEV2ZW50IHF1ZXVlaW5nIGFuZCBwcm9jZXNzaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBLRVlDT0RFUyA9IHtcbiAgICBLX0xFRlQ6IDM3LFxuICAgIEtfVVA6IDM4LFxuICAgIEtfUklHSFQ6IDM5LFxuICAgIEtfRE9XTjogNDAsXG5cbiAgICBLXzA6IDQ4LFxuICAgIEtfMTogNDksXG4gICAgS18yOiA1MCxcbiAgICBLXzM6IDUxLFxuICAgIEtfNDogNTIsXG4gICAgS181OiA1MyxcbiAgICBLXzY6IDU0LFxuICAgIEtfNzogNTUsXG4gICAgS184OiA1NixcbiAgICBLXzk6IDU3LFxuXG4gICAgS19BOiA2NSxcbiAgICBLX0I6IDY2LFxuICAgIEtfQzogNjcsXG4gICAgS19EOiA2OCxcbiAgICBLX0U6IDY5LFxuICAgIEtfRjogNzAsXG4gICAgS19HOiA3MSxcbiAgICBLX0g6IDcyLFxuICAgIEtfSTogNzMsXG4gICAgS19KOiA3NCxcbiAgICBLX0s6IDc1LFxuICAgIEtfTDogNzYsXG4gICAgS19NOiA3NyxcbiAgICBLX046IDc4LFxuICAgIEtfTzogNzksXG4gICAgS19QOiA4MCxcbiAgICBLX1E6IDgxLFxuICAgIEtfUjogODIsXG4gICAgS19TOiA4MyxcbiAgICBLX1Q6IDg0LFxuICAgIEtfVTogODUsXG4gICAgS19WOiA4NixcbiAgICBLX1c6IDg3LFxuICAgIEtfWDogODgsXG4gICAgS19ZOiA4OSxcbiAgICBLX1o6IDkwLFxuXG4gICAgS19LUDE6IDk3LFxuICAgIEtfS1AyOiA5OCxcbiAgICBLX0tQMzogOTksXG4gICAgS19LUDQ6IDEwMCxcbiAgICBLX0tQNTogMTAxLFxuICAgIEtfS1A2OiAxMDIsXG4gICAgS19LUDc6IDEwMyxcbiAgICBLX0tQODogMTA0LFxuICAgIEtfS1A5OiAxMDUsXG5cbiAgICBLX0JBQ0tTUEFDRTogOCxcbiAgICBLX1RBQjogOSxcbiAgICBLX0VOVEVSOiAxMyxcbiAgICBLX1NISUZUOiAxNixcbiAgICBLX0NUUkw6IDE3LFxuICAgIEtfQUxUOiAxOCxcbiAgICBLX0VTQzogMjcsXG4gICAgS19TUEFDRTogMzJcbn07XG5cbmV4cG9ydCBjb25zdCBNT1VTRUNPREVTID0ge1xuICAgIE1fTEVGVDogMCxcbiAgICBNX01JRERMRTogMSxcbiAgICBNX1JJR0hUOiAyXG59O1xuXG5leHBvcnQgY29uc3QgRVZFTlRDT0RFUyA9IHtcbiAgICBNT1VTRURPV046IDEwMDAsXG4gICAgTU9VU0VVUDogMTAwMSxcbiAgICBNT1VTRU1PVkU6IDEwMDIsXG4gICAgTU9VU0VXSEVFTDogMTAwMyxcbiAgICBDTElDSzogMTAwNCxcbiAgICBEQkxDTElDSzogMTAwNSxcblxuICAgIEtFWURPV046IDEwMTAsXG4gICAgS0VZVVA6IDEwMTFcbn07XG5cbmV4cG9ydCBjb25zdCBDT05UUk9MQ09ERVMgPSB7XG4gICAgUExBWUJUTjogMjAwMCxcbiAgICBQQVVTRUJUTjogMjAwMSxcbiAgICBUUkFJTE9GRkJUTjogMjAwMixcbiAgICBUUkFJTE9OQlROOiAyMDAzXG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0RXZlbnRzIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIGFyZ3MuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ3JpZCA9IGFyZ3MuZ3JpZDtcbiAgICAgICAgdGhpcy5jb250cm9scyA9IGFyZ3MuY29udHJvbHM7XG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0bjtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG47XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4gPSBhcmdzLnRyYWlsT25CdG47XG5cbiAgICAgICAgdGhpcy53aXJldXBFdmVudHMoKTtcbiAgICB9XG5cbiAgICBxYWRkKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucXVldWUucHVzaChldmVudCk7XG4gICAgfVxuXG4gICAgcXBvbGwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgcWdldCgpIHtcbiAgICAgICAgLy8gUmVwbGFjaW5nIHRoZSByZWZlcmVuY2UgaXMgZmFzdGVyIHRoYW4gYHNwbGljZSgpYFxuICAgICAgICBsZXQgcmVmID0gdGhpcy5xdWV1ZTtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgICAgICByZXR1cm4gcmVmO1xuICAgIH1cblxuICAgIHFjbGVhcigpIHtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgIH1cblxuICAgIHdpcmV1cEV2ZW50cygpIHtcbiAgICAgICAgLy8gR3JpZCBtb3VzZSBldmVudHNcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5oYW5kbGVEYmxDbGljay5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmhhbmRsZUNvbnRleHRNZW51LmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5oYW5kbGVNb3VzZURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5oYW5kbGVNb3VzZVVwLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVNb3VzZU1vdmUuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuaGFuZGxlTW91c2VXaGVlbC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBHcmlkIGtleSBldmVudHNcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlS2V5RG93bi5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmhhbmRsZUtleVVwLmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIENvbnRyb2wgZXZlbnRzXG4gICAgICAgIHRoaXMucGxheUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlBMQVlCVE4pKTtcbiAgICAgICAgdGhpcy5wYXVzZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlBBVVNFQlROKSk7XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5UUkFJTE9GRkJUTikpO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5UUkFJTE9OQlROKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVEYmxDbGljayhldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5EQkxDTElDSyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGJ1dHRvbjogZXZlbnQuYnV0dG9uLFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUNvbnRleHRNZW51KGV2ZW50KSB7XG4gICAgICAgIC8vIFByZXZlbnQgcmlnaHQtY2xpY2sgbWVudVxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlRG93bihldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRURPV04sXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZVVwKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFVVAsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VNT1ZFLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VXaGVlbChldmVudCkge1xuICAgICAgICAvLyBSZXZlcnNlIHRoZSB1cC9kb3duLlxuICAgICAgICBsZXQgZGVsdGEgPSAtZXZlbnQuZGVsdGFZIC8gNTA7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VXSEVFTCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGRlbHRhOiBkZWx0YSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBzY3JvbGxpbmdcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlEb3duKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlET1dOLFxuICAgICAgICAgICAga2V5Y29kZToga2V5LFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUtleVVwKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlVUCxcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250cm9sQ2xpY2sodHlwZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRQb3NpdGlvbihldmVudCkge1xuICAgICAgICAvLyBDYWxjdWxhdGUgb2Zmc2V0IG9uIHRoZSBncmlkIGZyb20gY2xpZW50WC9ZLCBiZWNhdXNlXG4gICAgICAgIC8vIHNvbWUgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBldmVudC5vZmZzZXRYL1lcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LmNsaWVudFggLSB0aGlzLmdyaWQub2Zmc2V0TGVmdCxcbiAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFkgLSB0aGlzLmdyaWQub2Zmc2V0VG9wXG4gICAgICAgIH07XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vZXZlbnRzXG4iLCIvKipcbiAqIGdyYXZpdG9uL2dmeCAtLSBUaGUgZ3JhcGhpY3Mgb2JqZWN0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0R2Z4IHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHVzYWJsZSBjYW52YXMgZWxlbWVudCB3YXMgZ2l2ZW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuZ3JpZC5nZXRDb250ZXh0KCcyZCcpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICAvLyBTZXR0aW5nIHRoZSB3aWR0aCBoYXMgdGhlIHNpZGUgZWZmZWN0XG4gICAgICAgIC8vIG9mIGNsZWFyaW5nIHRoZSBjYW52YXNcbiAgICAgICAgdGhpcy5ncmlkLndpZHRoID0gdGhpcy5ncmlkLndpZHRoO1xuICAgIH1cblxuICAgIGRyYXdCb2RpZXMoYm9kaWVzLCB0YXJnZXRCb2R5KSB7XG4gICAgICAgIGZvciAobGV0IGJvZHkgb2YgYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdCb2R5KGJvZHksIC8qIGlzVGFyZ2V0ZWQgKi8gYm9keSA9PT0gdGFyZ2V0Qm9keSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3Qm9keShib2R5LCBpc1RhcmdldGVkKSB7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGJvZHkuY29sb3I7XG5cbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LmFyYyhib2R5LngsIGJvZHkueSwgYm9keS5yYWRpdXMsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgICAgIGlmIChpc1RhcmdldGVkKSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGJvZHkuaGlnaGxpZ2h0O1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gTWF0aC5yb3VuZChib2R5LnJhZGl1cyAvIDgpO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3UmV0aWNsZUxpbmUoZnJvbSwgdG8pIHtcbiAgICAgICAgbGV0IGdyYWQgPSB0aGlzLmN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudChmcm9tLngsIGZyb20ueSwgdG8ueCwgdG8ueSk7XG4gICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDMxLCA3NSwgMTMwLCAxKScpO1xuICAgICAgICBncmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgzMSwgNzUsIDEzMCwgMC4xKScpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGdyYWQ7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDY7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuXG4gICAgICAgIC8vIERyYXcgaW5pdGlhbCBiYWNrZ3JvdW5kIGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oZnJvbS54LCBmcm9tLnkpO1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8odG8ueCwgdG8ueSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIC8vIERyYXcgb3ZlcmxheSBsaW5lLlxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICcjMzQ3N0NBJztcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMjtcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyhmcm9tLngsIGZyb20ueSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0by54LCB0by55KTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vZ2Z4XG4iLCIvKipcbiAqIGdyYXZpdG9uL3NpbSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBzaW11bGF0b3JcbiAqL1xuaW1wb3J0IGxvZyBmcm9tICcuLi91dGlsL2xvZyc7XG5pbXBvcnQgR3RCb2R5IGZyb20gJy4vYm9keSc7XG5pbXBvcnQgR3RUcmVlIGZyb20gJy4vdHJlZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0U2ltIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLmJvZGllcyA9IFtdO1xuICAgICAgICB0aGlzLnRyZWUgPSBuZXcgR3RUcmVlKGFyZ3Mud2lkdGgsIGFyZ3MuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcblxuICAgICAgICAvLyBUZW1wb3Jhcnkgd29ya3NwYWNlXG4gICAgICAgIHRoaXMuRCA9IHt9O1xuXG4gICAgICAgIHRoaXMub3B0aW9ucy5HID0gYXJncy5HIHx8IDYuNjczODQgKiBNYXRoLnBvdygxMCwgLTExKTsgLy8gR3Jhdml0YXRpb25hbCBjb25zdGFudFxuICAgICAgICB0aGlzLm9wdGlvbnMubXVsdGlwbGllciA9IGFyZ3MubXVsdGlwbGllciB8fCAxNTAwOyAvLyBUaW1lc3RlcFxuICAgICAgICB0aGlzLm9wdGlvbnMuY29sbGlzaW9ucyA9IGFyZ3MuY29sbGlzaW9uIHx8IHRydWU7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zY2F0dGVyTGltaXQgPSBhcmdzLnNjYXR0ZXJMaW1pdCB8fCAxMDAwMDtcbiAgICB9XG5cbiAgICBzdGVwKGVsYXBzZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jb2xsaXNpb25zID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogSXMgdGhpcyB1c2VmdWw/XG4gICAgICAgICAgICAgICAgdGhpcy5kZXRlY3RDb2xsaXNpb24oYm9keSwgaSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlTmV3UG9zaXRpb24oYm9keSwgaSwgZWxhcHNlZCAqIHRoaXMub3B0aW9ucy5tdWx0aXBsaWVyKTtcblxuICAgICAgICAgICAgaSA9IHRoaXMucmVtb3ZlU2NhdHRlcmVkKGJvZHksIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50aW1lICs9IGVsYXBzZWQ7IC8vIEluY3JlbWVudCBydW50aW1lXG4gICAgfVxuXG4gICAgY2FsY3VsYXRlTmV3UG9zaXRpb24oYm9keSwgaW5kZXgsIGRlbHRhVCkge1xuICAgICAgICBsZXQgbmV0RnggPSAwO1xuICAgICAgICBsZXQgbmV0RnkgPSAwO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgYm9kaWVzIGFuZCBzdW0gdGhlIGZvcmNlcyBleGVydGVkXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJhY3RvciA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBkaXN0YW5jZSBhbmQgcG9zaXRpb24gZGVsdGFzXG4gICAgICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVEaXN0YW5jZShib2R5LCBhdHRyYWN0b3IpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGZvcmNlIHVzaW5nIE5ld3RvbmlhbiBncmF2aXR5LCBzZXBhcmF0ZSBvdXQgaW50byB4IGFuZCB5IGNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICBsZXQgRiA9ICh0aGlzLm9wdGlvbnMuRyAqIGJvZHkubWFzcyAqIGF0dHJhY3Rvci5tYXNzKSAvIE1hdGgucG93KHRoaXMuRC5yLCAyKTtcbiAgICAgICAgICAgICAgICBsZXQgRnggPSBGICogKHRoaXMuRC5keCAvIHRoaXMuRC5yKTtcbiAgICAgICAgICAgICAgICBsZXQgRnkgPSBGICogKHRoaXMuRC5keSAvIHRoaXMuRC5yKTtcblxuICAgICAgICAgICAgICAgIG5ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgICAgIG5ldEZ5ICs9IEZ5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGFjY2VsZXJhdGlvbnNcbiAgICAgICAgbGV0IGF4ID0gbmV0RnggLyBib2R5Lm1hc3M7XG4gICAgICAgIGxldCBheSA9IG5ldEZ5IC8gYm9keS5tYXNzO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBuZXcgdmVsb2NpdGllcywgbm9ybWFsaXplZCBieSB0aGUgJ3RpbWUnIGludGVydmFsXG4gICAgICAgIGJvZHkudmVsWCArPSBkZWx0YVQgKiBheDtcbiAgICAgICAgYm9keS52ZWxZICs9IGRlbHRhVCAqIGF5O1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBuZXcgcG9zaXRpb25zIGFmdGVyIHRpbWVzdGVwIGRlbHRhVFxuICAgICAgICBib2R5LnggKz0gZGVsdGFUICogYm9keS52ZWxYO1xuICAgICAgICBib2R5LnkgKz0gZGVsdGFUICogYm9keS52ZWxZO1xuICAgIH1cblxuICAgIGNhbGN1bGF0ZURpc3RhbmNlKGJvZHksIG90aGVyKSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY2hhbmdlIGluIHBvc2l0aW9uIGFsb25nIHRoZSB0d28gZGltZW5zaW9uc1xuICAgICAgICB0aGlzLkQuZHggPSBvdGhlci54IC0gYm9keS54O1xuICAgICAgICB0aGlzLkQuZHkgPSBvdGhlci55IC0gYm9keS55O1xuXG4gICAgICAgIC8vIE9idGFpbiB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgb2JqZWN0cyAoaHlwb3RlbnVzZSlcbiAgICAgICAgdGhpcy5ELnIgPSBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy5ELmR4LCAyKSArIE1hdGgucG93KHRoaXMuRC5keSwgMikpO1xuICAgIH1cblxuICAgIGRldGVjdENvbGxpc2lvbihib2R5LCBpbmRleCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xsaWRlciA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVEaXN0YW5jZShib2R5LCBjb2xsaWRlcik7XG4gICAgICAgICAgICAgICAgbGV0IGNsZWFyYW5jZSA9IGJvZHkucmFkaXVzICsgY29sbGlkZXIucmFkaXVzO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuRC5yIDw9IGNsZWFyYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb2xsaXNpb24gZGV0ZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgbG9nLndyaXRlKCdDb2xsaXNpb24gZGV0ZWN0ZWQhIScsICdkZWJ1ZycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZVNjYXR0ZXJlZChib2R5LCBpbmRleCkge1xuICAgICAgICBpZiAoYm9keS54ID4gdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCB8fFxuICAgICAgICAgICAgYm9keS54IDwgLXRoaXMub3B0aW9ucy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgIGJvZHkueSA+IHRoaXMub3B0aW9ucy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgIGJvZHkueSA8IC10aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0KSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgZnJvbSBib2R5IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBmb3IgdHJlZS5cbiAgICAgICAgICAgIHRoaXMuYm9kaWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggLSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG5cbiAgICBhZGROZXdCb2R5KGFyZ3MpIHtcbiAgICAgICAgbGV0IGJvZHkgPSBuZXcgR3RCb2R5KGFyZ3MpO1xuICAgICAgICB0aGlzLmJvZGllcy5wdXNoKGJvZHkpO1xuICAgICAgICB0aGlzLnRyZWUuYWRkQm9keShib2R5KTtcblxuICAgICAgICByZXR1cm4gYm9keTtcbiAgICB9XG5cbiAgICByZW1vdmVCb2R5KHRhcmdldEJvZHkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgaWYgKGJvZHkgPT09IHRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvZGllcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXNldFRyZWUoKTtcbiAgICB9XG5cbiAgICBnZXRCb2R5QXQoeCwgeSkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5ib2RpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGlzTWF0Y2ggPSBNYXRoLmFicyh4IC0gYm9keS54KSA8PSBib2R5LnJhZGl1cyAmJlxuICAgICAgICAgICAgICAgIE1hdGguYWJzKHkgLSBib2R5LnkpIDw9IGJvZHkucmFkaXVzO1xuICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmJvZGllcy5sZW5ndGggPSAwOyAvLyBSZW1vdmUgYWxsIGJvZGllcyBmcm9tIGNvbGxlY3Rpb25cbiAgICAgICAgdGhpcy5yZXNldFRyZWUoKTtcbiAgICB9XG5cbiAgICByZXNldFRyZWUoKSB7XG4gICAgICAgIHRoaXMudHJlZS5jbGVhcigpO1xuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgdGhpcy5ib2RpZXMpIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vc2ltXG4iLCIvKipcbiAqIGdyYXZpdG9uL3RpbWVyIC0tIFNpbSB0aW1lciBhbmQgRlBTIGxpbWl0ZXJcbiAqL1xuaW1wb3J0IGVudiBmcm9tICcuLi91dGlsL2Vudic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0VGltZXIge1xuICAgIGNvbnN0cnVjdG9yKGZuLCBmcHM9bnVsbCkge1xuICAgICAgICB0aGlzLl9mbiA9IGZuO1xuICAgICAgICB0aGlzLl9mcHMgPSBmcHM7XG4gICAgICAgIHRoaXMuX2lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2lzQW5pbWF0aW9uID0gZnBzID09PSBudWxsO1xuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fd2luZG93ID0gZW52LmdldFdpbmRvdygpO1xuICAgIH1cblxuICAgIGdldCBhY3RpdmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0FjdGl2ZTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmVnaW5BbmltYXRpb24oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmVnaW5JbnRlcnZhbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faXNBY3RpdmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fY2FuY2VsbGF0aW9uSWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLl9jYW5jZWxsYXRpb25JZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBpZiAodGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2JlZ2luQW5pbWF0aW9uKCkge1xuICAgICAgICBsZXQgbGFzdFRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgbGV0IGFuaW1hdG9yID0gKHRpbWVzdGFtcCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICAgICAgICAgIHRoaXMuX2ZuKHRpbWVzdGFtcCAtIGxhc3RUaW1lc3RhbXApO1xuICAgICAgICAgICAgbGFzdFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBEZWxheSBpbml0aWFsIGV4ZWN1dGlvbiB1bnRpbCB0aGUgbmV4dCB0aWNrLlxuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgIH1cblxuICAgIF9iZWdpbkludGVydmFsKCkge1xuICAgICAgICAvLyBDb21wdXRlIHRoZSBkZWxheSBwZXIgdGljaywgaW4gbWlsbGlzZWNvbmRzLlxuICAgICAgICBsZXQgdGltZW91dCA9IDEwMDAgLyB0aGlzLl9mcHMgfCAwO1xuXG4gICAgICAgIGxldCBsYXN0VGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICBsZXQgdGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5fZm4odGltZXN0YW1wIC0gbGFzdFRpbWVzdGFtcCk7XG4gICAgICAgICAgICBsYXN0VGltZXN0YW1wID0gdGltZXN0YW1wO1xuICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vdGltZXJcbiIsIi8qKlxuICogZ3Jhdml0b24vdHJlZSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBib2R5IHRyZWUgc3RydWN0dXJlXG4gKi9cbmNsYXNzIEd0VHJlZU5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHN0YXJ0WCwgc3RhcnRZLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgICAgICB0aGlzLnN0YXJ0WSA9IHN0YXJ0WTtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5oYWxmV2lkdGggPSB3aWR0aCAvIDI7XG4gICAgICAgIHRoaXMuaGFsZkhlaWdodCA9IGhlaWdodCAvIDI7XG5cbiAgICAgICAgdGhpcy5taWRYID0gdGhpcy5zdGFydFggKyB0aGlzLmhhbGZXaWR0aDtcbiAgICAgICAgdGhpcy5taWRZID0gdGhpcy5zdGFydFkgKyB0aGlzLmhhbGZIZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5tYXNzID0gMDtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcblxuICAgICAgICAvLyBbTlcsIE5FLCBTVywgU0VdXG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBuZXcgQXJyYXkoNCk7XG4gICAgfVxuXG4gICAgYWRkQm9keShib2R5KSB7XG4gICAgICAgIHRoaXMudXBkYXRlTWFzcyhib2R5KTtcbiAgICAgICAgY29uc3QgcXVhZHJhbnQgPSB0aGlzLmdldFF1YWRyYW50KGJvZHkueCwgYm9keS55KTtcblxuICAgICAgICBpZiAoIXRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdKSB7XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSA9IGJvZHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdO1xuICAgICAgICAgICAgY29uc3QgcXVhZFggPSBleGlzdGluZy54ID4gdGhpcy5taWRYID8gdGhpcy5taWRYIDogdGhpcy5zdGFydFg7XG4gICAgICAgICAgICBjb25zdCBxdWFkWSA9IGV4aXN0aW5nLnkgPiB0aGlzLm1pZFkgPyB0aGlzLm1pZFkgOiB0aGlzLnN0YXJ0WTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgR3RUcmVlTm9kZShxdWFkWCwgcXVhZFksIHRoaXMuaGFsZldpZHRoLCB0aGlzLmhhbGZIZWlnaHQpO1xuXG4gICAgICAgICAgICBub2RlLmFkZEJvZHkoZXhpc3RpbmcpO1xuICAgICAgICAgICAgbm9kZS5hZGRCb2R5KGJvZHkpO1xuXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVNYXNzKGJvZHkpIHtcbiAgICAgICAgY29uc3QgbmV3TWFzcyA9IHRoaXMubWFzcyArIGJvZHkubWFzcztcbiAgICAgICAgY29uc3QgbmV3WCA9ICh0aGlzLnggKiB0aGlzLm1hc3MgKyBib2R5LnggKiBib2R5Lm1hc3MpIC8gbmV3TWFzcztcbiAgICAgICAgY29uc3QgbmV3WSA9ICh0aGlzLnkgKiB0aGlzLm1hc3MgKyBib2R5LnkgKiBib2R5Lm1hc3MpIC8gbmV3TWFzcztcbiAgICAgICAgdGhpcy5tYXNzID0gbmV3TWFzcztcbiAgICAgICAgdGhpcy54ID0gbmV3WDtcbiAgICAgICAgdGhpcy55ID0gbmV3WTtcbiAgICB9XG5cbiAgICBnZXRRdWFkcmFudCh4LCB5KSB7XG4gICAgICAgIGNvbnN0IHhJbmRleCA9IE51bWJlcih4ID4gdGhpcy5taWRYKTtcbiAgICAgICAgY29uc3QgeUluZGV4ID0gTnVtYmVyKHkgPiB0aGlzLm1pZFkpICogMjtcbiAgICAgICAgcmV0dXJuIHhJbmRleCArIHlJbmRleDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0VHJlZSB7XG4gICAgY29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLnJvb3QgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgYWRkQm9keShib2R5KSB7XG4gICAgICAgIGlmICh0aGlzLnJvb3QgaW5zdGFuY2VvZiBHdFRyZWVOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShib2R5KTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBib2R5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBuZXcgR3RUcmVlTm9kZSgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShleGlzdGluZyk7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShib2R5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJvb3QgPSB1bmRlZmluZWQ7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vdHJlZVxuIiwiaW1wb3J0ICcuL3ZlbmRvci9qc2NvbG9yJztcbmltcG9ydCAnLi9wb2x5ZmlsbHMnO1xuaW1wb3J0IGd0IGZyb20gJy4vZ3Jhdml0b24nO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU3RhcnQgdGhlIG1haW4gZ3Jhdml0b24gYXBwLlxuICAgIHdpbmRvdy5ncmF2aXRvbiA9IG5ldyBndC5hcHAoKTtcbn07XG4iLCJ3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuICAgIH07XG5cbndpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uKHRpbWVvdXRJZCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfTtcblxud2luZG93LnBlcmZvcm1hbmNlID0gd2luZG93LnBlcmZvcm1hbmNlIHx8IHt9O1xud2luZG93LnBlcmZvcm1hbmNlLm5vdyA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgfHxcbiAgICB3aW5kb3cucGVyZm9ybWFuY2Uud2Via2l0Tm93IHx8XG4gICAgd2luZG93LnBlcmZvcm1hbmNlLm1vek5vdyB8fFxuICAgIERhdGUubm93O1xuIiwiLyoqXG4gKiBjb2xvcnMgLS0gQ29sb3IgbWFuaXB1bGF0aW9uIGhlbHBlcnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIGJyaWdodGVuKGNvbG9yQXJyYXksIHBlcmNlbnQpIHtcbiAgICAgICAgbGV0IFtyLCBnLCBiXSA9IGNvbG9yQXJyYXk7XG4gICAgICAgIHIgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIHIgKyAociAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIGcgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIGcgKyAoZyAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIGIgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIGIgKyAoYiAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIHJldHVybiBbciwgZywgYl07XG4gICAgfSxcblxuICAgIGZyb21IZXgoaGV4KSB7XG4gICAgICAgIGxldCBoID0gaGV4LnJlcGxhY2UoJyMnLCAnJyk7XG4gICAgICAgIGlmIChoLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgICAgIGggPSBoLnJlcGxhY2UoLyguKS9nLCAnJDEkMScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbcGFyc2VJbnQoaC5zdWJzdHIoMCwgMiksIDE2KSxcbiAgICAgICAgICAgICAgICBwYXJzZUludChoLnN1YnN0cigyLCAyKSwgMTYpLFxuICAgICAgICAgICAgICAgIHBhcnNlSW50KGguc3Vic3RyKDQsIDIpLCAxNildO1xuICAgIH0sXG5cbiAgICB0b0hleChjb2xvckFycmF5KSB7XG4gICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGNvbG9yQXJyYXk7XG4gICAgICAgIHJldHVybiAnIycgKyAoJzAnICsgci50b1N0cmluZygxNikpLnN1YnN0cihyIDwgMTYgPyAwIDogMSkgK1xuICAgICAgICAgICAgICAgICAgICAgKCcwJyArIGcudG9TdHJpbmcoMTYpKS5zdWJzdHIoZyA8IDE2ID8gMCA6IDEpICtcbiAgICAgICAgICAgICAgICAgICAgICgnMCcgKyBiLnRvU3RyaW5nKDE2KSkuc3Vic3RyKGIgPCAxNiA/IDAgOiAxKTtcbiAgICB9XG59O1xuIiwiLyoqXG4gKiBlbnYgLSBFbnZpcm9ubWVudCByZXRyaWV2YWwgbWV0aG9kcy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIGdldFdpbmRvdygpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG59O1xuIiwiLyoqXG4gKiBsb2cgLS0gTG9nZ2luZyBmdW5jdGlvbnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBsb2dMZXZlbDogbnVsbFxuICAgIH0sXG5cbiAgICB3cml0ZShtZXNzYWdlLCBsZXZlbCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGxldCBzdGFtcCA9IG5vdy5nZXRGdWxsWWVhcigpICsgJy0nICsgbm93LmdldE1vbnRoKCkgKyAnLScgKyBub3cuZ2V0RGF0ZSgpICsgJ1QnICtcbiAgICAgICAgICAgICAgICBub3cuZ2V0SG91cnMoKSArICc6JyArIG5vdy5nZXRNaW51dGVzKCkgKyAnOicgKyBub3cuZ2V0U2Vjb25kcygpICsgJzonICsgbm93LmdldE1pbGxpc2Vjb25kcygpO1xuXG4gICAgICAgICAgICBtZXNzYWdlID0gc3RhbXAgKyAnICcgKyBtZXNzYWdlO1xuXG4gICAgICAgICAgICBsZXZlbCA9IChsZXZlbCB8fCB0aGlzLmNvbmZpZy5sb2dMZXZlbCB8fCAnZGVidWcnKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICAvLyBXcml0ZSB0byBjb25zb2xlIC0tIGN1cnJlbnRseSwgYGxvZ2AsIGBkZWJ1Z2AsIGBpbmZvYCwgYHdhcm5gLCBhbmQgYGVycm9yYFxuICAgICAgICAgICAgLy8gYXJlIGF2YWlsYWJsZVxuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAgICAgaWYgKGNvbnNvbGVbbGV2ZWxdKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZVtsZXZlbF0obWVzc2FnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdMb2cgbGV2ZWwgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRMZXZlbChsZXZlbCkge1xuICAgICAgICBsZXZlbCA9IGxldmVsLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgaWYgKGNvbnNvbGVbbGV2ZWxdKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgdGhpcy5jb25maWcubG9nTGV2ZWwgPSBsZXZlbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdMb2cgbGV2ZWwgZG9lcyBub3QgZXhpc3QuJyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiLyoqXG4gKiByYW5kb20gLS0gQSBjb2xsZWN0aW9uIG9mIHJhbmRvbSBnZW5lcmF0b3IgZnVuY3Rpb25zXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIgYmV0d2VlbiB0aGUgZ2l2ZW4gc3RhcnQgYW5kIGVuZCBwb2ludHNcbiAgICAgKi9cbiAgICBudW1iZXIoZnJvbSwgdG89bnVsbCkge1xuICAgICAgICBpZiAodG8gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRvID0gZnJvbTtcbiAgICAgICAgICAgIGZyb20gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAodG8gLSBmcm9tKSArIGZyb207XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiB0aGUgZ2l2ZW4gcG9zaXRpb25zXG4gICAgICovXG4gICAgaW50ZWdlciguLi5hcmdzKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMubnVtYmVyKC4uLmFyZ3MpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyLCB3aXRoIGEgcmFuZG9tIHNpZ24sIGJldHdlZW4gdGhlIGdpdmVuXG4gICAgICogcG9zaXRpb25zXG4gICAgICovXG4gICAgZGlyZWN0aW9uYWwoLi4uYXJncykge1xuICAgICAgICBsZXQgcmFuZCA9IHRoaXMubnVtYmVyKC4uLmFyZ3MpO1xuICAgICAgICBpZiAoTWF0aC5yYW5kb20oKSA+IDAuNSkge1xuICAgICAgICAgICAgcmFuZCA9IC1yYW5kO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByYW5kO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBoZXhhZGVjaW1hbCBjb2xvclxuICAgICAqL1xuICAgIGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gJyMnICsgKCcwMDAwMCcgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDApLnRvU3RyaW5nKDE2KSkuc3Vic3RyKC02KTtcbiAgICB9XG59O1xuIiwiLyoqXG4gKiBqc2NvbG9yIC0gSmF2YVNjcmlwdCBDb2xvciBQaWNrZXJcbiAqXG4gKiBAbGluayAgICBodHRwOi8vanNjb2xvci5jb21cbiAqIEBsaWNlbnNlIEZvciBvcGVuIHNvdXJjZSB1c2U6IEdQTHYzXG4gKiAgICAgICAgICBGb3IgY29tbWVyY2lhbCB1c2U6IEpTQ29sb3IgQ29tbWVyY2lhbCBMaWNlbnNlXG4gKiBAYXV0aG9yICBKYW4gT2R2YXJrb1xuICogQHZlcnNpb24gMi4wLjRcbiAqXG4gKiBTZWUgdXNhZ2UgZXhhbXBsZXMgYXQgaHR0cDovL2pzY29sb3IuY29tL2V4YW1wbGVzL1xuICovXG5cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cblxuaWYgKCF3aW5kb3cuanNjb2xvcikgeyB3aW5kb3cuanNjb2xvciA9IChmdW5jdGlvbiAoKSB7XG5cblxudmFyIGpzYyA9IHtcblxuXG5cdHJlZ2lzdGVyIDogZnVuY3Rpb24gKCkge1xuXHRcdGpzYy5hdHRhY2hET01SZWFkeUV2ZW50KGpzYy5pbml0KTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZG9jdW1lbnQsICdtb3VzZWRvd24nLCBqc2Mub25Eb2N1bWVudE1vdXNlRG93bik7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGRvY3VtZW50LCAndG91Y2hzdGFydCcsIGpzYy5vbkRvY3VtZW50VG91Y2hTdGFydCk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIGpzYy5vbldpbmRvd1Jlc2l6ZSk7XG5cdH0sXG5cblxuXHRpbml0IDogZnVuY3Rpb24gKCkge1xuXHRcdGlmIChqc2MuanNjb2xvci5sb29rdXBDbGFzcykge1xuXHRcdFx0anNjLmpzY29sb3IuaW5zdGFsbEJ5Q2xhc3NOYW1lKGpzYy5qc2NvbG9yLmxvb2t1cENsYXNzKTtcblx0XHR9XG5cdH0sXG5cblxuXHR0cnlJbnN0YWxsT25FbGVtZW50cyA6IGZ1bmN0aW9uIChlbG1zLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgbWF0Y2hDbGFzcyA9IG5ldyBSZWdFeHAoJyhefFxcXFxzKSgnICsgY2xhc3NOYW1lICsgJykoXFxcXHMqKFxcXFx7W159XSpcXFxcfSl8XFxcXHN8JCknLCAnaScpO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbG1zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRpZiAoZWxtc1tpXS50eXBlICE9PSB1bmRlZmluZWQgJiYgZWxtc1tpXS50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2NvbG9yJykge1xuXHRcdFx0XHRpZiAoanNjLmlzQ29sb3JBdHRyU3VwcG9ydGVkKSB7XG5cdFx0XHRcdFx0Ly8gc2tpcCBpbnB1dHMgb2YgdHlwZSAnY29sb3InIGlmIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR2YXIgbTtcblx0XHRcdGlmICghZWxtc1tpXS5qc2NvbG9yICYmIGVsbXNbaV0uY2xhc3NOYW1lICYmIChtID0gZWxtc1tpXS5jbGFzc05hbWUubWF0Y2gobWF0Y2hDbGFzcykpKSB7XG5cdFx0XHRcdHZhciB0YXJnZXRFbG0gPSBlbG1zW2ldO1xuXHRcdFx0XHR2YXIgb3B0c1N0ciA9IG51bGw7XG5cblx0XHRcdFx0dmFyIGRhdGFPcHRpb25zID0ganNjLmdldERhdGFBdHRyKHRhcmdldEVsbSwgJ2pzY29sb3InKTtcblx0XHRcdFx0aWYgKGRhdGFPcHRpb25zICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0b3B0c1N0ciA9IGRhdGFPcHRpb25zO1xuXHRcdFx0XHR9IGVsc2UgaWYgKG1bNF0pIHtcblx0XHRcdFx0XHRvcHRzU3RyID0gbVs0XTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBvcHRzID0ge307XG5cdFx0XHRcdGlmIChvcHRzU3RyKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdG9wdHMgPSAobmV3IEZ1bmN0aW9uICgncmV0dXJuICgnICsgb3B0c1N0ciArICcpJykpKCk7XG5cdFx0XHRcdFx0fSBjYXRjaChlUGFyc2VFcnJvcikge1xuXHRcdFx0XHRcdFx0anNjLndhcm4oJ0Vycm9yIHBhcnNpbmcganNjb2xvciBvcHRpb25zOiAnICsgZVBhcnNlRXJyb3IgKyAnOlxcbicgKyBvcHRzU3RyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0dGFyZ2V0RWxtLmpzY29sb3IgPSBuZXcganNjLmpzY29sb3IodGFyZ2V0RWxtLCBvcHRzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRpc0NvbG9yQXR0clN1cHBvcnRlZCA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cdFx0aWYgKGVsbS5zZXRBdHRyaWJ1dGUpIHtcblx0XHRcdGVsbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnY29sb3InKTtcblx0XHRcdGlmIChlbG0udHlwZS50b0xvd2VyQ2FzZSgpID09ICdjb2xvcicpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSkoKSxcblxuXG5cdGlzQ2FudmFzU3VwcG9ydGVkIDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0cmV0dXJuICEhKGVsbS5nZXRDb250ZXh0ICYmIGVsbS5nZXRDb250ZXh0KCcyZCcpKTtcblx0fSkoKSxcblxuXG5cdGZldGNoRWxlbWVudCA6IGZ1bmN0aW9uIChtaXhlZCkge1xuXHRcdHJldHVybiB0eXBlb2YgbWl4ZWQgPT09ICdzdHJpbmcnID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWl4ZWQpIDogbWl4ZWQ7XG5cdH0sXG5cblxuXHRpc0VsZW1lbnRUeXBlIDogZnVuY3Rpb24gKGVsbSwgdHlwZSkge1xuXHRcdHJldHVybiBlbG0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXHR9LFxuXG5cblx0Z2V0RGF0YUF0dHIgOiBmdW5jdGlvbiAoZWwsIG5hbWUpIHtcblx0XHR2YXIgYXR0ck5hbWUgPSAnZGF0YS0nICsgbmFtZTtcblx0XHR2YXIgYXR0clZhbHVlID0gZWwuZ2V0QXR0cmlidXRlKGF0dHJOYW1lKTtcblx0XHRpZiAoYXR0clZhbHVlICE9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gYXR0clZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fSxcblxuXG5cdGF0dGFjaEV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKGVsLmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZudCwgZnVuYywgZmFsc2UpO1xuXHRcdH0gZWxzZSBpZiAoZWwuYXR0YWNoRXZlbnQpIHtcblx0XHRcdGVsLmF0dGFjaEV2ZW50KCdvbicgKyBldm50LCBmdW5jKTtcblx0XHR9XG5cdH0sXG5cblxuXHRkZXRhY2hFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmIChlbC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2bnQsIGZ1bmMsIGZhbHNlKTtcblx0XHR9IGVsc2UgaWYgKGVsLmRldGFjaEV2ZW50KSB7XG5cdFx0XHRlbC5kZXRhY2hFdmVudCgnb24nICsgZXZudCwgZnVuYyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0X2F0dGFjaGVkR3JvdXBFdmVudHMgOiB7fSxcblxuXG5cdGF0dGFjaEdyb3VwRXZlbnQgOiBmdW5jdGlvbiAoZ3JvdXBOYW1lLCBlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmICghanNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzLmhhc093blByb3BlcnR5KGdyb3VwTmFtZSkpIHtcblx0XHRcdGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdID0gW107XG5cdFx0fVxuXHRcdGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdLnB1c2goW2VsLCBldm50LCBmdW5jXSk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGVsLCBldm50LCBmdW5jKTtcblx0fSxcblxuXG5cdGRldGFjaEdyb3VwRXZlbnRzIDogZnVuY3Rpb24gKGdyb3VwTmFtZSkge1xuXHRcdGlmIChqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHMuaGFzT3duUHJvcGVydHkoZ3JvdXBOYW1lKSkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHR2YXIgZXZ0ID0ganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV1baV07XG5cdFx0XHRcdGpzYy5kZXRhY2hFdmVudChldnRbMF0sIGV2dFsxXSwgZXZ0WzJdKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXTtcblx0XHR9XG5cdH0sXG5cblxuXHRhdHRhY2hET01SZWFkeUV2ZW50IDogZnVuY3Rpb24gKGZ1bmMpIHtcblx0XHR2YXIgZmlyZWQgPSBmYWxzZTtcblx0XHR2YXIgZmlyZU9uY2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIWZpcmVkKSB7XG5cdFx0XHRcdGZpcmVkID0gdHJ1ZTtcblx0XHRcdFx0ZnVuYygpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuXHRcdFx0c2V0VGltZW91dChmaXJlT25jZSwgMSk7IC8vIGFzeW5jXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmaXJlT25jZSwgZmFsc2UpO1xuXG5cdFx0XHQvLyBGYWxsYmFja1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmaXJlT25jZSwgZmFsc2UpO1xuXG5cdFx0fSBlbHNlIGlmIChkb2N1bWVudC5hdHRhY2hFdmVudCkge1xuXHRcdFx0Ly8gSUVcblx0XHRcdGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuZGV0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGFyZ3VtZW50cy5jYWxsZWUpO1xuXHRcdFx0XHRcdGZpcmVPbmNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblx0XHRcdC8vIEZhbGxiYWNrXG5cdFx0XHR3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZpcmVPbmNlKTtcblxuXHRcdFx0Ly8gSUU3Lzhcblx0XHRcdGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwgJiYgd2luZG93ID09IHdpbmRvdy50b3ApIHtcblx0XHRcdFx0dmFyIHRyeVNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZiAoIWRvY3VtZW50LmJvZHkpIHsgcmV0dXJuOyB9XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbCgnbGVmdCcpO1xuXHRcdFx0XHRcdFx0ZmlyZU9uY2UoKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRzZXRUaW1lb3V0KHRyeVNjcm9sbCwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0XHR0cnlTY3JvbGwoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHR3YXJuIDogZnVuY3Rpb24gKG1zZykge1xuXHRcdGlmICh3aW5kb3cuY29uc29sZSAmJiB3aW5kb3cuY29uc29sZS53YXJuKSB7XG5cdFx0XHR3aW5kb3cuY29uc29sZS53YXJuKG1zZyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0cHJldmVudERlZmF1bHQgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmIChlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuXHRcdGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0fSxcblxuXG5cdGNhcHR1cmVUYXJnZXQgOiBmdW5jdGlvbiAodGFyZ2V0KSB7XG5cdFx0Ly8gSUVcblx0XHRpZiAodGFyZ2V0LnNldENhcHR1cmUpIHtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQgPSB0YXJnZXQ7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0LnNldENhcHR1cmUoKTtcblx0XHR9XG5cdH0sXG5cblxuXHRyZWxlYXNlVGFyZ2V0IDogZnVuY3Rpb24gKCkge1xuXHRcdC8vIElFXG5cdFx0aWYgKGpzYy5fY2FwdHVyZWRUYXJnZXQpIHtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQucmVsZWFzZUNhcHR1cmUoKTtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQgPSBudWxsO1xuXHRcdH1cblx0fSxcblxuXG5cdGZpcmVFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCkge1xuXHRcdGlmICghZWwpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG5cdFx0XHR2YXIgZXYgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnSFRNTEV2ZW50cycpO1xuXHRcdFx0ZXYuaW5pdEV2ZW50KGV2bnQsIHRydWUsIHRydWUpO1xuXHRcdFx0ZWwuZGlzcGF0Y2hFdmVudChldik7XG5cdFx0fSBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuXHRcdFx0dmFyIGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcblx0XHRcdGVsLmZpcmVFdmVudCgnb24nICsgZXZudCwgZXYpO1xuXHRcdH0gZWxzZSBpZiAoZWxbJ29uJyArIGV2bnRdKSB7IC8vIGFsdGVybmF0aXZlbHkgdXNlIHRoZSB0cmFkaXRpb25hbCBldmVudCBtb2RlbFxuXHRcdFx0ZWxbJ29uJyArIGV2bnRdKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Y2xhc3NOYW1lVG9MaXN0IDogZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuXHRcdHJldHVybiBjbGFzc05hbWUucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpLnNwbGl0KC9cXHMrLyk7XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gb25seSBjb250YWluIGEgc2luZ2xlIGNsYXNzIG5hbWVcblx0aGFzQ2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHRpZiAoIWNsYXNzTmFtZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gLTEgIT0gKCcgJyArIGVsbS5jbGFzc05hbWUucmVwbGFjZSgvXFxzKy9nLCAnICcpICsgJyAnKS5pbmRleE9mKCcgJyArIGNsYXNzTmFtZSArICcgJyk7XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gY29udGFpbiBtdWx0aXBsZSBjbGFzcyBuYW1lcyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZVxuXHRzZXRDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdHZhciBjbGFzc0xpc3QgPSBqc2MuY2xhc3NOYW1lVG9MaXN0KGNsYXNzTmFtZSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGlmICghanNjLmhhc0NsYXNzKGVsbSwgY2xhc3NMaXN0W2ldKSkge1xuXHRcdFx0XHRlbG0uY2xhc3NOYW1lICs9IChlbG0uY2xhc3NOYW1lID8gJyAnIDogJycpICsgY2xhc3NMaXN0W2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBjb250YWluIG11bHRpcGxlIGNsYXNzIG5hbWVzIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlXG5cdHVuc2V0Q2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgY2xhc3NMaXN0ID0ganNjLmNsYXNzTmFtZVRvTGlzdChjbGFzc05hbWUpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHR2YXIgcmVwbCA9IG5ldyBSZWdFeHAoXG5cdFx0XHRcdCdeXFxcXHMqJyArIGNsYXNzTGlzdFtpXSArICdcXFxccyp8JyArXG5cdFx0XHRcdCdcXFxccyonICsgY2xhc3NMaXN0W2ldICsgJ1xcXFxzKiR8JyArXG5cdFx0XHRcdCdcXFxccysnICsgY2xhc3NMaXN0W2ldICsgJyhcXFxccyspJyxcblx0XHRcdFx0J2cnXG5cdFx0XHQpO1xuXHRcdFx0ZWxtLmNsYXNzTmFtZSA9IGVsbS5jbGFzc05hbWUucmVwbGFjZShyZXBsLCAnJDEnKTtcblx0XHR9XG5cdH0sXG5cblxuXHRnZXRTdHlsZSA6IGZ1bmN0aW9uIChlbG0pIHtcblx0XHRyZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbG0pIDogZWxtLmN1cnJlbnRTdHlsZTtcblx0fSxcblxuXG5cdHNldFN0eWxlIDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaGVscGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0dmFyIGdldFN1cHBvcnRlZFByb3AgPSBmdW5jdGlvbiAobmFtZXMpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0aWYgKG5hbWVzW2ldIGluIGhlbHBlci5zdHlsZSkge1xuXHRcdFx0XHRcdHJldHVybiBuYW1lc1tpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIHByb3BzID0ge1xuXHRcdFx0Ym9yZGVyUmFkaXVzOiBnZXRTdXBwb3J0ZWRQcm9wKFsnYm9yZGVyUmFkaXVzJywgJ01vekJvcmRlclJhZGl1cycsICd3ZWJraXRCb3JkZXJSYWRpdXMnXSksXG5cdFx0XHRib3hTaGFkb3c6IGdldFN1cHBvcnRlZFByb3AoWydib3hTaGFkb3cnLCAnTW96Qm94U2hhZG93JywgJ3dlYmtpdEJveFNoYWRvdyddKVxuXHRcdH07XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlbG0sIHByb3AsIHZhbHVlKSB7XG5cdFx0XHRzd2l0Y2ggKHByb3AudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0Y2FzZSAnb3BhY2l0eSc6XG5cdFx0XHRcdHZhciBhbHBoYU9wYWNpdHkgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQodmFsdWUpICogMTAwKTtcblx0XHRcdFx0ZWxtLnN0eWxlLm9wYWNpdHkgPSB2YWx1ZTtcblx0XHRcdFx0ZWxtLnN0eWxlLmZpbHRlciA9ICdhbHBoYShvcGFjaXR5PScgKyBhbHBoYU9wYWNpdHkgKyAnKSc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0ZWxtLnN0eWxlW3Byb3BzW3Byb3BdXSA9IHZhbHVlO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9O1xuXHR9KSgpLFxuXG5cblx0c2V0Qm9yZGVyUmFkaXVzIDogZnVuY3Rpb24gKGVsbSwgdmFsdWUpIHtcblx0XHRqc2Muc2V0U3R5bGUoZWxtLCAnYm9yZGVyUmFkaXVzJywgdmFsdWUgfHwgJzAnKTtcblx0fSxcblxuXG5cdHNldEJveFNoYWRvdyA6IGZ1bmN0aW9uIChlbG0sIHZhbHVlKSB7XG5cdFx0anNjLnNldFN0eWxlKGVsbSwgJ2JveFNoYWRvdycsIHZhbHVlIHx8ICdub25lJyk7XG5cdH0sXG5cblxuXHRnZXRFbGVtZW50UG9zIDogZnVuY3Rpb24gKGUsIHJlbGF0aXZlVG9WaWV3cG9ydCkge1xuXHRcdHZhciB4PTAsIHk9MDtcblx0XHR2YXIgcmVjdCA9IGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0eCA9IHJlY3QubGVmdDtcblx0XHR5ID0gcmVjdC50b3A7XG5cdFx0aWYgKCFyZWxhdGl2ZVRvVmlld3BvcnQpIHtcblx0XHRcdHZhciB2aWV3UG9zID0ganNjLmdldFZpZXdQb3MoKTtcblx0XHRcdHggKz0gdmlld1Bvc1swXTtcblx0XHRcdHkgKz0gdmlld1Bvc1sxXTtcblx0XHR9XG5cdFx0cmV0dXJuIFt4LCB5XTtcblx0fSxcblxuXG5cdGdldEVsZW1lbnRTaXplIDogZnVuY3Rpb24gKGUpIHtcblx0XHRyZXR1cm4gW2Uub2Zmc2V0V2lkdGgsIGUub2Zmc2V0SGVpZ2h0XTtcblx0fSxcblxuXG5cdC8vIGdldCBwb2ludGVyJ3MgWC9ZIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHZpZXdwb3J0XG5cdGdldEFic1BvaW50ZXJQb3MgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHggPSAwLCB5ID0gMDtcblx0XHRpZiAodHlwZW9mIGUuY2hhbmdlZFRvdWNoZXMgIT09ICd1bmRlZmluZWQnICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG5cdFx0XHQvLyB0b3VjaCBkZXZpY2VzXG5cdFx0XHR4ID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0eSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBlLmNsaWVudFggPT09ICdudW1iZXInKSB7XG5cdFx0XHR4ID0gZS5jbGllbnRYO1xuXHRcdFx0eSA9IGUuY2xpZW50WTtcblx0XHR9XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSB9O1xuXHR9LFxuXG5cblx0Ly8gZ2V0IHBvaW50ZXIncyBYL1kgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdGFyZ2V0IGVsZW1lbnRcblx0Z2V0UmVsUG9pbnRlclBvcyA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXHRcdHZhciB0YXJnZXRSZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0dmFyIHggPSAwLCB5ID0gMDtcblxuXHRcdHZhciBjbGllbnRYID0gMCwgY2xpZW50WSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBlLmNoYW5nZWRUb3VjaGVzICE9PSAndW5kZWZpbmVkJyAmJiBlLmNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuXHRcdFx0Ly8gdG91Y2ggZGV2aWNlc1xuXHRcdFx0Y2xpZW50WCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdGNsaWVudFkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZS5jbGllbnRYID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y2xpZW50WCA9IGUuY2xpZW50WDtcblx0XHRcdGNsaWVudFkgPSBlLmNsaWVudFk7XG5cdFx0fVxuXG5cdFx0eCA9IGNsaWVudFggLSB0YXJnZXRSZWN0LmxlZnQ7XG5cdFx0eSA9IGNsaWVudFkgLSB0YXJnZXRSZWN0LnRvcDtcblx0XHRyZXR1cm4geyB4OiB4LCB5OiB5IH07XG5cdH0sXG5cblxuXHRnZXRWaWV3UG9zIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkb2MgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdFx0cmV0dXJuIFtcblx0XHRcdCh3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jLnNjcm9sbExlZnQpIC0gKGRvYy5jbGllbnRMZWZ0IHx8IDApLFxuXHRcdFx0KHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2Muc2Nyb2xsVG9wKSAtIChkb2MuY2xpZW50VG9wIHx8IDApXG5cdFx0XTtcblx0fSxcblxuXG5cdGdldFZpZXdTaXplIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkb2MgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdFx0cmV0dXJuIFtcblx0XHRcdCh3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2MuY2xpZW50V2lkdGgpLFxuXHRcdFx0KHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2MuY2xpZW50SGVpZ2h0KSxcblx0XHRdO1xuXHR9LFxuXG5cblx0cmVkcmF3UG9zaXRpb24gOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHR2YXIgdGhpc09iaiA9IGpzYy5waWNrZXIub3duZXI7XG5cblx0XHRcdHZhciB0cCwgdnA7XG5cblx0XHRcdGlmICh0aGlzT2JqLmZpeGVkKSB7XG5cdFx0XHRcdC8vIEZpeGVkIGVsZW1lbnRzIGFyZSBwb3NpdGlvbmVkIHJlbGF0aXZlIHRvIHZpZXdwb3J0LFxuXHRcdFx0XHQvLyB0aGVyZWZvcmUgd2UgY2FuIGlnbm9yZSB0aGUgc2Nyb2xsIG9mZnNldFxuXHRcdFx0XHR0cCA9IGpzYy5nZXRFbGVtZW50UG9zKHRoaXNPYmoudGFyZ2V0RWxlbWVudCwgdHJ1ZSk7IC8vIHRhcmdldCBwb3Ncblx0XHRcdFx0dnAgPSBbMCwgMF07IC8vIHZpZXcgcG9zXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0cCA9IGpzYy5nZXRFbGVtZW50UG9zKHRoaXNPYmoudGFyZ2V0RWxlbWVudCk7IC8vIHRhcmdldCBwb3Ncblx0XHRcdFx0dnAgPSBqc2MuZ2V0Vmlld1BvcygpOyAvLyB2aWV3IHBvc1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgdHMgPSBqc2MuZ2V0RWxlbWVudFNpemUodGhpc09iai50YXJnZXRFbGVtZW50KTsgLy8gdGFyZ2V0IHNpemVcblx0XHRcdHZhciB2cyA9IGpzYy5nZXRWaWV3U2l6ZSgpOyAvLyB2aWV3IHNpemVcblx0XHRcdHZhciBwcyA9IGpzYy5nZXRQaWNrZXJPdXRlckRpbXModGhpc09iaik7IC8vIHBpY2tlciBzaXplXG5cdFx0XHR2YXIgYSwgYiwgYztcblx0XHRcdHN3aXRjaCAodGhpc09iai5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ2xlZnQnOiBhPTE7IGI9MDsgYz0tMTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3JpZ2h0JzphPTE7IGI9MDsgYz0xOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndG9wJzogIGE9MDsgYj0xOyBjPS0xOyBicmVhaztcblx0XHRcdFx0ZGVmYXVsdDogICAgIGE9MDsgYj0xOyBjPTE7IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGwgPSAodHNbYl0rcHNbYl0pLzI7XG5cblx0XHRcdC8vIGNvbXB1dGUgcGlja2VyIHBvc2l0aW9uXG5cdFx0XHRpZiAoIXRoaXNPYmouc21hcnRQb3NpdGlvbikge1xuXHRcdFx0XHR2YXIgcHAgPSBbXG5cdFx0XHRcdFx0dHBbYV0sXG5cdFx0XHRcdFx0dHBbYl0rdHNbYl0tbCtsKmNcblx0XHRcdFx0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBwcCA9IFtcblx0XHRcdFx0XHQtdnBbYV0rdHBbYV0rcHNbYV0gPiB2c1thXSA/XG5cdFx0XHRcdFx0XHQoLXZwW2FdK3RwW2FdK3RzW2FdLzIgPiB2c1thXS8yICYmIHRwW2FdK3RzW2FdLXBzW2FdID49IDAgPyB0cFthXSt0c1thXS1wc1thXSA6IHRwW2FdKSA6XG5cdFx0XHRcdFx0XHR0cFthXSxcblx0XHRcdFx0XHQtdnBbYl0rdHBbYl0rdHNbYl0rcHNbYl0tbCtsKmMgPiB2c1tiXSA/XG5cdFx0XHRcdFx0XHQoLXZwW2JdK3RwW2JdK3RzW2JdLzIgPiB2c1tiXS8yICYmIHRwW2JdK3RzW2JdLWwtbCpjID49IDAgPyB0cFtiXSt0c1tiXS1sLWwqYyA6IHRwW2JdK3RzW2JdLWwrbCpjKSA6XG5cdFx0XHRcdFx0XHQodHBbYl0rdHNbYl0tbCtsKmMgPj0gMCA/IHRwW2JdK3RzW2JdLWwrbCpjIDogdHBbYl0rdHNbYl0tbC1sKmMpXG5cdFx0XHRcdF07XG5cdFx0XHR9XG5cblx0XHRcdHZhciB4ID0gcHBbYV07XG5cdFx0XHR2YXIgeSA9IHBwW2JdO1xuXHRcdFx0dmFyIHBvc2l0aW9uVmFsdWUgPSB0aGlzT2JqLmZpeGVkID8gJ2ZpeGVkJyA6ICdhYnNvbHV0ZSc7XG5cdFx0XHR2YXIgY29udHJhY3RTaGFkb3cgPVxuXHRcdFx0XHQocHBbMF0gKyBwc1swXSA+IHRwWzBdIHx8IHBwWzBdIDwgdHBbMF0gKyB0c1swXSkgJiZcblx0XHRcdFx0KHBwWzFdICsgcHNbMV0gPCB0cFsxXSArIHRzWzFdKTtcblxuXHRcdFx0anNjLl9kcmF3UG9zaXRpb24odGhpc09iaiwgeCwgeSwgcG9zaXRpb25WYWx1ZSwgY29udHJhY3RTaGFkb3cpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9kcmF3UG9zaXRpb24gOiBmdW5jdGlvbiAodGhpc09iaiwgeCwgeSwgcG9zaXRpb25WYWx1ZSwgY29udHJhY3RTaGFkb3cpIHtcblx0XHR2YXIgdlNoYWRvdyA9IGNvbnRyYWN0U2hhZG93ID8gMCA6IHRoaXNPYmouc2hhZG93Qmx1cjsgLy8gcHhcblxuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS5wb3NpdGlvbiA9IHBvc2l0aW9uVmFsdWU7XG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLmxlZnQgPSB4ICsgJ3B4Jztcblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUudG9wID0geSArICdweCc7XG5cblx0XHRqc2Muc2V0Qm94U2hhZG93KFxuXHRcdFx0anNjLnBpY2tlci5ib3hTLFxuXHRcdFx0dGhpc09iai5zaGFkb3cgP1xuXHRcdFx0XHRuZXcganNjLkJveFNoYWRvdygwLCB2U2hhZG93LCB0aGlzT2JqLnNoYWRvd0JsdXIsIDAsIHRoaXNPYmouc2hhZG93Q29sb3IpIDpcblx0XHRcdFx0bnVsbCk7XG5cdH0sXG5cblxuXHRnZXRQaWNrZXJEaW1zIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHR2YXIgZGlzcGxheVNsaWRlciA9ICEhanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKTtcblx0XHR2YXIgZGltcyA9IFtcblx0XHRcdDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyAyICogdGhpc09iai5wYWRkaW5nICsgdGhpc09iai53aWR0aCArXG5cdFx0XHRcdChkaXNwbGF5U2xpZGVyID8gMiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIGpzYy5nZXRQYWRUb1NsaWRlclBhZGRpbmcodGhpc09iaikgKyB0aGlzT2JqLnNsaWRlclNpemUgOiAwKSxcblx0XHRcdDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyAyICogdGhpc09iai5wYWRkaW5nICsgdGhpc09iai5oZWlnaHQgK1xuXHRcdFx0XHQodGhpc09iai5jbG9zYWJsZSA/IDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLmJ1dHRvbkhlaWdodCA6IDApXG5cdFx0XTtcblx0XHRyZXR1cm4gZGltcztcblx0fSxcblxuXG5cdGdldFBpY2tlck91dGVyRGltcyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0dmFyIGRpbXMgPSBqc2MuZ2V0UGlja2VyRGltcyh0aGlzT2JqKTtcblx0XHRyZXR1cm4gW1xuXHRcdFx0ZGltc1swXSArIDIgKiB0aGlzT2JqLmJvcmRlcldpZHRoLFxuXHRcdFx0ZGltc1sxXSArIDIgKiB0aGlzT2JqLmJvcmRlcldpZHRoXG5cdFx0XTtcblx0fSxcblxuXG5cdGdldFBhZFRvU2xpZGVyUGFkZGluZyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0cmV0dXJuIE1hdGgubWF4KHRoaXNPYmoucGFkZGluZywgMS41ICogKDIgKiB0aGlzT2JqLnBvaW50ZXJCb3JkZXJXaWR0aCArIHRoaXNPYmoucG9pbnRlclRoaWNrbmVzcykpO1xuXHR9LFxuXG5cblx0Z2V0UGFkWUNvbXBvbmVudCA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0c3dpdGNoICh0aGlzT2JqLm1vZGUuY2hhckF0KDEpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdGNhc2UgJ3YnOiByZXR1cm4gJ3YnOyBicmVhaztcblx0XHR9XG5cdFx0cmV0dXJuICdzJztcblx0fSxcblxuXG5cdGdldFNsaWRlckNvbXBvbmVudCA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoubW9kZS5sZW5ndGggPiAyKSB7XG5cdFx0XHRzd2l0Y2ggKHRoaXNPYmoubW9kZS5jaGFyQXQoMikudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzogcmV0dXJuICdzJzsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOiByZXR1cm4gJ3YnOyBicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50TW91c2VEb3duIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cblx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZSkge1xuXHRcdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvd09uQ2xpY2spIHtcblx0XHRcdFx0dGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93KCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXQuX2pzY0NvbnRyb2xOYW1lKSB7XG5cdFx0XHRqc2Mub25Db250cm9sUG9pbnRlclN0YXJ0KGUsIHRhcmdldCwgdGFyZ2V0Ll9qc2NDb250cm9sTmFtZSwgJ21vdXNlJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIE1vdXNlIGlzIG91dHNpZGUgdGhlIHBpY2tlciBjb250cm9scyAtPiBoaWRlIHRoZSBjb2xvciBwaWNrZXIhXG5cdFx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uRG9jdW1lbnRUb3VjaFN0YXJ0IDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cblx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZSkge1xuXHRcdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvd09uQ2xpY2spIHtcblx0XHRcdFx0dGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93KCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXQuX2pzY0NvbnRyb2xOYW1lKSB7XG5cdFx0XHRqc2Mub25Db250cm9sUG9pbnRlclN0YXJ0KGUsIHRhcmdldCwgdGFyZ2V0Ll9qc2NDb250cm9sTmFtZSwgJ3RvdWNoJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlci5vd25lci5oaWRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25XaW5kb3dSZXNpemUgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGpzYy5yZWRyYXdQb3NpdGlvbigpO1xuXHR9LFxuXG5cblx0b25QYXJlbnRTY3JvbGwgOiBmdW5jdGlvbiAoZSkge1xuXHRcdC8vIGhpZGUgdGhlIHBpY2tlciB3aGVuIG9uZSBvZiB0aGUgcGFyZW50IGVsZW1lbnRzIGlzIHNjcm9sbGVkXG5cdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0anNjLnBpY2tlci5vd25lci5oaWRlKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0X3BvaW50ZXJNb3ZlRXZlbnQgOiB7XG5cdFx0bW91c2U6ICdtb3VzZW1vdmUnLFxuXHRcdHRvdWNoOiAndG91Y2htb3ZlJ1xuXHR9LFxuXHRfcG9pbnRlckVuZEV2ZW50IDoge1xuXHRcdG1vdXNlOiAnbW91c2V1cCcsXG5cdFx0dG91Y2g6ICd0b3VjaGVuZCdcblx0fSxcblxuXG5cdF9wb2ludGVyT3JpZ2luIDogbnVsbCxcblx0X2NhcHR1cmVkVGFyZ2V0IDogbnVsbCxcblxuXG5cdG9uQ29udHJvbFBvaW50ZXJTdGFydCA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkge1xuXHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblxuXHRcdGpzYy5wcmV2ZW50RGVmYXVsdChlKTtcblx0XHRqc2MuY2FwdHVyZVRhcmdldCh0YXJnZXQpO1xuXG5cdFx0dmFyIHJlZ2lzdGVyRHJhZ0V2ZW50cyA9IGZ1bmN0aW9uIChkb2MsIG9mZnNldCkge1xuXHRcdFx0anNjLmF0dGFjaEdyb3VwRXZlbnQoJ2RyYWcnLCBkb2MsIGpzYy5fcG9pbnRlck1vdmVFdmVudFtwb2ludGVyVHlwZV0sXG5cdFx0XHRcdGpzYy5vbkRvY3VtZW50UG9pbnRlck1vdmUoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUsIG9mZnNldCkpO1xuXHRcdFx0anNjLmF0dGFjaEdyb3VwRXZlbnQoJ2RyYWcnLCBkb2MsIGpzYy5fcG9pbnRlckVuZEV2ZW50W3BvaW50ZXJUeXBlXSxcblx0XHRcdFx0anNjLm9uRG9jdW1lbnRQb2ludGVyRW5kKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlKSk7XG5cdFx0fTtcblxuXHRcdHJlZ2lzdGVyRHJhZ0V2ZW50cyhkb2N1bWVudCwgWzAsIDBdKTtcblxuXHRcdGlmICh3aW5kb3cucGFyZW50ICYmIHdpbmRvdy5mcmFtZUVsZW1lbnQpIHtcblx0XHRcdHZhciByZWN0ID0gd2luZG93LmZyYW1lRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdHZhciBvZnMgPSBbLXJlY3QubGVmdCwgLXJlY3QudG9wXTtcblx0XHRcdHJlZ2lzdGVyRHJhZ0V2ZW50cyh3aW5kb3cucGFyZW50LndpbmRvdy5kb2N1bWVudCwgb2ZzKTtcblx0XHR9XG5cblx0XHR2YXIgYWJzID0ganNjLmdldEFic1BvaW50ZXJQb3MoZSk7XG5cdFx0dmFyIHJlbCA9IGpzYy5nZXRSZWxQb2ludGVyUG9zKGUpO1xuXHRcdGpzYy5fcG9pbnRlck9yaWdpbiA9IHtcblx0XHRcdHg6IGFicy54IC0gcmVsLngsXG5cdFx0XHR5OiBhYnMueSAtIHJlbC55XG5cdFx0fTtcblxuXHRcdHN3aXRjaCAoY29udHJvbE5hbWUpIHtcblx0XHRjYXNlICdwYWQnOlxuXHRcdFx0Ly8gaWYgdGhlIHNsaWRlciBpcyBhdCB0aGUgYm90dG9tLCBtb3ZlIGl0IHVwXG5cdFx0XHRzd2l0Y2ggKGpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRcdGNhc2UgJ3MnOiBpZiAodGhpc09iai5oc3ZbMV0gPT09IDApIHsgdGhpc09iai5mcm9tSFNWKG51bGwsIDEwMCwgbnVsbCk7IH07IGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6IGlmICh0aGlzT2JqLmhzdlsyXSA9PT0gMCkgeyB0aGlzT2JqLmZyb21IU1YobnVsbCwgbnVsbCwgMTAwKTsgfTsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRqc2Muc2V0UGFkKHRoaXNPYmosIGUsIDAsIDApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdzbGQnOlxuXHRcdFx0anNjLnNldFNsZCh0aGlzT2JqLCBlLCAwKTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UodGhpc09iaik7XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50UG9pbnRlck1vdmUgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUsIG9mZnNldCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXHRcdFx0c3dpdGNoIChjb250cm9sTmFtZSkge1xuXHRcdFx0Y2FzZSAncGFkJzpcblx0XHRcdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHRcdFx0anNjLnNldFBhZCh0aGlzT2JqLCBlLCBvZmZzZXRbMF0sIG9mZnNldFsxXSk7XG5cdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UodGhpc09iaik7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlICdzbGQnOlxuXHRcdFx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdFx0XHRqc2Muc2V0U2xkKHRoaXNPYmosIGUsIG9mZnNldFsxXSk7XG5cdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UodGhpc09iaik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uRG9jdW1lbnRQb2ludGVyRW5kIDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cdFx0XHRqc2MuZGV0YWNoR3JvdXBFdmVudHMoJ2RyYWcnKTtcblx0XHRcdGpzYy5yZWxlYXNlVGFyZ2V0KCk7XG5cdFx0XHQvLyBBbHdheXMgZGlzcGF0Y2ggY2hhbmdlcyBhZnRlciBkZXRhY2hpbmcgb3V0c3RhbmRpbmcgbW91c2UgaGFuZGxlcnMsXG5cdFx0XHQvLyBpbiBjYXNlIHNvbWUgdXNlciBpbnRlcmFjdGlvbiB3aWxsIG9jY3VyIGluIHVzZXIncyBvbmNoYW5nZSBjYWxsYmFja1xuXHRcdFx0Ly8gdGhhdCB3b3VsZCBpbnRydWRlIHdpdGggY3VycmVudCBtb3VzZSBldmVudHNcblx0XHRcdGpzYy5kaXNwYXRjaENoYW5nZSh0aGlzT2JqKTtcblx0XHR9O1xuXHR9LFxuXG5cblx0ZGlzcGF0Y2hDaGFuZ2UgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXNPYmoudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRqc2MuZmlyZUV2ZW50KHRoaXNPYmoudmFsdWVFbGVtZW50LCAnY2hhbmdlJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0ZGlzcGF0Y2hGaW5lQ2hhbmdlIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai5vbkZpbmVDaGFuZ2UpIHtcblx0XHRcdHZhciBjYWxsYmFjaztcblx0XHRcdGlmICh0eXBlb2YgdGhpc09iai5vbkZpbmVDaGFuZ2UgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gbmV3IEZ1bmN0aW9uICh0aGlzT2JqLm9uRmluZUNoYW5nZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjYWxsYmFjayA9IHRoaXNPYmoub25GaW5lQ2hhbmdlO1xuXHRcdFx0fVxuXHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzT2JqKTtcblx0XHR9XG5cdH0sXG5cblxuXHRzZXRQYWQgOiBmdW5jdGlvbiAodGhpc09iaiwgZSwgb2ZzWCwgb2ZzWSkge1xuXHRcdHZhciBwb2ludGVyQWJzID0ganNjLmdldEFic1BvaW50ZXJQb3MoZSk7XG5cdFx0dmFyIHggPSBvZnNYICsgcG9pbnRlckFicy54IC0ganNjLl9wb2ludGVyT3JpZ2luLnggLSB0aGlzT2JqLnBhZGRpbmcgLSB0aGlzT2JqLmluc2V0V2lkdGg7XG5cdFx0dmFyIHkgPSBvZnNZICsgcG9pbnRlckFicy55IC0ganNjLl9wb2ludGVyT3JpZ2luLnkgLSB0aGlzT2JqLnBhZGRpbmcgLSB0aGlzT2JqLmluc2V0V2lkdGg7XG5cblx0XHR2YXIgeFZhbCA9IHggKiAoMzYwIC8gKHRoaXNPYmoud2lkdGggLSAxKSk7XG5cdFx0dmFyIHlWYWwgPSAxMDAgLSAoeSAqICgxMDAgLyAodGhpc09iai5oZWlnaHQgLSAxKSkpO1xuXG5cdFx0c3dpdGNoIChqc2MuZ2V0UGFkWUNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdGNhc2UgJ3MnOiB0aGlzT2JqLmZyb21IU1YoeFZhbCwgeVZhbCwgbnVsbCwganNjLmxlYXZlU2xkKTsgYnJlYWs7XG5cdFx0Y2FzZSAndic6IHRoaXNPYmouZnJvbUhTVih4VmFsLCBudWxsLCB5VmFsLCBqc2MubGVhdmVTbGQpOyBicmVhaztcblx0XHR9XG5cdH0sXG5cblxuXHRzZXRTbGQgOiBmdW5jdGlvbiAodGhpc09iaiwgZSwgb2ZzWSkge1xuXHRcdHZhciBwb2ludGVyQWJzID0ganNjLmdldEFic1BvaW50ZXJQb3MoZSk7XG5cdFx0dmFyIHkgPSBvZnNZICsgcG9pbnRlckFicy55IC0ganNjLl9wb2ludGVyT3JpZ2luLnkgLSB0aGlzT2JqLnBhZGRpbmcgLSB0aGlzT2JqLmluc2V0V2lkdGg7XG5cblx0XHR2YXIgeVZhbCA9IDEwMCAtICh5ICogKDEwMCAvICh0aGlzT2JqLmhlaWdodCAtIDEpKSk7XG5cblx0XHRzd2l0Y2ggKGpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRjYXNlICdzJzogdGhpc09iai5mcm9tSFNWKG51bGwsIHlWYWwsIG51bGwsIGpzYy5sZWF2ZVBhZCk7IGJyZWFrO1xuXHRcdGNhc2UgJ3YnOiB0aGlzT2JqLmZyb21IU1YobnVsbCwgbnVsbCwgeVZhbCwganNjLmxlYXZlUGFkKTsgYnJlYWs7XG5cdFx0fVxuXHR9LFxuXG5cblx0X3ZtbE5TIDogJ2pzY192bWxfJyxcblx0X3ZtbENTUyA6ICdqc2Nfdm1sX2Nzc18nLFxuXHRfdm1sUmVhZHkgOiBmYWxzZSxcblxuXG5cdGluaXRWTUwgOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCFqc2MuX3ZtbFJlYWR5KSB7XG5cdFx0XHQvLyBpbml0IFZNTCBuYW1lc3BhY2Vcblx0XHRcdHZhciBkb2MgPSBkb2N1bWVudDtcblx0XHRcdGlmICghZG9jLm5hbWVzcGFjZXNbanNjLl92bWxOU10pIHtcblx0XHRcdFx0ZG9jLm5hbWVzcGFjZXMuYWRkKGpzYy5fdm1sTlMsICd1cm46c2NoZW1hcy1taWNyb3NvZnQtY29tOnZtbCcpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFkb2Muc3R5bGVTaGVldHNbanNjLl92bWxDU1NdKSB7XG5cdFx0XHRcdHZhciB0YWdzID0gWydzaGFwZScsICdzaGFwZXR5cGUnLCAnZ3JvdXAnLCAnYmFja2dyb3VuZCcsICdwYXRoJywgJ2Zvcm11bGFzJywgJ2hhbmRsZXMnLCAnZmlsbCcsICdzdHJva2UnLCAnc2hhZG93JywgJ3RleHRib3gnLCAndGV4dHBhdGgnLCAnaW1hZ2VkYXRhJywgJ2xpbmUnLCAncG9seWxpbmUnLCAnY3VydmUnLCAncmVjdCcsICdyb3VuZHJlY3QnLCAnb3ZhbCcsICdhcmMnLCAnaW1hZ2UnXTtcblx0XHRcdFx0dmFyIHNzID0gZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKTtcblx0XHRcdFx0c3Mub3duaW5nRWxlbWVudC5pZCA9IGpzYy5fdm1sQ1NTO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRzcy5hZGRSdWxlKGpzYy5fdm1sTlMgKyAnXFxcXDonICsgdGFnc1tpXSwgJ2JlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpOycpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRqc2MuX3ZtbFJlYWR5ID0gdHJ1ZTtcblx0XHR9XG5cdH0sXG5cblxuXHRjcmVhdGVQYWxldHRlIDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHBhbGV0dGVPYmogPSB7XG5cdFx0XHRlbG06IG51bGwsXG5cdFx0XHRkcmF3OiBudWxsXG5cdFx0fTtcblxuXHRcdGlmIChqc2MuaXNDYW52YXNTdXBwb3J0ZWQpIHtcblx0XHRcdC8vIENhbnZhcyBpbXBsZW1lbnRhdGlvbiBmb3IgbW9kZXJuIGJyb3dzZXJzXG5cblx0XHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIHR5cGUpIHtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cblx0XHRcdFx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciBoR3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCBjYW52YXMud2lkdGgsIDApO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMCAvIDYsICcjRjAwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgxIC8gNiwgJyNGRjAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDIgLyA2LCAnIzBGMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMyAvIDYsICcjMEZGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg0IC8gNiwgJyMwMEYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDUgLyA2LCAnI0YwRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNiAvIDYsICcjRjAwJyk7XG5cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGhHcmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgdkdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHRcdHN3aXRjaCAodHlwZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgyNTUsMjU1LDI1NSwwKScpO1xuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgyNTUsMjU1LDI1NSwxKScpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwwLDAsMCknKTtcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwwLDAsMSknKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdkdyYWQ7XG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0fTtcblxuXHRcdFx0cGFsZXR0ZU9iai5lbG0gPSBjYW52YXM7XG5cdFx0XHRwYWxldHRlT2JqLmRyYXcgPSBkcmF3RnVuYztcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBWTUwgZmFsbGJhY2sgZm9yIElFIDcgYW5kIDhcblxuXHRcdFx0anNjLmluaXRWTUwoKTtcblxuXHRcdFx0dmFyIHZtbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG5cdFx0XHR2YXIgaEdyYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOmZpbGwnKTtcblx0XHRcdGhHcmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0aEdyYWQubWV0aG9kID0gJ2xpbmVhcic7XG5cdFx0XHRoR3JhZC5hbmdsZSA9ICc5MCc7XG5cdFx0XHRoR3JhZC5jb2xvcnMgPSAnMTYuNjclICNGMEYsIDMzLjMzJSAjMDBGLCA1MCUgIzBGRiwgNjYuNjclICMwRjAsIDgzLjMzJSAjRkYwJ1xuXG5cdFx0XHR2YXIgaFJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdGhSZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdGhSZWN0LnN0eWxlLmxlZnQgPSAtMSArICdweCc7XG5cdFx0XHRoUmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHRoUmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHRoUmVjdC5hcHBlbmRDaGlsZChoR3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQoaFJlY3QpO1xuXG5cdFx0XHR2YXIgdkdyYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOmZpbGwnKTtcblx0XHRcdHZHcmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0dkdyYWQubWV0aG9kID0gJ2xpbmVhcic7XG5cdFx0XHR2R3JhZC5hbmdsZSA9ICcxODAnO1xuXHRcdFx0dkdyYWQub3BhY2l0eSA9ICcwJztcblxuXHRcdFx0dmFyIHZSZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHR2UmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHR2UmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0dlJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0dlJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0dlJlY3QuYXBwZW5kQ2hpbGQodkdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKHZSZWN0KTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIHR5cGUpIHtcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0XHRoUmVjdC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdHZSZWN0LnN0eWxlLndpZHRoID1cblx0XHRcdFx0XHQod2lkdGggKyAxKSArICdweCc7XG5cdFx0XHRcdGhSZWN0LnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdHZSZWN0LnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdFx0KGhlaWdodCArIDEpICsgJ3B4JztcblxuXHRcdFx0XHQvLyBDb2xvcnMgbXVzdCBiZSBzcGVjaWZpZWQgZHVyaW5nIGV2ZXJ5IHJlZHJhdywgb3RoZXJ3aXNlIElFIHdvbid0IGRpc3BsYXlcblx0XHRcdFx0Ly8gYSBmdWxsIGdyYWRpZW50IGR1cmluZyBhIHN1YnNlcXVlbnRpYWwgcmVkcmF3XG5cdFx0XHRcdGhHcmFkLmNvbG9yID0gJyNGMDAnO1xuXHRcdFx0XHRoR3JhZC5jb2xvcjIgPSAnI0YwMCc7XG5cblx0XHRcdFx0c3dpdGNoICh0eXBlLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdFx0dkdyYWQuY29sb3IgPSB2R3JhZC5jb2xvcjIgPSAnI0ZGRic7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHRcdHZHcmFkLmNvbG9yID0gdkdyYWQuY29sb3IyID0gJyMwMDAnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHRwYWxldHRlT2JqLmVsbSA9IHZtbENvbnRhaW5lcjtcblx0XHRcdHBhbGV0dGVPYmouZHJhdyA9IGRyYXdGdW5jO1xuXHRcdH1cblxuXHRcdHJldHVybiBwYWxldHRlT2JqO1xuXHR9LFxuXG5cblx0Y3JlYXRlU2xpZGVyR3JhZGllbnQgOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgc2xpZGVyT2JqID0ge1xuXHRcdFx0ZWxtOiBudWxsLFxuXHRcdFx0ZHJhdzogbnVsbFxuXHRcdH07XG5cblx0XHRpZiAoanNjLmlzQ2FudmFzU3VwcG9ydGVkKSB7XG5cdFx0XHQvLyBDYW52YXMgaW1wbGVtZW50YXRpb24gZm9yIG1vZGVybiBicm93c2Vyc1xuXG5cdFx0XHR2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHR2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMikge1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB3aWR0aDtcblx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuXHRcdFx0XHRjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIGdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHRcdGdyYWQuYWRkQ29sb3JTdG9wKDAsIGNvbG9yMSk7XG5cdFx0XHRcdGdyYWQuYWRkQ29sb3JTdG9wKDEsIGNvbG9yMik7XG5cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGdyYWQ7XG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0fTtcblxuXHRcdFx0c2xpZGVyT2JqLmVsbSA9IGNhbnZhcztcblx0XHRcdHNsaWRlck9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gVk1MIGZhbGxiYWNrIGZvciBJRSA3IGFuZCA4XG5cblx0XHRcdGpzYy5pbml0Vk1MKCk7XG5cblx0XHRcdHZhciB2bWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuXHRcdFx0dmFyIGdyYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOmZpbGwnKTtcblx0XHRcdGdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHRncmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0Z3JhZC5hbmdsZSA9ICcxODAnO1xuXG5cdFx0XHR2YXIgcmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0cmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRyZWN0LnN0eWxlLmxlZnQgPSAtMSArICdweCc7XG5cdFx0XHRyZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdHJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0cmVjdC5hcHBlbmRDaGlsZChncmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZChyZWN0KTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGNvbG9yMSwgY29sb3IyKSB7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4Jztcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cblx0XHRcdFx0cmVjdC5zdHlsZS53aWR0aCA9ICh3aWR0aCArIDEpICsgJ3B4Jztcblx0XHRcdFx0cmVjdC5zdHlsZS5oZWlnaHQgPSAoaGVpZ2h0ICsgMSkgKyAncHgnO1xuXG5cdFx0XHRcdGdyYWQuY29sb3IgPSBjb2xvcjE7XG5cdFx0XHRcdGdyYWQuY29sb3IyID0gY29sb3IyO1xuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0c2xpZGVyT2JqLmVsbSA9IHZtbENvbnRhaW5lcjtcblx0XHRcdHNsaWRlck9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNsaWRlck9iajtcblx0fSxcblxuXG5cdGxlYXZlVmFsdWUgOiAxPDwwLFxuXHRsZWF2ZVN0eWxlIDogMTw8MSxcblx0bGVhdmVQYWQgOiAxPDwyLFxuXHRsZWF2ZVNsZCA6IDE8PDMsXG5cblxuXHRCb3hTaGFkb3cgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBCb3hTaGFkb3cgPSBmdW5jdGlvbiAoaFNoYWRvdywgdlNoYWRvdywgYmx1ciwgc3ByZWFkLCBjb2xvciwgaW5zZXQpIHtcblx0XHRcdHRoaXMuaFNoYWRvdyA9IGhTaGFkb3c7XG5cdFx0XHR0aGlzLnZTaGFkb3cgPSB2U2hhZG93O1xuXHRcdFx0dGhpcy5ibHVyID0gYmx1cjtcblx0XHRcdHRoaXMuc3ByZWFkID0gc3ByZWFkO1xuXHRcdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdFx0dGhpcy5pbnNldCA9ICEhaW5zZXQ7XG5cdFx0fTtcblxuXHRcdEJveFNoYWRvdy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgdmFscyA9IFtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLmhTaGFkb3cpICsgJ3B4Jyxcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnZTaGFkb3cpICsgJ3B4Jyxcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLmJsdXIpICsgJ3B4Jyxcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnNwcmVhZCkgKyAncHgnLFxuXHRcdFx0XHR0aGlzLmNvbG9yXG5cdFx0XHRdO1xuXHRcdFx0aWYgKHRoaXMuaW5zZXQpIHtcblx0XHRcdFx0dmFscy5wdXNoKCdpbnNldCcpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHMuam9pbignICcpO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gQm94U2hhZG93O1xuXHR9KSgpLFxuXG5cblx0Ly9cblx0Ly8gVXNhZ2U6XG5cdC8vIHZhciBteUNvbG9yID0gbmV3IGpzY29sb3IoPHRhcmdldEVsZW1lbnQ+IFssIDxvcHRpb25zPl0pXG5cdC8vXG5cblx0anNjb2xvciA6IGZ1bmN0aW9uICh0YXJnZXRFbGVtZW50LCBvcHRpb25zKSB7XG5cblx0XHQvLyBHZW5lcmFsIG9wdGlvbnNcblx0XHQvL1xuXHRcdHRoaXMudmFsdWUgPSBudWxsOyAvLyBpbml0aWFsIEhFWCBjb2xvci4gVG8gY2hhbmdlIGl0IGxhdGVyLCB1c2UgbWV0aG9kcyBmcm9tU3RyaW5nKCksIGZyb21IU1YoKSBhbmQgZnJvbVJHQigpXG5cdFx0dGhpcy52YWx1ZUVsZW1lbnQgPSB0YXJnZXRFbGVtZW50OyAvLyBlbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRpc3BsYXkgYW5kIGlucHV0IHRoZSBjb2xvciBjb2RlXG5cdFx0dGhpcy5zdHlsZUVsZW1lbnQgPSB0YXJnZXRFbGVtZW50OyAvLyBlbGVtZW50IHRoYXQgd2lsbCBwcmV2aWV3IHRoZSBwaWNrZWQgY29sb3IgdXNpbmcgQ1NTIGJhY2tncm91bmRDb2xvclxuXHRcdHRoaXMucmVxdWlyZWQgPSB0cnVlOyAvLyB3aGV0aGVyIHRoZSBhc3NvY2lhdGVkIHRleHQgPGlucHV0PiBjYW4gYmUgbGVmdCBlbXB0eVxuXHRcdHRoaXMucmVmaW5lID0gdHJ1ZTsgLy8gd2hldGhlciB0byByZWZpbmUgdGhlIGVudGVyZWQgY29sb3IgY29kZSAoZS5nLiB1cHBlcmNhc2UgaXQgYW5kIHJlbW92ZSB3aGl0ZXNwYWNlKVxuXHRcdHRoaXMuaGFzaCA9IGZhbHNlOyAvLyB3aGV0aGVyIHRvIHByZWZpeCB0aGUgSEVYIGNvbG9yIGNvZGUgd2l0aCAjIHN5bWJvbFxuXHRcdHRoaXMudXBwZXJjYXNlID0gdHJ1ZTsgLy8gd2hldGhlciB0byB1cHBlcmNhc2UgdGhlIGNvbG9yIGNvZGVcblx0XHR0aGlzLm9uRmluZUNoYW5nZSA9IG51bGw7IC8vIGNhbGxlZCBpbnN0YW50bHkgZXZlcnkgdGltZSB0aGUgY29sb3IgY2hhbmdlcyAodmFsdWUgY2FuIGJlIGVpdGhlciBhIGZ1bmN0aW9uIG9yIGEgc3RyaW5nIHdpdGggamF2YXNjcmlwdCBjb2RlKVxuXHRcdHRoaXMuYWN0aXZlQ2xhc3MgPSAnanNjb2xvci1hY3RpdmUnOyAvLyBjbGFzcyB0byBiZSBzZXQgdG8gdGhlIHRhcmdldCBlbGVtZW50IHdoZW4gYSBwaWNrZXIgd2luZG93IGlzIG9wZW4gb24gaXRcblx0XHR0aGlzLm1pblMgPSAwOyAvLyBtaW4gYWxsb3dlZCBzYXR1cmF0aW9uICgwIC0gMTAwKVxuXHRcdHRoaXMubWF4UyA9IDEwMDsgLy8gbWF4IGFsbG93ZWQgc2F0dXJhdGlvbiAoMCAtIDEwMClcblx0XHR0aGlzLm1pblYgPSAwOyAvLyBtaW4gYWxsb3dlZCB2YWx1ZSAoYnJpZ2h0bmVzcykgKDAgLSAxMDApXG5cdFx0dGhpcy5tYXhWID0gMTAwOyAvLyBtYXggYWxsb3dlZCB2YWx1ZSAoYnJpZ2h0bmVzcykgKDAgLSAxMDApXG5cblx0XHQvLyBBY2Nlc3NpbmcgdGhlIHBpY2tlZCBjb2xvclxuXHRcdC8vXG5cdFx0dGhpcy5oc3YgPSBbMCwgMCwgMTAwXTsgLy8gcmVhZC1vbmx5ICBbMC0zNjAsIDAtMTAwLCAwLTEwMF1cblx0XHR0aGlzLnJnYiA9IFsyNTUsIDI1NSwgMjU1XTsgLy8gcmVhZC1vbmx5ICBbMC0yNTUsIDAtMjU1LCAwLTI1NV1cblxuXHRcdC8vIENvbG9yIFBpY2tlciBvcHRpb25zXG5cdFx0Ly9cblx0XHR0aGlzLndpZHRoID0gMTgxOyAvLyB3aWR0aCBvZiBjb2xvciBwYWxldHRlIChpbiBweClcblx0XHR0aGlzLmhlaWdodCA9IDEwMTsgLy8gaGVpZ2h0IG9mIGNvbG9yIHBhbGV0dGUgKGluIHB4KVxuXHRcdHRoaXMuc2hvd09uQ2xpY2sgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgdGhlIGNvbG9yIHBpY2tlciB3aGVuIHVzZXIgY2xpY2tzIG9uIGl0cyB0YXJnZXQgZWxlbWVudFxuXHRcdHRoaXMubW9kZSA9ICdIU1YnOyAvLyBIU1YgfCBIVlMgfCBIUyB8IEhWIC0gbGF5b3V0IG9mIHRoZSBjb2xvciBwaWNrZXIgY29udHJvbHNcblx0XHR0aGlzLnBvc2l0aW9uID0gJ2JvdHRvbSc7IC8vIGxlZnQgfCByaWdodCB8IHRvcCB8IGJvdHRvbSAtIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB0YXJnZXQgZWxlbWVudFxuXHRcdHRoaXMuc21hcnRQb3NpdGlvbiA9IHRydWU7IC8vIGF1dG9tYXRpY2FsbHkgY2hhbmdlIHBpY2tlciBwb3NpdGlvbiB3aGVuIHRoZXJlIGlzIG5vdCBlbm91Z2ggc3BhY2UgZm9yIGl0XG5cdFx0dGhpcy5zbGlkZXJTaXplID0gMTY7IC8vIHB4XG5cdFx0dGhpcy5jcm9zc1NpemUgPSA4OyAvLyBweFxuXHRcdHRoaXMuY2xvc2FibGUgPSBmYWxzZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBDbG9zZSBidXR0b25cblx0XHR0aGlzLmNsb3NlVGV4dCA9ICdDbG9zZSc7XG5cdFx0dGhpcy5idXR0b25Db2xvciA9ICcjMDAwMDAwJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5idXR0b25IZWlnaHQgPSAxODsgLy8gcHhcblx0XHR0aGlzLnBhZGRpbmcgPSAxMjsgLy8gcHhcblx0XHR0aGlzLmJhY2tncm91bmRDb2xvciA9ICcjRkZGRkZGJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5ib3JkZXJXaWR0aCA9IDE7IC8vIHB4XG5cdFx0dGhpcy5ib3JkZXJDb2xvciA9ICcjQkJCQkJCJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5ib3JkZXJSYWRpdXMgPSA4OyAvLyBweFxuXHRcdHRoaXMuaW5zZXRXaWR0aCA9IDE7IC8vIHB4XG5cdFx0dGhpcy5pbnNldENvbG9yID0gJyNCQkJCQkInOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLnNoYWRvdyA9IHRydWU7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSBzaGFkb3dcblx0XHR0aGlzLnNoYWRvd0JsdXIgPSAxNTsgLy8gcHhcblx0XHR0aGlzLnNoYWRvd0NvbG9yID0gJ3JnYmEoMCwwLDAsMC4yKSc7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMucG9pbnRlckNvbG9yID0gJyM0QzRDNEMnOyAvLyBweFxuXHRcdHRoaXMucG9pbnRlckJvcmRlckNvbG9yID0gJyNGRkZGRkYnOyAvLyBweFxuICAgICAgICB0aGlzLnBvaW50ZXJCb3JkZXJXaWR0aCA9IDE7IC8vIHB4XG4gICAgICAgIHRoaXMucG9pbnRlclRoaWNrbmVzcyA9IDI7IC8vIHB4XG5cdFx0dGhpcy56SW5kZXggPSAxMDAwO1xuXHRcdHRoaXMuY29udGFpbmVyID0gbnVsbDsgLy8gd2hlcmUgdG8gYXBwZW5kIHRoZSBjb2xvciBwaWNrZXIgKEJPRFkgZWxlbWVudCBieSBkZWZhdWx0KVxuXG5cblx0XHRmb3IgKHZhciBvcHQgaW4gb3B0aW9ucykge1xuXHRcdFx0aWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkob3B0KSkge1xuXHRcdFx0XHR0aGlzW29wdF0gPSBvcHRpb25zW29wdF07XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHR0aGlzLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdGRldGFjaFBpY2tlcigpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGRyYXdQaWNrZXIoKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnJlZHJhdyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0ZHJhd1BpY2tlcigpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdHRoaXMuaW1wb3J0Q29sb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIXRoaXMudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0XHRpZiAoIXRoaXMucmVmaW5lKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSwganNjLmxlYXZlVmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZEltYWdlO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZENvbG9yO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5jb2xvcjtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKGpzYy5sZWF2ZVZhbHVlIHwganNjLmxlYXZlU3R5bGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoIXRoaXMucmVxdWlyZWQgJiYgL15cXHMqJC8udGVzdCh0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnZhbHVlID0gJyc7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kSW1hZ2U7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZENvbG9yO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuY29sb3I7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKGpzYy5sZWF2ZVZhbHVlIHwganNjLmxlYXZlU3R5bGUpO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHQvLyBtYW5hZ2VkIHRvIGltcG9ydCBjb2xvciBzdWNjZXNzZnVsbHkgZnJvbSB0aGUgdmFsdWUgLT4gT0ssIGRvbid0IGRvIGFueXRoaW5nXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gbm90IGFuIGlucHV0IGVsZW1lbnQgLT4gZG9lc24ndCBoYXZlIGFueSB2YWx1ZVxuXHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdHRoaXMuZXhwb3J0Q29sb3IgPSBmdW5jdGlvbiAoZmxhZ3MpIHtcblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlVmFsdWUpICYmIHRoaXMudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IHRoaXMudG9TdHJpbmcoKTtcblx0XHRcdFx0aWYgKHRoaXMudXBwZXJjYXNlKSB7IHZhbHVlID0gdmFsdWUudG9VcHBlckNhc2UoKTsgfVxuXHRcdFx0XHRpZiAodGhpcy5oYXNoKSB7IHZhbHVlID0gJyMnICsgdmFsdWU7IH1cblxuXHRcdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVTdHlsZSkpIHtcblx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ25vbmUnO1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjJyArIHRoaXMudG9TdHJpbmcoKTtcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuaXNMaWdodCgpID8gJyMwMDAnIDogJyNGRkYnO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVBhZCkgJiYgaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdHJlZHJhd1BhZCgpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVTbGQpICYmIGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRyZWRyYXdTbGQoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHQvLyBoOiAwLTM2MFxuXHRcdC8vIHM6IDAtMTAwXG5cdFx0Ly8gdjogMC0xMDBcblx0XHQvL1xuXHRcdHRoaXMuZnJvbUhTViA9IGZ1bmN0aW9uIChoLCBzLCB2LCBmbGFncykgeyAvLyBudWxsID0gZG9uJ3QgY2hhbmdlXG5cdFx0XHRpZiAoaCAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oaCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGggPSBNYXRoLm1heCgwLCBNYXRoLm1pbigzNjAsIGgpKTtcblx0XHRcdH1cblx0XHRcdGlmIChzICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihzKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0cyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhTLCBzKSwgdGhpcy5taW5TKTtcblx0XHRcdH1cblx0XHRcdGlmICh2ICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTih2KSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0diA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhWLCB2KSwgdGhpcy5taW5WKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5yZ2IgPSBIU1ZfUkdCKFxuXHRcdFx0XHRoPT09bnVsbCA/IHRoaXMuaHN2WzBdIDogKHRoaXMuaHN2WzBdPWgpLFxuXHRcdFx0XHRzPT09bnVsbCA/IHRoaXMuaHN2WzFdIDogKHRoaXMuaHN2WzFdPXMpLFxuXHRcdFx0XHR2PT09bnVsbCA/IHRoaXMuaHN2WzJdIDogKHRoaXMuaHN2WzJdPXYpXG5cdFx0XHQpO1xuXG5cdFx0XHR0aGlzLmV4cG9ydENvbG9yKGZsYWdzKTtcblx0XHR9O1xuXG5cblx0XHQvLyByOiAwLTI1NVxuXHRcdC8vIGc6IDAtMjU1XG5cdFx0Ly8gYjogMC0yNTVcblx0XHQvL1xuXHRcdHRoaXMuZnJvbVJHQiA9IGZ1bmN0aW9uIChyLCBnLCBiLCBmbGFncykgeyAvLyBudWxsID0gZG9uJ3QgY2hhbmdlXG5cdFx0XHRpZiAociAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4ocikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIHIpKTtcblx0XHRcdH1cblx0XHRcdGlmIChnICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihnKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0ZyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgZykpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGIgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGIpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRiID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCBiKSk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBoc3YgPSBSR0JfSFNWKFxuXHRcdFx0XHRyPT09bnVsbCA/IHRoaXMucmdiWzBdIDogcixcblx0XHRcdFx0Zz09PW51bGwgPyB0aGlzLnJnYlsxXSA6IGcsXG5cdFx0XHRcdGI9PT1udWxsID8gdGhpcy5yZ2JbMl0gOiBiXG5cdFx0XHQpO1xuXHRcdFx0aWYgKGhzdlswXSAhPT0gbnVsbCkge1xuXHRcdFx0XHR0aGlzLmhzdlswXSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDM2MCwgaHN2WzBdKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoaHN2WzJdICE9PSAwKSB7XG5cdFx0XHRcdHRoaXMuaHN2WzFdID0gaHN2WzFdPT09bnVsbCA/IG51bGwgOiBNYXRoLm1heCgwLCB0aGlzLm1pblMsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhTLCBoc3ZbMV0pKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuaHN2WzJdID0gaHN2WzJdPT09bnVsbCA/IG51bGwgOiBNYXRoLm1heCgwLCB0aGlzLm1pblYsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhWLCBoc3ZbMl0pKTtcblxuXHRcdFx0Ly8gdXBkYXRlIFJHQiBhY2NvcmRpbmcgdG8gZmluYWwgSFNWLCBhcyBzb21lIHZhbHVlcyBtaWdodCBiZSB0cmltbWVkXG5cdFx0XHR2YXIgcmdiID0gSFNWX1JHQih0aGlzLmhzdlswXSwgdGhpcy5oc3ZbMV0sIHRoaXMuaHN2WzJdKTtcblx0XHRcdHRoaXMucmdiWzBdID0gcmdiWzBdO1xuXHRcdFx0dGhpcy5yZ2JbMV0gPSByZ2JbMV07XG5cdFx0XHR0aGlzLnJnYlsyXSA9IHJnYlsyXTtcblxuXHRcdFx0dGhpcy5leHBvcnRDb2xvcihmbGFncyk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5mcm9tU3RyaW5nID0gZnVuY3Rpb24gKHN0ciwgZmxhZ3MpIHtcblx0XHRcdHZhciBtO1xuXHRcdFx0aWYgKG0gPSBzdHIubWF0Y2goL15cXFcqKFswLTlBLUZdezN9KFswLTlBLUZdezN9KT8pXFxXKiQvaSkpIHtcblx0XHRcdFx0Ly8gSEVYIG5vdGF0aW9uXG5cdFx0XHRcdC8vXG5cblx0XHRcdFx0aWYgKG1bMV0ubGVuZ3RoID09PSA2KSB7XG5cdFx0XHRcdFx0Ly8gNi1jaGFyIG5vdGF0aW9uXG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoMCwyKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cigyLDIpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDQsMiksMTYpLFxuXHRcdFx0XHRcdFx0ZmxhZ3Ncblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIDMtY2hhciBub3RhdGlvblxuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDApICsgbVsxXS5jaGFyQXQoMCksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMSkgKyBtWzFdLmNoYXJBdCgxKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgyKSArIG1bMV0uY2hhckF0KDIpLDE2KSxcblx0XHRcdFx0XHRcdGZsYWdzXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdFx0fSBlbHNlIGlmIChtID0gc3RyLm1hdGNoKC9eXFxXKnJnYmE/XFwoKFteKV0qKVxcKVxcVyokL2kpKSB7XG5cdFx0XHRcdHZhciBwYXJhbXMgPSBtWzFdLnNwbGl0KCcsJyk7XG5cdFx0XHRcdHZhciByZSA9IC9eXFxzKihcXGQqKShcXC5cXGQrKT9cXHMqJC87XG5cdFx0XHRcdHZhciBtUiwgbUcsIG1CO1xuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0cGFyYW1zLmxlbmd0aCA+PSAzICYmXG5cdFx0XHRcdFx0KG1SID0gcGFyYW1zWzBdLm1hdGNoKHJlKSkgJiZcblx0XHRcdFx0XHQobUcgPSBwYXJhbXNbMV0ubWF0Y2gocmUpKSAmJlxuXHRcdFx0XHRcdChtQiA9IHBhcmFtc1syXS5tYXRjaChyZSkpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHZhciByID0gcGFyc2VGbG9hdCgobVJbMV0gfHwgJzAnKSArIChtUlsyXSB8fCAnJykpO1xuXHRcdFx0XHRcdHZhciBnID0gcGFyc2VGbG9hdCgobUdbMV0gfHwgJzAnKSArIChtR1syXSB8fCAnJykpO1xuXHRcdFx0XHRcdHZhciBiID0gcGFyc2VGbG9hdCgobUJbMV0gfHwgJzAnKSArIChtQlsyXSB8fCAnJykpO1xuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihyLCBnLCBiLCBmbGFncyk7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlswXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkgK1xuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzFdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKSArXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMl0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9IRVhTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gJyMnICsgdGhpcy50b1N0cmluZygpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b1JHQlN0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoJ3JnYignICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlswXSkgKyAnLCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzFdKSArICcsJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMl0pICsgJyknXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuaXNMaWdodCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDAuMjEzICogdGhpcy5yZ2JbMF0gK1xuXHRcdFx0XHQwLjcxNSAqIHRoaXMucmdiWzFdICtcblx0XHRcdFx0MC4wNzIgKiB0aGlzLnJnYlsyXSA+XG5cdFx0XHRcdDI1NSAvIDJcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5fcHJvY2Vzc1BhcmVudEVsZW1lbnRzSW5ET00gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAodGhpcy5fbGlua2VkRWxlbWVudHNQcm9jZXNzZWQpIHsgcmV0dXJuOyB9XG5cdFx0XHR0aGlzLl9saW5rZWRFbGVtZW50c1Byb2Nlc3NlZCA9IHRydWU7XG5cblx0XHRcdHZhciBlbG0gPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBvciBvbmUgb2YgaXRzIHBhcmVudCBub2RlcyBoYXMgZml4ZWQgcG9zaXRpb24sXG5cdFx0XHRcdC8vIHRoZW4gdXNlIGZpeGVkIHBvc2l0aW9uaW5nIGluc3RlYWRcblx0XHRcdFx0Ly9cblx0XHRcdFx0Ly8gTm90ZTogSW4gRmlyZWZveCwgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm5zIG51bGwgaW4gYSBoaWRkZW4gaWZyYW1lLFxuXHRcdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIHJldHVybmVkIHN0eWxlIG9iamVjdCBpcyBub24tZW1wdHlcblx0XHRcdFx0dmFyIGN1cnJTdHlsZSA9IGpzYy5nZXRTdHlsZShlbG0pO1xuXHRcdFx0XHRpZiAoY3VyclN0eWxlICYmIGN1cnJTdHlsZS5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZml4ZWQnKSB7XG5cdFx0XHRcdFx0dGhpcy5maXhlZCA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoZWxtICE9PSB0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdFx0XHQvLyBFbnN1cmUgdG8gYXR0YWNoIG9uUGFyZW50U2Nyb2xsIG9ubHkgb25jZSB0byBlYWNoIHBhcmVudCBlbGVtZW50XG5cdFx0XHRcdFx0Ly8gKG11bHRpcGxlIHRhcmdldEVsZW1lbnRzIGNhbiBzaGFyZSB0aGUgc2FtZSBwYXJlbnQgbm9kZXMpXG5cdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHQvLyBOb3RlOiBJdCdzIG5vdCBqdXN0IG9mZnNldFBhcmVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsYWJsZSxcblx0XHRcdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIGxvb3AgdGhyb3VnaCBhbGwgcGFyZW50IG5vZGVzXG5cdFx0XHRcdFx0aWYgKCFlbG0uX2pzY0V2ZW50c0F0dGFjaGVkKSB7XG5cdFx0XHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQoZWxtLCAnc2Nyb2xsJywganNjLm9uUGFyZW50U2Nyb2xsKTtcblx0XHRcdFx0XHRcdGVsbS5fanNjRXZlbnRzQXR0YWNoZWQgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSB3aGlsZSAoKGVsbSA9IGVsbS5wYXJlbnROb2RlKSAmJiAhanNjLmlzRWxlbWVudFR5cGUoZWxtLCAnYm9keScpKTtcblx0XHR9O1xuXG5cblx0XHQvLyByOiAwLTI1NVxuXHRcdC8vIGc6IDAtMjU1XG5cdFx0Ly8gYjogMC0yNTVcblx0XHQvL1xuXHRcdC8vIHJldHVybnM6IFsgMC0zNjAsIDAtMTAwLCAwLTEwMCBdXG5cdFx0Ly9cblx0XHRmdW5jdGlvbiBSR0JfSFNWIChyLCBnLCBiKSB7XG5cdFx0XHRyIC89IDI1NTtcblx0XHRcdGcgLz0gMjU1O1xuXHRcdFx0YiAvPSAyNTU7XG5cdFx0XHR2YXIgbiA9IE1hdGgubWluKE1hdGgubWluKHIsZyksYik7XG5cdFx0XHR2YXIgdiA9IE1hdGgubWF4KE1hdGgubWF4KHIsZyksYik7XG5cdFx0XHR2YXIgbSA9IHYgLSBuO1xuXHRcdFx0aWYgKG0gPT09IDApIHsgcmV0dXJuIFsgbnVsbCwgMCwgMTAwICogdiBdOyB9XG5cdFx0XHR2YXIgaCA9IHI9PT1uID8gMysoYi1nKS9tIDogKGc9PT1uID8gNSsoci1iKS9tIDogMSsoZy1yKS9tKTtcblx0XHRcdHJldHVybiBbXG5cdFx0XHRcdDYwICogKGg9PT02PzA6aCksXG5cdFx0XHRcdDEwMCAqIChtL3YpLFxuXHRcdFx0XHQxMDAgKiB2XG5cdFx0XHRdO1xuXHRcdH1cblxuXG5cdFx0Ly8gaDogMC0zNjBcblx0XHQvLyBzOiAwLTEwMFxuXHRcdC8vIHY6IDAtMTAwXG5cdFx0Ly9cblx0XHQvLyByZXR1cm5zOiBbIDAtMjU1LCAwLTI1NSwgMC0yNTUgXVxuXHRcdC8vXG5cdFx0ZnVuY3Rpb24gSFNWX1JHQiAoaCwgcywgdikge1xuXHRcdFx0dmFyIHUgPSAyNTUgKiAodiAvIDEwMCk7XG5cblx0XHRcdGlmIChoID09PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBbIHUsIHUsIHUgXTtcblx0XHRcdH1cblxuXHRcdFx0aCAvPSA2MDtcblx0XHRcdHMgLz0gMTAwO1xuXG5cdFx0XHR2YXIgaSA9IE1hdGguZmxvb3IoaCk7XG5cdFx0XHR2YXIgZiA9IGklMiA/IGgtaSA6IDEtKGgtaSk7XG5cdFx0XHR2YXIgbSA9IHUgKiAoMSAtIHMpO1xuXHRcdFx0dmFyIG4gPSB1ICogKDEgLSBzICogZik7XG5cdFx0XHRzd2l0Y2ggKGkpIHtcblx0XHRcdFx0Y2FzZSA2OlxuXHRcdFx0XHRjYXNlIDA6IHJldHVybiBbdSxuLG1dO1xuXHRcdFx0XHRjYXNlIDE6IHJldHVybiBbbix1LG1dO1xuXHRcdFx0XHRjYXNlIDI6IHJldHVybiBbbSx1LG5dO1xuXHRcdFx0XHRjYXNlIDM6IHJldHVybiBbbSxuLHVdO1xuXHRcdFx0XHRjYXNlIDQ6IHJldHVybiBbbixtLHVdO1xuXHRcdFx0XHRjYXNlIDU6IHJldHVybiBbdSxtLG5dO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gZGV0YWNoUGlja2VyICgpIHtcblx0XHRcdGpzYy51bnNldENsYXNzKFRISVMudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0XHRqc2MucGlja2VyLndyYXAucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChqc2MucGlja2VyLndyYXApO1xuXHRcdFx0ZGVsZXRlIGpzYy5waWNrZXIub3duZXI7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBkcmF3UGlja2VyICgpIHtcblxuXHRcdFx0Ly8gQXQgdGhpcyBwb2ludCwgd2hlbiBkcmF3aW5nIHRoZSBwaWNrZXIsIHdlIGtub3cgd2hhdCB0aGUgcGFyZW50IGVsZW1lbnRzIGFyZVxuXHRcdFx0Ly8gYW5kIHdlIGNhbiBkbyBhbGwgcmVsYXRlZCBET00gb3BlcmF0aW9ucywgc3VjaCBhcyByZWdpc3RlcmluZyBldmVudHMgb24gdGhlbVxuXHRcdFx0Ly8gb3IgY2hlY2tpbmcgdGhlaXIgcG9zaXRpb25pbmdcblx0XHRcdFRISVMuX3Byb2Nlc3NQYXJlbnRFbGVtZW50c0luRE9NKCk7XG5cblx0XHRcdGlmICghanNjLnBpY2tlcikge1xuXHRcdFx0XHRqc2MucGlja2VyID0ge1xuXHRcdFx0XHRcdG93bmVyOiBudWxsLFxuXHRcdFx0XHRcdHdyYXAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRib3ggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRib3hTIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNoYWRvdyBhcmVhXG5cdFx0XHRcdFx0Ym94QiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRwYWQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRwYWRCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlclxuXHRcdFx0XHRcdHBhZE0gOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbW91c2UvdG91Y2ggYXJlYVxuXHRcdFx0XHRcdHBhZFBhbCA6IGpzYy5jcmVhdGVQYWxldHRlKCksXG5cdFx0XHRcdFx0Y3Jvc3MgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRjcm9zc0JZIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlciBZXG5cdFx0XHRcdFx0Y3Jvc3NCWCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXIgWFxuXHRcdFx0XHRcdGNyb3NzTFkgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbGluZSBZXG5cdFx0XHRcdFx0Y3Jvc3NMWCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBsaW5lIFhcblx0XHRcdFx0XHRzbGQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRzbGRCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlclxuXHRcdFx0XHRcdHNsZE0gOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbW91c2UvdG91Y2ggYXJlYVxuXHRcdFx0XHRcdHNsZEdyYWQgOiBqc2MuY3JlYXRlU2xpZGVyR3JhZGllbnQoKSxcblx0XHRcdFx0XHRzbGRQdHJTIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIHNwYWNlclxuXHRcdFx0XHRcdHNsZFB0cklCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIGlubmVyIGJvcmRlclxuXHRcdFx0XHRcdHNsZFB0ck1CIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIG1pZGRsZSBib3JkZXJcblx0XHRcdFx0XHRzbGRQdHJPQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBvdXRlciBib3JkZXJcblx0XHRcdFx0XHRidG4gOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRidG5UIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpIC8vIHRleHRcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRqc2MucGlja2VyLnBhZC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZFBhbC5lbG0pO1xuXHRcdFx0XHRqc2MucGlja2VyLnBhZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWQpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NCWSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0JYKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzTFkpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NMWCk7XG5cdFx0XHRcdGpzYy5waWNrZXIucGFkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRCKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRNKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLnNsZC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZEdyYWQuZWxtKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRyT0IpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck9CLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRyTUIpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck1CLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRySUIpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0cklCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRyUyk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkTSk7XG5cblx0XHRcdFx0anNjLnBpY2tlci5idG4uYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5idG5UKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5idG4pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuYm94Qi5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJveCk7XG5cdFx0XHRcdGpzYy5waWNrZXIud3JhcC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJveFMpO1xuXHRcdFx0XHRqc2MucGlja2VyLndyYXAuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3hCKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHAgPSBqc2MucGlja2VyO1xuXG5cdFx0XHR2YXIgZGlzcGxheVNsaWRlciA9ICEhanNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKTtcblx0XHRcdHZhciBkaW1zID0ganNjLmdldFBpY2tlckRpbXMoVEhJUyk7XG5cdFx0XHR2YXIgY3Jvc3NPdXRlclNpemUgPSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgMiAqIFRISVMuY3Jvc3NTaXplKTtcblx0XHRcdHZhciBwYWRUb1NsaWRlclBhZGRpbmcgPSBqc2MuZ2V0UGFkVG9TbGlkZXJQYWRkaW5nKFRISVMpO1xuXHRcdFx0dmFyIGJvcmRlclJhZGl1cyA9IE1hdGgubWluKFxuXHRcdFx0XHRUSElTLmJvcmRlclJhZGl1cyxcblx0XHRcdFx0TWF0aC5yb3VuZChUSElTLnBhZGRpbmcgKiBNYXRoLlBJKSk7IC8vIHB4XG5cdFx0XHR2YXIgcGFkQ3Vyc29yID0gJ2Nyb3NzaGFpcic7XG5cblx0XHRcdC8vIHdyYXBcblx0XHRcdHAud3JhcC5zdHlsZS5jbGVhciA9ICdib3RoJztcblx0XHRcdHAud3JhcC5zdHlsZS53aWR0aCA9IChkaW1zWzBdICsgMiAqIFRISVMuYm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAud3JhcC5zdHlsZS5oZWlnaHQgPSAoZGltc1sxXSArIDIgKiBUSElTLmJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLndyYXAuc3R5bGUuekluZGV4ID0gVEhJUy56SW5kZXg7XG5cblx0XHRcdC8vIHBpY2tlclxuXHRcdFx0cC5ib3guc3R5bGUud2lkdGggPSBkaW1zWzBdICsgJ3B4Jztcblx0XHRcdHAuYm94LnN0eWxlLmhlaWdodCA9IGRpbXNbMV0gKyAncHgnO1xuXG5cdFx0XHRwLmJveFMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLmxlZnQgPSAnMCc7XG5cdFx0XHRwLmJveFMuc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdGpzYy5zZXRCb3JkZXJSYWRpdXMocC5ib3hTLCBib3JkZXJSYWRpdXMgKyAncHgnKTtcblxuXHRcdFx0Ly8gcGlja2VyIGJvcmRlclxuXHRcdFx0cC5ib3hCLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHAuYm94Qi5zdHlsZS5ib3JkZXIgPSBUSElTLmJvcmRlcldpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAuYm94Qi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuYm9yZGVyQ29sb3I7XG5cdFx0XHRwLmJveEIuc3R5bGUuYmFja2dyb3VuZCA9IFRISVMuYmFja2dyb3VuZENvbG9yO1xuXHRcdFx0anNjLnNldEJvcmRlclJhZGl1cyhwLmJveEIsIGJvcmRlclJhZGl1cyArICdweCcpO1xuXG5cdFx0XHQvLyBJRSBoYWNrOlxuXHRcdFx0Ly8gSWYgdGhlIGVsZW1lbnQgaXMgdHJhbnNwYXJlbnQsIElFIHdpbGwgdHJpZ2dlciB0aGUgZXZlbnQgb24gdGhlIGVsZW1lbnRzIHVuZGVyIGl0LFxuXHRcdFx0Ly8gZS5nLiBvbiBDYW52YXMgb3Igb24gZWxlbWVudHMgd2l0aCBib3JkZXJcblx0XHRcdHAucGFkTS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdHAuc2xkTS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdFx0JyNGRkYnO1xuXHRcdFx0anNjLnNldFN0eWxlKHAucGFkTSwgJ29wYWNpdHknLCAnMCcpO1xuXHRcdFx0anNjLnNldFN0eWxlKHAuc2xkTSwgJ29wYWNpdHknLCAnMCcpO1xuXG5cdFx0XHQvLyBwYWRcblx0XHRcdHAucGFkLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHAucGFkLnN0eWxlLndpZHRoID0gVEhJUy53aWR0aCArICdweCc7XG5cdFx0XHRwLnBhZC5zdHlsZS5oZWlnaHQgPSBUSElTLmhlaWdodCArICdweCc7XG5cblx0XHRcdC8vIHBhZCBwYWxldHRlcyAoSFNWIGFuZCBIVlMpXG5cdFx0XHRwLnBhZFBhbC5kcmF3KFRISVMud2lkdGgsIFRISVMuaGVpZ2h0LCBqc2MuZ2V0UGFkWUNvbXBvbmVudChUSElTKSk7XG5cblx0XHRcdC8vIHBhZCBib3JkZXJcblx0XHRcdHAucGFkQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnBhZEIuc3R5bGUubGVmdCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUudG9wID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAucGFkQi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmJvcmRlckNvbG9yID0gVEhJUy5pbnNldENvbG9yO1xuXG5cdFx0XHQvLyBwYWQgbW91c2UgYXJlYVxuXHRcdFx0cC5wYWRNLl9qc2NJbnN0YW5jZSA9IFRISVM7XG5cdFx0XHRwLnBhZE0uX2pzY0NvbnRyb2xOYW1lID0gJ3BhZCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLmxlZnQgPSAnMCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLndpZHRoID0gKFRISVMucGFkZGluZyArIDIgKiBUSElTLmluc2V0V2lkdGggKyBUSElTLndpZHRoICsgcGFkVG9TbGlkZXJQYWRkaW5nIC8gMikgKyAncHgnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLmhlaWdodCA9IGRpbXNbMV0gKyAncHgnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLmN1cnNvciA9IHBhZEN1cnNvcjtcblxuXHRcdFx0Ly8gcGFkIGNyb3NzXG5cdFx0XHRwLmNyb3NzLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuY3Jvc3Muc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzLnN0eWxlLnRvcCA9XG5cdFx0XHRcdCcwJztcblx0XHRcdHAuY3Jvc3Muc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zcy5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRjcm9zc091dGVyU2l6ZSArICdweCc7XG5cblx0XHRcdC8vIHBhZCBjcm9zcyBib3JkZXIgWSBhbmQgWFxuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRcdCdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlckNvbG9yO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHQoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUuaGVpZ2h0ID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdGNyb3NzT3V0ZXJTaXplICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS50b3AgPVxuXHRcdFx0XHQoTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpIC0gTWF0aC5mbG9vcihUSElTLnBvaW50ZXJUaGlja25lc3MgLyAyKSAtIFRISVMucG9pbnRlckJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUudG9wID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5sZWZ0ID1cblx0XHRcdFx0JzAnO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3MgbGluZSBZIGFuZCBYXG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdFx0J2Fic29sdXRlJztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQ29sb3I7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUuaGVpZ2h0ID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdChjcm9zc091dGVyU2l6ZSAtIDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJUaGlja25lc3MgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLnRvcCA9XG5cdFx0XHRcdChNYXRoLmZsb29yKGNyb3NzT3V0ZXJTaXplIC8gMikgLSBNYXRoLmZsb29yKFRISVMucG9pbnRlclRoaWNrbmVzcyAvIDIpKSArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUudG9wID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5sZWZ0ID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyAncHgnO1xuXG5cdFx0XHQvLyBzbGlkZXJcblx0XHRcdHAuc2xkLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cdFx0XHRwLnNsZC5zdHlsZS53aWR0aCA9IFRISVMuc2xpZGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLnNsZC5zdHlsZS5oZWlnaHQgPSBUSElTLmhlaWdodCArICdweCc7XG5cblx0XHRcdC8vIHNsaWRlciBncmFkaWVudFxuXHRcdFx0cC5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgJyMwMDAnLCAnIzAwMCcpO1xuXG5cdFx0XHQvLyBzbGlkZXIgYm9yZGVyXG5cdFx0XHRwLnNsZEIuc3R5bGUuZGlzcGxheSA9IGRpc3BsYXlTbGlkZXIgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkQi5zdHlsZS5yaWdodCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUudG9wID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuc2xkQi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLmJvcmRlckNvbG9yID0gVEhJUy5pbnNldENvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgbW91c2UgYXJlYVxuXHRcdFx0cC5zbGRNLl9qc2NJbnN0YW5jZSA9IFRISVM7XG5cdFx0XHRwLnNsZE0uX2pzY0NvbnRyb2xOYW1lID0gJ3NsZCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuZGlzcGxheSA9IGRpc3BsYXlTbGlkZXIgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkTS5zdHlsZS5yaWdodCA9ICcwJztcblx0XHRcdHAuc2xkTS5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUud2lkdGggPSAoVEhJUy5zbGlkZXJTaXplICsgcGFkVG9TbGlkZXJQYWRkaW5nIC8gMiArIFRISVMucGFkZGluZyArIDIgKiBUSElTLmluc2V0V2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuc2xkTS5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4Jztcblx0XHRcdHAuc2xkTS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIGlubmVyIGFuZCBvdXRlciBib3JkZXJcblx0XHRcdHAuc2xkUHRySUIuc3R5bGUuYm9yZGVyID1cblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUuYm9yZGVyID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyAncHggc29saWQgJyArIFRISVMucG9pbnRlckJvcmRlckNvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBvdXRlciBib3JkZXJcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5sZWZ0ID0gLSgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpICsgJ3B4Jztcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUudG9wID0gJzAnO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBtaWRkbGUgYm9yZGVyXG5cdFx0XHRwLnNsZFB0ck1CLnN0eWxlLmJvcmRlciA9IFRISVMucG9pbnRlclRoaWNrbmVzcyArICdweCBzb2xpZCAnICsgVEhJUy5wb2ludGVyQ29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIHNwYWNlclxuXHRcdFx0cC5zbGRQdHJTLnN0eWxlLndpZHRoID0gVEhJUy5zbGlkZXJTaXplICsgJ3B4Jztcblx0XHRcdHAuc2xkUHRyUy5zdHlsZS5oZWlnaHQgPSBzbGlkZXJQdHJTcGFjZSArICdweCc7XG5cblx0XHRcdC8vIHRoZSBDbG9zZSBidXR0b25cblx0XHRcdGZ1bmN0aW9uIHNldEJ0bkJvcmRlciAoKSB7XG5cdFx0XHRcdHZhciBpbnNldENvbG9ycyA9IFRISVMuaW5zZXRDb2xvci5zcGxpdCgvXFxzKy8pO1xuXHRcdFx0XHR2YXIgb3V0c2V0Q29sb3IgPSBpbnNldENvbG9ycy5sZW5ndGggPCAyID8gaW5zZXRDb2xvcnNbMF0gOiBpbnNldENvbG9yc1sxXSArICcgJyArIGluc2V0Q29sb3JzWzBdICsgJyAnICsgaW5zZXRDb2xvcnNbMF0gKyAnICcgKyBpbnNldENvbG9yc1sxXTtcblx0XHRcdFx0cC5idG4uc3R5bGUuYm9yZGVyQ29sb3IgPSBvdXRzZXRDb2xvcjtcblx0XHRcdH1cblx0XHRcdHAuYnRuLnN0eWxlLmRpc3BsYXkgPSBUSElTLmNsb3NhYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuYnRuLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuYnRuLnN0eWxlLmxlZnQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuYm90dG9tID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLnBhZGRpbmcgPSAnMCAxNXB4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmhlaWdodCA9IFRISVMuYnV0dG9uSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRzZXRCdG5Cb3JkZXIoKTtcblx0XHRcdHAuYnRuLnN0eWxlLmNvbG9yID0gVEhJUy5idXR0b25Db2xvcjtcblx0XHRcdHAuYnRuLnN0eWxlLmZvbnQgPSAnMTJweCBzYW5zLXNlcmlmJztcblx0XHRcdHAuYnRuLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cC5idG4uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuXHRcdFx0fSBjYXRjaChlT2xkSUUpIHtcblx0XHRcdFx0cC5idG4uc3R5bGUuY3Vyc29yID0gJ2hhbmQnO1xuXHRcdFx0fVxuXHRcdFx0cC5idG4ub25tb3VzZWRvd24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFRISVMuaGlkZSgpO1xuXHRcdFx0fTtcblx0XHRcdHAuYnRuVC5zdHlsZS5saW5lSGVpZ2h0ID0gVEhJUy5idXR0b25IZWlnaHQgKyAncHgnO1xuXHRcdFx0cC5idG5ULmlubmVySFRNTCA9ICcnO1xuXHRcdFx0cC5idG5ULmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFRISVMuY2xvc2VUZXh0KSk7XG5cblx0XHRcdC8vIHBsYWNlIHBvaW50ZXJzXG5cdFx0XHRyZWRyYXdQYWQoKTtcblx0XHRcdHJlZHJhd1NsZCgpO1xuXG5cdFx0XHQvLyBJZiB3ZSBhcmUgY2hhbmdpbmcgdGhlIG93bmVyIHdpdGhvdXQgZmlyc3QgY2xvc2luZyB0aGUgcGlja2VyLFxuXHRcdFx0Ly8gbWFrZSBzdXJlIHRvIGZpcnN0IGRlYWwgd2l0aCB0aGUgb2xkIG93bmVyXG5cdFx0XHRpZiAoanNjLnBpY2tlci5vd25lciAmJiBqc2MucGlja2VyLm93bmVyICE9PSBUSElTKSB7XG5cdFx0XHRcdGpzYy51bnNldENsYXNzKGpzYy5waWNrZXIub3duZXIudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFNldCB0aGUgbmV3IHBpY2tlciBvd25lclxuXHRcdFx0anNjLnBpY2tlci5vd25lciA9IFRISVM7XG5cblx0XHRcdC8vIFRoZSByZWRyYXdQb3NpdGlvbigpIG1ldGhvZCBuZWVkcyBwaWNrZXIub3duZXIgdG8gYmUgc2V0LCB0aGF0J3Mgd2h5IHdlIGNhbGwgaXQgaGVyZSxcblx0XHRcdC8vIGFmdGVyIHNldHRpbmcgdGhlIG93bmVyXG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUoY29udGFpbmVyLCAnYm9keScpKSB7XG5cdFx0XHRcdGpzYy5yZWRyYXdQb3NpdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0anNjLl9kcmF3UG9zaXRpb24oVEhJUywgMCwgMCwgJ3JlbGF0aXZlJywgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocC53cmFwLnBhcmVudE5vZGUgIT0gY29udGFpbmVyKSB7XG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZChwLndyYXApO1xuXHRcdFx0fVxuXG5cdFx0XHRqc2Muc2V0Q2xhc3MoVEhJUy50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIHJlZHJhd1BhZCAoKSB7XG5cdFx0XHQvLyByZWRyYXcgdGhlIHBhZCBwb2ludGVyXG5cdFx0XHRzd2l0Y2ggKGpzYy5nZXRQYWRZQ29tcG9uZW50KFRISVMpKSB7XG5cdFx0XHRjYXNlICdzJzogdmFyIHlDb21wb25lbnQgPSAxOyBicmVhaztcblx0XHRcdGNhc2UgJ3YnOiB2YXIgeUNvbXBvbmVudCA9IDI7IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHggPSBNYXRoLnJvdW5kKChUSElTLmhzdlswXSAvIDM2MCkgKiAoVEhJUy53aWR0aCAtIDEpKTtcblx0XHRcdHZhciB5ID0gTWF0aC5yb3VuZCgoMSAtIFRISVMuaHN2W3lDb21wb25lbnRdIC8gMTAwKSAqIChUSElTLmhlaWdodCAtIDEpKTtcblx0XHRcdHZhciBjcm9zc091dGVyU2l6ZSA9ICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAyICogVEhJUy5jcm9zc1NpemUpO1xuXHRcdFx0dmFyIG9mcyA9IC1NYXRoLmZsb29yKGNyb3NzT3V0ZXJTaXplIC8gMik7XG5cdFx0XHRqc2MucGlja2VyLmNyb3NzLnN0eWxlLmxlZnQgPSAoeCArIG9mcykgKyAncHgnO1xuXHRcdFx0anNjLnBpY2tlci5jcm9zcy5zdHlsZS50b3AgPSAoeSArIG9mcykgKyAncHgnO1xuXG5cdFx0XHQvLyByZWRyYXcgdGhlIHNsaWRlclxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KFRISVMpKSB7XG5cdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0dmFyIHJnYjEgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCAxMDAsIFRISVMuaHN2WzJdKTtcblx0XHRcdFx0dmFyIHJnYjIgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCAwLCBUSElTLmhzdlsyXSk7XG5cdFx0XHRcdHZhciBjb2xvcjEgPSAncmdiKCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMVswXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMVsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMVsyXSkgKyAnKSc7XG5cdFx0XHRcdHZhciBjb2xvcjIgPSAncmdiKCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMlswXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMlsyXSkgKyAnKSc7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsIGNvbG9yMSwgY29sb3IyKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0dmFyIHJnYiA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIFRISVMuaHN2WzFdLCAxMDApO1xuXHRcdFx0XHR2YXIgY29sb3IxID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlswXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMl0pICsgJyknO1xuXHRcdFx0XHR2YXIgY29sb3IyID0gJyMwMDAnO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gcmVkcmF3U2xkICgpIHtcblx0XHRcdHZhciBzbGRDb21wb25lbnQgPSBqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KFRISVMpO1xuXHRcdFx0aWYgKHNsZENvbXBvbmVudCkge1xuXHRcdFx0XHQvLyByZWRyYXcgdGhlIHNsaWRlciBwb2ludGVyXG5cdFx0XHRcdHN3aXRjaCAoc2xkQ29tcG9uZW50KSB7XG5cdFx0XHRcdGNhc2UgJ3MnOiB2YXIgeUNvbXBvbmVudCA9IDE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2JzogdmFyIHlDb21wb25lbnQgPSAyOyBicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgeSA9IE1hdGgucm91bmQoKDEgLSBUSElTLmhzdlt5Q29tcG9uZW50XSAvIDEwMCkgKiAoVEhJUy5oZWlnaHQgLSAxKSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyT0Iuc3R5bGUudG9wID0gKHkgLSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSAtIE1hdGguZmxvb3Ioc2xpZGVyUHRyU3BhY2UgLyAyKSkgKyAncHgnO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gaXNQaWNrZXJPd25lciAoKSB7XG5cdFx0XHRyZXR1cm4ganNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyID09PSBUSElTO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gYmx1clZhbHVlICgpIHtcblx0XHRcdFRISVMuaW1wb3J0Q29sb3IoKTtcblx0XHR9XG5cblxuXHRcdC8vIEZpbmQgdGhlIHRhcmdldCBlbGVtZW50XG5cdFx0aWYgKHR5cGVvZiB0YXJnZXRFbGVtZW50ID09PSAnc3RyaW5nJykge1xuXHRcdFx0dmFyIGlkID0gdGFyZ2V0RWxlbWVudDtcblx0XHRcdHZhciBlbG0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cdFx0XHRpZiAoZWxtKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IGVsbTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpzYy53YXJuKCdDb3VsZCBub3QgZmluZCB0YXJnZXQgZWxlbWVudCB3aXRoIElEIFxcJycgKyBpZCArICdcXCcnKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldEVsZW1lbnQpIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGpzYy53YXJuKCdJbnZhbGlkIHRhcmdldCBlbGVtZW50OiBcXCcnICsgdGFyZ2V0RWxlbWVudCArICdcXCcnKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50Ll9qc2NMaW5rZWRJbnN0YW5jZSkge1xuXHRcdFx0anNjLndhcm4oJ0Nhbm5vdCBsaW5rIGpzY29sb3IgdHdpY2UgdG8gdGhlIHNhbWUgZWxlbWVudC4gU2tpcHBpbmcuJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMudGFyZ2V0RWxlbWVudC5fanNjTGlua2VkSW5zdGFuY2UgPSB0aGlzO1xuXG5cdFx0Ly8gRmluZCB0aGUgdmFsdWUgZWxlbWVudFxuXHRcdHRoaXMudmFsdWVFbGVtZW50ID0ganNjLmZldGNoRWxlbWVudCh0aGlzLnZhbHVlRWxlbWVudCk7XG5cdFx0Ly8gRmluZCB0aGUgc3R5bGUgZWxlbWVudFxuXHRcdHRoaXMuc3R5bGVFbGVtZW50ID0ganNjLmZldGNoRWxlbWVudCh0aGlzLnN0eWxlRWxlbWVudCk7XG5cblx0XHR2YXIgVEhJUyA9IHRoaXM7XG5cdFx0dmFyIGNvbnRhaW5lciA9XG5cdFx0XHR0aGlzLmNvbnRhaW5lciA/XG5cdFx0XHRqc2MuZmV0Y2hFbGVtZW50KHRoaXMuY29udGFpbmVyKSA6XG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuXHRcdHZhciBzbGlkZXJQdHJTcGFjZSA9IDM7IC8vIHB4XG5cblx0XHQvLyBGb3IgQlVUVE9OIGVsZW1lbnRzIGl0J3MgaW1wb3J0YW50IHRvIHN0b3AgdGhlbSBmcm9tIHNlbmRpbmcgdGhlIGZvcm0gd2hlbiBjbGlja2VkXG5cdFx0Ly8gKGUuZy4gaW4gU2FmYXJpKVxuXHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnRhcmdldEVsZW1lbnQsICdidXR0b24nKSkge1xuXHRcdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrKSB7XG5cdFx0XHRcdHZhciBvcmlnQ2FsbGJhY2sgPSB0aGlzLnRhcmdldEVsZW1lbnQub25jbGljaztcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZ0KSB7XG5cdFx0XHRcdFx0b3JpZ0NhbGxiYWNrLmNhbGwodGhpcywgZXZ0KTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qXG5cdFx0dmFyIGVsbSA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblx0XHRkbyB7XG5cdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgb3Igb25lIG9mIGl0cyBvZmZzZXRQYXJlbnRzIGhhcyBmaXhlZCBwb3NpdGlvbixcblx0XHRcdC8vIHRoZW4gdXNlIGZpeGVkIHBvc2l0aW9uaW5nIGluc3RlYWRcblx0XHRcdC8vXG5cdFx0XHQvLyBOb3RlOiBJbiBGaXJlZm94LCBnZXRDb21wdXRlZFN0eWxlIHJldHVybnMgbnVsbCBpbiBhIGhpZGRlbiBpZnJhbWUsXG5cdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIHJldHVybmVkIHN0eWxlIG9iamVjdCBpcyBub24tZW1wdHlcblx0XHRcdHZhciBjdXJyU3R5bGUgPSBqc2MuZ2V0U3R5bGUoZWxtKTtcblx0XHRcdGlmIChjdXJyU3R5bGUgJiYgY3VyclN0eWxlLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdmaXhlZCcpIHtcblx0XHRcdFx0dGhpcy5maXhlZCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChlbG0gIT09IHRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0XHQvLyBhdHRhY2ggb25QYXJlbnRTY3JvbGwgc28gdGhhdCB3ZSBjYW4gcmVjb21wdXRlIHRoZSBwaWNrZXIgcG9zaXRpb25cblx0XHRcdFx0Ly8gd2hlbiBvbmUgb2YgdGhlIG9mZnNldFBhcmVudHMgaXMgc2Nyb2xsZWRcblx0XHRcdFx0aWYgKCFlbG0uX2pzY0V2ZW50c0F0dGFjaGVkKSB7XG5cdFx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KGVsbSwgJ3Njcm9sbCcsIGpzYy5vblBhcmVudFNjcm9sbCk7XG5cdFx0XHRcdFx0ZWxtLl9qc2NFdmVudHNBdHRhY2hlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IHdoaWxlICgoZWxtID0gZWxtLm9mZnNldFBhcmVudCkgJiYgIWpzYy5pc0VsZW1lbnRUeXBlKGVsbSwgJ2JvZHknKSk7XG5cdFx0Ki9cblxuXHRcdC8vIHZhbHVlRWxlbWVudFxuXHRcdGlmICh0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHR2YXIgdXBkYXRlRmllbGQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0VEhJUy5mcm9tU3RyaW5nKFRISVMudmFsdWVFbGVtZW50LnZhbHVlLCBqc2MubGVhdmVWYWx1ZSk7XG5cdFx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZShUSElTKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAna2V5dXAnLCB1cGRhdGVGaWVsZCk7XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JywgdXBkYXRlRmllbGQpO1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdibHVyJywgYmx1clZhbHVlKTtcblx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gc3R5bGVFbGVtZW50XG5cdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlID0ge1xuXHRcdFx0XHRiYWNrZ3JvdW5kSW1hZ2UgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UsXG5cdFx0XHRcdGJhY2tncm91bmRDb2xvciA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvcixcblx0XHRcdFx0Y29sb3IgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvclxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy52YWx1ZSkge1xuXHRcdFx0Ly8gVHJ5IHRvIHNldCB0aGUgY29sb3IgZnJvbSB0aGUgLnZhbHVlIG9wdGlvbiBhbmQgaWYgdW5zdWNjZXNzZnVsLFxuXHRcdFx0Ly8gZXhwb3J0IHRoZSBjdXJyZW50IGNvbG9yXG5cdFx0XHR0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZSkgfHwgdGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmltcG9ydENvbG9yKCk7XG5cdFx0fVxuXHR9XG5cbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUHVibGljIHByb3BlcnRpZXMgYW5kIG1ldGhvZHNcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuXG4vLyBCeSBkZWZhdWx0LCBzZWFyY2ggZm9yIGFsbCBlbGVtZW50cyB3aXRoIGNsYXNzPVwianNjb2xvclwiIGFuZCBpbnN0YWxsIGEgY29sb3IgcGlja2VyIG9uIHRoZW0uXG4vL1xuLy8gWW91IGNhbiBjaGFuZ2Ugd2hhdCBjbGFzcyBuYW1lIHdpbGwgYmUgbG9va2VkIGZvciBieSBzZXR0aW5nIHRoZSBwcm9wZXJ0eSBqc2NvbG9yLmxvb2t1cENsYXNzXG4vLyBhbnl3aGVyZSBpbiB5b3VyIEhUTUwgZG9jdW1lbnQuIFRvIGNvbXBsZXRlbHkgZGlzYWJsZSB0aGUgYXV0b21hdGljIGxvb2t1cCwgc2V0IGl0IHRvIG51bGwuXG4vL1xuanNjLmpzY29sb3IubG9va3VwQ2xhc3MgPSAnanNjb2xvcic7XG5cblxuanNjLmpzY29sb3IuaW5zdGFsbEJ5Q2xhc3NOYW1lID0gZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuXHR2YXIgaW5wdXRFbG1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0Jyk7XG5cdHZhciBidXR0b25FbG1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2J1dHRvbicpO1xuXG5cdGpzYy50cnlJbnN0YWxsT25FbGVtZW50cyhpbnB1dEVsbXMsIGNsYXNzTmFtZSk7XG5cdGpzYy50cnlJbnN0YWxsT25FbGVtZW50cyhidXR0b25FbG1zLCBjbGFzc05hbWUpO1xufTtcblxuXG5qc2MucmVnaXN0ZXIoKTtcblxuXG5yZXR1cm4ganNjLmpzY29sb3I7XG5cblxufSkoKTsgfVxuIl19
