/* Konstanten
 * ========== */

var API_URL = 'http://gameone.de/blog/'
var API_PREFIX = 'http://www.gameone.de/api/mrss/mgid:gameone:video:mtvnn.com:';
var PLAYER_SWF = 'https://playermtvnn-a.akamaihd.net/g2/g2player_2.1.4.swf';
var GAMETRAILERS_URL = 'http://trailers.gametrailers.com/gt_vault';

var QUALITY_LEVEL = 1; // 2.beste Qualität (0=beste)

/* Workarounds
 * ========== */

/** Bugfix for Webkit/Safari/Chrome with jQuery >= 1.7 for xml namespace $.find()
 * http://stackoverflow.com/questions/853740/jquery-xml-parsing-with-namespaces
 * http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
 */
$.fn.filterNode = function(name) {
  return this.find('*').filter(function() {
    return this.nodeName === name;
  });
};

/* Funktionen
 * ========== */

/**
 * Erzeugt einen Container für Download-Links.
 *
 * @param id   Die id die des Containers
 *
 * @return Der Container
 */
function createDownloadContainer(id, src)
{
    var downloads = document.createElement('div');
    downloads.setAttribute('id', id)
    downloads.setAttribute('class', 'downloads g1plus');

    var heading = document.createElement('h4');
    heading.textContent = '» Downloads';
    downloads.appendChild(heading);

    var hidden_src = document.createElement('input');
    hidden_src.setAttribute('type', 'hidden');
    hidden_src.setAttribute('class', 'src g1plus');
    hidden_src.setAttribute('value', src);
    downloads.appendChild(hidden_src);

    return downloads;
}

function setDuration(duration, id) {
  // Falsche und nichtrelevante Videolängen gar nicht erst anzeigen
  if (duration == 0) {
    return;
  }

  var video_length = document.createElement('h5');
  video_length.setAttribute('class', 'duration');
  video_length.textContent = '(' + duration + 'min)';
  $('#downloads_' + id).append(video_length);
}

function createWarning(msg)
{
    var warning = document.createElement('div');
    warning.setAttribute('class', 'warn_text g1plus');
    $(warning).html(msg);

    return warning;
}

/**
 * Erzeugt einen simplen Link.
 *
 * @param url   Url auf die der Link zeigt
 * @param text  Text des Links
 *
 * @return Das Link-Element
 */
function createDownloadLink(url, text)
{
    var downlink = document.createElement('a');
    downlink.setAttribute('href', url);
    downlink.textContent = text;

    return downlink;
}

/**
 * Erstellt einen eingebetteten YouTube-Player.
 *
 * @param id   ID des Youtube-Videos
 */
function createYoutubePlayer(id) {
    var parent, swf;

    parent = document.createElement('div');
    swf = document.createElement('p');
    parent.appendChild(swf);
    swfobject.embedSWF("https://youtube.com/v/" + id + "?enablejsapi=1&version=3&border=0", swf, "566", "290", "8", null, null);

    return parent;
}


function getPlayerSWF() {
  chrome.storage.local.get('player_swf', function(items) {
    PLAYER_SWF = items.player_swf;
  });
}

function getQualityLevel() {
  chrome.storage.sync.get('quality_level', function(items) {
    if (items['quality_level'] != null)
      QUALITY_LEVEL = items['quality_level'];
  });
}

/**
 * Erstellt einen Player, der dem GameOne-Player entspricht.
 *
 * @param src    Quelle des anzuzeigenden Videos.
 */
function createPlayer(src, ismuted, autoplay) {
    var parent, swf, rand, attributes, params;

    parent = document.createElement('div');
    parent.setAttribute('class', 'player_swf');
    swf = document.createElement('p');
    parent.appendChild(swf);
    rand = Math.floor((Math.random()*1000000)+1);
    attributes = {
      id:"embeddedPlayer",
      name:"embeddedPlayer"
    };
    params = {
      wmode: "true",
      enableJavascript: "true",
      allowscriptaccess: "always",
      swLiveConnect: "true",
      allowfullscreen: "true"
    };

    var flashvars = {
      config: "http://www.gameone.de/gameone_de_DE.xml",
      adSite: "gameone.de",
      umaSite: "gameone.de",
      url: _url,
      tile: "",
      ord: rand,
      image: "",
      ismuted: ismuted,
      autoPlay: autoplay,
      usehq: "true"
    };

    if(src.indexOf('file=') == 0) {
      flashvars.file = src.replace('file=', '');
    } else if(src.indexOf('mrss=') == 0) {
      flashvars.mrss = src.replace('mrss=', '');
    } else {
      flashvars.mrss = src;
    }
    swfobject.embedSWF(PLAYER_SWF,
                       swf, "566", "424", "9.0.28.0",
                       null, flashvars, params, attributes);

    return parent;
}

