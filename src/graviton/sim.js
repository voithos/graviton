/**
 * graviton/sim -- The gravitational simulator
 */
import GtBody from './body';
import GtTree from './tree';

export default class GtSim {
    constructor(args) {
        args = args || {};

        this.options = {};
        this.bodies = [];
        this.tree = new GtTree(args.width, args.height);
        this.time = 0;

        // Temporary workspace
        this.D = {};

        this.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.options.multiplier = args.multiplier || 1500; // Timestep
        this.options.scatterLimit = args.scatterLimit || 10000;
    }

    step(elapsed) {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            this.calculateNewPosition(body, i, elapsed * this.options.multiplier);
            i = this.removeScattered(body, i);
        }

        this.time += elapsed; // Increment runtime
    }

    calculateNewPosition(body, index, deltaT) {
        let netFx = 0;
        let netFy = 0;

        // Iterate through all bodies and sum the forces exerted
        for (let i = 0; i < this.bodies.length; i++) {
            const attractor = this.bodies[i];
            if (i !== index) {
                // Get the distance and position deltas
                this.calculateDistance(body, attractor);

                // Calculate force using Newtonian gravity, separate out into x and y components
                let F = (this.options.G * body.mass * attractor.mass) / Math.pow(this.D.r, 2);
                let Fx = F * (this.D.dx / this.D.r);
                let Fy = F * (this.D.dy / this.D.r);

                netFx += Fx;
                netFy += Fy;
            }
        }

        // Calculate accelerations
        let ax = netFx / body.mass;
        let ay = netFy / body.mass;

        // Calculate new velocities, normalized by the 'time' interval
        body.velX += deltaT * ax;
        body.velY += deltaT * ay;

        // Calculate new positions after timestep deltaT
        body.x += deltaT * body.velX;
        body.y += deltaT * body.velY;
    }

    calculateDistance(body, other) {
        // Calculate the change in position along the two dimensions
        this.D.dx = other.x - body.x;
        this.D.dy = other.y - body.y;

        // Obtain the distance between the objects (hypotenuse)
        this.D.r = Math.sqrt(Math.pow(this.D.dx, 2) + Math.pow(this.D.dy, 2));
    }

    removeScattered(body, index) {
        if (body.x > this.options.scatterLimit ||
            body.x < -this.options.scatterLimit ||
            body.y > this.options.scatterLimit ||
            body.y < -this.options.scatterLimit) {
            // Remove from body collection
            // TODO: Implement for tree.
            this.bodies.splice(index, 1);
            return index - 1;
        }
        return index;
    }

    addNewBody(args) {
        let body = new GtBody(args);
        this.bodies.push(body);
        this.tree.addBody(body);

        return body;
    }

    removeBody(targetBody) {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (body === targetBody) {
                this.bodies.splice(i, 1);
                break;
            }
        }
        this.resetTree();
    }

    getBodyAt(x, y) {
        for (let i = this.bodies.length - 1; i >= 0; i--) {
            const body = this.bodies[i];
            const isMatch = Math.abs(x - body.x) <= body.radius &&
                Math.abs(y - body.y) <= body.radius;
            if (isMatch) {
                return body;
            }
        }
        return undefined;
    }

    clear() {
        this.bodies.length = 0; // Remove all bodies from collection
        this.resetTree();
    }

    resetTree() {
        this.tree.clear();
        for (const body of this.bodies) {
            this.tree.addBody(body);
        }
    }
} // end graviton/sim
