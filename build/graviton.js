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

var _vex = require('../vendor/vex');

var _vex2 = _interopRequireDefault(_vex);

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
        this.quadTreeLines = false;
        this.interaction = { previous: {} };
        this.targetBody = undefined;
        this.wasColorPickerActive = false;
        this.isHelpOpen = false;

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
        this.barnesHutOnBtn = args.barnesHutOnBtn = this.controls.querySelector('#barneshutonbtn');
        this.barnesHutOffBtn = args.barnesHutOffBtn = this.controls.querySelector('#barneshutoffbtn');
        this.quadTreeOffBtn = args.quadTreeOffBtn = this.controls.querySelector('#quadtreeoffbtn');
        this.quadTreeOnBtn = args.quadTreeOnBtn = this.controls.querySelector('#quadtreeonbtn');
        this.collisionsOffBtn = args.collisionsOffBtn = this.controls.querySelector('#collisionsoffbtn');
        this.collisionsOnBtn = args.collisionsOnBtn = this.controls.querySelector('#collisionsonbtn');
        this.trailOffBtn = args.trailOffBtn = this.controls.querySelector('#trailoffbtn');
        this.trailOnBtn = args.trailOnBtn = this.controls.querySelector('#trailonbtn');
        this.helpBtn = args.helpBtn = this.controls.querySelector('#helpbtn');

        this.colorPicker = typeof args.colorPicker === 'string' ? document.getElementById(args.colorPicker) : args.colorPicker;

        if (typeof this.colorPicker === 'undefined') {
            this.colorPicker = document.createElement('input');
            this.colorPicker.className = 'bodycolorpicker';
            document.body.appendChild(this.colorPicker);
            args.colorPicker = this.colorPicker;
        }
        this.jscolor = new jscolor(this.colorPicker, {
            padding: 0,
            shadow: false,
            borderWidth: 0,
            backgroundColor: 'transparent',
            insetColor: '#3d559e',
            onFineChange: this.updateColor.bind(this)
        });

        this.metaInfo = typeof args.metaInfo === 'string' ? document.getElementById(args.metaInfo) : args.metaInfo;

        if (typeof this.metaInfo === 'undefined') {
            this.metaInfo = document.createElement('span');
            this.metaInfo.className = 'metainfo';
            document.body.appendChild(this.metaInfo);
            args.metaInfo = this.metaInfo;
        }

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
                                this.setTargetBody(undefined);
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

                            var velX = (event.position.x - body.x) * 0.0000001;
                            var velY = (event.position.y - body.y) * 0.0000001;
                            // When the simulation is active, add the velocity to the current velocity
                            // instead of completely resetting it (to allow for more interesting
                            // interactions).
                            body.velX = this.simTimer.active ? body.velX + velX : velX;
                            body.velY = this.simTimer.active ? body.velY + velY : velY;
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
                            this.updateMetaInfo();
                        }
                        break; // end MOUSEWHEEL

                    case _events.EVENTCODES.KEYDOWN:
                        switch (event.keycode) {
                            case _events.KEYCODES.K_ENTER:
                                this.toggleSim();
                                break;

                            case _events.KEYCODES.K_B:
                                this.toggleSimStrategy();
                                break;

                            case _events.KEYCODES.K_C:
                                this.toggleCollisions();
                                break;

                            case _events.KEYCODES.K_L:
                                // Reset icon if needed
                                if (this.simTimer.active) {
                                    this.toggleSim();
                                }
                                // Clear simulation
                                this.sim.clear();
                                this.gfx.clear();
                                this.simTimer.stop();
                                retval = false;
                                break;

                            case _events.KEYCODES.K_Q:
                                this.toggleQuadTreeLines();
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

                            case _events.KEYCODES.K_QUESTIONMARK:
                                this.showHelp();
                                break;
                        }
                        break; // end KEYDOWN

                    case _events.CONTROLCODES.PLAYBTN:
                        this.toggleSim();
                        break;

                    case _events.CONTROLCODES.PAUSEBTN:
                        this.toggleSim();
                        break;

                    case _events.CONTROLCODES.BARNESHUTONBTN:
                        this.toggleSimStrategy();
                        break;

                    case _events.CONTROLCODES.BARNESHUTOFFBTN:
                        this.toggleSimStrategy();
                        break;

                    case _events.CONTROLCODES.QUADTREEOFFBTN:
                        this.toggleQuadTreeLines();
                        break;

                    case _events.CONTROLCODES.QUADTREEONBTN:
                        this.toggleQuadTreeLines();
                        break;

                    case _events.CONTROLCODES.COLLISIONSOFFBTN:
                        this.toggleCollisions();
                        break;

                    case _events.CONTROLCODES.COLLISIONSONBTN:
                        this.toggleCollisions();
                        break;

                    case _events.CONTROLCODES.TRAILOFFBTN:
                        this.toggleTrails();
                        break;

                    case _events.CONTROLCODES.TRAILONBTN:
                        this.toggleTrails();
                        break;

                    case _events.CONTROLCODES.HELPBTN:
                        this.showHelp();
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
            this.simTimer.toggle();
            if (this.simTimer.active) {
                this.playBtn.style.display = 'none';
                this.pauseBtn.style.display = '';
            } else {
                this.playBtn.style.display = '';
                this.pauseBtn.style.display = 'none';
            }
        }
    }, {
        key: 'toggleSimStrategy',
        value: function toggleSimStrategy() {
            this.sim.toggleStrategy();
            if (this.sim.useBruteForce) {
                this.barnesHutOnBtn.style.display = 'none';
                this.barnesHutOffBtn.style.display = '';
            } else {
                this.barnesHutOnBtn.style.display = '';
                this.barnesHutOffBtn.style.display = 'none';
            }
            this.updateQuadTreeLinesIcons();
        }
    }, {
        key: 'toggleCollisions',
        value: function toggleCollisions() {
            this.sim.mergeCollisions = !this.sim.mergeCollisions;
            if (this.sim.mergeCollisions) {
                this.collisionsOffBtn.style.display = 'none';
                this.collisionsOnBtn.style.display = '';
            } else {
                this.collisionsOffBtn.style.display = '';
                this.collisionsOnBtn.style.display = 'none';
            }
        }
    }, {
        key: 'toggleTrails',
        value: function toggleTrails() {
            this.noclear = !this.noclear;
            if (this.noclear) {
                this.trailOffBtn.style.display = 'none';
                this.trailOnBtn.style.display = '';
            } else {
                this.trailOffBtn.style.display = '';
                this.trailOnBtn.style.display = 'none';
            }
        }
    }, {
        key: 'toggleQuadTreeLines',
        value: function toggleQuadTreeLines() {
            this.quadTreeLines = !this.quadTreeLines;
            this.updateQuadTreeLinesIcons();
        }
    }, {
        key: 'updateQuadTreeLinesIcons',
        value: function updateQuadTreeLinesIcons() {
            if (this.sim.useBruteForce) {
                this.quadTreeOffBtn.style.display = 'none';
                this.quadTreeOnBtn.style.display = 'none';
                return;
            }
            if (this.quadTreeLines) {
                this.quadTreeOffBtn.style.display = 'none';
                this.quadTreeOnBtn.style.display = '';
            } else {
                this.quadTreeOffBtn.style.display = '';
                this.quadTreeOnBtn.style.display = 'none';
            }
        }
    }, {
        key: 'showHelp',
        value: function showHelp() {
            var _this = this;

            if (this.isHelpOpen) {
                return;
            }
            this.isHelpOpen = true;
            _vex2.default.open({
                unsafeContent: '\n                <h3>Shortcuts</h3>\n                <table class="shortcuts">\n                    <tbody>\n                    <tr>\n                        <td>Left click</td> <td> create body</td></tr>\n                    <tr>\n                        <td>Right click</td> <td> delete body</td></tr>\n                    <tr>\n                        <td>Middle click</td> <td> change body color</td></tr>\n                    <tr>\n                        <td><code>Enter</code> key</td> <td> start simulation</td></tr>\n                    <tr>\n                        <td><code>B</code> key</td> <td> toggle brute-force/Barnes-Hut</td></tr>\n                    <tr>\n                        <td><code>C</code> key</td> <td> toggle collisions</td></tr>\n                    <tr>\n                        <td><code>L</code> key</td> <td> clear canvas</td></tr>\n                    <tr>\n                        <td><code>P</code> key</td> <td> toggle repainting</td></tr>\n                    <tr>\n                        <td><code>Q</code> key</td> <td> toggle quadtree lines</td></tr>\n                    <tr>\n                        <td><code>R</code> key</td> <td> create random bodies</td></tr>\n                    <tr>\n                        <td><code>T</code> key</td> <td> create Titan</td></tr>\n                    <tr>\n                        <td><code>?</code> key</td> <td> show help</td></tr>\n                    </tbody>\n                </table>\n                <footer class="forklink">Made in 2017. <a href="https://github.com/voithos/graviton">Fork me on GitHub</a></footer>\n                ',
                afterClose: function afterClose() {
                    _this.isHelpOpen = false;
                }
            });
        }
    }, {
        key: 'redraw',
        value: function redraw() {
            if (!this.noclear) {
                this.gfx.clear();
            }
            if (this.quadTreeLines && !this.sim.useBruteForce) {
                this.gfx.drawQuadTreeLines(this.sim.tree.root);
            }
            if (this.interaction.started) {
                this.gfx.drawReticleLine(this.interaction.body, this.interaction.previous);
            }
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

            this.grid.className = 'gravitoncanvas';
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
            this.controls.innerHTML = '\n            <menuitem id="playbtn" data-tooltip="Start simulation">\n                <img src="assets/play.svg" alt="Start simulation">\n            </menuitem>\n            <menuitem id="pausebtn" style="display: none;" data-tooltip="Stop simulation">\n                <img src="assets/pause.svg" alt="Stop simulation">\n            </menuitem>\n            <menuitem id="barneshutonbtn" data-tooltip="Switch to brute force">\n                <img src="assets/barnes_hut_on.svg" alt="Switch to brute force">\n            </menuitem>\n            <menuitem id="barneshutoffbtn" style="display: none;" data-tooltip="Switch to Barnes-Hut">\n                <img src="assets/barnes_hut_off.svg" alt="Switch to Barnes-Hut">\n            </menuitem>\n            <menuitem id="quadtreeoffbtn" data-tooltip="Toggle quadtree lines">\n                <img src="assets/quadtree_off.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="quadtreeonbtn" style="display: none;" data-tooltip="Toggle quadtree lines">\n                <img src="assets/quadtree_on.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="collisionsonbtn" data-tooltip="Toggle collisions">\n                <img src="assets/collisions_on.svg" alt="Toggle collisions">\n            </menuitem>\n            <menuitem id="collisionsoffbtn" style="display: none;" data-tooltip="Toggle collisions">\n                <img src="assets/collisions_off.svg" alt="Toggle collisions">\n            </menuitem>\n            <menuitem id="trailoffbtn" data-tooltip="Toggle trails">\n                <img src="assets/trail_off.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="trailonbtn" style="display: none;" data-tooltip="Toggle trails">\n                <img src="assets/trail_on.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="helpbtn" data-tooltip="Shortcuts">\n                <img src="assets/help.svg" alt="Shortcuts">\n            </menuitem>\n            ';

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
                    radius: _random2.default.number(minRadius, maxRadius),
                    color: color
                });
            }
        }
    }, {
        key: 'updateTarget',
        value: function updateTarget(x, y) {
            this.setTargetBody(this.sim.getBodyAt(x, y));
        }
    }, {
        key: 'setTargetBody',
        value: function setTargetBody(body) {
            this.targetBody = body;
            this.updateMetaInfo();
        }
    }, {
        key: 'updateMetaInfo',
        value: function updateMetaInfo() {
            if (this.targetBody) {
                this.metaInfo.innerHTML = '⊕ ' + this.targetBody.mass.toFixed(2) + ' &nbsp;' + ('⦿ ' + this.targetBody.radius.toFixed(2) + ' &nbsp;') + ('⇗ ' + this.targetBody.speed.toFixed(2));
            } else {
                this.metaInfo.textContent = '';
            }
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

},{"../util/random":13,"../vendor/vex":15,"./events":4,"./gfx":5,"./sim":6,"./timer":7}],3:[function(require,module,exports){
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

        this.nextX = this.x;
        this.nextY = this.y;

        this.velX = args.velX || 0;
        this.velY = args.velY || 0;

        this.radius = args.radius;
        this.mass = args.mass;

        if ('radius' in args && !('mass' in args)) {
            this.forceRadius(args.radius);
        } else if ('mass' in args && !('radius' in args)) {
            this.forceMass(args.mass);
        } else if (!('mass' in args) && !('radius' in args)) {
            // Default to a radius of 10
            this.forceRadius(10);
        }

        this.color = undefined;
        this.highlight = undefined;

        this.updateColor(args.color || '#dbd3c8');
    }

    _createClass(GtBody, [{
        key: 'adjustSize',
        value: function adjustSize(delta) {
            this.forceRadius(Math.max(this.radius + delta, 2));
        }
    }, {
        key: 'forceRadius',
        value: function forceRadius(radius) {
            this.radius = radius;
            // Dorky formula to make mass scale "properly" with radius.
            this.mass = Math.pow(this.radius / 4, 3);
        }
    }, {
        key: 'forceMass',
        value: function forceMass(mass) {
            // Normally the mass is calculated based on the radius, but we can do the reverse
            this.mass = mass;
            this.radius = Math.pow(this.mass, 1 / 3) * 4;
        }
    }, {
        key: 'updateColor',
        value: function updateColor(color) {
            this.color = color;
            this.highlight = _colors2.default.toHex(_colors2.default.brighten(_colors2.default.fromHex(this.color), .25));
        }
    }, {
        key: 'speed',
        get: function get() {
            // Velocities are tiny, so upscale it (arbitrarily) to make it readable.
            return Math.sqrt(this.velX * this.velX + this.velY * this.velY) * 1e6;
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

    K_QUESTIONMARK: 191,

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
    TRAILONBTN: 2003,
    HELPBTN: 2004,
    QUADTREEOFFBTN: 2005,
    QUADTREEONBTN: 2006,
    BARNESHUTONBTN: 2007,
    BARNESHUTOFFBTN: 2008,
    COLLISIONSOFFBTN: 2009,
    COLLISIONSONBTN: 2010
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
        this.barnesHutOnBtn = args.barnesHutOnBtn;
        this.barnesHutOffBtn = args.barnesHutOffBtn;
        this.quadTreeOffBtn = args.quadTreeOffBtn;
        this.quadTreeOnBtn = args.quadTreeOnBtn;
        this.collisionsOffBtn = args.collisionsOffBtn;
        this.collisionsOnBtn = args.collisionsOnBtn;
        this.trailOffBtn = args.trailOffBtn;
        this.trailOnBtn = args.trailOnBtn;
        this.helpBtn = args.helpBtn;

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
            this.barnesHutOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.BARNESHUTONBTN));
            this.barnesHutOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.BARNESHUTOFFBTN));
            this.quadTreeOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.QUADTREEOFFBTN));
            this.quadTreeOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.QUADTREEONBTN));
            this.collisionsOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.COLLISIONSONBTN));
            this.collisionsOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.COLLISIONSOFFBTN));
            this.trailOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.TRAILOFFBTN));
            this.trailOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.TRAILONBTN));
            this.helpBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.HELPBTN));
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

                    this._drawBody(body, /* isTargeted */body === targetBody);
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
        key: '_drawBody',
        value: function _drawBody(body, isTargeted) {
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
    }, {
        key: 'drawQuadTreeLines',
        value: function drawQuadTreeLines(treeNode) {
            // Setup line style and call the drawing routines
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.lineCap = 'butt';
            this._drawQuadTreeLine(treeNode);
        }
    }, {
        key: '_drawQuadTreeLine',
        value: function _drawQuadTreeLine(treeNode) {
            if (!treeNode || !treeNode.children) {
                return;
            }

            // Draw x and y lines
            this.ctx.beginPath();
            this.ctx.moveTo(treeNode.midX, treeNode.startY);
            this.ctx.lineTo(treeNode.midX, treeNode.startY + treeNode.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(treeNode.startX, treeNode.midY);
            this.ctx.lineTo(treeNode.startX + treeNode.width, treeNode.midY);
            this.ctx.stroke();

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = treeNode.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var childNode = _step2.value;

                    this._drawQuadTreeLine(childNode);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }]);

    return GtGfx;
})(); // end graviton/gfx

