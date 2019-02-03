import '../lib/turnjs/turn.min.js';
import '../lib/turnjs/zoom.update.js';
import m from './magazine.js';

const loadBook = function(init) {
    const canvas = $('#canvas');
    const flipbook = $('.gsi-ebook');
    const viewport = $('.viewport');
    // Check if the CSS was already loaded
    if (flipbook.width() == 0 || flipbook.height() == 0) {
        setTimeout(loadBook, 10);
        return;
    }
    // Create the flipbook
    flipbook.turn(setOption(init));
    $('.page-state .page-total').text(flipbook.turn('pages'));

    // Zoom.js
    viewport.zoom({
        flipbook: flipbook,
        max: function() {
            return m.largeMagazineWidth() / flipbook.width();
        },
        when: {
            swipeLeft: function() {
                flipbook.turn('previous');
            },
            swipeRight: function() {
                flipbook.turn('next');
            },
            resize: function(event, scale, page, pageElement) {
                if (scale === 1) {
                    m.loadSmallPage(page, pageElement, flipbook);
                } else {
                    m.loadLargePage(page, pageElement, flipbook);
                }
            },
            zoomIn: function() {
                $('.book-control').hide();
                $('.slider-control').hide();
                $('.side-nav').hide();
                $('.page-state').hide();
                $('.made').hide();
                flipbook.removeClass('animated').addClass('zoom-in');
                var ZoomIcon = $('<i class="fa fa-compress" aria-hidden="true"></i>');
                var ZoomOut = $('<div />').append(ZoomIcon).addClass('zoom-out-icon').on('click', ()=>viewport.zoom('zoomOut'));
                viewport.append(ZoomOut);
                $('.zoom-icon').removeClass('zoom-icon-in').addClass('zoom-icon-out');
                if (!window.escTip && !$.isTouch) {
                    var escTip = true;

                    $('<div />', {
                        'class': 'exit-message'
                    }).
                    html('<div>按 ESC 退出全螢幕</div>').
                    appendTo($('body')).
                    delay(2000).
                    animate({
                        opacity: 0
                    }, 500, function() {
                        $(this).remove();
                    });
                }
            },
            zoomOut: function() {
                $('.book-control').fadeIn();
                $('.slider-control').fadeIn();
                $('.side-nav').fadeIn();
                $('.page-state').fadeIn();
                $('.exit-message').hide();
                $('.made').fadeIn();
                $('.zoom-out-icon').remove();
                $('.zoom-icon').removeClass('zoom-icon-out').addClass('zoom-icon-in');
                setTimeout(function() {
                    flipbook.addClass('animated').removeClass('zoom-in');
                    m.resizeViewport(flipbook, viewport);
                }, 1);

            }
        }
    });

    viewport.on('zoom.doubleTap', function(e) { m.zoomTo(e, $(this))});

    // Zoom event
    /*
    if ($.isTouch)
        viewport.bind('zoom.doubleTap', zoomTo);
    else
        viewport.bind('zoom.tap', zoomTo);
    */
    // Using arrow keys to turn the page
    $(document).keydown(function(e) {
        var previous = 37,
            next = 39,
            esc = 27;
        switch (e.keyCode) {
            case previous:
                // left arrow
                flipbook.turn('previous');
                e.preventDefault();
                break;
            case next:
                //right arrow
                flipbook.turn('next');
                e.preventDefault();
                break;
            case esc:
                viewport.zoom('zoomOut');
                e.preventDefault();
                break;
        }
    });

    // URIs - Format #/page/1
    Hash.on('^p\/([0-9]*)$', {
        yep: function(path, parts) {
            var page = parts[1];
            if (page !== undefined) {
                if (flipbook.turn('is'))
                    flipbook.turn('page', page);
                $('.page-state .page-now').text(page);
            }
        },
        nop: function(path) {
            if (flipbook.turn('is')) {
                var page = flipbook.turn('page');
                flipbook.turn('page', page);
                $('.page-state .page-now').text(page);
            }
        }
    });

    $(window).on('resize', function() {
        m.resizeViewport(flipbook, viewport);
    }).on('orientationchange', function() {
        m.resizeViewport(flipbook, viewport);
    });

    // Regions
    if ($.isTouch) {
        flipbook.on('touchstart', (e, viewport)=>{m.regionClick(e, viewport, flipbook)});
    } else {
        flipbook.click((e, viewport)=>{m.regionClick(e, viewport, flipbook)});
    }
    // Events for the next button
    $('.next-button').on($.mouseEvents.over, function() {
        $(this).addClass('next-button-hover');
    }).on($.mouseEvents.out, function() {
        $(this).removeClass('next-button-hover');
    }).on($.mouseEvents.down, function() {
        $(this).addClass('next-button-down');
    }).on($.mouseEvents.up, function() {
        $(this).removeClass('next-button-down');
    }).click(function() {
        if(init.direction == 'rtl') {
            flipbook.turn('previous');
        }else {
            flipbook.turn('next');
        }
    });

    // Events for the next button
    $('.previous-button').on($.mouseEvents.over, function() {
        $(this).addClass('previous-button-hover');
    }).on($.mouseEvents.out, function() {
        $(this).removeClass('previous-button-hover');
    }).on($.mouseEvents.down, function() {
        $(this).addClass('previous-button-down');
    }).on($.mouseEvents.up, function() {
        $(this).removeClass('previous-button-down');
    }).click(function() {
        if(init.direction == 'rtl') {
            flipbook.turn('next');
        }else {
            flipbook.turn('previous');
        }
    });

    $('.nav-icon').click(function () {
        var $nav = $(this);
        var $body = $('.nav-body');
        var timer;
        if($nav.hasClass('active')&&$body.hasClass('active')){
            navClose();
        } else {
            navOpen();
        }
        function navClose() {
            $nav.removeClass('active');
            $body.removeClass('active');
            $body.animate({
                'top': $('.nav-body')[0].scrollHeight * -1 + $nav[0].clientHeight
            },300);
        }
        function navOpen() {
            $nav.addClass('active');
            $body.addClass('active');
            $body.animate({
                'top': 0
            },300);
        }
    });

    // Slider
    $("#slider").slider({
        min: 1,
        max: m.numberOfViews(flipbook),
        value: init.direction=='rtl'?m.numberOfViews(flipbook):1,
        start: function(event, ui) {
            m.moveBar(false);
        },
        slide: function(event, ui) {
            if (init.direction == 'rtl') {
                var sliderValue = (m.numberOfViews(flipbook)*2-2) - ($(this).slider('value') * 2 - 2);
            } else {
                var sliderValue = $(this).slider('value') * 2 - 2;
            }
            $('.page-state .page-now').text(Math.max(1, sliderValue));
        },
        stop: function() {
            if (window._thumbPreview)
                _thumbPreview.removeClass('show');
            if (init.direction == 'rtl') {
                var sliderValue = (m.numberOfViews(flipbook)*2-2) - ($(this).slider('value') * 2 - 2);
            } else {
                var sliderValue = $(this).slider('value') * 2 - 2;
            }
            flipbook.turn('page', Math.max(1, sliderValue));
        }
    });

    m.initXmlMenu(flipbook);
    m.initThumb(flipbook);
    m.initZoomIcon();

    var displayMode = flipbook.turn('display');

    flipbook.attr('display-mode', displayMode);
    var rotateButton = $('.rotate-icon');
    rotateButton.css({
        display: displayMode === 'single' ? 'block' : 'none'
    });
    $('.mode-toggle').attr('display-mode', flipbook.turn('display'));

    $('.mode-toggle').click(function(evt) {
        var mode = flipbook.turn('display');
        var init = flipbook.turn('options');
        var w = flipbook.width();
        var h = flipbook.height();
        var toggle = $(this);
        var isDouble = (mode === 'double');
        var isInitDouble = (init.display === 'double');

        var updateWidth;
        var updateMode;

        if(isDouble){
            updateMode = 'single';
            updateWidth = isInitDouble ? init.width / 2 : init.width;
            $('.gsi-ebook .page').removeClass('odd').removeClass('even');
        } else {
            updateMode = 'double';
            updateWidth = isInitDouble ? init.width : init.width * 2;
            resetRotate(flipbook);
        }

        flipbook.turn('display', updateMode);
        toggle.attr('display-mode', updateMode);
        flipbook.attr('display-mode', updateMode);
        rotateButton.css({
            display: updateMode === 'single' ? 'block' : 'none'
        })
        flipbook.turn('size', updateWidth, init.height);
        m.resizeViewport(flipbook, viewport);
    });

    flipbook.attr('rotate-deg', '0');
    $('.rotate-icon').click(function(event) {
        var rotate = parseInt(flipbook.attr('rotate-deg'), 10);
        var delay = 300;
        rotate = rotate - 90;
        flipbook.attr('rotate-deg', rotate % 360);
        flipbook.css({
            transform: `rotate(${rotate}deg)`,
            transition: `transform ${delay}ms`
        });
        if (rotate % 360 === 0) {
            setTimeout(() => {
                flipbook.css({
                    transform: `rotate(${0}deg)`,
                    transition: 'transform 0ms'
                });
            }, delay);
        };
    });

    m.resizeViewport(flipbook, viewport);
    flipbook.addClass('animated');

    canvas.fadeIn(1000);
};

