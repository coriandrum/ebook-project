
module.exports = {
    addPage,
    loadPage,
    zoomTo,
    loadRegions,
    addRegion,
    regionClick,
    processRegion,
    loadLargePage,
    loadSmallPage,
    isChrome,
    disableControls,
    resizeViewport,
    numberOfViews,
    getViewNumber,
    moveBar,
    setPreview,
    largeMagazineWidth,
    decodeParams,
    calculateBound,
    padLeft,
    initThumb,
    initXmlMenu,
    resizeMenu,
    initAutoFlip,
    initZoomIcon,
    parsePath
};

import { TraditionToSimple_CN } from '../lib/trans/TraditionToSimple_CN.js';

function addPage (page, book) {
    var id, pages = book.turn('pages');
    // Create a new element for this page
    var element = $('<div />', {});
    if (book.turn('display')=='double') {
        if(page == 1 || page == 2 || page == pages || page == pages - 1) {
            element.addClass('hard');
        }
    }
    // Add the page to the flipbook
    if (book.turn('addPage', element, page)) {
        // Add the initial HTML
        // It will contain a loader indicator and a gradient
        element.html('<div class="gradient"></div><div class="loader"></div>');
        // Load the page
        loadPage(page, element, book);
    }
}

function loadPage(page, pageElement, book) {
    var path = book.turn('options').data.sDirPath;
    var pObj = parsePath(path);
    // Create an image element
    var img = $('<img />');
    img.mousedown(function(e) {
        e.preventDefault();
    });
    // Load the page
    var pageNum = padLeft(page+pObj.strPage, pObj.padLeftNum);
    img.attr('src', pObj.path + pageNum + '.jpg');
    img.on('load',function() {
        // Set the size
        $(this).css({ width: '100%', height: '100%' });
        // Add the image to the page after loaded
        $(this).appendTo(pageElement);
        // Remove the loader indicator
        pageElement.find('.loader').remove();
    });
    loadRegions(page, pageElement, book);
}

function parsePath(path) {
    var arr = path.split('/');
    var last = arr[arr.length - 1];
    var padLeftNum = 8;
    if (last === "") {
        return { strPage:0, path: path, padLeftNum: padLeftNum }
    }
    if (last.substr(-4) === ".jpg") {
        var fn = last.split('.')[0];
        return { strPage:parseInt(fn) - 1, path:path.replace(last, ''), padLeftNum: fn.length }
    } else {
        return { strPage:0, path: path + '/', padLeftNum: padLeftNum}
    }
}

// Load large page
function loadLargePage(page, pageElement, book) {
    /*
    var path = book.turn('options').data.sDirPath;
    var img = $('<img />');
    if (path.substr(path.length-1,1) !== '/') path += '/';
    img.on('load',function() {
        var prevImg = pageElement.find('img');
        $(this).css({ width: '100%', height: '100%' });
        $(this).appendTo(pageElement);
        prevImg.remove();
        page = padLeft(page, 8);
        img.attr('src', path + page + '.jpg');
    });
    */
}

// Load small page
function loadSmallPage(page, pageElement, book) {
    /*
    var path = book.turn('options').data.sDirPath;
    if (path.substr(path.length-1,1) !== '/') path += '/';
    var img = $('<img />');
    img.on('load',function() {
        var prevImg = pageElement.find('img');
        $(this).css({ width: '100%', height: '100%' });
        $(this).appendTo(pageElement);
        prevImg.remove();
        page = padLeft(page, 8);
        img.attr('src', path + page + '.jpg');
    });
    */
}

// Zoom in / Zoom out
function zoomTo(event, viewport) {
    // console.log(viewport);
    setTimeout(function() {
        if (viewport.data().regionClicked) {
            viewport.data().regionClicked = false;
        } else {
            if (viewport.zoom('value') == 1) {
                viewport.zoom('zoomIn', event);
            } else {
                viewport.zoom('zoomOut');
            }
        }
    }, 1);
}

var regionDataNormal = [
    //mainTitle
    //{ "x": 24, "y": 25, "width": 335, "height": 16, "class": "to-page", "data": { "page": 4 } }
]

// Load regions
function loadRegions(page, element, book) {
  var regionData = book.turn('options').region || {};
  var region = regionData[page] || false;
  if (region) {
      if (book.turn('display') === 'double') {
          var data = region;
      } else {
          var regionDataMobile = region;
          for (var i = 0; i < regionDataMobile.length; i++) {
              var item = region[i];
              item.x = item.x / 2;
              item.width = item.width / 2;
          }
          var data = regionDataMobile;
      }
      $.each(data, function(key, region) {
          addRegion(region, element, book);
      });
  }
}

