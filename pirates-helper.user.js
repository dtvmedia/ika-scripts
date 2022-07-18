// ==UserScript==
// @name         Pirates helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automates the pirates tool
// @author       Blackbird
// @match        https://*.ikariam.gameforge.com/*
// @icon         https://lobby.ikariam.gameforge.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    setInterval(function(){
        var popup = document.querySelectorAll("#js_mainBoxHeaderTitle");
        if(popup.length > 0){
            if(popup.item(0).textContent == "Piratenfestung"){
                if(!document.querySelectorAll("a.button").item(0).classList.contains("button_disabled")){
                    document.querySelectorAll("a.button").item(0).click();
                }
            }
        }
    }, 1000);
})();
