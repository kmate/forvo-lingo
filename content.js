console.info('forvo-lingo v0.0.1 content script activated');

var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    for (var i = 0; i < mutation.addedNodes.length; ++i) {
      if ('session-element-container' == mutation.addedNodes[i].id) {
        handleChange();
      }
    }
  })
});
observer.observe(document, { childList: true, subtree: true });

function handleChange() {
  // Text translation from Swedish to English
  var keyboard = $('div#vkeyboard_keys_1');
  if (0 < keyboard.length) {
    addPlayerToKeyboard(keyboard);
  }

  // Text translation from English to Swedish
  var speaker = $('span.speaker-small');
  console.log(speaker);
  console.log(speaker.length);
  if (0 < speaker.length) {
    addPlayerToSpeaker(speaker);
    return;
  }
}

function addPlayerToKeyboard(keyboard) {
  var img = document.createElement('img');
  img.classList.add('vkeyboard_key');
  img.classList.add('column');
  img.src = chrome.extension.getURL('forvo-button.png');
  img.title = 'Pronounce with Forvo';
  keyboard.prepend(img);
}

function addPlayerToSpeaker(speaker) {
  console.log(speaker);
  var span = document.createElement('span'); 
  span.classList.add('icon');
  span.css({ left: '34px', top: 0 });
  var img = document.createElement('img');
  img.src = chrome.extension.getURL('forvo-button.png');
  img.title = 'Pronounce with Forvo';
  span.appendChild(img);
  speaker.css({ marginRight: '37px' });
  speaker.append(span);
}




// TODO: remove
$(document).delegate('span.token', 'mouseenter', function(event) {
  var phrase = $(event.target).html().toLowerCase();
  lookup(phrase);
  
});





var phraseCache = {};

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

  var audio = document.createElement('audio');
  var source = document.createElement('source');
  source.type = 'audio/mp3';
  source.src = url;
  audio.appendChild(source);
  audio.play();
}

function createUrl(id) {
  return 'http://audio.forvo.com/mp3/' + atob(id);
}

