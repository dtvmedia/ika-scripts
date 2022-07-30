// ==UserScript==
// @name         Ikariam Island View Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       Domi95
// @match        https://*.ikariam.gameforge.com/?view=island*
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

    function fixCityFlags(id, level) {
        const Flag = $('#js_cityLocation' + id + 'Link').find('.flag');

        if (level <= 2) {
            Flag.css('left', '22px').css('top', '16px');
        } else if (level <= 5) {
            Flag.css('left', '32px').css('top', '-11px');
        } else if (level <= 8) {
            Flag.css('left', '27px').css('top', '7px');
        } else if (level <= 12) {
            Flag.css('left', '42px').css('top', '-1px');
        } else if (level <= 15) {
            Flag.css('left', '32px').css('top', '-5px');
        } else if (level <= 17) {
            Flag.css('left', '32px').css('top', '0px');
        } else if (level >= 18) {
            Flag.css('left', '32px').css('top', '-11px');
        }
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

            // todo hardcoded ally ids
            if (cityData.hasOwnProperty('ownerAllyId')) {
                // BND (pink)
                if (["5"].includes(cityData.ownerAllyId)) {
                    $('#js_cityLocation' + id + 'Link').css('filter', 'hue-rotate(290deg)');
                    fixCityFlags(id, cityData.level);
                }

                // Enemy (brown)
                if (["3"].includes(cityData.ownerAllyId)) {
                    $('#js_cityLocation' + id + 'Link').css('filter', 'hue-rotate(50deg)');
                    fixCityFlags(id, cityData.level);
                }
            }

            $('#js_cityLocation' + id + 'TitleText').text(cityData.name + ' (' + ally + cityData.ownerName + ')');

            const Scroll = $('#cityLocation' + id + 'Scroll');
            if (Scroll.hasClass('can_be_entered')) {
                Scroll.click(function() {
                    window.location = 'https://s303-en.ikariam.gameforge.com/?view=city&cityId=' + cityData.id
                });
            }
        }
    });
})();
