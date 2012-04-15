/* Import
 * ====== */

var data = self.data;

/* Const
 * ===== */

var cacheMirrors = ['http://pastebin.com/raw.php?i=tVLCAjZc',
                    'http://g1plus.x10.mx/cache.json'];

/* Methoden
 * ======== */

/**
 * Synchronsieren des lokalen cache mit der letzten Version
 * auf pastebin oder eines Fallback-Mirrors, wenn neuer.
 *
 * @param onSync  Callback der nach dem Sync-Vorgang aufgerufen wird.
 *                Der Status des Sync-Versuches wird übergeben.
 */
function syncCache(mirror, onSync) {
    var req = request.Request({
        url: cacheMirrors[mirror],
        onComplete: function(response) {
            if(response.status == 200) {
                var json = JSON.parse(response.text);
                if(storage.cache['update']) {
                    if(Date.parse(json['update']) > Date.parse(storage.cache['update'])) {
                        storage.cache = json;
                    }
                } else {
                    storage.cache = json;
                }
                onSync(response.status);
            } else {
                if(cacheMirrors[mirror + 1]) {
                    syncCache(mirror + 1, onSync);
                } else {
                    onSync(response.status);
                }
            }
        }
    });
    req.get();
}

/**
 * Filter die Content-Elemente aus einer Seite.
 *
 * @param src  Quelltext der Seite.
 *
 * @return Die Content-Elemente reduziert auf ihre Referenzen.
 */
function getContentElements(src) {
    var re = /#gallery_\d*|video_meta-\w*|<embed(.*)/g;

    var result = new Array();

    while((match = re.exec(src)) != null) {
        if(match[0].indexOf('embed') > -1) {
            result.push(match[0].split('"')[1]);
        } else if(match[0].indexOf('video_meta-') > -1) {
            result.push(match[0].split('-')[1]);
        } else {
            result.push(match[0].split('#')[1]);
        }
    }

    return result;
}

/**
 * Erzeugt ein Cache-Objekt aus der Differenz zweier HTML-Seiten.
 *
 * @param pre  Die Seite mit gesperrten Inhalten.
 * @param post Die Seite mit 18er-Inhalten.
 *
 * @return Cache-Objekt
 */
function diff(pre, post) {
    var result = {};

    var re = /dummy_agerated.jpg/g;

    if(!re.test(post)) {
        var post_elems = getContentElements(post);
        var pre_elems = getContentElements(pre);

        for(i in pre_elems) {
            var index = post_elems.indexOf(pre_elems[i]);
            if(index > -1) {
                post_elems.splice(index, 1);
            }
        }

        var dummy_count = 0;
        var match = re.exec(pre);

        while(match) {
            ++dummy_count;
            var src = post_elems.shift();
            result[String(dummy_count)] = new Array(src);
            match = re.exec(pre);
        }

        if(dummy_count < post_elems) {
            result[String(dummy_count)].concat(post_elems);
        }
    }

    return result;
}

/**
 * Legt ein Cache-Objekt in den lokalen Storage.
 *
 * @param id  id der Seite
 * @param page  page der Seite
 * @param cache Cache-Objekt
 */
function addToCache(id, page, cache) {
    if(cache['1'] && cache['1'].length > 0) {
        if(!storage.cache[id]) {
            storage.cache[id] = {};
        }
        if(!storage.cache[id][page]) {
            storage.cache[id][page] = cache;
        }
    }
}

/**
 * Überprüft auf ein Update des AddOns und führt folgende Aktionen
 * aus:
 *  - aufrufen des Changelogs
 *  - wenn notwendig aktualisieren des lokalen Caches mit dem beim
 *    Update mitgelieferten
 */
function checkUpdate() {
    if(!storage.firstrun) {
        tabs.open('http://g1plus.x10.mx/information');
        storage.firstrun = true;
    }

    if(storage.version != self.version) {
        tabs.open('http://g1plus.x10.mx/changelog');
        storage.version = self.version;

        var cacheJson = JSON.parse(data.load('cache.json'));
        if(!storage.cache) {
            storage.cache = cacheJson;
        } else {
            // Update des Caches erzwingen, selbst wenn älter um einen fehlerhaften Cache zu überschreiben (z.B. fehlendes update-property *duh*)
            storage.cache = cacheJson;
        }
    }
}