/**
 * Erstellt den html5 Player
 * @param src  Quelle des anzuzeigenden Videos.
 */
function createHTML5Player(src, init_visible)
{
    var video = document.createElement('video');
    var source = document.createElement('source');

    video.setAttribute('width', 566);
    video.setAttribute('height', 424);
    video.setAttribute('preload', 'none');
    video.setAttribute('data-setup', '{}');
    video.setAttribute('controls', '');

    //source.setAttribute('type', 'video/mp4');
    video.setAttribute('src', src);

    //video.appendChild(source);

    return video;
}

/**
 * Ändert die Source url des html5 Player
 * @param src  HTML5 Player element
 */
function changeHTML5PlayerURL(player, video_src) {
  player.setAttribute('src', video_src);
}

/**
 * Erzeugt einen HTML5-Player als Ersatz für den Flashplayer und erlaubt das zurückschalten
 */
function createSwitchablePlayer(video_urls, download_container) {
  var player_container = document.createElement('div')
  var switch_button = document.createElement('h4');
  var flash_player = download_container.parentNode.firstChild;
  var html5_player = createHTML5Player(video_urls[1].url, true);

  switch_quality = document.createElement('div');
  switch_quality.setAttribute('class', 'switchquality');
  switch_quality.textContent = " # ";
  download_container.appendChild(switch_quality);

  switch_button.textContent = '» Flash';
  switch_button.setAttribute('class', 'switchplayer');
  $(download_container.parentNode).prepend(switch_button, document.createElement('br'));

  // hide flash player
  flash_player.setAttribute('style', 'display: none');

  download_container.parentNode.removeChild(flash_player);
  player_container.appendChild(flash_player);
  player_container.appendChild(html5_player);
  download_container.parentNode.insertBefore(player_container, download_container);

  $(switch_button).mousedown(function(){ return false; });
  $(switch_button).click(function(event) {
    event.preventDefault();

    $(player_container).children().toggle();

    if (this.textContent == '» Flash') {
      this.textContent = '» HTML5';
      html5_player.pause();
      changeHTML5PlayerURL(html5_player, '');
    }
    else {
      this.textContent = '» Flash';

      quality = $(download_container).find('a.selected').attr('tag');

      // switch src to new quality
      changeHTML5PlayerURL(html5_player, video_urls[parseInt(quality)].url);
    }
    return false;
  });

  // prevent text selecting
  // http://stackoverflow.com/questions/880512/prevent-text-selection-after-double-click
  $(switch_quality).mousedown(function(){ return false; });
  $(switch_quality).click(function(event) {
    event.preventDefault();
    selected_quality = $(download_container).find('a.selected');
    next_quality = selected_quality.next('a');

    selected_quality.removeClass('selected');

    if (next_quality.length > 0) {
      next_quality.addClass('selected');
    }
    else {
      selected_quality.siblings('a').eq(0).addClass('selected');
    }

    quality = $(download_container).find('a.selected').attr('tag');

    // switch src to new quality
    changeHTML5PlayerURL(html5_player, video_urls[parseInt(quality)].url);

    // save quality level
    chrome.storage.sync.set({'quality_level': parseInt(quality)});

    return false;
  });
}

/**
 * Holt die zugehörigen Downloads des Owner-Objects und fügt sie in einer
 * Download-Box an.
 */
function getDownloads()
{
    try {
        src = $('#embeddedPlayer', this).get(0).getAttribute('flashvars').match(/(file=|mrss=)[^&]*/)[0];
    } catch (err) {
        src = $('#embeddedPlayer param[name="flashvars"]', this).val().match(/(file=|mrss=)[^&]*/)[0];
    }


    if(src) {
        id = src.split(':').pop();
        download_container = createDownloadContainer('downloads_' + id, src);
        this.appendChild(download_container);
        if(src.indexOf('file=') == 0) {
            var filename = src.split('/').pop();
            download_container.appendChild(createDownloadLink(src.replace('file=', ''), filename));
        } else {
            request(API_PREFIX + id, response_mrss, id);
        }
    }
}

/**
 * Füllt ein select-Element mit option-Einträgen beginnend bei min bis max
 * aufsteigend. Wird kein callback angegeben entsprech die Einträge den
 * jeweiligen Zahlen.
 *
 * @param select    Das zu befüllende select-Element
 * @param min       Startelement
 * @param max       Endelement
 * @param callback  Funktion die für jedes Element aufgerufen wird. Es wird die
 *                  jeweilige Ziffer übergeben. Rückgabewert muss ein dazu
 *                  korrespondierender String sein.
 */
