/**
 * graviton v@VERSION
 *
 * JavaScript N-body Gravitational Simulator
 *
 * Copyright (c) 2012 Zaven Muradyan
 * Licensed under the MIT license
 *
 * Revision:
 *  @REVISION
 */

define(['gtApplication', 'gtSimulation', 'gtBody', 'gtGraphics', 'gtEvents', 'gtTimer'],
    function(gtApplication, gtSimulation, gtBody, gtGraphics, gtEvents, gtTimer) {
        'use strict';

        return {
            app: gtApplication,
            sim: gtSimulation,
            body: gtBody,
            gfx: gtGraphics,
            events: gtEvents,
            timer: gtTimer
        };
    }
);
