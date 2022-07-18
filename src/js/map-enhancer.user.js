// ==UserScript==
// @name         Ikariam Map Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       Domi95
// @match        https://*.ikariam.gameforge.com/*?view=worldmap_iso*
// @icon         https://www.google.com/s2/favicons?domain=ikariam.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function init() {
        bindEventHandler();
        updateMapEmptyIslands();
        updateMapOwnIslands();
    }

    function bindEventHandler() {
        $( "#worldview" ).mouseup(function() {
            updateMapEmptyIslands();
        });
    }

    function updateMapEmptyIslands() {
        $('.cities').each(function() {
            if(this.innerText === "0") {
                $(this).parent().css('opacity', 0.5);
            } else {
                $(this).parent().css('opacity', 1);
            }
        });
    }

    function updateMapOwnIslands() {
        $('.own, .ally').css('filter', 'drop-shadow(0px 10px 4px #000)');
        $('.piracyInRange').css('opacity', 0.75);
    }

    console.log('Ikariam Enhancer loaded :)');
    init();
})();