// Add region
function addRegion(region, pageElement, book) {
    var reg = $('<div />', { 'class': 'region  ' + region['class'] }),
        options = book.turn('options'),
        pageWidth = options.width / 2,
        pageHeight = options.height;
    reg.css({
        top: Math.round(region.y / pageHeight * 100) + '%',
        left: Math.round(region.x / pageWidth * 100) + '%',
        width: Math.round(region.width / pageWidth * 100) + '%',
        height: Math.round(region.height / pageHeight * 100) + '%'
    }).attr('region-data', $.param(region.data || ''));
    reg.appendTo(pageElement);
}

// Process click on a region
function regionClick(event, viewport, book) {
    var region = $(event.target);
    if (region.hasClass('region')) {
        viewport.data().regionClicked = true;
        setTimeout(function() {
            viewport.data().regionClicked = false;
        }, 100);
        var regionType = $.trim(region.attr('class').replace('region', ''));
        return processRegion(region, regionType, viewport, book);
    }
}

// Process the data of every region
function processRegion(region, regionType, viewport, book) {
  //console.log(region.attr('region-data'));
  var data = decodeParams(region.attr('region-data'));
    switch (regionType) {
        case 'link':
            window.open(data.url);
            break;
        case 'zoom':
            var regionOffset = region.offset(),
                viewportOffset = viewport.offset(),
                pos = {
                    x: regionOffset.left - viewportOffset.left,
                    y: regionOffset.top - viewportOffset.top
                };
            viewport.zoom('zoomIn', pos);
            break;
        case 'to-page':
            book.turn('page', data.page);
            break;
    }
}

// http://code.google.com/p/chromium/issues/detail?id=128488
function isChrome() {
    return navigator.userAgent.indexOf('Chrome') != -1;
}

function disableControls(page, init, book){
    if (init.direction == 'ltr') {
        var $next = $('.next-button');
        var $prev = $('.previous-button');
    } else {
        var $next = $('.previous-button');
        var $prev = $('.next-button');
    }

    if (page == 1)
        $prev.hide();
    else
        $prev.show();

    if (page == book.turn('pages'))
        $next.hide();
    else
        $next.show();
}

// Set the width and height for the viewport
function resizeViewport(book, viewport) {
    var width = $(window).width(),
        height = $(window).height(),
        options = book.turn('options'),
        display = book.turn('display');

    book.removeClass('animated');
    viewport.css({
        width: width,
        height: height
    }).zoom('resize');

    if (book.turn('zoom') == 1) {
        var bH = 0;//$('.slider-control').height();
        var tH = bH;
        if (height-(bH+tH) <= options.height) {
            var wH = height - (bH+tH);
        } else {
            var wH = height;
        }
        var oW;
        if (options.display=='double'&&display=='single'){
            oW = options.width / 2;
        } else if (options.display=='single'&&display=='double') {
            oW = options.width * 2;
        } else {
            oW = options.width;
        }
        var bound = calculateBound({
            width: oW,
            height: options.height,
            boundWidth: Math.min(oW, width),
            boundHeight: Math.min(options.height, wH)
        });
        if (bound.width % 2 !== 0)
            bound.width -= 1;
        if (bound.width != book.width() || bound.height != book.height()) {
            book.turn('size', bound.width, bound.height);
            if (book.turn('page') == 1)
                book.turn('peel', 'br');
        }
        book.css({ top: -1 * (bound.height / 2 - (tH - bH) / 2), left: -bound.width / 2 });
        //// console.log(options.display, display);
        //// console.log('options',options.width, options.height);
        //// console.log('bound',bound.width, bound.height);
    }

    //Menu review
    resizeMenu();

    var magazineOffset = book.offset(),
        boundH = height - magazineOffset.top - book.height(),
        marginTop = (boundH - $('.thumbnails > div').height()) / 2;

    if (marginTop < 0) {
        $('.thumbnails').css({ height: 1 });
    } else {
        $('.thumbnails').css({ height: boundH });
        $('.thumbnails > div').css({ marginTop: marginTop });
    }

    if (magazineOffset.top < $('.made').height())
        $('.made').hide();
    else
        $('.made').show();

    book.addClass('animated');

}


// Number of views in a flipbook
function numberOfViews(book) {
    return book.turn('pages') / 2 + 1;
}

// Current view in a flipbook
function getViewNumber(book, page) {
    return parseInt((page || book.turn('page')) / 2 + 1, 10);
}

