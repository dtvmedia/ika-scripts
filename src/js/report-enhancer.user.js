// ==UserScript==
// @name         Ikariam Report Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       Domi95
// @match        https://*.ikariam.gameforge.com/*
// @icon         https://www.google.com/s2/favicons?domain=ikariam.com
// @grant        none
// ==/UserScript==

(function() {
    class Helper {
        static parseDate(datestring) {
            if (!datestring.includes('T')) {
                datestring = datestring.replace(
                    /([0-9]{2}).([0-9]{2}).([0-9]{4})/s,
                    function(match, day, month, year) {
                        return year + '-' + month + '-' + day
                    }
                );
            }

            return new Date(Date.parse(datestring));
        }

        static diffInDays(date1, date2 = null) {
            if (date2 === null) {
                date2 = new Date();
            }

            return (date1.getTime() - date2.getTime()) / (1000 * 3600 * 24);
        }

        static waitForElement(selector) {
            return new Promise(function(resolve, reject) {
                const element = document.querySelector(selector);

                if (element) {
                    resolve(element);
                    return;
                }

                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        const nodes = Array.from(mutation.addedNodes);
                        for (let node of nodes) {
                            if ((node.matches && node.matches(selector)) || $(node).find(selector).length > 0) {
                                observer.disconnect();
                                resolve(node);
                                return;
                            }
                        }
                    });
                });

                observer.observe(document.documentElement, {childList: true, subtree: true});
            });
        }
    }

    class IkariamCombat {
        constructor(id, targetCity, targetPlayer, time, result) {
            this.id = parseInt(id);
            this.targetCity = targetCity;
            this.targetPlayer = targetPlayer;
            this.time = time;
            this.result = result;
        }
    }

    class IkariamCity {
        constructor(id, name, coords) {
            this.id = parseInt(id);
            this.name = name;
            this.coords = coords;
        }
    }

    class IkariamPlayer {
        constructor(id, name) {
            this.id = parseInt(id);
            this.name = name;
        }
    }

    class IkariamCombatReportDB {
        constructor() {
            this.data = {};
            this.storageKey = 'IkariamCombatReportDB';

            this.load();
        }

        load() {
            let data = localStorage.getItem(this.storageKey);

            if (data === null) {
                return;
            }

            data = JSON.parse(data);

            for (let combatId in data) {
                const targetPlayer = data[combatId].targetPlayer;
                const targetCity = data[combatId].targetCity;

                this.addCombat(
                    new IkariamCombat(
                        combatId,
                        new IkariamCity(targetCity.id, targetCity.name, targetCity.coords),
                        new IkariamPlayer(targetPlayer.id, targetPlayer.name),
                        Helper.parseDate(data[combatId].time),
                        data[combatId].result
                    )
                )
            }

            this.prune();
        }

        save() {
            console.log('Save combat report DB (Entries: ' + this.count() + ')');
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        }

        clear() {
            this.data = {};
            localStorage.removeItem(this.storageKey);
        }

        prune() {
            const now = new Date();

            for (let key in this.data) {
                if (Helper.diffInDays(now, this.data[key].time) > 5) {
                    delete this.data[key];
                }
            }
        }

        count() {
            return Object.keys(this.data).length;
        }

        addCombat(combat) {
            if (!combat instanceof IkariamCombat) {
                console.warn('Invalid combat object given');
            }

            if (this.data.hasOwnProperty(combat.id)) {
                return;
            }

            this.data[combat.id] = combat;
        }

        getLastUpdatedTime() {
            let lastUpdate = null;

            for (let combatId in this.data) {
                const time = this.data[combatId].time;

                if (lastUpdate === null || time > lastUpdate) {
                    lastUpdate = time;
                }
            }

            return lastUpdate;
        }

        getCombatsByFilter(filter, limit = null) {
            let combats = Object.values(this.data)
                .filter(filter)
                .sort(function(a, b) {
                    if (a.time < b.time) {
                        return 1;
                    }

                    if (a.time > b.time) {
                        return -1;
                    }

                    return 0;
                });

            if (limit !== null) {
                combats.length = Math.min(combats.length, limit)
            }

            return combats;
        }

        getCombatsByCity(cityId, limit = null) {
            cityId = parseInt(cityId);

            return this.getCombatsByFilter(function(combat) {
                return combat.targetCity.id === cityId;
            }, limit);
        }

        getCombatsByPlayer(playerId, limit = null) {
            playerId = parseInt(playerId);

            return this.getCombatsByFilter(function(combat) {
                return combat.targetPlayer.id === playerId;
            }, limit);
        }
    }

    class IkariamCombatListResponseHandler {
        constructor(response) {
            const html = this.parseHtml(response);

            if (html === null) {
                throw new Error('Unexpected response format!');
            }

            IkariamCombatListResponseHandler.parseCombatData(html);
        }

        parseHtml(data) {
            data = JSON.parse(data);

            let html = null;
            data.forEach(function(dataPart) {
                if (dataPart[0] === 'changeView') {
                    try {
                        html = $('<div>' + dataPart[1][1] + '</div>');
                    } catch (e) {
                        console.error('Creating HTML from response failed: ' + e);
                        return false;
                    }
                }
            });

            if (html === null) {
                console.warn('HTML is empty!');
                return null;
            }

            console.log('HTML FOUND');

            return html;
        }

        static parseCombatData(html) {
            html.find('#combatList tr.green, #combatList tr.red').each(function(key, row) {
                row = $(row);

                // id
                const id = row.find('td:nth-of-type(1) input').attr('name').replace('combatId[', '').replace(']', '');

                // time
                const timeString = Helper.parseDate(row.find('td:nth-of-type(3)').text().trim());

                // city
                const cityCell = row.find('td:nth-of-type(5)');
                const cityId = cityCell.find('a').attr('href').replace('?view=island&cityId=', '');
                const regex = /(.*) (\[.*])/s;
                let matches;
                let cityObj;

                if ((matches = regex.exec(cityCell.text().trim())) !== null) {
                    const cityName = matches[1];
                    const cityCoords = matches[2];
                    cityObj = new IkariamCity(cityId, cityName, cityCoords);
                } else {
                    console.log('Skip parsing of line ' + (key + 1));
                    return;
                }

                // player
                const playerCell = row.find('td:nth-of-type(6)');

                if (playerCell.find('a').length === 0) {
                    return;
                }

                const playerId = playerCell.find('a').attr('href').replace('?view=avatarProfile&avatarId=', '');
                const playerName = playerCell.text().trim();
                const player = new IkariamPlayer(playerId, playerName);

                // result
                const result = row.hasClass('green') ? 'green' : 'red';

                IkariamReportEnhancer.DB.addCombat(new IkariamCombat(id, cityObj, player, timeString, result));
            });

            IkariamReportEnhancer.DB.save();
        }
    }

    class IkariamReportEnhancerController {
        constructor() {
            // Init global DB object
            this.DB = new IkariamCombatReportDB();

            // Hook the execAjaxRequest call
            this.hookExecAjaxRequestCall();
        }

        hookExecAjaxRequestCall() {
            window.ikariam.controller.executeAjaxRequestParent = window.ikariam.controller.executeAjaxRequest;
            window.window.ikariam.controller.executeAjaxRequest = this.executeAjaxRequest.bind(this);
        }

        executeAjaxRequest(url, callback, data, async) {
            const params = new URLSearchParams(url);

            if (params.get('view') === 'militaryAdvisorCombatList' && (params.get('activeTab') === 'tab_militaryAdvisorCombatList' || params.get('activeTab') === 'combatReports')) {
                this.onReportViewOpen();
            } else if (params.get('view') === 'cityDetails' && params.has('destinationCityId')) {
                this.onCityPopupOpen(params.get('destinationCityId'));
            }

            return window.ikariam.controller.executeAjaxRequestParent.call(window.ikariam.controller, url, callback, data, async);
        }

        onReportViewOpen() {
            console.log('REPORT VIEW!');

            $('#combatList').remove();

            Helper.waitForElement('#combatList').then(function(html) {
                IkariamCombatListResponseHandler.parseCombatData($(html));
            });
        }

        onCityPopupOpen(cityId) {
            console.log('CITY VIEW! ' + cityId);

            $('#sidebar').remove();

            Helper.waitForElement('#sidebar').then(function(cityActions) {
                cityActions = $('#sidebar .accordionItem .cityactions');
                console.log('Sidebar found!');
                const cityCombats = this.DB.getCombatsByCity(cityId, 5);
                const Enhancer = $('<div style="clear: both"><table class="table01 dotted" style="width: 98%; margin-bottom: -10px;"><thead><tr><th class="left" style="background-color: rgb(220, 172, 106); border-top: 1px solid rgb(152,105,27);">Zeit</th></tr></thead><tbody></tbody></table></div>');

                cityCombats.forEach(function(combat) {
                    Enhancer.find('tbody').append(
                        $('<tr class="' + combat.result + '"><td class="left" style="cursor: pointer" onclick="ajaxHandlerCall(\'?view=militaryAdvisorReportView&combatId=' + combat.id + '&activeTab=combatReports\');return false;">' + combat.time.toLocaleString() + '</td></tr>')
                    );
                });

                if (cityCombats.length === 0) {
                    Enhancer.find('tbody').append(
                        $('<tr><td class="left"><i>Keine Berichte gefunden...</i></td></tr>')
                    );
                }

                cityActions.parent().append(Enhancer);
            }.bind(this));
        }

        update() {
            this.updatePage(0);
        }

        updatePage(page) {
            ajaxHandlerCall(
                '?view=militaryAdvisorCombatList&activeTab=tab_militaryAdvisorCombatList&reportsPage=' + page,
                IkariamCombatListResponseHandler
            );
        }
    }

    window.IkariamReportEnhancer = new IkariamReportEnhancerController();
})();
