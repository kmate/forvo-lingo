console.info('forvo-lingo v0.0.1 background script loaded');

chrome.runtime.onMessage.addListener(searchListener);

function searchListener(request, sender, sendResponse) {
  var tasks = request.words.map(function(word) {
    return $.get(createUrl(word));
  });

  $.when.apply($, tasks).done(function() {
    var data = [];
    if (1 == tasks.length) {
       data.push(fetchItems(arguments[0]));
    } else {
      for (var i = 0; i < arguments.length; ++i) {
        data.push(fetchItems(arguments[i][0]));
      }
    }
    console.debug(data);
    sendResponse({data: data});
  });

  return true;
}

function createUrl(phrase) {
  return 'http://forvo.com/search/' + encodeURI(phrase) + '/sv/';
}

function fetchItems(responseHtml) {
  return $(responseHtml).find('a.play').map(fetchItem).get(0);
}

function fetchItem() {
  var element = $(this);
  return {
    action: element.attr('onclick'),
    title: element.next().html()
  };
}

