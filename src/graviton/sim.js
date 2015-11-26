/**
 * graviton/sim -- The gravitational simulator
 */
import log from '../util/log';
import gtBody from './body';

export default class {
    constructor(args) {
        args = args || {};

        this.options = {};
        this.bodies = [];
        this.time = 0;

        this.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.options.deltaT = args.deltaT || 25000; // Timestep
        this.options.collisions = args.collision || true;
        this.options.scatterLimit = args.scatterLimit || 10000;
    }

    step() {
        this.bodies.forEach(function(body, i) {
            if (this.options.collisions === true) {
                this.detectCollision(this.bodies[i], i);
            }

            this.calculateNewPosition(body, i, this.options.deltaT);

            this.removeScattered(body, i);
        }, this);

        this.time += this.options.deltaT; // Increment runtime
    }

    calculateNewPosition(body, index, deltaT) {
        let netFx = 0;
        let netFy = 0;

        // Iterate through all bodies and sum the forces exerted
        this.bodies.forEach(function(attractor, i) {
            if (i !== index) {
                // Get the distance and position deltas
                let D = this.calculateDistance(body, attractor);

                // Calculate force using Newtonian gravity, separate out into x and y components
                let F = (this.options.G * body.mass * attractor.mass) / Math.pow(D.r, 2);
                let Fx = F * (D.dx / D.r);
                let Fy = F * (D.dy / D.r);

                netFx += Fx;
                netFy += Fy;
            }
        }, this);

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
        let D = {};

        // Calculate the change in position along the two dimensions
        D.dx = other.x - body.x;
        D.dy = other.y - body.y;

        // Obtain the distance between the objects (hypotenuse)
        D.r = Math.sqrt(Math.pow(D.dx, 2) + Math.pow(D.dy, 2));

        return D;
    }

    detectCollision(body, index) {
        this.bodies.forEach(function(collider, i) {
            if (i !== index) {
                let r = this.calculateDistance(body, collider).r;
                let clearance = body.radius + collider.radius;

                if (r <= clearance) {
                    // Collision detected
                    log.write('Collision detected!!', 'debug');
                }
            }
        }, this);
    }

    removeScattered(body, index) {
        if (body.x > this.options.scatterLimit ||
            body.x < -this.options.scatterLimit ||
            body.y > this.options.scatterLimit ||
            body.y < -this.options.scatterLimit) {
            // Remove from body collection
            return this.bodies.splice(index, 1);
        }
    }

    addNewBody(args) {
        let body = new gtBody(args);
        this.bodies.push(body);

        return body;
    }

    removeBody(index) {
        this.bodies.splice(index, 1);
    }

    clear() {
        this.bodies.length = 0; // Remove all bodies from collection
    }
} // end graviton/sim
