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
function createDownloadContainer(id)
{
    var downloads = document.createElement('div');
    downloads.setAttribute('id', id)
    downloads.setAttribute('class', 'downloads g1plus');
    downloads.style.backgroundImage = 'url(' + chrome.extension.getURL('icons/icon_64.png') + ')';

    var heading = document.createElement('h4');
    heading.textContent = 'Downloads';
    downloads.appendChild(heading);

    return downloads;
}

function createWarning(msg)
{
    var warning = document.createElement('div');
    warning.setAttribute('class', 'warn_text');
    $(warning).html(msg);

    var g1plus_icon = document.createElement('img');
    g1plus_icon.setAttribute('class', 'g1plus_small_icon');
    g1plus_icon.src = chrome.extension.getURL('icons/icon_64.png');
    warning.appendChild(g1plus_icon);

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
 * Erstellt einen Player, der dem GameOne-Player entspricht.
 *
 * @param src  Quelle des anzuzeigenden Videos.
 */
function createPlayer(src)
{
    var player = document.createElement('embed');
    player.setAttribute('width', 566);
    player.setAttribute('height', 424);
    player.setAttribute('flashvars', 'configParams');
    player.setAttribute('menu', 'false');
    player.setAttribute('swliveconnect', 'true');
    player.setAttribute('allowscriptaccess', 'always');
    player.setAttribute('enablejavascript', 'true');
    player.setAttribute('allowfullscreen', 'true');
    player.setAttribute('quality', 'high');
    player.setAttribute('name', 'embeddedPlayer');
    player.setAttribute('id', 'embeddedPlayer');
    player.setAttribute('src', src);
    player.setAttribute('type', 'application/x-shockwave-flash');
    return player;
}

/**
 * Holt die zugehörigen Downloads des Owner-Objects und fügt sie in einer
 * Download-Box an.
 */
function getDownloads()
{
    var src = this.getAttribute('src');
    var id = src.split('-').pop();
    this.parentNode.appendChild(createDownloadContainer('downloads_' + id));
    $.get('http://gameone.de/api/mrss/' + src, function(data) { response_mrss(data, id) } );
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

	var info = document.createElement('p');
	info.textContent = 'Um Ab-18-Inhalte sehen zu können musst du dein Alter bestätigen:';
	agecheck.appendChild(info);

	var day = document.createElement('select');
	day.setAttribute('class', 'day');
	addOptions(day, 1, 32);
	agecheck.appendChild(day);

	var month = document.createElement('select');
	month.setAttribute('class', 'month');
	addOptions(month, 1, 13);
	agecheck.appendChild(month);

	var year = document.createElement('select');
	year.setAttribute('class', 'year');
	addOptions(year, 0, 100, function(i) {
		var today = new Date();
		return today.getFullYear() - i;
	});
	agecheck.appendChild(year);

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
			$('div.agecheck').empty();
			$('div.agecheck').addClass('loading');
			request_cachedata(commentable_id);
		}
		return false;
	});
	agecheck.appendChild(ok);

	return agecheck;
}

/* Events
 * ==== */

/**
 * Behandeln der Rückgabe der mrss-API. Inhalte die von der flvgen-API geliefert
 * werden, werden gesondert behandelt. Doppelte Urls werden gefiltert.
 */
function response_mrss(data, id)
{
	var urls = new Array();
	$(data).filterNode('media:content').each(function() {
		var url = this.getAttribute('url');
		var callback = 'response_mediagen';

		if(url.indexOf('mediaGen.jhtml') != -1) {
			url = 'http://de.esperanto.mtvi.com/www/xml/flv/flvgen.jhtml?vid=' + url.split(':').pop();
			callback = 'response_flvgen';
		} else
			url = url.split('?')[0];

		if(urls.indexOf(url) == -1) {
			urls.push(url);

			if (callback == 'response_mediagen') {
			  $.get(url, function(data) { response_mediagen(data, id) } );
			} else {
			  $.get(url, function(data) { response_flvgen(data, id) } );
			}
		}
	});
}

