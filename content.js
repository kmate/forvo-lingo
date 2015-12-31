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
  img.src = chrome.extension.getURL('button-keyboard.png');
  img.title = 'Pronounce with Forvo';
  img.onclick = keyboardButtonHandler;
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
  img.src = chrome.extension.getURL('button-speaker.png');
  img.title = 'Pronounce with Forvo';
  img.style.width = '30px';
  img.style.height = '30px';
  img.onclick = speakerButtonHandler;
  span.appendChild(img);
  speaker.append(span);
}


function keyboardButtonHandler() {
  var words = sanitize($('textarea#text-input').get(0).value.split(' '));
  playPronunciation(words);
}

function speakerButtonHandler() {
  var words = sanitize($('span.non-space.token').map(function (_, token) {
    return $(token).html();
  }).toArray());
  playPronunciation(words);
}

function sanitize(words) {
  return words.map(function(word) {
    return word.trim().replace(/[\,\.\?\!]/g,'');
  }).filter(function (word) {
    return ',.?!'.indexOf(word) < 0;
  });
}


var sounds;
var soundsNeeded;
var soundsReady;

function playPronunciation(words) {
  console.debug('playing words: ' + words);

  chrome.runtime.sendMessage({ words: words }, function(response) {
    sounds = [];
    soundsNeeded = response.data.length;
    soundsReady = 0;
    response.data.forEach(function(item) {
      if (!item) {
        --soundsNeeded;
        return;
      }

      var action = wrap(item.action);
      eval(action);
    });
  });
}

function wrap(code) {
  return '(function(){' + code + '})();';
}

function Play(_, id) {
  var url = createUrl(id);
  console.debug('loading word pronunciation from: ' + url);

  var audio = document.createElement('audio');
  audio.oncanplay = function() {
    if (++soundsReady == soundsNeeded) {
      playNextWord();
    }
  };
  var source = document.createElement('source');
  source.type = 'audio/mp3';
  source.src = url;
  audio.appendChild(source);
  sounds.push(audio);
}

function playNextWord() {
  if (0 == sounds.length) {
    return;
  }

  var audio = sounds.shift();
  audio.onended = playNextWord;
  audio.play();
}

function createUrl(id) {
  return 'http://audio.forvo.com/mp3/' + atob(id);
}

