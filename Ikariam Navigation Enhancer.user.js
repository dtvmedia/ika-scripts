// ==UserScript==
// @name         Ikariam Navigation Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Domi95
// @match        https://s51-de.ikariam.gameforge.com/*
// @icon         https://www.google.com/s2/favicons?domain=ikariam.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    class IkariamCity {
        constructor(id, name, coords, good) {
            this.id = id;
            this.name = name;
            this.coords = coords;
            this.good = good;
            this.wood = null;
            this.wine = null;
            this.marble = null;
            this.glass = null;
            this.sulfur = null;
        }

        setGoods(wood, wine, marble, glass, sulfur) {
            this.wood = wood;
            this.wine = wine;
            this.marble = marble;
            this.glass = glass;
            this.sulfur = sulfur;
        }

        getGoodName() {
            switch (this.good) {
                case 1:
                    return 'wine';
                case 2:
                    return 'marble';
                case 3:
                    return 'glass';
                case 4:
                    return 'sulfur';
                default:
                    throw new Error('Invalid good id ' + this.good);
            }
        }
    }

    class IkariamNavigationEnhancer {
        constructor() {
            this.cityData = null;
            this.currentCityId = null;
        }

        init() {
            this.updateCityData();
            this.buildNavigation();
            this.bindEventHandler();
            this.addStyles();
        }

        addStyles() {
            const style = $('<style>').text(`
/** Ikariam Navigation Enhancer **/
.dtv-navigation {
    position: fixed;
    display: inline-block;
    bottom: 0;
    z-index: 99999;
    background: wheat;
    margin: auto;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 12px #575757;
}

.dtv-navigation div {
    display: inline-block;
    padding: 8px 0px;
}

.dtv-navigation div a {
     padding: 8px 20px;
}

.dtv-navigation div a:hover {
     background-color: #e2ca9b !important;
}

.dtv-navigation div.active {
     background-color: #d8ba80 !important;
}`);

            style.appendTo(document.head);
        }

        bindEventHandler() {
            document.onkeydown = function(e) {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    return;
                }

                switch (e.key) {
                    case 'ArrowLeft':
                        console.log(e);
                        this.prevCity();
                        break;
                    case 'ArrowRight':
                        this.nextCity();
                        break;
                    default:
                        return;
                }
            }.bind(this);
        }

        clearNavigation() {
            $('.dtv-navigation').remove();
        }

        buildNavigation() {
            const navigation = $('<div class="dtv-navigation">');

            this.cityData.forEach(function(city) {
                const cityItem = $('<div class="dropDownButton tradegood ' + city.getGoodName() + '"><a href="javascript:void(0)">' + city.name + '</a></div>');

                if (city.id === this.currentCityId) {
                    cityItem.addClass('active');
                }

                cityItem.click(function() {
                    this.changeCity(city.id);
                }.bind(this));

                navigation.append(cityItem);
            }.bind(this));

            $('body').append(navigation);
        }

        changeCity(id) {
            this.currentCityId = id;
            $('#js_cityIdOnChange').val(id);
            $('#changeCityForm').trigger('submit');

            this.clearNavigation();
            this.buildNavigation();
        }

        getKeyOfCurrentCity() {
            let currentKey = null;

            this.cityData.forEach(function(city, key) {
                if (city.id === this.currentCityId) {
                    currentKey = key;
                }
            }.bind(this));

            return currentKey;
        }

        getCityByKey(key) {
            return this.cityData[key];
        }

        prevCity() {
            const currentKey = this.getKeyOfCurrentCity();
            let preKey = currentKey - 1;

            if (preKey < 0) {
                preKey = this.cityData.length - 1;
            }

            const city = this.getCityByKey(preKey);
            this.changeCity(city.id);
        }

        nextCity() {
            const currentKey = this.getKeyOfCurrentCity();
            let nextKey = currentKey + 1;

            if (nextKey >= this.cityData.length) {
                nextKey = 0;
            }

            const city = this.getCityByKey(nextKey);
            this.changeCity(city.id);
        }

        updateCityData() {
            let cities = [];
            let city = null;

            for (let key in ikariam.model.relatedCityData) {
                if (!key.startsWith('city_')) {
                    continue;
                }

                city = ikariam.model.relatedCityData[key];

                cities.push(new IkariamCity(
                    city.id,
                    city.name,
                    city.coords,
                    parseInt(city.tradegood),
                ));
            }

            this.cityData = cities;

            try {
                this.currentCityId = ikariam.model.relatedCityData[ikariam.model.relatedCityData.selectedCity].id;
            } catch (e) {
            }
        }
    }

    new IkariamNavigationEnhancer().init();
})();