/**
 * Behandeln von Inhalten, die über die mediagen-API geliefert werden (reguläre
 * Viedos sowie Gametrailers-Videos).
 */
function response_mediagen(data, id)
{
  var downloads = document.getElementById('downloads_' + id);
	var videos = [];

	$('rendition', data).each(function() {
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

	$(videos).each(function () {
		var downlink = createDownloadLink(this.url,
			this.mime + ' ' + this.width + 'x' + this.height + '@' + this.bitrate + 'kbps');
    if (downloads)
      downloads.appendChild(downlink);
	});
}


/**
 * Behandeln von Inhalten, die von der flvgen-API geliefert werden (TV-Folgen 1 - 150).
 */
function response_flvgen(data, id)
{
	var downloads = document.getElementById('downloads_' + id);
	items = [];

	$('src', data).each(function() {
			items.push($(this).text());
	});

	$(items).each(function() {
		var text = this.split('/').pop();
		text = text.split('.').shift();
		var downlink = createDownloadLink(this, text);
		downloads.appendChild(downlink);
	});

	var x = $('a', downloads);

	x.sort(function(a, b) {
		return b.textContent < a.textContent;
	});

	$('a', downloads).each(function() {
		downloads.removeChild(this);
	});

	$(x).each(function() {
		downloads.appendChild(this);
	});
}

/**
 * Wrapper function um this variable aus dem jeweiligen context and die jeweilige Funktion zu übergeben
 * http://stackoverflow.com/questions/939032/jquery-pass-more-parameters-into-callback#answer-939185
 */
function replace_restricted_wrapper(page, index, element) {
  return function(response) {
    if(response.data && response.data[page][String(index + 1)]) {
      var ids = response.data[page][String(index + 1)];
      for(j in ids) {
        console.log('data:' + ids[j]);
        var id = ids[j];
        if(id.indexOf('gallery') > -1) {
            $(element).replaceWith(createWarning('Bei diesem altersbeschränkten Inhalt handelt es sich um eine Bilder-Galerie, Diese werden derzeit nicht von G1Plus erfasst. Dies kann sich in zukünftigen Versionen ändern, wenn gesteigertes Interesse besteht (<a href="https://github.com/g1plus/g1plus/issues/1">Issue #1</a>)'));
        } else {
            var url = 'http://media.mtvnservices.com/mgid:gameone:video:mtvnn.com:video_meta-' + id;
            if(id.indexOf('http') > -1) {
                url = id;
            }
            var player_swf = document.createElement('div');
            player_swf.setAttribute('class', 'player_swf');
            var player = createPlayer(url);
            player_swf.appendChild(player);
            $(element).after(player_swf);
            if(id.indexOf('http') == -1) {
                player.getDownloads = getDownloads;
                player.getDownloads();
            }
        }
      }
      $(element).remove();
    } else {
      $(element).replaceWith(createWarning('Für diesen altersbeschränkten Inhalt liegt keine Referenz im Cache vor.'));
    }
  }
}

function request_cachedata(commentable_id)
{
  var page = '1';
  var href = window.location.href.split('?').pop().split('/');
  if(href[href.length - 2] == 'part') {
      page = href[href.length - 1];
  }

  // alle gesperreten Inhalte verarbeiten
  $('div.agecheck').each(function(index) {
    // Anfrage an backgroundPage für id
    chrome.extension.sendRequest({func: "getData", id: commentable_id}, replace_restricted_wrapper(page, index, this));
  });
}



/* Main
 * ==== */

// Downloads unter alle Videos einfügen
$('div.player_swf embed').each(getDownloads);

// altersbeschränkten Inhalte verarbeiten
$('img[src="/images/dummys/dummy_agerated.jpg"]').each(function(i) {
  $(this).replaceWith(createAgeCheck());
});