function addOptions(select, min, max, callback)
{
  for(var i = min; i < max; ++i)
  {
    var option = document.createElement('option');
    if(!callback) {
      option.textContent = i;
    } else {
      option.textContent = callback(i);
    }
    select.appendChild(option);
  }
}

/**
 * Erzeugt eine Altersabfrage, die bei Eingabe eines Alters, welches der
 * Volljährigkeit entspricht, die Freigabe aller altersbeschränkten Inhalte
 * auslöst.
 *
 * @return Das Altersabfrage-Element
 */
function createAgeCheck()
{
  var agecheck = document.createElement('div');
  agecheck.setAttribute('class', 'agecheck g1plus');

  agecheck_box = document.createElement('div');

  var info = document.createElement('p');
  info.textContent = 'Um Ab-18-Inhalte sehen zu können musst du dein Alter bestätigen:';
  agecheck_box.appendChild(info);

  var day = document.createElement('select');
  day.setAttribute('class', 'day');
  addOptions(day, 1, 32);
  agecheck_box.appendChild(day);

  var month = document.createElement('select');
  month.setAttribute('class', 'month');
  addOptions(month, 1, 13);
  agecheck_box.appendChild(month);

  var year = document.createElement('select');
  year.setAttribute('class', 'year');
  addOptions(year, 0, 100, function(i) {
    var today = new Date();
    return today.getFullYear() - i;
  });
  agecheck_box.appendChild(year);

  var ok = document.createElement('input');
  ok.setAttribute('type', 'submit');
  ok.setAttribute('value', 'Bestätigen');
  $(ok).click(function() {
    var year = parseInt($('select.year :selected', this.parentNode).text());
    var month = parseInt($('select.month :selected', this.parentNode).text());
    var day = parseInt($('select.day :selected', this.parentNode).text());
    var age = new Date(year, month - 1, day);
    var padded_age = new Date(age.getFullYear() + 18, age.getMonth(), age.getDate());
    var today = new Date();
    if((today.getTime() - padded_age.getTime()) >= 0) {
      var commentable_id = document.getElementById('commentable_id').getAttribute('value');
      request_cache(commentable_id);
    }
    return false;
  });

  agecheck_box.appendChild(ok);
  agecheck.appendChild(agecheck_box);

  return agecheck;
}

/* Response
 * ==== */

/**
 * Behandeln der Rückgabe der mrss-API. Doppelte Urls werden gefiltert.
 */
function response_mrss(response) {
    if(response.status == 200) {
        var urls = new Array();
        $('media\\:content', response.text).each(function () {
            var url = this.getAttribute('url').split('?')[0];
            var duration = Math.round(parseFloat(this.getAttribute('duration')) / 60);

            if(urls.indexOf(url) == -1) {
                if(duration > 0) {
                    setDuration(duration, response.id);
                }
                urls.push(url);
                request(url, response_mediagen, response.id);
            }
        });
    } else {
        var downloads = document.getElementById('downloads_' + response.id);
        $(downloads).replaceWith(createWarning('Es ist ein Fehler aufgetreten. Seite aktualisieren oder es später erneut versuchen. (<a href="http://g1plus.x10.mx/report/index.php?url=' + _url + '">Problem melden?</a>)'));
    }
}

/**
 * Behandeln von Inhalten, die über die mediagen-API geliefert werden
 */
function response_mediagen(response) {
    var downloads = document.getElementById('downloads_' + response.id);

    if(response.status == 200) {
        var videos = [];

        $('rendition', response.text).each(function () {
            var v = {};
            v.width = this.getAttribute('width');
            v.height = this.getAttribute('height');
            v.bitrate = this.getAttribute('bitrate');
            v.mime = this.getAttribute('type').split('/').pop();
            if(this.textContent.indexOf('http') == -1) {
                v.url = this.textContent.trim().split('/riptide/').pop();
                v.url = 'http://cdn.riptide-mtvn.com/' + v.url;
            } else {
                v.url = this.textContent;
            }
            videos.push(v);
        });

        videos.sort(function(a, b) {
            return b.width - a.width;
        });

        videos.sort(function(a, b) {
            return b.bitrate - a.bitrate;
        });


        $(videos).each(function (idx) {
            var downlink = createDownloadLink(this.url, this.width + 'x' + this.height + '@' + this.bitrate + 'kbps');
            downloads.appendChild(downlink);
            downlink.setAttribute('tag', idx);

            if (idx == QUALITY_LEVEL) {
              downlink.setAttribute('class', 'selected');
            }
        });


    } else {
        $(downloads).replaceWith(createWarning('Es ist ein Fehler aufgetreten. Seite aktualisieren oder es später erneut versuchen. (<a href="http://g1plus.x10.mx/report/index.php?url=' + _url + '">Problem melden?</a>)'));
    }

    createSwitchablePlayer(videos, downloads);
}


