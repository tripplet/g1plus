/* Const
 * ===== */
var API_URL = 'http://gameone.de/blog/'
var informationPage = 'http://g1plus.x10.mx/blog/information/';
var blogPage = 'http://g1plus.x10.mx/blog/';

var backup_cache;

/* Methoden
 * ======== */

function updatePlayerVersion() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", 'http://www.gameone.de/tv/1', false);
  xhr.onreadystatechange = function()
  {
    if (xhr.readyState == 4) {
      // test if valid data present
      var latest_player = xhr.responseText.match('http[s]?:\/\/.*g2\/g2player_[0-9\._]+\.swf');
      chrome.storage.local.set({'player_swf': latest_player[0]});
    }
  };

  xhr.send();
}

function getVersion() {
  var details = chrome.app.getDetails();
  return details.version;
}

/* Event-Listener
 * ============== */

function onInstall() {
  // showInformation
  chrome.tabs.create({url: informationPage});
}

function onUpdate() {
  // show Changelog
  if (currVersion == '0.4.1') {
    var notification = webkitNotifications.createNotification(
      'icons/icon_64.png', 'G1Plus aktualisiert (0.4.1)',
      'Die Chrome-Erweiterung G1Plus wurde aktualisiert');

    notification.onclick = function () {
      window.open(blogPage);
      notification.close();
    }

    notification.show();
  }
}

/* Main
 * ==== */

// Check if the version has changed.
var currVersion = getVersion();
var prevVersion = localStorage['version']
if (currVersion != prevVersion) {
  // Check if we just installed this extension.
  if (typeof prevVersion == 'undefined') {
    onInstall();
  } else {
    onUpdate();
  }
  localStorage['version'] = currVersion;
}

updatePlayerVersion();

// Modify headers for all json-api requests
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    console.log('request: ' + details);
    return {requestHeaders: [{'name': 'User-Agent', 'value': 'GameOne'}, {'name': 'X-G1APP-IDENTIFIER', 'value': 'x'}]};
  },
  {urls: [API_URL + "*.json"]},
  ["blocking", "requestHeaders"]
);