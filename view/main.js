require.config({
    baseUrl: '../src'
});

require(['../src/graviton'], function(gt) {
    // Start the main graviton app
    var graviton = gt.app();
});