exports.default = GtGfx;

},{}],6:[function(require,module,exports){
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/sim -- The gravitational simulator
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

var _tree = require('./tree');

var _tree2 = _interopRequireDefault(_tree);

var _colors = require('../util/colors');

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** Exert force on a body and update its next position. */
function exertForce(body, netFx, netFy, deltaT) {
    // Calculate accelerations
    var ax = netFx / body.mass;
    var ay = netFy / body.mass;

    // Calculate new velocities, normalized by the 'time' interval
    body.velX += deltaT * ax;
    body.velY += deltaT * ay;

    // Calculate new positions after timestep deltaT
    // Note that this doesn't update the current position itself in order to not affect other
    // force calculations
    body.nextX += deltaT * body.velX;
    body.nextY += deltaT * body.velY;
}

/** Calculate the force exerted between a body and an attractor based on gravity. */
function calculateForce(body, attractor, G) {
    // Calculate the change in position along the two dimensions
    var dx = attractor.x - body.x;
    var dy = attractor.y - body.y;

    // Obtain the distance between the objects (hypotenuse)
    var r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    // Calculate force using Newtonian gravity, separate out into x and y components
    var F = G * body.mass * attractor.mass / Math.pow(r, 2);
    var Fx = F * (dx / r);
    var Fy = F * (dy / r);
    return [Fx, Fy];
}

/** Checks whether or not two bodies are colliding. */
function areColliding(body, collider) {
    var theta = arguments.length <= 2 || arguments[2] === undefined ? 0.3 : arguments[2];

    var dist = body.radius + collider.radius;
    var dx = body.x - collider.x;
    var dy = body.y - collider.y;
    return dist * dist * theta > dx * dx + dy * dy;
}

var GtBruteForceSim = (function () {
    /** G represents the gravitational constant. */

    function GtBruteForceSim(G) {
        _classCallCheck(this, GtBruteForceSim);

        this.G = G;
    }

    /** Calculate the new position of a body based on brute force mechanics. */

    _createClass(GtBruteForceSim, [{
        key: 'calculateNewPosition',
        value: function calculateNewPosition(body, attractors, unusedTreeRoot, deltaT) {
            var netFx = 0;
            var netFy = 0;

            // Iterate through all bodies and sum the forces exerted
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = attractors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var attractor = _step.value;

                    if (body !== attractor) {
                        var _calculateForce = calculateForce(body, attractor, this.G);

                        var _calculateForce2 = _slicedToArray(_calculateForce, 2);

                        var Fx = _calculateForce2[0];
                        var Fy = _calculateForce2[1];

                        netFx += Fx;
                        netFy += Fy;
                    }
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

            exertForce(body, netFx, netFy, deltaT);
        }
    }]);

    return GtBruteForceSim;
})();

var GtBarnesHutSim = (function () {
    /** G represents the gravitational constant. */

    function GtBarnesHutSim(G, theta) {
        _classCallCheck(this, GtBarnesHutSim);

        this.G = G;
        this.theta = theta;
        this._netFx = 0;
        this._netFy = 0;
    }

    /** Calculate the new position of a body based on brute force mechanics. */

    _createClass(GtBarnesHutSim, [{
        key: 'calculateNewPosition',
        value: function calculateNewPosition(body, attractors, treeRoot, deltaT) {
            this._netFx = 0;
            this._netFy = 0;

            // Iterate through all bodies in the tree and sum the forces exerted
            this.calculateForceFromTree(body, treeRoot);
            exertForce(body, this._netFx, this._netFy, deltaT);
        }
    }, {
        key: 'calculateForceFromTree',
        value: function calculateForceFromTree(body, treeNode) {
            // Handle empty nodes
            if (!treeNode) {
                return;
            }

            if (!treeNode.children) {
                // The node is external (it's an actual body)
                if (body !== treeNode) {
                    var _calculateForce3 = calculateForce(body, treeNode, this.G);

                    var _calculateForce4 = _slicedToArray(_calculateForce3, 2);

                    var Fx = _calculateForce4[0];
                    var Fy = _calculateForce4[1];

                    this._netFx += Fx;
                    this._netFy += Fy;
                }
                return;
            }

            // The node is internal

            // Calculate the effective quadrant size and distance from center-of-mass
            var s = (treeNode.width + treeNode.height) / 2;

            var dx = treeNode.x - body.x;
            var dy = treeNode.y - body.y;
            var d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

            if (s / d < this.theta) {
                // Node is sufficiently far away

                var _calculateForce5 = calculateForce(body, treeNode, this.G);

                var _calculateForce6 = _slicedToArray(_calculateForce5, 2);

                var Fx = _calculateForce6[0];
                var Fy = _calculateForce6[1];

                this._netFx += Fx;
                this._netFy += Fy;
            } else {
                // Node is close; recurse
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = treeNode.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var childNode = _step2.value;

                        this.calculateForceFromTree(body, childNode);
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
        }
    }]);

    return GtBarnesHutSim;
})();

var GtSim = (function () {
    function GtSim(args) {
        _classCallCheck(this, GtSim);

        args = args || {};

        this.useBruteForce = false;
        this.mergeCollisions = true;

        this.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.multiplier = args.multiplier || 1500; // Timestep
        this.scatterLimitWidth = args.scatterLimitWidth || args.width * 2;
        this.scatterLimitHeight = args.scatterLimitHeight || args.height * 2;
        this.scatterLimitStartX = (args.width - this.scatterLimitWidth) / 2;
        this.scatterLimitStartY = (args.height - this.scatterLimitHeight) / 2;
        this.scatterLimitEndX = this.scatterLimitStartX + this.scatterLimitWidth;
        this.scatterLimitEndY = this.scatterLimitStartY + this.scatterLimitHeight;

        this.bodies = [];
        // Incorporate the scatter limit
        this.tree = new _tree2.default(
        /* width */this.scatterLimitWidth,
        /* height */this.scatterLimitHeight,
        /* startX */this.scatterLimitStartX,
        /* startY */this.scatterLimitStartY);
        this.time = 0;

        this.bruteForceSim = new GtBruteForceSim(this.G);
        this.barnesHutSim = new GtBarnesHutSim(this.G, /* theta */0.5);
        this.activeSim = this.useBruteForce ? this.bruteForceSim : this.barnesHutSim;
    }

    _createClass(GtSim, [{
        key: 'toggleStrategy',
        value: function toggleStrategy() {
            this.useBruteForce = !this.useBruteForce;
            this.activeSim = this.useBruteForce ? this.bruteForceSim : this.barnesHutSim;
        }

        /** Calculate a step of the simulation. */

    }, {
        key: 'step',
        value: function step(elapsed) {
            if (this.mergeCollisions) {
                this._mergeCollided();
            }
            this._removeScattered();

            if (!this.useBruteForce) {
                this._resetTree();
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.bodies[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var body = _step3.value;

                    this.activeSim.calculateNewPosition(body, this.bodies, this.tree.root, elapsed * this.multiplier);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            this._commitPositionUpdates();
            this.time += elapsed; // Increment runtime
        }

        /** Update positions of all bodies to be the next calculated position. */

    }, {
        key: '_commitPositionUpdates',
        value: function _commitPositionUpdates() {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.bodies[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var body = _step4.value;

                    body.x = body.nextX;
                    body.y = body.nextY;
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }

        /** Scan through the list of bodies and remove any that have fallen out of the scatter limit. */

    }, {
        key: '_removeScattered',
        value: function _removeScattered() {
            var i = 0;
            while (i < this.bodies.length) {
                var body = this.bodies[i];

                if (body.x >= this.scatterLimitEndX || body.x <= this.scatterLimitStartX || body.y >= this.scatterLimitEndY || body.y <= this.scatterLimitStartY) {
                    // Remove from body collection
                    // We don't need to reset the tree here because this is a runtime (not user-based)
                    // operation, and the tree is reset automatically on every step of the simulation.
                    this.bodies.splice(i, 1);
                } else {
                    i++;
                }
            }
        }
    }, {
        key: '_mergeCollided',
        value: function _mergeCollided() {
            var _this = this;

            var i = 0;
            while (i < this.bodies.length) {
                var collidingIndices = [];
                // Collect colliding elements; only need to check each pair once
                for (var j = i + 1; j < this.bodies.length; j++) {
                    if (areColliding(this.bodies[i], this.bodies[j])) {
                        // Add, in order of highest index first
                        collidingIndices.unshift(j);
                    }
                }

                if (collidingIndices.length) {
                    // Include the "source" element in the collision set
                    collidingIndices.push(i);

                    // Extract elements and merge
                    var colliding = collidingIndices.map(function (idx) {
                        return _this.bodies.splice(idx, 1)[0];
                    });
                    this._mergeBodies(colliding);
                } else {
                    i++;
                }
            }
        }

        /** Merge and return the args for a new body based on a set of old bodies. */

    }, {
        key: '_mergeBodies',
        value: function _mergeBodies(bodies) {
            var newBodyArgs = { x: 0, y: 0, velX: 0, velY: 0, mass: 0, color: bodies[0].color };
            var largestMass = 0;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = bodies[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var body = _step5.value;

                    if (body.mass > largestMass) {
                        newBodyArgs.x = body.x;
                        newBodyArgs.y = body.y;
                        largestMass = body.mass;
                    }
                    newBodyArgs.velX += body.velX;
                    newBodyArgs.velY += body.velY;
                    newBodyArgs.mass += body.mass;
                    newBodyArgs.color = _colors2.default.blend(newBodyArgs.color, body.color);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            return this.addNewBody(newBodyArgs);
        }

        /** Create and return a new body to the simulation. */

    }, {
        key: 'addNewBody',
        value: function addNewBody(args) {
            var body = new _body2.default(args);
            this.bodies.push(body);
            this._resetTree();
            return body;
        }

        /** Removing a target body from the simulation. */

    }, {
        key: 'removeBody',
        value: function removeBody(targetBody) {
            for (var i = 0; i < this.bodies.length; i++) {
                var body = this.bodies[i];
                if (body === targetBody) {
                    this.bodies.splice(i, 1);
                    this._resetTree();
                    break;
                }
            }
        }

        /** Lookup an (x, y) coordinate and return the body that is at that position. */

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

        /** Clear the simulation. */

    }, {
        key: 'clear',
        value: function clear() {
            this.bodies.length = 0; // Remove all bodies from collection
            this._resetTree();
        }

        /** Clear and reset the quadtree, adding all existing bodies back. */

    }, {
        key: '_resetTree',
        value: function _resetTree() {
            this.tree.clear();
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = this.bodies[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var body = _step6.value;

                    this.tree.addBody(body);
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }
        }
    }]);

    return GtSim;
})(); // end graviton/sim

exports.default = GtSim;

},{"../util/colors":11,"./body":3,"./tree":8}],7:[function(require,module,exports){
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

var MAX_DEPTH = 1000;

var GtTreeNode = (function () {
    function GtTreeNode(width, height, startX, startY) {
        _classCallCheck(this, GtTreeNode);

        this.width = width;
        this.height = height;
        this.startX = startX;
        this.startY = startY;

        // Convenience center points.
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
        this.midX = this.startX + this.halfWidth;
        this.midY = this.startY + this.halfHeight;

        // Matches GtBody's properties.
        this.mass = 0;
        this.x = 0;
        this.y = 0;

        // [NW, NE, SW, SE]
        this.children = new Array(4);
    }

    /** Add a body to the tree, updating mass and centerpoint. */

    _createClass(GtTreeNode, [{
        key: "addBody",
        value: function addBody(body) {
            var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

            if (depth > MAX_DEPTH) {
                // Something's gone wrong.
                return;
            }
            this._updateMass(body);
            var quadrant = this._getQuadrant(body.x, body.y);

            if (this.children[quadrant] instanceof GtTreeNode) {
                this.children[quadrant].addBody(body, depth + 1);
            } else if (!this.children[quadrant]) {
                this.children[quadrant] = body;
            } else {
                var existing = this.children[quadrant];
                var quadX = existing.x > this.midX ? this.midX : this.startX;
                var quadY = existing.y > this.midY ? this.midY : this.startY;
                var node = new GtTreeNode(this.halfWidth, this.halfHeight, quadX, quadY);

                node.addBody(existing, depth + 1);
                node.addBody(body, depth + 1);

                this.children[quadrant] = node;
            }
        }

        /** Update the center of mass based on the addition of a new body. */

    }, {
        key: "_updateMass",
        value: function _updateMass(body) {
            var newMass = this.mass + body.mass;
            var newX = (this.x * this.mass + body.x * body.mass) / newMass;
            var newY = (this.y * this.mass + body.y * body.mass) / newMass;
            this.mass = newMass;
            this.x = newX;
            this.y = newY;
        }

        /** Return the quadrant index for a given (x, y) pair. Assumes that it lies within bounds. */

    }, {
        key: "_getQuadrant",
        value: function _getQuadrant(x, y) {
            var xIndex = Number(x > this.midX);
            var yIndex = Number(y > this.midY) * 2;
            return xIndex + yIndex;
        }
    }]);

    return GtTreeNode;
})();

var GtTree = (function () {
    function GtTree(width, height) {
        var startX = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, GtTree);

        var startY = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

        this.width = width;
        this.height = height;
        this.startX = startX;
        this.startY = startY;
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
                this.root = new GtTreeNode(this.width, this.height, this.startX, this.startY);
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

var _vex = require('./vendor/vex');

var _vex2 = _interopRequireDefault(_vex);

require('./polyfills');

var _graviton = require('./graviton');

var _graviton2 = _interopRequireDefault(_graviton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.onload = function () {
    // Set options for dependencies.
    _vex2.default.defaultOptions.className = 'vex-theme-wireframe';

    // Start the main graviton app.
    window.graviton = new _graviton2.default.app();
};

},{"./graviton":1,"./polyfills":10,"./vendor/jscolor":14,"./vendor/vex":15}],10:[function(require,module,exports){
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
    },
    blend: function blend(color1, color2) {
        var percentage = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

        var parsedColor1 = this.fromHex(color1);
        var parsedColor2 = this.fromHex(color2);

        var blendedColor = [Math.round(Math.min(Math.max(0, (1 - percentage) * parsedColor1[0] + percentage * parsedColor2[0]), 255)), Math.round(Math.min(Math.max(0, (1 - percentage) * parsedColor1[1] + percentage * parsedColor2[1]), 255)), Math.round(Math.min(Math.max(0, (1 - percentage) * parsedColor1[2] + percentage * parsedColor2[2]), 255))];
        return this.toHex(blendedColor);
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
(function (global){
"use strict";

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/*! vex.combined.js: vex 3.1.1, vex-dialog 1.0.7 */
!(function (a) {
  if ("object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "undefined" != typeof module) module.exports = a();else if ("function" == typeof define && define.amd) define([], a);else {
    var b;b = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, b.vex = a();
  }
})(function () {
  var a;return (function b(a, c, d) {
    function e(g, h) {
      if (!c[g]) {
        if (!a[g]) {
          var i = "function" == typeof require && require;if (!h && i) return i(g, !0);if (f) return f(g, !0);var j = new Error("Cannot find module '" + g + "'");throw (j.code = "MODULE_NOT_FOUND", j);
        }var k = c[g] = { exports: {} };a[g][0].call(k.exports, function (b) {
          var c = a[g][1][b];return e(c ? c : b);
        }, k, k.exports, b, a, c, d);
      }return c[g].exports;
    }for (var f = "function" == typeof require && require, g = 0; g < d.length; g++) {
      e(d[g]);
    }return e;
  })({ 1: [function (a, b, c) {
      "document" in window.self && ("classList" in document.createElement("_") && (!document.createElementNS || "classList" in document.createElementNS("http://www.w3.org/2000/svg", "g")) ? !(function () {
        "use strict";
        var a = document.createElement("_");if ((a.classList.add("c1", "c2"), !a.classList.contains("c2"))) {
          var b = function b(a) {
            var b = DOMTokenList.prototype[a];DOMTokenList.prototype[a] = function (a) {
              var c,
                  d = arguments.length;for (c = 0; c < d; c++) {
                a = arguments[c], b.call(this, a);
              }
            };
          };b("add"), b("remove");
        }if ((a.classList.toggle("c3", !1), a.classList.contains("c3"))) {
          var c = DOMTokenList.prototype.toggle;DOMTokenList.prototype.toggle = function (a, b) {
            return 1 in arguments && !this.contains(a) == !b ? b : c.call(this, a);
          };
        }a = null;
      })() : !(function (a) {
        "use strict";
        if ("Element" in a) {
          var b = "classList",
              c = "prototype",
              d = a.Element[c],
              e = Object,
              f = String[c].trim || function () {
            return this.replace(/^\s+|\s+$/g, "");
          },
              g = Array[c].indexOf || function (a) {
            for (var b = 0, c = this.length; b < c; b++) {
              if (b in this && this[b] === a) return b;
            }return -1;
          },
              h = function h(a, b) {
            this.name = a, this.code = DOMException[a], this.message = b;
          },
              i = function i(a, b) {
            if ("" === b) throw new h("SYNTAX_ERR", "An invalid or illegal string was specified");if (/\s/.test(b)) throw new h("INVALID_CHARACTER_ERR", "String contains an invalid character");return g.call(a, b);
          },
              j = function j(a) {
            for (var b = f.call(a.getAttribute("class") || ""), c = b ? b.split(/\s+/) : [], d = 0, e = c.length; d < e; d++) {
              this.push(c[d]);
            }this._updateClassName = function () {
              a.setAttribute("class", this.toString());
            };
          },
              k = j[c] = [],
              l = function l() {
            return new j(this);
          };if ((h[c] = Error[c], k.item = function (a) {
            return this[a] || null;
          }, k.contains = function (a) {
            return a += "", i(this, a) !== -1;
          }, k.add = function () {
            var a,
                b = arguments,
                c = 0,
                d = b.length,
                e = !1;do {
              a = b[c] + "", i(this, a) === -1 && (this.push(a), e = !0);
            } while (++c < d);e && this._updateClassName();
          }, k.remove = function () {
            var a,
                b,
                c = arguments,
                d = 0,
                e = c.length,
                f = !1;do {
              for (a = c[d] + "", b = i(this, a); b !== -1;) {
                this.splice(b, 1), f = !0, b = i(this, a);
              }
            } while (++d < e);f && this._updateClassName();
          }, k.toggle = function (a, b) {
            a += "";var c = this.contains(a),
                d = c ? b !== !0 && "remove" : b !== !1 && "add";return d && this[d](a), b === !0 || b === !1 ? b : !c;
          }, k.toString = function () {
            return this.join(" ");
          }, e.defineProperty)) {
            var m = { get: l, enumerable: !0, configurable: !0 };try {
              e.defineProperty(d, b, m);
            } catch (n) {
              n.number === -2146823252 && (m.enumerable = !1, e.defineProperty(d, b, m));
            }
          } else e[c].__defineGetter__ && d.__defineGetter__(b, l);
        }
      })(window.self));
    }, {}], 2: [function (a, b, c) {
      function d(a, b) {
        if ("string" != typeof a) throw new TypeError("String expected");b || (b = document);var c = /<([\w:]+)/.exec(a);if (!c) return b.createTextNode(a);a = a.replace(/^\s+|\s+$/g, "");var d = c[1];if ("body" == d) {
          var e = b.createElement("html");return e.innerHTML = a, e.removeChild(e.lastChild);
        }var f = g[d] || g._default,
            h = f[0],
            i = f[1],
            j = f[2],
            e = b.createElement("div");for (e.innerHTML = i + a + j; h--;) {
          e = e.lastChild;
        }if (e.firstChild == e.lastChild) return e.removeChild(e.firstChild);for (var k = b.createDocumentFragment(); e.firstChild;) {
          k.appendChild(e.removeChild(e.firstChild));
        }return k;
      }b.exports = d;var e,
          f = !1;"undefined" != typeof document && (e = document.createElement("div"), e.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>', f = !e.getElementsByTagName("link").length, e = void 0);var g = { legend: [1, "<fieldset>", "</fieldset>"], tr: [2, "<table><tbody>", "</tbody></table>"], col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], _default: f ? [1, "X<div>", "</div>"] : [0, "", ""] };g.td = g.th = [3, "<table><tbody><tr>", "</tr></tbody></table>"], g.option = g.optgroup = [1, '<select multiple="multiple">', "</select>"], g.thead = g.tbody = g.colgroup = g.caption = g.tfoot = [1, "<table>", "</table>"], g.polyline = g.ellipse = g.polygon = g.circle = g.text = g.line = g.path = g.rect = g.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">', "</svg>"];
    }, {}], 3: [function (a, b, c) {
      "use strict";
      function d(a, b) {
        if (void 0 === a || null === a) throw new TypeError("Cannot convert first argument to object");for (var c = Object(a), d = 1; d < arguments.length; d++) {
          var e = arguments[d];if (void 0 !== e && null !== e) for (var f = Object.keys(Object(e)), g = 0, h = f.length; g < h; g++) {
            var i = f[g],
                j = Object.getOwnPropertyDescriptor(e, i);void 0 !== j && j.enumerable && (c[i] = e[i]);
          }
        }return c;
      }function e() {
        Object.assign || Object.defineProperty(Object, "assign", { enumerable: !1, configurable: !0, writable: !0, value: d });
      }b.exports = { assign: d, polyfill: e };
    }, {}], 4: [function (a, b, c) {
      function d(a, b) {
        "object" != (typeof b === "undefined" ? "undefined" : _typeof(b)) ? b = { hash: !!b } : void 0 === b.hash && (b.hash = !0);for (var c = b.hash ? {} : "", d = b.serializer || (b.hash ? g : h), e = a && a.elements ? a.elements : [], f = Object.create(null), k = 0; k < e.length; ++k) {
          var l = e[k];if ((b.disabled || !l.disabled) && l.name && j.test(l.nodeName) && !i.test(l.type)) {
            var m = l.name,
                n = l.value;if (("checkbox" !== l.type && "radio" !== l.type || l.checked || (n = void 0), b.empty)) {
              if (("checkbox" !== l.type || l.checked || (n = ""), "radio" === l.type && (f[l.name] || l.checked ? l.checked && (f[l.name] = !0) : f[l.name] = !1), !n && "radio" == l.type)) continue;
            } else if (!n) continue;if ("select-multiple" !== l.type) c = d(c, m, n);else {
              n = [];for (var o = l.options, p = !1, q = 0; q < o.length; ++q) {
                var r = o[q],
                    s = b.empty && !r.value,
                    t = r.value || s;r.selected && t && (p = !0, c = b.hash && "[]" !== m.slice(m.length - 2) ? d(c, m + "[]", r.value) : d(c, m, r.value));
              }!p && b.empty && (c = d(c, m, ""));
            }
          }
        }if (b.empty) for (var m in f) {
          f[m] || (c = d(c, m, ""));
        }return c;
      }function e(a) {
        var b = [],
            c = /^([^\[\]]*)/,
            d = new RegExp(k),
            e = c.exec(a);for (e[1] && b.push(e[1]); null !== (e = d.exec(a));) {
          b.push(e[1]);
        }return b;
      }function f(a, b, c) {
        if (0 === b.length) return a = c;var d = b.shift(),
            e = d.match(/^\[(.+?)\]$/);if ("[]" === d) return a = a || [], Array.isArray(a) ? a.push(f(null, b, c)) : (a._values = a._values || [], a._values.push(f(null, b, c))), a;if (e) {
          var g = e[1],
              h = +g;isNaN(h) ? (a = a || {}, a[g] = f(a[g], b, c)) : (a = a || [], a[h] = f(a[h], b, c));
        } else a[d] = f(a[d], b, c);return a;
      }function g(a, b, c) {
        var d = b.match(k);if (d) {
          var g = e(b);f(a, g, c);
        } else {
          var h = a[b];h ? (Array.isArray(h) || (a[b] = [h]), a[b].push(c)) : a[b] = c;
        }return a;
      }function h(a, b, c) {
        return c = c.replace(/(\r)?\n/g, "\r\n"), c = encodeURIComponent(c), c = c.replace(/%20/g, "+"), a + (a ? "&" : "") + encodeURIComponent(b) + "=" + c;
      }var i = /^(?:submit|button|image|reset|file)$/i,
          j = /^(?:input|select|textarea|keygen)/i,
          k = /(\[[^\[\]]*\])/g;b.exports = d;
    }, {}], 5: [function (b, c, d) {
      (function (e) {
        !(function (b) {
          if ("object" == (typeof d === "undefined" ? "undefined" : _typeof(d)) && "undefined" != typeof c) c.exports = b();else if ("function" == typeof a && a.amd) a([], b);else {
            var f;f = "undefined" != typeof window ? window : "undefined" != typeof e ? e : "undefined" != typeof self ? self : this, f.vexDialog = b();
          }
        })(function () {
          return (function a(c, d, e) {
            function f(h, i) {
              if (!d[h]) {
                if (!c[h]) {
                  var j = "function" == typeof b && b;if (!i && j) return j(h, !0);if (g) return g(h, !0);var k = new Error("Cannot find module '" + h + "'");throw (k.code = "MODULE_NOT_FOUND", k);
                }var l = d[h] = { exports: {} };c[h][0].call(l.exports, function (a) {
                  var b = c[h][1][a];return f(b ? b : a);
                }, l, l.exports, a, c, d, e);
              }return d[h].exports;
            }for (var g = "function" == typeof b && b, h = 0; h < e.length; h++) {
              f(e[h]);
            }return f;
          })({ 1: [function (a, b, c) {
              function d(a, b) {
                if ("string" != typeof a) throw new TypeError("String expected");b || (b = document);var c = /<([\w:]+)/.exec(a);if (!c) return b.createTextNode(a);a = a.replace(/^\s+|\s+$/g, "");var d = c[1];if ("body" == d) {
                  var e = b.createElement("html");return e.innerHTML = a, e.removeChild(e.lastChild);
                }var f = g[d] || g._default,
                    h = f[0],
                    i = f[1],
                    j = f[2],
                    e = b.createElement("div");for (e.innerHTML = i + a + j; h--;) {
                  e = e.lastChild;
                }if (e.firstChild == e.lastChild) return e.removeChild(e.firstChild);for (var k = b.createDocumentFragment(); e.firstChild;) {
                  k.appendChild(e.removeChild(e.firstChild));
                }return k;
              }b.exports = d;var e,
                  f = !1;"undefined" != typeof document && (e = document.createElement("div"), e.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>', f = !e.getElementsByTagName("link").length, e = void 0);var g = { legend: [1, "<fieldset>", "</fieldset>"], tr: [2, "<table><tbody>", "</tbody></table>"], col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], _default: f ? [1, "X<div>", "</div>"] : [0, "", ""] };g.td = g.th = [3, "<table><tbody><tr>", "</tr></tbody></table>"], g.option = g.optgroup = [1, '<select multiple="multiple">', "</select>"], g.thead = g.tbody = g.colgroup = g.caption = g.tfoot = [1, "<table>", "</table>"], g.polyline = g.ellipse = g.polygon = g.circle = g.text = g.line = g.path = g.rect = g.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">', "</svg>"];
            }, {}], 2: [function (a, b, c) {
              function d(a, b) {
                "object" != (typeof b === "undefined" ? "undefined" : _typeof(b)) ? b = { hash: !!b } : void 0 === b.hash && (b.hash = !0);for (var c = b.hash ? {} : "", d = b.serializer || (b.hash ? g : h), e = a && a.elements ? a.elements : [], f = Object.create(null), k = 0; k < e.length; ++k) {
                  var l = e[k];if ((b.disabled || !l.disabled) && l.name && j.test(l.nodeName) && !i.test(l.type)) {
                    var m = l.name,
                        n = l.value;if (("checkbox" !== l.type && "radio" !== l.type || l.checked || (n = void 0), b.empty)) {
                      if (("checkbox" !== l.type || l.checked || (n = ""), "radio" === l.type && (f[l.name] || l.checked ? l.checked && (f[l.name] = !0) : f[l.name] = !1), !n && "radio" == l.type)) continue;
                    } else if (!n) continue;if ("select-multiple" !== l.type) c = d(c, m, n);else {
                      n = [];for (var o = l.options, p = !1, q = 0; q < o.length; ++q) {
                        var r = o[q],
                            s = b.empty && !r.value,
                            t = r.value || s;r.selected && t && (p = !0, c = b.hash && "[]" !== m.slice(m.length - 2) ? d(c, m + "[]", r.value) : d(c, m, r.value));
                      }!p && b.empty && (c = d(c, m, ""));
                    }
                  }
                }if (b.empty) for (var m in f) {
                  f[m] || (c = d(c, m, ""));
                }return c;
              }function e(a) {
                var b = [],
                    c = /^([^\[\]]*)/,
                    d = new RegExp(k),
                    e = c.exec(a);for (e[1] && b.push(e[1]); null !== (e = d.exec(a));) {
                  b.push(e[1]);
                }return b;
              }function f(a, b, c) {
                if (0 === b.length) return a = c;var d = b.shift(),
                    e = d.match(/^\[(.+?)\]$/);if ("[]" === d) return a = a || [], Array.isArray(a) ? a.push(f(null, b, c)) : (a._values = a._values || [], a._values.push(f(null, b, c))), a;if (e) {
                  var g = e[1],
                      h = +g;isNaN(h) ? (a = a || {}, a[g] = f(a[g], b, c)) : (a = a || [], a[h] = f(a[h], b, c));
                } else a[d] = f(a[d], b, c);return a;
              }function g(a, b, c) {
                var d = b.match(k);if (d) {
                  var g = e(b);f(a, g, c);
                } else {
                  var h = a[b];h ? (Array.isArray(h) || (a[b] = [h]), a[b].push(c)) : a[b] = c;
                }return a;
              }function h(a, b, c) {
                return c = c.replace(/(\r)?\n/g, "\r\n"), c = encodeURIComponent(c), c = c.replace(/%20/g, "+"), a + (a ? "&" : "") + encodeURIComponent(b) + "=" + c;
              }var i = /^(?:submit|button|image|reset|file)$/i,
                  j = /^(?:input|select|textarea|keygen)/i,
                  k = /(\[[^\[\]]*\])/g;b.exports = d;
            }, {}], 3: [function (a, b, c) {
              var d = a("domify"),
                  e = a("form-serialize"),
                  f = function f(a) {
                var b = document.createElement("form");b.classList.add("vex-dialog-form");var c = document.createElement("div");c.classList.add("vex-dialog-message"), c.appendChild(a.message instanceof window.Node ? a.message : d(a.message));var e = document.createElement("div");return e.classList.add("vex-dialog-input"), e.appendChild(a.input instanceof window.Node ? a.input : d(a.input)), b.appendChild(c), b.appendChild(e), b;
              },
                  g = function g(a) {
                var b = document.createElement("div");b.classList.add("vex-dialog-buttons");for (var c = 0; c < a.length; c++) {
                  var d = a[c],
                      e = document.createElement("button");e.type = d.type, e.textContent = d.text, e.className = d.className, e.classList.add("vex-dialog-button"), 0 === c ? e.classList.add("vex-first") : c === a.length - 1 && e.classList.add("vex-last"), (function (a) {
                    e.addEventListener("click", (function (b) {
                      a.click && a.click.call(this, b);
                    }).bind(this));
                  }).bind(this)(d), b.appendChild(e);
                }return b;
              },
                  h = function h(a) {
                var b = { name: "dialog", open: function open(b) {
                    var c = Object.assign({}, this.defaultOptions, b);c.unsafeMessage && !c.message ? c.message = c.unsafeMessage : c.message && (c.message = a._escapeHtml(c.message));var d = c.unsafeContent = f(c),
                        e = a.open(c),
                        h = c.beforeClose && c.beforeClose.bind(e);if ((e.options.beforeClose = (function () {
                      var a = !h || h();return a && c.callback(this.value || !1), a;
                    }).bind(e), d.appendChild(g.call(e, c.buttons)), e.form = d, d.addEventListener("submit", c.onSubmit.bind(e)), c.focusFirstInput)) {
                      var i = e.contentEl.querySelector("button, input, select, textarea");i && i.focus();
                    }return e;
                  }, alert: function alert(a) {
                    return "string" == typeof a && (a = { message: a }), a = Object.assign({}, this.defaultOptions, this.defaultAlertOptions, a), this.open(a);
                  }, confirm: function confirm(a) {
                    if ("object" != (typeof a === "undefined" ? "undefined" : _typeof(a)) || "function" != typeof a.callback) throw new Error("dialog.confirm(options) requires options.callback.");return a = Object.assign({}, this.defaultOptions, this.defaultConfirmOptions, a), this.open(a);
                  }, prompt: function prompt(b) {
                    if ("object" != (typeof b === "undefined" ? "undefined" : _typeof(b)) || "function" != typeof b.callback) throw new Error("dialog.prompt(options) requires options.callback.");var c = Object.assign({}, this.defaultOptions, this.defaultPromptOptions),
                        d = { unsafeMessage: '<label for="vex">' + a._escapeHtml(b.label || c.label) + "</label>", input: '<input name="vex" type="text" class="vex-dialog-prompt-input" placeholder="' + a._escapeHtml(b.placeholder || c.placeholder) + '" value="' + a._escapeHtml(b.value || c.value) + '" />' };b = Object.assign(c, d, b);var e = b.callback;return b.callback = function (a) {
                      if ("object" == (typeof a === "undefined" ? "undefined" : _typeof(a))) {
                        var b = Object.keys(a);a = b.length ? a[b[0]] : "";
                      }e(a);
                    }, this.open(b);
                  } };return b.buttons = { YES: { text: "OK", type: "submit", className: "vex-dialog-button-primary", click: function click() {
                      this.value = !0;
                    } }, NO: { text: "Cancel", type: "button", className: "vex-dialog-button-secondary", click: function click() {
                      this.value = !1, this.close();
                    } } }, b.defaultOptions = { callback: function callback() {}, afterOpen: function afterOpen() {}, message: "", input: "", buttons: [b.buttons.YES, b.buttons.NO], showCloseButton: !1, onSubmit: function onSubmit(a) {
                    return a.preventDefault(), this.options.input && (this.value = e(this.form, { hash: !0 })), this.close();
                  }, focusFirstInput: !0 }, b.defaultAlertOptions = { buttons: [b.buttons.YES] }, b.defaultPromptOptions = { label: "Prompt:", placeholder: "", value: "" }, b.defaultConfirmOptions = {}, b;
              };b.exports = h;
            }, { domify: 1, "form-serialize": 2 }] }, {}, [3])(3);
        });
      }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
    }, { domify: 2, "form-serialize": 4 }], 6: [function (a, b, c) {
      var d = a("./vex");d.registerPlugin(a("vex-dialog")), b.exports = d;
    }, { "./vex": 7, "vex-dialog": 5 }], 7: [function (a, b, c) {
      a("classlist-polyfill"), a("es6-object-assign").polyfill();var d = a("domify"),
          e = function e(a) {
        if ("undefined" != typeof a) {
          var b = document.createElement("div");return b.appendChild(document.createTextNode(a)), b.innerHTML;
        }return "";
      },
          f = function f(a, b) {
        if ("string" == typeof b && 0 !== b.length) for (var c = b.split(" "), d = 0; d < c.length; d++) {
          var e = c[d];e.length && a.classList.add(e);
        }
      },
          g = (function () {
        var a = document.createElement("div"),
            b = { WebkitAnimation: "webkitAnimationEnd", MozAnimation: "animationend", OAnimation: "oanimationend", msAnimation: "MSAnimationEnd", animation: "animationend" };for (var c in b) {
          if (void 0 !== a.style[c]) return b[c];
        }return !1;
      })(),
          h = { vex: "vex", content: "vex-content", overlay: "vex-overlay", close: "vex-close", closing: "vex-closing", open: "vex-open" },
          i = {},
          j = 1,
          k = !1,
          l = { open: function open(a) {
          var b = function b(a) {
            console.warn('The "' + a + '" property is deprecated in vex 3. Use CSS classes and the appropriate "ClassName" options, instead.'), console.warn("See http://github.hubspot.com/vex/api/advanced/#options");
          };a.css && b("css"), a.overlayCSS && b("overlayCSS"), a.contentCSS && b("contentCSS"), a.closeCSS && b("closeCSS");var c = {};c.id = j++, i[c.id] = c, c.isOpen = !0, c.close = function () {
            function a(a) {
              return "none" !== d.getPropertyValue(a + "animation-name") && "0s" !== d.getPropertyValue(a + "animation-duration");
            }if (!this.isOpen) return !0;var b = this.options;if (k && !b.escapeButtonCloses) return !1;var c = (function () {
              return !b.beforeClose || b.beforeClose.call(this);
            }).bind(this)();if (c === !1) return !1;this.isOpen = !1;var d = window.getComputedStyle(this.contentEl),
                e = a("") || a("-webkit-") || a("-moz-") || a("-o-"),
                f = (function j() {
              this.rootEl.parentNode && (this.rootEl.removeEventListener(g, j), delete i[this.id], this.rootEl.parentNode.removeChild(this.rootEl), b.afterClose && b.afterClose.call(this), 0 === Object.keys(i).length && document.body.classList.remove(h.open));
            }).bind(this);return g && e ? (this.rootEl.addEventListener(g, f), this.rootEl.classList.add(h.closing)) : f(), !0;
          }, "string" == typeof a && (a = { content: a }), a.unsafeContent && !a.content ? a.content = a.unsafeContent : a.content && (a.content = e(a.content));var m = c.options = Object.assign({}, l.defaultOptions, a),
              n = c.rootEl = document.createElement("div");n.classList.add(h.vex), f(n, m.className);var o = c.overlayEl = document.createElement("div");o.classList.add(h.overlay), f(o, m.overlayClassName), m.overlayClosesOnClick && o.addEventListener("click", function (a) {
            a.target === o && c.close();
          }), n.appendChild(o);var p = c.contentEl = document.createElement("div");if ((p.classList.add(h.content), f(p, m.contentClassName), p.appendChild(m.content instanceof window.Node ? m.content : d(m.content)), n.appendChild(p), m.showCloseButton)) {
            var q = c.closeEl = document.createElement("div");q.classList.add(h.close), f(q, m.closeClassName), q.addEventListener("click", c.close.bind(c)), p.appendChild(q);
          }return document.querySelector(m.appendLocation).appendChild(n), m.afterOpen && m.afterOpen.call(c), document.body.classList.add(h.open), c;
        }, close: function close(a) {
          var b;if (a.id) b = a.id;else {
            if ("string" != typeof a) throw new TypeError("close requires a vex object or id string");b = a;
          }return !!i[b] && i[b].close();
        }, closeTop: function closeTop() {
          var a = Object.keys(i);return !!a.length && i[a[a.length - 1]].close();
        }, closeAll: function closeAll() {
          for (var a in i) {
            this.close(a);
          }return !0;
        }, getAll: function getAll() {
          return i;
        }, getById: function getById(a) {
          return i[a];
        } };window.addEventListener("keyup", function (a) {
        27 === a.keyCode && (k = !0, l.closeTop(), k = !1);
      }), window.addEventListener("popstate", function () {
        l.defaultOptions.closeAllOnPopState && l.closeAll();
      }), l.defaultOptions = { content: "", showCloseButton: !0, escapeButtonCloses: !0, overlayClosesOnClick: !0, appendLocation: "body", className: "", overlayClassName: "", contentClassName: "", closeClassName: "", closeAllOnPopState: !0 }, Object.defineProperty(l, "_escapeHtml", { configurable: !1, enumerable: !1, writable: !1, value: e }), l.registerPlugin = function (a, b) {
        var c = a(l),
            d = b || c.name;if (l[d]) throw new Error("Plugin " + b + " is already registered.");l[d] = c;
      }, b.exports = l;
    }, { "classlist-polyfill": 1, domify: 2, "es6-object-assign": 3 }] }, {}, [6])(6);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyIsInNyYy92ZW5kb3IvdmV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O2tCQ2FlLEVBQUUsR0FBRyxlQUFPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNEUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlB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LFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQ7OztBQUlELFdBQVEsRUFBRyxrQkFBVSxHQUFHLEVBQUUsU0FBUyxFQUFFO0FBQ3BDLFFBQUksQ0FBQyxTQUFTLEVBQUU7QUFDZixZQUFPLEtBQUssQ0FBQztLQUNiO0FBQ0QsV0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBLENBQUUsT0FBTyxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDN0Y7OztBQUlELFdBQVEsRUFBRyxrQkFBVSxHQUFHLEVBQUUsU0FBUyxFQUFFO0FBQ3BDLFFBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QyxTQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDckMsU0FBRyxDQUFDLFNBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQSxHQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMzRDtLQUNEO0lBQ0Q7OztBQUlELGFBQVUsRUFBRyxvQkFBVSxHQUFHLEVBQUUsU0FBUyxFQUFFO0FBQ3RDLFFBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QyxTQUFJLElBQUksR0FBRyxJQUFJ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R0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQ3JGLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDTixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQ3BDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUNoRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENB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QUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDakQ7QUFDRCxTQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDakIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUM5RjtBQUNELFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7QUFBQyxBQUc5RixTQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFckIsU0FBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN4QixDQUFDOztBQUdGLFFBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3ZDLFNBQUksQ0FBQyxDQUFDO0FBQ04sU0FBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxFQUFFOzs7O0FBSTFELFVBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7O0FBRXRCLFdBQUksQ0FBQyxPQUFPLENBQ1gsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM3QixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzdCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDN0IsS0FBSyxDQUNMLENBQUM7T0FDRixNQUFNOztBQUVOLFdBQUksQ0FBQyxPQUFPLENBQ1gsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDNUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDNUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFD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QUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRTtLQUNwRTs7Ozs7Ozs7QUFBQyxBQVNGLGFBQVMsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzFCLE1BQUMsSUFBSSxHQUFHLENBQUM7QUFDVCxNQUFDLElBQUksR0FBRyxDQUFDO0FBQ1QsTUFBQyxJQUFJLEdBQUcsQ0FBQztBQUNULFNBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsU0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxTQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsU0FBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQUUsYUFBTyxDQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBRSxDQUFDO01BQUU7QUFDN0MsU0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFHLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxHQUFJLENBQUMsS0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxBQUFDLENBQUM7QUFDNUQsWUFBTyxDQUNOLEVBQUUsSUFBSSxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUNoQixHQUFHLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLEVBQ1gsR0FBRyxHQUFHLENBQUMsQ0FDUCxDQUFDO0tBQ0Y7Ozs7Ozs7O0FBQUEsQUFTRCxhQUFTLE9BQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMxQixTQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQSxBQUFDLENBQUM7O0FBRXhCLFNBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNmLGFBQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO01BQ25COztBQUVELE1BQUMsSUFBSSxFQUFFLENBQUM7QUFDUixNQUFDLElBQUksR0FBRyxDQUFDOztBQUVULFNBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQztBQUM1QixTQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUM7QUFDcEIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQ0FBQztBQUN4QixhQUFRLENBQUM7QUFDUixXQUFLLENBQUMsQ0FBQztBQUNQLFdBQUssQ0FBQztBQUFFLGNBQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDdkIsV0FBSyxDQUFDO0FBQUUsY0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN2QixXQUFLLENBQUM7QUFBRSxjQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUFBLEFBQ3ZCLFdBQUssQ0FBQztBQUFFLGNBQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDdkIsV0FBSyxDQUFDO0FBQUUsY0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN2QixXQUFLLENBQUM7QUFBRSxjQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUFBLE1BQ3ZCO0tBQ0Q7O0FBR0QsYUFBUyxZQUFZLEdBQUk7QUFDeEIsUUFBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNyRCxRQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDeEQsWUFBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztLQUN4Qjs7QUFHRCxhQUFTLFVBQVUsR0FBSTs7Ozs7QUFLdEIsU0FBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7O0FBRW5DLFNBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFO0FBQ2hCLFNBQUcsQ0FBQyxNQUFNLEdBQUc7QUFDWixZQUFLLEVBQUUsSUFBSTtBQUNYLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNwQyxVQUFHLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDbkMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3BDLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNwQyxVQUFHLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDbkMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3BDLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNwQyxhQUFNLEVBQUcsR0FBRyxDQUFDLGFBQWEsRUFBRTtBQUM1QixZQUFLLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDckMsY0FBTyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3ZDLGNBQU8sRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN2QyxjQUFPLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDdkMsY0FBTyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3ZDLFVBQUcsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNuQyxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3BDLGNBQU8sRUFBRyxHQUFHLENBQUMsb0JBQW9CLEVBQUU7QUFDcEMsY0FBTyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3ZDLGVBQVEsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN4QyxlQUFRLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDeEMsZUFBUSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3hDLFVBQUcsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNuQyxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7QUFBQSxPQUNyQyxDQUFDOztBQUVGLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsRCxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25ELFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BELFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUU1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFM0MsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0MsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7TUFDN0M7O0FBRUQsU0FBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQzs7QUFFbkIsU0FBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuRCxTQUFJLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25DLFNBQUksY0FBYyxHQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxBQUFDLENBQUM7QUFDaEcsU0FBSSxrQkFBa0IsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekQsU0FBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FDMUIsSUFBSSxDQUFDLFlBQVksRUFDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUFDLEFBQ3JDLFNBQUksU0FBUyxHQUFHLFdBQVc7OztBQUFDLEFBRzVCLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7QUFDNUIsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEFBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxHQUFJLElBQUksQ0FBQztBQUM3RCxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUksSUFBSSxDQUFDO0FBQzlELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTTs7O0FBQUMsQUFHbEMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDbkMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRXBDLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7QUFDbkMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUN4QixNQUFDLENBQUMsSUFB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QUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFDLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxJQUFJLEdBQUMsa0JBQWtCLEVBQUMsQ0FBQyxDQUFBLENBQUE7U0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO09BQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO0tBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxPQUFPLElBQUUsT0FBTyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFO0FBQUMsT0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQUEsT0FBTyxDQUFDLENBQUE7R0FBQyxDQUFBLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFB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QyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUU7Y0FBQyxDQUFDLEdBQUMsU0FBRixDQUFDLEdBQVc7QUFBQyxtQkFBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtXQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxtQkFBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUUsSUFBSSxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsbUJBQU8sQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsR0FBRyxHQUFDLFlBQVU7QUFBQyxnQkFBSSxDQUFDO2dCQUFDLENBQUMsR0FBQyxTQUFTO2dCQUFDLENBQUMsR0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTTtnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7QUFBRyxlQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxLQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQztxQkFBTSxFQUFFLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLFlBQVU7QUFBQyxnQkFBSSxDQUFDO2dCQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLFNBQVM7Z0JBQUMsQ0FBQyxHQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztBQUFHLG1CQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsS0FBRyxDQUFDLENBQUM7QUFBRSxvQkFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO2VBQUE7cUJBQU0sRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxhQUFDLElBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFFLFFBQVEsR0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxLQUFHLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxZQUFVO0FBQUMsbUJBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQSxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBQyxVQUFVLEVBQUMsQ0FBQyxDQUFDLEVBQUMsWUFBWSxFQUFDLENBQUMsQ0FB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QUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxhQUFhLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLEVBQUMsZ0JBQWdCLEVBQUMsa0JBQWtCLENBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUMsa0NBQWtDLEVBQUMscUJBQXFCLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxRQUFRLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEVBQUMsb0JBQW9CLEVBQUMsdUJBQXVCLENBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLEVBQUMsOEJBQThCLEVBQUMsV0FBVyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxFQUFDLFNBQVMsRUFBQyxVQUFVLENBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyx3REFBd0QsRUFBQyxRQUFRLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGtCQUFZLENBQUM7QUFBQSxlQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsSUFBSSxLQUFHLENBQUMsRUFBQyxNQUFNLElBQUksU0FBUyxDQUFDLHlDQUF5QyxDQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsU0FBUyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxJQUFJLEtBQUcsQ0FBQyxFQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtXQUFDO1NBQUMsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsR0FBRTtBQUFDLGNBQU0sQ0FBQyxNQUFNLElBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUMsUUFBUSxFQUFDLEVBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLEVBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUE7T0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxFQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxlQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZ0JBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxHQUFDLENBQUMsR0FBQyxFQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsRUFBRSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQSxJQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSTtnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFBLEVBQUM7QUFBQyxtQkFBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxFQUFFLENBQUEsQUFBQyxFQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFFLE9BQU8sSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFBLEVBQUMsU0FBUTthQUFDLE1BQUssSUFBRyxDQUFDLENBQUMsRUFBQyxTQUFTLElBQUcsaUJBQWlCLEtBQUcsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLGVBQUMsR0FBQyxFQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxJQUFFLElBQUksS0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFBO2VBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEtBQUssS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFBO2FBQUM7V0FBQztTQUFDLElBQUcsQ0FBQyxDQUFDLEtBQUssRUFBQyxLQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFBQyxXQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQztTQUFBLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBSSxDQUFDLEdBQUMsRUFBRTtZQUFDLENBQUMsR0FBQyxhQUFhO1lBQUMsQ0FBQyxHQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxNQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUM7QUFBRSxXQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUEsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUcsQ0FBQyxLQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUU7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFHLElBQUksS0FBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Y0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7U0FBQyxNQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLE1BQUk7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO1NBQUMsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGVBQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsR0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxHQUFHLEdBQUMsRUFBRSxDQUFBLEFBQUMsR0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsR0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFBO09BQUMsSUFBSSxDQUFDLEdBQUMsdUNBQXVDO1VBQUMsQ0FBQyxHQUFDLG9DQUFvQztVQUFDLENBQUMsR0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLE9BQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxTQUFDLENBQUEsVUFBUyxDQUFDLEVBQUM7QUFBQyxjQUFHLFFBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxJQUFFLFdBQVcsSUFBRSxPQUFPLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBRyxVQUFVLElBQUUsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUk7QUFBQyxnQkFBSSxDQUFDLENBQUMsQ0FBQyxHQUFDLFdBQVcsSUFBRSxPQUFPLE1BQU0sR0FBQyxNQUFNLEdBQUMsV0FBVyxJQUFFLE9BQU8sQ0FBQyxHQUFDLENBQUMsR0FBQyxXQUFXLElBQUUsT0FBTyxJQUFJLEdBQUMsSUFBSSxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsRUFBRSxDQUFBO1dBQUM7U0FBQyxDQUFBLENBQUMsWUFBVTtBQUFDLGlCQUFPLENBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxxQkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGtCQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsT0FBTSxDQUFDLENBQUMsSUFBSSxHQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQSxDQUFBO2lCQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFDLE9BQU8sRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7aUJBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtlQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTthQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRTtBQUFDLGVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUFBLE9BQU8sQ0FBQyxDQUFBO1dBQUMsQ0FBQSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHVCQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUcsUUFBUSxJQUFFLE9BQU8sQ0FBQyxFQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLFFBQVEsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsTUFBTSxJQUFFLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7aUJBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUU7QUFBRSxtQkFBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7aUJBQUEsSUFBRyxDQUFDLENBQUMsVUFBVSxJQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxFQUFDLENBQUMsQ0FBQyxVQUFVO0FBQUUsbUJBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztpQkFBQSxPQUFPLENBQUMsQ0FBQTtlQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztrQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFFLE9BQU8sUUFBUSxLQUFHLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUMsb0VBQW9FLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxhQUFhLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLEVBQUMsZ0JBQWdCLEVBQUMsa0JBQWtCLENBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUMsa0NBQWtDLEVBQUMscUJBQXFCLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxRQUFRLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEVBQUMsb0JBQW9CLEVBQUMsdUJBQXVCLENBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLEVBQUMsOEJBQThCLEVBQUMsV0FBVyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxFQUFDLFNBQVMsRUFBQyxVQUFVLENBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyx3REFBd0QsRUFBQyxRQUFRLENBQUMsQ0FBQTthQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHVCQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsd0JBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxHQUFDLENBQUMsR0FBQyxFQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsRUFBRSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUEsSUFBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFBQyx3QkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUk7d0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQSxFQUFDO0FBQUMsMkJBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsRUFBRSxDQUFBLEFBQUMsRUFBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxPQUFPLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQSxFQUFDLFNBQVE7cUJBQUMsTUFBSyxJQUFHLENBQUMsQ0FBQyxFQUFDLFNBQVMsSUFBRyxpQkFBaUIsS0FBRyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFJO0FBQUMsdUJBQUMsR0FBQyxFQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsNEJBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSzs0QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxJQUFFLElBQUksS0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFBO3VCQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtxQkFBQzttQkFBQztpQkFBQyxJQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQUMsbUJBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFDO2lCQUFBLE9BQU8sQ0FBQyxDQUFBO2VBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLEVBQUU7b0JBQUMsQ0FBQyxHQUFDLGFBQWE7b0JBQUMsQ0FBQyxHQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksTUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDO0FBQUUsbUJBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQUEsT0FBTyxDQUFDLENBQUE7ZUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLG9CQUFHLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUcsSUFBSSxLQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7c0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO2lCQUFDLE1BQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2VBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLHNCQUFJ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V0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFDLFVBQVUsRUFBQyxLQUFLLEVBQUMsNkVBQTZFLEdBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBQyxXQUFXLEdBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsMEJBQUcsUUFBUSxZQUFTLENBQUMseUNBQUQsQ0FBQyxFQUFBLEVBQUM7QUFBQyw0QkFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFBO3VCQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtxQkFBQyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7bUJBQUMsRUFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sR0FBQyxFQUFDLEdBQUcsRUFBQyxFQUFDLElBQUksRUFBQyxJQUFJLEVBQUMsSUFBSSxFQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsMkJBQTJCLEVBQUMsS0FBSyxFQUFDLGlCQUFVO0FBQUMsMEJBQUksQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLENBQUE7cUJBQUMsRUFBQyxFQUFDLEVBQUUsRUFBQyxFQUFDLElBQUksRUFBQyxRQUFRLEVBQUMsSUFBSSxFQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsNkJBQTZCLEVBQUMsS0FBSyxFQUFDLGlCQUFVO0FBQUMsMEJBQUksQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO3FCQUFDLEVBQUMsRUFBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLEdBQUMsRUFBQyxRQUFRLEVBQUMsb0JBQVUsRUFBRSxFQUFDLFNBQVMsRUFBQyxxQkFBVSxFQUFFLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxLQUFLLEVBQUMsRUFBRSxFQUFDLE9BQU8sRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUMsZUFBZSxFQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxrQkFBUyxDQUFDLEVBQUM7QUFBQywyQkFBTyxDQUFDLENBQUMsY0FBYyxFQUFFLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUcsSUFBSSxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxFQUFDLElBQUksRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUEsQUFBQyxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTttQkFBQyxFQUFDLGVBQWUsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFDLENBQUMsQ0FBQyxtQkFBbUIsR0FBQyxFQUFDLE9BQU8sRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUMsRUFBQyxDQUFDLENBQUMsb0JBQW9CLEdBQUMsRUFBQyxLQUFLLEVBQUMsU0FBUyxFQUFDLFdBQVcsRUFBQyxFQUFFLEVBQUMsS0FBSyxFQUFDLEVBQUUsRUFBQyxFQUFDLENBQUMsQ0FBQyxxQkFBcUIsR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFBO2VBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQTthQUFDLEVBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxFQUFDLGdCQUFnQixFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsQ0FBQyxDQUFBO09BQUMsQ0FBQSxDQUFFLElBQUksQ0FBQyxJQUFJLEVBQUMsV0FBVyxJQUFFLE9BQU8sTUFBTSxHQUFDLE1BQU0sR0FBQyxXQUFXLElBQUUsT0FBTyxJQUFJLEdBQUMsSUFBSSxHQUFDLFdBQVcsSUFBRSxPQUFPLE1BQU0sR0FBQyxNQUFNLEdBQUMsRUFBRSxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsRUFBQyxnQkFBZ0IsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxVQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxPQUFDLENBQUMsb0JBQW9CLENBQUMsRUFBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1VBQUMsQ0FBQyxHQUFDLFNBQUYsQ0FBQyxDQUFVLENBQUMsRUFBQztBQUFDLFlBQUcsV0FBVyxJQUFFLE9BQU8sQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLENBQUE7U0FBQyxPQUFNLEVBQUUsQ0FBQTtPQUFDO1VBQUMsQ0FBQyxHQUFDLFNBQUYsQ0FBQyxDQUFVLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLFFBQVEsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLEtBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUM7T0FBQztVQUFDLENBQUMsR0FBQyxDQUFBLFlBQVU7QUFBQyxZQUFJLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUFDLENBQUMsR0FBQyxFQUFDLGVBQWUsRUFBQyxvQkFBb0IsRUFBQyxZQUFZLEVBQUMsY0FBYyxFQUFDLFVBQVUsRUFBQyxlQUFlLEVBQUMsV0FBVyxFQUFDLGdCQUFnQixFQUFDLFNBQVMsRUFBQyxjQUFjLEVBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFBQyxjQUFHLEtBQUssQ0FBQyxLQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FBQSxPQUFNLENBQUMsQ0FBQyxDQUFBO09BQUMsQ0FBQSxFQUFFO1VBQUMsQ0FBQyxHQUFDLEVBQUMsR0FBRyxFQUFDLEtBQUssRUFBQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE9BQU8sRUFBQyxhQUFhLEVBQUMsS0FBSyxFQUFDLFdBQVcsRUFBQyxPQUFPLEVBQUMsYUFBYSxFQUFDLElBQUksRUFBQyxVQUFVLEVBQUM7VUFBQyxDQUFDLEdBQUMsRUFBRTtVQUFDLENBQUMsR0FBQyxDQUFDO1VBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQztVQUFDLENBQUMsR0FBQyxFQUFDLElBQUksRUFBQyxjQUFTLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFNBQUYsQ0FBQyxDQUFVLENBQUMsRUFBQztBQUFDLG1CQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBQyxDQUFDLEdBQUMsc0dBQXNHLENBQUMsRUFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHlEQUF5RCxDQUFDLENBQUE7V0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQyxVQUFVLElBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFDLENBQUMsQ0FBQyxVQUFVLElBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxZQUFVO0FBQUMscUJBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLHFCQUFNLE1BQU0sS0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFDLGdCQUFnQixDQUFDLElBQUUsSUFBSSxLQUFHLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUMsb0JBQW9CLENBQUMsQ0FBQTthQUFDLElBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFDLE9BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsRUFBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUEsWUFBVTtBQUFDLHFCQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTthQUFDLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFHLENBQUMsS0FBRyxDQUFDLENBQUMsRUFBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLENBQUEsU0FBUyxDQUFDLEdBQUU7QUFBQyxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEtBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEtBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxBQUFDLENBQUE7YUFBQyxDQUFBLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFFLENBQUMsSUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLEdBQUUsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUE7V0FBQyxFQUFDLFFBQVEsSUFBRSxPQUFPLENBQUMsS0FBRyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxhQUFhLElBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQztjQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBQyxDQUFDLENBQUMsb0JBQW9CLElBQUUsQ0FB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QyxDQUFDLEdBQUMsQ0FBQyxDQUFBO09BQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBQyxvQkFBb0IsRUFBQyxDQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsRUFBQyxtQkFBbUIsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIGdyYXZpdG9uXG4gKlxuICogSmF2YVNjcmlwdCBOLWJvZHkgR3Jhdml0YXRpb25hbCBTaW11bGF0b3JcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgWmF2ZW4gTXVyYWR5YW5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICpcbiAqIFJldmlzaW9uOlxuICogIEBSRVZJU0lPTlxuICovXG5pbXBvcnQgR3RBcHAgZnJvbSAnLi9ncmF2aXRvbi9hcHAnO1xuXG5leHBvcnQgZGVmYXVsdCB7IGFwcDogR3RBcHAgfTtcbiIsIi8qKlxuICogZ3Jhdml0b24vYXBwIC0tIFRoZSBpbnRlcmFjdGl2ZSBncmF2aXRvbiBhcHBsaWNhdGlvblxuICovXG4vKiBnbG9iYWwganNjb2xvciAqL1xuXG5pbXBvcnQgdmV4IGZyb20gJy4uL3ZlbmRvci92ZXgnO1xuaW1wb3J0IHJhbmRvbSBmcm9tICcuLi91dGlsL3JhbmRvbSc7XG5pbXBvcnQgR3RTaW0gZnJvbSAnLi9zaW0nO1xuaW1wb3J0IEd0R2Z4IGZyb20gJy4vZ2Z4JztcbmltcG9ydCBHdEV2ZW50cywgeyBLRVlDT0RFUywgRVZFTlRDT0RFUywgQ09OVFJPTENPREVTIH0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IEd0VGltZXIgZnJvbSAnLi90aW1lcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0QXBwIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzID0ge30pIHtcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ncmlkID0gbnVsbDtcblxuICAgICAgICB0aGlzLmFuaW1UaW1lciA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaW0gPSBudWxsO1xuICAgICAgICB0aGlzLmdmeCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gZmFsc2U7XG4gICAgICAgIHRoaXMucXVhZFRyZWVMaW5lcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmludGVyYWN0aW9uID0ge3ByZXZpb3VzOiB7fX07XG4gICAgICAgIHRoaXMudGFyZ2V0Qm9keSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSBmYWxzZTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSBhcmdzLndpZHRoID0gYXJncy53aWR0aCB8fCB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IGFyZ3MuaGVpZ2h0ID0gYXJncy5oZWlnaHQgfHwgd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yID0gYXJncy5iYWNrZ3JvdW5kQ29sb3IgfHwgJyMxRjI2M0InO1xuXG4gICAgICAgIC8vIFJldHJpZXZlIGNhbnZhcywgb3IgYnVpbGQgb25lIHdpdGggYXJndW1lbnRzXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUdyaWQodGhpcy5vcHRpb25zLndpZHRoLCB0aGlzLm9wdGlvbnMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB7YmFja2dyb3VuZENvbG9yOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yfSk7XG4gICAgICAgICAgICBhcmdzLmdyaWQgPSB0aGlzLmdyaWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRyb2xzID0gdHlwZW9mIGFyZ3MuY29udHJvbHMgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuY29udHJvbHMpIDpcbiAgICAgICAgICAgIGFyZ3MuY29udHJvbHM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbnRyb2xzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUNvbnRyb2xzKCk7XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzID0gdGhpcy5jb250cm9scztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3BsYXlidG4nKTtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwYXVzZWJ0bicpO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuID0gYXJncy5iYXJuZXNIdXRPbkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI2Jhcm5lc2h1dG9uYnRuJyk7XG4gICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuID0gYXJncy5iYXJuZXNIdXRPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNiYXJuZXNodXRvZmZidG4nKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0biA9IGFyZ3MucXVhZFRyZWVPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNxdWFkdHJlZW9mZmJ0bicpO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4gPSBhcmdzLnF1YWRUcmVlT25CdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNxdWFkdHJlZW9uYnRuJyk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uc09mZkJ0biA9IGFyZ3MuY29sbGlzaW9uc09mZkJ0biA9XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNjb2xsaXNpb25zb2ZmYnRuJyk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uc09uQnRuID0gYXJncy5jb2xsaXNpb25zT25CdG4gPVxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjY29sbGlzaW9uc29uYnRuJyk7XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvZmZidG4nKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuID0gYXJncy50cmFpbE9uQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvbmJ0bicpO1xuICAgICAgICB0aGlzLmhlbHBCdG4gPSBhcmdzLmhlbHBCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNoZWxwYnRuJyk7XG5cbiAgICAgICAgdGhpcy5jb2xvclBpY2tlciA9IHR5cGVvZiBhcmdzLmNvbG9yUGlja2VyID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbG9yUGlja2VyKSA6XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb2xvclBpY2tlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5jbGFzc05hbWUgPSAnYm9keWNvbG9ycGlja2VyJztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb2xvclBpY2tlcik7XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyID0gdGhpcy5jb2xvclBpY2tlcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmpzY29sb3IgPSBuZXcganNjb2xvcih0aGlzLmNvbG9yUGlja2VyLCB7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICAgICAgc2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgIGJvcmRlcldpZHRoOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgaW5zZXRDb2xvcjogJyMzZDU1OWUnLFxuICAgICAgICAgICAgb25GaW5lQ2hhbmdlOiB0aGlzLnVwZGF0ZUNvbG9yLmJpbmQodGhpcylcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5tZXRhSW5mbyA9IHR5cGVvZiBhcmdzLm1ldGFJbmZvID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLm1ldGFJbmZvKSA6XG4gICAgICAgICAgICBhcmdzLm1ldGFJbmZvO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5tZXRhSW5mbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLmNsYXNzTmFtZSA9ICdtZXRhaW5mbyc7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMubWV0YUluZm8pO1xuICAgICAgICAgICAgYXJncy5tZXRhSW5mbyA9IHRoaXMubWV0YUluZm87XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbml0aWFsaXplXG4gICAgICAgIHRoaXMuaW5pdENvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VGltZXJzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbWFpbiAtLSBNYWluICdnYW1lJyBsb29wXG4gICAgICovXG4gICAgbWFpbigpIHtcbiAgICAgICAgLy8gRXZlbnQgcHJvY2Vzc2luZ1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHRoaXMuZXZlbnRzLnFnZXQoKS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBsZXQgcmV0dmFsO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VET1dOOlxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAvKiByaWdodCBjbGljayAqLyAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYm9keS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkgJiYgIXRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLnJlbW92ZUJvZHkodGhpcy50YXJnZXRCb2R5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRhcmdldEJvZHkodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5idXR0b24gPT09IC8qIG1pZGRsZSBjbGljayAqLyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb2xvciBwaWNraW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5ICYmICF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLmxlZnQgPSBldmVudC5wb3NpdGlvbi54ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLnRvcCA9IGV2ZW50LnBvc2l0aW9uLnkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanNjb2xvci5mcm9tU3RyaW5nKHRoaXMudGFyZ2V0Qm9keS5jb2xvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qc2NvbG9yLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLyogbGVmdCBjbGljayAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmFzZSB0aGUgY2hlY2sgb24gdGhlIHByZXZpb3VzIHZhbHVlLCBpbiBjYXNlIHRoZSBjb2xvciBwaWNrZXIgd2FzIGp1c3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsb3NlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBmbGFnIHRvIHNpZ25hbCBvdGhlciBldmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLmJvZHkgPSB0aGlzLnRhcmdldEJvZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5ib2R5ID0gdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQucG9zaXRpb24ueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcGlja2VyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VVUDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gdGhpcy5pbnRlcmFjdGlvbi5ib2R5O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmVsWCA9IChldmVudC5wb3NpdGlvbi54IC0gYm9keS54KSAqIDAuMDAwMDAwMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2ZWxZID0gKGV2ZW50LnBvc2l0aW9uLnkgLSBib2R5LnkpICogMC4wMDAwMDAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgc2ltdWxhdGlvbiBpcyBhY3RpdmUsIGFkZCB0aGUgdmVsb2NpdHkgdG8gdGhlIGN1cnJlbnQgdmVsb2NpdHlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluc3RlYWQgb2YgY29tcGxldGVseSByZXNldHRpbmcgaXQgKHRvIGFsbG93IGZvciBtb3JlIGludGVyZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcmFjdGlvbnMpLlxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS52ZWxYID0gdGhpcy5zaW1UaW1lci5hY3RpdmUgPyBib2R5LnZlbFggKyB2ZWxYIDogdmVsWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkudmVsWSA9IHRoaXMuc2ltVGltZXIuYWN0aXZlID8gYm9keS52ZWxZICsgdmVsWSA6IHZlbFk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYXJnZXQoZXZlbnQucG9zaXRpb24ueCwgZXZlbnQucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFTU9WRTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy54ID0gZXZlbnQucG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy55ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgJiYgIXRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhcmdldChldmVudC5wb3NpdGlvbi54LCBldmVudC5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFTU9WRVxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFV0hFRUw6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keS5hZGp1c3RTaXplKGV2ZW50LmRlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTWV0YUluZm8oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFV0hFRUxcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5LRVlET1dOOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleWNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19FTlRFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfQjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbVN0cmF0ZWd5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19DOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGlzaW9ucygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfTDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBpY29uIGlmIG5lZWRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNpbVRpbWVyLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBzaW11bGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdmeC5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltVGltZXIuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHZhbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1A6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlQm9kaWVzKDEwLCB7cmFuZG9tQ29sb3JzOiB0cnVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19UOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLyAyLCB5OiB0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVsWDogMCwgdmVsWTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMjAwMCwgcmFkaXVzOiA1MCwgY29sb3I6ICcjNUE1QTVBJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLSA0MDAsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLjAwMDAyNSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMSwgcmFkaXVzOiA1LCBjb2xvcjogJyM3ODc4NzgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19RVUVTVElPTk1BUks6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgS0VZRE9XTlxuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUExBWUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QQVVTRUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5CQVJORVNIVVRPTkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW1TdHJhdGVneSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLkJBUk5FU0hVVE9GRkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW1TdHJhdGVneSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5RVUFEVFJFRU9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZUNvbGxpc2lvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGlzaW9ucygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuSEVMUEJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmVkcmF3IHNjcmVlblxuICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgIH1cblxuICAgIGluaXRDb21wb25lbnRzKCkge1xuICAgICAgICAvLyBDcmVhdGUgY29tcG9uZW50cyAtLSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICAgICAgdGhpcy5ldmVudHMgPSB0aGlzLmFyZ3MuZXZlbnRzID0gbmV3IEd0RXZlbnRzKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuc2ltID0gbmV3IEd0U2ltKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuZ2Z4ID0gbmV3IEd0R2Z4KHRoaXMuYXJncyk7XG4gICAgfVxuXG4gICAgaW5pdFRpbWVycygpIHtcbiAgICAgICAgLy8gQWRkIGBtYWluYCBsb29wLCBhbmQgc3RhcnQgaW1tZWRpYXRlbHlcbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLm1haW4uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLnNpbS5zdGVwLmJpbmQodGhpcy5zaW0pLCA2MCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltKCkge1xuICAgICAgICB0aGlzLnNpbVRpbWVyLnRvZ2dsZSgpO1xuICAgICAgICBpZiAodGhpcy5zaW1UaW1lci5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltU3RyYXRlZ3koKSB7XG4gICAgICAgIHRoaXMuc2ltLnRvZ2dsZVN0cmF0ZWd5KCk7XG4gICAgICAgIGlmICh0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVRdWFkVHJlZUxpbmVzSWNvbnMoKTtcbiAgICB9XG5cbiAgICB0b2dnbGVDb2xsaXNpb25zKCkge1xuICAgICAgICB0aGlzLnNpbS5tZXJnZUNvbGxpc2lvbnMgPSAhdGhpcy5zaW0ubWVyZ2VDb2xsaXNpb25zO1xuICAgICAgICBpZiAodGhpcy5zaW0ubWVyZ2VDb2xsaXNpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbnNPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMuY29sbGlzaW9uc09uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGlzaW9uc09mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbnNPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhaWxzKCkge1xuICAgICAgICB0aGlzLm5vY2xlYXIgPSAhdGhpcy5ub2NsZWFyO1xuICAgICAgICBpZiAodGhpcy5ub2NsZWFyKSB7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZVF1YWRUcmVlTGluZXMoKSB7XG4gICAgICAgIHRoaXMucXVhZFRyZWVMaW5lcyA9ICF0aGlzLnF1YWRUcmVlTGluZXM7XG4gICAgICAgIHRoaXMudXBkYXRlUXVhZFRyZWVMaW5lc0ljb25zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlUXVhZFRyZWVMaW5lc0ljb25zKCkge1xuICAgICAgICBpZiAodGhpcy5zaW0udXNlQnJ1dGVGb3JjZSkge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhZFRyZWVMaW5lcykge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzaG93SGVscCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNIZWxwT3Blbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNIZWxwT3BlbiA9IHRydWU7XG4gICAgICAgIHZleC5vcGVuKHtcbiAgICAgICAgICAgIHVuc2FmZUNvbnRlbnQ6IGBcbiAgICAgICAgICAgICAgICA8aDM+U2hvcnRjdXRzPC9oMz5cbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJzaG9ydGN1dHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+TGVmdCBjbGljazwvdGQ+IDx0ZD4gY3JlYXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5SaWdodCBjbGljazwvdGQ+IDx0ZD4gZGVsZXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5NaWRkbGUgY2xpY2s8L3RkPiA8dGQ+IGNoYW5nZSBib2R5IGNvbG9yPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+RW50ZXI8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gc3RhcnQgc2ltdWxhdGlvbjwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPkI8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gdG9nZ2xlIGJydXRlLWZvcmNlL0Jhcm5lcy1IdXQ8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5DPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHRvZ2dsZSBjb2xsaXNpb25zPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+TDwvY29kZT4ga2V5PC90ZD4gPHRkPiBjbGVhciBjYW52YXM8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5QPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHRvZ2dsZSByZXBhaW50aW5nPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UTwvY29kZT4ga2V5PC90ZD4gPHRkPiB0b2dnbGUgcXVhZHRyZWUgbGluZXM8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5SPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IGNyZWF0ZSByYW5kb20gYm9kaWVzPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+VDwvY29kZT4ga2V5PC90ZD4gPHRkPiBjcmVhdGUgVGl0YW48L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT4/PC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHNob3cgaGVscDwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDxmb290ZXIgY2xhc3M9XCJmb3JrbGlua1wiPk1hZGUgaW4gMjAxNy4gPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS92b2l0aG9zL2dyYXZpdG9uXCI+Rm9yayBtZSBvbiBHaXRIdWI8L2E+PC9mb290ZXI+XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGFmdGVyQ2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVkcmF3KCkge1xuICAgICAgICBpZiAoIXRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5xdWFkVHJlZUxpbmVzICYmICF0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5kcmF3UXVhZFRyZWVMaW5lcyh0aGlzLnNpbS50cmVlLnJvb3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmRyYXdSZXRpY2xlTGluZSh0aGlzLmludGVyYWN0aW9uLmJvZHksIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2Z4LmRyYXdCb2RpZXModGhpcy5zaW0uYm9kaWVzLCB0aGlzLnRhcmdldEJvZHkpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlR3JpZCh3aWR0aCwgaGVpZ2h0LCBzdHlsZSkge1xuICAgICAgICAvLyBBdHRhY2ggYSBjYW52YXMgdG8gdGhlIHBhZ2UsIHRvIGhvdXNlIHRoZSBzaW11bGF0aW9uc1xuICAgICAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmNsYXNzTmFtZSA9ICdncmF2aXRvbmNhbnZhcyc7XG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmdyaWQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5MZWZ0ID0gc3R5bGUubWFyZ2luTGVmdCB8fCAnYXV0byc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5SaWdodCA9IHN0eWxlLm1hcmdpblJpZ2h0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0eWxlLmJhY2tncm91bmRDb2xvciB8fCAnIzAwMDAwMCc7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmdyaWQpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQ29udHJvbHMoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZW51Jyk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9ICd0b29sYmFyJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pZCA9ICdjb250cm9scyc7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwicGxheWJ0blwiIGRhdGEtdG9vbHRpcD1cIlN0YXJ0IHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wbGF5LnN2Z1wiIGFsdD1cIlN0YXJ0IHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJwYXVzZWJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiBkYXRhLXRvb2x0aXA9XCJTdG9wIHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wYXVzZS5zdmdcIiBhbHQ9XCJTdG9wIHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJiYXJuZXNodXRvbmJ0blwiIGRhdGEtdG9vbHRpcD1cIlN3aXRjaCB0byBicnV0ZSBmb3JjZVwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL2Jhcm5lc19odXRfb24uc3ZnXCIgYWx0PVwiU3dpdGNoIHRvIGJydXRlIGZvcmNlXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwiYmFybmVzaHV0b2ZmYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGRhdGEtdG9vbHRpcD1cIlN3aXRjaCB0byBCYXJuZXMtSHV0XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvYmFybmVzX2h1dF9vZmYuc3ZnXCIgYWx0PVwiU3dpdGNoIHRvIEJhcm5lcy1IdXRcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9mZmJ0blwiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgcXVhZHRyZWUgbGluZXNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9uYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29uLnN2Z1wiIGFsdD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImNvbGxpc2lvbnNvbmJ0blwiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBjb2xsaXNpb25zXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvY29sbGlzaW9uc19vbi5zdmdcIiBhbHQ9XCJUb2dnbGUgY29sbGlzaW9uc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImNvbGxpc2lvbnNvZmZidG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgZGF0YS10b29sdGlwPVwiVG9nZ2xlIGNvbGxpc2lvbnNcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9jb2xsaXNpb25zX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgY29sbGlzaW9uc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb2ZmYnRuXCIgZGF0YS10b29sdGlwPVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3RyYWlsX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgdHJhaWxzXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwidHJhaWxvbmJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiBkYXRhLXRvb2x0aXA9XCJUb2dnbGUgdHJhaWxzXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb24uc3ZnXCIgYWx0PVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImhlbHBidG5cIiBkYXRhLXRvb2x0aXA9XCJTaG9ydGN1dHNcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9oZWxwLnN2Z1wiIGFsdD1cIlNob3J0Y3V0c1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIGA7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRyb2xzKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZUJvZGllcyhudW0sIGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgbGV0IG1pblggPSBhcmdzLm1pblggfHwgMDtcbiAgICAgICAgbGV0IG1heFggPSBhcmdzLm1heFggfHwgdGhpcy5vcHRpb25zLndpZHRoO1xuICAgICAgICBsZXQgbWluWSA9IGFyZ3MubWluWSB8fCAwO1xuICAgICAgICBsZXQgbWF4WSA9IGFyZ3MubWF4WSB8fCB0aGlzLm9wdGlvbnMuaGVpZ2h0O1xuXG4gICAgICAgIGxldCBtaW5WZWxYID0gYXJncy5taW5WZWxYIHx8IDA7XG4gICAgICAgIGxldCBtYXhWZWxYID0gYXJncy5tYXhWZWxYIHx8IDAuMDAwMDE7XG4gICAgICAgIGxldCBtaW5WZWxZID0gYXJncy5taW5WZWxZIHx8IDA7XG4gICAgICAgIGxldCBtYXhWZWxZID0gYXJncy5tYXhWZWxZIHx8IDAuMDAwMDE7XG5cbiAgICAgICAgbGV0IG1pblJhZGl1cyA9IGFyZ3MubWluUmFkaXVzIHx8IDE7XG4gICAgICAgIGxldCBtYXhSYWRpdXMgPSBhcmdzLm1heFJhZGl1cyB8fCAxNTtcblxuICAgICAgICBsZXQgY29sb3IgPSBhcmdzLmNvbG9yO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcmdzLnJhbmRvbUNvbG9ycyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gcmFuZG9tLmNvbG9yKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgIHg6IHJhbmRvbS5udW1iZXIobWluWCwgbWF4WCksXG4gICAgICAgICAgICAgICAgeTogcmFuZG9tLm51bWJlcihtaW5ZLCBtYXhZKSxcbiAgICAgICAgICAgICAgICB2ZWxYOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWCwgbWF4VmVsWCksXG4gICAgICAgICAgICAgICAgdmVsWTogcmFuZG9tLmRpcmVjdGlvbmFsKG1pblZlbFksIG1heFZlbFkpLFxuICAgICAgICAgICAgICAgIHJhZGl1czogcmFuZG9tLm51bWJlcihtaW5SYWRpdXMsIG1heFJhZGl1cyksXG4gICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVRhcmdldCh4LCB5KSB7XG4gICAgICAgIHRoaXMuc2V0VGFyZ2V0Qm9keSh0aGlzLnNpbS5nZXRCb2R5QXQoeCwgeSkpO1xuICAgIH1cblxuICAgIHNldFRhcmdldEJvZHkoYm9keSkge1xuICAgICAgICB0aGlzLnRhcmdldEJvZHkgPSBib2R5O1xuICAgICAgICB0aGlzLnVwZGF0ZU1ldGFJbmZvKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlTWV0YUluZm8oKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8uaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICBg4oqVICR7dGhpcy50YXJnZXRCb2R5Lm1hc3MudG9GaXhlZCgyKX0gJm5ic3A7YCArXG4gICAgICAgICAgICAgICAgYOKmvyAke3RoaXMudGFyZ2V0Qm9keS5yYWRpdXMudG9GaXhlZCgyKX0gJm5ic3A7YCArXG4gICAgICAgICAgICAgICAgYOKHlyAke3RoaXMudGFyZ2V0Qm9keS5zcGVlZC50b0ZpeGVkKDIpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLnRleHRDb250ZW50ID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVDb2xvcigpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5LnVwZGF0ZUNvbG9yKHRoaXMuanNjb2xvci50b0hFWFN0cmluZygpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzQ29sb3JQaWNrZXJBY3RpdmUoKSB7XG4gICAgICAgIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUgPSB0aGlzLmNvbG9yUGlja2VyLmNsYXNzTmFtZS5pbmRleE9mKCdqc2NvbG9yLWFjdGl2ZScpID4gLTE7XG4gICAgICAgIHJldHVybiB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2FwcFxuIiwiaW1wb3J0IGNvbG9ycyBmcm9tICcuLi91dGlsL2NvbG9ycyc7XG5cbi8qKlxuICogZ3Jhdml0b24vYm9keSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBib2R5XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0Qm9keSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnggPSBhcmdzLng7XG4gICAgICAgIHRoaXMueSA9IGFyZ3MueTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnggIT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignQ29ycmVjdCBwb3NpdGlvbnMgd2VyZSBub3QgZ2l2ZW4gZm9yIHRoZSBib2R5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5uZXh0WCA9IHRoaXMueDtcbiAgICAgICAgdGhpcy5uZXh0WSA9IHRoaXMueTtcblxuICAgICAgICB0aGlzLnZlbFggPSBhcmdzLnZlbFggfHwgMDtcbiAgICAgICAgdGhpcy52ZWxZID0gYXJncy52ZWxZIHx8IDA7XG5cbiAgICAgICAgdGhpcy5yYWRpdXMgPSBhcmdzLnJhZGl1cztcbiAgICAgICAgdGhpcy5tYXNzID0gYXJncy5tYXNzO1xuXG4gICAgICAgIGlmICgncmFkaXVzJyBpbiBhcmdzICYmICEoJ21hc3MnIGluIGFyZ3MpKSB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlUmFkaXVzKGFyZ3MucmFkaXVzKTtcbiAgICAgICAgfSBlbHNlIGlmICgnbWFzcycgaW4gYXJncyAmJiAhKCdyYWRpdXMnIGluIGFyZ3MpKSB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlTWFzcyhhcmdzLm1hc3MpO1xuICAgICAgICB9IGVsc2UgaWYgKCEoJ21hc3MnIGluIGFyZ3MpICYmICEoJ3JhZGl1cycgaW4gYXJncykpIHtcbiAgICAgICAgICAgIC8vIERlZmF1bHQgdG8gYSByYWRpdXMgb2YgMTBcbiAgICAgICAgICAgIHRoaXMuZm9yY2VSYWRpdXMoMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdGhpcy51cGRhdGVDb2xvcihhcmdzLmNvbG9yIHx8ICcjZGJkM2M4Jyk7XG4gICAgfVxuXG4gICAgYWRqdXN0U2l6ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmZvcmNlUmFkaXVzKE1hdGgubWF4KHRoaXMucmFkaXVzICsgZGVsdGEsIDIpKTtcbiAgICB9XG5cbiAgICBmb3JjZVJhZGl1cyhyYWRpdXMpIHtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSByYWRpdXM7XG4gICAgICAgIC8vIERvcmt5IGZvcm11bGEgdG8gbWFrZSBtYXNzIHNjYWxlIFwicHJvcGVybHlcIiB3aXRoIHJhZGl1cy5cbiAgICAgICAgdGhpcy5tYXNzID0gTWF0aC5wb3codGhpcy5yYWRpdXMgLyA0LCAzKTtcbiAgICB9XG5cbiAgICBmb3JjZU1hc3MobWFzcykge1xuICAgICAgICAvLyBOb3JtYWxseSB0aGUgbWFzcyBpcyBjYWxjdWxhdGVkIGJhc2VkIG9uIHRoZSByYWRpdXMsIGJ1dCB3ZSBjYW4gZG8gdGhlIHJldmVyc2VcbiAgICAgICAgdGhpcy5tYXNzID0gbWFzcztcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBNYXRoLnBvdyh0aGlzLm1hc3MsIDEvMykgKiA0O1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbG9yKGNvbG9yKSB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSBjb2xvcnMudG9IZXgoY29sb3JzLmJyaWdodGVuKGNvbG9ycy5mcm9tSGV4KHRoaXMuY29sb3IpLCAuMjUpKTtcbiAgICB9XG5cbiAgICBnZXQgc3BlZWQoKSB7XG4gICAgICAgIC8vIFZlbG9jaXRpZXMgYXJlIHRpbnksIHNvIHVwc2NhbGUgaXQgKGFyYml0cmFyaWx5KSB0byBtYWtlIGl0IHJlYWRhYmxlLlxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMudmVsWCAqIHRoaXMudmVsWCArIHRoaXMudmVsWSAqIHRoaXMudmVsWSkgKiAxZTY7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vYm9keVxuIiwiLyoqXG4gKiBncmF2aXRvbi9ldmVudHMgLS0gRXZlbnQgcXVldWVpbmcgYW5kIHByb2Nlc3NpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IEtFWUNPREVTID0ge1xuICAgIEtfTEVGVDogMzcsXG4gICAgS19VUDogMzgsXG4gICAgS19SSUdIVDogMzksXG4gICAgS19ET1dOOiA0MCxcblxuICAgIEtfMDogNDgsXG4gICAgS18xOiA0OSxcbiAgICBLXzI6IDUwLFxuICAgIEtfMzogNTEsXG4gICAgS180OiA1MixcbiAgICBLXzU6IDUzLFxuICAgIEtfNjogNTQsXG4gICAgS183OiA1NSxcbiAgICBLXzg6IDU2LFxuICAgIEtfOTogNTcsXG5cbiAgICBLX0E6IDY1LFxuICAgIEtfQjogNjYsXG4gICAgS19DOiA2NyxcbiAgICBLX0Q6IDY4LFxuICAgIEtfRTogNjksXG4gICAgS19GOiA3MCxcbiAgICBLX0c6IDcxLFxuICAgIEtfSDogNzIsXG4gICAgS19JOiA3MyxcbiAgICBLX0o6IDc0LFxuICAgIEtfSzogNzUsXG4gICAgS19MOiA3NixcbiAgICBLX006IDc3LFxuICAgIEtfTjogNzgsXG4gICAgS19POiA3OSxcbiAgICBLX1A6IDgwLFxuICAgIEtfUTogODEsXG4gICAgS19SOiA4MixcbiAgICBLX1M6IDgzLFxuICAgIEtfVDogODQsXG4gICAgS19VOiA4NSxcbiAgICBLX1Y6IDg2LFxuICAgIEtfVzogODcsXG4gICAgS19YOiA4OCxcbiAgICBLX1k6IDg5LFxuICAgIEtfWjogOTAsXG5cbiAgICBLX0tQMTogOTcsXG4gICAgS19LUDI6IDk4LFxuICAgIEtfS1AzOiA5OSxcbiAgICBLX0tQNDogMTAwLFxuICAgIEtfS1A1OiAxMDEsXG4gICAgS19LUDY6IDEwMixcbiAgICBLX0tQNzogMTAzLFxuICAgIEtfS1A4OiAxMDQsXG4gICAgS19LUDk6IDEwNSxcblxuICAgIEtfUVVFU1RJT05NQVJLOiAxOTEsXG5cbiAgICBLX0JBQ0tTUEFDRTogOCxcbiAgICBLX1RBQjogOSxcbiAgICBLX0VOVEVSOiAxMyxcbiAgICBLX1NISUZUOiAxNixcbiAgICBLX0NUUkw6IDE3LFxuICAgIEtfQUxUOiAxOCxcbiAgICBLX0VTQzogMjcsXG4gICAgS19TUEFDRTogMzJcbn07XG5cbmV4cG9ydCBjb25zdCBNT1VTRUNPREVTID0ge1xuICAgIE1fTEVGVDogMCxcbiAgICBNX01JRERMRTogMSxcbiAgICBNX1JJR0hUOiAyXG59O1xuXG5leHBvcnQgY29uc3QgRVZFTlRDT0RFUyA9IHtcbiAgICBNT1VTRURPV046IDEwMDAsXG4gICAgTU9VU0VVUDogMTAwMSxcbiAgICBNT1VTRU1PVkU6IDEwMDIsXG4gICAgTU9VU0VXSEVFTDogMTAwMyxcbiAgICBDTElDSzogMTAwNCxcbiAgICBEQkxDTElDSzogMTAwNSxcblxuICAgIEtFWURPV046IDEwMTAsXG4gICAgS0VZVVA6IDEwMTFcbn07XG5cbmV4cG9ydCBjb25zdCBDT05UUk9MQ09ERVMgPSB7XG4gICAgUExBWUJUTjogMjAwMCxcbiAgICBQQVVTRUJUTjogMjAwMSxcbiAgICBUUkFJTE9GRkJUTjogMjAwMixcbiAgICBUUkFJTE9OQlROOiAyMDAzLFxuICAgIEhFTFBCVE46IDIwMDQsXG4gICAgUVVBRFRSRUVPRkZCVE46IDIwMDUsXG4gICAgUVVBRFRSRUVPTkJUTjogMjAwNixcbiAgICBCQVJORVNIVVRPTkJUTjogMjAwNyxcbiAgICBCQVJORVNIVVRPRkZCVE46IDIwMDgsXG4gICAgQ09MTElTSU9OU09GRkJUTjogMjAwOSxcbiAgICBDT0xMSVNJT05TT05CVE46IDIwMTBcbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RFdmVudHMge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgYXJncy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHVzYWJsZSBjYW52YXMgZWxlbWVudCB3YXMgZ2l2ZW4uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncmlkID0gYXJncy5ncmlkO1xuICAgICAgICB0aGlzLmNvbnRyb2xzID0gYXJncy5jb250cm9scztcbiAgICAgICAgdGhpcy5wbGF5QnRuID0gYXJncy5wbGF5QnRuO1xuICAgICAgICB0aGlzLnBhdXNlQnRuID0gYXJncy5wYXVzZUJ0bjtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPbkJ0biA9IGFyZ3MuYmFybmVzSHV0T25CdG47XG4gICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuID0gYXJncy5iYXJuZXNIdXRPZmZCdG47XG4gICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4gPSBhcmdzLnF1YWRUcmVlT2ZmQnRuO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4gPSBhcmdzLnF1YWRUcmVlT25CdG47XG4gICAgICAgIHRoaXMuY29sbGlzaW9uc09mZkJ0biA9IGFyZ3MuY29sbGlzaW9uc09mZkJ0bjtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT25CdG4gPSBhcmdzLmNvbGxpc2lvbnNPbkJ0bjtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0biA9IGFyZ3MudHJhaWxPZmZCdG47XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0biA9IGFyZ3MudHJhaWxPbkJ0bjtcbiAgICAgICAgdGhpcy5oZWxwQnRuID0gYXJncy5oZWxwQnRuO1xuXG4gICAgICAgIHRoaXMud2lyZXVwRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgcWFkZChldmVudCkge1xuICAgICAgICB0aGlzLnF1ZXVlLnB1c2goZXZlbnQpO1xuICAgIH1cblxuICAgIHFwb2xsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgIH1cblxuICAgIHFnZXQoKSB7XG4gICAgICAgIC8vIFJlcGxhY2luZyB0aGUgcmVmZXJlbmNlIGlzIGZhc3RlciB0aGFuIGBzcGxpY2UoKWBcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMucXVldWU7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgICAgcmV0dXJuIHJlZjtcbiAgICB9XG5cbiAgICBxY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICB9XG5cbiAgICB3aXJldXBFdmVudHMoKSB7XG4gICAgICAgIC8vIEdyaWQgbW91c2UgZXZlbnRzXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuaGFuZGxlRGJsQ2xpY2suYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5oYW5kbGVDb250ZXh0TWVudS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlTW91c2VEb3duLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuaGFuZGxlTW91c2VVcC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlTW91c2VNb3ZlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLmhhbmRsZU1vdXNlV2hlZWwuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gR3JpZCBrZXkgZXZlbnRzXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5oYW5kbGVLZXlVcC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBDb250cm9sIGV2ZW50c1xuICAgICAgICB0aGlzLnBsYXlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QTEFZQlROKSk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QQVVTRUJUTikpO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuQkFSTkVTSFVUT05CVE4pKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPZmZCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5CQVJORVNIVVRPRkZCVE4pKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROKSk7XG4gICAgICAgIHRoaXMucXVhZFRyZWVPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT05CVE4pKTtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT25CdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT05CVE4pKTtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT2ZmQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuQ09MTElTSU9OU09GRkJUTikpO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPRkZCVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPTkJUTikpO1xuICAgICAgICB0aGlzLmhlbHBCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5IRUxQQlROKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVEYmxDbGljayhldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5EQkxDTElDSyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGJ1dHRvbjogZXZlbnQuYnV0dG9uLFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUNvbnRleHRNZW51KGV2ZW50KSB7XG4gICAgICAgIC8vIFByZXZlbnQgcmlnaHQtY2xpY2sgbWVudVxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlRG93bihldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRURPV04sXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZVVwKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFVVAsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VNT1ZFLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VXaGVlbChldmVudCkge1xuICAgICAgICAvLyBSZXZlcnNlIHRoZSB1cC9kb3duLlxuICAgICAgICBsZXQgZGVsdGEgPSAtZXZlbnQuZGVsdGFZIC8gNTA7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VXSEVFTCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGRlbHRhOiBkZWx0YSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBzY3JvbGxpbmdcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlEb3duKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlET1dOLFxuICAgICAgICAgICAga2V5Y29kZToga2V5LFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUtleVVwKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlVUCxcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250cm9sQ2xpY2sodHlwZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRQb3NpdGlvbihldmVudCkge1xuICAgICAgICAvLyBDYWxjdWxhdGUgb2Zmc2V0IG9uIHRoZSBncmlkIGZyb20gY2xpZW50WC9ZLCBiZWNhdXNlXG4gICAgICAgIC8vIHNvbWUgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBldmVudC5vZmZzZXRYL1lcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LmNsaWVudFggLSB0aGlzLmdyaWQub2Zmc2V0TGVmdCxcbiAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFkgLSB0aGlzLmdyaWQub2Zmc2V0VG9wXG4gICAgICAgIH07XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vZXZlbnRzXG4iLCIvKipcbiAqIGdyYXZpdG9uL2dmeCAtLSBUaGUgZ3JhcGhpY3Mgb2JqZWN0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0R2Z4IHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHVzYWJsZSBjYW52YXMgZWxlbWVudCB3YXMgZ2l2ZW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuZ3JpZC5nZXRDb250ZXh0KCcyZCcpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICAvLyBTZXR0aW5nIHRoZSB3aWR0aCBoYXMgdGhlIHNpZGUgZWZmZWN0XG4gICAgICAgIC8vIG9mIGNsZWFyaW5nIHRoZSBjYW52YXNcbiAgICAgICAgdGhpcy5ncmlkLndpZHRoID0gdGhpcy5ncmlkLndpZHRoO1xuICAgIH1cblxuICAgIGRyYXdCb2RpZXMoYm9kaWVzLCB0YXJnZXRCb2R5KSB7XG4gICAgICAgIGZvciAobGV0IGJvZHkgb2YgYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3Qm9keShib2R5LCAvKiBpc1RhcmdldGVkICovIGJvZHkgPT09IHRhcmdldEJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2RyYXdCb2R5KGJvZHksIGlzVGFyZ2V0ZWQpIHtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gYm9keS5jb2xvcjtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHguYXJjKGJvZHkueCwgYm9keS55LCBib2R5LnJhZGl1cywgMCwgTWF0aC5QSSAqIDIsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuY3R4LmZpbGwoKTtcbiAgICAgICAgaWYgKGlzVGFyZ2V0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gYm9keS5oaWdobGlnaHQ7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSBNYXRoLnJvdW5kKGJvZHkucmFkaXVzIC8gOCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdSZXRpY2xlTGluZShmcm9tLCB0bykge1xuICAgICAgICBsZXQgZ3JhZCA9IHRoaXMuY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KGZyb20ueCwgZnJvbS55LCB0by54LCB0by55KTtcbiAgICAgICAgZ3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMzEsIDc1LCAxMzAsIDEpJyk7XG4gICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDMxLCA3NSwgMTMwLCAwLjEpJyk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZ3JhZDtcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gNjtcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdyb3VuZCc7XG5cbiAgICAgICAgLy8gRHJhdyBpbml0aWFsIGJhY2tncm91bmQgbGluZS5cbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyhmcm9tLngsIGZyb20ueSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0by54LCB0by55KTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgLy8gRHJhdyBvdmVybGF5IGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJyMzNDc3Q0EnO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAyO1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGZyb20ueCwgZnJvbS55KTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRvLngsIHRvLnkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICB9XG5cbiAgICBkcmF3UXVhZFRyZWVMaW5lcyh0cmVlTm9kZSkge1xuICAgICAgICAvLyBTZXR1cCBsaW5lIHN0eWxlIGFuZCBjYWxsIHRoZSBkcmF3aW5nIHJvdXRpbmVzXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJyMwMDAnO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmN0eC5saW5lQ2FwID0gJ2J1dHQnO1xuICAgICAgICB0aGlzLl9kcmF3UXVhZFRyZWVMaW5lKHRyZWVOb2RlKTtcbiAgICB9XG5cbiAgICBfZHJhd1F1YWRUcmVlTGluZSh0cmVlTm9kZSkge1xuICAgICAgICBpZiAoIXRyZWVOb2RlIHx8ICF0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRHJhdyB4IGFuZCB5IGxpbmVzXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odHJlZU5vZGUubWlkWCwgdHJlZU5vZGUuc3RhcnRZKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRyZWVOb2RlLm1pZFgsIHRyZWVOb2RlLnN0YXJ0WSArIHRyZWVOb2RlLmhlaWdodCk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odHJlZU5vZGUuc3RhcnRYLCB0cmVlTm9kZS5taWRZKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRyZWVOb2RlLnN0YXJ0WCArIHRyZWVOb2RlLndpZHRoLCB0cmVlTm9kZS5taWRZKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGUgb2YgdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX2RyYXdRdWFkVHJlZUxpbmUoY2hpbGROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2dmeFxuIiwiLyoqXG4gKiBncmF2aXRvbi9zaW0gLS0gVGhlIGdyYXZpdGF0aW9uYWwgc2ltdWxhdG9yXG4gKi9cbmltcG9ydCBHdEJvZHkgZnJvbSAnLi9ib2R5JztcbmltcG9ydCBHdFRyZWUgZnJvbSAnLi90cmVlJztcbmltcG9ydCBjb2xvcnMgZnJvbSAnLi4vdXRpbC9jb2xvcnMnO1xuXG4vKiogRXhlcnQgZm9yY2Ugb24gYSBib2R5IGFuZCB1cGRhdGUgaXRzIG5leHQgcG9zaXRpb24uICovXG5mdW5jdGlvbiBleGVydEZvcmNlKGJvZHksIG5ldEZ4LCBuZXRGeSwgZGVsdGFUKSB7XG4gICAgLy8gQ2FsY3VsYXRlIGFjY2VsZXJhdGlvbnNcbiAgICBjb25zdCBheCA9IG5ldEZ4IC8gYm9keS5tYXNzO1xuICAgIGNvbnN0IGF5ID0gbmV0RnkgLyBib2R5Lm1hc3M7XG5cbiAgICAvLyBDYWxjdWxhdGUgbmV3IHZlbG9jaXRpZXMsIG5vcm1hbGl6ZWQgYnkgdGhlICd0aW1lJyBpbnRlcnZhbFxuICAgIGJvZHkudmVsWCArPSBkZWx0YVQgKiBheDtcbiAgICBib2R5LnZlbFkgKz0gZGVsdGFUICogYXk7XG5cbiAgICAvLyBDYWxjdWxhdGUgbmV3IHBvc2l0aW9ucyBhZnRlciB0aW1lc3RlcCBkZWx0YVRcbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBkb2Vzbid0IHVwZGF0ZSB0aGUgY3VycmVudCBwb3NpdGlvbiBpdHNlbGYgaW4gb3JkZXIgdG8gbm90IGFmZmVjdCBvdGhlclxuICAgIC8vIGZvcmNlIGNhbGN1bGF0aW9uc1xuICAgIGJvZHkubmV4dFggKz0gZGVsdGFUICogYm9keS52ZWxYO1xuICAgIGJvZHkubmV4dFkgKz0gZGVsdGFUICogYm9keS52ZWxZO1xufVxuXG4vKiogQ2FsY3VsYXRlIHRoZSBmb3JjZSBleGVydGVkIGJldHdlZW4gYSBib2R5IGFuZCBhbiBhdHRyYWN0b3IgYmFzZWQgb24gZ3Jhdml0eS4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZUZvcmNlKGJvZHksIGF0dHJhY3RvciwgRykge1xuICAgIC8vIENhbGN1bGF0ZSB0aGUgY2hhbmdlIGluIHBvc2l0aW9uIGFsb25nIHRoZSB0d28gZGltZW5zaW9uc1xuICAgIGNvbnN0IGR4ID0gYXR0cmFjdG9yLnggLSBib2R5Lng7XG4gICAgY29uc3QgZHkgPSBhdHRyYWN0b3IueSAtIGJvZHkueTtcblxuICAgIC8vIE9idGFpbiB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgb2JqZWN0cyAoaHlwb3RlbnVzZSlcbiAgICBjb25zdCByID0gTWF0aC5zcXJ0KE1hdGgucG93KGR4LCAyKSArIE1hdGgucG93KGR5LCAyKSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZm9yY2UgdXNpbmcgTmV3dG9uaWFuIGdyYXZpdHksIHNlcGFyYXRlIG91dCBpbnRvIHggYW5kIHkgY29tcG9uZW50c1xuICAgIGNvbnN0IEYgPSAoRyAqIGJvZHkubWFzcyAqIGF0dHJhY3Rvci5tYXNzKSAvIE1hdGgucG93KHIsIDIpO1xuICAgIGNvbnN0IEZ4ID0gRiAqIChkeCAvIHIpO1xuICAgIGNvbnN0IEZ5ID0gRiAqIChkeSAvIHIpO1xuICAgIHJldHVybiBbRngsIEZ5XTtcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCB0d28gYm9kaWVzIGFyZSBjb2xsaWRpbmcuICovXG5mdW5jdGlvbiBhcmVDb2xsaWRpbmcoYm9keSwgY29sbGlkZXIsIHRoZXRhID0gMC4zKSB7XG4gICAgY29uc3QgZGlzdCA9IGJvZHkucmFkaXVzICsgY29sbGlkZXIucmFkaXVzO1xuICAgIGNvbnN0IGR4ID0gYm9keS54IC0gY29sbGlkZXIueDtcbiAgICBjb25zdCBkeSA9IGJvZHkueSAtIGNvbGxpZGVyLnk7XG4gICAgcmV0dXJuIChkaXN0ICogZGlzdCkgKiB0aGV0YSA+IChkeCAqIGR4KSArIChkeSAqIGR5KTtcbn1cblxuY2xhc3MgR3RCcnV0ZUZvcmNlU2ltIHtcbiAgICAvKiogRyByZXByZXNlbnRzIHRoZSBncmF2aXRhdGlvbmFsIGNvbnN0YW50LiAqL1xuICAgIGNvbnN0cnVjdG9yKEcpIHtcbiAgICAgICAgdGhpcy5HID0gRztcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24gb2YgYSBib2R5IGJhc2VkIG9uIGJydXRlIGZvcmNlIG1lY2hhbmljcy4gKi9cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBhdHRyYWN0b3JzLCB1bnVzZWRUcmVlUm9vdCwgZGVsdGFUKSB7XG4gICAgICAgIGxldCBuZXRGeCA9IDA7XG4gICAgICAgIGxldCBuZXRGeSA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBib2RpZXMgYW5kIHN1bSB0aGUgZm9yY2VzIGV4ZXJ0ZWRcbiAgICAgICAgZm9yIChjb25zdCBhdHRyYWN0b3Igb2YgYXR0cmFjdG9ycykge1xuICAgICAgICAgICAgaWYgKGJvZHkgIT09IGF0dHJhY3Rvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IFtGeCwgRnldID0gY2FsY3VsYXRlRm9yY2UoYm9keSwgYXR0cmFjdG9yLCB0aGlzLkcpO1xuICAgICAgICAgICAgICAgIG5ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgICAgIG5ldEZ5ICs9IEZ5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhlcnRGb3JjZShib2R5LCBuZXRGeCwgbmV0RnksIGRlbHRhVCk7XG4gICAgfVxufVxuXG5jbGFzcyBHdEJhcm5lc0h1dFNpbSB7XG4gICAgLyoqIEcgcmVwcmVzZW50cyB0aGUgZ3Jhdml0YXRpb25hbCBjb25zdGFudC4gKi9cbiAgICBjb25zdHJ1Y3RvcihHLCB0aGV0YSkge1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRoZXRhID0gdGhldGE7XG4gICAgICAgIHRoaXMuX25ldEZ4ID0gMDtcbiAgICAgICAgdGhpcy5fbmV0RnkgPSAwO1xuICAgIH1cblxuICAgIC8qKiBDYWxjdWxhdGUgdGhlIG5ldyBwb3NpdGlvbiBvZiBhIGJvZHkgYmFzZWQgb24gYnJ1dGUgZm9yY2UgbWVjaGFuaWNzLiAqL1xuICAgIGNhbGN1bGF0ZU5ld1Bvc2l0aW9uKGJvZHksIGF0dHJhY3RvcnMsIHRyZWVSb290LCBkZWx0YVQpIHtcbiAgICAgICAgdGhpcy5fbmV0RnggPSAwO1xuICAgICAgICB0aGlzLl9uZXRGeSA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBib2RpZXMgaW4gdGhlIHRyZWUgYW5kIHN1bSB0aGUgZm9yY2VzIGV4ZXJ0ZWRcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVGb3JjZUZyb21UcmVlKGJvZHksIHRyZWVSb290KTtcbiAgICAgICAgZXhlcnRGb3JjZShib2R5LCB0aGlzLl9uZXRGeCwgdGhpcy5fbmV0RnksIGRlbHRhVCk7XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlRm9yY2VGcm9tVHJlZShib2R5LCB0cmVlTm9kZSkge1xuICAgICAgICAvLyBIYW5kbGUgZW1wdHkgbm9kZXNcbiAgICAgICAgaWYgKCF0cmVlTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgLy8gVGhlIG5vZGUgaXMgZXh0ZXJuYWwgKGl0J3MgYW4gYWN0dWFsIGJvZHkpXG4gICAgICAgICAgICBpZiAoYm9keSAhPT0gdHJlZU5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbRngsIEZ5XSA9IGNhbGN1bGF0ZUZvcmNlKGJvZHksIHRyZWVOb2RlLCB0aGlzLkcpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgICAgIHRoaXMuX25ldEZ5ICs9IEZ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIG5vZGUgaXMgaW50ZXJuYWxcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGVmZmVjdGl2ZSBxdWFkcmFudCBzaXplIGFuZCBkaXN0YW5jZSBmcm9tIGNlbnRlci1vZi1tYXNzXG4gICAgICAgIGNvbnN0IHMgPSAodHJlZU5vZGUud2lkdGggKyB0cmVlTm9kZS5oZWlnaHQpIC8gMjtcblxuICAgICAgICBjb25zdCBkeCA9IHRyZWVOb2RlLnggLSBib2R5Lng7XG4gICAgICAgIGNvbnN0IGR5ID0gdHJlZU5vZGUueSAtIGJvZHkueTtcbiAgICAgICAgY29uc3QgZCA9IE1hdGguc3FydChNYXRoLnBvdyhkeCwgMikgKyBNYXRoLnBvdyhkeSwgMikpO1xuXG4gICAgICAgIGlmIChzIC8gZCA8IHRoaXMudGhldGEpIHtcbiAgICAgICAgICAgIC8vIE5vZGUgaXMgc3VmZmljaWVudGx5IGZhciBhd2F5XG4gICAgICAgICAgICBjb25zdCBbRngsIEZ5XSA9IGNhbGN1bGF0ZUZvcmNlKGJvZHksIHRyZWVOb2RlLCB0aGlzLkcpO1xuICAgICAgICAgICAgdGhpcy5fbmV0RnggKz0gRng7XG4gICAgICAgICAgICB0aGlzLl9uZXRGeSArPSBGeTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE5vZGUgaXMgY2xvc2U7IHJlY3Vyc2VcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGROb2RlIG9mIHRyZWVOb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVGb3JjZUZyb21UcmVlKGJvZHksIGNoaWxkTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0U2ltIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMudXNlQnJ1dGVGb3JjZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1lcmdlQ29sbGlzaW9ucyA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5HID0gYXJncy5HIHx8IDYuNjczODQgKiBNYXRoLnBvdygxMCwgLTExKTsgLy8gR3Jhdml0YXRpb25hbCBjb25zdGFudFxuICAgICAgICB0aGlzLm11bHRpcGxpZXIgPSBhcmdzLm11bHRpcGxpZXIgfHwgMTUwMDsgLy8gVGltZXN0ZXBcbiAgICAgICAgdGhpcy5zY2F0dGVyTGltaXRXaWR0aCA9IGFyZ3Muc2NhdHRlckxpbWl0V2lkdGggfHwgYXJncy53aWR0aCAqIDI7XG4gICAgICAgIHRoaXMuc2NhdHRlckxpbWl0SGVpZ2h0ID0gYXJncy5zY2F0dGVyTGltaXRIZWlnaHQgfHwgYXJncy5oZWlnaHQgKiAyO1xuICAgICAgICB0aGlzLnNjYXR0ZXJMaW1pdFN0YXJ0WCA9IChhcmdzLndpZHRoIC0gdGhpcy5zY2F0dGVyTGltaXRXaWR0aCkgLyAyO1xuICAgICAgICB0aGlzLnNjYXR0ZXJMaW1pdFN0YXJ0WSA9IChhcmdzLmhlaWdodCAtIHRoaXMuc2NhdHRlckxpbWl0SGVpZ2h0KSAvIDI7XG4gICAgICAgIHRoaXMuc2NhdHRlckxpbWl0RW5kWCA9IHRoaXMuc2NhdHRlckxpbWl0U3RhcnRYICsgdGhpcy5zY2F0dGVyTGltaXRXaWR0aDtcbiAgICAgICAgdGhpcy5zY2F0dGVyTGltaXRFbmRZID0gdGhpcy5zY2F0dGVyTGltaXRTdGFydFkgKyB0aGlzLnNjYXR0ZXJMaW1pdEhlaWdodDtcblxuICAgICAgICB0aGlzLmJvZGllcyA9IFtdO1xuICAgICAgICAvLyBJbmNvcnBvcmF0ZSB0aGUgc2NhdHRlciBsaW1pdFxuICAgICAgICB0aGlzLnRyZWUgPSBuZXcgR3RUcmVlKFxuICAgICAgICAgICAgICAgIC8qIHdpZHRoICovIHRoaXMuc2NhdHRlckxpbWl0V2lkdGgsXG4gICAgICAgICAgICAgICAgLyogaGVpZ2h0ICovIHRoaXMuc2NhdHRlckxpbWl0SGVpZ2h0LFxuICAgICAgICAgICAgICAgIC8qIHN0YXJ0WCAqLyB0aGlzLnNjYXR0ZXJMaW1pdFN0YXJ0WCxcbiAgICAgICAgICAgICAgICAvKiBzdGFydFkgKi8gdGhpcy5zY2F0dGVyTGltaXRTdGFydFkpO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuXG4gICAgICAgIHRoaXMuYnJ1dGVGb3JjZVNpbSA9IG5ldyBHdEJydXRlRm9yY2VTaW0odGhpcy5HKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRTaW0gPSBuZXcgR3RCYXJuZXNIdXRTaW0odGhpcy5HLCAvKiB0aGV0YSAqLyAwLjUpO1xuICAgICAgICB0aGlzLmFjdGl2ZVNpbSA9IHRoaXMudXNlQnJ1dGVGb3JjZSA/IHRoaXMuYnJ1dGVGb3JjZVNpbSA6IHRoaXMuYmFybmVzSHV0U2ltO1xuICAgIH1cblxuICAgIHRvZ2dsZVN0cmF0ZWd5KCkge1xuICAgICAgICB0aGlzLnVzZUJydXRlRm9yY2UgPSAhdGhpcy51c2VCcnV0ZUZvcmNlO1xuICAgICAgICB0aGlzLmFjdGl2ZVNpbSA9IHRoaXMudXNlQnJ1dGVGb3JjZSA/IHRoaXMuYnJ1dGVGb3JjZVNpbSA6IHRoaXMuYmFybmVzSHV0U2ltO1xuICAgIH1cblxuICAgIC8qKiBDYWxjdWxhdGUgYSBzdGVwIG9mIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIHN0ZXAoZWxhcHNlZCkge1xuICAgICAgICBpZiAodGhpcy5tZXJnZUNvbGxpc2lvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuX21lcmdlQ29sbGlkZWQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZW1vdmVTY2F0dGVyZWQoKTtcblxuICAgICAgICBpZiAoIXRoaXMudXNlQnJ1dGVGb3JjZSkge1xuICAgICAgICAgICAgdGhpcy5fcmVzZXRUcmVlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgdGhpcy5ib2RpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2ltLmNhbGN1bGF0ZU5ld1Bvc2l0aW9uKFxuICAgICAgICAgICAgICAgICAgICBib2R5LCB0aGlzLmJvZGllcywgdGhpcy50cmVlLnJvb3QsIGVsYXBzZWQgKiB0aGlzLm11bHRpcGxpZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29tbWl0UG9zaXRpb25VcGRhdGVzKCk7XG4gICAgICAgIHRoaXMudGltZSArPSBlbGFwc2VkOyAvLyBJbmNyZW1lbnQgcnVudGltZVxuICAgIH1cblxuICAgIC8qKiBVcGRhdGUgcG9zaXRpb25zIG9mIGFsbCBib2RpZXMgdG8gYmUgdGhlIG5leHQgY2FsY3VsYXRlZCBwb3NpdGlvbi4gKi9cbiAgICBfY29tbWl0UG9zaXRpb25VcGRhdGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgdGhpcy5ib2RpZXMpIHtcbiAgICAgICAgICAgIGJvZHkueCA9IGJvZHkubmV4dFg7XG4gICAgICAgICAgICBib2R5LnkgPSBib2R5Lm5leHRZO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFNjYW4gdGhyb3VnaCB0aGUgbGlzdCBvZiBib2RpZXMgYW5kIHJlbW92ZSBhbnkgdGhhdCBoYXZlIGZhbGxlbiBvdXQgb2YgdGhlIHNjYXR0ZXIgbGltaXQuICovXG4gICAgX3JlbW92ZVNjYXR0ZXJlZCgpIHtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYm9kaWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuXG4gICAgICAgICAgICBpZiAoYm9keS54ID49IHRoaXMuc2NhdHRlckxpbWl0RW5kWCB8fFxuICAgICAgICAgICAgICAgIGJvZHkueCA8PSB0aGlzLnNjYXR0ZXJMaW1pdFN0YXJ0WCB8fFxuICAgICAgICAgICAgICAgIGJvZHkueSA+PSB0aGlzLnNjYXR0ZXJMaW1pdEVuZFkgfHxcbiAgICAgICAgICAgICAgICBib2R5LnkgPD0gdGhpcy5zY2F0dGVyTGltaXRTdGFydFkpIHtcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZnJvbSBib2R5IGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIHJlc2V0IHRoZSB0cmVlIGhlcmUgYmVjYXVzZSB0aGlzIGlzIGEgcnVudGltZSAobm90IHVzZXItYmFzZWQpXG4gICAgICAgICAgICAgICAgLy8gb3BlcmF0aW9uLCBhbmQgdGhlIHRyZWUgaXMgcmVzZXQgYXV0b21hdGljYWxseSBvbiBldmVyeSBzdGVwIG9mIHRoZSBzaW11bGF0aW9uLlxuICAgICAgICAgICAgICAgIHRoaXMuYm9kaWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX21lcmdlQ29sbGlkZWQoKSB7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJvZGllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpZGluZ0luZGljZXMgPSBbXTtcbiAgICAgICAgICAgIC8vIENvbGxlY3QgY29sbGlkaW5nIGVsZW1lbnRzOyBvbmx5IG5lZWQgdG8gY2hlY2sgZWFjaCBwYWlyIG9uY2VcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZUNvbGxpZGluZyh0aGlzLmJvZGllc1tpXSwgdGhpcy5ib2RpZXNbal0pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCwgaW4gb3JkZXIgb2YgaGlnaGVzdCBpbmRleCBmaXJzdFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRpbmdJbmRpY2VzLnVuc2hpZnQoaik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY29sbGlkaW5nSW5kaWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBJbmNsdWRlIHRoZSBcInNvdXJjZVwiIGVsZW1lbnQgaW4gdGhlIGNvbGxpc2lvbiBzZXRcbiAgICAgICAgICAgICAgICBjb2xsaWRpbmdJbmRpY2VzLnB1c2goaSk7XG5cbiAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGVsZW1lbnRzIGFuZCBtZXJnZVxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbGxpZGluZyA9IGNvbGxpZGluZ0luZGljZXMubWFwKGlkeCA9PiB0aGlzLmJvZGllcy5zcGxpY2UoaWR4LCAxKVswXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWVyZ2VCb2RpZXMoY29sbGlkaW5nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIE1lcmdlIGFuZCByZXR1cm4gdGhlIGFyZ3MgZm9yIGEgbmV3IGJvZHkgYmFzZWQgb24gYSBzZXQgb2Ygb2xkIGJvZGllcy4gKi9cbiAgICBfbWVyZ2VCb2RpZXMoYm9kaWVzKSB7XG4gICAgICAgIGNvbnN0IG5ld0JvZHlBcmdzID0geyB4OiAwLCB5OiAwLCB2ZWxYOiAwLCB2ZWxZOiAwLCBtYXNzOiAwLCBjb2xvcjogYm9kaWVzWzBdLmNvbG9yIH07XG4gICAgICAgIGxldCBsYXJnZXN0TWFzcyA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgYm9keSBvZiBib2RpZXMpIHtcbiAgICAgICAgICAgIGlmIChib2R5Lm1hc3MgPiBsYXJnZXN0TWFzcykge1xuICAgICAgICAgICAgICAgIG5ld0JvZHlBcmdzLnggPSBib2R5Lng7XG4gICAgICAgICAgICAgICAgbmV3Qm9keUFyZ3MueSA9IGJvZHkueTtcbiAgICAgICAgICAgICAgICBsYXJnZXN0TWFzcyA9IGJvZHkubWFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld0JvZHlBcmdzLnZlbFggKz0gYm9keS52ZWxYO1xuICAgICAgICAgICAgbmV3Qm9keUFyZ3MudmVsWSArPSBib2R5LnZlbFk7XG4gICAgICAgICAgICBuZXdCb2R5QXJncy5tYXNzICs9IGJvZHkubWFzcztcbiAgICAgICAgICAgIG5ld0JvZHlBcmdzLmNvbG9yID0gY29sb3JzLmJsZW5kKG5ld0JvZHlBcmdzLmNvbG9yLCBib2R5LmNvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmFkZE5ld0JvZHkobmV3Qm9keUFyZ3MpO1xuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgYW5kIHJldHVybiBhIG5ldyBib2R5IHRvIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIGFkZE5ld0JvZHkoYXJncykge1xuICAgICAgICBsZXQgYm9keSA9IG5ldyBHdEJvZHkoYXJncyk7XG4gICAgICAgIHRoaXMuYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICAgIHRoaXMuX3Jlc2V0VHJlZSgpO1xuICAgICAgICByZXR1cm4gYm9keTtcbiAgICB9XG5cbiAgICAvKiogUmVtb3ZpbmcgYSB0YXJnZXQgYm9keSBmcm9tIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIHJlbW92ZUJvZHkodGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoYm9keSA9PT0gdGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9kaWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNldFRyZWUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBMb29rdXAgYW4gKHgsIHkpIGNvb3JkaW5hdGUgYW5kIHJldHVybiB0aGUgYm9keSB0aGF0IGlzIGF0IHRoYXQgcG9zaXRpb24uICovXG4gICAgZ2V0Qm9keUF0KHgsIHkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuYm9kaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBjb25zdCBpc01hdGNoID0gTWF0aC5hYnMoeCAtIGJvZHkueCkgPD0gYm9keS5yYWRpdXMgJiZcbiAgICAgICAgICAgICAgICBNYXRoLmFicyh5IC0gYm9keS55KSA8PSBib2R5LnJhZGl1cztcbiAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKiogQ2xlYXIgdGhlIHNpbXVsYXRpb24uICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuYm9kaWVzLmxlbmd0aCA9IDA7IC8vIFJlbW92ZSBhbGwgYm9kaWVzIGZyb20gY29sbGVjdGlvblxuICAgICAgICB0aGlzLl9yZXNldFRyZWUoKTtcbiAgICB9XG5cbiAgICAvKiogQ2xlYXIgYW5kIHJlc2V0IHRoZSBxdWFkdHJlZSwgYWRkaW5nIGFsbCBleGlzdGluZyBib2RpZXMgYmFjay4gKi9cbiAgICBfcmVzZXRUcmVlKCkge1xuICAgICAgICB0aGlzLnRyZWUuY2xlYXIoKTtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkQm9keShib2R5KTtcbiAgICAgICAgfVxuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3NpbVxuIiwiLyoqXG4gKiBncmF2aXRvbi90aW1lciAtLSBTaW0gdGltZXIgYW5kIEZQUyBsaW1pdGVyXG4gKi9cbmltcG9ydCBlbnYgZnJvbSAnLi4vdXRpbC9lbnYnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRpbWVyIHtcbiAgICBjb25zdHJ1Y3RvcihmbiwgZnBzPW51bGwpIHtcbiAgICAgICAgdGhpcy5fZm4gPSBmbjtcbiAgICAgICAgdGhpcy5fZnBzID0gZnBzO1xuICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc0FuaW1hdGlvbiA9IGZwcyA9PT0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3dpbmRvdyA9IGVudi5nZXRXaW5kb3coKTtcbiAgICB9XG5cbiAgICBnZXQgYWN0aXZlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNBY3RpdmU7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luQW5pbWF0aW9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luSW50ZXJ2YWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5fY2FuY2VsbGF0aW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9iZWdpbkFuaW1hdGlvbigpIHtcbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGxldCBhbmltYXRvciA9ICh0aW1lc3RhbXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRGVsYXkgaW5pdGlhbCBleGVjdXRpb24gdW50aWwgdGhlIG5leHQgdGljay5cbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICB9XG5cbiAgICBfYmVnaW5JbnRlcnZhbCgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgZGVsYXkgcGVyIHRpY2ssIGluIG1pbGxpc2Vjb25kcy5cbiAgICAgICAgbGV0IHRpbWVvdXQgPSAxMDAwIC8gdGhpcy5fZnBzIHwgMDtcblxuICAgICAgICBsZXQgbGFzdFRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgICAgIHRoaXMuX2ZuKHRpbWVzdGFtcCAtIGxhc3RUaW1lc3RhbXApO1xuICAgICAgICAgICAgbGFzdFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3RpbWVyXG4iLCIvKipcbiAqIGdyYXZpdG9uL3RyZWUgLS0gVGhlIGdyYXZpdGF0aW9uYWwgYm9keSB0cmVlIHN0cnVjdHVyZVxuICovXG5cbmNvbnN0IE1BWF9ERVBUSCA9IDEwMDA7XG5cbmNsYXNzIEd0VHJlZU5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHN0YXJ0WCwgc3RhcnRZKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgICAgICB0aGlzLnN0YXJ0WSA9IHN0YXJ0WTtcblxuICAgICAgICAvLyBDb252ZW5pZW5jZSBjZW50ZXIgcG9pbnRzLlxuICAgICAgICB0aGlzLmhhbGZXaWR0aCA9IHdpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5oYWxmSGVpZ2h0ID0gaGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5taWRYID0gdGhpcy5zdGFydFggKyB0aGlzLmhhbGZXaWR0aDtcbiAgICAgICAgdGhpcy5taWRZID0gdGhpcy5zdGFydFkgKyB0aGlzLmhhbGZIZWlnaHQ7XG5cbiAgICAgICAgLy8gTWF0Y2hlcyBHdEJvZHkncyBwcm9wZXJ0aWVzLlxuICAgICAgICB0aGlzLm1hc3MgPSAwO1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuXG4gICAgICAgIC8vIFtOVywgTkUsIFNXLCBTRV1cbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IG5ldyBBcnJheSg0KTtcbiAgICB9XG5cbiAgICAvKiogQWRkIGEgYm9keSB0byB0aGUgdHJlZSwgdXBkYXRpbmcgbWFzcyBhbmQgY2VudGVycG9pbnQuICovXG4gICAgYWRkQm9keShib2R5LCBkZXB0aCA9IDEpIHtcbiAgICAgICAgaWYgKGRlcHRoID4gTUFYX0RFUFRIKSB7XG4gICAgICAgICAgICAvLyBTb21ldGhpbmcncyBnb25lIHdyb25nLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwZGF0ZU1hc3MoYm9keSk7XG4gICAgICAgIGNvbnN0IHF1YWRyYW50ID0gdGhpcy5fZ2V0UXVhZHJhbnQoYm9keS54LCBib2R5LnkpO1xuXG4gICAgICAgIGlmICh0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSBpbnN0YW5jZW9mIEd0VHJlZU5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdLmFkZEJvZHkoYm9keSwgZGVwdGggKyAxKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5jaGlsZHJlbltxdWFkcmFudF0pIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5jaGlsZHJlbltxdWFkcmFudF07XG4gICAgICAgICAgICBjb25zdCBxdWFkWCA9IGV4aXN0aW5nLnggPiB0aGlzLm1pZFggPyB0aGlzLm1pZFggOiB0aGlzLnN0YXJ0WDtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRZID0gZXhpc3RpbmcueSA+IHRoaXMubWlkWSA/IHRoaXMubWlkWSA6IHRoaXMuc3RhcnRZO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBHdFRyZWVOb2RlKHRoaXMuaGFsZldpZHRoLCB0aGlzLmhhbGZIZWlnaHQsIHF1YWRYLCBxdWFkWSk7XG5cbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShleGlzdGluZywgZGVwdGggKyAxKTtcbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShib2R5LCBkZXB0aCArIDEpO1xuXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogVXBkYXRlIHRoZSBjZW50ZXIgb2YgbWFzcyBiYXNlZCBvbiB0aGUgYWRkaXRpb24gb2YgYSBuZXcgYm9keS4gKi9cbiAgICBfdXBkYXRlTWFzcyhib2R5KSB7XG4gICAgICAgIGNvbnN0IG5ld01hc3MgPSB0aGlzLm1hc3MgKyBib2R5Lm1hc3M7XG4gICAgICAgIGNvbnN0IG5ld1ggPSAodGhpcy54ICogdGhpcy5tYXNzICsgYm9keS54ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIGNvbnN0IG5ld1kgPSAodGhpcy55ICogdGhpcy5tYXNzICsgYm9keS55ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIHRoaXMubWFzcyA9IG5ld01hc3M7XG4gICAgICAgIHRoaXMueCA9IG5ld1g7XG4gICAgICAgIHRoaXMueSA9IG5ld1k7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgcXVhZHJhbnQgaW5kZXggZm9yIGEgZ2l2ZW4gKHgsIHkpIHBhaXIuIEFzc3VtZXMgdGhhdCBpdCBsaWVzIHdpdGhpbiBib3VuZHMuICovXG4gICAgX2dldFF1YWRyYW50KHgsIHkpIHtcbiAgICAgICAgY29uc3QgeEluZGV4ID0gTnVtYmVyKHggPiB0aGlzLm1pZFgpO1xuICAgICAgICBjb25zdCB5SW5kZXggPSBOdW1iZXIoeSA+IHRoaXMubWlkWSkgKiAyO1xuICAgICAgICByZXR1cm4geEluZGV4ICsgeUluZGV4O1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RUcmVlIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBzdGFydFggPSAwLCBzdGFydFkgPSAwKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgICAgICB0aGlzLnN0YXJ0WSA9IHN0YXJ0WTtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgR3RUcmVlTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMucm9vdCkge1xuICAgICAgICAgICAgdGhpcy5yb290ID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yb290O1xuICAgICAgICAgICAgdGhpcy5yb290ID0gbmV3IEd0VHJlZU5vZGUodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuc3RhcnRYLCB0aGlzLnN0YXJ0WSk7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShleGlzdGluZyk7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShib2R5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJvb3QgPSB1bmRlZmluZWQ7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vdHJlZVxuIiwiaW1wb3J0ICcuL3ZlbmRvci9qc2NvbG9yJztcbmltcG9ydCB2ZXggZnJvbSAnLi92ZW5kb3IvdmV4JztcbmltcG9ydCAnLi9wb2x5ZmlsbHMnO1xuaW1wb3J0IGd0IGZyb20gJy4vZ3Jhdml0b24nO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU2V0IG9wdGlvbnMgZm9yIGRlcGVuZGVuY2llcy5cbiAgICB2ZXguZGVmYXVsdE9wdGlvbnMuY2xhc3NOYW1lID0gJ3ZleC10aGVtZS13aXJlZnJhbWUnO1xuXG4gICAgLy8gU3RhcnQgdGhlIG1haW4gZ3Jhdml0b24gYXBwLlxuICAgIHdpbmRvdy5ncmF2aXRvbiA9IG5ldyBndC5hcHAoKTtcbn07XG4iLCJ3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuICAgIH07XG5cbndpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uKHRpbWVvdXRJZCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfTtcblxud2luZG93LnBlcmZvcm1hbmNlID0gd2luZG93LnBlcmZvcm1hbmNlIHx8IHt9O1xud2luZG93LnBlcmZvcm1hbmNlLm5vdyA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgfHxcbiAgICB3aW5kb3cucGVyZm9ybWFuY2Uud2Via2l0Tm93IHx8XG4gICAgd2luZG93LnBlcmZvcm1hbmNlLm1vek5vdyB8fFxuICAgIERhdGUubm93O1xuIiwiLyoqXG4gKiBjb2xvcnMgLS0gQ29sb3IgbWFuaXB1bGF0aW9uIGhlbHBlcnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIGJyaWdodGVuKGNvbG9yQXJyYXksIHBlcmNlbnQpIHtcbiAgICAgICAgbGV0IFtyLCBnLCBiXSA9IGNvbG9yQXJyYXk7XG4gICAgICAgIHIgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIHIgKyAociAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIGcgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIGcgKyAoZyAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIGIgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIGIgKyAoYiAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIHJldHVybiBbciwgZywgYl07XG4gICAgfSxcblxuICAgIGZyb21IZXgoaGV4KSB7XG4gICAgICAgIGxldCBoID0gaGV4LnJlcGxhY2UoJyMnLCAnJyk7XG4gICAgICAgIGlmIChoLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgICAgIGggPSBoLnJlcGxhY2UoLyguKS9nLCAnJDEkMScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbcGFyc2VJbnQoaC5zdWJzdHIoMCwgMiksIDE2KSxcbiAgICAgICAgICAgICAgICBwYXJzZUludChoLnN1YnN0cigyLCAyKSwgMTYpLFxuICAgICAgICAgICAgICAgIHBhcnNlSW50KGguc3Vic3RyKDQsIDIpLCAxNildO1xuICAgIH0sXG5cbiAgICB0b0hleChjb2xvckFycmF5KSB7XG4gICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGNvbG9yQXJyYXk7XG4gICAgICAgIHJldHVybiAnIycgKyAoJzAnICsgci50b1N0cmluZygxNikpLnN1YnN0cihyIDwgMTYgPyAwIDogMSkgK1xuICAgICAgICAgICAgICAgICAgICAgKCcwJyArIGcudG9TdHJpbmcoMTYpKS5zdWJzdHIoZyA8IDE2ID8gMCA6IDEpICtcbiAgICAgICAgICAgICAgICAgICAgICgnMCcgKyBiLnRvU3RyaW5nKDE2KSkuc3Vic3RyKGIgPCAxNiA/IDAgOiAxKTtcbiAgICB9LFxuXG4gICAgYmxlbmQoY29sb3IxLCBjb2xvcjIsIHBlcmNlbnRhZ2UgPSAwLjUpIHtcbiAgICAgICAgbGV0IHBhcnNlZENvbG9yMSA9IHRoaXMuZnJvbUhleChjb2xvcjEpO1xuICAgICAgICBsZXQgcGFyc2VkQ29sb3IyID0gdGhpcy5mcm9tSGV4KGNvbG9yMik7XG5cbiAgICAgICAgbGV0IGJsZW5kZWRDb2xvciA9IFtcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoMSAtIHBlcmNlbnRhZ2UpICogcGFyc2VkQ29sb3IxWzBdICsgcGVyY2VudGFnZSAqIHBhcnNlZENvbG9yMlswXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAyNTUpKSxcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoMSAtIHBlcmNlbnRhZ2UpICogcGFyc2VkQ29sb3IxWzFdICsgcGVyY2VudGFnZSAqIHBhcnNlZENvbG9yMlsxXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAyNTUpKSxcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoMSAtIHBlcmNlbnRhZ2UpICogcGFyc2VkQ29sb3IxWzJdICsgcGVyY2VudGFnZSAqIHBhcnNlZENvbG9yMlsyXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAyNTUpKVxuICAgICAgICBdO1xuICAgICAgICByZXR1cm4gdGhpcy50b0hleChibGVuZGVkQ29sb3IpO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGVudiAtIEVudmlyb25tZW50IHJldHJpZXZhbCBtZXRob2RzLlxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZ2V0V2luZG93KCkge1xuICAgICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cbn07XG4iLCIvKipcbiAqIHJhbmRvbSAtLSBBIGNvbGxlY3Rpb24gb2YgcmFuZG9tIGdlbmVyYXRvciBmdW5jdGlvbnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIHRoZSBnaXZlbiBzdGFydCBhbmQgZW5kIHBvaW50c1xuICAgICAqL1xuICAgIG51bWJlcihmcm9tLCB0bz1udWxsKSB7XG4gICAgICAgIGlmICh0byA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdG8gPSBmcm9tO1xuICAgICAgICAgICAgZnJvbSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqICh0byAtIGZyb20pICsgZnJvbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIHRoZSBnaXZlbiBwb3NpdGlvbnNcbiAgICAgKi9cbiAgICBpbnRlZ2VyKC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy5udW1iZXIoLi4uYXJncykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIsIHdpdGggYSByYW5kb20gc2lnbiwgYmV0d2VlbiB0aGUgZ2l2ZW5cbiAgICAgKiBwb3NpdGlvbnNcbiAgICAgKi9cbiAgICBkaXJlY3Rpb25hbCguLi5hcmdzKSB7XG4gICAgICAgIGxldCByYW5kID0gdGhpcy5udW1iZXIoLi4uYXJncyk7XG4gICAgICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC41KSB7XG4gICAgICAgICAgICByYW5kID0gLXJhbmQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhbmQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGhleGFkZWNpbWFsIGNvbG9yXG4gICAgICovXG4gICAgY29sb3IoKSB7XG4gICAgICAgIHJldHVybiAnIycgKyAoJzAwMDAwJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMCkudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTYpO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGpzY29sb3IgLSBKYXZhU2NyaXB0IENvbG9yIFBpY2tlclxuICpcbiAqIEBsaW5rICAgIGh0dHA6Ly9qc2NvbG9yLmNvbVxuICogQGxpY2Vuc2UgRm9yIG9wZW4gc291cmNlIHVzZTogR1BMdjNcbiAqICAgICAgICAgIEZvciBjb21tZXJjaWFsIHVzZTogSlNDb2xvciBDb21tZXJjaWFsIExpY2Vuc2VcbiAqIEBhdXRob3IgIEphbiBPZHZhcmtvXG4gKiBAdmVyc2lvbiAyLjAuNFxuICpcbiAqIFNlZSB1c2FnZSBleGFtcGxlcyBhdCBodHRwOi8vanNjb2xvci5jb20vZXhhbXBsZXMvXG4gKi9cblxuXG5cInVzZSBzdHJpY3RcIjtcblxuXG5pZiAoIXdpbmRvdy5qc2NvbG9yKSB7IHdpbmRvdy5qc2NvbG9yID0gKGZ1bmN0aW9uICgpIHtcblxuXG52YXIganNjID0ge1xuXG5cblx0cmVnaXN0ZXIgOiBmdW5jdGlvbiAoKSB7XG5cdFx0anNjLmF0dGFjaERPTVJlYWR5RXZlbnQoanNjLmluaXQpO1xuXHRcdGpzYy5hdHRhY2hFdmVudChkb2N1bWVudCwgJ21vdXNlZG93bicsIGpzYy5vbkRvY3VtZW50TW91c2VEb3duKTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZG9jdW1lbnQsICd0b3VjaHN0YXJ0JywganNjLm9uRG9jdW1lbnRUb3VjaFN0YXJ0KTtcblx0XHRqc2MuYXR0YWNoRXZlbnQod2luZG93LCAncmVzaXplJywganNjLm9uV2luZG93UmVzaXplKTtcblx0fSxcblxuXG5cdGluaXQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKGpzYy5qc2NvbG9yLmxvb2t1cENsYXNzKSB7XG5cdFx0XHRqc2MuanNjb2xvci5pbnN0YWxsQnlDbGFzc05hbWUoanNjLmpzY29sb3IubG9va3VwQ2xhc3MpO1xuXHRcdH1cblx0fSxcblxuXG5cdHRyeUluc3RhbGxPbkVsZW1lbnRzIDogZnVuY3Rpb24gKGVsbXMsIGNsYXNzTmFtZSkge1xuXHRcdHZhciBtYXRjaENsYXNzID0gbmV3IFJlZ0V4cCgnKF58XFxcXHMpKCcgKyBjbGFzc05hbWUgKyAnKShcXFxccyooXFxcXHtbXn1dKlxcXFx9KXxcXFxcc3wkKScsICdpJyk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGVsbXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGlmIChlbG1zW2ldLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBlbG1zW2ldLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnY29sb3InKSB7XG5cdFx0XHRcdGlmIChqc2MuaXNDb2xvckF0dHJTdXBwb3J0ZWQpIHtcblx0XHRcdFx0XHQvLyBza2lwIGlucHV0cyBvZiB0eXBlICdjb2xvcicgaWYgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHZhciBtO1xuXHRcdFx0aWYgKCFlbG1zW2ldLmpzY29sb3IgJiYgZWxtc1tpXS5jbGFzc05hbWUgJiYgKG0gPSBlbG1zW2ldLmNsYXNzTmFtZS5tYXRjaChtYXRjaENsYXNzKSkpIHtcblx0XHRcdFx0dmFyIHRhcmdldEVsbSA9IGVsbXNbaV07XG5cdFx0XHRcdHZhciBvcHRzU3RyID0gbnVsbDtcblxuXHRcdFx0XHR2YXIgZGF0YU9wdGlvbnMgPSBqc2MuZ2V0RGF0YUF0dHIodGFyZ2V0RWxtLCAnanNjb2xvcicpO1xuXHRcdFx0XHRpZiAoZGF0YU9wdGlvbnMgIT09IG51bGwpIHtcblx0XHRcdFx0XHRvcHRzU3RyID0gZGF0YU9wdGlvbnM7XG5cdFx0XHRcdH0gZWxzZSBpZiAobVs0XSkge1xuXHRcdFx0XHRcdG9wdHNTdHIgPSBtWzRdO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIG9wdHMgPSB7fTtcblx0XHRcdFx0aWYgKG9wdHNTdHIpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0b3B0cyA9IChuZXcgRnVuY3Rpb24gKCdyZXR1cm4gKCcgKyBvcHRzU3RyICsgJyknKSkoKTtcblx0XHRcdFx0XHR9IGNhdGNoKGVQYXJzZUVycm9yKSB7XG5cdFx0XHRcdFx0XHRqc2Mud2FybignRXJyb3IgcGFyc2luZyBqc2NvbG9yIG9wdGlvbnM6ICcgKyBlUGFyc2VFcnJvciArICc6XFxuJyArIG9wdHNTdHIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHR0YXJnZXRFbG0uanNjb2xvciA9IG5ldyBqc2MuanNjb2xvcih0YXJnZXRFbG0sIG9wdHMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdGlzQ29sb3JBdHRyU3VwcG9ydGVkIDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblx0XHRpZiAoZWxtLnNldEF0dHJpYnV0ZSkge1xuXHRcdFx0ZWxtLnNldEF0dHJpYnV0ZSgndHlwZScsICdjb2xvcicpO1xuXHRcdFx0aWYgKGVsbS50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2NvbG9yJykge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9KSgpLFxuXG5cblx0aXNDYW52YXNTdXBwb3J0ZWQgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBlbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRyZXR1cm4gISEoZWxtLmdldENvbnRleHQgJiYgZWxtLmdldENvbnRleHQoJzJkJykpO1xuXHR9KSgpLFxuXG5cblx0ZmV0Y2hFbGVtZW50IDogZnVuY3Rpb24gKG1peGVkKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiBtaXhlZCA9PT0gJ3N0cmluZycgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtaXhlZCkgOiBtaXhlZDtcblx0fSxcblxuXG5cdGlzRWxlbWVudFR5cGUgOiBmdW5jdGlvbiAoZWxtLCB0eXBlKSB7XG5cdFx0cmV0dXJuIGVsbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cdH0sXG5cblxuXHRnZXREYXRhQXR0ciA6IGZ1bmN0aW9uIChlbCwgbmFtZSkge1xuXHRcdHZhciBhdHRyTmFtZSA9ICdkYXRhLScgKyBuYW1lO1xuXHRcdHZhciBhdHRyVmFsdWUgPSBlbC5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuXHRcdGlmIChhdHRyVmFsdWUgIT09IG51bGwpIHtcblx0XHRcdHJldHVybiBhdHRyVmFsdWU7XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cblx0YXR0YWNoRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoZWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcihldm50LCBmdW5jLCBmYWxzZSk7XG5cdFx0fSBlbHNlIGlmIChlbC5hdHRhY2hFdmVudCkge1xuXHRcdFx0ZWwuYXR0YWNoRXZlbnQoJ29uJyArIGV2bnQsIGZ1bmMpO1xuXHRcdH1cblx0fSxcblxuXG5cdGRldGFjaEV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZudCwgZnVuYywgZmFsc2UpO1xuXHRcdH0gZWxzZSBpZiAoZWwuZGV0YWNoRXZlbnQpIHtcblx0XHRcdGVsLmRldGFjaEV2ZW50KCdvbicgKyBldm50LCBmdW5jKTtcblx0XHR9XG5cdH0sXG5cblxuXHRfYXR0YWNoZWRHcm91cEV2ZW50cyA6IHt9LFxuXG5cblx0YXR0YWNoR3JvdXBFdmVudCA6IGZ1bmN0aW9uIChncm91cE5hbWUsIGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKCFqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHMuaGFzT3duUHJvcGVydHkoZ3JvdXBOYW1lKSkge1xuXHRcdFx0anNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0gPSBbXTtcblx0XHR9XG5cdFx0anNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0ucHVzaChbZWwsIGV2bnQsIGZ1bmNdKTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZWwsIGV2bnQsIGZ1bmMpO1xuXHR9LFxuXG5cblx0ZGV0YWNoR3JvdXBFdmVudHMgOiBmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XG5cdFx0aWYgKGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShncm91cE5hbWUpKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHZhciBldnQgPSBqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXVtpXTtcblx0XHRcdFx0anNjLmRldGFjaEV2ZW50KGV2dFswXSwgZXZ0WzFdLCBldnRbMl0pO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdO1xuXHRcdH1cblx0fSxcblxuXG5cdGF0dGFjaERPTVJlYWR5RXZlbnQgOiBmdW5jdGlvbiAoZnVuYykge1xuXHRcdHZhciBmaXJlZCA9IGZhbHNlO1xuXHRcdHZhciBmaXJlT25jZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghZmlyZWQpIHtcblx0XHRcdFx0ZmlyZWQgPSB0cnVlO1xuXHRcdFx0XHRmdW5jKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG5cdFx0XHRzZXRUaW1lb3V0KGZpcmVPbmNlLCAxKTsgLy8gYXN5bmNcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZpcmVPbmNlLCBmYWxzZSk7XG5cblx0XHRcdC8vIEZhbGxiYWNrXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZpcmVPbmNlLCBmYWxzZSk7XG5cblx0XHR9IGVsc2UgaWYgKGRvY3VtZW50LmF0dGFjaEV2ZW50KSB7XG5cdFx0XHQvLyBJRVxuXHRcdFx0ZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcblx0XHRcdFx0XHRkb2N1bWVudC5kZXRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgYXJndW1lbnRzLmNhbGxlZSk7XG5cdFx0XHRcdFx0ZmlyZU9uY2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0Ly8gRmFsbGJhY2tcblx0XHRcdHdpbmRvdy5hdHRhY2hFdmVudCgnb25sb2FkJywgZmlyZU9uY2UpO1xuXG5cdFx0XHQvLyBJRTcvOFxuXHRcdFx0aWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbCAmJiB3aW5kb3cgPT0gd2luZG93LnRvcCkge1xuXHRcdFx0XHR2YXIgdHJ5U2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGlmICghZG9jdW1lbnQuYm9keSkgeyByZXR1cm47IH1cblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsKCdsZWZ0Jyk7XG5cdFx0XHRcdFx0XHRmaXJlT25jZSgpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQodHJ5U2Nyb2xsLCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHRcdHRyeVNjcm9sbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdHdhcm4gOiBmdW5jdGlvbiAobXNnKSB7XG5cdFx0aWYgKHdpbmRvdy5jb25zb2xlICYmIHdpbmRvdy5jb25zb2xlLndhcm4pIHtcblx0XHRcdHdpbmRvdy5jb25zb2xlLndhcm4obXNnKTtcblx0XHR9XG5cdH0sXG5cblxuXHRwcmV2ZW50RGVmYXVsdCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKGUucHJldmVudERlZmF1bHQpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XG5cdFx0ZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXHR9LFxuXG5cblx0Y2FwdHVyZVRhcmdldCA6IGZ1bmN0aW9uICh0YXJnZXQpIHtcblx0XHQvLyBJRVxuXHRcdGlmICh0YXJnZXQuc2V0Q2FwdHVyZSkge1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldCA9IHRhcmdldDtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQuc2V0Q2FwdHVyZSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdHJlbGVhc2VUYXJnZXQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gSUVcblx0XHRpZiAoanNjLl9jYXB0dXJlZFRhcmdldCkge1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldC5yZWxlYXNlQ2FwdHVyZSgpO1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldCA9IG51bGw7XG5cdFx0fVxuXHR9LFxuXG5cblx0ZmlyZUV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50KSB7XG5cdFx0aWYgKCFlbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQpIHtcblx0XHRcdHZhciBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJyk7XG5cdFx0XHRldi5pbml0RXZlbnQoZXZudCwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0XHRlbC5kaXNwYXRjaEV2ZW50KGV2KTtcblx0XHR9IGVsc2UgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG5cdFx0XHR2YXIgZXYgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuXHRcdFx0ZWwuZmlyZUV2ZW50KCdvbicgKyBldm50LCBldik7XG5cdFx0fSBlbHNlIGlmIChlbFsnb24nICsgZXZudF0pIHsgLy8gYWx0ZXJuYXRpdmVseSB1c2UgdGhlIHRyYWRpdGlvbmFsIGV2ZW50IG1vZGVsXG5cdFx0XHRlbFsnb24nICsgZXZudF0oKTtcblx0XHR9XG5cdH0sXG5cblxuXHRjbGFzc05hbWVUb0xpc3QgOiBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG5cdFx0cmV0dXJuIGNsYXNzTmFtZS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJykuc3BsaXQoL1xccysvKTtcblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBvbmx5IGNvbnRhaW4gYSBzaW5nbGUgY2xhc3MgbmFtZVxuXHRoYXNDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdGlmICghY2xhc3NOYW1lKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiAtMSAhPSAoJyAnICsgZWxtLmNsYXNzTmFtZS5yZXBsYWNlKC9cXHMrL2csICcgJykgKyAnICcpLmluZGV4T2YoJyAnICsgY2xhc3NOYW1lICsgJyAnKTtcblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBjb250YWluIG11bHRpcGxlIGNsYXNzIG5hbWVzIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlXG5cdHNldENsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGNsYXNzTGlzdCA9IGpzYy5jbGFzc05hbWVUb0xpc3QoY2xhc3NOYW1lKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKCFqc2MuaGFzQ2xhc3MoZWxtLCBjbGFzc0xpc3RbaV0pKSB7XG5cdFx0XHRcdGVsbS5jbGFzc05hbWUgKz0gKGVsbS5jbGFzc05hbWUgPyAnICcgOiAnJykgKyBjbGFzc0xpc3RbaV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIGNvbnRhaW4gbXVsdGlwbGUgY2xhc3MgbmFtZXMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Vcblx0dW5zZXRDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdHZhciBjbGFzc0xpc3QgPSBqc2MuY2xhc3NOYW1lVG9MaXN0KGNsYXNzTmFtZSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHZhciByZXBsID0gbmV3IFJlZ0V4cChcblx0XHRcdFx0J15cXFxccyonICsgY2xhc3NMaXN0W2ldICsgJ1xcXFxzKnwnICtcblx0XHRcdFx0J1xcXFxzKicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXHMqJHwnICtcblx0XHRcdFx0J1xcXFxzKycgKyBjbGFzc0xpc3RbaV0gKyAnKFxcXFxzKyknLFxuXHRcdFx0XHQnZydcblx0XHRcdCk7XG5cdFx0XHRlbG0uY2xhc3NOYW1lID0gZWxtLmNsYXNzTmFtZS5yZXBsYWNlKHJlcGwsICckMScpO1xuXHRcdH1cblx0fSxcblxuXG5cdGdldFN0eWxlIDogZnVuY3Rpb24gKGVsbSkge1xuXHRcdHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsbSkgOiBlbG0uY3VycmVudFN0eWxlO1xuXHR9LFxuXG5cblx0c2V0U3R5bGUgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBoZWxwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHR2YXIgZ2V0U3VwcG9ydGVkUHJvcCA9IGZ1bmN0aW9uIChuYW1lcykge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRpZiAobmFtZXNbaV0gaW4gaGVscGVyLnN0eWxlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5hbWVzW2ldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgcHJvcHMgPSB7XG5cdFx0XHRib3JkZXJSYWRpdXM6IGdldFN1cHBvcnRlZFByb3AoWydib3JkZXJSYWRpdXMnLCAnTW96Qm9yZGVyUmFkaXVzJywgJ3dlYmtpdEJvcmRlclJhZGl1cyddKSxcblx0XHRcdGJveFNoYWRvdzogZ2V0U3VwcG9ydGVkUHJvcChbJ2JveFNoYWRvdycsICdNb3pCb3hTaGFkb3cnLCAnd2Via2l0Qm94U2hhZG93J10pXG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGVsbSwgcHJvcCwgdmFsdWUpIHtcblx0XHRcdHN3aXRjaCAocHJvcC50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRjYXNlICdvcGFjaXR5Jzpcblx0XHRcdFx0dmFyIGFscGhhT3BhY2l0eSA9IE1hdGgucm91bmQocGFyc2VGbG9hdCh2YWx1ZSkgKiAxMDApO1xuXHRcdFx0XHRlbG0uc3R5bGUub3BhY2l0eSA9IHZhbHVlO1xuXHRcdFx0XHRlbG0uc3R5bGUuZmlsdGVyID0gJ2FscGhhKG9wYWNpdHk9JyArIGFscGhhT3BhY2l0eSArICcpJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRlbG0uc3R5bGVbcHJvcHNbcHJvcF1dID0gdmFsdWU7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0pKCksXG5cblxuXHRzZXRCb3JkZXJSYWRpdXMgOiBmdW5jdGlvbiAoZWxtLCB2YWx1ZSkge1xuXHRcdGpzYy5zZXRTdHlsZShlbG0sICdib3JkZXJSYWRpdXMnLCB2YWx1ZSB8fCAnMCcpO1xuXHR9LFxuXG5cblx0c2V0Qm94U2hhZG93IDogZnVuY3Rpb24gKGVsbSwgdmFsdWUpIHtcblx0XHRqc2Muc2V0U3R5bGUoZWxtLCAnYm94U2hhZG93JywgdmFsdWUgfHwgJ25vbmUnKTtcblx0fSxcblxuXG5cdGdldEVsZW1lbnRQb3MgOiBmdW5jdGlvbiAoZSwgcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0dmFyIHg9MCwgeT0wO1xuXHRcdHZhciByZWN0ID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHR4ID0gcmVjdC5sZWZ0O1xuXHRcdHkgPSByZWN0LnRvcDtcblx0XHRpZiAoIXJlbGF0aXZlVG9WaWV3cG9ydCkge1xuXHRcdFx0dmFyIHZpZXdQb3MgPSBqc2MuZ2V0Vmlld1BvcygpO1xuXHRcdFx0eCArPSB2aWV3UG9zWzBdO1xuXHRcdFx0eSArPSB2aWV3UG9zWzFdO1xuXHRcdH1cblx0XHRyZXR1cm4gW3gsIHldO1xuXHR9LFxuXG5cblx0Z2V0RWxlbWVudFNpemUgOiBmdW5jdGlvbiAoZSkge1xuXHRcdHJldHVybiBbZS5vZmZzZXRXaWR0aCwgZS5vZmZzZXRIZWlnaHRdO1xuXHR9LFxuXG5cblx0Ly8gZ2V0IHBvaW50ZXIncyBYL1kgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdmlld3BvcnRcblx0Z2V0QWJzUG9pbnRlclBvcyA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgeCA9IDAsIHkgPSAwO1xuXHRcdGlmICh0eXBlb2YgZS5jaGFuZ2VkVG91Y2hlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcblx0XHRcdC8vIHRvdWNoIGRldmljZXNcblx0XHRcdHggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHR5ID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGUuY2xpZW50WCA9PT0gJ251bWJlcicpIHtcblx0XHRcdHggPSBlLmNsaWVudFg7XG5cdFx0XHR5ID0gZS5jbGllbnRZO1xuXHRcdH1cblx0XHRyZXR1cm4geyB4OiB4LCB5OiB5IH07XG5cdH0sXG5cblxuXHQvLyBnZXQgcG9pbnRlcidzIFgvWSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0YXJnZXQgZWxlbWVudFxuXHRnZXRSZWxQb2ludGVyUG9zIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cdFx0dmFyIHRhcmdldFJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHR2YXIgeCA9IDAsIHkgPSAwO1xuXG5cdFx0dmFyIGNsaWVudFggPSAwLCBjbGllbnRZID0gMDtcblx0XHRpZiAodHlwZW9mIGUuY2hhbmdlZFRvdWNoZXMgIT09ICd1bmRlZmluZWQnICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG5cdFx0XHQvLyB0b3VjaCBkZXZpY2VzXG5cdFx0XHRjbGllbnRYID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0Y2xpZW50WSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBlLmNsaWVudFggPT09ICdudW1iZXInKSB7XG5cdFx0XHRjbGllbnRYID0gZS5jbGllbnRYO1xuXHRcdFx0Y2xpZW50WSA9IGUuY2xpZW50WTtcblx0XHR9XG5cblx0XHR4ID0gY2xpZW50WCAtIHRhcmdldFJlY3QubGVmdDtcblx0XHR5ID0gY2xpZW50WSAtIHRhcmdldFJlY3QudG9wO1xuXHRcdHJldHVybiB7IHg6IHgsIHk6IHkgfTtcblx0fSxcblxuXG5cdGdldFZpZXdQb3MgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHRyZXR1cm4gW1xuXHRcdFx0KHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2Muc2Nyb2xsTGVmdCkgLSAoZG9jLmNsaWVudExlZnQgfHwgMCksXG5cdFx0XHQod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvYy5zY3JvbGxUb3ApIC0gKGRvYy5jbGllbnRUb3AgfHwgMClcblx0XHRdO1xuXHR9LFxuXG5cblx0Z2V0Vmlld1NpemUgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHRyZXR1cm4gW1xuXHRcdFx0KHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvYy5jbGllbnRXaWR0aCksXG5cdFx0XHQod2luZG93LmlubmVySGVpZ2h0IHx8IGRvYy5jbGllbnRIZWlnaHQpLFxuXHRcdF07XG5cdH0sXG5cblxuXHRyZWRyYXdQb3NpdGlvbiA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdHZhciB0aGlzT2JqID0ganNjLnBpY2tlci5vd25lcjtcblxuXHRcdFx0dmFyIHRwLCB2cDtcblxuXHRcdFx0aWYgKHRoaXNPYmouZml4ZWQpIHtcblx0XHRcdFx0Ly8gRml4ZWQgZWxlbWVudHMgYXJlIHBvc2l0aW9uZWQgcmVsYXRpdmUgdG8gdmlld3BvcnQsXG5cdFx0XHRcdC8vIHRoZXJlZm9yZSB3ZSBjYW4gaWdub3JlIHRoZSBzY3JvbGwgb2Zmc2V0XG5cdFx0XHRcdHRwID0ganNjLmdldEVsZW1lbnRQb3ModGhpc09iai50YXJnZXRFbGVtZW50LCB0cnVlKTsgLy8gdGFyZ2V0IHBvc1xuXHRcdFx0XHR2cCA9IFswLCAwXTsgLy8gdmlldyBwb3Ncblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRwID0ganNjLmdldEVsZW1lbnRQb3ModGhpc09iai50YXJnZXRFbGVtZW50KTsgLy8gdGFyZ2V0IHBvc1xuXHRcdFx0XHR2cCA9IGpzYy5nZXRWaWV3UG9zKCk7IC8vIHZpZXcgcG9zXG5cdFx0XHR9XG5cblx0XHRcdHZhciB0cyA9IGpzYy5nZXRFbGVtZW50U2l6ZSh0aGlzT2JqLnRhcmdldEVsZW1lbnQpOyAvLyB0YXJnZXQgc2l6ZVxuXHRcdFx0dmFyIHZzID0ganNjLmdldFZpZXdTaXplKCk7IC8vIHZpZXcgc2l6ZVxuXHRcdFx0dmFyIHBzID0ganNjLmdldFBpY2tlck91dGVyRGltcyh0aGlzT2JqKTsgLy8gcGlja2VyIHNpemVcblx0XHRcdHZhciBhLCBiLCBjO1xuXHRcdFx0c3dpdGNoICh0aGlzT2JqLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAnbGVmdCc6IGE9MTsgYj0wOyBjPS0xOyBicmVhaztcblx0XHRcdFx0Y2FzZSAncmlnaHQnOmE9MTsgYj0wOyBjPTE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd0b3AnOiAgYT0wOyBiPTE7IGM9LTE7IGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OiAgICAgYT0wOyBiPTE7IGM9MTsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHR2YXIgbCA9ICh0c1tiXStwc1tiXSkvMjtcblxuXHRcdFx0Ly8gY29tcHV0ZSBwaWNrZXIgcG9zaXRpb25cblx0XHRcdGlmICghdGhpc09iai5zbWFydFBvc2l0aW9uKSB7XG5cdFx0XHRcdHZhciBwcCA9IFtcblx0XHRcdFx0XHR0cFthXSxcblx0XHRcdFx0XHR0cFtiXSt0c1tiXS1sK2wqY1xuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIHBwID0gW1xuXHRcdFx0XHRcdC12cFthXSt0cFthXStwc1thXSA+IHZzW2FdID9cblx0XHRcdFx0XHRcdCgtdnBbYV0rdHBbYV0rdHNbYV0vMiA+IHZzW2FdLzIgJiYgdHBbYV0rdHNbYV0tcHNbYV0gPj0gMCA/IHRwW2FdK3RzW2FdLXBzW2FdIDogdHBbYV0pIDpcblx0XHRcdFx0XHRcdHRwW2FdLFxuXHRcdFx0XHRcdC12cFtiXSt0cFtiXSt0c1tiXStwc1tiXS1sK2wqYyA+IHZzW2JdID9cblx0XHRcdFx0XHRcdCgtdnBbYl0rdHBbYl0rdHNbYl0vMiA+IHZzW2JdLzIgJiYgdHBbYl0rdHNbYl0tbC1sKmMgPj0gMCA/IHRwW2JdK3RzW2JdLWwtbCpjIDogdHBbYl0rdHNbYl0tbCtsKmMpIDpcblx0XHRcdFx0XHRcdCh0cFtiXSt0c1tiXS1sK2wqYyA+PSAwID8gdHBbYl0rdHNbYl0tbCtsKmMgOiB0cFtiXSt0c1tiXS1sLWwqYylcblx0XHRcdFx0XTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHggPSBwcFthXTtcblx0XHRcdHZhciB5ID0gcHBbYl07XG5cdFx0XHR2YXIgcG9zaXRpb25WYWx1ZSA9IHRoaXNPYmouZml4ZWQgPyAnZml4ZWQnIDogJ2Fic29sdXRlJztcblx0XHRcdHZhciBjb250cmFjdFNoYWRvdyA9XG5cdFx0XHRcdChwcFswXSArIHBzWzBdID4gdHBbMF0gfHwgcHBbMF0gPCB0cFswXSArIHRzWzBdKSAmJlxuXHRcdFx0XHQocHBbMV0gKyBwc1sxXSA8IHRwWzFdICsgdHNbMV0pO1xuXG5cdFx0XHRqc2MuX2RyYXdQb3NpdGlvbih0aGlzT2JqLCB4LCB5LCBwb3NpdGlvblZhbHVlLCBjb250cmFjdFNoYWRvdyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0X2RyYXdQb3NpdGlvbiA6IGZ1bmN0aW9uICh0aGlzT2JqLCB4LCB5LCBwb3NpdGlvblZhbHVlLCBjb250cmFjdFNoYWRvdykge1xuXHRcdHZhciB2U2hhZG93ID0gY29udHJhY3RTaGFkb3cgPyAwIDogdGhpc09iai5zaGFkb3dCbHVyOyAvLyBweFxuXG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLnBvc2l0aW9uID0gcG9zaXRpb25WYWx1ZTtcblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUubGVmdCA9IHggKyAncHgnO1xuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS50b3AgPSB5ICsgJ3B4JztcblxuXHRcdGpzYy5zZXRCb3hTaGFkb3coXG5cdFx0XHRqc2MucGlja2VyLmJveFMsXG5cdFx0XHR0aGlzT2JqLnNoYWRvdyA/XG5cdFx0XHRcdG5ldyBqc2MuQm94U2hhZG93KDAsIHZTaGFkb3csIHRoaXNPYmouc2hhZG93Qmx1ciwgMCwgdGhpc09iai5zaGFkb3dDb2xvcikgOlxuXHRcdFx0XHRudWxsKTtcblx0fSxcblxuXG5cdGdldFBpY2tlckRpbXMgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHZhciBkaXNwbGF5U2xpZGVyID0gISFqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopO1xuXHRcdHZhciBkaW1zID0gW1xuXHRcdFx0MiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIDIgKiB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLndpZHRoICtcblx0XHRcdFx0KGRpc3BsYXlTbGlkZXIgPyAyICogdGhpc09iai5pbnNldFdpZHRoICsganNjLmdldFBhZFRvU2xpZGVyUGFkZGluZyh0aGlzT2JqKSArIHRoaXNPYmouc2xpZGVyU2l6ZSA6IDApLFxuXHRcdFx0MiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIDIgKiB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLmhlaWdodCArXG5cdFx0XHRcdCh0aGlzT2JqLmNsb3NhYmxlID8gMiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmouYnV0dG9uSGVpZ2h0IDogMClcblx0XHRdO1xuXHRcdHJldHVybiBkaW1zO1xuXHR9LFxuXG5cblx0Z2V0UGlja2VyT3V0ZXJEaW1zIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHR2YXIgZGltcyA9IGpzYy5nZXRQaWNrZXJEaW1zKHRoaXNPYmopO1xuXHRcdHJldHVybiBbXG5cdFx0XHRkaW1zWzBdICsgMiAqIHRoaXNPYmouYm9yZGVyV2lkdGgsXG5cdFx0XHRkaW1zWzFdICsgMiAqIHRoaXNPYmouYm9yZGVyV2lkdGhcblx0XHRdO1xuXHR9LFxuXG5cblx0Z2V0UGFkVG9TbGlkZXJQYWRkaW5nIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRyZXR1cm4gTWF0aC5tYXgodGhpc09iai5wYWRkaW5nLCAxLjUgKiAoMiAqIHRoaXNPYmoucG9pbnRlckJvcmRlcldpZHRoICsgdGhpc09iai5wb2ludGVyVGhpY2tuZXNzKSk7XG5cdH0sXG5cblxuXHRnZXRQYWRZQ29tcG9uZW50IDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRzd2l0Y2ggKHRoaXNPYmoubW9kZS5jaGFyQXQoMSkudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0Y2FzZSAndic6IHJldHVybiAndic7IGJyZWFrO1xuXHRcdH1cblx0XHRyZXR1cm4gJ3MnO1xuXHR9LFxuXG5cblx0Z2V0U2xpZGVyQ29tcG9uZW50IDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai5tb2RlLmxlbmd0aCA+IDIpIHtcblx0XHRcdHN3aXRjaCAodGhpc09iai5tb2RlLmNoYXJBdCgyKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOiByZXR1cm4gJ3MnOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndic6IHJldHVybiAndic7IGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fSxcblxuXG5cdG9uRG9jdW1lbnRNb3VzZURvd24gOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuXHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93T25DbGljaykge1xuXHRcdFx0XHR0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3coKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldC5fanNjQ29udHJvbE5hbWUpIHtcblx0XHRcdGpzYy5vbkNvbnRyb2xQb2ludGVyU3RhcnQoZSwgdGFyZ2V0LCB0YXJnZXQuX2pzY0NvbnRyb2xOYW1lLCAnbW91c2UnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gTW91c2UgaXMgb3V0c2lkZSB0aGUgcGlja2VyIGNvbnRyb2xzIC0+IGhpZGUgdGhlIGNvbG9yIHBpY2tlciFcblx0XHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlci5vd25lci5oaWRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25Eb2N1bWVudFRvdWNoU3RhcnQgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuXHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93T25DbGljaykge1xuXHRcdFx0XHR0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3coKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldC5fanNjQ29udHJvbE5hbWUpIHtcblx0XHRcdGpzYy5vbkNvbnRyb2xQb2ludGVyU3RhcnQoZSwgdGFyZ2V0LCB0YXJnZXQuX2pzY0NvbnRyb2xOYW1lLCAndG91Y2gnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbldpbmRvd1Jlc2l6ZSA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0anNjLnJlZHJhd1Bvc2l0aW9uKCk7XG5cdH0sXG5cblxuXHRvblBhcmVudFNjcm9sbCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0Ly8gaGlkZSB0aGUgcGlja2VyIHdoZW4gb25lIG9mIHRoZSBwYXJlbnQgZWxlbWVudHMgaXMgc2Nyb2xsZWRcblx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHR9XG5cdH0sXG5cblxuXHRfcG9pbnRlck1vdmVFdmVudCA6IHtcblx0XHRtb3VzZTogJ21vdXNlbW92ZScsXG5cdFx0dG91Y2g6ICd0b3VjaG1vdmUnXG5cdH0sXG5cdF9wb2ludGVyRW5kRXZlbnQgOiB7XG5cdFx0bW91c2U6ICdtb3VzZXVwJyxcblx0XHR0b3VjaDogJ3RvdWNoZW5kJ1xuXHR9LFxuXG5cblx0X3BvaW50ZXJPcmlnaW4gOiBudWxsLFxuXHRfY2FwdHVyZWRUYXJnZXQgOiBudWxsLFxuXG5cblx0b25Db250cm9sUG9pbnRlclN0YXJ0IDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlKSB7XG5cdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXG5cdFx0anNjLnByZXZlbnREZWZhdWx0KGUpO1xuXHRcdGpzYy5jYXB0dXJlVGFyZ2V0KHRhcmdldCk7XG5cblx0XHR2YXIgcmVnaXN0ZXJEcmFnRXZlbnRzID0gZnVuY3Rpb24gKGRvYywgb2Zmc2V0KSB7XG5cdFx0XHRqc2MuYXR0YWNoR3JvdXBFdmVudCgnZHJhZycsIGRvYywganNjLl9wb2ludGVyTW92ZUV2ZW50W3BvaW50ZXJUeXBlXSxcblx0XHRcdFx0anNjLm9uRG9jdW1lbnRQb2ludGVyTW92ZShlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSwgb2Zmc2V0KSk7XG5cdFx0XHRqc2MuYXR0YWNoR3JvdXBFdmVudCgnZHJhZycsIGRvYywganNjLl9wb2ludGVyRW5kRXZlbnRbcG9pbnRlclR5cGVdLFxuXHRcdFx0XHRqc2Mub25Eb2N1bWVudFBvaW50ZXJFbmQoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpKTtcblx0XHR9O1xuXG5cdFx0cmVnaXN0ZXJEcmFnRXZlbnRzKGRvY3VtZW50LCBbMCwgMF0pO1xuXG5cdFx0aWYgKHdpbmRvdy5wYXJlbnQgJiYgd2luZG93LmZyYW1lRWxlbWVudCkge1xuXHRcdFx0dmFyIHJlY3QgPSB3aW5kb3cuZnJhbWVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0dmFyIG9mcyA9IFstcmVjdC5sZWZ0LCAtcmVjdC50b3BdO1xuXHRcdFx0cmVnaXN0ZXJEcmFnRXZlbnRzKHdpbmRvdy5wYXJlbnQud2luZG93LmRvY3VtZW50LCBvZnMpO1xuXHRcdH1cblxuXHRcdHZhciBhYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgcmVsID0ganNjLmdldFJlbFBvaW50ZXJQb3MoZSk7XG5cdFx0anNjLl9wb2ludGVyT3JpZ2luID0ge1xuXHRcdFx0eDogYWJzLnggLSByZWwueCxcblx0XHRcdHk6IGFicy55IC0gcmVsLnlcblx0XHR9O1xuXG5cdFx0c3dpdGNoIChjb250cm9sTmFtZSkge1xuXHRcdGNhc2UgJ3BhZCc6XG5cdFx0XHQvLyBpZiB0aGUgc2xpZGVyIGlzIGF0IHRoZSBib3R0b20sIG1vdmUgaXQgdXBcblx0XHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdFx0Y2FzZSAncyc6IGlmICh0aGlzT2JqLmhzdlsxXSA9PT0gMCkgeyB0aGlzT2JqLmZyb21IU1YobnVsbCwgMTAwLCBudWxsKTsgfTsgYnJlYWs7XG5cdFx0XHRjYXNlICd2JzogaWYgKHRoaXNPYmouaHN2WzJdID09PSAwKSB7IHRoaXNPYmouZnJvbUhTVihudWxsLCBudWxsLCAxMDApOyB9OyBicmVhaztcblx0XHRcdH1cblx0XHRcdGpzYy5zZXRQYWQodGhpc09iaiwgZSwgMCwgMCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ3NsZCc6XG5cdFx0XHRqc2Muc2V0U2xkKHRoaXNPYmosIGUsIDApO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0fSxcblxuXG5cdG9uRG9jdW1lbnRQb2ludGVyTW92ZSA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSwgb2Zmc2V0KSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cdFx0XHRzd2l0Y2ggKGNvbnRyb2xOYW1lKSB7XG5cdFx0XHRjYXNlICdwYWQnOlxuXHRcdFx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdFx0XHRqc2Muc2V0UGFkKHRoaXNPYmosIGUsIG9mZnNldFswXSwgb2Zmc2V0WzFdKTtcblx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgJ3NsZCc6XG5cdFx0XHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0XHRcdGpzYy5zZXRTbGQodGhpc09iaiwgZSwgb2Zmc2V0WzFdKTtcblx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25Eb2N1bWVudFBvaW50ZXJFbmQgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblx0XHRcdGpzYy5kZXRhY2hHcm91cEV2ZW50cygnZHJhZycpO1xuXHRcdFx0anNjLnJlbGVhc2VUYXJnZXQoKTtcblx0XHRcdC8vIEFsd2F5cyBkaXNwYXRjaCBjaGFuZ2VzIGFmdGVyIGRldGFjaGluZyBvdXRzdGFuZGluZyBtb3VzZSBoYW5kbGVycyxcblx0XHRcdC8vIGluIGNhc2Ugc29tZSB1c2VyIGludGVyYWN0aW9uIHdpbGwgb2NjdXIgaW4gdXNlcidzIG9uY2hhbmdlIGNhbGxiYWNrXG5cdFx0XHQvLyB0aGF0IHdvdWxkIGludHJ1ZGUgd2l0aCBjdXJyZW50IG1vdXNlIGV2ZW50c1xuXHRcdFx0anNjLmRpc3BhdGNoQ2hhbmdlKHRoaXNPYmopO1xuXHRcdH07XG5cdH0sXG5cblxuXHRkaXNwYXRjaENoYW5nZSA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpc09iai52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdGpzYy5maXJlRXZlbnQodGhpc09iai52YWx1ZUVsZW1lbnQsICdjaGFuZ2UnKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRkaXNwYXRjaEZpbmVDaGFuZ2UgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLm9uRmluZUNoYW5nZSkge1xuXHRcdFx0dmFyIGNhbGxiYWNrO1xuXHRcdFx0aWYgKHR5cGVvZiB0aGlzT2JqLm9uRmluZUNoYW5nZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSBuZXcgRnVuY3Rpb24gKHRoaXNPYmoub25GaW5lQ2hhbmdlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gdGhpc09iai5vbkZpbmVDaGFuZ2U7XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjay5jYWxsKHRoaXNPYmopO1xuXHRcdH1cblx0fSxcblxuXG5cdHNldFBhZCA6IGZ1bmN0aW9uICh0aGlzT2JqLCBlLCBvZnNYLCBvZnNZKSB7XG5cdFx0dmFyIHBvaW50ZXJBYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgeCA9IG9mc1ggKyBwb2ludGVyQWJzLnggLSBqc2MuX3BvaW50ZXJPcmlnaW4ueCAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblx0XHR2YXIgeSA9IG9mc1kgKyBwb2ludGVyQWJzLnkgLSBqc2MuX3BvaW50ZXJPcmlnaW4ueSAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblxuXHRcdHZhciB4VmFsID0geCAqICgzNjAgLyAodGhpc09iai53aWR0aCAtIDEpKTtcblx0XHR2YXIgeVZhbCA9IDEwMCAtICh5ICogKDEwMCAvICh0aGlzT2JqLmhlaWdodCAtIDEpKSk7XG5cblx0XHRzd2l0Y2ggKGpzYy5nZXRQYWRZQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0Y2FzZSAncyc6IHRoaXNPYmouZnJvbUhTVih4VmFsLCB5VmFsLCBudWxsLCBqc2MubGVhdmVTbGQpOyBicmVhaztcblx0XHRjYXNlICd2JzogdGhpc09iai5mcm9tSFNWKHhWYWwsIG51bGwsIHlWYWwsIGpzYy5sZWF2ZVNsZCk7IGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXG5cdHNldFNsZCA6IGZ1bmN0aW9uICh0aGlzT2JqLCBlLCBvZnNZKSB7XG5cdFx0dmFyIHBvaW50ZXJBYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgeSA9IG9mc1kgKyBwb2ludGVyQWJzLnkgLSBqc2MuX3BvaW50ZXJPcmlnaW4ueSAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblxuXHRcdHZhciB5VmFsID0gMTAwIC0gKHkgKiAoMTAwIC8gKHRoaXNPYmouaGVpZ2h0IC0gMSkpKTtcblxuXHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdGNhc2UgJ3MnOiB0aGlzT2JqLmZyb21IU1YobnVsbCwgeVZhbCwgbnVsbCwganNjLmxlYXZlUGFkKTsgYnJlYWs7XG5cdFx0Y2FzZSAndic6IHRoaXNPYmouZnJvbUhTVihudWxsLCBudWxsLCB5VmFsLCBqc2MubGVhdmVQYWQpOyBicmVhaztcblx0XHR9XG5cdH0sXG5cblxuXHRfdm1sTlMgOiAnanNjX3ZtbF8nLFxuXHRfdm1sQ1NTIDogJ2pzY192bWxfY3NzXycsXG5cdF92bWxSZWFkeSA6IGZhbHNlLFxuXG5cblx0aW5pdFZNTCA6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIWpzYy5fdm1sUmVhZHkpIHtcblx0XHRcdC8vIGluaXQgVk1MIG5hbWVzcGFjZVxuXHRcdFx0dmFyIGRvYyA9IGRvY3VtZW50O1xuXHRcdFx0aWYgKCFkb2MubmFtZXNwYWNlc1tqc2MuX3ZtbE5TXSkge1xuXHRcdFx0XHRkb2MubmFtZXNwYWNlcy5hZGQoanNjLl92bWxOUywgJ3VybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206dm1sJyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWRvYy5zdHlsZVNoZWV0c1tqc2MuX3ZtbENTU10pIHtcblx0XHRcdFx0dmFyIHRhZ3MgPSBbJ3NoYXBlJywgJ3NoYXBldHlwZScsICdncm91cCcsICdiYWNrZ3JvdW5kJywgJ3BhdGgnLCAnZm9ybXVsYXMnLCAnaGFuZGxlcycsICdmaWxsJywgJ3N0cm9rZScsICdzaGFkb3cnLCAndGV4dGJveCcsICd0ZXh0cGF0aCcsICdpbWFnZWRhdGEnLCAnbGluZScsICdwb2x5bGluZScsICdjdXJ2ZScsICdyZWN0JywgJ3JvdW5kcmVjdCcsICdvdmFsJywgJ2FyYycsICdpbWFnZSddO1xuXHRcdFx0XHR2YXIgc3MgPSBkb2MuY3JlYXRlU3R5bGVTaGVldCgpO1xuXHRcdFx0XHRzcy5vd25pbmdFbGVtZW50LmlkID0ganNjLl92bWxDU1M7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdHNzLmFkZFJ1bGUoanNjLl92bWxOUyArICdcXFxcOicgKyB0YWdzW2ldLCAnYmVoYXZpb3I6dXJsKCNkZWZhdWx0I1ZNTCk7Jyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGpzYy5fdm1sUmVhZHkgPSB0cnVlO1xuXHRcdH1cblx0fSxcblxuXG5cdGNyZWF0ZVBhbGV0dGUgOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgcGFsZXR0ZU9iaiA9IHtcblx0XHRcdGVsbTogbnVsbCxcblx0XHRcdGRyYXc6IG51bGxcblx0XHR9O1xuXG5cdFx0aWYgKGpzYy5pc0NhbnZhc1N1cHBvcnRlZCkge1xuXHRcdFx0Ly8gQ2FudmFzIGltcGxlbWVudGF0aW9uIGZvciBtb2Rlcm4gYnJvd3NlcnNcblxuXHRcdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgdHlwZSkge1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB3aWR0aDtcblx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuXHRcdFx0XHRjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIGhHcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIGNhbnZhcy53aWR0aCwgMCk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgwIC8gNiwgJyNGMDAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDEgLyA2LCAnI0ZGMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMiAvIDYsICcjMEYwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgzIC8gNiwgJyMwRkYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDQgLyA2LCAnIzAwRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNSAvIDYsICcjRjBGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg2IC8gNiwgJyNGMDAnKTtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gaEdyYWQ7XG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciB2R3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAwLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdFx0c3dpdGNoICh0eXBlLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDI1NSwyNTUsMjU1LDApJyk7XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDI1NSwyNTUsMjU1LDEpJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLDAsMCwwKScpO1xuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLDAsMCwxKScpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB2R3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRwYWxldHRlT2JqLmVsbSA9IGNhbnZhcztcblx0XHRcdHBhbGV0dGVPYmouZHJhdyA9IGRyYXdGdW5jO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFZNTCBmYWxsYmFjayBmb3IgSUUgNyBhbmQgOFxuXG5cdFx0XHRqc2MuaW5pdFZNTCgpO1xuXG5cdFx0XHR2YXIgdm1sQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0XHRcdHZhciBoR3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0aEdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHRoR3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdGhHcmFkLmFuZ2xlID0gJzkwJztcblx0XHRcdGhHcmFkLmNvbG9ycyA9ICcxNi42NyUgI0YwRiwgMzMuMzMlICMwMEYsIDUwJSAjMEZGLCA2Ni42NyUgIzBGMCwgODMuMzMlICNGRjAnXG5cblx0XHRcdHZhciBoUmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0aFJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0aFJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdGhSZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdGhSZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdGhSZWN0LmFwcGVuZENoaWxkKGhHcmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZChoUmVjdCk7XG5cblx0XHRcdHZhciB2R3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0dkdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHR2R3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdHZHcmFkLmFuZ2xlID0gJzE4MCc7XG5cdFx0XHR2R3JhZC5vcGFjaXR5ID0gJzAnO1xuXG5cdFx0XHR2YXIgdlJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdHZSZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHZSZWN0LnN0eWxlLmxlZnQgPSAtMSArICdweCc7XG5cdFx0XHR2UmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHR2UmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHR2UmVjdC5hcHBlbmRDaGlsZCh2R3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQodlJlY3QpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgdHlwZSkge1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRcdGhSZWN0LnN0eWxlLndpZHRoID1cblx0XHRcdFx0dlJlY3Quc3R5bGUud2lkdGggPVxuXHRcdFx0XHRcdCh3aWR0aCArIDEpICsgJ3B4Jztcblx0XHRcdFx0aFJlY3Quc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0dlJlY3Quc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0XHQoaGVpZ2h0ICsgMSkgKyAncHgnO1xuXG5cdFx0XHRcdC8vIENvbG9ycyBtdXN0IGJlIHNwZWNpZmllZCBkdXJpbmcgZXZlcnkgcmVkcmF3LCBvdGhlcndpc2UgSUUgd29uJ3QgZGlzcGxheVxuXHRcdFx0XHQvLyBhIGZ1bGwgZ3JhZGllbnQgZHVyaW5nIGEgc3Vic2VxdWVudGlhbCByZWRyYXdcblx0XHRcdFx0aEdyYWQuY29sb3IgPSAnI0YwMCc7XG5cdFx0XHRcdGhHcmFkLmNvbG9yMiA9ICcjRjAwJztcblxuXHRcdFx0XHRzd2l0Y2ggKHR5cGUudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0XHR2R3JhZC5jb2xvciA9IHZHcmFkLmNvbG9yMiA9ICcjRkZGJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dkdyYWQuY29sb3IgPSB2R3JhZC5jb2xvcjIgPSAnIzAwMCc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdHBhbGV0dGVPYmouZWxtID0gdm1sQ29udGFpbmVyO1xuXHRcdFx0cGFsZXR0ZU9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHBhbGV0dGVPYmo7XG5cdH0sXG5cblxuXHRjcmVhdGVTbGlkZXJHcmFkaWVudCA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBzbGlkZXJPYmogPSB7XG5cdFx0XHRlbG06IG51bGwsXG5cdFx0XHRkcmF3OiBudWxsXG5cdFx0fTtcblxuXHRcdGlmIChqc2MuaXNDYW52YXNTdXBwb3J0ZWQpIHtcblx0XHRcdC8vIENhbnZhcyBpbXBsZW1lbnRhdGlvbiBmb3IgbW9kZXJuIGJyb3dzZXJzXG5cblx0XHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGNvbG9yMSwgY29sb3IyKSB7XG5cdFx0XHRcdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgZ3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAwLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdFx0Z3JhZC5hZGRDb2xvclN0b3AoMCwgY29sb3IxKTtcblx0XHRcdFx0Z3JhZC5hZGRDb2xvclN0b3AoMSwgY29sb3IyKTtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gZ3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRzbGlkZXJPYmouZWxtID0gY2FudmFzO1xuXHRcdFx0c2xpZGVyT2JqLmRyYXcgPSBkcmF3RnVuYztcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBWTUwgZmFsbGJhY2sgZm9yIElFIDcgYW5kIDhcblxuXHRcdFx0anNjLmluaXRWTUwoKTtcblxuXHRcdFx0dmFyIHZtbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG5cdFx0XHR2YXIgZ3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0Z3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdGdyYWQubWV0aG9kID0gJ2xpbmVhcic7XG5cdFx0XHRncmFkLmFuZ2xlID0gJzE4MCc7XG5cblx0XHRcdHZhciByZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHRyZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdHJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0cmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHRyZWN0LmFwcGVuZENoaWxkKGdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKHJlY3QpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY29sb3IxLCBjb2xvcjIpIHtcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0XHRyZWN0LnN0eWxlLndpZHRoID0gKHdpZHRoICsgMSkgKyAncHgnO1xuXHRcdFx0XHRyZWN0LnN0eWxlLmhlaWdodCA9IChoZWlnaHQgKyAxKSArICdweCc7XG5cblx0XHRcdFx0Z3JhZC5jb2xvciA9IGNvbG9yMTtcblx0XHRcdFx0Z3JhZC5jb2xvcjIgPSBjb2xvcjI7XG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHRzbGlkZXJPYmouZWxtID0gdm1sQ29udGFpbmVyO1xuXHRcdFx0c2xpZGVyT2JqLmRyYXcgPSBkcmF3RnVuYztcblx0XHR9XG5cblx0XHRyZXR1cm4gc2xpZGVyT2JqO1xuXHR9LFxuXG5cblx0bGVhdmVWYWx1ZSA6IDE8PDAsXG5cdGxlYXZlU3R5bGUgOiAxPDwxLFxuXHRsZWF2ZVBhZCA6IDE8PDIsXG5cdGxlYXZlU2xkIDogMTw8MyxcblxuXG5cdEJveFNoYWRvdyA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIEJveFNoYWRvdyA9IGZ1bmN0aW9uIChoU2hhZG93LCB2U2hhZG93LCBibHVyLCBzcHJlYWQsIGNvbG9yLCBpbnNldCkge1xuXHRcdFx0dGhpcy5oU2hhZG93ID0gaFNoYWRvdztcblx0XHRcdHRoaXMudlNoYWRvdyA9IHZTaGFkb3c7XG5cdFx0XHR0aGlzLmJsdXIgPSBibHVyO1xuXHRcdFx0dGhpcy5zcHJlYWQgPSBzcHJlYWQ7XG5cdFx0XHR0aGlzLmNvbG9yID0gY29sb3I7XG5cdFx0XHR0aGlzLmluc2V0ID0gISFpbnNldDtcblx0XHR9O1xuXG5cdFx0Qm94U2hhZG93LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB2YWxzID0gW1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuaFNoYWRvdykgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMudlNoYWRvdykgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuYmx1cikgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuc3ByZWFkKSArICdweCcsXG5cdFx0XHRcdHRoaXMuY29sb3Jcblx0XHRcdF07XG5cdFx0XHRpZiAodGhpcy5pbnNldCkge1xuXHRcdFx0XHR2YWxzLnB1c2goJ2luc2V0Jyk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFscy5qb2luKCcgJyk7XG5cdFx0fTtcblxuXHRcdHJldHVybiBCb3hTaGFkb3c7XG5cdH0pKCksXG5cblxuXHQvL1xuXHQvLyBVc2FnZTpcblx0Ly8gdmFyIG15Q29sb3IgPSBuZXcganNjb2xvcig8dGFyZ2V0RWxlbWVudD4gWywgPG9wdGlvbnM+XSlcblx0Ly9cblxuXHRqc2NvbG9yIDogZnVuY3Rpb24gKHRhcmdldEVsZW1lbnQsIG9wdGlvbnMpIHtcblxuXHRcdC8vIEdlbmVyYWwgb3B0aW9uc1xuXHRcdC8vXG5cdFx0dGhpcy52YWx1ZSA9IG51bGw7IC8vIGluaXRpYWwgSEVYIGNvbG9yLiBUbyBjaGFuZ2UgaXQgbGF0ZXIsIHVzZSBtZXRob2RzIGZyb21TdHJpbmcoKSwgZnJvbUhTVigpIGFuZCBmcm9tUkdCKClcblx0XHR0aGlzLnZhbHVlRWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7IC8vIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGlzcGxheSBhbmQgaW5wdXQgdGhlIGNvbG9yIGNvZGVcblx0XHR0aGlzLnN0eWxlRWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7IC8vIGVsZW1lbnQgdGhhdCB3aWxsIHByZXZpZXcgdGhlIHBpY2tlZCBjb2xvciB1c2luZyBDU1MgYmFja2dyb3VuZENvbG9yXG5cdFx0dGhpcy5yZXF1aXJlZCA9IHRydWU7IC8vIHdoZXRoZXIgdGhlIGFzc29jaWF0ZWQgdGV4dCA8aW5wdXQ+IGNhbiBiZSBsZWZ0IGVtcHR5XG5cdFx0dGhpcy5yZWZpbmUgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIHJlZmluZSB0aGUgZW50ZXJlZCBjb2xvciBjb2RlIChlLmcuIHVwcGVyY2FzZSBpdCBhbmQgcmVtb3ZlIHdoaXRlc3BhY2UpXG5cdFx0dGhpcy5oYXNoID0gZmFsc2U7IC8vIHdoZXRoZXIgdG8gcHJlZml4IHRoZSBIRVggY29sb3IgY29kZSB3aXRoICMgc3ltYm9sXG5cdFx0dGhpcy51cHBlcmNhc2UgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIHVwcGVyY2FzZSB0aGUgY29sb3IgY29kZVxuXHRcdHRoaXMub25GaW5lQ2hhbmdlID0gbnVsbDsgLy8gY2FsbGVkIGluc3RhbnRseSBldmVyeSB0aW1lIHRoZSBjb2xvciBjaGFuZ2VzICh2YWx1ZSBjYW4gYmUgZWl0aGVyIGEgZnVuY3Rpb24gb3IgYSBzdHJpbmcgd2l0aCBqYXZhc2NyaXB0IGNvZGUpXG5cdFx0dGhpcy5hY3RpdmVDbGFzcyA9ICdqc2NvbG9yLWFjdGl2ZSc7IC8vIGNsYXNzIHRvIGJlIHNldCB0byB0aGUgdGFyZ2V0IGVsZW1lbnQgd2hlbiBhIHBpY2tlciB3aW5kb3cgaXMgb3BlbiBvbiBpdFxuXHRcdHRoaXMubWluUyA9IDA7IC8vIG1pbiBhbGxvd2VkIHNhdHVyYXRpb24gKDAgLSAxMDApXG5cdFx0dGhpcy5tYXhTID0gMTAwOyAvLyBtYXggYWxsb3dlZCBzYXR1cmF0aW9uICgwIC0gMTAwKVxuXHRcdHRoaXMubWluViA9IDA7IC8vIG1pbiBhbGxvd2VkIHZhbHVlIChicmlnaHRuZXNzKSAoMCAtIDEwMClcblx0XHR0aGlzLm1heFYgPSAxMDA7IC8vIG1heCBhbGxvd2VkIHZhbHVlIChicmlnaHRuZXNzKSAoMCAtIDEwMClcblxuXHRcdC8vIEFjY2Vzc2luZyB0aGUgcGlja2VkIGNvbG9yXG5cdFx0Ly9cblx0XHR0aGlzLmhzdiA9IFswLCAwLCAxMDBdOyAvLyByZWFkLW9ubHkgIFswLTM2MCwgMC0xMDAsIDAtMTAwXVxuXHRcdHRoaXMucmdiID0gWzI1NSwgMjU1LCAyNTVdOyAvLyByZWFkLW9ubHkgIFswLTI1NSwgMC0yNTUsIDAtMjU1XVxuXG5cdFx0Ly8gQ29sb3IgUGlja2VyIG9wdGlvbnNcblx0XHQvL1xuXHRcdHRoaXMud2lkdGggPSAxODE7IC8vIHdpZHRoIG9mIGNvbG9yIHBhbGV0dGUgKGluIHB4KVxuXHRcdHRoaXMuaGVpZ2h0ID0gMTAxOyAvLyBoZWlnaHQgb2YgY29sb3IgcGFsZXR0ZSAoaW4gcHgpXG5cdFx0dGhpcy5zaG93T25DbGljayA9IHRydWU7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgY29sb3IgcGlja2VyIHdoZW4gdXNlciBjbGlja3Mgb24gaXRzIHRhcmdldCBlbGVtZW50XG5cdFx0dGhpcy5tb2RlID0gJ0hTVic7IC8vIEhTViB8IEhWUyB8IEhTIHwgSFYgLSBsYXlvdXQgb2YgdGhlIGNvbG9yIHBpY2tlciBjb250cm9sc1xuXHRcdHRoaXMucG9zaXRpb24gPSAnYm90dG9tJzsgLy8gbGVmdCB8IHJpZ2h0IHwgdG9wIHwgYm90dG9tIC0gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCBlbGVtZW50XG5cdFx0dGhpcy5zbWFydFBvc2l0aW9uID0gdHJ1ZTsgLy8gYXV0b21hdGljYWxseSBjaGFuZ2UgcGlja2VyIHBvc2l0aW9uIHdoZW4gdGhlcmUgaXMgbm90IGVub3VnaCBzcGFjZSBmb3IgaXRcblx0XHR0aGlzLnNsaWRlclNpemUgPSAxNjsgLy8gcHhcblx0XHR0aGlzLmNyb3NzU2l6ZSA9IDg7IC8vIHB4XG5cdFx0dGhpcy5jbG9zYWJsZSA9IGZhbHNlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgdGhlIENsb3NlIGJ1dHRvblxuXHRcdHRoaXMuY2xvc2VUZXh0ID0gJ0Nsb3NlJztcblx0XHR0aGlzLmJ1dHRvbkNvbG9yID0gJyMwMDAwMDAnOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJ1dHRvbkhlaWdodCA9IDE4OyAvLyBweFxuXHRcdHRoaXMucGFkZGluZyA9IDEyOyAvLyBweFxuXHRcdHRoaXMuYmFja2dyb3VuZENvbG9yID0gJyNGRkZGRkYnOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJvcmRlcldpZHRoID0gMTsgLy8gcHhcblx0XHR0aGlzLmJvcmRlckNvbG9yID0gJyNCQkJCQkInOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJvcmRlclJhZGl1cyA9IDg7IC8vIHB4XG5cdFx0dGhpcy5pbnNldFdpZHRoID0gMTsgLy8gcHhcblx0XHR0aGlzLmluc2V0Q29sb3IgPSAnI0JCQkJCQic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuc2hhZG93ID0gdHJ1ZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHNoYWRvd1xuXHRcdHRoaXMuc2hhZG93Qmx1ciA9IDE1OyAvLyBweFxuXHRcdHRoaXMuc2hhZG93Q29sb3IgPSAncmdiYSgwLDAsMCwwLjIpJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5wb2ludGVyQ29sb3IgPSAnIzRDNEM0Qyc7IC8vIHB4XG5cdFx0dGhpcy5wb2ludGVyQm9yZGVyQ29sb3IgPSAnI0ZGRkZGRic7IC8vIHB4XG4gICAgICAgIHRoaXMucG9pbnRlckJvcmRlcldpZHRoID0gMTsgLy8gcHhcbiAgICAgICAgdGhpcy5wb2ludGVyVGhpY2tuZXNzID0gMjsgLy8gcHhcblx0XHR0aGlzLnpJbmRleCA9IDEwMDA7XG5cdFx0dGhpcy5jb250YWluZXIgPSBudWxsOyAvLyB3aGVyZSB0byBhcHBlbmQgdGhlIGNvbG9yIHBpY2tlciAoQk9EWSBlbGVtZW50IGJ5IGRlZmF1bHQpXG5cblxuXHRcdGZvciAodmFyIG9wdCBpbiBvcHRpb25zKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShvcHQpKSB7XG5cdFx0XHRcdHRoaXNbb3B0XSA9IG9wdGlvbnNbb3B0XTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdHRoaXMuaGlkZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0ZGV0YWNoUGlja2VyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5zaG93ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZHJhd1BpY2tlcigpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMucmVkcmF3ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRkcmF3UGlja2VyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5pbXBvcnRDb2xvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghdGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRcdGlmICghdGhpcy5yZWZpbmUpIHtcblx0XHRcdFx0XHRcdGlmICghdGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWVFbGVtZW50LnZhbHVlLCBqc2MubGVhdmVWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kSW1hZ2U7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmNvbG9yO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoanNjLmxlYXZlVmFsdWUgfCBqc2MubGVhdmVTdHlsZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIGlmICghdGhpcy5yZXF1aXJlZCAmJiAvXlxccyokLy50ZXN0KHRoaXMudmFsdWVFbGVtZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQudmFsdWUgPSAnJztcblx0XHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRJbWFnZTtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5jb2xvcjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoanNjLmxlYXZlVmFsdWUgfCBqc2MubGVhdmVTdHlsZSk7XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdC8vIG1hbmFnZWQgdG8gaW1wb3J0IGNvbG9yIHN1Y2Nlc3NmdWxseSBmcm9tIHRoZSB2YWx1ZSAtPiBPSywgZG9uJ3QgZG8gYW55dGhpbmdcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBub3QgYW4gaW5wdXQgZWxlbWVudCAtPiBkb2Vzbid0IGhhdmUgYW55IHZhbHVlXG5cdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5leHBvcnRDb2xvciA9IGZ1bmN0aW9uIChmbGFncykge1xuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVWYWx1ZSkgJiYgdGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gdGhpcy50b1N0cmluZygpO1xuXHRcdFx0XHRpZiAodGhpcy51cHBlcmNhc2UpIHsgdmFsdWUgPSB2YWx1ZS50b1VwcGVyQ2FzZSgpOyB9XG5cdFx0XHRcdGlmICh0aGlzLmhhc2gpIHsgdmFsdWUgPSAnIycgKyB2YWx1ZTsgfVxuXG5cdFx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVN0eWxlKSkge1xuXHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnbm9uZSc7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgdGhpcy50b1N0cmluZygpO1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5pc0xpZ2h0KCkgPyAnIzAwMCcgOiAnI0ZGRic7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlUGFkKSAmJiBpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0cmVkcmF3UGFkKCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVNsZCkgJiYgaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdHJlZHJhd1NsZCgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdC8vIGg6IDAtMzYwXG5cdFx0Ly8gczogMC0xMDBcblx0XHQvLyB2OiAwLTEwMFxuXHRcdC8vXG5cdFx0dGhpcy5mcm9tSFNWID0gZnVuY3Rpb24gKGgsIHMsIHYsIGZsYWdzKSB7IC8vIG51bGwgPSBkb24ndCBjaGFuZ2Vcblx0XHRcdGlmIChoICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihoKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0aCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDM2MCwgaCkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHMgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHMpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFMsIHMpLCB0aGlzLm1pblMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHYgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHYpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHR2ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFYsIHYpLCB0aGlzLm1pblYpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJnYiA9IEhTVl9SR0IoXG5cdFx0XHRcdGg9PT1udWxsID8gdGhpcy5oc3ZbMF0gOiAodGhpcy5oc3ZbMF09aCksXG5cdFx0XHRcdHM9PT1udWxsID8gdGhpcy5oc3ZbMV0gOiAodGhpcy5oc3ZbMV09cyksXG5cdFx0XHRcdHY9PT1udWxsID8gdGhpcy5oc3ZbMl0gOiAodGhpcy5oc3ZbMl09dilcblx0XHRcdCk7XG5cblx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoZmxhZ3MpO1xuXHRcdH07XG5cblxuXHRcdC8vIHI6IDAtMjU1XG5cdFx0Ly8gZzogMC0yNTVcblx0XHQvLyBiOiAwLTI1NVxuXHRcdC8vXG5cdFx0dGhpcy5mcm9tUkdCID0gZnVuY3Rpb24gKHIsIGcsIGIsIGZsYWdzKSB7IC8vIG51bGwgPSBkb24ndCBjaGFuZ2Vcblx0XHRcdGlmIChyICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihyKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0ciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcikpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGcgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGcpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRnID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCBnKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYiAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oYikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGIpKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGhzdiA9IFJHQl9IU1YoXG5cdFx0XHRcdHI9PT1udWxsID8gdGhpcy5yZ2JbMF0gOiByLFxuXHRcdFx0XHRnPT09bnVsbCA/IHRoaXMucmdiWzFdIDogZyxcblx0XHRcdFx0Yj09PW51bGwgPyB0aGlzLnJnYlsyXSA6IGJcblx0XHRcdCk7XG5cdFx0XHRpZiAoaHN2WzBdICE9PSBudWxsKSB7XG5cdFx0XHRcdHRoaXMuaHN2WzBdID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzYwLCBoc3ZbMF0pKTtcblx0XHRcdH1cblx0XHRcdGlmIChoc3ZbMl0gIT09IDApIHtcblx0XHRcdFx0dGhpcy5oc3ZbMV0gPSBoc3ZbMV09PT1udWxsID8gbnVsbCA6IE1hdGgubWF4KDAsIHRoaXMubWluUywgTWF0aC5taW4oMTAwLCB0aGlzLm1heFMsIGhzdlsxXSkpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5oc3ZbMl0gPSBoc3ZbMl09PT1udWxsID8gbnVsbCA6IE1hdGgubWF4KDAsIHRoaXMubWluViwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFYsIGhzdlsyXSkpO1xuXG5cdFx0XHQvLyB1cGRhdGUgUkdCIGFjY29yZGluZyB0byBmaW5hbCBIU1YsIGFzIHNvbWUgdmFsdWVzIG1pZ2h0IGJlIHRyaW1tZWRcblx0XHRcdHZhciByZ2IgPSBIU1ZfUkdCKHRoaXMuaHN2WzBdLCB0aGlzLmhzdlsxXSwgdGhpcy5oc3ZbMl0pO1xuXHRcdFx0dGhpcy5yZ2JbMF0gPSByZ2JbMF07XG5cdFx0XHR0aGlzLnJnYlsxXSA9IHJnYlsxXTtcblx0XHRcdHRoaXMucmdiWzJdID0gcmdiWzJdO1xuXG5cdFx0XHR0aGlzLmV4cG9ydENvbG9yKGZsYWdzKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLmZyb21TdHJpbmcgPSBmdW5jdGlvbiAoc3RyLCBmbGFncykge1xuXHRcdFx0dmFyIG07XG5cdFx0XHRpZiAobSA9IHN0ci5tYXRjaCgvXlxcVyooWzAtOUEtRl17M30oWzAtOUEtRl17M30pPylcXFcqJC9pKSkge1xuXHRcdFx0XHQvLyBIRVggbm90YXRpb25cblx0XHRcdFx0Ly9cblxuXHRcdFx0XHRpZiAobVsxXS5sZW5ndGggPT09IDYpIHtcblx0XHRcdFx0XHQvLyA2LWNoYXIgbm90YXRpb25cblx0XHRcdFx0XHR0aGlzLmZyb21SR0IoXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cigwLDIpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDIsMiksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoNCwyKSwxNiksXG5cdFx0XHRcdFx0XHRmbGFnc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gMy1jaGFyIG5vdGF0aW9uXG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMCkgKyBtWzFdLmNoYXJBdCgwKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgxKSArIG1bMV0uY2hhckF0KDEpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDIpICsgbVsxXS5jaGFyQXQoMiksMTYpLFxuXHRcdFx0XHRcdFx0ZmxhZ3Ncblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0XHR9IGVsc2UgaWYgKG0gPSBzdHIubWF0Y2goL15cXFcqcmdiYT9cXCgoW14pXSopXFwpXFxXKiQvaSkpIHtcblx0XHRcdFx0dmFyIHBhcmFtcyA9IG1bMV0uc3BsaXQoJywnKTtcblx0XHRcdFx0dmFyIHJlID0gL15cXHMqKFxcZCopKFxcLlxcZCspP1xccyokLztcblx0XHRcdFx0dmFyIG1SLCBtRywgbUI7XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRwYXJhbXMubGVuZ3RoID49IDMgJiZcblx0XHRcdFx0XHQobVIgPSBwYXJhbXNbMF0ubWF0Y2gocmUpKSAmJlxuXHRcdFx0XHRcdChtRyA9IHBhcmFtc1sxXS5tYXRjaChyZSkpICYmXG5cdFx0XHRcdFx0KG1CID0gcGFyYW1zWzJdLm1hdGNoKHJlKSlcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0dmFyIHIgPSBwYXJzZUZsb2F0KChtUlsxXSB8fCAnMCcpICsgKG1SWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dmFyIGcgPSBwYXJzZUZsb2F0KChtR1sxXSB8fCAnMCcpICsgKG1HWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dmFyIGIgPSBwYXJzZUZsb2F0KChtQlsxXSB8fCAnMCcpICsgKG1CWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKHIsIGcsIGIsIGZsYWdzKTtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzBdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKSArXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMV0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpICtcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlsyXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSlcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b0hFWFN0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAnIycgKyB0aGlzLnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvUkdCU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuICgncmdiKCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzBdKSArICcsJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMV0pICsgJywnICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlsyXSkgKyAnKSdcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5pc0xpZ2h0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0MC4yMTMgKiB0aGlzLnJnYlswXSArXG5cdFx0XHRcdDAuNzE1ICogdGhpcy5yZ2JbMV0gK1xuXHRcdFx0XHQwLjA3MiAqIHRoaXMucmdiWzJdID5cblx0XHRcdFx0MjU1IC8gMlxuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLl9wcm9jZXNzUGFyZW50RWxlbWVudHNJbkRPTSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICh0aGlzLl9saW5rZWRFbGVtZW50c1Byb2Nlc3NlZCkgeyByZXR1cm47IH1cblx0XHRcdHRoaXMuX2xpbmtlZEVsZW1lbnRzUHJvY2Vzc2VkID0gdHJ1ZTtcblxuXHRcdFx0dmFyIGVsbSA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblx0XHRcdGRvIHtcblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IG9yIG9uZSBvZiBpdHMgcGFyZW50IG5vZGVzIGhhcyBmaXhlZCBwb3NpdGlvbixcblx0XHRcdFx0Ly8gdGhlbiB1c2UgZml4ZWQgcG9zaXRpb25pbmcgaW5zdGVhZFxuXHRcdFx0XHQvL1xuXHRcdFx0XHQvLyBOb3RlOiBJbiBGaXJlZm94LCBnZXRDb21wdXRlZFN0eWxlIHJldHVybnMgbnVsbCBpbiBhIGhpZGRlbiBpZnJhbWUsXG5cdFx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgcmV0dXJuZWQgc3R5bGUgb2JqZWN0IGlzIG5vbi1lbXB0eVxuXHRcdFx0XHR2YXIgY3VyclN0eWxlID0ganNjLmdldFN0eWxlKGVsbSk7XG5cdFx0XHRcdGlmIChjdXJyU3R5bGUgJiYgY3VyclN0eWxlLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdmaXhlZCcpIHtcblx0XHRcdFx0XHR0aGlzLmZpeGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChlbG0gIT09IHRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0XHRcdC8vIEVuc3VyZSB0byBhdHRhY2ggb25QYXJlbnRTY3JvbGwgb25seSBvbmNlIHRvIGVhY2ggcGFyZW50IGVsZW1lbnRcblx0XHRcdFx0XHQvLyAobXVsdGlwbGUgdGFyZ2V0RWxlbWVudHMgY2FuIHNoYXJlIHRoZSBzYW1lIHBhcmVudCBub2Rlcylcblx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdC8vIE5vdGU6IEl0J3Mgbm90IGp1c3Qgb2Zmc2V0UGFyZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxhYmxlLFxuXHRcdFx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgbm9kZXNcblx0XHRcdFx0XHRpZiAoIWVsbS5fanNjRXZlbnRzQXR0YWNoZWQpIHtcblx0XHRcdFx0XHRcdGpzYy5hdHRhY2hFdmVudChlbG0sICdzY3JvbGwnLCBqc2Mub25QYXJlbnRTY3JvbGwpO1xuXHRcdFx0XHRcdFx0ZWxtLl9qc2NFdmVudHNBdHRhY2hlZCA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IHdoaWxlICgoZWxtID0gZWxtLnBhcmVudE5vZGUpICYmICFqc2MuaXNFbGVtZW50VHlwZShlbG0sICdib2R5JykpO1xuXHRcdH07XG5cblxuXHRcdC8vIHI6IDAtMjU1XG5cdFx0Ly8gZzogMC0yNTVcblx0XHQvLyBiOiAwLTI1NVxuXHRcdC8vXG5cdFx0Ly8gcmV0dXJuczogWyAwLTM2MCwgMC0xMDAsIDAtMTAwIF1cblx0XHQvL1xuXHRcdGZ1bmN0aW9uIFJHQl9IU1YgKHIsIGcsIGIpIHtcblx0XHRcdHIgLz0gMjU1O1xuXHRcdFx0ZyAvPSAyNTU7XG5cdFx0XHRiIC89IDI1NTtcblx0XHRcdHZhciBuID0gTWF0aC5taW4oTWF0aC5taW4ocixnKSxiKTtcblx0XHRcdHZhciB2ID0gTWF0aC5tYXgoTWF0aC5tYXgocixnKSxiKTtcblx0XHRcdHZhciBtID0gdiAtIG47XG5cdFx0XHRpZiAobSA9PT0gMCkgeyByZXR1cm4gWyBudWxsLCAwLCAxMDAgKiB2IF07IH1cblx0XHRcdHZhciBoID0gcj09PW4gPyAzKyhiLWcpL20gOiAoZz09PW4gPyA1KyhyLWIpL20gOiAxKyhnLXIpL20pO1xuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0NjAgKiAoaD09PTY/MDpoKSxcblx0XHRcdFx0MTAwICogKG0vdiksXG5cdFx0XHRcdDEwMCAqIHZcblx0XHRcdF07XG5cdFx0fVxuXG5cblx0XHQvLyBoOiAwLTM2MFxuXHRcdC8vIHM6IDAtMTAwXG5cdFx0Ly8gdjogMC0xMDBcblx0XHQvL1xuXHRcdC8vIHJldHVybnM6IFsgMC0yNTUsIDAtMjU1LCAwLTI1NSBdXG5cdFx0Ly9cblx0XHRmdW5jdGlvbiBIU1ZfUkdCIChoLCBzLCB2KSB7XG5cdFx0XHR2YXIgdSA9IDI1NSAqICh2IC8gMTAwKTtcblxuXHRcdFx0aWYgKGggPT09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIFsgdSwgdSwgdSBdO1xuXHRcdFx0fVxuXG5cdFx0XHRoIC89IDYwO1xuXHRcdFx0cyAvPSAxMDA7XG5cblx0XHRcdHZhciBpID0gTWF0aC5mbG9vcihoKTtcblx0XHRcdHZhciBmID0gaSUyID8gaC1pIDogMS0oaC1pKTtcblx0XHRcdHZhciBtID0gdSAqICgxIC0gcyk7XG5cdFx0XHR2YXIgbiA9IHUgKiAoMSAtIHMgKiBmKTtcblx0XHRcdHN3aXRjaCAoaSkge1xuXHRcdFx0XHRjYXNlIDY6XG5cdFx0XHRcdGNhc2UgMDogcmV0dXJuIFt1LG4sbV07XG5cdFx0XHRcdGNhc2UgMTogcmV0dXJuIFtuLHUsbV07XG5cdFx0XHRcdGNhc2UgMjogcmV0dXJuIFttLHUsbl07XG5cdFx0XHRcdGNhc2UgMzogcmV0dXJuIFttLG4sdV07XG5cdFx0XHRcdGNhc2UgNDogcmV0dXJuIFtuLG0sdV07XG5cdFx0XHRcdGNhc2UgNTogcmV0dXJuIFt1LG0sbl07XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBkZXRhY2hQaWNrZXIgKCkge1xuXHRcdFx0anNjLnVuc2V0Q2xhc3MoVEhJUy50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHRcdGpzYy5waWNrZXIud3JhcC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGpzYy5waWNrZXIud3JhcCk7XG5cdFx0XHRkZWxldGUganNjLnBpY2tlci5vd25lcjtcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGRyYXdQaWNrZXIgKCkge1xuXG5cdFx0XHQvLyBBdCB0aGlzIHBvaW50LCB3aGVuIGRyYXdpbmcgdGhlIHBpY2tlciwgd2Uga25vdyB3aGF0IHRoZSBwYXJlbnQgZWxlbWVudHMgYXJlXG5cdFx0XHQvLyBhbmQgd2UgY2FuIGRvIGFsbCByZWxhdGVkIERPTSBvcGVyYXRpb25zLCBzdWNoIGFzIHJlZ2lzdGVyaW5nIGV2ZW50cyBvbiB0aGVtXG5cdFx0XHQvLyBvciBjaGVja2luZyB0aGVpciBwb3NpdGlvbmluZ1xuXHRcdFx0VEhJUy5fcHJvY2Vzc1BhcmVudEVsZW1lbnRzSW5ET00oKTtcblxuXHRcdFx0aWYgKCFqc2MucGlja2VyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIgPSB7XG5cdFx0XHRcdFx0b3duZXI6IG51bGwsXG5cdFx0XHRcdFx0d3JhcCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJveCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJveFMgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2hhZG93IGFyZWFcblx0XHRcdFx0XHRib3hCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlclxuXHRcdFx0XHRcdHBhZCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdHBhZEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0cGFkTSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBtb3VzZS90b3VjaCBhcmVhXG5cdFx0XHRcdFx0cGFkUGFsIDoganNjLmNyZWF0ZVBhbGV0dGUoKSxcblx0XHRcdFx0XHRjcm9zcyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGNyb3NzQlkgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyIFlcblx0XHRcdFx0XHRjcm9zc0JYIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlciBYXG5cdFx0XHRcdFx0Y3Jvc3NMWSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBsaW5lIFlcblx0XHRcdFx0XHRjcm9zc0xYIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGxpbmUgWFxuXHRcdFx0XHRcdHNsZCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdHNsZEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0c2xkTSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBtb3VzZS90b3VjaCBhcmVhXG5cdFx0XHRcdFx0c2xkR3JhZCA6IGpzYy5jcmVhdGVTbGlkZXJHcmFkaWVudCgpLFxuXHRcdFx0XHRcdHNsZFB0clMgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgc3BhY2VyXG5cdFx0XHRcdFx0c2xkUHRySUIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgaW5uZXIgYm9yZGVyXG5cdFx0XHRcdFx0c2xkUHRyTUIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgbWlkZGxlIGJvcmRlclxuXHRcdFx0XHRcdHNsZFB0ck9CIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIG91dGVyIGJvcmRlclxuXHRcdFx0XHRcdGJ0biA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJ0blQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykgLy8gdGV4dFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGpzYy5waWNrZXIucGFkLmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkUGFsLmVsbSk7XG5cdFx0XHRcdGpzYy5waWNrZXIucGFkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0JZKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzQlgpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NMWSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0xYKTtcblx0XHRcdFx0anNjLnBpY2tlci5wYWRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3MpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZEIpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZE0pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkR3JhZC5lbG0pO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGQpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJPQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyT0IuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJNQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyTUIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJJQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRySUIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJTKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRCKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRNKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLmJ0bi5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJ0blQpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJ0bik7XG5cblx0XHRcdFx0anNjLnBpY2tlci5ib3hCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94KTtcblx0XHRcdFx0anNjLnBpY2tlci53cmFwLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94Uyk7XG5cdFx0XHRcdGpzYy5waWNrZXIud3JhcC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJveEIpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcCA9IGpzYy5waWNrZXI7XG5cblx0XHRcdHZhciBkaXNwbGF5U2xpZGVyID0gISFqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KFRISVMpO1xuXHRcdFx0dmFyIGRpbXMgPSBqc2MuZ2V0UGlja2VyRGltcyhUSElTKTtcblx0XHRcdHZhciBjcm9zc091dGVyU2l6ZSA9ICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAyICogVEhJUy5jcm9zc1NpemUpO1xuXHRcdFx0dmFyIHBhZFRvU2xpZGVyUGFkZGluZyA9IGpzYy5nZXRQYWRUb1NsaWRlclBhZGRpbmcoVEhJUyk7XG5cdFx0XHR2YXIgYm9yZGVyUmFkaXVzID0gTWF0aC5taW4oXG5cdFx0XHRcdFRISVMuYm9yZGVyUmFkaXVzLFxuXHRcdFx0XHRNYXRoLnJvdW5kKFRISVMucGFkZGluZyAqIE1hdGguUEkpKTsgLy8gcHhcblx0XHRcdHZhciBwYWRDdXJzb3IgPSAnY3Jvc3NoYWlyJztcblxuXHRcdFx0Ly8gd3JhcFxuXHRcdFx0cC53cmFwLnN0eWxlLmNsZWFyID0gJ2JvdGgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLndpZHRoID0gKGRpbXNbMF0gKyAyICogVEhJUy5ib3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLmhlaWdodCA9IChkaW1zWzFdICsgMiAqIFRISVMuYm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAud3JhcC5zdHlsZS56SW5kZXggPSBUSElTLnpJbmRleDtcblxuXHRcdFx0Ly8gcGlja2VyXG5cdFx0XHRwLmJveC5zdHlsZS53aWR0aCA9IGRpbXNbMF0gKyAncHgnO1xuXHRcdFx0cC5ib3guc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cblx0XHRcdHAuYm94Uy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmJveFMuc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdHAuYm94Uy5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLmJveFMuc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdFx0XHRwLmJveFMuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuXHRcdFx0anNjLnNldEJvcmRlclJhZGl1cyhwLmJveFMsIGJvcmRlclJhZGl1cyArICdweCcpO1xuXG5cdFx0XHQvLyBwaWNrZXIgYm9yZGVyXG5cdFx0XHRwLmJveEIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJvcmRlciA9IFRISVMuYm9yZGVyV2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJvcmRlckNvbG9yID0gVEhJUy5ib3JkZXJDb2xvcjtcblx0XHRcdHAuYm94Qi5zdHlsZS5iYWNrZ3JvdW5kID0gVEhJUy5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRqc2Muc2V0Qm9yZGVyUmFkaXVzKHAuYm94QiwgYm9yZGVyUmFkaXVzICsgJ3B4Jyk7XG5cblx0XHRcdC8vIElFIGhhY2s6XG5cdFx0XHQvLyBJZiB0aGUgZWxlbWVudCBpcyB0cmFuc3BhcmVudCwgSUUgd2lsbCB0cmlnZ2VyIHRoZSBldmVudCBvbiB0aGUgZWxlbWVudHMgdW5kZXIgaXQsXG5cdFx0XHQvLyBlLmcuIG9uIENhbnZhcyBvciBvbiBlbGVtZW50cyB3aXRoIGJvcmRlclxuXHRcdFx0cC5wYWRNLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5zbGRNLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHQnI0ZGRic7XG5cdFx0XHRqc2Muc2V0U3R5bGUocC5wYWRNLCAnb3BhY2l0eScsICcwJyk7XG5cdFx0XHRqc2Muc2V0U3R5bGUocC5zbGRNLCAnb3BhY2l0eScsICcwJyk7XG5cblx0XHRcdC8vIHBhZFxuXHRcdFx0cC5wYWQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0cC5wYWQuc3R5bGUud2lkdGggPSBUSElTLndpZHRoICsgJ3B4Jztcblx0XHRcdHAucGFkLnN0eWxlLmhlaWdodCA9IFRISVMuaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0Ly8gcGFkIHBhbGV0dGVzIChIU1YgYW5kIEhWUylcblx0XHRcdHAucGFkUGFsLmRyYXcoVEhJUy53aWR0aCwgVEhJUy5oZWlnaHQsIGpzYy5nZXRQYWRZQ29tcG9uZW50KFRISVMpKTtcblxuXHRcdFx0Ly8gcGFkIGJvcmRlclxuXHRcdFx0cC5wYWRCLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAucGFkQi5zdHlsZS5sZWZ0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAucGFkQi5zdHlsZS50b3AgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmluc2V0Q29sb3I7XG5cblx0XHRcdC8vIHBhZCBtb3VzZSBhcmVhXG5cdFx0XHRwLnBhZE0uX2pzY0luc3RhbmNlID0gVEhJUztcblx0XHRcdHAucGFkTS5fanNjQ29udHJvbE5hbWUgPSAncGFkJztcblx0XHRcdHAucGFkTS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnBhZE0uc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdHAucGFkTS5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUud2lkdGggPSAoVEhJUy5wYWRkaW5nICsgMiAqIFRISVMuaW5zZXRXaWR0aCArIFRISVMud2lkdGggKyBwYWRUb1NsaWRlclBhZGRpbmcgLyAyKSArICdweCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUuY3Vyc29yID0gcGFkQ3Vyc29yO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3Ncblx0XHRcdHAuY3Jvc3Muc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zcy5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3Muc3R5bGUudG9wID1cblx0XHRcdFx0JzAnO1xuXHRcdFx0cC5jcm9zcy5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdGNyb3NzT3V0ZXJTaXplICsgJ3B4JztcblxuXHRcdFx0Ly8gcGFkIGNyb3NzIGJvcmRlciBZIGFuZCBYXG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdFx0J2Fic29sdXRlJztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQm9yZGVyQ29sb3I7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdCgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLndpZHRoID1cblx0XHRcdFx0Y3Jvc3NPdXRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLnRvcCA9XG5cdFx0XHRcdChNYXRoLmZsb29yKGNyb3NzT3V0ZXJTaXplIC8gMikgLSBNYXRoLmZsb29yKFRISVMucG9pbnRlclRoaWNrbmVzcyAvIDIpIC0gVEhJUy5wb2ludGVyQm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS50b3AgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmxlZnQgPVxuXHRcdFx0XHQnMCc7XG5cblx0XHRcdC8vIHBhZCBjcm9zcyBsaW5lIFkgYW5kIFhcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0XHQnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJDb2xvcjtcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLndpZHRoID1cblx0XHRcdFx0KGNyb3NzT3V0ZXJTaXplIC0gMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdFRISVMucG9pbnRlclRoaWNrbmVzcyArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUudG9wID1cblx0XHRcdFx0KE1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKSAtIE1hdGguZmxvb3IoVEhJUy5wb2ludGVyVGhpY2tuZXNzIC8gMikpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS50b3AgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmxlZnQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArICdweCc7XG5cblx0XHRcdC8vIHNsaWRlclxuXHRcdFx0cC5zbGQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0XHRcdHAuc2xkLnN0eWxlLndpZHRoID0gVEhJUy5zbGlkZXJTaXplICsgJ3B4Jztcblx0XHRcdHAuc2xkLnN0eWxlLmhlaWdodCA9IFRISVMuaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0Ly8gc2xpZGVyIGdyYWRpZW50XG5cdFx0XHRwLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCAnIzAwMCcsICcjMDAwJyk7XG5cblx0XHRcdC8vIHNsaWRlciBib3JkZXJcblx0XHRcdHAuc2xkQi5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheVNsaWRlciA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLnNsZEIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnJpZ2h0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuc2xkQi5zdHlsZS50b3AgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmluc2V0Q29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBtb3VzZSBhcmVhXG5cdFx0XHRwLnNsZE0uX2pzY0luc3RhbmNlID0gVEhJUztcblx0XHRcdHAuc2xkTS5fanNjQ29udHJvbE5hbWUgPSAnc2xkJztcblx0XHRcdHAuc2xkTS5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheVNsaWRlciA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLnNsZE0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnJpZ2h0ID0gJzAnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAuc2xkTS5zdHlsZS53aWR0aCA9IChUSElTLnNsaWRlclNpemUgKyBwYWRUb1NsaWRlclBhZGRpbmcgLyAyICsgVEhJUy5wYWRkaW5nICsgMiAqIFRISVMuaW5zZXRXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmhlaWdodCA9IGRpbXNbMV0gKyAncHgnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgaW5uZXIgYW5kIG91dGVyIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJJQi5zdHlsZS5ib3JkZXIgPVxuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5ib3JkZXIgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArICdweCBzb2xpZCAnICsgVEhJUy5wb2ludGVyQm9yZGVyQ29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIG91dGVyIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLmxlZnQgPSAtKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgKyAncHgnO1xuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS50b3AgPSAnMCc7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIG1pZGRsZSBib3JkZXJcblx0XHRcdHAuc2xkUHRyTUIuc3R5bGUuYm9yZGVyID0gVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgJ3B4IHNvbGlkICcgKyBUSElTLnBvaW50ZXJDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgc3BhY2VyXG5cdFx0XHRwLnNsZFB0clMuc3R5bGUud2lkdGggPSBUSElTLnNsaWRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5zbGRQdHJTLnN0eWxlLmhlaWdodCA9IHNsaWRlclB0clNwYWNlICsgJ3B4JztcblxuXHRcdFx0Ly8gdGhlIENsb3NlIGJ1dHRvblxuXHRcdFx0ZnVuY3Rpb24gc2V0QnRuQm9yZGVyICgpIHtcblx0XHRcdFx0dmFyIGluc2V0Q29sb3JzID0gVEhJUy5pbnNldENvbG9yLnNwbGl0KC9cXHMrLyk7XG5cdFx0XHRcdHZhciBvdXRzZXRDb2xvciA9IGluc2V0Q29sb3JzLmxlbmd0aCA8IDIgPyBpbnNldENvbG9yc1swXSA6IGluc2V0Q29sb3JzWzFdICsgJyAnICsgaW5zZXRDb2xvcnNbMF0gKyAnICcgKyBpbnNldENvbG9yc1swXSArICcgJyArIGluc2V0Q29sb3JzWzFdO1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5ib3JkZXJDb2xvciA9IG91dHNldENvbG9yO1xuXHRcdFx0fVxuXHRcdFx0cC5idG4uc3R5bGUuZGlzcGxheSA9IFRISVMuY2xvc2FibGUgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdFx0cC5idG4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5idG4uc3R5bGUubGVmdCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5ib3R0b20gPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUucGFkZGluZyA9ICcwIDE1cHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuaGVpZ2h0ID0gVEhJUy5idXR0b25IZWlnaHQgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHNldEJ0bkJvcmRlcigpO1xuXHRcdFx0cC5idG4uc3R5bGUuY29sb3IgPSBUSElTLmJ1dHRvbkNvbG9yO1xuXHRcdFx0cC5idG4uc3R5bGUuZm9udCA9ICcxMnB4IHNhbnMtc2VyaWYnO1xuXHRcdFx0cC5idG4uc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcic7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG5cdFx0XHR9IGNhdGNoKGVPbGRJRSkge1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5jdXJzb3IgPSAnaGFuZCc7XG5cdFx0XHR9XG5cdFx0XHRwLmJ0bi5vbm1vdXNlZG93biA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0VEhJUy5oaWRlKCk7XG5cdFx0XHR9O1xuXHRcdFx0cC5idG5ULnN0eWxlLmxpbmVIZWlnaHQgPSBUSElTLmJ1dHRvbkhlaWdodCArICdweCc7XG5cdFx0XHRwLmJ0blQuaW5uZXJIVE1MID0gJyc7XG5cdFx0XHRwLmJ0blQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoVEhJUy5jbG9zZVRleHQpKTtcblxuXHRcdFx0Ly8gcGxhY2UgcG9pbnRlcnNcblx0XHRcdHJlZHJhd1BhZCgpO1xuXHRcdFx0cmVkcmF3U2xkKCk7XG5cblx0XHRcdC8vIElmIHdlIGFyZSBjaGFuZ2luZyB0aGUgb3duZXIgd2l0aG91dCBmaXJzdCBjbG9zaW5nIHRoZSBwaWNrZXIsXG5cdFx0XHQvLyBtYWtlIHN1cmUgdG8gZmlyc3QgZGVhbCB3aXRoIHRoZSBvbGQgb3duZXJcblx0XHRcdGlmIChqc2MucGlja2VyLm93bmVyICYmIGpzYy5waWNrZXIub3duZXIgIT09IFRISVMpIHtcblx0XHRcdFx0anNjLnVuc2V0Q2xhc3MoanNjLnBpY2tlci5vd25lci50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2V0IHRoZSBuZXcgcGlja2VyIG93bmVyXG5cdFx0XHRqc2MucGlja2VyLm93bmVyID0gVEhJUztcblxuXHRcdFx0Ly8gVGhlIHJlZHJhd1Bvc2l0aW9uKCkgbWV0aG9kIG5lZWRzIHBpY2tlci5vd25lciB0byBiZSBzZXQsIHRoYXQncyB3aHkgd2UgY2FsbCBpdCBoZXJlLFxuXHRcdFx0Ly8gYWZ0ZXIgc2V0dGluZyB0aGUgb3duZXJcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZShjb250YWluZXIsICdib2R5JykpIHtcblx0XHRcdFx0anNjLnJlZHJhd1Bvc2l0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRqc2MuX2RyYXdQb3NpdGlvbihUSElTLCAwLCAwLCAncmVsYXRpdmUnLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChwLndyYXAucGFyZW50Tm9kZSAhPSBjb250YWluZXIpIHtcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHAud3JhcCk7XG5cdFx0XHR9XG5cblx0XHRcdGpzYy5zZXRDbGFzcyhUSElTLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gcmVkcmF3UGFkICgpIHtcblx0XHRcdC8vIHJlZHJhdyB0aGUgcGFkIHBvaW50ZXJcblx0XHRcdHN3aXRjaCAoanNjLmdldFBhZFlDb21wb25lbnQoVEhJUykpIHtcblx0XHRcdGNhc2UgJ3MnOiB2YXIgeUNvbXBvbmVudCA9IDE7IGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6IHZhciB5Q29tcG9uZW50ID0gMjsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHR2YXIgeCA9IE1hdGgucm91bmQoKFRISVMuaHN2WzBdIC8gMzYwKSAqIChUSElTLndpZHRoIC0gMSkpO1xuXHRcdFx0dmFyIHkgPSBNYXRoLnJvdW5kKCgxIC0gVEhJUy5oc3ZbeUNvbXBvbmVudF0gLyAxMDApICogKFRISVMuaGVpZ2h0IC0gMSkpO1xuXHRcdFx0dmFyIGNyb3NzT3V0ZXJTaXplID0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcyArIDIgKiBUSElTLmNyb3NzU2l6ZSk7XG5cdFx0XHR2YXIgb2ZzID0gLU1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKTtcblx0XHRcdGpzYy5waWNrZXIuY3Jvc3Muc3R5bGUubGVmdCA9ICh4ICsgb2ZzKSArICdweCc7XG5cdFx0XHRqc2MucGlja2VyLmNyb3NzLnN0eWxlLnRvcCA9ICh5ICsgb2ZzKSArICdweCc7XG5cblx0XHRcdC8vIHJlZHJhdyB0aGUgc2xpZGVyXG5cdFx0XHRzd2l0Y2ggKGpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUykpIHtcblx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHR2YXIgcmdiMSA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIDEwMCwgVEhJUy5oc3ZbMl0pO1xuXHRcdFx0XHR2YXIgcmdiMiA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIDAsIFRISVMuaHN2WzJdKTtcblx0XHRcdFx0dmFyIGNvbG9yMSA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzJdKSArICcpJztcblx0XHRcdFx0dmFyIGNvbG9yMiA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzJdKSArICcpJztcblx0XHRcdFx0anNjLnBpY2tlci5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgY29sb3IxLCBjb2xvcjIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHR2YXIgcmdiID0gSFNWX1JHQihUSElTLmhzdlswXSwgVEhJUy5oc3ZbMV0sIDEwMCk7XG5cdFx0XHRcdHZhciBjb2xvcjEgPSAncmdiKCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlsyXSkgKyAnKSc7XG5cdFx0XHRcdHZhciBjb2xvcjIgPSAnIzAwMCc7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsIGNvbG9yMSwgY29sb3IyKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiByZWRyYXdTbGQgKCkge1xuXHRcdFx0dmFyIHNsZENvbXBvbmVudCA9IGpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUyk7XG5cdFx0XHRpZiAoc2xkQ29tcG9uZW50KSB7XG5cdFx0XHRcdC8vIHJlZHJhdyB0aGUgc2xpZGVyIHBvaW50ZXJcblx0XHRcdFx0c3dpdGNoIChzbGRDb21wb25lbnQpIHtcblx0XHRcdFx0Y2FzZSAncyc6IHZhciB5Q29tcG9uZW50ID0gMTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOiB2YXIgeUNvbXBvbmVudCA9IDI7IGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciB5ID0gTWF0aC5yb3VuZCgoMSAtIFRISVMuaHN2W3lDb21wb25lbnRdIC8gMTAwKSAqIChUSElTLmhlaWdodCAtIDEpKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJPQi5zdHlsZS50b3AgPSAoeSAtICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpIC0gTWF0aC5mbG9vcihzbGlkZXJQdHJTcGFjZSAvIDIpKSArICdweCc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBpc1BpY2tlck93bmVyICgpIHtcblx0XHRcdHJldHVybiBqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIgPT09IFRISVM7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBibHVyVmFsdWUgKCkge1xuXHRcdFx0VEhJUy5pbXBvcnRDb2xvcigpO1xuXHRcdH1cblxuXG5cdFx0Ly8gRmluZCB0aGUgdGFyZ2V0IGVsZW1lbnRcblx0XHRpZiAodHlwZW9mIHRhcmdldEVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHR2YXIgaWQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0dmFyIGVsbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblx0XHRcdGlmIChlbG0pIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gZWxtO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0anNjLndhcm4oJ0NvdWxkIG5vdCBmaW5kIHRhcmdldCBlbGVtZW50IHdpdGggSUQgXFwnJyArIGlkICsgJ1xcJycpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0anNjLndhcm4oJ0ludmFsaWQgdGFyZ2V0IGVsZW1lbnQ6IFxcJycgKyB0YXJnZXRFbGVtZW50ICsgJ1xcJycpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRqc2Mud2FybignQ2Fubm90IGxpbmsganNjb2xvciB0d2ljZSB0byB0aGUgc2FtZSBlbGVtZW50LiBTa2lwcGluZy4nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50Ll9qc2NMaW5rZWRJbnN0YW5jZSA9IHRoaXM7XG5cblx0XHQvLyBGaW5kIHRoZSB2YWx1ZSBlbGVtZW50XG5cdFx0dGhpcy52YWx1ZUVsZW1lbnQgPSBqc2MuZmV0Y2hFbGVtZW50KHRoaXMudmFsdWVFbGVtZW50KTtcblx0XHQvLyBGaW5kIHRoZSBzdHlsZSBlbGVtZW50XG5cdFx0dGhpcy5zdHlsZUVsZW1lbnQgPSBqc2MuZmV0Y2hFbGVtZW50KHRoaXMuc3R5bGVFbGVtZW50KTtcblxuXHRcdHZhciBUSElTID0gdGhpcztcblx0XHR2YXIgY29udGFpbmVyID1cblx0XHRcdHRoaXMuY29udGFpbmVyID9cblx0XHRcdGpzYy5mZXRjaEVsZW1lbnQodGhpcy5jb250YWluZXIpIDpcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG5cdFx0dmFyIHNsaWRlclB0clNwYWNlID0gMzsgLy8gcHhcblxuXHRcdC8vIEZvciBCVVRUT04gZWxlbWVudHMgaXQncyBpbXBvcnRhbnQgdG8gc3RvcCB0aGVtIGZyb20gc2VuZGluZyB0aGUgZm9ybSB3aGVuIGNsaWNrZWRcblx0XHQvLyAoZS5nLiBpbiBTYWZhcmkpXG5cdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudGFyZ2V0RWxlbWVudCwgJ2J1dHRvbicpKSB7XG5cdFx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2spIHtcblx0XHRcdFx0dmFyIG9yaWdDYWxsYmFjayA9IHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrO1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uIChldnQpIHtcblx0XHRcdFx0XHRvcmlnQ2FsbGJhY2suY2FsbCh0aGlzLCBldnQpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Lypcblx0XHR2YXIgZWxtID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXHRcdGRvIHtcblx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBvciBvbmUgb2YgaXRzIG9mZnNldFBhcmVudHMgaGFzIGZpeGVkIHBvc2l0aW9uLFxuXHRcdFx0Ly8gdGhlbiB1c2UgZml4ZWQgcG9zaXRpb25pbmcgaW5zdGVhZFxuXHRcdFx0Ly9cblx0XHRcdC8vIE5vdGU6IEluIEZpcmVmb3gsIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBudWxsIGluIGEgaGlkZGVuIGlmcmFtZSxcblx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgcmV0dXJuZWQgc3R5bGUgb2JqZWN0IGlzIG5vbi1lbXB0eVxuXHRcdFx0dmFyIGN1cnJTdHlsZSA9IGpzYy5nZXRTdHlsZShlbG0pO1xuXHRcdFx0aWYgKGN1cnJTdHlsZSAmJiBjdXJyU3R5bGUucG9zaXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2ZpeGVkJykge1xuXHRcdFx0XHR0aGlzLmZpeGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGVsbSAhPT0gdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRcdC8vIGF0dGFjaCBvblBhcmVudFNjcm9sbCBzbyB0aGF0IHdlIGNhbiByZWNvbXB1dGUgdGhlIHBpY2tlciBwb3NpdGlvblxuXHRcdFx0XHQvLyB3aGVuIG9uZSBvZiB0aGUgb2Zmc2V0UGFyZW50cyBpcyBzY3JvbGxlZFxuXHRcdFx0XHRpZiAoIWVsbS5fanNjRXZlbnRzQXR0YWNoZWQpIHtcblx0XHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQoZWxtLCAnc2Nyb2xsJywganNjLm9uUGFyZW50U2Nyb2xsKTtcblx0XHRcdFx0XHRlbG0uX2pzY0V2ZW50c0F0dGFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gd2hpbGUgKChlbG0gPSBlbG0ub2Zmc2V0UGFyZW50KSAmJiAhanNjLmlzRWxlbWVudFR5cGUoZWxtLCAnYm9keScpKTtcblx0XHQqL1xuXG5cdFx0Ly8gdmFsdWVFbGVtZW50XG5cdFx0aWYgKHRoaXMudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdHZhciB1cGRhdGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRUSElTLmZyb21TdHJpbmcoVEhJUy52YWx1ZUVsZW1lbnQudmFsdWUsIGpzYy5sZWF2ZVZhbHVlKTtcblx0XHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKFRISVMpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdrZXl1cCcsIHVwZGF0ZUZpZWxkKTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnLCB1cGRhdGVGaWVsZCk7XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2JsdXInLCBibHVyVmFsdWUpO1xuXHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBzdHlsZUVsZW1lbnRcblx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUgPSB7XG5cdFx0XHRcdGJhY2tncm91bmRJbWFnZSA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSxcblx0XHRcdFx0YmFja2dyb3VuZENvbG9yIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yLFxuXHRcdFx0XHRjb2xvciA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnZhbHVlKSB7XG5cdFx0XHQvLyBUcnkgdG8gc2V0IHRoZSBjb2xvciBmcm9tIHRoZSAudmFsdWUgb3B0aW9uIGFuZCBpZiB1bnN1Y2Nlc3NmdWwsXG5cdFx0XHQvLyBleHBvcnQgdGhlIGN1cnJlbnQgY29sb3Jcblx0XHRcdHRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlKSB8fCB0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW1wb3J0Q29sb3IoKTtcblx0XHR9XG5cdH1cblxufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQdWJsaWMgcHJvcGVydGllcyBhbmQgbWV0aG9kc1xuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cbi8vIEJ5IGRlZmF1bHQsIHNlYXJjaCBmb3IgYWxsIGVsZW1lbnRzIHdpdGggY2xhc3M9XCJqc2NvbG9yXCIgYW5kIGluc3RhbGwgYSBjb2xvciBwaWNrZXIgb24gdGhlbS5cbi8vXG4vLyBZb3UgY2FuIGNoYW5nZSB3aGF0IGNsYXNzIG5hbWUgd2lsbCBiZSBsb29rZWQgZm9yIGJ5IHNldHRpbmcgdGhlIHByb3BlcnR5IGpzY29sb3IubG9va3VwQ2xhc3Ncbi8vIGFueXdoZXJlIGluIHlvdXIgSFRNTCBkb2N1bWVudC4gVG8gY29tcGxldGVseSBkaXNhYmxlIHRoZSBhdXRvbWF0aWMgbG9va3VwLCBzZXQgaXQgdG8gbnVsbC5cbi8vXG5qc2MuanNjb2xvci5sb29rdXBDbGFzcyA9ICdqc2NvbG9yJztcblxuXG5qc2MuanNjb2xvci5pbnN0YWxsQnlDbGFzc05hbWUgPSBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG5cdHZhciBpbnB1dEVsbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKTtcblx0dmFyIGJ1dHRvbkVsbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJyk7XG5cblx0anNjLnRyeUluc3RhbGxPbkVsZW1lbnRzKGlucHV0RWxtcywgY2xhc3NOYW1lKTtcblx0anNjLnRyeUluc3RhbGxPbkVsZW1lbnRzKGJ1dHRvbkVsbXMsIGNsYXNzTmFtZSk7XG59O1xuXG5cbmpzYy5yZWdpc3RlcigpO1xuXG5cbnJldHVybiBqc2MuanNjb2xvcjtcblxuXG59KSgpOyB9XG4iLCIvKiEgdmV4LmNvbWJpbmVkLmpzOiB2ZXggMy4xLjEsIHZleC1kaWFsb2cgMS4wLjcgKi9cbiFmdW5jdGlvbihhKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSltb2R1bGUuZXhwb3J0cz1hKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKFtdLGEpO2Vsc2V7dmFyIGI7Yj1cInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOnRoaXMsYi52ZXg9YSgpfX0oZnVuY3Rpb24oKXt2YXIgYTtyZXR1cm4gZnVuY3Rpb24gYihhLGMsZCl7ZnVuY3Rpb24gZShnLGgpe2lmKCFjW2ddKXtpZighYVtnXSl7dmFyIGk9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighaCYmaSlyZXR1cm4gaShnLCEwKTtpZihmKXJldHVybiBmKGcsITApO3ZhciBqPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrZytcIidcIik7dGhyb3cgai5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGp9dmFyIGs9Y1tnXT17ZXhwb3J0czp7fX07YVtnXVswXS5jYWxsKGsuZXhwb3J0cyxmdW5jdGlvbihiKXt2YXIgYz1hW2ddWzFdW2JdO3JldHVybiBlKGM/YzpiKX0sayxrLmV4cG9ydHMsYixhLGMsZCl9cmV0dXJuIGNbZ10uZXhwb3J0c31mb3IodmFyIGY9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxnPTA7ZzxkLmxlbmd0aDtnKyspZShkW2ddKTtyZXR1cm4gZX0oezE6W2Z1bmN0aW9uKGEsYixjKXtcImRvY3VtZW50XCJpbiB3aW5kb3cuc2VsZiYmKFwiY2xhc3NMaXN0XCJpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSYmKCFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlN8fFwiY2xhc3NMaXN0XCJpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSk/IWZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7aWYoYS5jbGFzc0xpc3QuYWRkKFwiYzFcIixcImMyXCIpLCFhLmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKXt2YXIgYj1mdW5jdGlvbihhKXt2YXIgYj1ET01Ub2tlbkxpc3QucHJvdG90eXBlW2FdO0RPTVRva2VuTGlzdC5wcm90b3R5cGVbYV09ZnVuY3Rpb24oYSl7dmFyIGMsZD1hcmd1bWVudHMubGVuZ3RoO2ZvcihjPTA7YzxkO2MrKylhPWFyZ3VtZW50c1tjXSxiLmNhbGwodGhpcyxhKX19O2IoXCJhZGRcIiksYihcInJlbW92ZVwiKX1pZihhLmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCExKSxhLmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKXt2YXIgYz1ET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZT1mdW5jdGlvbihhLGIpe3JldHVybiAxIGluIGFyZ3VtZW50cyYmIXRoaXMuY29udGFpbnMoYSk9PSFiP2I6Yy5jYWxsKHRoaXMsYSl9fWE9bnVsbH0oKTohZnVuY3Rpb24oYSl7XCJ1c2Ugc3RyaWN0XCI7aWYoXCJFbGVtZW50XCJpbiBhKXt2YXIgYj1cImNsYXNzTGlzdFwiLGM9XCJwcm90b3R5cGVcIixkPWEuRWxlbWVudFtjXSxlPU9iamVjdCxmPVN0cmluZ1tjXS50cmltfHxmdW5jdGlvbigpe3JldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIil9LGc9QXJyYXlbY10uaW5kZXhPZnx8ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPTAsYz10aGlzLmxlbmd0aDtiPGM7YisrKWlmKGIgaW4gdGhpcyYmdGhpc1tiXT09PWEpcmV0dXJuIGI7cmV0dXJuLTF9LGg9ZnVuY3Rpb24oYSxiKXt0aGlzLm5hbWU9YSx0aGlzLmNvZGU9RE9NRXhjZXB0aW9uW2FdLHRoaXMubWVzc2FnZT1ifSxpPWZ1bmN0aW9uKGEsYil7aWYoXCJcIj09PWIpdGhyb3cgbmV3IGgoXCJTWU5UQVhfRVJSXCIsXCJBbiBpbnZhbGlkIG9yIGlsbGVnYWwgc3RyaW5nIHdhcyBzcGVjaWZpZWRcIik7aWYoL1xccy8udGVzdChiKSl0aHJvdyBuZXcgaChcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiLFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCIpO3JldHVybiBnLmNhbGwoYSxiKX0saj1mdW5jdGlvbihhKXtmb3IodmFyIGI9Zi5jYWxsKGEuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIil8fFwiXCIpLGM9Yj9iLnNwbGl0KC9cXHMrLyk6W10sZD0wLGU9Yy5sZW5ndGg7ZDxlO2QrKyl0aGlzLnB1c2goY1tkXSk7dGhpcy5fdXBkYXRlQ2xhc3NOYW1lPWZ1bmN0aW9uKCl7YS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLHRoaXMudG9TdHJpbmcoKSl9fSxrPWpbY109W10sbD1mdW5jdGlvbigpe3JldHVybiBuZXcgaih0aGlzKX07aWYoaFtjXT1FcnJvcltjXSxrLml0ZW09ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXNbYV18fG51bGx9LGsuY29udGFpbnM9ZnVuY3Rpb24oYSl7cmV0dXJuIGErPVwiXCIsaSh0aGlzLGEpIT09LTF9LGsuYWRkPWZ1bmN0aW9uKCl7dmFyIGEsYj1hcmd1bWVudHMsYz0wLGQ9Yi5sZW5ndGgsZT0hMTtkbyBhPWJbY10rXCJcIixpKHRoaXMsYSk9PT0tMSYmKHRoaXMucHVzaChhKSxlPSEwKTt3aGlsZSgrK2M8ZCk7ZSYmdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCl9LGsucmVtb3ZlPWZ1bmN0aW9uKCl7dmFyIGEsYixjPWFyZ3VtZW50cyxkPTAsZT1jLmxlbmd0aCxmPSExO2RvIGZvcihhPWNbZF0rXCJcIixiPWkodGhpcyxhKTtiIT09LTE7KXRoaXMuc3BsaWNlKGIsMSksZj0hMCxiPWkodGhpcyxhKTt3aGlsZSgrK2Q8ZSk7ZiYmdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCl9LGsudG9nZ2xlPWZ1bmN0aW9uKGEsYil7YSs9XCJcIjt2YXIgYz10aGlzLmNvbnRhaW5zKGEpLGQ9Yz9iIT09ITAmJlwicmVtb3ZlXCI6YiE9PSExJiZcImFkZFwiO3JldHVybiBkJiZ0aGlzW2RdKGEpLGI9PT0hMHx8Yj09PSExP2I6IWN9LGsudG9TdHJpbmc9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5qb2luKFwiIFwiKX0sZS5kZWZpbmVQcm9wZXJ0eSl7dmFyIG09e2dldDpsLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwfTt0cnl7ZS5kZWZpbmVQcm9wZXJ0eShkLGIsbSl9Y2F0Y2gobil7bi5udW1iZXI9PT0tMjE0NjgyMzI1MiYmKG0uZW51bWVyYWJsZT0hMSxlLmRlZmluZVByb3BlcnR5KGQsYixtKSl9fWVsc2UgZVtjXS5fX2RlZmluZUdldHRlcl9fJiZkLl9fZGVmaW5lR2V0dGVyX18oYixsKX19KHdpbmRvdy5zZWxmKSl9LHt9XSwyOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIik7Ynx8KGI9ZG9jdW1lbnQpO3ZhciBjPS88KFtcXHc6XSspLy5leGVjKGEpO2lmKCFjKXJldHVybiBiLmNyZWF0ZVRleHROb2RlKGEpO2E9YS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpO3ZhciBkPWNbMV07aWYoXCJib2R5XCI9PWQpe3ZhciBlPWIuY3JlYXRlRWxlbWVudChcImh0bWxcIik7cmV0dXJuIGUuaW5uZXJIVE1MPWEsZS5yZW1vdmVDaGlsZChlLmxhc3RDaGlsZCl9dmFyIGY9Z1tkXXx8Zy5fZGVmYXVsdCxoPWZbMF0saT1mWzFdLGo9ZlsyXSxlPWIuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IoZS5pbm5lckhUTUw9aSthK2o7aC0tOyllPWUubGFzdENoaWxkO2lmKGUuZmlyc3RDaGlsZD09ZS5sYXN0Q2hpbGQpcmV0dXJuIGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKTtmb3IodmFyIGs9Yi5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7ZS5maXJzdENoaWxkOylrLmFwcGVuZENoaWxkKGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKSk7cmV0dXJuIGt9Yi5leHBvcnRzPWQ7dmFyIGUsZj0hMTtcInVuZGVmaW5lZFwiIT10eXBlb2YgZG9jdW1lbnQmJihlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksZS5pbm5lckhUTUw9JyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nLGY9IWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaW5rXCIpLmxlbmd0aCxlPXZvaWQgMCk7dmFyIGc9e2xlZ2VuZDpbMSxcIjxmaWVsZHNldD5cIixcIjwvZmllbGRzZXQ+XCJdLHRyOlsyLFwiPHRhYmxlPjx0Ym9keT5cIixcIjwvdGJvZHk+PC90YWJsZT5cIl0sY29sOlsyLFwiPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD5cIixcIjwvY29sZ3JvdXA+PC90YWJsZT5cIl0sX2RlZmF1bHQ6Zj9bMSxcIlg8ZGl2PlwiLFwiPC9kaXY+XCJdOlswLFwiXCIsXCJcIl19O2cudGQ9Zy50aD1bMyxcIjx0YWJsZT48dGJvZHk+PHRyPlwiLFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCJdLGcub3B0aW9uPWcub3B0Z3JvdXA9WzEsJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsXCI8L3NlbGVjdD5cIl0sZy50aGVhZD1nLnRib2R5PWcuY29sZ3JvdXA9Zy5jYXB0aW9uPWcudGZvb3Q9WzEsXCI8dGFibGU+XCIsXCI8L3RhYmxlPlwiXSxnLnBvbHlsaW5lPWcuZWxsaXBzZT1nLnBvbHlnb249Zy5jaXJjbGU9Zy50ZXh0PWcubGluZT1nLnBhdGg9Zy5yZWN0PWcuZz1bMSwnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsXCI8L3N2Zz5cIl19LHt9XSwzOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhLGIpe2lmKHZvaWQgMD09PWF8fG51bGw9PT1hKXRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29udmVydCBmaXJzdCBhcmd1bWVudCB0byBvYmplY3RcIik7Zm9yKHZhciBjPU9iamVjdChhKSxkPTE7ZDxhcmd1bWVudHMubGVuZ3RoO2QrKyl7dmFyIGU9YXJndW1lbnRzW2RdO2lmKHZvaWQgMCE9PWUmJm51bGwhPT1lKWZvcih2YXIgZj1PYmplY3Qua2V5cyhPYmplY3QoZSkpLGc9MCxoPWYubGVuZ3RoO2c8aDtnKyspe3ZhciBpPWZbZ10saj1PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGUsaSk7dm9pZCAwIT09aiYmai5lbnVtZXJhYmxlJiYoY1tpXT1lW2ldKX19cmV0dXJuIGN9ZnVuY3Rpb24gZSgpe09iamVjdC5hc3NpZ258fE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsXCJhc3NpZ25cIix7ZW51bWVyYWJsZTohMSxjb25maWd1cmFibGU6ITAsd3JpdGFibGU6ITAsdmFsdWU6ZH0pfWIuZXhwb3J0cz17YXNzaWduOmQscG9seWZpbGw6ZX19LHt9XSw0OltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe1wib2JqZWN0XCIhPXR5cGVvZiBiP2I9e2hhc2g6ISFifTp2b2lkIDA9PT1iLmhhc2gmJihiLmhhc2g9ITApO2Zvcih2YXIgYz1iLmhhc2g/e306XCJcIixkPWIuc2VyaWFsaXplcnx8KGIuaGFzaD9nOmgpLGU9YSYmYS5lbGVtZW50cz9hLmVsZW1lbnRzOltdLGY9T2JqZWN0LmNyZWF0ZShudWxsKSxrPTA7azxlLmxlbmd0aDsrK2spe3ZhciBsPWVba107aWYoKGIuZGlzYWJsZWR8fCFsLmRpc2FibGVkKSYmbC5uYW1lJiZqLnRlc3QobC5ub2RlTmFtZSkmJiFpLnRlc3QobC50eXBlKSl7dmFyIG09bC5uYW1lLG49bC52YWx1ZTtpZihcImNoZWNrYm94XCIhPT1sLnR5cGUmJlwicmFkaW9cIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj12b2lkIDApLGIuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj1cIlwiKSxcInJhZGlvXCI9PT1sLnR5cGUmJihmW2wubmFtZV18fGwuY2hlY2tlZD9sLmNoZWNrZWQmJihmW2wubmFtZV09ITApOmZbbC5uYW1lXT0hMSksIW4mJlwicmFkaW9cIj09bC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIW4pY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWwudHlwZSljPWQoYyxtLG4pO2Vsc2V7bj1bXTtmb3IodmFyIG89bC5vcHRpb25zLHA9ITEscT0wO3E8by5sZW5ndGg7KytxKXt2YXIgcj1vW3FdLHM9Yi5lbXB0eSYmIXIudmFsdWUsdD1yLnZhbHVlfHxzO3Iuc2VsZWN0ZWQmJnQmJihwPSEwLGM9Yi5oYXNoJiZcIltdXCIhPT1tLnNsaWNlKG0ubGVuZ3RoLTIpP2QoYyxtK1wiW11cIixyLnZhbHVlKTpkKGMsbSxyLnZhbHVlKSl9IXAmJmIuZW1wdHkmJihjPWQoYyxtLFwiXCIpKX19fWlmKGIuZW1wdHkpZm9yKHZhciBtIGluIGYpZlttXXx8KGM9ZChjLG0sXCJcIikpO3JldHVybiBjfWZ1bmN0aW9uIGUoYSl7dmFyIGI9W10sYz0vXihbXlxcW1xcXV0qKS8sZD1uZXcgUmVnRXhwKGspLGU9Yy5leGVjKGEpO2ZvcihlWzFdJiZiLnB1c2goZVsxXSk7bnVsbCE9PShlPWQuZXhlYyhhKSk7KWIucHVzaChlWzFdKTtyZXR1cm4gYn1mdW5jdGlvbiBmKGEsYixjKXtpZigwPT09Yi5sZW5ndGgpcmV0dXJuIGE9Yzt2YXIgZD1iLnNoaWZ0KCksZT1kLm1hdGNoKC9eXFxbKC4rPylcXF0kLyk7aWYoXCJbXVwiPT09ZClyZXR1cm4gYT1hfHxbXSxBcnJheS5pc0FycmF5KGEpP2EucHVzaChmKG51bGwsYixjKSk6KGEuX3ZhbHVlcz1hLl92YWx1ZXN8fFtdLGEuX3ZhbHVlcy5wdXNoKGYobnVsbCxiLGMpKSksYTtpZihlKXt2YXIgZz1lWzFdLGg9K2c7aXNOYU4oaCk/KGE9YXx8e30sYVtnXT1mKGFbZ10sYixjKSk6KGE9YXx8W10sYVtoXT1mKGFbaF0sYixjKSl9ZWxzZSBhW2RdPWYoYVtkXSxiLGMpO3JldHVybiBhfWZ1bmN0aW9uIGcoYSxiLGMpe3ZhciBkPWIubWF0Y2goayk7aWYoZCl7dmFyIGc9ZShiKTtmKGEsZyxjKX1lbHNle3ZhciBoPWFbYl07aD8oQXJyYXkuaXNBcnJheShoKXx8KGFbYl09W2hdKSxhW2JdLnB1c2goYykpOmFbYl09Y31yZXR1cm4gYX1mdW5jdGlvbiBoKGEsYixjKXtyZXR1cm4gYz1jLnJlcGxhY2UoLyhcXHIpP1xcbi9nLFwiXFxyXFxuXCIpLGM9ZW5jb2RlVVJJQ29tcG9uZW50KGMpLGM9Yy5yZXBsYWNlKC8lMjAvZyxcIitcIiksYSsoYT9cIiZcIjpcIlwiKStlbmNvZGVVUklDb21wb25lbnQoYikrXCI9XCIrY312YXIgaT0vXig/OnN1Ym1pdHxidXR0b258aW1hZ2V8cmVzZXR8ZmlsZSkkL2ksaj0vXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2ksaz0vKFxcW1teXFxbXFxdXSpcXF0pL2c7Yi5leHBvcnRzPWR9LHt9XSw1OltmdW5jdGlvbihiLGMsZCl7KGZ1bmN0aW9uKGUpeyFmdW5jdGlvbihiKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZCYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGMpYy5leHBvcnRzPWIoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGEmJmEuYW1kKWEoW10sYik7ZWxzZXt2YXIgZjtmPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBlP2U6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjp0aGlzLGYudmV4RGlhbG9nPWIoKX19KGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uIGEoYyxkLGUpe2Z1bmN0aW9uIGYoaCxpKXtpZighZFtoXSl7aWYoIWNbaF0pe3ZhciBqPVwiZnVuY3Rpb25cIj09dHlwZW9mIGImJmI7aWYoIWkmJmopcmV0dXJuIGooaCwhMCk7aWYoZylyZXR1cm4gZyhoLCEwKTt2YXIgaz1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2grXCInXCIpO3Rocm93IGsuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixrfXZhciBsPWRbaF09e2V4cG9ydHM6e319O2NbaF1bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oYSl7dmFyIGI9Y1toXVsxXVthXTtyZXR1cm4gZihiP2I6YSl9LGwsbC5leHBvcnRzLGEsYyxkLGUpfXJldHVybiBkW2hdLmV4cG9ydHN9Zm9yKHZhciBnPVwiZnVuY3Rpb25cIj09dHlwZW9mIGImJmIsaD0wO2g8ZS5sZW5ndGg7aCsrKWYoZVtoXSk7cmV0dXJuIGZ9KHsxOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIik7Ynx8KGI9ZG9jdW1lbnQpO3ZhciBjPS88KFtcXHc6XSspLy5leGVjKGEpO2lmKCFjKXJldHVybiBiLmNyZWF0ZVRleHROb2RlKGEpO2E9YS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpO3ZhciBkPWNbMV07aWYoXCJib2R5XCI9PWQpe3ZhciBlPWIuY3JlYXRlRWxlbWVudChcImh0bWxcIik7cmV0dXJuIGUuaW5uZXJIVE1MPWEsZS5yZW1vdmVDaGlsZChlLmxhc3RDaGlsZCl9dmFyIGY9Z1tkXXx8Zy5fZGVmYXVsdCxoPWZbMF0saT1mWzFdLGo9ZlsyXSxlPWIuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IoZS5pbm5lckhUTUw9aSthK2o7aC0tOyllPWUubGFzdENoaWxkO2lmKGUuZmlyc3RDaGlsZD09ZS5sYXN0Q2hpbGQpcmV0dXJuIGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKTtmb3IodmFyIGs9Yi5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7ZS5maXJzdENoaWxkOylrLmFwcGVuZENoaWxkKGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKSk7cmV0dXJuIGt9Yi5leHBvcnRzPWQ7dmFyIGUsZj0hMTtcInVuZGVmaW5lZFwiIT10eXBlb2YgZG9jdW1lbnQmJihlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksZS5pbm5lckhUTUw9JyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nLGY9IWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaW5rXCIpLmxlbmd0aCxlPXZvaWQgMCk7dmFyIGc9e2xlZ2VuZDpbMSxcIjxmaWVsZHNldD5cIixcIjwvZmllbGRzZXQ+XCJdLHRyOlsyLFwiPHRhYmxlPjx0Ym9keT5cIixcIjwvdGJvZHk+PC90YWJsZT5cIl0sY29sOlsyLFwiPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD5cIixcIjwvY29sZ3JvdXA+PC90YWJsZT5cIl0sX2RlZmF1bHQ6Zj9bMSxcIlg8ZGl2PlwiLFwiPC9kaXY+XCJdOlswLFwiXCIsXCJcIl19O2cudGQ9Zy50aD1bMyxcIjx0YWJsZT48dGJvZHk+PHRyPlwiLFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCJdLGcub3B0aW9uPWcub3B0Z3JvdXA9WzEsJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsXCI8L3NlbGVjdD5cIl0sZy50aGVhZD1nLnRib2R5PWcuY29sZ3JvdXA9Zy5jYXB0aW9uPWcudGZvb3Q9WzEsXCI8dGFibGU+XCIsXCI8L3RhYmxlPlwiXSxnLnBvbHlsaW5lPWcuZWxsaXBzZT1nLnBvbHlnb249Zy5jaXJjbGU9Zy50ZXh0PWcubGluZT1nLnBhdGg9Zy5yZWN0PWcuZz1bMSwnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsXCI8L3N2Zz5cIl19LHt9XSwyOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe1wib2JqZWN0XCIhPXR5cGVvZiBiP2I9e2hhc2g6ISFifTp2b2lkIDA9PT1iLmhhc2gmJihiLmhhc2g9ITApO2Zvcih2YXIgYz1iLmhhc2g/e306XCJcIixkPWIuc2VyaWFsaXplcnx8KGIuaGFzaD9nOmgpLGU9YSYmYS5lbGVtZW50cz9hLmVsZW1lbnRzOltdLGY9T2JqZWN0LmNyZWF0ZShudWxsKSxrPTA7azxlLmxlbmd0aDsrK2spe3ZhciBsPWVba107aWYoKGIuZGlzYWJsZWR8fCFsLmRpc2FibGVkKSYmbC5uYW1lJiZqLnRlc3QobC5ub2RlTmFtZSkmJiFpLnRlc3QobC50eXBlKSl7dmFyIG09bC5uYW1lLG49bC52YWx1ZTtpZihcImNoZWNrYm94XCIhPT1sLnR5cGUmJlwicmFkaW9cIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj12b2lkIDApLGIuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj1cIlwiKSxcInJhZGlvXCI9PT1sLnR5cGUmJihmW2wubmFtZV18fGwuY2hlY2tlZD9sLmNoZWNrZWQmJihmW2wubmFtZV09ITApOmZbbC5uYW1lXT0hMSksIW4mJlwicmFkaW9cIj09bC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIW4pY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWwudHlwZSljPWQoYyxtLG4pO2Vsc2V7bj1bXTtmb3IodmFyIG89bC5vcHRpb25zLHA9ITEscT0wO3E8by5sZW5ndGg7KytxKXt2YXIgcj1vW3FdLHM9Yi5lbXB0eSYmIXIudmFsdWUsdD1yLnZhbHVlfHxzO3Iuc2VsZWN0ZWQmJnQmJihwPSEwLGM9Yi5oYXNoJiZcIltdXCIhPT1tLnNsaWNlKG0ubGVuZ3RoLTIpP2QoYyxtK1wiW11cIixyLnZhbHVlKTpkKGMsbSxyLnZhbHVlKSl9IXAmJmIuZW1wdHkmJihjPWQoYyxtLFwiXCIpKX19fWlmKGIuZW1wdHkpZm9yKHZhciBtIGluIGYpZlttXXx8KGM9ZChjLG0sXCJcIikpO3JldHVybiBjfWZ1bmN0aW9uIGUoYSl7dmFyIGI9W10sYz0vXihbXlxcW1xcXV0qKS8sZD1uZXcgUmVnRXhwKGspLGU9Yy5leGVjKGEpO2ZvcihlWzFdJiZiLnB1c2goZVsxXSk7bnVsbCE9PShlPWQuZXhlYyhhKSk7KWIucHVzaChlWzFdKTtyZXR1cm4gYn1mdW5jdGlvbiBmKGEsYixjKXtpZigwPT09Yi5sZW5ndGgpcmV0dXJuIGE9Yzt2YXIgZD1iLnNoaWZ0KCksZT1kLm1hdGNoKC9eXFxbKC4rPylcXF0kLyk7aWYoXCJbXVwiPT09ZClyZXR1cm4gYT1hfHxbXSxBcnJheS5pc0FycmF5KGEpP2EucHVzaChmKG51bGwsYixjKSk6KGEuX3ZhbHVlcz1hLl92YWx1ZXN8fFtdLGEuX3ZhbHVlcy5wdXNoKGYobnVsbCxiLGMpKSksYTtpZihlKXt2YXIgZz1lWzFdLGg9K2c7aXNOYU4oaCk/KGE9YXx8e30sYVtnXT1mKGFbZ10sYixjKSk6KGE9YXx8W10sYVtoXT1mKGFbaF0sYixjKSl9ZWxzZSBhW2RdPWYoYVtkXSxiLGMpO3JldHVybiBhfWZ1bmN0aW9uIGcoYSxiLGMpe3ZhciBkPWIubWF0Y2goayk7aWYoZCl7dmFyIGc9ZShiKTtmKGEsZyxjKX1lbHNle3ZhciBoPWFbYl07aD8oQXJyYXkuaXNBcnJheShoKXx8KGFbYl09W2hdKSxhW2JdLnB1c2goYykpOmFbYl09Y31yZXR1cm4gYX1mdW5jdGlvbiBoKGEsYixjKXtyZXR1cm4gYz1jLnJlcGxhY2UoLyhcXHIpP1xcbi9nLFwiXFxyXFxuXCIpLGM9ZW5jb2RlVVJJQ29tcG9uZW50KGMpLGM9Yy5yZXBsYWNlKC8lMjAvZyxcIitcIiksYSsoYT9cIiZcIjpcIlwiKStlbmNvZGVVUklDb21wb25lbnQoYikrXCI9XCIrY312YXIgaT0vXig/OnN1Ym1pdHxidXR0b258aW1hZ2V8cmVzZXR8ZmlsZSkkL2ksaj0vXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2ksaz0vKFxcW1teXFxbXFxdXSpcXF0pL2c7Yi5leHBvcnRzPWR9LHt9XSwzOltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcImRvbWlmeVwiKSxlPWEoXCJmb3JtLXNlcmlhbGl6ZVwiKSxmPWZ1bmN0aW9uKGEpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO2IuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctZm9ybVwiKTt2YXIgYz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2MuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctbWVzc2FnZVwiKSxjLmFwcGVuZENoaWxkKGEubWVzc2FnZSBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlP2EubWVzc2FnZTpkKGEubWVzc2FnZSkpO3ZhciBlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7cmV0dXJuIGUuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctaW5wdXRcIiksZS5hcHBlbmRDaGlsZChhLmlucHV0IGluc3RhbmNlb2Ygd2luZG93Lk5vZGU/YS5pbnB1dDpkKGEuaW5wdXQpKSxiLmFwcGVuZENoaWxkKGMpLGIuYXBwZW5kQ2hpbGQoZSksYn0sZz1mdW5jdGlvbihhKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2IuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctYnV0dG9uc1wiKTtmb3IodmFyIGM9MDtjPGEubGVuZ3RoO2MrKyl7dmFyIGQ9YVtjXSxlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7ZS50eXBlPWQudHlwZSxlLnRleHRDb250ZW50PWQudGV4dCxlLmNsYXNzTmFtZT1kLmNsYXNzTmFtZSxlLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZGlhbG9nLWJ1dHRvblwiKSwwPT09Yz9lLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZmlyc3RcIik6Yz09PWEubGVuZ3RoLTEmJmUuY2xhc3NMaXN0LmFkZChcInZleC1sYXN0XCIpLGZ1bmN0aW9uKGEpe2UuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsZnVuY3Rpb24oYil7YS5jbGljayYmYS5jbGljay5jYWxsKHRoaXMsYil9LmJpbmQodGhpcykpfS5iaW5kKHRoaXMpKGQpLGIuYXBwZW5kQ2hpbGQoZSl9cmV0dXJuIGJ9LGg9ZnVuY3Rpb24oYSl7dmFyIGI9e25hbWU6XCJkaWFsb2dcIixvcGVuOmZ1bmN0aW9uKGIpe3ZhciBjPU9iamVjdC5hc3NpZ24oe30sdGhpcy5kZWZhdWx0T3B0aW9ucyxiKTtjLnVuc2FmZU1lc3NhZ2UmJiFjLm1lc3NhZ2U/Yy5tZXNzYWdlPWMudW5zYWZlTWVzc2FnZTpjLm1lc3NhZ2UmJihjLm1lc3NhZ2U9YS5fZXNjYXBlSHRtbChjLm1lc3NhZ2UpKTt2YXIgZD1jLnVuc2FmZUNvbnRlbnQ9ZihjKSxlPWEub3BlbihjKSxoPWMuYmVmb3JlQ2xvc2UmJmMuYmVmb3JlQ2xvc2UuYmluZChlKTtpZihlLm9wdGlvbnMuYmVmb3JlQ2xvc2U9ZnVuY3Rpb24oKXt2YXIgYT0haHx8aCgpO3JldHVybiBhJiZjLmNhbGxiYWNrKHRoaXMudmFsdWV8fCExKSxhfS5iaW5kKGUpLGQuYXBwZW5kQ2hpbGQoZy5jYWxsKGUsYy5idXR0b25zKSksZS5mb3JtPWQsZC5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsYy5vblN1Ym1pdC5iaW5kKGUpKSxjLmZvY3VzRmlyc3RJbnB1dCl7dmFyIGk9ZS5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcImJ1dHRvbiwgaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWFcIik7aSYmaS5mb2N1cygpfXJldHVybiBlfSxhbGVydDpmdW5jdGlvbihhKXtyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9e21lc3NhZ2U6YX0pLGE9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdEFsZXJ0T3B0aW9ucyxhKSx0aGlzLm9wZW4oYSl9LGNvbmZpcm06ZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIiE9dHlwZW9mIGF8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGEuY2FsbGJhY2spdGhyb3cgbmV3IEVycm9yKFwiZGlhbG9nLmNvbmZpcm0ob3B0aW9ucykgcmVxdWlyZXMgb3B0aW9ucy5jYWxsYmFjay5cIik7cmV0dXJuIGE9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdENvbmZpcm1PcHRpb25zLGEpLHRoaXMub3BlbihhKX0scHJvbXB0OmZ1bmN0aW9uKGIpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiBifHxcImZ1bmN0aW9uXCIhPXR5cGVvZiBiLmNhbGxiYWNrKXRocm93IG5ldyBFcnJvcihcImRpYWxvZy5wcm9tcHQob3B0aW9ucykgcmVxdWlyZXMgb3B0aW9ucy5jYWxsYmFjay5cIik7dmFyIGM9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdFByb21wdE9wdGlvbnMpLGQ9e3Vuc2FmZU1lc3NhZ2U6JzxsYWJlbCBmb3I9XCJ2ZXhcIj4nK2EuX2VzY2FwZUh0bWwoYi5sYWJlbHx8Yy5sYWJlbCkrXCI8L2xhYmVsPlwiLGlucHV0Oic8aW5wdXQgbmFtZT1cInZleFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJ2ZXgtZGlhbG9nLXByb21wdC1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiJythLl9lc2NhcGVIdG1sKGIucGxhY2Vob2xkZXJ8fGMucGxhY2Vob2xkZXIpKydcIiB2YWx1ZT1cIicrYS5fZXNjYXBlSHRtbChiLnZhbHVlfHxjLnZhbHVlKSsnXCIgLz4nfTtiPU9iamVjdC5hc3NpZ24oYyxkLGIpO3ZhciBlPWIuY2FsbGJhY2s7cmV0dXJuIGIuY2FsbGJhY2s9ZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGEpe3ZhciBiPU9iamVjdC5rZXlzKGEpO2E9Yi5sZW5ndGg/YVtiWzBdXTpcIlwifWUoYSl9LHRoaXMub3BlbihiKX19O3JldHVybiBiLmJ1dHRvbnM9e1lFUzp7dGV4dDpcIk9LXCIsdHlwZTpcInN1Ym1pdFwiLGNsYXNzTmFtZTpcInZleC1kaWFsb2ctYnV0dG9uLXByaW1hcnlcIixjbGljazpmdW5jdGlvbigpe3RoaXMudmFsdWU9ITB9fSxOTzp7dGV4dDpcIkNhbmNlbFwiLHR5cGU6XCJidXR0b25cIixjbGFzc05hbWU6XCJ2ZXgtZGlhbG9nLWJ1dHRvbi1zZWNvbmRhcnlcIixjbGljazpmdW5jdGlvbigpe3RoaXMudmFsdWU9ITEsdGhpcy5jbG9zZSgpfX19LGIuZGVmYXVsdE9wdGlvbnM9e2NhbGxiYWNrOmZ1bmN0aW9uKCl7fSxhZnRlck9wZW46ZnVuY3Rpb24oKXt9LG1lc3NhZ2U6XCJcIixpbnB1dDpcIlwiLGJ1dHRvbnM6W2IuYnV0dG9ucy5ZRVMsYi5idXR0b25zLk5PXSxzaG93Q2xvc2VCdXR0b246ITEsb25TdWJtaXQ6ZnVuY3Rpb24oYSl7cmV0dXJuIGEucHJldmVudERlZmF1bHQoKSx0aGlzLm9wdGlvbnMuaW5wdXQmJih0aGlzLnZhbHVlPWUodGhpcy5mb3JtLHtoYXNoOiEwfSkpLHRoaXMuY2xvc2UoKX0sZm9jdXNGaXJzdElucHV0OiEwfSxiLmRlZmF1bHRBbGVydE9wdGlvbnM9e2J1dHRvbnM6W2IuYnV0dG9ucy5ZRVNdfSxiLmRlZmF1bHRQcm9tcHRPcHRpb25zPXtsYWJlbDpcIlByb21wdDpcIixwbGFjZWhvbGRlcjpcIlwiLHZhbHVlOlwiXCJ9LGIuZGVmYXVsdENvbmZpcm1PcHRpb25zPXt9LGJ9O2IuZXhwb3J0cz1ofSx7ZG9taWZ5OjEsXCJmb3JtLXNlcmlhbGl6ZVwiOjJ9XX0se30sWzNdKSgzKX0pfSkuY2FsbCh0aGlzLFwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7ZG9taWZ5OjIsXCJmb3JtLXNlcmlhbGl6ZVwiOjR9XSw2OltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcIi4vdmV4XCIpO2QucmVnaXN0ZXJQbHVnaW4oYShcInZleC1kaWFsb2dcIikpLGIuZXhwb3J0cz1kfSx7XCIuL3ZleFwiOjcsXCJ2ZXgtZGlhbG9nXCI6NX1dLDc6W2Z1bmN0aW9uKGEsYixjKXthKFwiY2xhc3NsaXN0LXBvbHlmaWxsXCIpLGEoXCJlczYtb2JqZWN0LWFzc2lnblwiKS5wb2x5ZmlsbCgpO3ZhciBkPWEoXCJkb21pZnlcIiksZT1mdW5jdGlvbihhKXtpZihcInVuZGVmaW5lZFwiIT10eXBlb2YgYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtyZXR1cm4gYi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShhKSksYi5pbm5lckhUTUx9cmV0dXJuXCJcIn0sZj1mdW5jdGlvbihhLGIpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiBiJiYwIT09Yi5sZW5ndGgpZm9yKHZhciBjPWIuc3BsaXQoXCIgXCIpLGQ9MDtkPGMubGVuZ3RoO2QrKyl7dmFyIGU9Y1tkXTtlLmxlbmd0aCYmYS5jbGFzc0xpc3QuYWRkKGUpfX0sZz1mdW5jdGlvbigpe3ZhciBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksYj17V2Via2l0QW5pbWF0aW9uOlwid2Via2l0QW5pbWF0aW9uRW5kXCIsTW96QW5pbWF0aW9uOlwiYW5pbWF0aW9uZW5kXCIsT0FuaW1hdGlvbjpcIm9hbmltYXRpb25lbmRcIixtc0FuaW1hdGlvbjpcIk1TQW5pbWF0aW9uRW5kXCIsYW5pbWF0aW9uOlwiYW5pbWF0aW9uZW5kXCJ9O2Zvcih2YXIgYyBpbiBiKWlmKHZvaWQgMCE9PWEuc3R5bGVbY10pcmV0dXJuIGJbY107cmV0dXJuITF9KCksaD17dmV4OlwidmV4XCIsY29udGVudDpcInZleC1jb250ZW50XCIsb3ZlcmxheTpcInZleC1vdmVybGF5XCIsY2xvc2U6XCJ2ZXgtY2xvc2VcIixjbG9zaW5nOlwidmV4LWNsb3NpbmdcIixvcGVuOlwidmV4LW9wZW5cIn0saT17fSxqPTEsaz0hMSxsPXtvcGVuOmZ1bmN0aW9uKGEpe3ZhciBiPWZ1bmN0aW9uKGEpe2NvbnNvbGUud2FybignVGhlIFwiJythKydcIiBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGluIHZleCAzLiBVc2UgQ1NTIGNsYXNzZXMgYW5kIHRoZSBhcHByb3ByaWF0ZSBcIkNsYXNzTmFtZVwiIG9wdGlvbnMsIGluc3RlYWQuJyksY29uc29sZS53YXJuKFwiU2VlIGh0dHA6Ly9naXRodWIuaHVic3BvdC5jb20vdmV4L2FwaS9hZHZhbmNlZC8jb3B0aW9uc1wiKX07YS5jc3MmJmIoXCJjc3NcIiksYS5vdmVybGF5Q1NTJiZiKFwib3ZlcmxheUNTU1wiKSxhLmNvbnRlbnRDU1MmJmIoXCJjb250ZW50Q1NTXCIpLGEuY2xvc2VDU1MmJmIoXCJjbG9zZUNTU1wiKTt2YXIgYz17fTtjLmlkPWorKyxpW2MuaWRdPWMsYy5pc09wZW49ITAsYy5jbG9zZT1mdW5jdGlvbigpe2Z1bmN0aW9uIGEoYSl7cmV0dXJuXCJub25lXCIhPT1kLmdldFByb3BlcnR5VmFsdWUoYStcImFuaW1hdGlvbi1uYW1lXCIpJiZcIjBzXCIhPT1kLmdldFByb3BlcnR5VmFsdWUoYStcImFuaW1hdGlvbi1kdXJhdGlvblwiKX1pZighdGhpcy5pc09wZW4pcmV0dXJuITA7dmFyIGI9dGhpcy5vcHRpb25zO2lmKGsmJiFiLmVzY2FwZUJ1dHRvbkNsb3NlcylyZXR1cm4hMTt2YXIgYz1mdW5jdGlvbigpe3JldHVybiFiLmJlZm9yZUNsb3NlfHxiLmJlZm9yZUNsb3NlLmNhbGwodGhpcyl9LmJpbmQodGhpcykoKTtpZihjPT09ITEpcmV0dXJuITE7dGhpcy5pc09wZW49ITE7dmFyIGQ9d2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5jb250ZW50RWwpLGU9YShcIlwiKXx8YShcIi13ZWJraXQtXCIpfHxhKFwiLW1vei1cIil8fGEoXCItby1cIiksZj1mdW5jdGlvbiBqKCl7dGhpcy5yb290RWwucGFyZW50Tm9kZSYmKHRoaXMucm9vdEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZyxqKSxkZWxldGUgaVt0aGlzLmlkXSx0aGlzLnJvb3RFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucm9vdEVsKSxiLmFmdGVyQ2xvc2UmJmIuYWZ0ZXJDbG9zZS5jYWxsKHRoaXMpLDA9PT1PYmplY3Qua2V5cyhpKS5sZW5ndGgmJmRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShoLm9wZW4pKX0uYmluZCh0aGlzKTtyZXR1cm4gZyYmZT8odGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihnLGYpLHRoaXMucm9vdEVsLmNsYXNzTGlzdC5hZGQoaC5jbG9zaW5nKSk6ZigpLCEwfSxcInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9e2NvbnRlbnQ6YX0pLGEudW5zYWZlQ29udGVudCYmIWEuY29udGVudD9hLmNvbnRlbnQ9YS51bnNhZmVDb250ZW50OmEuY29udGVudCYmKGEuY29udGVudD1lKGEuY29udGVudCkpO3ZhciBtPWMub3B0aW9ucz1PYmplY3QuYXNzaWduKHt9LGwuZGVmYXVsdE9wdGlvbnMsYSksbj1jLnJvb3RFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO24uY2xhc3NMaXN0LmFkZChoLnZleCksZihuLG0uY2xhc3NOYW1lKTt2YXIgbz1jLm92ZXJsYXlFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO28uY2xhc3NMaXN0LmFkZChoLm92ZXJsYXkpLGYobyxtLm92ZXJsYXlDbGFzc05hbWUpLG0ub3ZlcmxheUNsb3Nlc09uQ2xpY2smJm8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsZnVuY3Rpb24oYSl7YS50YXJnZXQ9PT1vJiZjLmNsb3NlKCl9KSxuLmFwcGVuZENoaWxkKG8pO3ZhciBwPWMuY29udGVudEVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7aWYocC5jbGFzc0xpc3QuYWRkKGguY29udGVudCksZihwLG0uY29udGVudENsYXNzTmFtZSkscC5hcHBlbmRDaGlsZChtLmNvbnRlbnQgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZT9tLmNvbnRlbnQ6ZChtLmNvbnRlbnQpKSxuLmFwcGVuZENoaWxkKHApLG0uc2hvd0Nsb3NlQnV0dG9uKXt2YXIgcT1jLmNsb3NlRWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtxLmNsYXNzTGlzdC5hZGQoaC5jbG9zZSksZihxLG0uY2xvc2VDbGFzc05hbWUpLHEuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsYy5jbG9zZS5iaW5kKGMpKSxwLmFwcGVuZENoaWxkKHEpfXJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG0uYXBwZW5kTG9jYXRpb24pLmFwcGVuZENoaWxkKG4pLG0uYWZ0ZXJPcGVuJiZtLmFmdGVyT3Blbi5jYWxsKGMpLGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChoLm9wZW4pLGN9LGNsb3NlOmZ1bmN0aW9uKGEpe3ZhciBiO2lmKGEuaWQpYj1hLmlkO2Vsc2V7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcImNsb3NlIHJlcXVpcmVzIGEgdmV4IG9iamVjdCBvciBpZCBzdHJpbmdcIik7Yj1hfXJldHVybiEhaVtiXSYmaVtiXS5jbG9zZSgpfSxjbG9zZVRvcDpmdW5jdGlvbigpe3ZhciBhPU9iamVjdC5rZXlzKGkpO3JldHVybiEhYS5sZW5ndGgmJmlbYVthLmxlbmd0aC0xXV0uY2xvc2UoKX0sY2xvc2VBbGw6ZnVuY3Rpb24oKXtmb3IodmFyIGEgaW4gaSl0aGlzLmNsb3NlKGEpO3JldHVybiEwfSxnZXRBbGw6ZnVuY3Rpb24oKXtyZXR1cm4gaX0sZ2V0QnlJZDpmdW5jdGlvbihhKXtyZXR1cm4gaVthXX19O3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIixmdW5jdGlvbihhKXsyNz09PWEua2V5Q29kZSYmKGs9ITAsbC5jbG9zZVRvcCgpLGs9ITEpfSksd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLGZ1bmN0aW9uKCl7bC5kZWZhdWx0T3B0aW9ucy5jbG9zZUFsbE9uUG9wU3RhdGUmJmwuY2xvc2VBbGwoKX0pLGwuZGVmYXVsdE9wdGlvbnM9e2NvbnRlbnQ6XCJcIixzaG93Q2xvc2VCdXR0b246ITAsZXNjYXBlQnV0dG9uQ2xvc2VzOiEwLG92ZXJsYXlDbG9zZXNPbkNsaWNrOiEwLGFwcGVuZExvY2F0aW9uOlwiYm9keVwiLGNsYXNzTmFtZTpcIlwiLG92ZXJsYXlDbGFzc05hbWU6XCJcIixjb250ZW50Q2xhc3NOYW1lOlwiXCIsY2xvc2VDbGFzc05hbWU6XCJcIixjbG9zZUFsbE9uUG9wU3RhdGU6ITB9LE9iamVjdC5kZWZpbmVQcm9wZXJ0eShsLFwiX2VzY2FwZUh0bWxcIix7Y29uZmlndXJhYmxlOiExLGVudW1lcmFibGU6ITEsd3JpdGFibGU6ITEsdmFsdWU6ZX0pLGwucmVnaXN0ZXJQbHVnaW49ZnVuY3Rpb24oYSxiKXt2YXIgYz1hKGwpLGQ9Ynx8Yy5uYW1lO2lmKGxbZF0pdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIFwiK2IrXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkLlwiKTtsW2RdPWN9LGIuZXhwb3J0cz1sfSx7XCJjbGFzc2xpc3QtcG9seWZpbGxcIjoxLGRvbWlmeToyLFwiZXM2LW9iamVjdC1hc3NpZ25cIjozfV19LHt9LFs2XSkoNil9KTtcbiJdfQ==