var resetRotate = function(book) {
    book.attr('rotate-deg', '0');
    book.css({
        transform: `rotate(${0}deg)`,
        transition: 'transform 0ms'
    });
};

function setOption(init) {
    var w = window.innerWidth;
    if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        //mobile
        var width = init.pageWidth;
        var height = init.pageHeight;
        var display = 'single';
        var duration = 0;
    } else {
        // screen
        var width = init.pageWidth*2;
        var height = init.pageHeight;
        var display = 'double';
        var duration = init.duration;
    }
    return {
        // Magazine width
        width: width*2,
        // Magazine height
        height: height*2,
        // Duration in millisecond
        duration: duration,
        // two or one
        display: display,
        // Enables gradients
        gradients: true,
        // Auto center this flipbook
        autoCenter: true,
        // Elevation from the edge of the flipbook when turning a page
        elevation: 100,
        // The number of pages
        pages: init.pageNum,
        // the directionality left-to-right (DIR=ltr, the default) or right-to-left (DIR=rtl)
        direction: init.direction,
        acceleration: true,
        data: init.data,
        region: init.regionData,
        // Events
        when: {
            turning: function(event, page, view) {
                var book = $(this),
                    currentPage = book.turn('page'),
                    pages = book.turn('pages');
                // Update the current URI
                Hash.go('p/' + page).update();
                // Show and hide navigation buttons
                m.disableControls(page, init, book);
                if(init.direction == 'rtl') {
                    var sliderView = m.numberOfViews($(this)) - m.getViewNumber($(this), page);
                }else {
                    var sliderView = m.getViewNumber($(this), page);
                }
                $('#slider').slider({value: sliderView});
                $('.page-state .page-now').text(page);
                resetRotate(book);
            },
            turned: function(event, page, view) {
                var book = $(this);
                m.disableControls(page, init, book);
                $(this).turn('center');
                if(init.direction == 'rtl') {
                    var sliderView = m.numberOfViews($(this)) - m.getViewNumber($(this), page);
                }else {
                    var sliderView = m.getViewNumber($(this), page);
                }
                $('#slider').slider({value: sliderView});
                if (page == 1) {
                    $(this).turn('peel', 'br');
                }
                $('.page-state .page-now').text(page);
            },
            missing: function(event, pages) {
                // Add pages that aren't in the magazine
                for (var i = 0; i < pages.length; i++)
                    m.addPage(pages[i], $(this));
            }
        }
    }
}

export default loadBook;
