import './vendor/jscolor';
import './polyfills';
import gt from './graviton';

window.onload = function() {
    // Start the main graviton app.
    window.graviton = new gt.app();
};
