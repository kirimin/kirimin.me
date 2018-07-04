kirimin.feed = (function() {
  'use strict';

  var initModule = function($container) {
    // using https://developer.yahoo.com/yql/console/
    $.getJSON("https://query.yahooapis.com/v1/public/yql?callback=?", {
        q: "select * from rss(7) where url = 'http://kirimin.hatenablog.com/rss'",
        format: "json"
    }, function(json) {
        for (var i = 0; i < json.query.results.item.length; i++) {
            var entry = json.query.results.item[i];

            var title = entry.title.slice(entry.title.lastIndexOf("]")+1);
            $container.append('<li><a href="'+ entry.link +'">' + title + '<br/><time>' + new Date(entry.pubDate).toDateString() + '</time></a></li>');
        }
    });
  }

  return {
    initModule: initModule
  };
}());
