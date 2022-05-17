// ==UserScript==
// @name         Ikariam Island View Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Domi95
// @match        https://s51-de.ikariam.gameforge.com/?view=island*
// @icon         https://www.google.com/s2/favicons?domain=ikariam.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let tmp = window.ikariam.getScreen().update;
    window.ikariam.getScreen().update = function(data) {
        // todo why does this not work?
        console.log(data);

        return tmp(data);
    }

    $('.cityLocation:not(.cityLocationScroll)').each(function() {
        const cityWrapper = $(this);
        const id = cityWrapper.attr('id').replace('cityLocation', '');
        const cityData = window.ikariam.getScreen().data.cities[id];

        if (cityData === null || cityData === undefined) {
            console.log('no city data for id ' + id);
            return;
        }

        if (cityData.type === 'city') {
            let ally = '';
            if (cityData.hasOwnProperty('ownerAllyTag')) {
                ally = cityData.ownerAllyTag + ' | ';
            }

            $('#js_cityLocation' + id + 'TitleText').text(cityData.name + ' (' + ally + cityData.ownerName + ')')
        }
    });
})();
