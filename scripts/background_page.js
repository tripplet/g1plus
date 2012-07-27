/* Const
 * ===== */

var cacheMirrors = ['http://pastebin.com/raw.php?i=tVLCAjZc',
                    'http://g1plus.x10.mx/cache.json'];

var informationPage = 'http://g1plus.x10.mx/blog/information/';

var backup_cache_url = chrome.extension.getURL("/data/backup_cache.json");
var online_cache = false;

/**
 * Altersfreigabe Daten laden die mit der Erweiterung als Backup/Fallback kommen
 * Werden direkt aus der Date geladen da der lokale Storage der von einer Extension
 * verändert werden kann auf 512 Einträge mit je 2KB begrenzt ist.
 * http://code.google.com/chrome/extensions/trunk/storage.html
 */
function loadBackupCache()
{
  var xhr = new XMLHttpRequest();
  xhr.open("GET", backup_cache_url, false);
  xhr.onreadystatechange = function()
  {
    if (xhr.readyState == 4) {
      if(localStorage.cache == undefined) {
        localStorage.cache = xhr.responseText;
      }
      else {
        // test if valid data present
        try {
          JSON.parse(localStorage.cache);
        } catch (e) {
          // no valid json in local cache override with backup
          localStorage.cache = xhr.responseText;
        }
      }
    }
  };

  try {
    xhr.send();
  } catch(e) {
    console.log('Couldn\'t load backup_cache');
  }
}


/* Methoden
 * ======== */

function loadOnlineCache()
{
  online_cache = JSON.parse(localStorage.cache);
}


/**
 * Synchronsieren des lokalen cache mit der letzten Version
 * auf pastebin oder eines Fallback-Mirrors, wenn neuer
 */
function updateCacheFromWeb(mirror) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", cacheMirrors[mirror], true);
  xhr.onerror = function() {
    if(cacheMirrors[mirror + 1]) {
        updateCache(mirror + 1);
      }
  }
  xhr.onreadystatechange = function() {
    if (xhr.readyState == this.DONE) {
      try {
        var json = JSON.parse(xhr.responseText);
        if(localStorage.cache == undefined) {
          localStorage.cache = xhr.responseText;
          loadOnlineCache();
        }
        else {
          var cache_old = JSON.parse(localStorage.cache);
          if (cache_old['update'] && Date.parse(json['update']) > Date.parse(cache_old['update'])) {
            localStorage.cache = xhr.responseText;
          }
          loadOnlineCache();
        }
      } catch(e) {
        console.log('Couldn\'t update online_cache');
      }
    }
  }
  xhr.send();
}


function storeData(id, data) {
  localStorage[id] = data;
}

function getData(id) {
  // try to load data from online_cache
  if (online_cache[id] == undefined) {
    return 0; // TODO try to update cache here?
  } else {
    var a = online_cache[id];
    return online_cache[id];
  }
}

function onInstall() {
  // showInformation
  chrome.tabs.create({url: informationPage});
}

function onUpdate() {
  // show Changelog
  // TODO
}

function getVersion() {
  var details = chrome.app.getDetails();
  return details.version;
}

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

loadBackupCache();
updateCacheFromWeb(0);

/* Message-Request Listener
 * ======================== */
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.func == "getData") {
      sendResponse({data: getData(request.id)});
    }
});