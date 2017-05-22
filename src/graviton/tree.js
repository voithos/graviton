/**
 * graviton/tree -- The gravitational body tree structure
 */
class GtTreeNode {
    constructor(x, y, width, height) {
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

    addBody(body) {
        this.updateMass(body);
        const quadrant = this.getQuadrant(body);

        if (!this.children[quadrant]) {
            this.children[quadrant] = body;
        } else {
            const existing = this.children[quadrant];
            const quadX = existing.x > this.midX ? this.midX : this.x;
            const quadY = existing.y > this.midY ? this.midY : this.y;
            const node = new GtTreeNode(quadX, quadY, this.halfWidth, this.halfHeight);

            node.addBody(existing);
            node.addBody(body);

            this.children[quadrant] = node;
        }
    }

    updateMass(body) {
        const newMass = this.mass + body.mass;
        const newMassX = (this.massX * this.mass + body.x * body.mass) / newMass;
        const newMassY = (this.massY * this.mass + body.y * body.mass) / newMass;
        this.mass = newMass;
        this.massX = newMassX;
        this.massY = newMassY;
    }

    getQuadrant(body) {
        const xIndex = Number(body.x > this.midX);
        const yIndex = Number(body.y > this.midY) * 2;
        return xIndex + yIndex;
    }
}

export default class GtTree {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.root = undefined;
    }

    addBody(body) {
        if (this.root instanceof GtTreeNode) {
            this.root.addBody(body);
        } else if (!this.root) {
            this.root = body;
        } else {
            const existing = this.root;
            this.root = new GtTreeNode(0, 0, this.width, this.height);
            this.root.addBody(existing);
            this.root.addBody(body);
        }
    }
} // end graviton/tree
