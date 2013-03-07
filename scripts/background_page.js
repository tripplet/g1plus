/* Const
 * ===== */
var API_URL = 'http://gameone.de/blog/'
var informationPage = 'http://g1plus.x10.mx/blog/information/';
var backup_cache_url = chrome.extension.getURL("/data/backup_cache.json");

var backup_cache;

/* Methoden
 * ======== */

function loadBackupCache()
{
  var xhr = new XMLHttpRequest();
  xhr.open("GET", backup_cache_url, false);
  xhr.onreadystatechange = function()
  {
    if (xhr.readyState == 4) {
      // test if valid data present
      try {
          backup_cache = JSON.parse(xhr.responseText);
      } catch (e) {
        console.log('Error parsing backup cache');
      }
    }
  };

  try {
    xhr.send();
  } catch(e) {
    console.log('Could not load backup_cache');
  }
}

function updatePlayerVersion() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", 'http://www.gameone.de/tv/1', false);
  xhr.onreadystatechange = function()
  {
    if (xhr.readyState == 4) {
      // test if valid data present
      var latest_player = xhr.responseText.match(/http:\/\/www.gameone.de\/flash\/g2player_[0-9\.]*swf/g);
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
  // TODO
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
loadBackupCache();

// Modify headers for all json-api requests
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    console.log('request: ' + details);
    return {requestHeaders: [{'name': 'User-Agent', 'value': 'GameOne'}, {'name': 'X-G1APP-IDENTIFIER', 'value': 'x'}]};
  },
  {urls: [API_URL + "*.json"]},
  ["blocking", "requestHeaders"]
);