function moveBar(yes) {
    //if (Modernizr && Modernizr.csstransforms) {
    $('#slider .ui-slider-handle').css({ zIndex: yes ? -1 : 10000 });
    //}
}

function setPreview(view) {
    var previewWidth = 172,
        previewHeight = 121.4,
        previewSrc = 'assets/pages/preview.jpg',
        preview = $(_thumbPreview.children(':first')),
        numPages = (view == 1 || view == $('#slider').slider('option', 'max')) ? 1 : 2,
        width = (numPages == 1) ? previewWidth / 2 : previewWidth;

    _thumbPreview.
    addClass('no-transition').
    css({
        width: width + 15,
        height: previewHeight + 15,
        top: -previewHeight - 30,
        left: ($($('#slider').children(':first')).width() - width - 15) / 2
    });

    preview.css({
        width: width,
        height: previewHeight
    });

    if (preview.css('background-image') === '' ||
        preview.css('background-image') == 'none') {

        preview.css({ backgroundImage: 'url(' + previewSrc + ')' });

        setTimeout(function() {
            _thumbPreview.removeClass('no-transition');
        }, 0);

    }

    preview.css({
        backgroundPosition: '0px -' + ((view - 1) * previewHeight) + 'px'
    });
}

// Width of the flipbook when zoomed in
function largeMagazineWidth() {
    var w = 2214;
    if(window.innerWidth>768){
        w = 2214;
    }else{
        w = window.innerWidth * 2
    }
    return w;
}

// decode URL Parameters
function decodeParams(data) {
    var parts = data.split('&'),
        d, obj = {};
    for (var i = 0; i < parts.length; i++) {
        d = parts[i].split('=');
        obj[decodeURIComponent(d[0])] = decodeURIComponent(d[1]);
    }
    return obj;
}

// Calculate the width and height of a square within another square
function calculateBound(d) {
    var bound = { width: d.width, height: d.height };
    if (bound.width > d.boundWidth || bound.height > d.boundHeight) {
        var rel = bound.width / bound.height;
        if (d.boundWidth / rel > d.boundHeight && d.boundHeight * rel <= d.boundWidth) {
            bound.width = Math.round(d.boundHeight * rel);
            bound.height = d.boundHeight;
        } else {
            bound.width = d.boundWidth;
            bound.height = Math.round(d.boundWidth / rel);
        }
    }
    return bound;
}

// 補零
function padLeft(str, length) {
    str = '' + str;
    return str.length >= length ? str : new Array(length - str.length + 1).join("0") + str;
}

function parseThumbPath(path) {
    var arr = path.split('/');
    var last = arr[arr.length - 1];
    var padLeftNum = 8;
    if (last === "") {
        return { strPage:0, path: path, padLeftNum: padLeftNum}
    }
    if (last.substr(-4) === ".jpg") {
        var fn = last.split('.')[0];
        fn = fn.replace('thumb_', '');
        return { strPage:parseInt(fn) - 1, path: path.replace(last, ''), padLeftNum: fn.length }
    } else {
        return { strPage:0, path: path + '/', padLeftNum: padLeftNum}
    }
}

function initThumb(book){
    initSideNav('.thumb', book, function (book, menu) {
        var thumbPath = book.turn('options').data.sThumbPath;
        var tP = parseThumbPath(thumbPath);
        var itemHeightPercent = 100 / Math.round(book.turn('options').data.iTotalPage / 2);
        var mW = menu.width();
        var tWidth = (mW / 2) - 10 || 125;
        var tHeight = tWidth / 125 * 177;
        var $menuBody = $('<div />');

        //建立縮圖
        for (var i = 1; i <= book.turn('pages'); i++) {
            var p = padLeft(i + tP.strPage, tP.padLeftNum);
            var text = '<span>第'+i+'頁</span>';
            var $thumbItem = $('<div class="thumb-item"></div>');
            var $thumbPic = $('<a class="thumb-pic" href="#p/'+(i)+'">'+text+'</a>');
            var $thumbImg = $('<img />').attr('src', tP.path + 'thumb_' + p + '.jpg');
            $thumbImg.appendTo($thumbPic);
            $thumbPic.click(() => menuToggle(menu));
            $thumbPic.appendTo($thumbItem);
            $thumbItem.appendTo($menuBody);
        }
        $menuBody.addClass('side-body').appendTo(menu);
        return $menuBody;
    });
}

