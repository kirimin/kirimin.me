kirimin.feed = (function() {
  'use strict';

  google.load("feeds", "1");

  var initModule = function($container) {
    var onLoad = function() {
      var feed = new google.feeds.Feed("http://kirimin.hatenablog.com/feed");
      feed.setNumEntries(7);
      feed.load(function (result){
        if (result.error){
          return false;
        }

        for (var i = 0; i < result.feed.entries.length; i++) {
          var entry = result.feed.entries[i];
          var title = entry.title.slice(entry.title.lastIndexOf("]")+1);
          $container.append('<li><a href="'+ entry.link +'">' + title + '<br/><time>' + new Date(entry.publishedDate).toDateString() + '</time></a></li>');
        }
      });
    }
    google.setOnLoadCallback(onLoad);
  };

  return {
    initModule: initModule
  };
}());
