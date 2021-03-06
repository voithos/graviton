/**
 * colors -- Color manipulation helpers
 */
export default {
    brighten(colorArray, percent) {
        let [r, g, b] = colorArray;
        r = Math.round(Math.min(Math.max(0, r + (r * percent)), 255));
        g = Math.round(Math.min(Math.max(0, g + (g * percent)), 255));
        b = Math.round(Math.min(Math.max(0, b + (b * percent)), 255));
        return [r, g, b];
    },

    fromHex(hex) {
        let h = hex.replace('#', '');
        if (h.length < 6) {
            h = h.replace(/(.)/g, '$1$1');
        }
        return [parseInt(h.substr(0, 2), 16),
                parseInt(h.substr(2, 2), 16),
                parseInt(h.substr(4, 2), 16)];
    },

    toHex(colorArray) {
        const [r, g, b] = colorArray;
        return '#' + ('0' + r.toString(16)).substr(r < 16 ? 0 : 1) +
                     ('0' + g.toString(16)).substr(g < 16 ? 0 : 1) +
                     ('0' + b.toString(16)).substr(b < 16 ? 0 : 1);
    },

    blend(color1, color2, percentage = 0.5) {
        let parsedColor1 = this.fromHex(color1);
        let parsedColor2 = this.fromHex(color2);

        let blendedColor = [
            Math.round(Math.min(Math.max(0,
                            (1 - percentage) * parsedColor1[0] + percentage * parsedColor2[0]),
                        255)),
            Math.round(Math.min(Math.max(0,
                            (1 - percentage) * parsedColor1[1] + percentage * parsedColor2[1]),
                        255)),
            Math.round(Math.min(Math.max(0,
                            (1 - percentage) * parsedColor1[2] + percentage * parsedColor2[2]),
                        255))
        ];
        return this.toHex(blendedColor);
    }
};