function initXmlMenu(book){
    initSideNav('.xmlMenu',book, function (book, menu) {
        var $menuBody = $('<div />');
        var sFileID = book.turn('options').data.sFileID;
        var xmlUrl = '/Files/xml/' + sFileID + '/Catalog.xml';


        var t2s = new TraditionToSimple_CN();
        //抓取xml目錄檔
        $.get(xmlUrl, function(xml) {
            // console.log('Get XML', $(xml));
            var chapters = xml.getElementsByTagName('METS:div');
            if(!chapters.length>0) {
                chapters = xml.getElementsByTagName('div');
            }
            // console.log('Chapters',chapters);
            var $lists = $('<ul />')
            var lang = book.turn('options').data.lang;
            for (var i = 0; i < chapters.length; i++) {
                var chapter = $(chapters[i]);
                var txt = chapter.attr('LABEL');
                lang = lang.toUpperCase();
                if (lang == "ZH-TW") {
                    txt = t2s.toTraditionalized(chapter.attr('LABEL'));
                }
                if (lang == "ZH-CN") {
                    txt = t2s.toSimplized(chapter.attr('LABEL'));
                }
                var label = '<span class="chapter">'+txt+'</span>';
                var page = chapter.attr('ORDERLABEL');
                var $menuItem = $('<li><a href="#p/'+page+'">'+label+'<span class="page">'+page+'</span></a></li>');
                $menuItem.click(() => menuToggle(menu));
                $lists.append($menuItem);
            }
            $lists.appendTo($menuBody);
            $menuBody.addClass('side-body').appendTo(menu);
        });
        return $menuBody
    });
}

function initSideNav(menuClass ,book, callback){
    var $viewport = $('#canvas');
    var $menu = $(menuClass+'.side-nav');
    var $btn = $(menuClass+'-toggle');
    var wW = window.innerWidth;
    var mW = $menu.width();
    //尺寸大小判斷
    if(wW>768) {
        let width = wW*0.3;
        $menu.width(width>300?300:width);
        mW = width>300?300:width;
    } else {
        let width = wW*0.6;
        $menu.width(width>800?800:width);
        mW = width>800?800:width;
    }
    //建立選單主體
    var $menuBody = callback(book, $menu);
    //建立關閉按鈕
    var $close = $('<div class="close"><i class="fa fa-times" aria-hidden="true"></i></div>');

    //按鈕事件
    $btn.click(()=>menuToggle($menu));
    $close.click(()=>menuToggle($menu));

    //插入物件
    $close.appendTo($menu);
    $menu.appendTo($viewport);

    resizeMenu();
}

function menuToggle(menu){
    var $nav = $('.side-nav');
    var $close = menu.find('.close');
    if(menu.hasClass('active')){
        //hide
        menu.css('left', menu.width()*-1);
        $close.hide();
        setTimeout(()=>{menu.removeClass('active')},500);
    } else {
        //show
        if($nav.hasClass('active')){
            $nav.css('left', $nav.width()*-1);
            $nav.find('.close').hide();
            setTimeout(()=>{$nav.removeClass('active')},500);
            setTimeout(()=>{
                menu.addClass('active');
                menu.css('left', 0);
                $close.show();
            },600);
        } else {
            menu.addClass('active');
            menu.css('left', 0);
            $close.show();
        }
    }
}

function resizeMenu() {
    var $menu = $('.side-nav');
    if($menu.hasClass('active')){
        //show
        $menu.css('left', 0);
    } else {
        //hide
        $menu.css('left', $menu.width()*-1);
    }
}

//沒在用
function initAutoFlip() {
    var $btn = $('.auto-flip-toggle');
    var timeout;

    $btn.click(function(event) {
        event.preventDefault();
        if($btn.hasClass('flip-active')) {
            $btn.removeClass('flip-active');
            stopFlip(flipbook);
        } else {
            $btn.addClass('flip-active');
            autoFlip(flipbook);
        }
    });

    function autoFlip(book) {
        var t = 0;
        var nowPage = book.turn('page');
        var $btn = $('.auto-flip-toggle');

        if(nowPage>=book.turn('pages')){
            clearTimeout(timeout);
            window.alert('最後一頁！');
            $btn.removeClass('flip-active');
        } else {
            book.turn('page', nowPage + 1);
            timeout = setTimeout(function(){
                autoFlip(book);
            },t+init.duration);
        }
    }

    function stopFlip(book) {
        clearTimeout(timeout);
    }
}

// Zoom icon
function initZoomIcon () {
    $('.zoom-icon').bind('click', function() {
        // console.log('zoom');
        if ($(this).hasClass('zoom-icon-in')) {
            $('.viewport').zoom('zoomIn');
        } else {
            $('.viewport').zoom('zoomOut');
        }
    });
}

//proxy
function proxyURL(url) {
     return 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from xml where url="' + url + '"') + '&format=xml';
}
