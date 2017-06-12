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
        this.wasColorPickerActive = false;

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
                            if (this.targetBody && !this.interaction.started) {
                                this.sim.removeBody(this.targetBody);
                                this.targetBody = undefined;
                            }
                        } else if (event.button === /* middle click */1) {
                            // Color picking
                            if (this.targetBody && !this.interaction.started) {
                                this.colorPicker.style.left = event.position.x + 'px';
                                this.colorPicker.style.top = event.position.y + 'px';
                                this.jscolor.fromString(this.targetBody.color);
                                this.jscolor.show();
                            }
                        } else {
                            /* left click */
                            // Base the check on the previous value, in case the color picker was just
                            // closed.
                            if (!this.wasColorPickerActive) {
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
                            } else {
                                // Update the picker.
                                this.isColorPickerActive();
                            }
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
                        if (!this.interaction.started && !this.isColorPickerActive()) {
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
    }, {
        key: 'isColorPickerActive',
        value: function isColorPickerActive() {
            this.wasColorPickerActive = this.colorPicker.className.indexOf('jscolor-active') > -1;
            return this.wasColorPickerActive;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL2xvZy5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7OztrQkNhZSxFQUFFLEdBQUcsZUFBTyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNGUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlBQUksQ0FB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RUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFOztBQUVQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7O0FBRVAsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsRUFBRTtBQUNULFNBQUssRUFBRSxFQUFFO0FBQ1QsU0FBSyxFQUFFLEdBQUc7QUFDVixTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7QUFDVixTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHOztBQUVWLGVBQVcsRUFBRSxDQUFDO0FBQ2QsU0FBSyxFQUFFLENBQUM7QUFDUixXQUFPLEVBQUUsRUFBRTtBQUNYLFdBQU8sRUFBRSxFQUFFO0FBQ1gsVUFBTSxFQUFFLEVBQUU7QUFDVixTQUFLLEVBQUUsRUFBRTtBQUNULFNB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QUFDLENBQUMsR0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDckYsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNOLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDcEMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQ2hHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FB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LElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbEM7QUFDRCxTQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDZixVQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUFFLGNBQU8sS0FBSyxDQUFDO09BQUU7QUFDL0IsT0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbEM7QUFDRCxTQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDZixVQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUFFLGNBQU8sS0FBSyxDQUFDO09BQUU7QUFDL0IsT0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbEM7O0FBRUQsU0FBSSxHQUFHLEdBQUcsT0FBTyxDQUNoQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUMxQixDQUFDO0FBQ0YsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ3BCLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNqRDtBQUNELFNBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNqQixVQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzlGO0FBQ0QsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7OztBQUFDLEFBRzlGLFNBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVyQixTQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3hCLENBQUM7O0FBR0YsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDdkMsU0FBSSxDQUFDLENBQUM7QUFDTixTQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxDQUFDLEVBQUU7Ozs7QUFJMUQsVUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTs7QUFFdEIsV0FBSSxDQUFDLE9BQU8sQ0FDWCxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzdCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDN0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM3QixLQUFLLENBQ0wsQ0FBQztPQUNGLE1BQU07O0FBRU4sV0FBSSxDQUFDLE9BQU8sQ0FDWCxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM1QyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM1QyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM1QyxLQUFLLENBQ0wsQ0FBQztPQUNGO0FBQ0QsYUFBTyxJQUFJLENBQUM7TUFFWixNQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsRUFBRTtBQUN0RCxVQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLFVBQUksRUFBRSxHQUFHLHVCQUF1QixDQUFDO0FBQ2pDLFVBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7QUFDZixVQUNDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUNqQixFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLEtBQ3pCLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsS0FDekIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxFQUN6QjtBQUNELFdBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUEsSUFBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBLEFBQUMsQ0FBQyxDQUFDO0FBQ25ELFdBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUEsSUFBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBLEFBQUMsQ0FBQyxDQUFDO0FBQ25ELFdBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUEsSUFBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBLEFBQUMsQ0FBQyxDQUFDO0FBQ25ELFdBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDN0IsY0FBTyxJQUFJLENBQUM7T0FDWjtNQUNEO0FBQ0QsWUFBTyxLQUFLLENBQUM7S0FDYixDQUFDOztBQUdGLFFBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWTtBQUMzQixZQUNDLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FDeEQsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUN4RCxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQ3ZEO0tBQ0YsQ0FBQzs7QUFHRixRQUFJLENBQUMsV0FBVyxHQUFHLFlBQVk7QUFDOUIsWUFBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQzNDLENBQUM7O0FBR0YsUUFBSSxDQUFDLFdBQVcsR0FBRyxZQUFZO0FBQzlCLFlBQVEsTUFBTSxHQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FDN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUM3QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQzVCO0tBQ0YsQ0FBQzs7QUFHRixRQUFJLENBQUMsT0FBTyxHQUFHLFlBQVk7QUFDMUIsWUFDQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FDbkIsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQ25CLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUNuQixHQUFHLEdBQUcsQ0FBQyxDQUNOO0tBQ0YsQ0FBQzs7QUFHRixRQUFJLENBQUMsMkJBQTJCLEdBQUcsWUFBWTtBQUM5QyxTQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtBQUFFLGFBQU87TUFBRTtBQUM5QyxTQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDOztBQUVyQyxTQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQzdCLFFBQUc7Ozs7OztBQU1GLFVBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEMsVUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxPQUFPLEVBQUU7QUFDOUQsV0FBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7T0FDbEI7O0FBRUQsVUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLGFBQWEsRUFBRTs7Ozs7O0FBTS9CLFdBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUU7QUFDNUIsV0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNuRCxXQUFHLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQzlCO09BQ0Q7TUFDRCxRQUFRLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUEsSUFBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFO0tBQ3BFOzs7Ozs7OztBQUFDLEFBU0YsYUFBUyxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUIsTUFBQyxJQUFJLEdBQUcsQ0FBQztBQUNULE1BQUMsSUFBSSxHQUFHLENBQUM7QUFDVCxNQUFDLElBQUksR0FBRyxDQUFDO0FBQ1QsU0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxTQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLFNBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDZCxTQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFBRSxhQUFPLENBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFFLENBQUM7TUFBRTtBQUM3QyxTQUFJLENBQUMsR0FBRyxDQUFDLEtBQUcsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLEdBQUksQ0FBQyxLQUFHLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLEFBQUMsQ0FBQztBQUM1RCxZQUFPLENBQ04sRUFBRSxJQUFJLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLEVBQ2hCLEdBQUcsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFDWCxHQUFHLEdBQUcsQ0FBQyxDQUNQLENBQUM7S0FDRjs7Ozs7Ozs7QUFBQSxBQVNELGFBQVMsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzFCLFNBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFBLEFBQUMsQ0FBQzs7QUFFeEIsU0FBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ2YsYUFBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7TUFDbkI7O0FBRUQsTUFBQyxJQUFJLEVBQUUsQ0FBQztBQUNSLE1BQUMsSUFBSSxHQUFHLENBQUM7O0FBRVQsU0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixTQUFJLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxDQUFDO0FBQzVCLFNBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQ0FBQztBQUNwQixTQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUEsQUFBQyxDQUFDO0FBQ3hCLGFBQVEsQ0FBQztBQUNSLFdBQUssQ0FBQyxDQUFDO0FBQ1AsV0FBSyxDQUFDO0FBQUUsY0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN2QixXQUFLLENBQUM7QUFBRSxjQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUFBLEFBQ3ZCLFdBQUssQ0FBQztBQUFFLGNBQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDdkIsV0FBSyxDQUFDO0FBQUUsY0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN2QixXQUFLLENBQUM7QUFBRSxjQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUFBLEFBQ3ZCLFdBQUssQ0FBQztBQUFFLGNBQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsTUFDdkI7S0FDRDs7QUFHRCxhQUFTLFlBQVksR0FBSTtBQUN4QixRQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3JELFFBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4RCxZQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0tBQ3hCOztBQUdELGFBQVMsVUFBVSxHQUFJOzs7OztBQUt0QixTQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQzs7QUFFbkMsU0FBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDaEIsU0FBRyxDQUFDLE1BQU0sR0FBRztBQUNaLFlBQUssRUFBRSxJQUFJO0FBQ1gsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3BDLFVBQUcsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNuQyxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3BDLFVBQUcsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNuQyxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3BDLGFBQU0sRUFBRyxHQUFHLENBQUMsYUFBYSxFQUFFO0FBQzVCLFlBQUssRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNyQyxjQUFPLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDdkMsY0FBTyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3ZDLGNBQU8sRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN2QyxjQUFPLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDdkMsVUFBRyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ25DLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNwQyxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsY0FBTyxFQUFHLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRTtBQUNwQyxjQUFPLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDdkMsZUFBUSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3hDLGVBQVEsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN4QyxlQUFRLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDeEMsVUFBRyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ25DLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztBQUFBLE9BQ3JDLENBQUM7O0FBRUYsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xELFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUU1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUUzQyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztNQUM3Qzs7QUFFRCxTQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDOztBQUVuQixTQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25ELFNBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkMsU0FBSSxjQUFjLEdBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLEFBQUMsQ0FBQztBQUNoRyxTQUFJLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6RCxTQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUMxQixJQUFJLENBQUMsWUFBWSxFQUNqQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQUMsQUFDckMsU0FBSSxTQUFTLEdBQUcsV0FBVzs7O0FBQUMsQUFHNUIsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUM1QixNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUksSUFBSSxDQUFDO0FBQzdELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxBQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBSSxJQUFJLENBQUM7QUFDOUQsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNOzs7QUFBQyxBQUdsQyxNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNuQyxNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFcEMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUNuQyxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQ3hCLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdkIsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FB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QyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDaEQsQ0FBQzs7QUFHRixLQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBR2YsU0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDO0VBR2xCLENBQUEsRUFBRyxDQUFDO0NBQUUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBncmF2aXRvblxuICpcbiAqIEphdmFTY3JpcHQgTi1ib2R5IEdyYXZpdGF0aW9uYWwgU2ltdWxhdG9yXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IFphdmVuIE11cmFkeWFuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqXG4gKiBSZXZpc2lvbjpcbiAqICBAUkVWSVNJT05cbiAqL1xuaW1wb3J0IEd0QXBwIGZyb20gJy4vZ3Jhdml0b24vYXBwJztcblxuZXhwb3J0IGRlZmF1bHQgeyBhcHA6IEd0QXBwIH07XG4iLCIvKipcbiAqIGdyYXZpdG9uL2FwcCAtLSBUaGUgaW50ZXJhY3RpdmUgZ3Jhdml0b24gYXBwbGljYXRpb25cbiAqL1xuLyogZ2xvYmFsIGpzY29sb3IgKi9cblxuaW1wb3J0IHJhbmRvbSBmcm9tICcuLi91dGlsL3JhbmRvbSc7XG5pbXBvcnQgR3RTaW0gZnJvbSAnLi9zaW0nO1xuaW1wb3J0IEd0R2Z4IGZyb20gJy4vZ2Z4JztcbmltcG9ydCBHdEV2ZW50cywgeyBLRVlDT0RFUywgRVZFTlRDT0RFUywgQ09OVFJPTENPREVTIH0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IEd0VGltZXIgZnJvbSAnLi90aW1lcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0QXBwIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzID0ge30pIHtcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ncmlkID0gbnVsbDtcblxuICAgICAgICB0aGlzLmFuaW1UaW1lciA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaW0gPSBudWxsO1xuICAgICAgICB0aGlzLmdmeCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24gPSB7cHJldmlvdXM6IHt9fTtcbiAgICAgICAgdGhpcy50YXJnZXRCb2R5ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gYXJncy53aWR0aCA9IGFyZ3Mud2lkdGggfHwgd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSBhcmdzLmhlaWdodCA9IGFyZ3MuaGVpZ2h0IHx8IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvciA9IGFyZ3MuYmFja2dyb3VuZENvbG9yIHx8ICcjMUYyNjNCJztcblxuICAgICAgICAvLyBSZXRyaWV2ZSBjYW52YXMsIG9yIGJ1aWxkIG9uZSB3aXRoIGFyZ3VtZW50c1xuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVHcmlkKHRoaXMub3B0aW9ucy53aWR0aCwgdGhpcy5vcHRpb25zLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAge2JhY2tncm91bmRDb2xvcjogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcn0pO1xuICAgICAgICAgICAgYXJncy5ncmlkID0gdGhpcy5ncmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250cm9scyA9IHR5cGVvZiBhcmdzLmNvbnRyb2xzID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbnRyb2xzKSA6XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb250cm9scyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVDb250cm9scygpO1xuICAgICAgICAgICAgYXJncy5jb250cm9scyA9IHRoaXMuY29udHJvbHM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXlCdG4gPSBhcmdzLnBsYXlCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwbGF5YnRuJyk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4gPSBhcmdzLnBhdXNlQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcGF1c2VidG4nKTtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0biA9IGFyZ3MudHJhaWxPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyN0cmFpbG9mZmJ0bicpO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4gPSBhcmdzLnRyYWlsT25CdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyN0cmFpbG9uYnRuJyk7XG5cbiAgICAgICAgdGhpcy5jb2xvclBpY2tlciA9IHR5cGVvZiBhcmdzLmNvbG9yUGlja2VyID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbG9yUGlja2VyKSA6XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb2xvclBpY2tlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5jbGFzc05hbWUgPSAnYm9keWNvbG9ycGlja2VyJztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb2xvclBpY2tlcik7XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyID0gdGhpcy5jb2xvclBpY2tlcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmpzY29sb3IgPSBuZXcganNjb2xvcih0aGlzLmNvbG9yUGlja2VyLCB7XG4gICAgICAgICAgICB3aWR0aDogMTAxLFxuICAgICAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgICAgIHNoYWRvdzogZmFsc2UsXG4gICAgICAgICAgICBib3JkZXJXaWR0aDogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIGluc2V0Q29sb3I6ICcjMDAwJyxcbiAgICAgICAgICAgIG9uRmluZUNoYW5nZTogdGhpcy51cGRhdGVDb2xvci5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemVcbiAgICAgICAgdGhpcy5pbml0Q29tcG9uZW50cygpO1xuICAgICAgICB0aGlzLmluaXRUaW1lcnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBtYWluIC0tIE1haW4gJ2dhbWUnIGxvb3BcbiAgICAgKi9cbiAgICBtYWluKCkge1xuICAgICAgICAvLyBFdmVudCBwcm9jZXNzaW5nXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgdGhpcy5ldmVudHMucWdldCgpLmZvckVhY2goZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGxldCByZXR2YWw7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRURPV046XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5idXR0b24gPT09IC8qIHJpZ2h0IGNsaWNrICovIDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBib2R5LlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSAmJiAhdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0ucmVtb3ZlQm9keSh0aGlzLnRhcmdldEJvZHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5idXR0b24gPT09IC8qIG1pZGRsZSBjbGljayAqLyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb2xvciBwaWNraW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5ICYmICF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLmxlZnQgPSBldmVudC5wb3NpdGlvbi54ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLnRvcCA9IGV2ZW50LnBvc2l0aW9uLnkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanNjb2xvci5mcm9tU3RyaW5nKHRoaXMudGFyZ2V0Qm9keS5jb2xvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qc2NvbG9yLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLyogbGVmdCBjbGljayAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmFzZSB0aGUgY2hlY2sgb24gdGhlIHByZXZpb3VzIHZhbHVlLCBpbiBjYXNlIHRoZSBjb2xvciBwaWNrZXIgd2FzIGp1c3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsb3NlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBmbGFnIHRvIHNpZ25hbCBvdGhlciBldmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLmJvZHkgPSB0aGlzLnRhcmdldEJvZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5ib2R5ID0gdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQucG9zaXRpb24ueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcGlja2VyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VVUDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gdGhpcy5pbnRlcmFjdGlvbi5ib2R5O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFggPSAoZXZlbnQucG9zaXRpb24ueCAtIGJvZHkueCkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFkgPSAoZXZlbnQucG9zaXRpb24ueSAtIGJvZHkueSkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYXJnZXQoZXZlbnQucG9zaXRpb24ueCwgZXZlbnQucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFTU9WRTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy54ID0gZXZlbnQucG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy55ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgJiYgIXRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhcmdldChldmVudC5wb3NpdGlvbi54LCBldmVudC5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFTU9WRVxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFV0hFRUw6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keS5hZGp1c3RTaXplKGV2ZW50LmRlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFV0hFRUxcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5LRVlET1dOOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleWNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19FTlRFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfQzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBzaW11bGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdmeC5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltVGltZXIuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHZhbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSByYW5kb20gb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVCb2RpZXMoMTAsIHtyYW5kb21Db2xvcnM6IHRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1Q6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMub3B0aW9ucy53aWR0aCAvIDIsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNzOiAyMDAwLCByYWRpdXM6IDUwLCBjb2xvcjogJyM1QTVBNUEnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMub3B0aW9ucy53aWR0aCAtIDQwMCwgeTogdGhpcy5vcHRpb25zLmhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlbFg6IDAsIHZlbFk6IDAuMDAwMDI1LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNzOiAxLCByYWRpdXM6IDUsIGNvbG9yOiAnIzc4Nzg3OCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIEtFWURPV05cblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlBMQVlCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUEFVU0VCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuVFJBSUxPRkZCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuVFJBSUxPTkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIFJlZHJhdyBzY3JlZW5cbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcbiAgICB9XG5cbiAgICBpbml0Q29tcG9uZW50cygpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGNvbXBvbmVudHMgLS0gb3JkZXIgaXMgaW1wb3J0YW50XG4gICAgICAgIHRoaXMuZXZlbnRzID0gdGhpcy5hcmdzLmV2ZW50cyA9IG5ldyBHdEV2ZW50cyh0aGlzLmFyZ3MpO1xuICAgICAgICB0aGlzLnNpbSA9IG5ldyBHdFNpbSh0aGlzLmFyZ3MpO1xuICAgICAgICB0aGlzLmdmeCA9IG5ldyBHdEdmeCh0aGlzLmFyZ3MpO1xuICAgIH1cblxuICAgIGluaXRUaW1lcnMoKSB7XG4gICAgICAgIC8vIEFkZCBgbWFpbmAgbG9vcCwgYW5kIHN0YXJ0IGltbWVkaWF0ZWx5XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyID0gbmV3IEd0VGltZXIodGhpcy5tYWluLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmFuaW1UaW1lci5zdGFydCgpO1xuICAgICAgICB0aGlzLnNpbVRpbWVyID0gbmV3IEd0VGltZXIodGhpcy5zaW0uc3RlcC5iaW5kKHRoaXMuc2ltKSwgNjApO1xuICAgIH1cblxuICAgIHRvZ2dsZVNpbSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2ltVGltZXIuYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wbGF5QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpbVRpbWVyLnRvZ2dsZSgpO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWlscygpIHtcbiAgICAgICAgaWYgKHRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHJhaWxPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMudHJhaWxPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gIXRoaXMubm9jbGVhcjtcbiAgICB9XG5cbiAgICByZWRyYXcoKSB7XG4gICAgICAgIGlmICghdGhpcy5ub2NsZWFyKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd0ludGVyYWN0aW9uKCk7XG4gICAgICAgIHRoaXMuZ2Z4LmRyYXdCb2RpZXModGhpcy5zaW0uYm9kaWVzLCB0aGlzLnRhcmdldEJvZHkpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlR3JpZCh3aWR0aCwgaGVpZ2h0LCBzdHlsZSkge1xuICAgICAgICAvLyBBdHRhY2ggYSBjYW52YXMgdG8gdGhlIHBhZ2UsIHRvIGhvdXNlIHRoZSBzaW11bGF0aW9uc1xuICAgICAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cbiAgICAgICAgdGhpcy5ncmlkLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuZ3JpZC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLm1hcmdpbkxlZnQgPSBzdHlsZS5tYXJnaW5MZWZ0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLm1hcmdpblJpZ2h0ID0gc3R5bGUubWFyZ2luUmlnaHQgfHwgJ2F1dG8nO1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gc3R5bGUuYmFja2dyb3VuZENvbG9yIHx8ICcjMDAwMDAwJztcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZ3JpZCk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVDb250cm9scygpIHtcbiAgICAgICAgdGhpcy5jb250cm9scyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ21lbnUnKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50eXBlID0gJ3Rvb2xiYXInO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmlkID0gJ2NvbnRyb2xzJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJwbGF5YnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvcGxheS5zdmdcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJwYXVzZWJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wYXVzZS5zdmdcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJ0cmFpbG9mZmJ0blwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3RyYWlsX29mZi5zdmdcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJ0cmFpbG9uYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3RyYWlsX29uLnN2Z1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIGA7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRyb2xzKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZUJvZGllcyhudW0sIGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgbGV0IG1pblggPSBhcmdzLm1pblggfHwgMDtcbiAgICAgICAgbGV0IG1heFggPSBhcmdzLm1heFggfHwgdGhpcy5vcHRpb25zLndpZHRoO1xuICAgICAgICBsZXQgbWluWSA9IGFyZ3MubWluWSB8fCAwO1xuICAgICAgICBsZXQgbWF4WSA9IGFyZ3MubWF4WSB8fCB0aGlzLm9wdGlvbnMuaGVpZ2h0O1xuXG4gICAgICAgIGxldCBtaW5WZWxYID0gYXJncy5taW5WZWxYIHx8IDA7XG4gICAgICAgIGxldCBtYXhWZWxYID0gYXJncy5tYXhWZWxYIHx8IDAuMDAwMDE7XG4gICAgICAgIGxldCBtaW5WZWxZID0gYXJncy5taW5WZWxZIHx8IDA7XG4gICAgICAgIGxldCBtYXhWZWxZID0gYXJncy5tYXhWZWxZIHx8IDAuMDAwMDE7XG5cbiAgICAgICAgbGV0IG1pbk1hc3MgPSBhcmdzLm1pbk1hc3MgfHwgMTtcbiAgICAgICAgbGV0IG1heE1hc3MgPSBhcmdzLm1heE1hc3MgfHwgMTUwO1xuXG4gICAgICAgIGxldCBtaW5SYWRpdXMgPSBhcmdzLm1pblJhZGl1cyB8fCAxO1xuICAgICAgICBsZXQgbWF4UmFkaXVzID0gYXJncy5tYXhSYWRpdXMgfHwgMTU7XG5cbiAgICAgICAgbGV0IGNvbG9yID0gYXJncy5jb2xvcjtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYXJncy5yYW5kb21Db2xvcnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBjb2xvciA9IHJhbmRvbS5jb2xvcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNpbS5hZGROZXdCb2R5KHtcbiAgICAgICAgICAgICAgICB4OiByYW5kb20ubnVtYmVyKG1pblgsIG1heFgpLFxuICAgICAgICAgICAgICAgIHk6IHJhbmRvbS5udW1iZXIobWluWSwgbWF4WSksXG4gICAgICAgICAgICAgICAgdmVsWDogcmFuZG9tLmRpcmVjdGlvbmFsKG1pblZlbFgsIG1heFZlbFgpLFxuICAgICAgICAgICAgICAgIHZlbFk6IHJhbmRvbS5kaXJlY3Rpb25hbChtaW5WZWxZLCBtYXhWZWxZKSxcbiAgICAgICAgICAgICAgICBtYXNzOiByYW5kb20ubnVtYmVyKG1pbk1hc3MsIG1heE1hc3MpLFxuICAgICAgICAgICAgICAgIHJhZGl1czogcmFuZG9tLm51bWJlcihtaW5SYWRpdXMsIG1heFJhZGl1cyksXG4gICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdJbnRlcmFjdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5nZnguZHJhd1JldGljbGVMaW5lKHRoaXMuaW50ZXJhY3Rpb24uYm9keSwgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVUYXJnZXQoeCwgeSkge1xuICAgICAgICB0aGlzLnRhcmdldEJvZHkgPSB0aGlzLnNpbS5nZXRCb2R5QXQoeCwgeSk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29sb3IoKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keS51cGRhdGVDb2xvcih0aGlzLmpzY29sb3IudG9IRVhTdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0NvbG9yUGlja2VyQWN0aXZlKCkge1xuICAgICAgICB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlID0gdGhpcy5jb2xvclBpY2tlci5jbGFzc05hbWUuaW5kZXhPZignanNjb2xvci1hY3RpdmUnKSA+IC0xO1xuICAgICAgICByZXR1cm4gdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9hcHBcbiIsImltcG9ydCBjb2xvcnMgZnJvbSAnLi4vdXRpbC9jb2xvcnMnO1xuXG4vKipcbiAqIGdyYXZpdG9uL2JvZHkgLS0gVGhlIGdyYXZpdGF0aW9uYWwgYm9keVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEJvZHkge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy54ID0gYXJncy54O1xuICAgICAgICB0aGlzLnkgPSBhcmdzLnk7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy54ICE9PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy55ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0NvcnJlY3QgcG9zaXRpb25zIHdlcmUgbm90IGdpdmVuIGZvciB0aGUgYm9keS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmVsWCA9IGFyZ3MudmVsWCB8fCAwO1xuICAgICAgICB0aGlzLnZlbFkgPSBhcmdzLnZlbFkgfHwgMDtcblxuICAgICAgICB0aGlzLnJhZGl1cyA9IGFyZ3MucmFkaXVzIHx8IDEwO1xuICAgICAgICAvLyBJbml0aWFsaXplZCBiZWxvdy5cbiAgICAgICAgdGhpcy5tYXNzID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmNvbG9yID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0aGlzLnVwZGF0ZUNvbG9yKGFyZ3MuY29sb3IgfHwgJyNCQUJBQkEnKTtcbiAgICAgICAgdGhpcy5hZGp1c3RTaXplKDApO1xuICAgIH1cblxuICAgIGFkanVzdFNpemUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBNYXRoLm1heCh0aGlzLnJhZGl1cyArIGRlbHRhLCAyKTtcbiAgICAgICAgLy8gRG9ya3kgZm9ybXVsYSB0byBtYWtlIG1hc3Mgc2NhbGUgXCJwcm9wZXJseVwiIHdpdGggcmFkaXVzLlxuICAgICAgICB0aGlzLm1hc3MgPSBNYXRoLnBvdyh0aGlzLnJhZGl1cyAvIDQsIDMpO1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbG9yKGNvbG9yKSB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSBjb2xvcnMudG9IZXgoY29sb3JzLmJyaWdodGVuKGNvbG9ycy5mcm9tSGV4KHRoaXMuY29sb3IpLCAuMjUpKTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9ib2R5XG4iLCIvKipcbiAqIGdyYXZpdG9uL2V2ZW50cyAtLSBFdmVudCBxdWV1ZWluZyBhbmQgcHJvY2Vzc2luZ1xuICovXG5leHBvcnQgY29uc3QgS0VZQ09ERVMgPSB7XG4gICAgS19MRUZUOiAzNyxcbiAgICBLX1VQOiAzOCxcbiAgICBLX1JJR0hUOiAzOSxcbiAgICBLX0RPV046IDQwLFxuXG4gICAgS18wOiA0OCxcbiAgICBLXzE6IDQ5LFxuICAgIEtfMjogNTAsXG4gICAgS18zOiA1MSxcbiAgICBLXzQ6IDUyLFxuICAgIEtfNTogNTMsXG4gICAgS182OiA1NCxcbiAgICBLXzc6IDU1LFxuICAgIEtfODogNTYsXG4gICAgS185OiA1NyxcblxuICAgIEtfQTogNjUsXG4gICAgS19COiA2NixcbiAgICBLX0M6IDY3LFxuICAgIEtfRDogNjgsXG4gICAgS19FOiA2OSxcbiAgICBLX0Y6IDcwLFxuICAgIEtfRzogNzEsXG4gICAgS19IOiA3MixcbiAgICBLX0k6IDczLFxuICAgIEtfSjogNzQsXG4gICAgS19LOiA3NSxcbiAgICBLX0w6IDc2LFxuICAgIEtfTTogNzcsXG4gICAgS19OOiA3OCxcbiAgICBLX086IDc5LFxuICAgIEtfUDogODAsXG4gICAgS19ROiA4MSxcbiAgICBLX1I6IDgyLFxuICAgIEtfUzogODMsXG4gICAgS19UOiA4NCxcbiAgICBLX1U6IDg1LFxuICAgIEtfVjogODYsXG4gICAgS19XOiA4NyxcbiAgICBLX1g6IDg4LFxuICAgIEtfWTogODksXG4gICAgS19aOiA5MCxcblxuICAgIEtfS1AxOiA5NyxcbiAgICBLX0tQMjogOTgsXG4gICAgS19LUDM6IDk5LFxuICAgIEtfS1A0OiAxMDAsXG4gICAgS19LUDU6IDEwMSxcbiAgICBLX0tQNjogMTAyLFxuICAgIEtfS1A3OiAxMDMsXG4gICAgS19LUDg6IDEwNCxcbiAgICBLX0tQOTogMTA1LFxuXG4gICAgS19CQUNLU1BBQ0U6IDgsXG4gICAgS19UQUI6IDksXG4gICAgS19FTlRFUjogMTMsXG4gICAgS19TSElGVDogMTYsXG4gICAgS19DVFJMOiAxNyxcbiAgICBLX0FMVDogMTgsXG4gICAgS19FU0M6IDI3LFxuICAgIEtfU1BBQ0U6IDMyXG59O1xuXG5leHBvcnQgY29uc3QgTU9VU0VDT0RFUyA9IHtcbiAgICBNX0xFRlQ6IDAsXG4gICAgTV9NSURETEU6IDEsXG4gICAgTV9SSUdIVDogMlxufTtcblxuZXhwb3J0IGNvbnN0IEVWRU5UQ09ERVMgPSB7XG4gICAgTU9VU0VET1dOOiAxMDAwLFxuICAgIE1PVVNFVVA6IDEwMDEsXG4gICAgTU9VU0VNT1ZFOiAxMDAyLFxuICAgIE1PVVNFV0hFRUw6IDEwMDMsXG4gICAgQ0xJQ0s6IDEwMDQsXG4gICAgREJMQ0xJQ0s6IDEwMDUsXG5cbiAgICBLRVlET1dOOiAxMDEwLFxuICAgIEtFWVVQOiAxMDExXG59O1xuXG5leHBvcnQgY29uc3QgQ09OVFJPTENPREVTID0ge1xuICAgIFBMQVlCVE46IDIwMDAsXG4gICAgUEFVU0VCVE46IDIwMDEsXG4gICAgVFJBSUxPRkZCVE46IDIwMDIsXG4gICAgVFJBSUxPTkJUTjogMjAwM1xufTtcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEV2ZW50cyB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzLmdyaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignTm8gdXNhYmxlIGNhbnZhcyBlbGVtZW50IHdhcyBnaXZlbi4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdyaWQgPSBhcmdzLmdyaWQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBhcmdzLmNvbnRyb2xzO1xuICAgICAgICB0aGlzLnBsYXlCdG4gPSBhcmdzLnBsYXlCdG47XG4gICAgICAgIHRoaXMucGF1c2VCdG4gPSBhcmdzLnBhdXNlQnRuO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuID0gYXJncy50cmFpbE9mZkJ0bjtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuID0gYXJncy50cmFpbE9uQnRuO1xuXG4gICAgICAgIHRoaXMud2lyZXVwRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgcWFkZChldmVudCkge1xuICAgICAgICB0aGlzLnF1ZXVlLnB1c2goZXZlbnQpO1xuICAgIH1cblxuICAgIHFwb2xsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgIH1cblxuICAgIHFnZXQoKSB7XG4gICAgICAgIC8vIFJlcGxhY2luZyB0aGUgcmVmZXJlbmNlIGlzIGZhc3RlciB0aGFuIGBzcGxpY2UoKWBcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMucXVldWU7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgICAgcmV0dXJuIHJlZjtcbiAgICB9XG5cbiAgICBxY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICB9XG5cbiAgICB3aXJldXBFdmVudHMoKSB7XG4gICAgICAgIC8vIEdyaWQgbW91c2UgZXZlbnRzXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuaGFuZGxlRGJsQ2xpY2suYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5oYW5kbGVDb250ZXh0TWVudS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlTW91c2VEb3duLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuaGFuZGxlTW91c2VVcC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlTW91c2VNb3ZlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLmhhbmRsZU1vdXNlV2hlZWwuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gR3JpZCBrZXkgZXZlbnRzXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5oYW5kbGVLZXlVcC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBDb250cm9sIGV2ZW50c1xuICAgICAgICB0aGlzLnBsYXlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QTEFZQlROKSk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QQVVTRUJUTikpO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPRkZCVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPTkJUTikpO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLkNMSUNLLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlRGJsQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuREJMQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250ZXh0TWVudShldmVudCkge1xuICAgICAgICAvLyBQcmV2ZW50IHJpZ2h0LWNsaWNrIG1lbnVcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZURvd24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VET1dOLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRVVQLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFTU9WRSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlV2hlZWwoZXZlbnQpIHtcbiAgICAgICAgLy8gUmV2ZXJzZSB0aGUgdXAvZG93bi5cbiAgICAgICAgbGV0IGRlbHRhID0gLWV2ZW50LmRlbHRhWSAvIDUwO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFV0hFRUwsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBkZWx0YTogZGVsdGEsXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUHJldmVudCB0aGUgd2luZG93IGZyb20gc2Nyb2xsaW5nXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgaGFuZGxlS2V5RG93bihldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZRE9XTixcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlVcChldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZVVAsXG4gICAgICAgICAgICBrZXljb2RlOiBrZXksXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ29udHJvbENsaWNrKHR5cGUsIGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0UG9zaXRpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIG9mZnNldCBvbiB0aGUgZ3JpZCBmcm9tIGNsaWVudFgvWSwgYmVjYXVzZVxuICAgICAgICAvLyBzb21lIGJyb3dzZXJzIGRvbid0IGhhdmUgZXZlbnQub2Zmc2V0WC9ZXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5jbGllbnRYIC0gdGhpcy5ncmlkLm9mZnNldExlZnQsXG4gICAgICAgICAgICB5OiBldmVudC5jbGllbnRZIC0gdGhpcy5ncmlkLm9mZnNldFRvcFxuICAgICAgICB9O1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2V2ZW50c1xuIiwiLyoqXG4gKiBncmF2aXRvbi9nZnggLS0gVGhlIGdyYXBoaWNzIG9iamVjdFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEdmeCB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmdyaWQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgLy8gU2V0dGluZyB0aGUgd2lkdGggaGFzIHRoZSBzaWRlIGVmZmVjdFxuICAgICAgICAvLyBvZiBjbGVhcmluZyB0aGUgY2FudmFzXG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHRoaXMuZ3JpZC53aWR0aDtcbiAgICB9XG5cbiAgICBkcmF3Qm9kaWVzKGJvZGllcywgdGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBib2R5IG9mIGJvZGllcykge1xuICAgICAgICAgICAgdGhpcy5kcmF3Qm9keShib2R5LCAvKiBpc1RhcmdldGVkICovIGJvZHkgPT09IHRhcmdldEJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0JvZHkoYm9keSwgaXNUYXJnZXRlZCkge1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBib2R5LmNvbG9yO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5hcmMoYm9keS54LCBib2R5LnksIGJvZHkucmFkaXVzLCAwLCBNYXRoLlBJICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuICAgICAgICBpZiAoaXNUYXJnZXRlZCkge1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBib2R5LmhpZ2hsaWdodDtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IE1hdGgucm91bmQoYm9keS5yYWRpdXMgLyA4KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd1JldGljbGVMaW5lKGZyb20sIHRvKSB7XG4gICAgICAgIGxldCBncmFkID0gdGhpcy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoZnJvbS54LCBmcm9tLnksIHRvLngsIHRvLnkpO1xuICAgICAgICBncmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgzMSwgNzUsIDEzMCwgMSknKTtcbiAgICAgICAgZ3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMzEsIDc1LCAxMzAsIDAuMSknKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBncmFkO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSA2O1xuICAgICAgICB0aGlzLmN0eC5saW5lQ2FwID0gJ3JvdW5kJztcblxuICAgICAgICAvLyBEcmF3IGluaXRpYWwgYmFja2dyb3VuZCBsaW5lLlxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGZyb20ueCwgZnJvbS55KTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRvLngsIHRvLnkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICAvLyBEcmF3IG92ZXJsYXkgbGluZS5cbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAnIzM0NzdDQSc7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oZnJvbS54LCBmcm9tLnkpO1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8odG8ueCwgdG8ueSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2dmeFxuIiwiLyoqXG4gKiBncmF2aXRvbi9zaW0gLS0gVGhlIGdyYXZpdGF0aW9uYWwgc2ltdWxhdG9yXG4gKi9cbmltcG9ydCBsb2cgZnJvbSAnLi4vdXRpbC9sb2cnO1xuaW1wb3J0IEd0Qm9keSBmcm9tICcuL2JvZHknO1xuaW1wb3J0IEd0VHJlZSBmcm9tICcuL3RyZWUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFNpbSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ib2RpZXMgPSBbXTtcbiAgICAgICAgdGhpcy50cmVlID0gbmV3IEd0VHJlZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCk7XG4gICAgICAgIHRoaXMudGltZSA9IDA7XG5cbiAgICAgICAgLy8gVGVtcG9yYXJ5IHdvcmtzcGFjZVxuICAgICAgICB0aGlzLkQgPSB7fTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMuRyA9IGFyZ3MuRyB8fCA2LjY3Mzg0ICogTWF0aC5wb3coMTAsIC0xMSk7IC8vIEdyYXZpdGF0aW9uYWwgY29uc3RhbnRcbiAgICAgICAgdGhpcy5vcHRpb25zLm11bHRpcGxpZXIgPSBhcmdzLm11bHRpcGxpZXIgfHwgMTUwMDsgLy8gVGltZXN0ZXBcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbGxpc2lvbnMgPSBhcmdzLmNvbGxpc2lvbiB8fCB0cnVlO1xuICAgICAgICB0aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0ID0gYXJncy5zY2F0dGVyTGltaXQgfHwgMTAwMDA7XG4gICAgfVxuXG4gICAgc3RlcChlbGFwc2VkKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29sbGlzaW9ucyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IElzIHRoaXMgdXNlZnVsP1xuICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0Q29sbGlzaW9uKGJvZHksIGkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZU5ld1Bvc2l0aW9uKGJvZHksIGksIGVsYXBzZWQgKiB0aGlzLm9wdGlvbnMubXVsdGlwbGllcik7XG5cbiAgICAgICAgICAgIGkgPSB0aGlzLnJlbW92ZVNjYXR0ZXJlZChib2R5LCBpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGltZSArPSBlbGFwc2VkOyAvLyBJbmNyZW1lbnQgcnVudGltZVxuICAgIH1cblxuICAgIGNhbGN1bGF0ZU5ld1Bvc2l0aW9uKGJvZHksIGluZGV4LCBkZWx0YVQpIHtcbiAgICAgICAgbGV0IG5ldEZ4ID0gMDtcbiAgICAgICAgbGV0IG5ldEZ5ID0gMDtcblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGJvZGllcyBhbmQgc3VtIHRoZSBmb3JjZXMgZXhlcnRlZFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyYWN0b3IgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCkge1xuICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgZGlzdGFuY2UgYW5kIHBvc2l0aW9uIGRlbHRhc1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRGlzdGFuY2UoYm9keSwgYXR0cmFjdG9yKTtcblxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBmb3JjZSB1c2luZyBOZXd0b25pYW4gZ3Jhdml0eSwgc2VwYXJhdGUgb3V0IGludG8geCBhbmQgeSBjb21wb25lbnRzXG4gICAgICAgICAgICAgICAgbGV0IEYgPSAodGhpcy5vcHRpb25zLkcgKiBib2R5Lm1hc3MgKiBhdHRyYWN0b3IubWFzcykgLyBNYXRoLnBvdyh0aGlzLkQuciwgMik7XG4gICAgICAgICAgICAgICAgbGV0IEZ4ID0gRiAqICh0aGlzLkQuZHggLyB0aGlzLkQucik7XG4gICAgICAgICAgICAgICAgbGV0IEZ5ID0gRiAqICh0aGlzLkQuZHkgLyB0aGlzLkQucik7XG5cbiAgICAgICAgICAgICAgICBuZXRGeCArPSBGeDtcbiAgICAgICAgICAgICAgICBuZXRGeSArPSBGeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBhY2NlbGVyYXRpb25zXG4gICAgICAgIGxldCBheCA9IG5ldEZ4IC8gYm9keS5tYXNzO1xuICAgICAgICBsZXQgYXkgPSBuZXRGeSAvIGJvZHkubWFzcztcblxuICAgICAgICAvLyBDYWxjdWxhdGUgbmV3IHZlbG9jaXRpZXMsIG5vcm1hbGl6ZWQgYnkgdGhlICd0aW1lJyBpbnRlcnZhbFxuICAgICAgICBib2R5LnZlbFggKz0gZGVsdGFUICogYXg7XG4gICAgICAgIGJvZHkudmVsWSArPSBkZWx0YVQgKiBheTtcblxuICAgICAgICAvLyBDYWxjdWxhdGUgbmV3IHBvc2l0aW9ucyBhZnRlciB0aW1lc3RlcCBkZWx0YVRcbiAgICAgICAgYm9keS54ICs9IGRlbHRhVCAqIGJvZHkudmVsWDtcbiAgICAgICAgYm9keS55ICs9IGRlbHRhVCAqIGJvZHkudmVsWTtcbiAgICB9XG5cbiAgICBjYWxjdWxhdGVEaXN0YW5jZShib2R5LCBvdGhlcikge1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNoYW5nZSBpbiBwb3NpdGlvbiBhbG9uZyB0aGUgdHdvIGRpbWVuc2lvbnNcbiAgICAgICAgdGhpcy5ELmR4ID0gb3RoZXIueCAtIGJvZHkueDtcbiAgICAgICAgdGhpcy5ELmR5ID0gb3RoZXIueSAtIGJvZHkueTtcblxuICAgICAgICAvLyBPYnRhaW4gdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIG9iamVjdHMgKGh5cG90ZW51c2UpXG4gICAgICAgIHRoaXMuRC5yID0gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuRC5keCwgMikgKyBNYXRoLnBvdyh0aGlzLkQuZHksIDIpKTtcbiAgICB9XG5cbiAgICBkZXRlY3RDb2xsaXNpb24oYm9keSwgaW5kZXgpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY29sbGlkZXIgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmIChpICE9PSBpbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRGlzdGFuY2UoYm9keSwgY29sbGlkZXIpO1xuICAgICAgICAgICAgICAgIGxldCBjbGVhcmFuY2UgPSBib2R5LnJhZGl1cyArIGNvbGxpZGVyLnJhZGl1cztcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLkQuciA8PSBjbGVhcmFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29sbGlzaW9uIGRldGVjdGVkXG4gICAgICAgICAgICAgICAgICAgIGxvZy53cml0ZSgnQ29sbGlzaW9uIGRldGVjdGVkISEnLCAnZGVidWcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW1vdmVTY2F0dGVyZWQoYm9keSwgaW5kZXgpIHtcbiAgICAgICAgaWYgKGJvZHkueCA+IHRoaXMub3B0aW9ucy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgIGJvZHkueCA8IC10aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0IHx8XG4gICAgICAgICAgICBib2R5LnkgPiB0aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0IHx8XG4gICAgICAgICAgICBib2R5LnkgPCAtdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCkge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGZyb20gYm9keSBjb2xsZWN0aW9uXG4gICAgICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgZm9yIHRyZWUuXG4gICAgICAgICAgICB0aGlzLmJvZGllcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4IC0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuXG4gICAgYWRkTmV3Qm9keShhcmdzKSB7XG4gICAgICAgIGxldCBib2R5ID0gbmV3IEd0Qm9keShhcmdzKTtcbiAgICAgICAgdGhpcy5ib2RpZXMucHVzaChib2R5KTtcbiAgICAgICAgdGhpcy50cmVlLmFkZEJvZHkoYm9keSk7XG5cbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfVxuXG4gICAgcmVtb3ZlQm9keSh0YXJnZXRCb2R5KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmIChib2R5ID09PSB0YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ib2RpZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVzZXRUcmVlKCk7XG4gICAgfVxuXG4gICAgZ2V0Qm9keUF0KHgsIHkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuYm9kaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBjb25zdCBpc01hdGNoID0gTWF0aC5hYnMoeCAtIGJvZHkueCkgPD0gYm9keS5yYWRpdXMgJiZcbiAgICAgICAgICAgICAgICBNYXRoLmFicyh5IC0gYm9keS55KSA8PSBib2R5LnJhZGl1cztcbiAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5ib2RpZXMubGVuZ3RoID0gMDsgLy8gUmVtb3ZlIGFsbCBib2RpZXMgZnJvbSBjb2xsZWN0aW9uXG4gICAgICAgIHRoaXMucmVzZXRUcmVlKCk7XG4gICAgfVxuXG4gICAgcmVzZXRUcmVlKCkge1xuICAgICAgICB0aGlzLnRyZWUuY2xlYXIoKTtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkQm9keShib2R5KTtcbiAgICAgICAgfVxuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3NpbVxuIiwiLyoqXG4gKiBncmF2aXRvbi90aW1lciAtLSBTaW0gdGltZXIgYW5kIEZQUyBsaW1pdGVyXG4gKi9cbmltcG9ydCBlbnYgZnJvbSAnLi4vdXRpbC9lbnYnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRpbWVyIHtcbiAgICBjb25zdHJ1Y3RvcihmbiwgZnBzPW51bGwpIHtcbiAgICAgICAgdGhpcy5fZm4gPSBmbjtcbiAgICAgICAgdGhpcy5fZnBzID0gZnBzO1xuICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc0FuaW1hdGlvbiA9IGZwcyA9PT0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3dpbmRvdyA9IGVudi5nZXRXaW5kb3coKTtcbiAgICB9XG5cbiAgICBnZXQgYWN0aXZlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNBY3RpdmU7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luQW5pbWF0aW9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luSW50ZXJ2YWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5fY2FuY2VsbGF0aW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9iZWdpbkFuaW1hdGlvbigpIHtcbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGxldCBhbmltYXRvciA9ICh0aW1lc3RhbXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRGVsYXkgaW5pdGlhbCBleGVjdXRpb24gdW50aWwgdGhlIG5leHQgdGljay5cbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICB9XG5cbiAgICBfYmVnaW5JbnRlcnZhbCgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgZGVsYXkgcGVyIHRpY2ssIGluIG1pbGxpc2Vjb25kcy5cbiAgICAgICAgbGV0IHRpbWVvdXQgPSAxMDAwIC8gdGhpcy5fZnBzIHwgMDtcblxuICAgICAgICBsZXQgbGFzdFRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgICAgIHRoaXMuX2ZuKHRpbWVzdGFtcCAtIGxhc3RUaW1lc3RhbXApO1xuICAgICAgICAgICAgbGFzdFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3RpbWVyXG4iLCIvKipcbiAqIGdyYXZpdG9uL3RyZWUgLS0gVGhlIGdyYXZpdGF0aW9uYWwgYm9keSB0cmVlIHN0cnVjdHVyZVxuICovXG5jbGFzcyBHdFRyZWVOb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihzdGFydFgsIHN0YXJ0WSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICB0aGlzLnN0YXJ0WCA9IHN0YXJ0WDtcbiAgICAgICAgdGhpcy5zdGFydFkgPSBzdGFydFk7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuaGFsZldpZHRoID0gd2lkdGggLyAyO1xuICAgICAgICB0aGlzLmhhbGZIZWlnaHQgPSBoZWlnaHQgLyAyO1xuXG4gICAgICAgIHRoaXMubWlkWCA9IHRoaXMuc3RhcnRYICsgdGhpcy5oYWxmV2lkdGg7XG4gICAgICAgIHRoaXMubWlkWSA9IHRoaXMuc3RhcnRZICsgdGhpcy5oYWxmSGVpZ2h0O1xuXG4gICAgICAgIHRoaXMubWFzcyA9IDA7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG5cbiAgICAgICAgLy8gW05XLCBORSwgU1csIFNFXVxuICAgICAgICB0aGlzLmNoaWxkcmVuID0gbmV3IEFycmF5KDQpO1xuICAgIH1cblxuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICB0aGlzLnVwZGF0ZU1hc3MoYm9keSk7XG4gICAgICAgIGNvbnN0IHF1YWRyYW50ID0gdGhpcy5nZXRRdWFkcmFudChib2R5LngsIGJvZHkueSk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSkge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBib2R5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XTtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRYID0gZXhpc3RpbmcueCA+IHRoaXMubWlkWCA/IHRoaXMubWlkWCA6IHRoaXMuc3RhcnRYO1xuICAgICAgICAgICAgY29uc3QgcXVhZFkgPSBleGlzdGluZy55ID4gdGhpcy5taWRZID8gdGhpcy5taWRZIDogdGhpcy5zdGFydFk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbmV3IEd0VHJlZU5vZGUocXVhZFgsIHF1YWRZLCB0aGlzLmhhbGZXaWR0aCwgdGhpcy5oYWxmSGVpZ2h0KTtcblxuICAgICAgICAgICAgbm9kZS5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShib2R5KTtcblxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBub2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlTWFzcyhib2R5KSB7XG4gICAgICAgIGNvbnN0IG5ld01hc3MgPSB0aGlzLm1hc3MgKyBib2R5Lm1hc3M7XG4gICAgICAgIGNvbnN0IG5ld1ggPSAodGhpcy54ICogdGhpcy5tYXNzICsgYm9keS54ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIGNvbnN0IG5ld1kgPSAodGhpcy55ICogdGhpcy5tYXNzICsgYm9keS55ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIHRoaXMubWFzcyA9IG5ld01hc3M7XG4gICAgICAgIHRoaXMueCA9IG5ld1g7XG4gICAgICAgIHRoaXMueSA9IG5ld1k7XG4gICAgfVxuXG4gICAgZ2V0UXVhZHJhbnQoeCwgeSkge1xuICAgICAgICBjb25zdCB4SW5kZXggPSBOdW1iZXIoeCA+IHRoaXMubWlkWCk7XG4gICAgICAgIGNvbnN0IHlJbmRleCA9IE51bWJlcih5ID4gdGhpcy5taWRZKSAqIDI7XG4gICAgICAgIHJldHVybiB4SW5kZXggKyB5SW5kZXg7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRyZWUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgR3RUcmVlTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMucm9vdCkge1xuICAgICAgICAgICAgdGhpcy5yb290ID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yb290O1xuICAgICAgICAgICAgdGhpcy5yb290ID0gbmV3IEd0VHJlZU5vZGUoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoZXhpc3RpbmcpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3RyZWVcbiIsImltcG9ydCAnLi92ZW5kb3IvanNjb2xvcic7XG5pbXBvcnQgJy4vcG9seWZpbGxzJztcbmltcG9ydCBndCBmcm9tICcuL2dyYXZpdG9uJztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFN0YXJ0IHRoZSBtYWluIGdyYXZpdG9uIGFwcC5cbiAgICB3aW5kb3cuZ3Jhdml0b24gPSBuZXcgZ3QuYXBwKCk7XG59O1xuIiwid2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcbiAgICB9O1xuXG53aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICBmdW5jdGlvbih0aW1lb3V0SWQpIHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH07XG5cbndpbmRvdy5wZXJmb3JtYW5jZSA9IHdpbmRvdy5wZXJmb3JtYW5jZSB8fCB7fTtcbndpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93IHx8XG4gICAgd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdyB8fFxuICAgIHdpbmRvdy5wZXJmb3JtYW5jZS5tb3pOb3cgfHxcbiAgICBEYXRlLm5vdztcbiIsIi8qKlxuICogY29sb3JzIC0tIENvbG9yIG1hbmlwdWxhdGlvbiBoZWxwZXJzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBicmlnaHRlbihjb2xvckFycmF5LCBwZXJjZW50KSB7XG4gICAgICAgIGxldCBbciwgZywgYl0gPSBjb2xvckFycmF5O1xuICAgICAgICByID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCByICsgKHIgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICBnID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCBnICsgKGcgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICBiID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCBiICsgKGIgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICByZXR1cm4gW3IsIGcsIGJdO1xuICAgIH0sXG5cbiAgICBmcm9tSGV4KGhleCkge1xuICAgICAgICBsZXQgaCA9IGhleC5yZXBsYWNlKCcjJywgJycpO1xuICAgICAgICBpZiAoaC5sZW5ndGggPCA2KSB7XG4gICAgICAgICAgICBoID0gaC5yZXBsYWNlKC8oLikvZywgJyQxJDEnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3BhcnNlSW50KGguc3Vic3RyKDAsIDIpLCAxNiksXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQoaC5zdWJzdHIoMiwgMiksIDE2KSxcbiAgICAgICAgICAgICAgICBwYXJzZUludChoLnN1YnN0cig0LCAyKSwgMTYpXTtcbiAgICB9LFxuXG4gICAgdG9IZXgoY29sb3JBcnJheSkge1xuICAgICAgICBjb25zdCBbciwgZywgYl0gPSBjb2xvckFycmF5O1xuICAgICAgICByZXR1cm4gJyMnICsgKCcwJyArIHIudG9TdHJpbmcoMTYpKS5zdWJzdHIociA8IDE2ID8gMCA6IDEpICtcbiAgICAgICAgICAgICAgICAgICAgICgnMCcgKyBnLnRvU3RyaW5nKDE2KSkuc3Vic3RyKGcgPCAxNiA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgICAgICAoJzAnICsgYi50b1N0cmluZygxNikpLnN1YnN0cihiIDwgMTYgPyAwIDogMSk7XG4gICAgfVxufTtcbiIsIi8qKlxuICogZW52IC0gRW52aXJvbm1lbnQgcmV0cmlldmFsIG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXRXaW5kb3coKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxufTtcbiIsIi8qKlxuICogbG9nIC0tIExvZ2dpbmcgZnVuY3Rpb25zXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgbG9nTGV2ZWw6IG51bGxcbiAgICB9LFxuXG4gICAgd3JpdGUobWVzc2FnZSwgbGV2ZWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBsZXQgc3RhbXAgPSBub3cuZ2V0RnVsbFllYXIoKSArICctJyArIG5vdy5nZXRNb250aCgpICsgJy0nICsgbm93LmdldERhdGUoKSArICdUJyArXG4gICAgICAgICAgICAgICAgbm93LmdldEhvdXJzKCkgKyAnOicgKyBub3cuZ2V0TWludXRlcygpICsgJzonICsgbm93LmdldFNlY29uZHMoKSArICc6JyArIG5vdy5nZXRNaWxsaXNlY29uZHMoKTtcblxuICAgICAgICAgICAgbWVzc2FnZSA9IHN0YW1wICsgJyAnICsgbWVzc2FnZTtcblxuICAgICAgICAgICAgbGV2ZWwgPSAobGV2ZWwgfHwgdGhpcy5jb25maWcubG9nTGV2ZWwgfHwgJ2RlYnVnJykudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgLy8gV3JpdGUgdG8gY29uc29sZSAtLSBjdXJyZW50bHksIGBsb2dgLCBgZGVidWdgLCBgaW5mb2AsIGB3YXJuYCwgYW5kIGBlcnJvcmBcbiAgICAgICAgICAgIC8vIGFyZSBhdmFpbGFibGVcbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgICAgIGlmIChjb25zb2xlW2xldmVsXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGVbbGV2ZWxdKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignTG9nIGxldmVsIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0TGV2ZWwobGV2ZWwpIHtcbiAgICAgICAgbGV2ZWwgPSBsZXZlbC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChjb25zb2xlW2xldmVsXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmxvZ0xldmVsID0gbGV2ZWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignTG9nIGxldmVsIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsIi8qKlxuICogcmFuZG9tIC0tIEEgY29sbGVjdGlvbiBvZiByYW5kb20gZ2VuZXJhdG9yIGZ1bmN0aW9uc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyIGJldHdlZW4gdGhlIGdpdmVuIHN0YXJ0IGFuZCBlbmQgcG9pbnRzXG4gICAgICovXG4gICAgbnVtYmVyKGZyb20sIHRvPW51bGwpIHtcbiAgICAgICAgaWYgKHRvID09PSBudWxsKSB7XG4gICAgICAgICAgICB0byA9IGZyb207XG4gICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKHRvIC0gZnJvbSkgKyBmcm9tO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gdGhlIGdpdmVuIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGludGVnZXIoLi4uYXJncykge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLm51bWJlciguLi5hcmdzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciwgd2l0aCBhIHJhbmRvbSBzaWduLCBiZXR3ZWVuIHRoZSBnaXZlblxuICAgICAqIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGRpcmVjdGlvbmFsKC4uLmFyZ3MpIHtcbiAgICAgICAgbGV0IHJhbmQgPSB0aGlzLm51bWJlciguLi5hcmdzKTtcbiAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgICAgICAgIHJhbmQgPSAtcmFuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmFuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaGV4YWRlY2ltYWwgY29sb3JcbiAgICAgKi9cbiAgICBjb2xvcigpIHtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMDAwMDAnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwKS50b1N0cmluZygxNikpLnN1YnN0cigtNik7XG4gICAgfVxufTtcbiIsIi8qKlxuICoganNjb2xvciAtIEphdmFTY3JpcHQgQ29sb3IgUGlja2VyXG4gKlxuICogQGxpbmsgICAgaHR0cDovL2pzY29sb3IuY29tXG4gKiBAbGljZW5zZSBGb3Igb3BlbiBzb3VyY2UgdXNlOiBHUEx2M1xuICogICAgICAgICAgRm9yIGNvbW1lcmNpYWwgdXNlOiBKU0NvbG9yIENvbW1lcmNpYWwgTGljZW5zZVxuICogQGF1dGhvciAgSmFuIE9kdmFya29cbiAqIEB2ZXJzaW9uIDIuMC40XG4gKlxuICogU2VlIHVzYWdlIGV4YW1wbGVzIGF0IGh0dHA6Ly9qc2NvbG9yLmNvbS9leGFtcGxlcy9cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG5cbmlmICghd2luZG93LmpzY29sb3IpIHsgd2luZG93LmpzY29sb3IgPSAoZnVuY3Rpb24gKCkge1xuXG5cbnZhciBqc2MgPSB7XG5cblxuXHRyZWdpc3RlciA6IGZ1bmN0aW9uICgpIHtcblx0XHRqc2MuYXR0YWNoRE9NUmVhZHlFdmVudChqc2MuaW5pdCk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGRvY3VtZW50LCAnbW91c2Vkb3duJywganNjLm9uRG9jdW1lbnRNb3VzZURvd24pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChkb2N1bWVudCwgJ3RvdWNoc3RhcnQnLCBqc2Mub25Eb2N1bWVudFRvdWNoU3RhcnQpO1xuXHRcdGpzYy5hdHRhY2hFdmVudCh3aW5kb3csICdyZXNpemUnLCBqc2Mub25XaW5kb3dSZXNpemUpO1xuXHR9LFxuXG5cblx0aW5pdCA6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoanNjLmpzY29sb3IubG9va3VwQ2xhc3MpIHtcblx0XHRcdGpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZShqc2MuanNjb2xvci5sb29rdXBDbGFzcyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0dHJ5SW5zdGFsbE9uRWxlbWVudHMgOiBmdW5jdGlvbiAoZWxtcywgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIG1hdGNoQ2xhc3MgPSBuZXcgUmVnRXhwKCcoXnxcXFxccykoJyArIGNsYXNzTmFtZSArICcpKFxcXFxzKihcXFxce1tefV0qXFxcXH0pfFxcXFxzfCQpJywgJ2knKTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZWxtcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKGVsbXNbaV0udHlwZSAhPT0gdW5kZWZpbmVkICYmIGVsbXNbaV0udHlwZS50b0xvd2VyQ2FzZSgpID09ICdjb2xvcicpIHtcblx0XHRcdFx0aWYgKGpzYy5pc0NvbG9yQXR0clN1cHBvcnRlZCkge1xuXHRcdFx0XHRcdC8vIHNraXAgaW5wdXRzIG9mIHR5cGUgJ2NvbG9yJyBpZiBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXJcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dmFyIG07XG5cdFx0XHRpZiAoIWVsbXNbaV0uanNjb2xvciAmJiBlbG1zW2ldLmNsYXNzTmFtZSAmJiAobSA9IGVsbXNbaV0uY2xhc3NOYW1lLm1hdGNoKG1hdGNoQ2xhc3MpKSkge1xuXHRcdFx0XHR2YXIgdGFyZ2V0RWxtID0gZWxtc1tpXTtcblx0XHRcdFx0dmFyIG9wdHNTdHIgPSBudWxsO1xuXG5cdFx0XHRcdHZhciBkYXRhT3B0aW9ucyA9IGpzYy5nZXREYXRhQXR0cih0YXJnZXRFbG0sICdqc2NvbG9yJyk7XG5cdFx0XHRcdGlmIChkYXRhT3B0aW9ucyAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdG9wdHNTdHIgPSBkYXRhT3B0aW9ucztcblx0XHRcdFx0fSBlbHNlIGlmIChtWzRdKSB7XG5cdFx0XHRcdFx0b3B0c1N0ciA9IG1bNF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgb3B0cyA9IHt9O1xuXHRcdFx0XHRpZiAob3B0c1N0cikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzID0gKG5ldyBGdW5jdGlvbiAoJ3JldHVybiAoJyArIG9wdHNTdHIgKyAnKScpKSgpO1xuXHRcdFx0XHRcdH0gY2F0Y2goZVBhcnNlRXJyb3IpIHtcblx0XHRcdFx0XHRcdGpzYy53YXJuKCdFcnJvciBwYXJzaW5nIGpzY29sb3Igb3B0aW9uczogJyArIGVQYXJzZUVycm9yICsgJzpcXG4nICsgb3B0c1N0cik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRhcmdldEVsbS5qc2NvbG9yID0gbmV3IGpzYy5qc2NvbG9yKHRhcmdldEVsbSwgb3B0cyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0aXNDb2xvckF0dHJTdXBwb3J0ZWQgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBlbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXHRcdGlmIChlbG0uc2V0QXR0cmlidXRlKSB7XG5cdFx0XHRlbG0uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NvbG9yJyk7XG5cdFx0XHRpZiAoZWxtLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnY29sb3InKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0pKCksXG5cblxuXHRpc0NhbnZhc1N1cHBvcnRlZCA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHJldHVybiAhIShlbG0uZ2V0Q29udGV4dCAmJiBlbG0uZ2V0Q29udGV4dCgnMmQnKSk7XG5cdH0pKCksXG5cblxuXHRmZXRjaEVsZW1lbnQgOiBmdW5jdGlvbiAobWl4ZWQpIHtcblx0XHRyZXR1cm4gdHlwZW9mIG1peGVkID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1peGVkKSA6IG1peGVkO1xuXHR9LFxuXG5cblx0aXNFbGVtZW50VHlwZSA6IGZ1bmN0aW9uIChlbG0sIHR5cGUpIHtcblx0XHRyZXR1cm4gZWxtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0fSxcblxuXG5cdGdldERhdGFBdHRyIDogZnVuY3Rpb24gKGVsLCBuYW1lKSB7XG5cdFx0dmFyIGF0dHJOYW1lID0gJ2RhdGEtJyArIG5hbWU7XG5cdFx0dmFyIGF0dHJWYWx1ZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7XG5cdFx0aWYgKGF0dHJWYWx1ZSAhPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGF0dHJWYWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblxuXHRhdHRhY2hFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmIChlbC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKGV2bnQsIGZ1bmMsIGZhbHNlKTtcblx0XHR9IGVsc2UgaWYgKGVsLmF0dGFjaEV2ZW50KSB7XG5cdFx0XHRlbC5hdHRhY2hFdmVudCgnb24nICsgZXZudCwgZnVuYyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0ZGV0YWNoRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldm50LCBmdW5jLCBmYWxzZSk7XG5cdFx0fSBlbHNlIGlmIChlbC5kZXRhY2hFdmVudCkge1xuXHRcdFx0ZWwuZGV0YWNoRXZlbnQoJ29uJyArIGV2bnQsIGZ1bmMpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9hdHRhY2hlZEdyb3VwRXZlbnRzIDoge30sXG5cblxuXHRhdHRhY2hHcm91cEV2ZW50IDogZnVuY3Rpb24gKGdyb3VwTmFtZSwgZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoIWpzYy5fYXR0YWNoZWRHcm91cEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShncm91cE5hbWUpKSB7XG5cdFx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXSA9IFtdO1xuXHRcdH1cblx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXS5wdXNoKFtlbCwgZXZudCwgZnVuY10pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChlbCwgZXZudCwgZnVuYyk7XG5cdH0sXG5cblxuXHRkZXRhY2hHcm91cEV2ZW50cyA6IGZ1bmN0aW9uIChncm91cE5hbWUpIHtcblx0XHRpZiAoanNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzLmhhc093blByb3BlcnR5KGdyb3VwTmFtZSkpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0ubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dmFyIGV2dCA9IGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdW2ldO1xuXHRcdFx0XHRqc2MuZGV0YWNoRXZlbnQoZXZ0WzBdLCBldnRbMV0sIGV2dFsyXSk7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGUganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV07XG5cdFx0fVxuXHR9LFxuXG5cblx0YXR0YWNoRE9NUmVhZHlFdmVudCA6IGZ1bmN0aW9uIChmdW5jKSB7XG5cdFx0dmFyIGZpcmVkID0gZmFsc2U7XG5cdFx0dmFyIGZpcmVPbmNlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCFmaXJlZCkge1xuXHRcdFx0XHRmaXJlZCA9IHRydWU7XG5cdFx0XHRcdGZ1bmMoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcblx0XHRcdHNldFRpbWVvdXQoZmlyZU9uY2UsIDEpOyAvLyBhc3luY1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdFx0Ly8gRmFsbGJhY2tcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcblx0XHRcdC8vIElFXG5cdFx0XHRkb2N1bWVudC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuXHRcdFx0XHRcdGRvY3VtZW50LmRldGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBhcmd1bWVudHMuY2FsbGVlKTtcblx0XHRcdFx0XHRmaXJlT25jZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cdFx0XHQvLyBGYWxsYmFja1xuXHRcdFx0d2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmaXJlT25jZSk7XG5cblx0XHRcdC8vIElFNy84XG5cdFx0XHRpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsICYmIHdpbmRvdyA9PSB3aW5kb3cudG9wKSB7XG5cdFx0XHRcdHZhciB0cnlTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKCFkb2N1bWVudC5ib2R5KSB7IHJldHVybjsgfVxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwoJ2xlZnQnKTtcblx0XHRcdFx0XHRcdGZpcmVPbmNlKCk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0c2V0VGltZW91dCh0cnlTY3JvbGwsIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdFx0dHJ5U2Nyb2xsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0d2FybiA6IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRpZiAod2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUud2Fybikge1xuXHRcdFx0d2luZG93LmNvbnNvbGUud2Fybihtc2cpO1xuXHRcdH1cblx0fSxcblxuXG5cdHByZXZlbnREZWZhdWx0IDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cblx0XHRlLnJldHVyblZhbHVlID0gZmFsc2U7XG5cdH0sXG5cblxuXHRjYXB0dXJlVGFyZ2V0IDogZnVuY3Rpb24gKHRhcmdldCkge1xuXHRcdC8vIElFXG5cdFx0aWYgKHRhcmdldC5zZXRDYXB0dXJlKSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldC5zZXRDYXB0dXJlKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0cmVsZWFzZVRhcmdldCA6IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBJRVxuXHRcdGlmIChqc2MuX2NhcHR1cmVkVGFyZ2V0KSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0LnJlbGVhc2VDYXB0dXJlKCk7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gbnVsbDtcblx0XHR9XG5cdH0sXG5cblxuXHRmaXJlRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQpIHtcblx0XHRpZiAoIWVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuXHRcdFx0dmFyIGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcblx0XHRcdGV2LmluaXRFdmVudChldm50LCB0cnVlLCB0cnVlKTtcblx0XHRcdGVsLmRpc3BhdGNoRXZlbnQoZXYpO1xuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QpIHtcblx0XHRcdHZhciBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG5cdFx0XHRlbC5maXJlRXZlbnQoJ29uJyArIGV2bnQsIGV2KTtcblx0XHR9IGVsc2UgaWYgKGVsWydvbicgKyBldm50XSkgeyAvLyBhbHRlcm5hdGl2ZWx5IHVzZSB0aGUgdHJhZGl0aW9uYWwgZXZlbnQgbW9kZWxcblx0XHRcdGVsWydvbicgKyBldm50XSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdGNsYXNzTmFtZVRvTGlzdCA6IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0XHRyZXR1cm4gY2xhc3NOYW1lLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKS5zcGxpdCgvXFxzKy8pO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIG9ubHkgY29udGFpbiBhIHNpbmdsZSBjbGFzcyBuYW1lXG5cdGhhc0NsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0aWYgKCFjbGFzc05hbWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIC0xICE9ICgnICcgKyBlbG0uY2xhc3NOYW1lLnJlcGxhY2UoL1xccysvZywgJyAnKSArICcgJykuaW5kZXhPZignICcgKyBjbGFzc05hbWUgKyAnICcpO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIGNvbnRhaW4gbXVsdGlwbGUgY2xhc3MgbmFtZXMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Vcblx0c2V0Q2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgY2xhc3NMaXN0ID0ganNjLmNsYXNzTmFtZVRvTGlzdChjbGFzc05hbWUpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRpZiAoIWpzYy5oYXNDbGFzcyhlbG0sIGNsYXNzTGlzdFtpXSkpIHtcblx0XHRcdFx0ZWxtLmNsYXNzTmFtZSArPSAoZWxtLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArIGNsYXNzTGlzdFtpXTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gY29udGFpbiBtdWx0aXBsZSBjbGFzcyBuYW1lcyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZVxuXHR1bnNldENsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGNsYXNzTGlzdCA9IGpzYy5jbGFzc05hbWVUb0xpc3QoY2xhc3NOYW1lKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dmFyIHJlcGwgPSBuZXcgUmVnRXhwKFxuXHRcdFx0XHQnXlxcXFxzKicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXHMqfCcgK1xuXHRcdFx0XHQnXFxcXHMqJyArIGNsYXNzTGlzdFtpXSArICdcXFxccyokfCcgK1xuXHRcdFx0XHQnXFxcXHMrJyArIGNsYXNzTGlzdFtpXSArICcoXFxcXHMrKScsXG5cdFx0XHRcdCdnJ1xuXHRcdFx0KTtcblx0XHRcdGVsbS5jbGFzc05hbWUgPSBlbG0uY2xhc3NOYW1lLnJlcGxhY2UocmVwbCwgJyQxJyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0U3R5bGUgOiBmdW5jdGlvbiAoZWxtKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxtKSA6IGVsbS5jdXJyZW50U3R5bGU7XG5cdH0sXG5cblxuXHRzZXRTdHlsZSA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGhlbHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHZhciBnZXRTdXBwb3J0ZWRQcm9wID0gZnVuY3Rpb24gKG5hbWVzKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGlmIChuYW1lc1tpXSBpbiBoZWxwZXIuc3R5bGUpIHtcblx0XHRcdFx0XHRyZXR1cm4gbmFtZXNbaV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciBwcm9wcyA9IHtcblx0XHRcdGJvcmRlclJhZGl1czogZ2V0U3VwcG9ydGVkUHJvcChbJ2JvcmRlclJhZGl1cycsICdNb3pCb3JkZXJSYWRpdXMnLCAnd2Via2l0Qm9yZGVyUmFkaXVzJ10pLFxuXHRcdFx0Ym94U2hhZG93OiBnZXRTdXBwb3J0ZWRQcm9wKFsnYm94U2hhZG93JywgJ01vekJveFNoYWRvdycsICd3ZWJraXRCb3hTaGFkb3cnXSlcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZWxtLCBwcm9wLCB2YWx1ZSkge1xuXHRcdFx0c3dpdGNoIChwcm9wLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdGNhc2UgJ29wYWNpdHknOlxuXHRcdFx0XHR2YXIgYWxwaGFPcGFjaXR5ID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHZhbHVlKSAqIDEwMCk7XG5cdFx0XHRcdGVsbS5zdHlsZS5vcGFjaXR5ID0gdmFsdWU7XG5cdFx0XHRcdGVsbS5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0nICsgYWxwaGFPcGFjaXR5ICsgJyknO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGVsbS5zdHlsZVtwcm9wc1twcm9wXV0gPSB2YWx1ZTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSkoKSxcblxuXG5cdHNldEJvcmRlclJhZGl1cyA6IGZ1bmN0aW9uIChlbG0sIHZhbHVlKSB7XG5cdFx0anNjLnNldFN0eWxlKGVsbSwgJ2JvcmRlclJhZGl1cycsIHZhbHVlIHx8ICcwJyk7XG5cdH0sXG5cblxuXHRzZXRCb3hTaGFkb3cgOiBmdW5jdGlvbiAoZWxtLCB2YWx1ZSkge1xuXHRcdGpzYy5zZXRTdHlsZShlbG0sICdib3hTaGFkb3cnLCB2YWx1ZSB8fCAnbm9uZScpO1xuXHR9LFxuXG5cblx0Z2V0RWxlbWVudFBvcyA6IGZ1bmN0aW9uIChlLCByZWxhdGl2ZVRvVmlld3BvcnQpIHtcblx0XHR2YXIgeD0wLCB5PTA7XG5cdFx0dmFyIHJlY3QgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdHggPSByZWN0LmxlZnQ7XG5cdFx0eSA9IHJlY3QudG9wO1xuXHRcdGlmICghcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0XHR2YXIgdmlld1BvcyA9IGpzYy5nZXRWaWV3UG9zKCk7XG5cdFx0XHR4ICs9IHZpZXdQb3NbMF07XG5cdFx0XHR5ICs9IHZpZXdQb3NbMV07XG5cdFx0fVxuXHRcdHJldHVybiBbeCwgeV07XG5cdH0sXG5cblxuXHRnZXRFbGVtZW50U2l6ZSA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0cmV0dXJuIFtlLm9mZnNldFdpZHRoLCBlLm9mZnNldEhlaWdodF07XG5cdH0sXG5cblxuXHQvLyBnZXQgcG9pbnRlcidzIFgvWSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB2aWV3cG9ydFxuXHRnZXRBYnNQb2ludGVyUG9zIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBlLmNoYW5nZWRUb3VjaGVzICE9PSAndW5kZWZpbmVkJyAmJiBlLmNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuXHRcdFx0Ly8gdG91Y2ggZGV2aWNlc1xuXHRcdFx0eCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdHkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZS5jbGllbnRYID09PSAnbnVtYmVyJykge1xuXHRcdFx0eCA9IGUuY2xpZW50WDtcblx0XHRcdHkgPSBlLmNsaWVudFk7XG5cdFx0fVxuXHRcdHJldHVybiB7IHg6IHgsIHk6IHkgfTtcblx0fSxcblxuXG5cdC8vIGdldCBwb2ludGVyJ3MgWC9ZIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRhcmdldCBlbGVtZW50XG5cdGdldFJlbFBvaW50ZXJQb3MgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblx0XHR2YXIgdGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cblx0XHR2YXIgY2xpZW50WCA9IDAsIGNsaWVudFkgPSAwO1xuXHRcdGlmICh0eXBlb2YgZS5jaGFuZ2VkVG91Y2hlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcblx0XHRcdC8vIHRvdWNoIGRldmljZXNcblx0XHRcdGNsaWVudFggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGUuY2xpZW50WCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGNsaWVudFggPSBlLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jbGllbnRZO1xuXHRcdH1cblxuXHRcdHggPSBjbGllbnRYIC0gdGFyZ2V0UmVjdC5sZWZ0O1xuXHRcdHkgPSBjbGllbnRZIC0gdGFyZ2V0UmVjdC50b3A7XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSB9O1xuXHR9LFxuXG5cblx0Z2V0Vmlld1BvcyA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvYy5zY3JvbGxMZWZ0KSAtIChkb2MuY2xpZW50TGVmdCB8fCAwKSxcblx0XHRcdCh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jLnNjcm9sbFRvcCkgLSAoZG9jLmNsaWVudFRvcCB8fCAwKVxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRWaWV3U2l6ZSA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LmlubmVyV2lkdGggfHwgZG9jLmNsaWVudFdpZHRoKSxcblx0XHRcdCh3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jLmNsaWVudEhlaWdodCksXG5cdFx0XTtcblx0fSxcblxuXG5cdHJlZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKCkge1xuXG5cdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0dmFyIHRoaXNPYmogPSBqc2MucGlja2VyLm93bmVyO1xuXG5cdFx0XHR2YXIgdHAsIHZwO1xuXG5cdFx0XHRpZiAodGhpc09iai5maXhlZCkge1xuXHRcdFx0XHQvLyBGaXhlZCBlbGVtZW50cyBhcmUgcG9zaXRpb25lZCByZWxhdGl2ZSB0byB2aWV3cG9ydCxcblx0XHRcdFx0Ly8gdGhlcmVmb3JlIHdlIGNhbiBpZ25vcmUgdGhlIHNjcm9sbCBvZmZzZXRcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQsIHRydWUpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0gWzAsIDBdOyAvLyB2aWV3IHBvc1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0ganNjLmdldFZpZXdQb3MoKTsgLy8gdmlldyBwb3Ncblx0XHRcdH1cblxuXHRcdFx0dmFyIHRzID0ganNjLmdldEVsZW1lbnRTaXplKHRoaXNPYmoudGFyZ2V0RWxlbWVudCk7IC8vIHRhcmdldCBzaXplXG5cdFx0XHR2YXIgdnMgPSBqc2MuZ2V0Vmlld1NpemUoKTsgLy8gdmlldyBzaXplXG5cdFx0XHR2YXIgcHMgPSBqc2MuZ2V0UGlja2VyT3V0ZXJEaW1zKHRoaXNPYmopOyAvLyBwaWNrZXIgc2l6ZVxuXHRcdFx0dmFyIGEsIGIsIGM7XG5cdFx0XHRzd2l0Y2ggKHRoaXNPYmoucG9zaXRpb24udG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdsZWZ0JzogYT0xOyBiPTA7IGM9LTE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyaWdodCc6YT0xOyBiPTA7IGM9MTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3RvcCc6ICBhPTA7IGI9MTsgYz0tMTsgYnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6ICAgICBhPTA7IGI9MTsgYz0xOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciBsID0gKHRzW2JdK3BzW2JdKS8yO1xuXG5cdFx0XHQvLyBjb21wdXRlIHBpY2tlciBwb3NpdGlvblxuXHRcdFx0aWYgKCF0aGlzT2JqLnNtYXJ0UG9zaXRpb24pIHtcblx0XHRcdFx0dmFyIHBwID0gW1xuXHRcdFx0XHRcdHRwW2FdLFxuXHRcdFx0XHRcdHRwW2JdK3RzW2JdLWwrbCpjXG5cdFx0XHRcdF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgcHAgPSBbXG5cdFx0XHRcdFx0LXZwW2FdK3RwW2FdK3BzW2FdID4gdnNbYV0gP1xuXHRcdFx0XHRcdFx0KC12cFthXSt0cFthXSt0c1thXS8yID4gdnNbYV0vMiAmJiB0cFthXSt0c1thXS1wc1thXSA+PSAwID8gdHBbYV0rdHNbYV0tcHNbYV0gOiB0cFthXSkgOlxuXHRcdFx0XHRcdFx0dHBbYV0sXG5cdFx0XHRcdFx0LXZwW2JdK3RwW2JdK3RzW2JdK3BzW2JdLWwrbCpjID4gdnNbYl0gP1xuXHRcdFx0XHRcdFx0KC12cFtiXSt0cFtiXSt0c1tiXS8yID4gdnNbYl0vMiAmJiB0cFtiXSt0c1tiXS1sLWwqYyA+PSAwID8gdHBbYl0rdHNbYl0tbC1sKmMgOiB0cFtiXSt0c1tiXS1sK2wqYykgOlxuXHRcdFx0XHRcdFx0KHRwW2JdK3RzW2JdLWwrbCpjID49IDAgPyB0cFtiXSt0c1tiXS1sK2wqYyA6IHRwW2JdK3RzW2JdLWwtbCpjKVxuXHRcdFx0XHRdO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IHBwW2FdO1xuXHRcdFx0dmFyIHkgPSBwcFtiXTtcblx0XHRcdHZhciBwb3NpdGlvblZhbHVlID0gdGhpc09iai5maXhlZCA/ICdmaXhlZCcgOiAnYWJzb2x1dGUnO1xuXHRcdFx0dmFyIGNvbnRyYWN0U2hhZG93ID1cblx0XHRcdFx0KHBwWzBdICsgcHNbMF0gPiB0cFswXSB8fCBwcFswXSA8IHRwWzBdICsgdHNbMF0pICYmXG5cdFx0XHRcdChwcFsxXSArIHBzWzFdIDwgdHBbMV0gKyB0c1sxXSk7XG5cblx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KTtcblx0XHR9XG5cdH0sXG5cblxuXHRfZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KSB7XG5cdFx0dmFyIHZTaGFkb3cgPSBjb250cmFjdFNoYWRvdyA/IDAgOiB0aGlzT2JqLnNoYWRvd0JsdXI7IC8vIHB4XG5cblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUucG9zaXRpb24gPSBwb3NpdGlvblZhbHVlO1xuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS5sZWZ0ID0geCArICdweCc7XG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xuXG5cdFx0anNjLnNldEJveFNoYWRvdyhcblx0XHRcdGpzYy5waWNrZXIuYm94Uyxcblx0XHRcdHRoaXNPYmouc2hhZG93ID9cblx0XHRcdFx0bmV3IGpzYy5Cb3hTaGFkb3coMCwgdlNoYWRvdywgdGhpc09iai5zaGFkb3dCbHVyLCAwLCB0aGlzT2JqLnNoYWRvd0NvbG9yKSA6XG5cdFx0XHRcdG51bGwpO1xuXHR9LFxuXG5cblx0Z2V0UGlja2VyRGltcyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaik7XG5cdFx0dmFyIGRpbXMgPSBbXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmoud2lkdGggK1xuXHRcdFx0XHQoZGlzcGxheVNsaWRlciA/IDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyBqc2MuZ2V0UGFkVG9TbGlkZXJQYWRkaW5nKHRoaXNPYmopICsgdGhpc09iai5zbGlkZXJTaXplIDogMCksXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmouaGVpZ2h0ICtcblx0XHRcdFx0KHRoaXNPYmouY2xvc2FibGUgPyAyICogdGhpc09iai5pbnNldFdpZHRoICsgdGhpc09iai5wYWRkaW5nICsgdGhpc09iai5idXR0b25IZWlnaHQgOiAwKVxuXHRcdF07XG5cdFx0cmV0dXJuIGRpbXM7XG5cdH0sXG5cblxuXHRnZXRQaWNrZXJPdXRlckRpbXMgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHZhciBkaW1zID0ganNjLmdldFBpY2tlckRpbXModGhpc09iaik7XG5cdFx0cmV0dXJuIFtcblx0XHRcdGRpbXNbMF0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aCxcblx0XHRcdGRpbXNbMV0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aFxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRQYWRUb1NsaWRlclBhZGRpbmcgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHJldHVybiBNYXRoLm1heCh0aGlzT2JqLnBhZGRpbmcsIDEuNSAqICgyICogdGhpc09iai5wb2ludGVyQm9yZGVyV2lkdGggKyB0aGlzT2JqLnBvaW50ZXJUaGlja25lc3MpKTtcblx0fSxcblxuXG5cdGdldFBhZFlDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHN3aXRjaCAodGhpc09iai5tb2RlLmNoYXJBdCgxKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0fVxuXHRcdHJldHVybiAncyc7XG5cdH0sXG5cblxuXHRnZXRTbGlkZXJDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLm1vZGUubGVuZ3RoID4gMikge1xuXHRcdFx0c3dpdGNoICh0aGlzT2JqLm1vZGUuY2hhckF0KDIpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6IHJldHVybiAncyc7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudE1vdXNlRG93biA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICdtb3VzZScpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBNb3VzZSBpcyBvdXRzaWRlIHRoZSBwaWNrZXIgY29udHJvbHMgLT4gaGlkZSB0aGUgY29sb3IgcGlja2VyIVxuXHRcdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50VG91Y2hTdGFydCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICd0b3VjaCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uV2luZG93UmVzaXplIDogZnVuY3Rpb24gKGUpIHtcblx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0fSxcblxuXG5cdG9uUGFyZW50U2Nyb2xsIDogZnVuY3Rpb24gKGUpIHtcblx0XHQvLyBoaWRlIHRoZSBwaWNrZXIgd2hlbiBvbmUgb2YgdGhlIHBhcmVudCBlbGVtZW50cyBpcyBzY3JvbGxlZFxuXHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9wb2ludGVyTW92ZUV2ZW50IDoge1xuXHRcdG1vdXNlOiAnbW91c2Vtb3ZlJyxcblx0XHR0b3VjaDogJ3RvdWNobW92ZSdcblx0fSxcblx0X3BvaW50ZXJFbmRFdmVudCA6IHtcblx0XHRtb3VzZTogJ21vdXNldXAnLFxuXHRcdHRvdWNoOiAndG91Y2hlbmQnXG5cdH0sXG5cblxuXHRfcG9pbnRlck9yaWdpbiA6IG51bGwsXG5cdF9jYXB0dXJlZFRhcmdldCA6IG51bGwsXG5cblxuXHRvbkNvbnRyb2xQb2ludGVyU3RhcnQgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpIHtcblx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cblx0XHRqc2MucHJldmVudERlZmF1bHQoZSk7XG5cdFx0anNjLmNhcHR1cmVUYXJnZXQodGFyZ2V0KTtcblxuXHRcdHZhciByZWdpc3RlckRyYWdFdmVudHMgPSBmdW5jdGlvbiAoZG9jLCBvZmZzZXQpIHtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJNb3ZlRXZlbnRbcG9pbnRlclR5cGVdLFxuXHRcdFx0XHRqc2Mub25Eb2N1bWVudFBvaW50ZXJNb3ZlKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpKTtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJFbmRFdmVudFtwb2ludGVyVHlwZV0sXG5cdFx0XHRcdGpzYy5vbkRvY3VtZW50UG9pbnRlckVuZChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkpO1xuXHRcdH07XG5cblx0XHRyZWdpc3RlckRyYWdFdmVudHMoZG9jdW1lbnQsIFswLCAwXSk7XG5cblx0XHRpZiAod2luZG93LnBhcmVudCAmJiB3aW5kb3cuZnJhbWVFbGVtZW50KSB7XG5cdFx0XHR2YXIgcmVjdCA9IHdpbmRvdy5mcmFtZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHR2YXIgb2ZzID0gWy1yZWN0LmxlZnQsIC1yZWN0LnRvcF07XG5cdFx0XHRyZWdpc3RlckRyYWdFdmVudHMod2luZG93LnBhcmVudC53aW5kb3cuZG9jdW1lbnQsIG9mcyk7XG5cdFx0fVxuXG5cdFx0dmFyIGFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciByZWwgPSBqc2MuZ2V0UmVsUG9pbnRlclBvcyhlKTtcblx0XHRqc2MuX3BvaW50ZXJPcmlnaW4gPSB7XG5cdFx0XHR4OiBhYnMueCAtIHJlbC54LFxuXHRcdFx0eTogYWJzLnkgLSByZWwueVxuXHRcdH07XG5cblx0XHRzd2l0Y2ggKGNvbnRyb2xOYW1lKSB7XG5cdFx0Y2FzZSAncGFkJzpcblx0XHRcdC8vIGlmIHRoZSBzbGlkZXIgaXMgYXQgdGhlIGJvdHRvbSwgbW92ZSBpdCB1cFxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0XHRjYXNlICdzJzogaWYgKHRoaXNPYmouaHN2WzFdID09PSAwKSB7IHRoaXNPYmouZnJvbUhTVihudWxsLCAxMDAsIG51bGwpOyB9OyBicmVhaztcblx0XHRcdGNhc2UgJ3YnOiBpZiAodGhpc09iai5oc3ZbMl0gPT09IDApIHsgdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIDEwMCk7IH07IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0anNjLnNldFBhZCh0aGlzT2JqLCBlLCAwLCAwKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnc2xkJzpcblx0XHRcdGpzYy5zZXRTbGQodGhpc09iaiwgZSwgMCk7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudFBvaW50ZXJNb3ZlIDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblx0XHRcdHN3aXRjaCAoY29udHJvbE5hbWUpIHtcblx0XHRcdGNhc2UgJ3BhZCc6XG5cdFx0XHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0XHRcdGpzYy5zZXRQYWQodGhpc09iaiwgZSwgb2Zmc2V0WzBdLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAnc2xkJzpcblx0XHRcdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHRcdFx0anNjLnNldFNsZCh0aGlzT2JqLCBlLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50UG9pbnRlckVuZCA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXHRcdFx0anNjLmRldGFjaEdyb3VwRXZlbnRzKCdkcmFnJyk7XG5cdFx0XHRqc2MucmVsZWFzZVRhcmdldCgpO1xuXHRcdFx0Ly8gQWx3YXlzIGRpc3BhdGNoIGNoYW5nZXMgYWZ0ZXIgZGV0YWNoaW5nIG91dHN0YW5kaW5nIG1vdXNlIGhhbmRsZXJzLFxuXHRcdFx0Ly8gaW4gY2FzZSBzb21lIHVzZXIgaW50ZXJhY3Rpb24gd2lsbCBvY2N1ciBpbiB1c2VyJ3Mgb25jaGFuZ2UgY2FsbGJhY2tcblx0XHRcdC8vIHRoYXQgd291bGQgaW50cnVkZSB3aXRoIGN1cnJlbnQgbW91c2UgZXZlbnRzXG5cdFx0XHRqc2MuZGlzcGF0Y2hDaGFuZ2UodGhpc09iaik7XG5cdFx0fTtcblx0fSxcblxuXG5cdGRpc3BhdGNoQ2hhbmdlIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0anNjLmZpcmVFdmVudCh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2NoYW5nZScpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdGRpc3BhdGNoRmluZUNoYW5nZSA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoub25GaW5lQ2hhbmdlKSB7XG5cdFx0XHR2YXIgY2FsbGJhY2s7XG5cdFx0XHRpZiAodHlwZW9mIHRoaXNPYmoub25GaW5lQ2hhbmdlID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRjYWxsYmFjayA9IG5ldyBGdW5jdGlvbiAodGhpc09iai5vbkZpbmVDaGFuZ2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSB0aGlzT2JqLm9uRmluZUNoYW5nZTtcblx0XHRcdH1cblx0XHRcdGNhbGxiYWNrLmNhbGwodGhpc09iaik7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0UGFkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1gsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB4ID0gb2ZzWCArIHBvaW50ZXJBYnMueCAtIGpzYy5fcG9pbnRlck9yaWdpbi54IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHhWYWwgPSB4ICogKDM2MCAvICh0aGlzT2JqLndpZHRoIC0gMSkpO1xuXHRcdHZhciB5VmFsID0gMTAwIC0gKHkgKiAoMTAwIC8gKHRoaXNPYmouaGVpZ2h0IC0gMSkpKTtcblxuXHRcdHN3aXRjaCAoanNjLmdldFBhZFlDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRjYXNlICdzJzogdGhpc09iai5mcm9tSFNWKHhWYWwsIHlWYWwsIG51bGwsIGpzYy5sZWF2ZVNsZCk7IGJyZWFrO1xuXHRcdGNhc2UgJ3YnOiB0aGlzT2JqLmZyb21IU1YoeFZhbCwgbnVsbCwgeVZhbCwganNjLmxlYXZlU2xkKTsgYnJlYWs7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0U2xkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHlWYWwgPSAxMDAgLSAoeSAqICgxMDAgLyAodGhpc09iai5oZWlnaHQgLSAxKSkpO1xuXG5cdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0Y2FzZSAncyc6IHRoaXNPYmouZnJvbUhTVihudWxsLCB5VmFsLCBudWxsLCBqc2MubGVhdmVQYWQpOyBicmVhaztcblx0XHRjYXNlICd2JzogdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIHlWYWwsIGpzYy5sZWF2ZVBhZCk7IGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXG5cdF92bWxOUyA6ICdqc2Nfdm1sXycsXG5cdF92bWxDU1MgOiAnanNjX3ZtbF9jc3NfJyxcblx0X3ZtbFJlYWR5IDogZmFsc2UsXG5cblxuXHRpbml0Vk1MIDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICghanNjLl92bWxSZWFkeSkge1xuXHRcdFx0Ly8gaW5pdCBWTUwgbmFtZXNwYWNlXG5cdFx0XHR2YXIgZG9jID0gZG9jdW1lbnQ7XG5cdFx0XHRpZiAoIWRvYy5uYW1lc3BhY2VzW2pzYy5fdm1sTlNdKSB7XG5cdFx0XHRcdGRvYy5uYW1lc3BhY2VzLmFkZChqc2MuX3ZtbE5TLCAndXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp2bWwnKTtcblx0XHRcdH1cblx0XHRcdGlmICghZG9jLnN0eWxlU2hlZXRzW2pzYy5fdm1sQ1NTXSkge1xuXHRcdFx0XHR2YXIgdGFncyA9IFsnc2hhcGUnLCAnc2hhcGV0eXBlJywgJ2dyb3VwJywgJ2JhY2tncm91bmQnLCAncGF0aCcsICdmb3JtdWxhcycsICdoYW5kbGVzJywgJ2ZpbGwnLCAnc3Ryb2tlJywgJ3NoYWRvdycsICd0ZXh0Ym94JywgJ3RleHRwYXRoJywgJ2ltYWdlZGF0YScsICdsaW5lJywgJ3BvbHlsaW5lJywgJ2N1cnZlJywgJ3JlY3QnLCAncm91bmRyZWN0JywgJ292YWwnLCAnYXJjJywgJ2ltYWdlJ107XG5cdFx0XHRcdHZhciBzcyA9IGRvYy5jcmVhdGVTdHlsZVNoZWV0KCk7XG5cdFx0XHRcdHNzLm93bmluZ0VsZW1lbnQuaWQgPSBqc2MuX3ZtbENTUztcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0c3MuYWRkUnVsZShqc2MuX3ZtbE5TICsgJ1xcXFw6JyArIHRhZ3NbaV0sICdiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKTsnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0anNjLl92bWxSZWFkeSA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Y3JlYXRlUGFsZXR0ZSA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBwYWxldHRlT2JqID0ge1xuXHRcdFx0ZWxtOiBudWxsLFxuXHRcdFx0ZHJhdzogbnVsbFxuXHRcdH07XG5cblx0XHRpZiAoanNjLmlzQ2FudmFzU3VwcG9ydGVkKSB7XG5cdFx0XHQvLyBDYW52YXMgaW1wbGVtZW50YXRpb24gZm9yIG1vZGVybiBicm93c2Vyc1xuXG5cdFx0XHR2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHR2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgaEdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgY2FudmFzLndpZHRoLCAwKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDAgLyA2LCAnI0YwMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMSAvIDYsICcjRkYwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgyIC8gNiwgJyMwRjAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDMgLyA2LCAnIzBGRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNCAvIDYsICcjMDBGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg1IC8gNiwgJyNGMEYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDYgLyA2LCAnI0YwMCcpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBoR3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIHZHcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRzd2l0Y2ggKHR5cGUudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMjU1LDI1NSwyNTUsMCknKTtcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMjU1LDI1NSwyNTUsMSknKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsMCwwLDApJyk7XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDEpJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHZHcmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHBhbGV0dGVPYmouZWxtID0gY2FudmFzO1xuXHRcdFx0cGFsZXR0ZU9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gVk1MIGZhbGxiYWNrIGZvciBJRSA3IGFuZCA4XG5cblx0XHRcdGpzYy5pbml0Vk1MKCk7XG5cblx0XHRcdHZhciB2bWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuXHRcdFx0dmFyIGhHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRoR3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdGhHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0aEdyYWQuYW5nbGUgPSAnOTAnO1xuXHRcdFx0aEdyYWQuY29sb3JzID0gJzE2LjY3JSAjRjBGLCAzMy4zMyUgIzAwRiwgNTAlICMwRkYsIDY2LjY3JSAjMEYwLCA4My4zMyUgI0ZGMCdcblxuXHRcdFx0dmFyIGhSZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHRoUmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRoUmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0aFJlY3QuYXBwZW5kQ2hpbGQoaEdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKGhSZWN0KTtcblxuXHRcdFx0dmFyIHZHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHR2R3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdHZHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0dkdyYWQuYW5nbGUgPSAnMTgwJztcblx0XHRcdHZHcmFkLm9wYWNpdHkgPSAnMCc7XG5cblx0XHRcdHZhciB2UmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0dlJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0dlJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHZSZWN0LmFwcGVuZENoaWxkKHZHcmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZCh2UmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4Jztcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cblx0XHRcdFx0aFJlY3Quc3R5bGUud2lkdGggPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdFx0KHdpZHRoICsgMSkgKyAncHgnO1xuXHRcdFx0XHRoUmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRcdChoZWlnaHQgKyAxKSArICdweCc7XG5cblx0XHRcdFx0Ly8gQ29sb3JzIG11c3QgYmUgc3BlY2lmaWVkIGR1cmluZyBldmVyeSByZWRyYXcsIG90aGVyd2lzZSBJRSB3b24ndCBkaXNwbGF5XG5cdFx0XHRcdC8vIGEgZnVsbCBncmFkaWVudCBkdXJpbmcgYSBzdWJzZXF1ZW50aWFsIHJlZHJhd1xuXHRcdFx0XHRoR3JhZC5jb2xvciA9ICcjRjAwJztcblx0XHRcdFx0aEdyYWQuY29sb3IyID0gJyNGMDAnO1xuXG5cdFx0XHRcdHN3aXRjaCAodHlwZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHRcdHZHcmFkLmNvbG9yID0gdkdyYWQuY29sb3IyID0gJyNGRkYnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0XHR2R3JhZC5jb2xvciA9IHZHcmFkLmNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0cGFsZXR0ZU9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRwYWxldHRlT2JqLmRyYXcgPSBkcmF3RnVuYztcblx0XHR9XG5cblx0XHRyZXR1cm4gcGFsZXR0ZU9iajtcblx0fSxcblxuXG5cdGNyZWF0ZVNsaWRlckdyYWRpZW50IDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHNsaWRlck9iaiA9IHtcblx0XHRcdGVsbTogbnVsbCxcblx0XHRcdGRyYXc6IG51bGxcblx0XHR9O1xuXG5cdFx0aWYgKGpzYy5pc0NhbnZhc1N1cHBvcnRlZCkge1xuXHRcdFx0Ly8gQ2FudmFzIGltcGxlbWVudGF0aW9uIGZvciBtb2Rlcm4gYnJvd3NlcnNcblxuXHRcdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY29sb3IxLCBjb2xvcjIpIHtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cblx0XHRcdFx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciBncmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgwLCBjb2xvcjEpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgxLCBjb2xvcjIpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBncmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHNsaWRlck9iai5lbG0gPSBjYW52YXM7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFZNTCBmYWxsYmFjayBmb3IgSUUgNyBhbmQgOFxuXG5cdFx0XHRqc2MuaW5pdFZNTCgpO1xuXG5cdFx0XHR2YXIgdm1sQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0XHRcdHZhciBncmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRncmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0Z3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdGdyYWQuYW5nbGUgPSAnMTgwJztcblxuXHRcdFx0dmFyIHJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdHJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0cmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHRyZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHJlY3QuYXBwZW5kQ2hpbGQoZ3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQocmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMikge1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRcdHJlY3Quc3R5bGUud2lkdGggPSAod2lkdGggKyAxKSArICdweCc7XG5cdFx0XHRcdHJlY3Quc3R5bGUuaGVpZ2h0ID0gKGhlaWdodCArIDEpICsgJ3B4JztcblxuXHRcdFx0XHRncmFkLmNvbG9yID0gY29sb3IxO1xuXHRcdFx0XHRncmFkLmNvbG9yMiA9IGNvbG9yMjtcblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdHNsaWRlck9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXHRcdH1cblxuXHRcdHJldHVybiBzbGlkZXJPYmo7XG5cdH0sXG5cblxuXHRsZWF2ZVZhbHVlIDogMTw8MCxcblx0bGVhdmVTdHlsZSA6IDE8PDEsXG5cdGxlYXZlUGFkIDogMTw8Mixcblx0bGVhdmVTbGQgOiAxPDwzLFxuXG5cblx0Qm94U2hhZG93IDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgQm94U2hhZG93ID0gZnVuY3Rpb24gKGhTaGFkb3csIHZTaGFkb3csIGJsdXIsIHNwcmVhZCwgY29sb3IsIGluc2V0KSB7XG5cdFx0XHR0aGlzLmhTaGFkb3cgPSBoU2hhZG93O1xuXHRcdFx0dGhpcy52U2hhZG93ID0gdlNoYWRvdztcblx0XHRcdHRoaXMuYmx1ciA9IGJsdXI7XG5cdFx0XHR0aGlzLnNwcmVhZCA9IHNwcmVhZDtcblx0XHRcdHRoaXMuY29sb3IgPSBjb2xvcjtcblx0XHRcdHRoaXMuaW5zZXQgPSAhIWluc2V0O1xuXHRcdH07XG5cblx0XHRCb3hTaGFkb3cucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHZhbHMgPSBbXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5oU2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy52U2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5ibHVyKSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5zcHJlYWQpICsgJ3B4Jyxcblx0XHRcdFx0dGhpcy5jb2xvclxuXHRcdFx0XTtcblx0XHRcdGlmICh0aGlzLmluc2V0KSB7XG5cdFx0XHRcdHZhbHMucHVzaCgnaW5zZXQnKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWxzLmpvaW4oJyAnKTtcblx0XHR9O1xuXG5cdFx0cmV0dXJuIEJveFNoYWRvdztcblx0fSkoKSxcblxuXG5cdC8vXG5cdC8vIFVzYWdlOlxuXHQvLyB2YXIgbXlDb2xvciA9IG5ldyBqc2NvbG9yKDx0YXJnZXRFbGVtZW50PiBbLCA8b3B0aW9ucz5dKVxuXHQvL1xuXG5cdGpzY29sb3IgOiBmdW5jdGlvbiAodGFyZ2V0RWxlbWVudCwgb3B0aW9ucykge1xuXG5cdFx0Ly8gR2VuZXJhbCBvcHRpb25zXG5cdFx0Ly9cblx0XHR0aGlzLnZhbHVlID0gbnVsbDsgLy8gaW5pdGlhbCBIRVggY29sb3IuIFRvIGNoYW5nZSBpdCBsYXRlciwgdXNlIG1ldGhvZHMgZnJvbVN0cmluZygpLCBmcm9tSFNWKCkgYW5kIGZyb21SR0IoKVxuXHRcdHRoaXMudmFsdWVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkaXNwbGF5IGFuZCBpbnB1dCB0aGUgY29sb3IgY29kZVxuXHRcdHRoaXMuc3R5bGVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgcHJldmlldyB0aGUgcGlja2VkIGNvbG9yIHVzaW5nIENTUyBiYWNrZ3JvdW5kQ29sb3Jcblx0XHR0aGlzLnJlcXVpcmVkID0gdHJ1ZTsgLy8gd2hldGhlciB0aGUgYXNzb2NpYXRlZCB0ZXh0IDxpbnB1dD4gY2FuIGJlIGxlZnQgZW1wdHlcblx0XHR0aGlzLnJlZmluZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gcmVmaW5lIHRoZSBlbnRlcmVkIGNvbG9yIGNvZGUgKGUuZy4gdXBwZXJjYXNlIGl0IGFuZCByZW1vdmUgd2hpdGVzcGFjZSlcblx0XHR0aGlzLmhhc2ggPSBmYWxzZTsgLy8gd2hldGhlciB0byBwcmVmaXggdGhlIEhFWCBjb2xvciBjb2RlIHdpdGggIyBzeW1ib2xcblx0XHR0aGlzLnVwcGVyY2FzZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gdXBwZXJjYXNlIHRoZSBjb2xvciBjb2RlXG5cdFx0dGhpcy5vbkZpbmVDaGFuZ2UgPSBudWxsOyAvLyBjYWxsZWQgaW5zdGFudGx5IGV2ZXJ5IHRpbWUgdGhlIGNvbG9yIGNoYW5nZXMgKHZhbHVlIGNhbiBiZSBlaXRoZXIgYSBmdW5jdGlvbiBvciBhIHN0cmluZyB3aXRoIGphdmFzY3JpcHQgY29kZSlcblx0XHR0aGlzLmFjdGl2ZUNsYXNzID0gJ2pzY29sb3ItYWN0aXZlJzsgLy8gY2xhc3MgdG8gYmUgc2V0IHRvIHRoZSB0YXJnZXQgZWxlbWVudCB3aGVuIGEgcGlja2VyIHdpbmRvdyBpcyBvcGVuIG9uIGl0XG5cdFx0dGhpcy5taW5TID0gMDsgLy8gbWluIGFsbG93ZWQgc2F0dXJhdGlvbiAoMCAtIDEwMClcblx0XHR0aGlzLm1heFMgPSAxMDA7IC8vIG1heCBhbGxvd2VkIHNhdHVyYXRpb24gKDAgLSAxMDApXG5cdFx0dGhpcy5taW5WID0gMDsgLy8gbWluIGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXHRcdHRoaXMubWF4ViA9IDEwMDsgLy8gbWF4IGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXG5cdFx0Ly8gQWNjZXNzaW5nIHRoZSBwaWNrZWQgY29sb3Jcblx0XHQvL1xuXHRcdHRoaXMuaHN2ID0gWzAsIDAsIDEwMF07IC8vIHJlYWQtb25seSAgWzAtMzYwLCAwLTEwMCwgMC0xMDBdXG5cdFx0dGhpcy5yZ2IgPSBbMjU1LCAyNTUsIDI1NV07IC8vIHJlYWQtb25seSAgWzAtMjU1LCAwLTI1NSwgMC0yNTVdXG5cblx0XHQvLyBDb2xvciBQaWNrZXIgb3B0aW9uc1xuXHRcdC8vXG5cdFx0dGhpcy53aWR0aCA9IDE4MTsgLy8gd2lkdGggb2YgY29sb3IgcGFsZXR0ZSAoaW4gcHgpXG5cdFx0dGhpcy5oZWlnaHQgPSAxMDE7IC8vIGhlaWdodCBvZiBjb2xvciBwYWxldHRlIChpbiBweClcblx0XHR0aGlzLnNob3dPbkNsaWNrID0gdHJ1ZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBjb2xvciBwaWNrZXIgd2hlbiB1c2VyIGNsaWNrcyBvbiBpdHMgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLm1vZGUgPSAnSFNWJzsgLy8gSFNWIHwgSFZTIHwgSFMgfCBIViAtIGxheW91dCBvZiB0aGUgY29sb3IgcGlja2VyIGNvbnRyb2xzXG5cdFx0dGhpcy5wb3NpdGlvbiA9ICdib3R0b20nOyAvLyBsZWZ0IHwgcmlnaHQgfCB0b3AgfCBib3R0b20gLSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLnNtYXJ0UG9zaXRpb24gPSB0cnVlOyAvLyBhdXRvbWF0aWNhbGx5IGNoYW5nZSBwaWNrZXIgcG9zaXRpb24gd2hlbiB0aGVyZSBpcyBub3QgZW5vdWdoIHNwYWNlIGZvciBpdFxuXHRcdHRoaXMuc2xpZGVyU2l6ZSA9IDE2OyAvLyBweFxuXHRcdHRoaXMuY3Jvc3NTaXplID0gODsgLy8gcHhcblx0XHR0aGlzLmNsb3NhYmxlID0gZmFsc2U7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0dGhpcy5jbG9zZVRleHQgPSAnQ2xvc2UnO1xuXHRcdHRoaXMuYnV0dG9uQ29sb3IgPSAnIzAwMDAwMCc7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYnV0dG9uSGVpZ2h0ID0gMTg7IC8vIHB4XG5cdFx0dGhpcy5wYWRkaW5nID0gMTI7IC8vIHB4XG5cdFx0dGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSAnI0ZGRkZGRic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyV2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuYm9yZGVyQ29sb3IgPSAnI0JCQkJCQic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyUmFkaXVzID0gODsgLy8gcHhcblx0XHR0aGlzLmluc2V0V2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuaW5zZXRDb2xvciA9ICcjQkJCQkJCJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5zaGFkb3cgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgc2hhZG93XG5cdFx0dGhpcy5zaGFkb3dCbHVyID0gMTU7IC8vIHB4XG5cdFx0dGhpcy5zaGFkb3dDb2xvciA9ICdyZ2JhKDAsMCwwLDAuMiknOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLnBvaW50ZXJDb2xvciA9ICcjNEM0QzRDJzsgLy8gcHhcblx0XHR0aGlzLnBvaW50ZXJCb3JkZXJDb2xvciA9ICcjRkZGRkZGJzsgLy8gcHhcbiAgICAgICAgdGhpcy5wb2ludGVyQm9yZGVyV2lkdGggPSAxOyAvLyBweFxuICAgICAgICB0aGlzLnBvaW50ZXJUaGlja25lc3MgPSAyOyAvLyBweFxuXHRcdHRoaXMuekluZGV4ID0gMTAwMDtcblx0XHR0aGlzLmNvbnRhaW5lciA9IG51bGw7IC8vIHdoZXJlIHRvIGFwcGVuZCB0aGUgY29sb3IgcGlja2VyIChCT0RZIGVsZW1lbnQgYnkgZGVmYXVsdClcblxuXG5cdFx0Zm9yICh2YXIgb3B0IGluIG9wdGlvbnMpIHtcblx0XHRcdGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KG9wdCkpIHtcblx0XHRcdFx0dGhpc1tvcHRdID0gb3B0aW9uc1tvcHRdO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0dGhpcy5oaWRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRkZXRhY2hQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRkcmF3UGlja2VyKCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5yZWRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdGRyYXdQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmltcG9ydENvbG9yID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCF0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGlzLnJlZmluZSkge1xuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUsIGpzYy5sZWF2ZVZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRJbWFnZTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuY29sb3I7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKCF0aGlzLnJlcXVpcmVkICYmIC9eXFxzKiQvLnRlc3QodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSA9ICcnO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZEltYWdlO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmNvbG9yO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWVFbGVtZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0Ly8gbWFuYWdlZCB0byBpbXBvcnQgY29sb3Igc3VjY2Vzc2Z1bGx5IGZyb20gdGhlIHZhbHVlIC0+IE9LLCBkb24ndCBkbyBhbnl0aGluZ1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIG5vdCBhbiBpbnB1dCBlbGVtZW50IC0+IGRvZXNuJ3QgaGF2ZSBhbnkgdmFsdWVcblx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmV4cG9ydENvbG9yID0gZnVuY3Rpb24gKGZsYWdzKSB7XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVZhbHVlKSAmJiB0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdGlmICh0aGlzLnVwcGVyY2FzZSkgeyB2YWx1ZSA9IHZhbHVlLnRvVXBwZXJDYXNlKCk7IH1cblx0XHRcdFx0aWYgKHRoaXMuaGFzaCkgeyB2YWx1ZSA9ICcjJyArIHZhbHVlOyB9XG5cblx0XHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU3R5bGUpKSB7XG5cdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICdub25lJztcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLmlzTGlnaHQoKSA/ICcjMDAwJyA6ICcjRkZGJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVQYWQpICYmIGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRyZWRyYXdQYWQoKTtcblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU2xkKSAmJiBpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0cmVkcmF3U2xkKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0Ly8gaDogMC0zNjBcblx0XHQvLyBzOiAwLTEwMFxuXHRcdC8vIHY6IDAtMTAwXG5cdFx0Ly9cblx0XHR0aGlzLmZyb21IU1YgPSBmdW5jdGlvbiAoaCwgcywgdiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKGggIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGgpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzYwLCBoKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAocyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4ocykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHMgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgcyksIHRoaXMubWluUyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodiAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4odikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHYgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgdiksIHRoaXMubWluVik7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmdiID0gSFNWX1JHQihcblx0XHRcdFx0aD09PW51bGwgPyB0aGlzLmhzdlswXSA6ICh0aGlzLmhzdlswXT1oKSxcblx0XHRcdFx0cz09PW51bGwgPyB0aGlzLmhzdlsxXSA6ICh0aGlzLmhzdlsxXT1zKSxcblx0XHRcdFx0dj09PW51bGwgPyB0aGlzLmhzdlsyXSA6ICh0aGlzLmhzdlsyXT12KVxuXHRcdFx0KTtcblxuXHRcdFx0dGhpcy5leHBvcnRDb2xvcihmbGFncyk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHR0aGlzLmZyb21SR0IgPSBmdW5jdGlvbiAociwgZywgYiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKHIgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHIpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRyID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oZykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGcpKTtcblx0XHRcdH1cblx0XHRcdGlmIChiICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihiKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0YiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgYikpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaHN2ID0gUkdCX0hTVihcblx0XHRcdFx0cj09PW51bGwgPyB0aGlzLnJnYlswXSA6IHIsXG5cdFx0XHRcdGc9PT1udWxsID8gdGhpcy5yZ2JbMV0gOiBnLFxuXHRcdFx0XHRiPT09bnVsbCA/IHRoaXMucmdiWzJdIDogYlxuXHRcdFx0KTtcblx0XHRcdGlmIChoc3ZbMF0gIT09IG51bGwpIHtcblx0XHRcdFx0dGhpcy5oc3ZbMF0gPSBNYXRoLm1heCgwLCBNYXRoLm1pbigzNjAsIGhzdlswXSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGhzdlsyXSAhPT0gMCkge1xuXHRcdFx0XHR0aGlzLmhzdlsxXSA9IGhzdlsxXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5TLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgaHN2WzFdKSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmhzdlsyXSA9IGhzdlsyXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5WLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgaHN2WzJdKSk7XG5cblx0XHRcdC8vIHVwZGF0ZSBSR0IgYWNjb3JkaW5nIHRvIGZpbmFsIEhTViwgYXMgc29tZSB2YWx1ZXMgbWlnaHQgYmUgdHJpbW1lZFxuXHRcdFx0dmFyIHJnYiA9IEhTVl9SR0IodGhpcy5oc3ZbMF0sIHRoaXMuaHN2WzFdLCB0aGlzLmhzdlsyXSk7XG5cdFx0XHR0aGlzLnJnYlswXSA9IHJnYlswXTtcblx0XHRcdHRoaXMucmdiWzFdID0gcmdiWzFdO1xuXHRcdFx0dGhpcy5yZ2JbMl0gPSByZ2JbMl07XG5cblx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoZmxhZ3MpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuZnJvbVN0cmluZyA9IGZ1bmN0aW9uIChzdHIsIGZsYWdzKSB7XG5cdFx0XHR2YXIgbTtcblx0XHRcdGlmIChtID0gc3RyLm1hdGNoKC9eXFxXKihbMC05QS1GXXszfShbMC05QS1GXXszfSk/KVxcVyokL2kpKSB7XG5cdFx0XHRcdC8vIEhFWCBub3RhdGlvblxuXHRcdFx0XHQvL1xuXG5cdFx0XHRcdGlmIChtWzFdLmxlbmd0aCA9PT0gNikge1xuXHRcdFx0XHRcdC8vIDYtY2hhciBub3RhdGlvblxuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDAsMiksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoMiwyKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cig0LDIpLDE2KSxcblx0XHRcdFx0XHRcdGZsYWdzXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyAzLWNoYXIgbm90YXRpb25cblx0XHRcdFx0XHR0aGlzLmZyb21SR0IoXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgwKSArIG1bMV0uY2hhckF0KDApLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDEpICsgbVsxXS5jaGFyQXQoMSksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMikgKyBtWzFdLmNoYXJBdCgyKSwxNiksXG5cdFx0XHRcdFx0XHRmbGFnc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdH0gZWxzZSBpZiAobSA9IHN0ci5tYXRjaCgvXlxcVypyZ2JhP1xcKChbXildKilcXClcXFcqJC9pKSkge1xuXHRcdFx0XHR2YXIgcGFyYW1zID0gbVsxXS5zcGxpdCgnLCcpO1xuXHRcdFx0XHR2YXIgcmUgPSAvXlxccyooXFxkKikoXFwuXFxkKyk/XFxzKiQvO1xuXHRcdFx0XHR2YXIgbVIsIG1HLCBtQjtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHBhcmFtcy5sZW5ndGggPj0gMyAmJlxuXHRcdFx0XHRcdChtUiA9IHBhcmFtc1swXS5tYXRjaChyZSkpICYmXG5cdFx0XHRcdFx0KG1HID0gcGFyYW1zWzFdLm1hdGNoKHJlKSkgJiZcblx0XHRcdFx0XHQobUIgPSBwYXJhbXNbMl0ubWF0Y2gocmUpKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR2YXIgciA9IHBhcnNlRmxvYXQoKG1SWzFdIHx8ICcwJykgKyAobVJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgZyA9IHBhcnNlRmxvYXQoKG1HWzFdIHx8ICcwJykgKyAobUdbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgYiA9IHBhcnNlRmxvYXQoKG1CWzFdIHx8ICcwJykgKyAobUJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR0aGlzLmZyb21SR0IociwgZywgYiwgZmxhZ3MpO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMF0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpICtcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkgK1xuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKVxuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvSEVYU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuICcjJyArIHRoaXMudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9SR0JTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKCdyZ2IoJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMF0pICsgJywnICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSArICcpJ1xuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLmlzTGlnaHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQwLjIxMyAqIHRoaXMucmdiWzBdICtcblx0XHRcdFx0MC43MTUgKiB0aGlzLnJnYlsxXSArXG5cdFx0XHRcdDAuMDcyICogdGhpcy5yZ2JbMl0gPlxuXHRcdFx0XHQyNTUgLyAyXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuX3Byb2Nlc3NQYXJlbnRFbGVtZW50c0luRE9NID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHRoaXMuX2xpbmtlZEVsZW1lbnRzUHJvY2Vzc2VkKSB7IHJldHVybjsgfVxuXHRcdFx0dGhpcy5fbGlua2VkRWxlbWVudHNQcm9jZXNzZWQgPSB0cnVlO1xuXG5cdFx0XHR2YXIgZWxtID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgb3Igb25lIG9mIGl0cyBwYXJlbnQgbm9kZXMgaGFzIGZpeGVkIHBvc2l0aW9uLFxuXHRcdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHRcdC8vXG5cdFx0XHRcdC8vIE5vdGU6IEluIEZpcmVmb3gsIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBudWxsIGluIGEgaGlkZGVuIGlmcmFtZSxcblx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHRcdHZhciBjdXJyU3R5bGUgPSBqc2MuZ2V0U3R5bGUoZWxtKTtcblx0XHRcdFx0aWYgKGN1cnJTdHlsZSAmJiBjdXJyU3R5bGUucG9zaXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2ZpeGVkJykge1xuXHRcdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGVsbSAhPT0gdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gRW5zdXJlIHRvIGF0dGFjaCBvblBhcmVudFNjcm9sbCBvbmx5IG9uY2UgdG8gZWFjaCBwYXJlbnQgZWxlbWVudFxuXHRcdFx0XHRcdC8vIChtdWx0aXBsZSB0YXJnZXRFbGVtZW50cyBjYW4gc2hhcmUgdGhlIHNhbWUgcGFyZW50IG5vZGVzKVxuXHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0Ly8gTm90ZTogSXQncyBub3QganVzdCBvZmZzZXRQYXJlbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGFibGUsXG5cdFx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBsb29wIHRocm91Z2ggYWxsIHBhcmVudCBub2Rlc1xuXHRcdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KGVsbSwgJ3Njcm9sbCcsIGpzYy5vblBhcmVudFNjcm9sbCk7XG5cdFx0XHRcdFx0XHRlbG0uX2pzY0V2ZW50c0F0dGFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gd2hpbGUgKChlbG0gPSBlbG0ucGFyZW50Tm9kZSkgJiYgIWpzYy5pc0VsZW1lbnRUeXBlKGVsbSwgJ2JvZHknKSk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHQvLyByZXR1cm5zOiBbIDAtMzYwLCAwLTEwMCwgMC0xMDAgXVxuXHRcdC8vXG5cdFx0ZnVuY3Rpb24gUkdCX0hTViAociwgZywgYikge1xuXHRcdFx0ciAvPSAyNTU7XG5cdFx0XHRnIC89IDI1NTtcblx0XHRcdGIgLz0gMjU1O1xuXHRcdFx0dmFyIG4gPSBNYXRoLm1pbihNYXRoLm1pbihyLGcpLGIpO1xuXHRcdFx0dmFyIHYgPSBNYXRoLm1heChNYXRoLm1heChyLGcpLGIpO1xuXHRcdFx0dmFyIG0gPSB2IC0gbjtcblx0XHRcdGlmIChtID09PSAwKSB7IHJldHVybiBbIG51bGwsIDAsIDEwMCAqIHYgXTsgfVxuXHRcdFx0dmFyIGggPSByPT09biA/IDMrKGItZykvbSA6IChnPT09biA/IDUrKHItYikvbSA6IDErKGctcikvbSk7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHQ2MCAqIChoPT09Nj8wOmgpLFxuXHRcdFx0XHQxMDAgKiAobS92KSxcblx0XHRcdFx0MTAwICogdlxuXHRcdFx0XTtcblx0XHR9XG5cblxuXHRcdC8vIGg6IDAtMzYwXG5cdFx0Ly8gczogMC0xMDBcblx0XHQvLyB2OiAwLTEwMFxuXHRcdC8vXG5cdFx0Ly8gcmV0dXJuczogWyAwLTI1NSwgMC0yNTUsIDAtMjU1IF1cblx0XHQvL1xuXHRcdGZ1bmN0aW9uIEhTVl9SR0IgKGgsIHMsIHYpIHtcblx0XHRcdHZhciB1ID0gMjU1ICogKHYgLyAxMDApO1xuXG5cdFx0XHRpZiAoaCA9PT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gWyB1LCB1LCB1IF07XG5cdFx0XHR9XG5cblx0XHRcdGggLz0gNjA7XG5cdFx0XHRzIC89IDEwMDtcblxuXHRcdFx0dmFyIGkgPSBNYXRoLmZsb29yKGgpO1xuXHRcdFx0dmFyIGYgPSBpJTIgPyBoLWkgOiAxLShoLWkpO1xuXHRcdFx0dmFyIG0gPSB1ICogKDEgLSBzKTtcblx0XHRcdHZhciBuID0gdSAqICgxIC0gcyAqIGYpO1xuXHRcdFx0c3dpdGNoIChpKSB7XG5cdFx0XHRcdGNhc2UgNjpcblx0XHRcdFx0Y2FzZSAwOiByZXR1cm4gW3UsbixtXTtcblx0XHRcdFx0Y2FzZSAxOiByZXR1cm4gW24sdSxtXTtcblx0XHRcdFx0Y2FzZSAyOiByZXR1cm4gW20sdSxuXTtcblx0XHRcdFx0Y2FzZSAzOiByZXR1cm4gW20sbix1XTtcblx0XHRcdFx0Y2FzZSA0OiByZXR1cm4gW24sbSx1XTtcblx0XHRcdFx0Y2FzZSA1OiByZXR1cm4gW3UsbSxuXTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGRldGFjaFBpY2tlciAoKSB7XG5cdFx0XHRqc2MudW5zZXRDbGFzcyhUSElTLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0anNjLnBpY2tlci53cmFwLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoanNjLnBpY2tlci53cmFwKTtcblx0XHRcdGRlbGV0ZSBqc2MucGlja2VyLm93bmVyO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gZHJhd1BpY2tlciAoKSB7XG5cblx0XHRcdC8vIEF0IHRoaXMgcG9pbnQsIHdoZW4gZHJhd2luZyB0aGUgcGlja2VyLCB3ZSBrbm93IHdoYXQgdGhlIHBhcmVudCBlbGVtZW50cyBhcmVcblx0XHRcdC8vIGFuZCB3ZSBjYW4gZG8gYWxsIHJlbGF0ZWQgRE9NIG9wZXJhdGlvbnMsIHN1Y2ggYXMgcmVnaXN0ZXJpbmcgZXZlbnRzIG9uIHRoZW1cblx0XHRcdC8vIG9yIGNoZWNraW5nIHRoZWlyIHBvc2l0aW9uaW5nXG5cdFx0XHRUSElTLl9wcm9jZXNzUGFyZW50RWxlbWVudHNJbkRPTSgpO1xuXG5cdFx0XHRpZiAoIWpzYy5waWNrZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlciA9IHtcblx0XHRcdFx0XHRvd25lcjogbnVsbCxcblx0XHRcdFx0XHR3cmFwIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94IDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94UyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzaGFkb3cgYXJlYVxuXHRcdFx0XHRcdGJveEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0cGFkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0cGFkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRwYWRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRwYWRQYWwgOiBqc2MuY3JlYXRlUGFsZXR0ZSgpLFxuXHRcdFx0XHRcdGNyb3NzIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Y3Jvc3NCWSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXIgWVxuXHRcdFx0XHRcdGNyb3NzQlggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyIFhcblx0XHRcdFx0XHRjcm9zc0xZIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGxpbmUgWVxuXHRcdFx0XHRcdGNyb3NzTFggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbGluZSBYXG5cdFx0XHRcdFx0c2xkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0c2xkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRzbGRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRzbGRHcmFkIDoganNjLmNyZWF0ZVNsaWRlckdyYWRpZW50KCksXG5cdFx0XHRcdFx0c2xkUHRyUyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdFx0XHRzbGRQdHJJQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBib3JkZXJcblx0XHRcdFx0XHRzbGRQdHJNQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBtaWRkbGUgYm9yZGVyXG5cdFx0XHRcdFx0c2xkUHRyT0IgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRcdFx0YnRuIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0YnRuVCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSAvLyB0ZXh0XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0anNjLnBpY2tlci5wYWQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRQYWwuZWxtKTtcblx0XHRcdFx0anNjLnBpY2tlci5wYWRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzQlkpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NCWCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0xZKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzTFgpO1xuXHRcdFx0XHRqc2MucGlja2VyLnBhZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zcyk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkTSk7XG5cblx0XHRcdFx0anNjLnBpY2tlci5zbGQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRHcmFkLmVsbSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck9CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJPQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck1CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJNQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0cklCKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJJQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0clMpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZEIpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZE0pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuYnRuLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuVCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLmJveEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3gpO1xuXHRcdFx0XHRqc2MucGlja2VyLndyYXAuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3hTKTtcblx0XHRcdFx0anNjLnBpY2tlci53cmFwLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94Qik7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwID0ganNjLnBpY2tlcjtcblxuXHRcdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUyk7XG5cdFx0XHR2YXIgZGltcyA9IGpzYy5nZXRQaWNrZXJEaW1zKFRISVMpO1xuXHRcdFx0dmFyIGNyb3NzT3V0ZXJTaXplID0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcyArIDIgKiBUSElTLmNyb3NzU2l6ZSk7XG5cdFx0XHR2YXIgcGFkVG9TbGlkZXJQYWRkaW5nID0ganNjLmdldFBhZFRvU2xpZGVyUGFkZGluZyhUSElTKTtcblx0XHRcdHZhciBib3JkZXJSYWRpdXMgPSBNYXRoLm1pbihcblx0XHRcdFx0VEhJUy5ib3JkZXJSYWRpdXMsXG5cdFx0XHRcdE1hdGgucm91bmQoVEhJUy5wYWRkaW5nICogTWF0aC5QSSkpOyAvLyBweFxuXHRcdFx0dmFyIHBhZEN1cnNvciA9ICdjcm9zc2hhaXInO1xuXG5cdFx0XHQvLyB3cmFwXG5cdFx0XHRwLndyYXAuc3R5bGUuY2xlYXIgPSAnYm90aCc7XG5cdFx0XHRwLndyYXAuc3R5bGUud2lkdGggPSAoZGltc1swXSArIDIgKiBUSElTLmJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLndyYXAuc3R5bGUuaGVpZ2h0ID0gKGRpbXNbMV0gKyAyICogVEhJUy5ib3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLnpJbmRleCA9IFRISVMuekluZGV4O1xuXG5cdFx0XHQvLyBwaWNrZXJcblx0XHRcdHAuYm94LnN0eWxlLndpZHRoID0gZGltc1swXSArICdweCc7XG5cdFx0XHRwLmJveC5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4JztcblxuXHRcdFx0cC5ib3hTLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAuYm94Uy5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHRqc2Muc2V0Qm9yZGVyUmFkaXVzKHAuYm94UywgYm9yZGVyUmFkaXVzICsgJ3B4Jyk7XG5cblx0XHRcdC8vIHBpY2tlciBib3JkZXJcblx0XHRcdHAuYm94Qi5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyID0gVEhJUy5ib3JkZXJXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmJvcmRlckNvbG9yO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJhY2tncm91bmQgPSBUSElTLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdGpzYy5zZXRCb3JkZXJSYWRpdXMocC5ib3hCLCBib3JkZXJSYWRpdXMgKyAncHgnKTtcblxuXHRcdFx0Ly8gSUUgaGFjazpcblx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGlzIHRyYW5zcGFyZW50LCBJRSB3aWxsIHRyaWdnZXIgdGhlIGV2ZW50IG9uIHRoZSBlbGVtZW50cyB1bmRlciBpdCxcblx0XHRcdC8vIGUuZy4gb24gQ2FudmFzIG9yIG9uIGVsZW1lbnRzIHdpdGggYm9yZGVyXG5cdFx0XHRwLnBhZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLnNsZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdCcjRkZGJztcblx0XHRcdGpzYy5zZXRTdHlsZShwLnBhZE0sICdvcGFjaXR5JywgJzAnKTtcblx0XHRcdGpzYy5zZXRTdHlsZShwLnNsZE0sICdvcGFjaXR5JywgJzAnKTtcblxuXHRcdFx0Ly8gcGFkXG5cdFx0XHRwLnBhZC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLnBhZC5zdHlsZS53aWR0aCA9IFRISVMud2lkdGggKyAncHgnO1xuXHRcdFx0cC5wYWQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgcGFsZXR0ZXMgKEhTViBhbmQgSFZTKVxuXHRcdFx0cC5wYWRQYWwuZHJhdyhUSElTLndpZHRoLCBUSElTLmhlaWdodCwganNjLmdldFBhZFlDb21wb25lbnQoVEhJUykpO1xuXG5cdFx0XHQvLyBwYWQgYm9yZGVyXG5cdFx0XHRwLnBhZEIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmxlZnQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAucGFkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gcGFkIG1vdXNlIGFyZWFcblx0XHRcdHAucGFkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5wYWRNLl9qc2NDb250cm9sTmFtZSA9ICdwYWQnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAucGFkTS5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAucGFkTS5zdHlsZS53aWR0aCA9IChUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoICsgVEhJUy53aWR0aCArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIpICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5jdXJzb3IgPSBwYWRDdXJzb3I7XG5cblx0XHRcdC8vIHBhZCBjcm9zc1xuXHRcdFx0cC5jcm9zcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zcy5zdHlsZS50b3AgPVxuXHRcdFx0XHQnMCc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3Muc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0Y3Jvc3NPdXRlclNpemUgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3MgYm9yZGVyIFkgYW5kIFhcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0XHQnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0KDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUud2lkdGggPVxuXHRcdFx0XHRjcm9zc091dGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUudG9wID1cblx0XHRcdFx0KE1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKSAtIE1hdGguZmxvb3IoVEhJUy5wb2ludGVyVGhpY2tuZXNzIC8gMikgLSBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUubGVmdCA9XG5cdFx0XHRcdCcwJztcblxuXHRcdFx0Ly8gcGFkIGNyb3NzIGxpbmUgWSBhbmQgWFxuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRcdCdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckNvbG9yO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUud2lkdGggPVxuXHRcdFx0XHQoY3Jvc3NPdXRlclNpemUgLSAyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0VEhJUy5wb2ludGVyVGhpY2tuZXNzICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS50b3AgPVxuXHRcdFx0XHQoTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpIC0gTWF0aC5mbG9vcihUSElTLnBvaW50ZXJUaGlja25lc3MgLyAyKSkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUubGVmdCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4JztcblxuXHRcdFx0Ly8gc2xpZGVyXG5cdFx0XHRwLnNsZC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXHRcdFx0cC5zbGQuc3R5bGUud2lkdGggPSBUSElTLnNsaWRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5zbGQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBzbGlkZXIgZ3JhZGllbnRcblx0XHRcdHAuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsICcjMDAwJywgJyMwMDAnKTtcblxuXHRcdFx0Ly8gc2xpZGVyIGJvcmRlclxuXHRcdFx0cC5zbGRCLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZEIuc3R5bGUucmlnaHQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAuc2xkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIG1vdXNlIGFyZWFcblx0XHRcdHAuc2xkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5zbGRNLl9qc2NDb250cm9sTmFtZSA9ICdzbGQnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkTS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZE0uc3R5bGUucmlnaHQgPSAnMCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLndpZHRoID0gKFRISVMuc2xpZGVyU2l6ZSArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIgKyBUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoKSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBhbmQgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0cklCLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4IHNvbGlkICcgKyBUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUubGVmdCA9IC0oMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSArICdweCc7XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICcwJztcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgbWlkZGxlIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJNQi5zdHlsZS5ib3JkZXIgPSBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAncHggc29saWQgJyArIFRISVMucG9pbnRlckNvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdHAuc2xkUHRyUy5zdHlsZS53aWR0aCA9IFRISVMuc2xpZGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLnNsZFB0clMuc3R5bGUuaGVpZ2h0ID0gc2xpZGVyUHRyU3BhY2UgKyAncHgnO1xuXG5cdFx0XHQvLyB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0XHRmdW5jdGlvbiBzZXRCdG5Cb3JkZXIgKCkge1xuXHRcdFx0XHR2YXIgaW5zZXRDb2xvcnMgPSBUSElTLmluc2V0Q29sb3Iuc3BsaXQoL1xccysvKTtcblx0XHRcdFx0dmFyIG91dHNldENvbG9yID0gaW5zZXRDb2xvcnMubGVuZ3RoIDwgMiA/IGluc2V0Q29sb3JzWzBdIDogaW5zZXRDb2xvcnNbMV0gKyAnICcgKyBpbnNldENvbG9yc1swXSArICcgJyArIGluc2V0Q29sb3JzWzBdICsgJyAnICsgaW5zZXRDb2xvcnNbMV07XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmJvcmRlckNvbG9yID0gb3V0c2V0Q29sb3I7XG5cdFx0XHR9XG5cdFx0XHRwLmJ0bi5zdHlsZS5kaXNwbGF5ID0gVEhJUy5jbG9zYWJsZSA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5sZWZ0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmJvdHRvbSA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wYWRkaW5nID0gJzAgMTVweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5oZWlnaHQgPSBUSElTLmJ1dHRvbkhlaWdodCArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0c2V0QnRuQm9yZGVyKCk7XG5cdFx0XHRwLmJ0bi5zdHlsZS5jb2xvciA9IFRISVMuYnV0dG9uQ29sb3I7XG5cdFx0XHRwLmJ0bi5zdHlsZS5mb250ID0gJzEycHggc2Fucy1zZXJpZic7XG5cdFx0XHRwLmJ0bi5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcblx0XHRcdH0gY2F0Y2goZU9sZElFKSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdoYW5kJztcblx0XHRcdH1cblx0XHRcdHAuYnRuLm9ubW91c2Vkb3duID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRUSElTLmhpZGUoKTtcblx0XHRcdH07XG5cdFx0XHRwLmJ0blQuc3R5bGUubGluZUhlaWdodCA9IFRISVMuYnV0dG9uSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdHAuYnRuVC5pbm5lckhUTUwgPSAnJztcblx0XHRcdHAuYnRuVC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShUSElTLmNsb3NlVGV4dCkpO1xuXG5cdFx0XHQvLyBwbGFjZSBwb2ludGVyc1xuXHRcdFx0cmVkcmF3UGFkKCk7XG5cdFx0XHRyZWRyYXdTbGQoKTtcblxuXHRcdFx0Ly8gSWYgd2UgYXJlIGNoYW5naW5nIHRoZSBvd25lciB3aXRob3V0IGZpcnN0IGNsb3NpbmcgdGhlIHBpY2tlcixcblx0XHRcdC8vIG1ha2Ugc3VyZSB0byBmaXJzdCBkZWFsIHdpdGggdGhlIG9sZCBvd25lclxuXHRcdFx0aWYgKGpzYy5waWNrZXIub3duZXIgJiYganNjLnBpY2tlci5vd25lciAhPT0gVEhJUykge1xuXHRcdFx0XHRqc2MudW5zZXRDbGFzcyhqc2MucGlja2VyLm93bmVyLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZXQgdGhlIG5ldyBwaWNrZXIgb3duZXJcblx0XHRcdGpzYy5waWNrZXIub3duZXIgPSBUSElTO1xuXG5cdFx0XHQvLyBUaGUgcmVkcmF3UG9zaXRpb24oKSBtZXRob2QgbmVlZHMgcGlja2VyLm93bmVyIHRvIGJlIHNldCwgdGhhdCdzIHdoeSB3ZSBjYWxsIGl0IGhlcmUsXG5cdFx0XHQvLyBhZnRlciBzZXR0aW5nIHRoZSBvd25lclxuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKGNvbnRhaW5lciwgJ2JvZHknKSkge1xuXHRcdFx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKFRISVMsIDAsIDAsICdyZWxhdGl2ZScsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHAud3JhcC5wYXJlbnROb2RlICE9IGNvbnRhaW5lcikge1xuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQocC53cmFwKTtcblx0XHRcdH1cblxuXHRcdFx0anNjLnNldENsYXNzKFRISVMudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiByZWRyYXdQYWQgKCkge1xuXHRcdFx0Ly8gcmVkcmF3IHRoZSBwYWQgcG9pbnRlclxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0UGFkWUNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6IHZhciB5Q29tcG9uZW50ID0gMTsgYnJlYWs7XG5cdFx0XHRjYXNlICd2JzogdmFyIHlDb21wb25lbnQgPSAyOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciB4ID0gTWF0aC5yb3VuZCgoVEhJUy5oc3ZbMF0gLyAzNjApICogKFRISVMud2lkdGggLSAxKSk7XG5cdFx0XHR2YXIgeSA9IE1hdGgucm91bmQoKDEgLSBUSElTLmhzdlt5Q29tcG9uZW50XSAvIDEwMCkgKiAoVEhJUy5oZWlnaHQgLSAxKSk7XG5cdFx0XHR2YXIgY3Jvc3NPdXRlclNpemUgPSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgMiAqIFRISVMuY3Jvc3NTaXplKTtcblx0XHRcdHZhciBvZnMgPSAtTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpO1xuXHRcdFx0anNjLnBpY2tlci5jcm9zcy5zdHlsZS5sZWZ0ID0gKHggKyBvZnMpICsgJ3B4Jztcblx0XHRcdGpzYy5waWNrZXIuY3Jvc3Muc3R5bGUudG9wID0gKHkgKyBvZnMpICsgJ3B4JztcblxuXHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXJcblx0XHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdHZhciByZ2IxID0gSFNWX1JHQihUSElTLmhzdlswXSwgMTAwLCBUSElTLmhzdlsyXSk7XG5cdFx0XHRcdHZhciByZ2IyID0gSFNWX1JHQihUSElTLmhzdlswXSwgMCwgVEhJUy5oc3ZbMl0pO1xuXHRcdFx0XHR2YXIgY29sb3IxID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMl0pICsgJyknO1xuXHRcdFx0XHR2YXIgY29sb3IyID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMl0pICsgJyknO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdHZhciByZ2IgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCBUSElTLmhzdlsxXSwgMTAwKTtcblx0XHRcdFx0dmFyIGNvbG9yMSA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzJdKSArICcpJztcblx0XHRcdFx0dmFyIGNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0anNjLnBpY2tlci5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgY29sb3IxLCBjb2xvcjIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIHJlZHJhd1NsZCAoKSB7XG5cdFx0XHR2YXIgc2xkQ29tcG9uZW50ID0ganNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKTtcblx0XHRcdGlmIChzbGRDb21wb25lbnQpIHtcblx0XHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXIgcG9pbnRlclxuXHRcdFx0XHRzd2l0Y2ggKHNsZENvbXBvbmVudCkge1xuXHRcdFx0XHRjYXNlICdzJzogdmFyIHlDb21wb25lbnQgPSAxOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndic6IHZhciB5Q29tcG9uZW50ID0gMjsgYnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIHkgPSBNYXRoLnJvdW5kKCgxIC0gVEhJUy5oc3ZbeUNvbXBvbmVudF0gLyAxMDApICogKFRISVMuaGVpZ2h0IC0gMSkpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICh5IC0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgLSBNYXRoLmZsb29yKHNsaWRlclB0clNwYWNlIC8gMikpICsgJ3B4Jztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGlzUGlja2VyT3duZXIgKCkge1xuXHRcdFx0cmV0dXJuIGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lciA9PT0gVEhJUztcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGJsdXJWYWx1ZSAoKSB7XG5cdFx0XHRUSElTLmltcG9ydENvbG9yKCk7XG5cdFx0fVxuXG5cblx0XHQvLyBGaW5kIHRoZSB0YXJnZXQgZWxlbWVudFxuXHRcdGlmICh0eXBlb2YgdGFyZ2V0RWxlbWVudCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHZhciBpZCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHR2YXIgZWxtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGVsbSkge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBlbG07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRqc2Mud2FybignQ291bGQgbm90IGZpbmQgdGFyZ2V0IGVsZW1lbnQgd2l0aCBJRCBcXCcnICsgaWQgKyAnXFwnJyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRqc2Mud2FybignSW52YWxpZCB0YXJnZXQgZWxlbWVudDogXFwnJyArIHRhcmdldEVsZW1lbnQgKyAnXFwnJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGpzYy53YXJuKCdDYW5ub3QgbGluayBqc2NvbG9yIHR3aWNlIHRvIHRoZSBzYW1lIGVsZW1lbnQuIFNraXBwaW5nLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnRhcmdldEVsZW1lbnQuX2pzY0xpbmtlZEluc3RhbmNlID0gdGhpcztcblxuXHRcdC8vIEZpbmQgdGhlIHZhbHVlIGVsZW1lbnRcblx0XHR0aGlzLnZhbHVlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy52YWx1ZUVsZW1lbnQpO1xuXHRcdC8vIEZpbmQgdGhlIHN0eWxlIGVsZW1lbnRcblx0XHR0aGlzLnN0eWxlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy5zdHlsZUVsZW1lbnQpO1xuXG5cdFx0dmFyIFRISVMgPSB0aGlzO1xuXHRcdHZhciBjb250YWluZXIgPVxuXHRcdFx0dGhpcy5jb250YWluZXIgP1xuXHRcdFx0anNjLmZldGNoRWxlbWVudCh0aGlzLmNvbnRhaW5lcikgOlxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcblx0XHR2YXIgc2xpZGVyUHRyU3BhY2UgPSAzOyAvLyBweFxuXG5cdFx0Ly8gRm9yIEJVVFRPTiBlbGVtZW50cyBpdCdzIGltcG9ydGFudCB0byBzdG9wIHRoZW0gZnJvbSBzZW5kaW5nIHRoZSBmb3JtIHdoZW4gY2xpY2tlZFxuXHRcdC8vIChlLmcuIGluIFNhZmFyaSlcblx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy50YXJnZXRFbGVtZW50LCAnYnV0dG9uJykpIHtcblx0XHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQub25jbGljaykge1xuXHRcdFx0XHR2YXIgb3JpZ0NhbGxiYWNrID0gdGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2s7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKGV2dCkge1xuXHRcdFx0XHRcdG9yaWdDYWxsYmFjay5jYWxsKHRoaXMsIGV2dCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvKlxuXHRcdHZhciBlbG0gPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cdFx0ZG8ge1xuXHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IG9yIG9uZSBvZiBpdHMgb2Zmc2V0UGFyZW50cyBoYXMgZml4ZWQgcG9zaXRpb24sXG5cdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHQvL1xuXHRcdFx0Ly8gTm90ZTogSW4gRmlyZWZveCwgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm5zIG51bGwgaW4gYSBoaWRkZW4gaWZyYW1lLFxuXHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHR2YXIgY3VyclN0eWxlID0ganNjLmdldFN0eWxlKGVsbSk7XG5cdFx0XHRpZiAoY3VyclN0eWxlICYmIGN1cnJTdHlsZS5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZml4ZWQnKSB7XG5cdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZWxtICE9PSB0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdFx0Ly8gYXR0YWNoIG9uUGFyZW50U2Nyb2xsIHNvIHRoYXQgd2UgY2FuIHJlY29tcHV0ZSB0aGUgcGlja2VyIHBvc2l0aW9uXG5cdFx0XHRcdC8vIHdoZW4gb25lIG9mIHRoZSBvZmZzZXRQYXJlbnRzIGlzIHNjcm9sbGVkXG5cdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdGpzYy5hdHRhY2hFdmVudChlbG0sICdzY3JvbGwnLCBqc2Mub25QYXJlbnRTY3JvbGwpO1xuXHRcdFx0XHRcdGVsbS5fanNjRXZlbnRzQXR0YWNoZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSB3aGlsZSAoKGVsbSA9IGVsbS5vZmZzZXRQYXJlbnQpICYmICFqc2MuaXNFbGVtZW50VHlwZShlbG0sICdib2R5JykpO1xuXHRcdCovXG5cblx0XHQvLyB2YWx1ZUVsZW1lbnRcblx0XHRpZiAodGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0dmFyIHVwZGF0ZUZpZWxkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFRISVMuZnJvbVN0cmluZyhUSElTLnZhbHVlRWxlbWVudC52YWx1ZSwganNjLmxlYXZlVmFsdWUpO1xuXHRcdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UoVEhJUyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2tleXVwJywgdXBkYXRlRmllbGQpO1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcsIHVwZGF0ZUZpZWxkKTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAnYmx1cicsIGJsdXJWYWx1ZSk7XG5cdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIHN0eWxlRWxlbWVudFxuXHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZSA9IHtcblx0XHRcdFx0YmFja2dyb3VuZEltYWdlIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlLFxuXHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IsXG5cdFx0XHRcdGNvbG9yIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3Jcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudmFsdWUpIHtcblx0XHRcdC8vIFRyeSB0byBzZXQgdGhlIGNvbG9yIGZyb20gdGhlIC52YWx1ZSBvcHRpb24gYW5kIGlmIHVuc3VjY2Vzc2Z1bCxcblx0XHRcdC8vIGV4cG9ydCB0aGUgY3VycmVudCBjb2xvclxuXHRcdFx0dGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWUpIHx8IHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbXBvcnRDb2xvcigpO1xuXHRcdH1cblx0fVxuXG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFB1YmxpYyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblxuLy8gQnkgZGVmYXVsdCwgc2VhcmNoIGZvciBhbGwgZWxlbWVudHMgd2l0aCBjbGFzcz1cImpzY29sb3JcIiBhbmQgaW5zdGFsbCBhIGNvbG9yIHBpY2tlciBvbiB0aGVtLlxuLy9cbi8vIFlvdSBjYW4gY2hhbmdlIHdoYXQgY2xhc3MgbmFtZSB3aWxsIGJlIGxvb2tlZCBmb3IgYnkgc2V0dGluZyB0aGUgcHJvcGVydHkganNjb2xvci5sb29rdXBDbGFzc1xuLy8gYW55d2hlcmUgaW4geW91ciBIVE1MIGRvY3VtZW50LiBUbyBjb21wbGV0ZWx5IGRpc2FibGUgdGhlIGF1dG9tYXRpYyBsb29rdXAsIHNldCBpdCB0byBudWxsLlxuLy9cbmpzYy5qc2NvbG9yLmxvb2t1cENsYXNzID0gJ2pzY29sb3InO1xuXG5cbmpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZSA9IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0dmFyIGlucHV0RWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpO1xuXHR2YXIgYnV0dG9uRWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKTtcblxuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoaW5wdXRFbG1zLCBjbGFzc05hbWUpO1xuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoYnV0dG9uRWxtcywgY2xhc3NOYW1lKTtcbn07XG5cblxuanNjLnJlZ2lzdGVyKCk7XG5cblxucmV0dXJuIGpzYy5qc2NvbG9yO1xuXG5cbn0pKCk7IH1cbiJdfQ==
