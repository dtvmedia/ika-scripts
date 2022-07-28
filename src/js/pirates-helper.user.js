// ==UserScript==
// @name         Ikariam pirates helper
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Automates the pirates tool
// @author       Blackbird & Domi95
// @match        https://*.ikariam.gameforge.com/*
// @icon         https://www.google.com/s2/favicons?domain=ikariam.com
// @grant        GM.xmlHttpRequest
// @grant        GM_log
// ==/UserScript==

(function() {
    // ------------------ CONFIG AREA START -------------------

    const CFG_API_KEY = '';
    const CFG_WITH_SOUND = true;
    const CFG_CHECK_SEC = 5;

    // ------------------ CONFIG AREA END -------------------

    /**
     * Pirates helper main handler
     */
    class PiratesHelper {
        /**
         * Initializes a new instance
         */
        constructor() {
            this.captchaSolver = new CaptchaSolver(CFG_API_KEY);
            this.checkInterval = null;
            this.beepSound = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
        }

        /**
         * Starts the pirate state checks
         */
        start() {
            this.checkInterval = setInterval(this.check.bind(this), CFG_CHECK_SEC * 1000);
        }

        /**
         * Stops the pirate state checks
         */
        stop() {
            clearInterval(this.checkInterval);
        }

        /**
         * Executes a pirate state check
         */
        check() {
            if (ikariam.getTemplateData()?.view !== 'pirateFortress') {
                return;
            }

            if ($('#captcha').length > 0) {
                // Captcha found -> play sound & try to solve it
                if (CFG_WITH_SOUND) {
                    this.beepSound.play();
                }

                if (CFG_API_KEY.length > 0 && this.captchaSolver.captchaId === null) {
                    this.captchaSolver.initCaptchaSolver(document.querySelector('.captchaImage'));
                }
            } else if ($("a.button.capture").length > 0) {
                // No captcha -> trigger pirate run
                $("a.button.capture").first().click();
            }
        }
    }

    /**
     * Tries to solve a captcha using the captcha2 API
     */
    class CaptchaSolver {
        /**
         * Initializes a new instance
         *
         * @param apiKey
         */
        constructor(apiKey) {
            this.apiKey = apiKey;
            this.captchaId = null;
            this.pollingInterval = null;
        }

        /**
         * Sends the captcha image to the service
         *
         * @param img
         */
        initCaptchaSolver(img) {
            if (this.apiKey.length !== 32) {
                GM_log('No valid API key given...');

                return;
            }

            if (this.captchaId !== null) {
                GM_log('There is already a captcha being processed...');

                return;
            }

            GM.xmlHttpRequest({
                url: 'https://2captcha.com/in.php',
                method: 'POST',
                onload: function(response) {
                    const res = JSON.parse(response.responseText);
                    GM_log(res);

                    if (res.status !== 1) {
                        this.clear();
                        return;
                    }

                    this.captchaId = res.request;
                    this.pollingInterval = setInterval(this.getCaptchaSolution.bind(this), 5000);
                }.bind(this),
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                data: 'json=1&key=' + this.apiKey + '&method=base64&max_len=10&min_len=5&language=2&body=' + this.getBase64Image(img)
            });
        }

        /**
         * Checks if the service already found a solution
         */
        getCaptchaSolution() {
            if (this.apiKey.length !== 32) {
                GM_log('No valid API key given...');

                return;
            }

            if (this.captchaId === null) {
                GM_log('There is no captcha currently processed...');

                return;
            }

            if (ikariam.getTemplateData()?.view !== 'pirateFortress') {
                this.clear();

                return;
            }

            GM.xmlHttpRequest({
                url: 'https://2captcha.com/res.php?json=1&key=' + this.apiKey + '&action=get&id=' + this.captchaId,
                method: 'GET',
                onload: function(response) {
                    const res = JSON.parse(response.responseText);
                    GM_log(res);

                    // not ready -> try again
                    if (res.request === 'CAPCHA_NOT_READY') {
                        return;
                    }

                    // unresolvable -> submit wrong string in order to get another captcha
                    if (res.request === 'ERROR_CAPTCHA_UNSOLVABLE') {
                        this.submitSolution('X');
                        this.clear();
                        return;
                    }

                    // other error -> end processing
                    if (res.status !== 1) {
                        this.clear();
                        return;
                    }

                    // Solution found -> submit
                    this.submitSolution(res.request);
                    this.clear();
                }.bind(this),
            });
        }

        /**
         * Submits the found solution
         *
         * @param solution
         */
        submitSolution(solution) {
            GM_log('Found Solution: ' + solution);
            const captchaInput = $('#captcha');

            captchaInput.val(solution);
            captchaInput.parents('form').submit();
        }

        /**
         * Clears the currently processing captcha
         */
        clear() {
            GM_log('Clear captcha solver');
            this.captchaId = null;
            clearInterval(this.pollingInterval);
        }

        /**
         * Returns the base64 string of the given image element
         *
         * @param img
         *
         * @returns {string}
         */
        getBase64Image(img) {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            return canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");
        }
    }

    new PiratesHelper().start();
})();
