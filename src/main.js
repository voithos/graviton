import './vendor/jscolor';
import vex from './vendor/vex';
import './polyfills';
import gt from './graviton';

window.onload = function() {
    // Set options for dependencies.
    vex.defaultOptions.className = 'vex-theme-wireframe';

    // Start the main graviton app.
    window.graviton = new gt.app();
};
