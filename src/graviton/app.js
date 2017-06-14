/**
 * graviton/app -- The interactive graviton application
 */
/* global jscolor */

import vex from '../vendor/vex';
import random from '../util/random';
import GtSim from './sim';
import GtGfx from './gfx';
import GtEvents, { KEYCODES, EVENTCODES, CONTROLCODES } from './events';
import GtTimer from './timer';

export default class GtApp {
    constructor(args = {}) {
        this.args = args;

        this.options = {};
        this.grid = null;

        this.animTimer = null;
        this.simTimer = null;

        this.events = null;
        this.sim = null;
        this.gfx = null;

        this.noclear = false;
        this.interaction = {previous: {}};
        this.targetBody = undefined;
        this.wasColorPickerActive = false;
        this.isHelpOpen = false;

        this.options.width = args.width = args.width || window.innerWidth;
        this.options.height = args.height = args.height || window.innerHeight;
        this.options.backgroundColor = args.backgroundColor || '#1F263B';

        // Retrieve canvas, or build one with arguments
        this.grid = typeof args.grid === 'string' ?
            document.getElementById(args.grid) :
            args.grid;

        if (typeof this.grid === 'undefined') {
            this.generateGrid(this.options.width, this.options.height,
                    {backgroundColor: this.options.backgroundColor});
            args.grid = this.grid;
        }

        this.controls = typeof args.controls === 'string' ?
            document.getElementById(args.controls) :
            args.controls;

        if (typeof this.controls === 'undefined') {
            this.generateControls();
            args.controls = this.controls;
        }

        this.playBtn = args.playBtn = this.controls.querySelector('#playbtn');
        this.pauseBtn = args.pauseBtn = this.controls.querySelector('#pausebtn');
        this.trailOffBtn = args.trailOffBtn = this.controls.querySelector('#trailoffbtn');
        this.trailOnBtn = args.trailOnBtn = this.controls.querySelector('#trailonbtn');
        this.helpBtn = args.helpBtn = this.controls.querySelector('#helpbtn');

        this.colorPicker = typeof args.colorPicker === 'string' ?
            document.getElementById(args.colorPicker) :
            args.colorPicker;

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

        this.metaInfo = typeof args.metaInfo === 'string' ?
            document.getElementById(args.metaInfo) :
            args.metaInfo;

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
    main() {
        // Event processing
        //--------------------
        this.events.qget().forEach(function(event) {
            let retval;

            switch (event.type) {
                case EVENTCODES.MOUSEDOWN:
                    if (event.button === /* right click */ 2) {
                        // Remove body.
                        if (this.targetBody && !this.interaction.started) {
                            this.sim.removeBody(this.targetBody);
                            this.setTargetBody(undefined);
                        }
                    } else if (event.button === /* middle click */ 1) {
                        // Color picking
                        if (this.targetBody && !this.interaction.started) {
                            this.colorPicker.style.left = event.position.x + 'px';
                            this.colorPicker.style.top = event.position.y + 'px';
                            this.jscolor.fromString(this.targetBody.color);
                            this.jscolor.show();
                        }
                    } else { /* left click */
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

                case EVENTCODES.MOUSEUP:
                    if (this.interaction.started) {
                        this.interaction.started = false;

                        let body = this.interaction.body;

                        body.velX = (event.position.x - body.x) * 0.0000001;
                        body.velY = (event.position.y - body.y) * 0.0000001;
                    }
                    this.updateTarget(event.position.x, event.position.y);
                    break;

                case EVENTCODES.MOUSEMOVE:
                    this.interaction.previous.x = event.position.x;
                    this.interaction.previous.y = event.position.y;
                    if (!this.interaction.started && !this.isColorPickerActive()) {
                        this.updateTarget(event.position.x, event.position.y);
                    }
                    break; // end MOUSEMOVE

                case EVENTCODES.MOUSEWHEEL:
                    if (this.targetBody) {
                        this.targetBody.adjustSize(event.delta);
                        this.updateMetaInfo();
                    }
                    break; // end MOUSEWHEEL

                case EVENTCODES.KEYDOWN:
                    switch (event.keycode) {
                        case KEYCODES.K_ENTER:
                            this.toggleSim();
                            break;

                        case KEYCODES.K_C:
                            // Clear simulation
                            this.sim.clear();
                            this.gfx.clear();
                            this.simTimer.stop();
                            retval = false;
                            break;

                        case KEYCODES.K_P:
                            this.toggleTrails();
                            break;

                        case KEYCODES.K_R:
                            // Generate random objects
                            this.generateBodies(10, {randomColors: true});
                            break;

                        case KEYCODES.K_T:
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

                        case KEYCODES.K_QUESTIONMARK:
                            this.showHelp();
                            break;
                    }
                    break; // end KEYDOWN

                case CONTROLCODES.PLAYBTN:
                    this.toggleSim();
                    break;

                case CONTROLCODES.PAUSEBTN:
                    this.toggleSim();
                    break;

                case CONTROLCODES.TRAILOFFBTN:
                    this.toggleTrails();
                    break;

                case CONTROLCODES.TRAILONBTN:
                    this.toggleTrails();
                    break;

                case CONTROLCODES.HELPBTN:
                    this.showHelp();
                    break;
            }

            return retval;
        }, this);

        // Redraw screen
        this.redraw();
    }

    initComponents() {
        // Create components -- order is important
        this.events = this.args.events = new GtEvents(this.args);
        this.sim = new GtSim(this.args);
        this.gfx = new GtGfx(this.args);
    }

    initTimers() {
        // Add `main` loop, and start immediately
        this.animTimer = new GtTimer(this.main.bind(this));
        this.animTimer.start();
        this.simTimer = new GtTimer(this.sim.step.bind(this.sim), 60);
    }

    toggleSim() {
        if (this.simTimer.active) {
            this.playBtn.style.display = '';
            this.pauseBtn.style.display = 'none';
        } else {
            this.playBtn.style.display = 'none';
            this.pauseBtn.style.display = '';
        }
        this.simTimer.toggle();
    }

    toggleTrails() {
        if (this.noclear) {
            this.trailOffBtn.style.display = '';
            this.trailOnBtn.style.display = 'none';
        } else {
            this.trailOffBtn.style.display = 'none';
            this.trailOnBtn.style.display = '';
        }
        this.noclear = !this.noclear;
    }

    showHelp() {
        if (this.isHelpOpen) {
            return;
        }
        this.isHelpOpen = true;
        vex.open({
            unsafeContent: `
                <h3>Shortcuts</h3>
                <table class="shortcuts">
                    <tbody>
                    <tr>
                        <td>Left click</td> <td> create body</td></tr>
                    <tr>
                        <td>Right click</td> <td> delete body</td></tr>
                    <tr>
                        <td>Middle click</td> <td> change body color</td></tr>
                    <tr>
                        <td><code>Enter key</code> key</td> <td> start simulation</td></tr>
                    <tr>
                        <td><code>C</code> key</td> <td> clear canvas</td></tr>
                    <tr>
                        <td><code>P</code> key</td> <td> toggle repainting</td></tr>
                    <tr>
                        <td><code>R</code> key</td> <td> create random bodies</td></tr>
                    <tr>
                        <td><code>T</code> key</td> <td> create Titan</td></tr>
                    <tr>
                        <td><code>?</code> key</td> <td> show help</td></tr>
                    </tbody>
                </table>
                `,
            callback: () => {
                this.isHelpOpen = false;
            }
        });
    }

    redraw() {
        if (!this.noclear) {
            this.gfx.clear();
        }
        this.drawInteraction();
        this.gfx.drawBodies(this.sim.bodies, this.targetBody);
    }

    generateGrid(width, height, style) {
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

    generateControls() {
        this.controls = document.createElement('menu');
        this.controls.type = 'toolbar';
        this.controls.id = 'controls';
        this.controls.innerHTML = `
            <menuitem id="playbtn">
                <img src="assets/play.svg" alt="Start simulation">
            </menuitem>
            <menuitem id="pausebtn" style="display: none;">
                <img src="assets/pause.svg" alt="Stop simulation">
            </menuitem>
            <menuitem id="trailoffbtn">
                <img src="assets/trail_off.svg" alt="Toggle trails">
            </menuitem>
            <menuitem id="trailonbtn" style="display: none;">
                <img src="assets/trail_on.svg" alt="Toggle trails">
            </menuitem>
            <menuitem id="helpbtn">
                <img src="assets/help.svg" alt="Help">
            </menuitem>
            `;

        document.body.appendChild(this.controls);
    }

    generateBodies(num, args) {
        args = args || {};

        let minX = args.minX || 0;
        let maxX = args.maxX || this.options.width;
        let minY = args.minY || 0;
        let maxY = args.maxY || this.options.height;

        let minVelX = args.minVelX || 0;
        let maxVelX = args.maxVelX || 0.00001;
        let minVelY = args.minVelY || 0;
        let maxVelY = args.maxVelY || 0.00001;

        let minMass = args.minMass || 1;
        let maxMass = args.maxMass || 150;

        let minRadius = args.minRadius || 1;
        let maxRadius = args.maxRadius || 15;

        let color = args.color;

        for (let i = 0; i < num; i++) {
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
    }

    drawInteraction() {
        if (this.interaction.started) {
            this.gfx.drawReticleLine(this.interaction.body, this.interaction.previous);
        }
    }

    updateTarget(x, y) {
        this.setTargetBody(this.sim.getBodyAt(x, y));
    }

    setTargetBody(body) {
        this.targetBody = body;
        this.updateMetaInfo();
    }

    updateMetaInfo() {
        if (this.targetBody) {
            this.metaInfo.innerHTML =
                `⊕ ${this.targetBody.mass.toFixed(2)} &nbsp;` +
                `⦿ ${this.targetBody.radius.toFixed(2)} &nbsp;` +
                `⇗ ${this.targetBody.speed.toFixed(2)}`;
        } else {
            this.metaInfo.textContent = '';
        }
    }

    updateColor() {
        if (this.targetBody) {
            this.targetBody.updateColor(this.jscolor.toHEXString());
        }
    }

    isColorPickerActive() {
        this.wasColorPickerActive = this.colorPicker.className.indexOf('jscolor-active') > -1;
        return this.wasColorPickerActive;
    }
} // end graviton/app
