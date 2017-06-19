/**
 * graviton/sim -- The gravitational simulator
 */
import GtBody from './body';
import GtTree from './tree';

/** Exert force on a body and update its next position. */
function exertForce(body, netFx, netFy, deltaT) {
    // Calculate accelerations
    const ax = netFx / body.mass;
    const ay = netFy / body.mass;

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
    const dx = attractor.x - body.x;
    const dy = attractor.y - body.y;

    // Obtain the distance between the objects (hypotenuse)
    const r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    // Calculate force using Newtonian gravity, separate out into x and y components
    const F = (G * body.mass * attractor.mass) / Math.pow(r, 2);
    const Fx = F * (dx / r);
    const Fy = F * (dy / r);
    return [Fx, Fy];
}

class GtBruteForceSim {
    /** G represents the gravitational constant. */
    constructor(G) {
        this.G = G;
    }

    /** Calculate the new position of a body based on brute force mechanics. */
    calculateNewPosition(body, attractors, unusedTreeRoot, deltaT) {
        let netFx = 0;
        let netFy = 0;

        // Iterate through all bodies and sum the forces exerted
        for (const attractor of attractors) {
            if (body !== attractor) {
                const [Fx, Fy] = calculateForce(body, attractor, this.G);
                netFx += Fx;
                netFy += Fy;
            }
        }

        exertForce(body, netFx, netFy, deltaT);
    }
}

class GtBarnesHutSim {
    /** G represents the gravitational constant. */
    constructor(G, theta) {
        this.G = G;
        this.theta = theta;
        this.netFx = 0;
        this.netFy = 0;
    }

    /** Calculate the new position of a body based on brute force mechanics. */
    calculateNewPosition(body, attractors, treeRoot, deltaT) {
        this.netFx = 0;
        this.netFy = 0;

        // Iterate through all bodies in the tree and sum the forces exerted
        this.calculateForceFromTree(body, treeRoot);
        exertForce(body, this.netFx, this.netFy, deltaT);
    }

    calculateForceFromTree(body, treeNode) {
        // Handle empty nodes
        if (!treeNode) {
            return;
        }

        if (!treeNode.children) {
            // The node is external (it's an actual body)
            if (body !== treeNode) {
                const [Fx, Fy] = calculateForce(body, treeNode, this.G);
                this.netFx += Fx;
                this.netFy += Fy;
            }
            return;
        }

        // The node is internal

        // Calculate the effective quadrant size and distance from center-of-mass
        const s = (treeNode.width + treeNode.height) / 2;

        const dx = treeNode.x - body.x;
        const dy = treeNode.y - body.y;
        const d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        if (s / d < this.theta) {
            // Node is sufficiently far away
            const [Fx, Fy] = calculateForce(body, treeNode, this.G);
            this.netFx += Fx;
            this.netFy += Fy;
        } else {
            // Node is close; recurse
            for (const childNode of treeNode.children) {
                this.calculateForceFromTree(body, childNode);
            }
        }
    }
}

export default class GtSim {
    constructor(args) {
        args = args || {};

        this.useBruteForce = false;

        this.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.multiplier = args.multiplier || 1500; // Timestep
        this.scatterLimit = args.scatterLimit || 5000;

        this.bodies = [];
        // Incorporate the scatter limit
        this.tree = new GtTree(
                /* width */ 2 * this.scatterLimit,
                /* height */ 2 * this.scatterLimit,
                /* startX */ (args.width - 2 * this.scatterLimit) / 2,
                /* startY */ (args.height - 2 * this.scatterLimit) / 2);
        this.time = 0;

        this.bruteForceSim = new GtBruteForceSim(this.G);
        this.barnesHutSim = new GtBarnesHutSim(this.G, /* theta */ 0.5);
        this.activeSim = this.useBruteForce ? this.bruteForceSim : this.barnesHutSim;
    }

    toggleStrategy() {
        this.useBruteForce = !this.useBruteForce;
        this.activeSim = this.useBruteForce ? this.bruteForceSim : this.barnesHutSim;
    }

    /** Calculate a step of the simulation. */
    step(elapsed) {
        if (!this.useBruteForce) {
            this.resetTree();
        }

        for (const body of this.bodies) {
            this.activeSim.calculateNewPosition(
                    body, this.bodies, this.tree.root, elapsed * this.multiplier);
        }

        this.commitPositionUpdates();
        this.time += elapsed; // Increment runtime
        this.removeScattered();
    }

    /** Update positions of all bodies to be the next calculated position. */
    commitPositionUpdates() {
        for (const body of this.bodies) {
            body.x = body.nextX;
            body.y = body.nextY;
        }
    }

    /** Scan through the list of bodies and remove any that have fallen out of the scatter limit. */
    removeScattered() {
        let i = 0;
        while (i < this.bodies.length) {
            const body = this.bodies[i];

            if (body.x > this.scatterLimit ||
                body.x < -this.scatterLimit ||
                body.y > this.scatterLimit ||
                body.y < -this.scatterLimit) {
                // Remove from body collection
                // We don't need to reset the tree here because this is a runtime (not user-based)
                // operation, and the tree is reset automatically on every step of the simulation.
                this.bodies.splice(i, 1);
            } else {
                i++;
            }
        }
    }

    /** Create and return a new body to the simulation. */
    addNewBody(args) {
        let body = new GtBody(args);
        this.bodies.push(body);
        this.resetTree();
        return body;
    }

    /** Removing a target body from the simulation. */
    removeBody(targetBody) {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (body === targetBody) {
                this.bodies.splice(i, 1);
                this.resetTree();
                break;
            }
        }
    }

    /** Lookup an (x, y) coordinate and return the body that is at that position. */
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

    /** Clear the simulation. */
    clear() {
        this.bodies.length = 0; // Remove all bodies from collection
        this.resetTree();
    }

    /** Clear and reset the quadtree, adding all existing bodies back. */
    resetTree() {
        this.tree.clear();
        for (const body of this.bodies) {
            this.tree.addBody(body);
        }
    }
} // end graviton/sim
