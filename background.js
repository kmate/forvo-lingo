console.info('forvo-lingo v0.0.1 background script loaded');

chrome.runtime.onMessage.addListener(searchListener);

function searchListener(request, sender, sendResponse) {
  var url = createUrl(request.phrase);
  console.info('getting pronunciations from ' + url);

  $.get(url, function(responseHtml) {
    var data = fetchItems(responseHtml);
    console.log(data);
    sendResponse({data: data});
  });

  return true;
}

function createUrl(phrase) {
  return 'http://forvo.com/search/' + encodeURI(phrase) + '/sv/';
}

function fetchItems(responseHtml) {
  return $(responseHtml).find('a.play').map(fetchItem).get();
}

function fetchItem() {
  var element = $(this);
  return {
    action: element.attr('onclick'),
    title: element.next().html()
  };
}

