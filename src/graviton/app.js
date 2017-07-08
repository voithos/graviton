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
        this.quadTreeLines = false;
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
        this.barnesHutOnBtn = args.barnesHutOnBtn = this.controls.querySelector('#barneshutonbtn');
        this.barnesHutOffBtn = args.barnesHutOffBtn = this.controls.querySelector('#barneshutoffbtn');
        this.quadTreeOffBtn = args.quadTreeOffBtn = this.controls.querySelector('#quadtreeoffbtn');
        this.quadTreeOnBtn = args.quadTreeOnBtn = this.controls.querySelector('#quadtreeonbtn');
        this.collisionsOffBtn = args.collisionsOffBtn =
            this.controls.querySelector('#collisionsoffbtn');
        this.collisionsOnBtn = args.collisionsOnBtn =
            this.controls.querySelector('#collisionsonbtn');
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

                        let velX = (event.position.x - body.x) * 0.0000001;
                        let velY = (event.position.y - body.y) * 0.0000001;
                        // When the simulation is active, add the velocity to the current velocity
                        // instead of completely resetting it (to allow for more interesting
                        // interactions).
                        body.velX = this.simTimer.active ? body.velX + velX : velX;
                        body.velY = this.simTimer.active ? body.velY + velY : velY;
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

                        case KEYCODES.K_B:
                            this.toggleSimStrategy();
                            break;

                        case KEYCODES.K_C:
                            this.toggleCollisions();
                            break;

                        case KEYCODES.K_L:
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

                        case KEYCODES.K_Q:
                            this.toggleQuadTreeLines();
                            break;

                        case KEYCODES.K_P:
                            this.toggleTrails();
                            break;

                        case KEYCODES.K_R:
                            this.generateRandomBodies(10, {randomColors: true});
                            break;

                        case KEYCODES.K_1:
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

                        case KEYCODES.K_2:
                            this.generateRandomBodies(1000, {
                                normalDistribution: true,
                                maxRadius: 1
                            });
                            break;

                        case KEYCODES.K_3:
                            this.generateRandomBodies(1000, {
                                galacticDistribution: true,
                                minVelX: 0.000005,
                                maxVelX: 0.00002,
                                minVelY: 0.000005,
                                maxVelY: 0.00002,
                                maxRadius: 1
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

                case CONTROLCODES.BARNESHUTONBTN:
                    this.toggleSimStrategy();
                    break;

                case CONTROLCODES.BARNESHUTOFFBTN:
                    this.toggleSimStrategy();
                    break;

                case CONTROLCODES.QUADTREEOFFBTN:
                    this.toggleQuadTreeLines();
                    break;

                case CONTROLCODES.QUADTREEONBTN:
                    this.toggleQuadTreeLines();
                    break;

                case CONTROLCODES.COLLISIONSOFFBTN:
                    this.toggleCollisions();
                    break;

                case CONTROLCODES.COLLISIONSONBTN:
                    this.toggleCollisions();
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
        this.simTimer.toggle();
        if (this.simTimer.active) {
            this.playBtn.style.display = 'none';
            this.pauseBtn.style.display = '';
        } else {
            this.playBtn.style.display = '';
            this.pauseBtn.style.display = 'none';
        }
    }

    toggleSimStrategy() {
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

    toggleCollisions() {
        this.sim.mergeCollisions = !this.sim.mergeCollisions;
        if (this.sim.mergeCollisions) {
            this.collisionsOffBtn.style.display = 'none';
            this.collisionsOnBtn.style.display = '';
        } else {
            this.collisionsOffBtn.style.display = '';
            this.collisionsOnBtn.style.display = 'none';
        }
    }

    toggleTrails() {
        this.noclear = !this.noclear;
        if (this.noclear) {
            this.trailOffBtn.style.display = 'none';
            this.trailOnBtn.style.display = '';
        } else {
            this.trailOffBtn.style.display = '';
            this.trailOnBtn.style.display = 'none';
        }
    }

    toggleQuadTreeLines() {
        this.quadTreeLines = !this.quadTreeLines;
        this.updateQuadTreeLinesIcons();
    }

    updateQuadTreeLinesIcons() {
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
                        <td>Mouse wheel</td> <td> change body size/mass</td></tr>
                    <tr>
                        <td><code>Enter</code> key</td> <td> start simulation</td></tr>
                    <tr>
                        <td><code>B</code> key</td> <td> toggle brute-force/Barnes-Hut</td></tr>
                    <tr>
                        <td><code>C</code> key</td> <td> toggle collisions</td></tr>
                    <tr>
                        <td><code>L</code> key</td> <td> clear canvas</td></tr>
                    <tr>
                        <td><code>P</code> key</td> <td> toggle repainting</td></tr>
                    <tr>
                        <td><code>Q</code> key</td> <td> toggle quadtree lines</td></tr>
                    <tr>
                        <td><code>R</code> key</td> <td> create random bodies</td></tr>
                    <tr>
                        <td><code>1</code> key</td> <td> create Titan</td></tr>
                    <tr>
                        <td><code>2</code> key</td> <td> create spherical galaxy</td></tr>
                    <tr>
                        <td><code>3</code> key</td> <td> create spiral galaxy</td></tr>
                    <tr>
                        <td><code>?</code> key</td> <td> show help</td></tr>
                    </tbody>
                </table>
                <footer class="forklink">Made in 2017. <a href="https://github.com/voithos/graviton">Fork me on GitHub</a></footer>
                `,
            afterClose: () => {
                this.isHelpOpen = false;
            }
        });
    }

    redraw() {
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

    generateGrid(width, height, style) {
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

    generateControls() {
        this.controls = document.createElement('menu');
        this.controls.type = 'toolbar';
        this.controls.id = 'controls';
        this.controls.innerHTML = `
            <menuitem id="playbtn" data-tooltip="Start simulation">
                <img src="assets/play.svg" alt="Start simulation">
            </menuitem>
            <menuitem id="pausebtn" style="display: none;" data-tooltip="Stop simulation">
                <img src="assets/pause.svg" alt="Stop simulation">
            </menuitem>
            <menuitem id="barneshutonbtn" data-tooltip="Switch to brute force">
                <img src="assets/barnes_hut_on.svg" alt="Switch to brute force">
            </menuitem>
            <menuitem id="barneshutoffbtn" style="display: none;" data-tooltip="Switch to Barnes-Hut">
                <img src="assets/barnes_hut_off.svg" alt="Switch to Barnes-Hut">
            </menuitem>
            <menuitem id="quadtreeoffbtn" data-tooltip="Toggle quadtree lines">
                <img src="assets/quadtree_off.svg" alt="Toggle quadtree lines">
            </menuitem>
            <menuitem id="quadtreeonbtn" style="display: none;" data-tooltip="Toggle quadtree lines">
                <img src="assets/quadtree_on.svg" alt="Toggle quadtree lines">
            </menuitem>
            <menuitem id="collisionsonbtn" data-tooltip="Toggle collisions">
                <img src="assets/collisions_on.svg" alt="Toggle collisions">
            </menuitem>
            <menuitem id="collisionsoffbtn" style="display: none;" data-tooltip="Toggle collisions">
                <img src="assets/collisions_off.svg" alt="Toggle collisions">
            </menuitem>
            <menuitem id="trailoffbtn" data-tooltip="Toggle trails">
                <img src="assets/trail_off.svg" alt="Toggle trails">
            </menuitem>
            <menuitem id="trailonbtn" style="display: none;" data-tooltip="Toggle trails">
                <img src="assets/trail_on.svg" alt="Toggle trails">
            </menuitem>
            <menuitem id="helpbtn" data-tooltip="Shortcuts">
                <img src="assets/help.svg" alt="Shortcuts">
            </menuitem>
            `;

        document.body.appendChild(this.controls);
    }

    generateRandomBodies(num, args) {
        args = args || {};

        const minX = args.minX || 0;
        const maxX = args.maxX || this.options.width;
        const minY = args.minY || 0;
        const maxY = args.maxY || this.options.height;
        const halfX = (maxX - minX) / 2;
        const halfY = (maxY - minY) / 2;
        const midX = minX + halfX;
        const midY = minY + halfY;

        const minVelX = args.minVelX || 0;
        const maxVelX = args.maxVelX || 0.00001;
        const minVelY = args.minVelY || 0;
        const maxVelY = args.maxVelY || 0.00001;

        const minRadius = args.minRadius || 1;
        const maxRadius = args.maxRadius || 15;

        // Galactic args
        const numArms = args.numArms || 5;
        const armSeparation = 2 * Math.PI / numArms;
        const armOffsetMax = args.armOffsetMax || 0.5;
        const rotationFactor = args.rotationFactor || 5;
        const armRandomOffsetXY = args.armRandomOffsetXY || 0.04;

        let color = args.color;

        for (let i = 0; i < num; i++) {
            if (args.randomColors) {
                color = random.color();
            }

            let x, y, velX, velY;
            if (args.galacticDistribution) {
                // Choose a distance from the center of the galaxy.
                const dist = Math.random() > 0.5 ?
                    Math.pow(Math.random(), 1.5) :
                    random.normalFromTo(0, 1);

                const angle = Math.random() * 2 * Math.PI;
                const armOffset = (Math.random() * armOffsetMax) - (armOffsetMax / 2);
                const distArmOffset = armOffset / dist;
                let squaredArmOffset = distArmOffset * distArmOffset;
                if (armOffset < 0) {
                    squaredArmOffset *= -1;
                }

                const rotation = dist * rotationFactor;
                const polarAngle = Math.floor(angle / armSeparation) *
                    armSeparation + squaredArmOffset + rotation;

                // Convert polar coordinates to cartesian.
                let relX = Math.cos(polarAngle) * dist;
                let relY = Math.sin(polarAngle) * dist;

                relX += Math.random() * armRandomOffsetXY;
                relY += Math.random() * armRandomOffsetXY;

                x = midX + relX * halfX;
                y = midY + relY * halfY;

                // Compute velocity by rotating the angle.
                const vectorX = Math.cos(polarAngle - Math.PI / 2);
                const vectorY = Math.sin(polarAngle - Math.PI / 2);
                velX = random.number(minVelX, maxVelX) * vectorX * dist;
                velY = random.number(minVelY, maxVelY) * vectorY * dist;
            } else if (args.normalDistribution) {
                x = random.normalFromTo(minX, maxX);
                y = random.normalFromTo(minY, maxY);
                velX = random.directional(minVelX, maxVelX);
                velY = random.directional(minVelY, maxVelY);
            } else {
                x = random.number(minX, maxX);
                y = random.number(minY, maxY);
                velX = random.directional(minVelX, maxVelX);
                velY = random.directional(minVelY, maxVelY);
            }

            this.sim.addNewBody({
                x: x,
                y: y,
                velX: velX,
                velY: velY,
                radius: random.number(minRadius, maxRadius),
                color: color
            });
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
