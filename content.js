console.info('forvo-lingo v0.0.1 content script activated');

var phraseCache = {};

$(document).delegate('span.token', 'mouseenter', function(event) {
  var phrase = $(event.target).html().toLowerCase();
  lookup(phrase);
  
});

function lookup(phrase) {
  if (0 == phrase.trim().length) {
    return;
  }

  console.log('looking for: ' + phrase);
  if (phraseCache.hasOwnProperty(phrase)) {
    console.log('playing from cache: ' + phrase);
    eval(phraseCache[phrase]);
    return;
  }

  chrome.runtime.sendMessage({ phrase: phrase }, function(response) {
    var alternatives = response.data.length;
    console.log('number of alternatives: ' + alternatives);

    if (0 < alternatives) {
      var action = wrap(response.data[0].action);
      phraseCache[phrase] = action;
      eval(action);
    }
  });
}

function wrap(code) {
  return '(function(){' + code + '})();';
}

function Play(_, id) {
  var url = createUrl(id);
  console.log('playing pronunciation from: ' + url);

  var f = document.createElement('audio');
  var k = document.createElement('source');
  k.type = 'audio/mp3';
  k.src = url;
  f.appendChild(k);
  f.play();
}

function createUrl(id) {
  return 'http://audio.forvo.com/mp3/' + atob(id);
}

