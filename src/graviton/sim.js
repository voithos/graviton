/**
 * graviton/sim -- The gravitational simulator
 */
import GtBody from './body';
import GtTree from './tree';

class GtBruteForceSim {
    /** G represents the gravitational constant. */
    constructor(G) {
        this.G = G;
    }

    /** Calculate the new position of a body based on brute force mechanics. */
    calculateNewPosition(body, attractors, deltaT) {
        let netFx = 0;
        let netFy = 0;

        // Iterate through all bodies and sum the forces exerted
        for (const attractor of attractors) {
            if (body !== attractor) {
                // Calculate the change in position along the two dimensions
                const dx = attractor.x - body.x;
                const dy = attractor.y - body.y;

                // Obtain the distance between the objects (hypotenuse)
                const r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

                // Calculate force using Newtonian gravity, separate out into x and y components
                let F = (this.G * body.mass * attractor.mass) / Math.pow(r, 2);
                let Fx = F * (dx / r);
                let Fy = F * (dy / r);

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
}

export default class GtSim {
    constructor(args) {
        args = args || {};

        this.useBruteForce = true;

        this.bodies = [];
        this.tree = new GtTree(args.width, args.height);
        this.time = 0;

        this.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.multiplier = args.multiplier || 1500; // Timestep
        this.scatterLimit = args.scatterLimit || 10000;

        this.bruteForceSim = new GtBruteForceSim(this.G);
    }

    step(elapsed) {
        if (!this.useBruteForce) {
            this.resetTree();
        }

        for (const body of this.bodies) {
            this.bruteForceSim.calculateNewPosition(
                    body, this.bodies, elapsed * this.multiplier);
        }

        this.time += elapsed; // Increment runtime
        this.removeScattered();
    }

    removeScattered() {
        let i = 0;
        while (i < this.bodies.length) {
            const body = this.bodies[i];

            if (body.x > this.scatterLimit ||
                body.x < -this.scatterLimit ||
                body.y > this.scatterLimit ||
                body.y < -this.scatterLimit) {
                // Remove from body collection
                this.bodies.splice(i, 1);
            } else {
                i++;
            }
        }
    }

    addNewBody(args) {
        let body = new GtBody(args);
        this.bodies.push(body);
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
    }

    resetTree() {
        this.tree.clear();
        for (const body of this.bodies) {
            this.tree.addBody(body);
        }
    }
} // end graviton/sim
