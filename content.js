console.info('forvo-lingo v0.0.1 content script activated');

var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    for (var i = 0; i < mutation.addedNodes.length; ++i) {
      if ('session-element-container' == mutation.addedNodes[i].id) {
        handleChange();
      }
    }
  });
});
observer.observe(document, { childList: true, subtree: true });

var keyboardObserver;
var speakerObserver;

function handleChange() {
  cleanupObservers();

  // Text translation from English to Swedish
  setupKeyboardPlayer();

  // Text translation from Swedish to English
  setupSpeakerPlayer();
}

function cleanupObservers() {
  if (!!keyboardObserver) {
    console.debug('removing keyboard observer');
    keyboardObserver.disconnect();
    keyboardObserver = null;
  }

  if (!!speakerObserver) {
    console.debug('removing speaker observer');
    speakerObserver.disconnect();
    speakerObserver = null;
  }
}

function setupKeyboardPlayer() {
  var keyboard = $('div#vkeyboard_keys_1').last();
  if (0 == keyboard.length) {
    // nowhere to place the button
    return;
  }

  addPlayerToKeyboard(keyboard);

  // the keyboard changes when the user types
  var placeholder = keyboard.parent().parent();
  keyboardObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (0 < mutation.addedNodes.length) {
        // we need to look up the new keyboard here
        keyboard = $('div#vkeyboard_keys_1');
        addPlayerToKeyboard(keyboard);
      }
    });
  });
  keyboardObserver.observe(placeholder.get(0), { childList: true });
}

function addPlayerToKeyboard(keyboard) {
  if (0 < keyboard.children('.forvo-player').length) {
    // do not add the button twice
    return;
  }

  var img = document.createElement('img');
  img.classList.add('forvo-player');
  img.classList.add('vkeyboard_key');
  img.classList.add('column');
  img.src = chrome.extension.getURL('forvo-button.png');
  img.title = 'Pronounce with Forvo';
  keyboard.prepend(img);
}

function setupSpeakerPlayer() {
  var speaker = $('span#big-speaker').last();
  if (0 == speaker.length) {
    // nowhere to place the button
    return;
  }

  addPlayerToSpeaker(speaker);

  speakerObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (0 < mutation.addedNodes.length) {
        addPlayerToSpeaker(speaker);
      }
    });
  });
  speakerObserver.observe(speaker.get(0), { childList: true });
}

function addPlayerToSpeaker(speaker) {
  if (0 < speaker.children('.forvo-player').length) {
    // do not add the button twice
    return;
  }

  if (0 == speaker.children().length) {
    // the original speaker is not added yet
    return;
  }

  speaker.children().first().css({ marginRight: '7px' });
  var span = document.createElement('span');
  span.classList.add('forvo-player');
  span.classList.add('speaker-small');
  span.style.left = '7px';
  span.style.marginRight = '14px';
  var img = document.createElement('img');
  img.src = chrome.extension.getURL('forvo-button.png');
  img.title = 'Pronounce with Forvo';
  img.style.width = '30px';
  img.style.height = '30px';
  span.appendChild(img);
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

