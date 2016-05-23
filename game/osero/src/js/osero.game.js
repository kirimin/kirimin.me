var $ = require('jquery');

module.exports = (function() {
    'use strict';

    var $board;
    var onReturnMenuClickListener;
    var currentPlayer, aiLevel = 'manual', onAiWait = false;

    // 初期化処理
    var initModule = function($container) {
        currentPlayer = 'black';
        $board = $container;
        onAiWait = false;

        // 盤面を生成
        var boardHtml = '<table class="board_table">';
        for (var i = 0; i < 8; i++) {
            boardHtml += '<tr>';
            for (var j = 0; j < 8; j++) {
                boardHtml += '<td class="' + i + '_' + j + '"><span></span></td>';
            }
            boardHtml += '</tr>';
        }
        boardHtml += '</table>';
        boardHtml += '<p class="current_player">黒のターンです。</p>'
        boardHtml += '<p class="return_menu">メニューに戻る</p>';
        $board.html(boardHtml);

        // 初期配置
        putStone('3_3', 'white');
        putStone('3_4', 'black');
        putStone('4_3', 'black');
        putStone('4_4', 'white');

        // マスのJqueryオブジェクトにイベントバインド
        $('td', $board).each(function() {
            var $place = $(this);
            var position = $place.attr('class');
            $place.on('click', function() {
                onBoardClick(position);
            });
        });

        $('.return_menu', $board).on('click', onReturnMenuClickListener);
    };

    //
    var setAiLevel = function(level) {
      aiLevel = level;
    }

    // メニューに戻るボタン押下時リスナー
    var setOnReturnMenuClickListener = function(listener) {
        onReturnMenuClickListener = listener;
    }

    // マスのクリック時イベント
    var onBoardClick = function(position) {
        if (onAiWait) {
          return;
        }
        if (!(getSpanByPosition(position).attr('class') == null)) {
            return;
        }
        var positionArray = position.split('_');
        var x = Number(positionArray[1]);
        var y = Number(positionArray[0]);
        var changeList = changePlaceList(x, y, currentPlayer);
        if (changeList.length === 0) {
            return;
        }
        putStone(position, currentPlayer);
        changeList.forEach(function(val, index, ar) {
            putStone(val, currentPlayer);
        });
        // ターン変更
        changePlayer();
        if (!canNext(currentPlayer)) {
            var passPlayer = currentPlayer;
            changePlayer();
            if (!canNext(currentPlayer)) {
                // ゲームオーバー
                showGameOver();
                return;
            }
            // パス
            alert(getColorText(passPlayer) + 'は置ける手が無いためパスします。');
        };

        // AIターン
        if (aiLevel !== 'manual' && currentPlayer === 'white') {
          var ai;
          if (aiLevel === 'ai_1'){
            ai = aiLevel1;
          } else if (aiLevel === 'ai_2') {
            ai = aiLevel2;
          } else {
            ai = aiLevel3;
          }
          onAiWait = true;
          setTimeout(function(){
            onAiWait = false;
            onBoardClick(ai('white'));
          }, 500);
        }
    };

    // 石を置く
    var putStone = function(position, color) {
        var span = getSpanByPosition(position);
        span.removeClass('white');
        span.removeClass('black');
        span.addClass(color);
    }

    // position(x_yの文字列)からspanを取得
    var getSpanByPosition = function(position) {
        return $('span', $('.' + position, $board));
    }

    // 現在のプレイヤーを切り替える
    var changePlayer = function() {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        $('.current_player').text(getColorText(currentPlayer) + 'のターンです。');
    }

    // 指定した位置に石を置いた時に返せる場所のリスト
    var changePlaceList = function(x, y, color) {
        return searchChangePlacesRight(x, y, currentPlayer)
            .concat(searchChangePlacesLeft(x, y, currentPlayer))
            .concat(searchChangePlacesBottom(x, y, currentPlayer))
            .concat(searchChangePlacesTop(x, y, currentPlayer))
            .concat(searchChangePlacesRightBottom(x, y, currentPlayer))
            .concat(searchChangePlacesLeftTop(x, y, currentPlayer))
            .concat(searchChangePlacesRightTop(x, y, currentPlayer))
            .concat(searchChangePlacesLeftBottom(x, y, currentPlayer));
    }

    // 次に置ける手があるか
    var canNext = function(color) {
        var result = false;
        $('td', $board).each(function() {
            var $place = $(this);
            var position = $place.attr('class');
            var placeColor = getSpanByPosition(position).attr('class');
            if (placeColor != null) {
                return;
            }
            var positionArray = position.split('_');
            var x = Number(positionArray[1]);
            var y = Number(positionArray[0]);
            if (changePlaceList(x, y, color).length > 0) {
                result = true;
                return false;
            }
        });
        return result;
    }

    //
    var getCanPutPlaceList = function(color) {
        var result = [];
        $('td', $board).each(function() {
            var $place = $(this);
            var position = $place.attr('class');
            var placeColor = getSpanByPosition(position).attr('class');
            if (placeColor != null) {
                return;
            }
            var positionArray = position.split('_');
            var x = Number(positionArray[1]);
            var y = Number(positionArray[0]);
            if (changePlaceList(x, y, color).length > 0) {
                result.push(position);
            }
        });
        return result;
    }

    // 石の数を数える
    var stoneCount = function(color) {
        var count = 0;
        $('td', $board).each(function() {
            var $place = $(this);
            var position = $place.attr('class');
            var placeColor = getSpanByPosition(position).attr('class');
            if (placeColor === color) {
                count++;
            }
        });
        return count;
    }

    // black, whiteを白, 黒に変換
    var getColorText = function(color) {
        return color === 'black' ? '黒' : '白';
    }

    // ゲーム終了処理
    var showGameOver = function() {
        var blackCount = stoneCount('black');
        var whiteCount = stoneCount('white');
        var winner = blackCount === whiteCount ? '引き分けです。' : blackCount > whiteCount ? '黒の勝ちです。' : '白の勝ちです。';
        var text = '黒:' + blackCount + ', 白:' + whiteCount + 'で' + winner;
        alert(text);
        $('.current_player').text(text);
    }

    // AI １番多く返せる手を選ぶ
    var aiLevel1 = function(color) {
      var max = {
        count: 0,
        position: '0_0'
      };
      getCanPutPlaceList().forEach(function(position) {
        var positionArray = position.split('_');
        var x = Number(positionArray[1]);
        var y = Number(positionArray[0]);
        var count = changePlaceList(x, y, color).length;
        if (count > max.count) {
          max.count = count;
          max.position = position;
        }
      });
      return max.position;
    }

    var aiLevel2 = function(color) {
      var scoreMap = [
        [120, -20, 20, 5, 5, 20, -20, 120],
        [-20, -40, -5, -5, -5, -5, -40, -20],
        [20, -5, 15, 3, 3, 15, -5, 20],
        [5, -5, 3, 3, 3, 3, -5, 20],
        [5, -5, 3, 3, 3, 3, -5, 20],
        [20, -5, 15, 3, 3, 15, -5, 20],
        [-20, -40, -5, -5, -5, -5, -40, -20],
        [120, -20, 20, 5, 5, 20, -20, 120]
      ];
      return aiScoreMapping(color, scoreMap);
    }

    var aiLevel3 = function(color) {
      var scoreMap = [
        [30, -12, 0, -1, -1, 0, -12, 30],
        [-12, -15, -3, -3, -3, -3, -15, -12],
        [0, -3, 0, -1, -1, 0, -3, 0],
        [-1, -3, -1, -1, -1, -1, -3, -1],
        [-1, -3, -1, -1, -1, -1, -3, -1],
        [0, -3, 0, -1, -1, 0, -3, 0],
        [-12, -15, -3, -3, -3, -3, -15, -12],
        [120, -20, 20, 5, 5, 20, -20, 120]
      ];
      return aiScoreMapping(color, scoreMap);
    }

    var aiScoreMapping = function(color, scoreMap) {
      var max = {
        count: -1000,
        position: '0_0'
      };
      getCanPutPlaceList().forEach(function(position) {
        var positionArray = position.split('_');
        var x = Number(positionArray[1]);
        var y = Number(positionArray[0]);
        var list = changePlaceList(x, y, color);
        var score = list.map(function(position){
          var positionArray = position.split('_');
          var x = Number(positionArray[1]);
          var y = Number(positionArray[0]);
          return scoreMap[y][x];
        }).reduce(function(x, y) { return x + y; });
        score += scoreMap[y][x];
        if (score > max.count) {
          max.count = score;
          max.position = position;
        }
      });
      return max.position;
    }

    var searchChangePlacesRight = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        for (var i = x + 1; i < 8; i++) {
            colorTemp = getSpanByPosition(y + '_' + i).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(y + '_' + i);
        }
        return [];
    }

    var searchChangePlacesLeft = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        for (var i = x - 1; i >= 0; i--) {
            colorTemp = getSpanByPosition(y + '_' + i).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(y + '_' + i);
        }
        return [];
    }

    var searchChangePlacesBottom = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        for (var i = y + 1; i < 8; i++) {
            colorTemp = getSpanByPosition(i + '_' + x).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(i + '_' + x);
        }
        return [];
    }

    var searchChangePlacesTop = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        for (var i = y - 1; i >= 0; i--) {
            colorTemp = getSpanByPosition(i + '_' + x).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(i + '_' + x);
        }
        return [];
    }

    var searchChangePlacesRightBottom = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        while (true) {
            y++;
            x++;
            colorTemp = getSpanByPosition(y + '_' + x).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(y + '_' + x);
        }
        return [];
    }

    var searchChangePlacesLeftTop = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        while (true) {
            y--;
            x--;
            colorTemp = getSpanByPosition(y + '_' + x).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(y + '_' + x);
        }
        return [];
    }

    var searchChangePlacesRightTop = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        while (true) {
            y--;
            x++;
            colorTemp = getSpanByPosition(y + '_' + x).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(y + '_' + x);
        }
        return [];
    }

    var searchChangePlacesLeftBottom = function(x, y, color) {
        var colorTemp;
        var changePlaceList = [];

        while (true) {
            y++;
            x--;
            colorTemp = getSpanByPosition(y + '_' + x).attr("class");
            if (colorTemp == null) {
                return [];
            }
            if (colorTemp === color) {
                return changePlaceList;
            }
            changePlaceList.push(y + '_' + x);
        }
        return [];
    }

    return {
        initModule: initModule,
        setAiLevel: setAiLevel,
        setOnReturnMenuClickListener: setOnReturnMenuClickListener
    };
}());
