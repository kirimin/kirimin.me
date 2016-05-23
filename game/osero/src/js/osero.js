var $ = require('jquery');
var game = require('./osero.game.js');

module.exports = (function() {
    'use strict';

    var initModule = function() {
        $('.menu_manual').on("click", function() {
            newGame('manual');
        });
        $('.menu_ai_1').on("click", function() {
            newGame('ai_1');
        });
        $('.menu_ai_2').on("click", function() {
            newGame('ai_2');
        });
        $('.menu_ai_3').on("click", function() {
            newGame('ai_3');
        });
        game.setOnReturnMenuClickListener(function() {
            showMenu();
        });
    };

    var newGame = function(level) {
        $('.menu').hide("fast");
        $('.board').show("fast");
        game.setAiLevel(level);
        game.initModule($('.board'));
    };

    var showMenu = function() {
        $('.menu').show("fast");
        $('.board').hide("fast");
    }

    return {
        initModule: initModule
    };
}());