/**
 * Behandeln des Cache-Response.
 * Im Cache enthaltene 18er-Inhalte werden durch das Video ersetzt und mit
 * Downloadlinks versehen.
 */
function response_cache(response) {
    if(response.status == 200) {
        var page = 1;
        var href = _url.split('?').pop().split('/');
        if(href[href.length - 2] == 'part') {
            page = parseInt(href[href.length - 1]);
        }

        /* We can't parse the cache as XML since we can't ensure it's wellformed or
         * valid. To extract the agerated tags we need to make them visible for
         * jQuery by replacing them with proper html tags beforhand */
        var part = response.cache.replace('<part />', '<part/>').split('<part/>')[page - 1];
        var properHtml = '<div>' + part.replace(/<agerated>/g, '<div class="agerated">').replace(/<\/agerated>/g, '</div>') + '</div>';
        var agerated = $('div', properHtml);

        $('div.g1plus.agecheck').each(function(i){
            $(this).empty();
            $(this).addClass('loading');

            var items = $('video', agerated[i]);
            for(var j = 0; j < items.length; ++j) {
                var src = items[j].getAttribute('src').split(':');
                var protocol = src[0];
                var id = src[1];

                if(protocol == 'riptide' || protocol == 'video') {
                    var url = API_PREFIX + 'video_meta-' + id;
                    if(id.indexOf('http') > -1) {
                        url = 'file=' + id;
                    }
                    var player_swf = createPlayer(url, false, false);
                    $(this).after(player_swf);
                    player_swf.getDownloads = getDownloads;
                    player_swf.getDownloads(id);
                } else if(protocol == 'youtube') {
                    var youtube_swf = createYoutubePlayer(id.split('=')[1]);
                    $(this).after(youtube_swf);
                } else if(protocol == 'gallery') {
                    $(this).replaceWith(createWarning('Bei diesem altersbeschränkten Inhalt handelt es sich um eine Bilder-Galerie, Diese werden derzeit nicht von G1Plus erfasst. Dies kann sich in zukünftigen Versionen ändern, wenn gesteigertes Interesse besteht (<a href="https://github.com/g1plus/g1plus/issues/1">Issue #1</a>)'));
                } else {
                    $(this).replaceWith(createWarning('G1Plus konnte für diesen Inhalt keine Referenz finden. (<a href="http://g1plus.x10.mx/report/index.php?url=' + _url + '">Problem melden?</a>)'));
                }
            }
            $(this).remove();
        });
    } else {
        $(this).after(createWarning('Problem beim Abfragen des Caches.'));
    }
}

/* Browser specific functions
 * ========================== */
// TODO: In jeweils eigene Datei (ff.js/chrome.js) auslagern

function request(url, callback, id) {
  $.get(url).done(
    function(data, status, jqXHR) {
      callback({status: 200, id: id, text: jqXHR.responseText});
    }
  );
}

function request_cache(id) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", API_URL + id + '.json', false);

  xhr.onreadystatechange = function() {
    if (xhr.readyState == this.DONE && xhr.status == 200) {
      try {
        var post = JSON.parse(xhr.responseText);
        var body = post['post']['body'];
        response_cache({status: xhr.status, cache:body});
      } catch(e) {
        console.log('Could not receive api data: ' + e);
        response_cache({status: 410, cache:null});
      }
    }
    else {
      response_cache({status: 410, cache:null});
    }
  }

  try {
    xhr.send();
  } catch(e) {
    console.log('Could not perfrom api request');
  }
}


/* Main
 * ==== */
 _url = window.location.href;

 getPlayerSWF();
 getQualityLevel();

// Downloads unter alle Videos einfügen
$('div.player_swf').each(getDownloads);

// altersbeschränkten Inhalte verarbeiten
$('img[src="/images/dummys/dummy_agerated.jpg"]').each(function(i) {
  $(this).replaceWith(createAgeCheck());
});

// load konami code (up up down down left right left right b a enter)
konami = new Konami()
konami.code = function()
{
  $('#header h1').css('background', 'url(http://upload.wikimedia.org/wikipedia/de/thumb/a/a6/GameOneLogo.png/220px-GameOneLogo.png) no-repeat 30px 30px');
  $('#header h1').css('width', '250px');
}
konami.load();
