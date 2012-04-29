/* Const
 * ===== */

var cacheMirrors = ['http://pastebin.com/raw.php?i=tVLCAjZc',
                    'http://g1plus.x10.mx/cache.json'];

var backup_cache_url = chrome.extension.getURL("/data/backup_cache.json");
var backup_cache_json = false;



/**
 * Altersfreigabe Daten laden die mit der Erweiterung als Backup/Fallback kommen
 * Werden direkt aus der Date geladen da der lokale Storage der von einer Extension
 * verändert werden kann auf 512 Einträge mit je 2KB begrenzt ist.
 * http://code.google.com/chrome/extensions/trunk/storage.html
 */
var xhr = new XMLHttpRequest();

xhr.onreadystatechange = function() {
  if (xhr.readyState == 4) {
    backup_cache_json = JSON.parse(xhr.responseText);
  }
};

xhr.open("GET", backup_cache_url, false);

try {
  xhr.send();
} catch(e) {
  console.log('Couldn\'t load backup_cache');
}

/* Methoden
 * ======== */
function storeData(id, data) {
  storage.local.set({id : data}, function() {
    console.log('data with id: ' + id + ' saved');
  });
}

function getData(id) {
  console.log('getData');
  // first look into backup_cache
  if (id in backup_cache_json) {
    return backup_cache_json[id];
  }
}


/* Message-Request Listener
 * ======================== */
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.func == "getData") {
      sendResponse({data: getData(request.id)});
    }
});