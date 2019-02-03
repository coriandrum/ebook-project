/* global jQuery */
/**
 * zoom.js
 * www.turnjs.com
 * turnjs.com/license.txt
 *
 * Copyright (C) 2012 Emmanuel Garcia
 **/

(function ($) {
    let has3d;
    let zoomOptions = {
        max: 2,
        flipbook: null,
        easeFunction: 'ease-in-out',
        duration: 500,
        when: {}
    };

    let zoomMethods = {
        init: function (opts) {
            let that = this,
                data = this.data(),
                options = $.extend({}, zoomOptions, opts);

            if (!options.flipbook || !options.flipbook.turn('is')) {
                throw error('options.flipbook is required');
            }

            has3d = 'WebKitCSSMatrix' in window || 'MozPerspective' in document.body.style;

            if (typeof (options.max) !== 'function') {
                let max = options.max;
                options.max = function () {
                    return max;
                };
            }

            data.zoom = {
                opts: options,
                axis: point2D(0, 0),
                scrollPos: point2D(0, 0),
                eventQueue: [],
                mouseupEvent: function () {
                    return zoomMethods._eMouseUp.apply(that, arguments); // eslint-disable-line
                },
                eventTouchStart: bind(zoomMethods._eTouchStart, that),
                eventTouchMove: bind(zoomMethods._eTouchMove, that),
                eventTouchEnd: bind(zoomMethods._eTouchEnd, that),
                eventMouseDown: bind(zoomMethods._eMouseDown, that),
                eventMouseMove: bind(zoomMethods._eMouseMove, that),
                eventMouseWheel: bind(zoomMethods._eMouseWheel, that),
                eventTap: bind(zoomMethods._tap, that),
                flipbookEvents: {
                    zooming: bind(zoomMethods._eZoom, that),
                    pressed: bind(zoomMethods._ePressed, that),
                    released: bind(zoomMethods._eReleased, that),
                    start: bind(zoomMethods._eStart, that),
                    turning: bind(zoomMethods._eTurning, that),
                    turned: bind(zoomMethods._eTurned, that),
                    destroying: bind(zoomMethods._eDestroying, that)
                }
            };

            for (let eventName in options.when) {
                if (Object.prototype.hasOwnProperty.call(options.when, eventName)) {
                    this.bind('zoom.' + eventName, options.when[eventName]);
                }
            }

            for (let eventName in data.zoom.flipbookEvents) {
                if (Object.prototype.hasOwnProperty.call(data.zoom.flipbookEvents, eventName)) {
                    options.flipbook.on(eventName, data.zoom.flipbookEvents[eventName]);
                }
            }

            this.css({
                position: 'relative',
                overflow: 'hidden'
            });

            if ($.isTouch) {
                this.on('touchstart', zoomMethods._tap);

                options.flipbook
                    .on('touchstart', data.zoom.eventTouchStart)
                    .on('touchmove', data.zoom.eventTouchMove)
                    .on('touchend', data.zoom.eventTouchEnd);
            } else {
                this.mousedown(zoomMethods._mousedown)
                    .click(zoomMethods._tap);
            }
        },

        _tap: function (event) {
            //console.log('tap');
            let that = $(this),
                data = that.data().zoom;
            // let flip = data.opts.flipbook;

            if (data.draggingCorner || data.dragging) {
                return;
            }

            if (isPage($(event.target), that)) {
                zoomMethods._addEvent.call(that, 'tap', event);

                let secuence = zoomMethods._eventSeq.call(that);

                if (secuence) {
                    that.trigger(secuence);
                }
            }
        },

        _addEvent: function (eventName, event) {
            let data = this.data().zoom,
                time = (new Date()).getTime(),
                eventObject = {
                    name: eventName,
                    timestamp: time,
                    event: event
                };

            data.eventQueue.push(eventObject);

            if (data.eventQueue.length > 10) {
                data.eventQueue.splice(0, 1);
            }
        },

        _eventSeq: function () {
            let data = this.data().zoom,
                list = data.eventQueue,
                lastEvent = list.length - 1;

            if (lastEvent > 0 &&
                list[lastEvent].name === 'tap' &&
                list[lastEvent - 1].name === 'tap' &&
                list[lastEvent].event.pageX === list[lastEvent - 1].event.pageX &&
                list[lastEvent].event.pageY === list[lastEvent - 1].event.pageY &&
                list[lastEvent].timestamp - list[lastEvent - 1].timestamp < 200 &&
                list[lastEvent].timestamp - list[lastEvent - 1].timestamp > 50
            ) {
                return $.extend(list[lastEvent].event, {
                    type: 'zoom.doubleTap'
                });
            } else if (list[lastEvent].name === 'tap') {
                return $.extend(list[lastEvent].event, {
                    type: 'zoom.tap'
                });
            }
            return $.extend(list[lastEvent].event, {
                type: 'zoom.tap'
            });
        },

        _prepareZoom: function () {
            let flipPos, offsetLeft = 0,
                data = this.data().zoom,
                invz = 1 / this.zoom('value'),
                flip = data.opts.flipbook,
                dir = flip.turn('direction'),
                flipData = flip.data(),
                flipOffset = flip.offset(),
                thisOffset = this.offset(),
                flipSize = {
                    height: flip.height()
                },
                view = flip.turn('view');

            if (flip.turn('display') === 'double' && flip.data().opts.autoCenter) {
                if (!view[0]) {
                    flipSize.width = flip.width() / 2;
                    offsetLeft = (dir === 'ltr') ? flipSize.width : 0;
                    flipPos = point2D(
                        (dir === 'ltr') ? flipOffset.left - thisOffset.left + flipSize.width : flipOffset.left - thisOffset.left,
                        flipOffset.top - thisOffset.top
                    );
                } else if (!view[1]) {
                    flipSize.width = flip.width() / 2;
                    offsetLeft = (dir === 'ltr') ? 0 : flipSize.width;
                    flipPos = point2D(
                        (dir === 'ltr') ? flipOffset.left - thisOffset.left : flipOffset.left - thisOffset.left + flipSize.width,
                        flipOffset.top - thisOffset.top
                    );
                } else {
                    flipSize.width = flip.width();
                    flipPos = point2D(
                        flipOffset.left - thisOffset.left,
                        flipOffset.top - thisOffset.top
                    );
                }
            } else {
                flipSize.width = flip.width();
                flipPos = point2D(
                    flipOffset.left - thisOffset.left,
                    flipOffset.top - thisOffset.top
                );
            }

            if (!data.zoomer) {
                data.zoomer = $('<div />', {
                    'class': 'zoomer',
                    css: {
                        overflow: 'hidden',
                        position: 'absolute',
                        zIndex: '1000000',
                        transform: `rotate(${flip.attr('rotate-deg')}deg)`
                    }
                })
                    .mousedown(() => {
                        return false;
                    }).appendTo(this);
            }


            data.zoomer.css({
                top: flipPos.y,
                left: flipPos.x,
                width: flipSize.width,
                height: flipSize.height
            });

            let zoomerView = view.join(',');

            if (zoomerView !== data.zoomerView) {
                data.zoomerView = zoomerView;
                data.zoomer.find('*').remove();

                for (let p = 0; p < view.length; p++) {
                    if (!view[p]) {
                        continue;
                    }

                    let pos = flipData.pageObjs[view[p]].offset(),
                        pageElement = $(flipData.pageObjs[view[p]]);

                    pageElement
                        .clone()
                        .transform('')
                        .css({
                            width: pageElement.width() * invz,
                            height: pageElement.height() * invz,
                            position: 'absolute',
                            display: '',
                            top: (pos.top - flipOffset.top) * invz,
                            left: (pos.left - flipOffset.left - offsetLeft) * invz
                        })
                        .appendTo(data.zoomer);
                }
            }


            return {
                pos: flipPos,
                size: flipSize
            };
        },

        value: function () {
            let data = this.data().zoom;
            return data.opts.flipbook.turn('zoom');
        },

        zoomIn: function (event) {
            let pos,
                that = this,
                data = this.data().zoom,
                flip = data.opts.flipbook,
                zoom = data.opts.max(),
                // flipOffset = flip.offset(),
                thisOffset = this.offset();

            if (data.zoomIn) {
                return this;
            }

            flip.turn('stop');

            let ev = $.Event('zoom.change');
            this.trigger(ev, [zoom]);

            if (ev.isDefaultPrevented()) {
                return this;
            }

            let bound = zoomMethods._prepareZoom.call(this),
                flipPos = bound.pos,
                center = point2D(bound.size.width / 2, bound.size.height / 2),
                prefix = $.cssPrefix(),
                transitionEnd = $.cssTransitionEnd(),
                autoCenter = flip.data().opts.autoCenter;

            data.scale = zoom;
            flip.data().noCenter = true;

            if (typeof (event) !== 'undefined') {
                if ('x' in event && 'y' in event) {
                    pos = point2D(event.x - flipPos.x, event.y - flipPos.y);
                } else {
                    pos = ($.isTouch) ?
                        point2D(
                            event.originalEvent.touches[0].pageX - flipPos.x - thisOffset.left,
                            event.originalEvent.touches[0].pageY - flipPos.y - thisOffset.top
                        ) :
                        point2D(
                            event.pageX - flipPos.x - thisOffset.left,
                            event.pageY - flipPos.y - thisOffset.top
                        );
                }
            } else {
                pos = point2D(center.x, center.y);
            }


            if (pos.x < 0 || pos.y < 0 || pos.x > bound.width || pos.y > bound.height) {
                pos.x = center.x;
                pos.y = center.y;
            }


            let compose = point2D(
                    (pos.x - center.x) * zoom + center.x,
                    (pos.y - center.y) * zoom + center.y
                ),
                move = point2D(
                    (bound.size.width * zoom > this.width()) ? pos.x - compose.x : 0,
                    (bound.size.height * zoom > this.height()) ? pos.y - compose.y : 0
                ),
                maxMove = point2D(
                    Math.abs(bound.size.width * zoom - this.width()),
                    Math.abs(bound.size.height * zoom - this.height())
                ),
                minMove = point2D(
                    Math.min(0, bound.size.width * zoom - this.width()),
                    Math.min(0, bound.size.height * zoom - this.height())
                ),
                realPos = point2D(
                    center.x * zoom - center.x - flipPos.x - move.x,
                    center.y * zoom - center.y - flipPos.y - move.y
                );

            if (realPos.y > maxMove.y) {
                move.y = realPos.y - maxMove.y + move.y;
            } else if (realPos.y < minMove.y) {
                move.y = realPos.y - minMove.y + move.y;
            }

            if (realPos.x > maxMove.x) {
                move.x = realPos.x - maxMove.x + move.x;
            } else if (realPos.x < minMove.x) {
                move.x = realPos.x - minMove.x + move.x;
            }

            realPos = point2D(
                center.x * zoom - center.x - flipPos.x - move.x,
                center.y * zoom - center.y - flipPos.y - move.y
            );
            let deg = flip.attr('rotate-deg');
            let css = {};

            css[prefix + 'transition'] = prefix +
        'transform ' +
        data.opts.easeFunction +
        ' ' +
        data.opts.duration +
        'ms';

            let transitionEndCallback = function () {
                that.trigger('zoom.zoomIn');

                data.zoomIn = true;

                data.flipPosition = point2D(flip.css('left'), flip.css('top'));

                flip.turn('zoom', zoom).css({
                    position: 'absolute',
                    margin: '',
                    top: 0,
                    left: 0
                });

                let flipOffset = flip.offset();

                data.axis = point2D(
                    flipOffset.left - thisOffset.left,
                    flipOffset.top - thisOffset.top
                );


                if (autoCenter && flip.turn('display') === 'double') {
                    if (
                        (flip.turn('direction') === 'ltr' && !flip.turn('view')[0]) ||
                        (flip.turn('direction') === 'rtl' && !flip.turn('view')[1])
                    ) {
                        data.axis = point2D(
                            data.axis.x + flip.width() / 2,
                            data.axis.y
                        );
                    }
                }

                that.zoom('scroll', realPos);
                //console.log(data);
                flip.on($.mouseEvents.down, data.eventMouseDown);
                flip.on($.mouseEvents.move, data.eventMouseMove);
                flip.on('mousewheel', data.eventMouseWheel);
                //that.on($.mouseEvents.down, zoomMethods._eMouseDown);
                //that.on($.mouseEvents.move, zoomMethods._eMouseMove);
                $(document).on($.mouseEvents.up, data.mouseupEvent);
                //that.on('mousewheel', zoomMethods._eMouseWheel);
                setTimeout(() => {
                    data.zoomer.hide();
                    data.zoomer.remove();
                    data.zoomer = null;
                    data.zoomerView = null;
                }, 50);
            };

            data.zoomer.css(css).show();

            if (transitionEnd) {
                data.zoomer.on(transitionEnd, function () {
                    $(this).off(transitionEnd);
                    transitionEndCallback();
                });
            } else {
                setTimeout(transitionEndCallback, data.opts.duration);
            }

            //console.log(data.zoomer);
            data.zoomer.transform(translate(move.x, move.y, true) + scale(zoom, true) + rotate(deg, true));

            return this;
        },

        zoomOut: function (duration) {
            let move,
                that = this,
                data = this.data().zoom,
                flip = data.opts.flipbook,
                zoom = 1,
                scaling = zoom / data.scale,
                prefix = $.cssPrefix(),
                transitionEnd = $.cssTransitionEnd(),
                thisOffset = this.offset();

            duration = (typeof (duration) !== 'undefined') ? duration : data.opts.duration;

            if (!data.zoomIn) {
                return;
            }

            let ev = $.Event('zoom.change');
            this.trigger(ev, [zoom]);

            if (ev.isDefaultPrevented()) {
                return this; // eslint-disable-line
            }

            data.zoomIn = false;
            data.scale = zoom;

            flip.data().noCenter = false;
            flip.off($.mouseEvents.down, data.eventMouseDown);
            flip.off($.mouseEvents.move, data.eventMouseMove);
            flip.off('mousewheel', data.eventMouseWheel);
            //that.off($.mouseEvents.down, zoomMethods._eMouseDown);
            //that.off($.mouseEvents.move, zoomMethods._eMouseMove);
            $(document).off($.mouseEvents.up, data.mouseupEvent);
            //that.off('mousewheel', zoomMethods._eMouseWheel);

            let css = {};

            css[prefix + 'transition'] = prefix +
                'transform ' +
                data.opts.easeFunction +
                ' ' +
                duration +
                'ms';

            flip.css(css);

            let flipDesPos,
                tmp = $('<div />', {
                    css: {
                        position: 'relative',
                        top: data.flipPosition.y,
                        left: data.flipPosition.x,
                        width: flip.width() * scaling,
                        height: flip.height() * scaling,
                        background: 'blue'
                    }
                }).appendTo(flip.parent());

            flipDesPos = point2D(
                tmp.offset().left - thisOffset.left,
                tmp.offset().top - thisOffset.top
            );

            tmp.remove();

            let autoCenter = flip.data().opts.autoCenter;

            if (autoCenter && flip.turn('display') === 'double') {
                if (!flip.turn('view')[0]) {
                    flipDesPos.x = (flip.turn('direction') === 'ltr') ?
                        flipDesPos.x - tmp.width() / 4 :
                        flipDesPos.x + tmp.width() / 4;
                } else if (!flip.turn('view')[1]) {
                    flipDesPos.x = (flip.turn('direction') === 'ltr') ?
                        flipDesPos.x + tmp.width() / 4 :
                        flipDesPos.x - tmp.width() / 4;
                }
            }

            let flipRealPos = $.findPos(flip[0]);

            move = point2D(
                -flip.width() / 2 - flipRealPos.left + tmp.width() / 2 + flipDesPos.x + thisOffset.left,
                -flip.height() / 2 - flipRealPos.top + tmp.height() / 2 + flipDesPos.y + thisOffset.top
            );

            let transitionEndCallback = function () {
                let deg = flip.attr('rotate-deg');
                if (flip[0].style.removeProperty) {
                    flip[0].style.removeProperty(prefix + 'transition');
                    flip.transform(
                        (flip.turn('options').acceleration) ? translate(0, 0, true) : ''
                    )
                        .turn('zoom', 1);
                    flip[0].style.removeProperty('margin');
                    flip.css({
                        position: 'relative',
                        top: data.flipPosition.y,
                        left: data.flipPosition.x,
                        transform: `rotate(${deg}deg)`
                    });
                } else {
                    flip.transform('none')
                        .turn('zoom', 1)
                        .css({
                            margin: '',
                            top: data.flipPosition.y,
                            left: data.flipPosition.x,
                            position: 'relative',
                            transform: `rotate(${deg}deg)`
                        });
                }

                if (autoCenter) {
                    flip.turn('center');
                }

                that.trigger('zoom.zoomOut');
            };
            let deg = flip.attr('rotate-deg');
            if (duration === 0) {
                transitionEndCallback();
            } else if (transitionEnd) {
                flip.on(transitionEnd, function () {
                    $(this).off(transitionEnd);
                    transitionEndCallback();
                });

                flip.transform(translate(move.x, move.y, true) + scale(scaling, true) + rotate(deg, true));
            } else {
                setTimeout(transitionEndCallback, duration);
                flip.transform(translate(move.x, move.y, true) + scale(scaling, true) + rotate(deg, true));
            }

            return this; // eslint-disable-line
        },

        flipbookWidth: function () {
            let data = this.data().zoom,
                flipbook = data.opts.flipbook,
                view = flipbook.turn('view');

            return (flipbook.turn('display') === 'double' && (!view[0] || !view[1])) ?
                flipbook.width() / 2 :
                flipbook.width();
        },

        flipbookHeight: function () {
            let data = this.data().zoom,
                flipbook = data.opts.flipbook;

            return flipbook.height();
        },

        scroll: function (to, unlimited, animate) {
            let data = this.data().zoom,
                flip = data.opts.flipbook,
                flipWidth = this.zoom('flipbookWidth'),
                flipHieght = this.zoom('flipbookHeight'),
                prefix = $.cssPrefix();
            if (has3d) {
                let css = {};

                if (animate) {
                    css[prefix + 'transition'] = prefix + 'transform 200ms';
                } else {
                    css[prefix + 'transition'] = 'none';
                }

                let deg = flip.attr('rotate-deg');
                flip.css(css);
                flip.transform(translate(-data.axis.x - to.x, -data.axis.y - to.y, true) + rotate(deg, true));
            } else {
                flip.css({
                    top: -data.axis.y - to.y,
                    left: -data.axis.x - to.x
                });
            }

            if (!unlimited) {
                let out;
                let deg = flip.attr('rotate-deg');
                let isVertical = (deg % 180) === 0;
                const horizontalSubValue = isVertical ? flipWidth - this.width() : flipHieght - this.width();
                const verticalSubValue = isVertical ? flipHieght - this.height() : flipWidth - this.height();
                const minBound = point2D(
                    Math.min(0, horizontalSubValue / 2),
                    Math.min(0, verticalSubValue / 2)
                );
                const maxBound = point2D(
                    (flipWidth > this.width()) ? horizontalSubValue : horizontalSubValue / 2,
                    (flipHieght > this.height()) ? verticalSubValue : verticalSubValue / 2
                );
                if (to.y < minBound.y) {
                    to.y = minBound.y;
                    out = true;
                } else if (to.y > maxBound.y) {
                    to.y = maxBound.y;
                    out = true;
                }

                if (to.x < minBound.x) {
                    to.x = minBound.x;
                    out = true;
                } else if (to.x > maxBound.x) {
                    to.x = maxBound.x;
                    out = true;
                }

                if (out) {
                    this.zoom('scroll', to, true, true);
                }
            }

            data.scrollPos = point2D(to.x, to.y);
        },

        resize: function () {
            let data = this.data().zoom,
                flip = data.opts.flipbook;

            if (this.zoom('value') > 1) {
                let flipOffset = flip.offset(),
                    thisOffset = this.offset();

                data.axis = point2D(
                    (flipOffset.left - thisOffset.left) + (data.axis.x + data.scrollPos.x),
                    (flipOffset.top - thisOffset.top) + (data.axis.y + data.scrollPos.y)
                );

                if (
                    flip.turn('display') === 'double' &&
                    flip.turn('direction') === 'ltr' &&
                    !flip.turn('view')[0]
                ) {
                    data.axis.x = data.axis.x + flip.width() / 2; // eslint-disable-line
                }

                this.zoom('scroll', data.scrollPos);
            }
        },

        _eZoom: function () {
            let data = this.data().zoom,
                flip = data.opts.flipbook,
                view = flip.turn('view');

            for (let p = 0; p < view.length; p++) {
                if (view[p]) {
                    this.trigger('zoom.resize', [data.scale, view[p], flip.data().pageObjs[view[p]]]);
                }
            }
        },

        _eStart: function (event, pageObj) {
            if (this.zoom('value') !== 1) {
                //event.preventDefault();
            }
        },

        _eTurning: function (event, page, view) {
            let that = this,
                zoom = this.zoom('value'),
                data = this.data().zoom,
                flip = data.opts.flipbook;

            data.page = flip.turn('page');

            if (zoom !== 1) {
                for (let p = 0; p < view.length; p++) {
                    if (view[p]) {
                        this.trigger('zoom.resize', [zoom, view[p], flip.data().pageObjs[view[p]]]);
                    }
                }

                setTimeout(() => {
                    that.zoom('resize');
                }, 0);
            }
        },

        _eTurned: function (event, page) {
            if (this.zoom('value') !== 1) {
                let data = this.data().zoom,
                    flip = data.opts.flipbook;

                if (page > data.page) {
                    this.zoom('scroll',
                        point2D(0, data.scrollPos.y), false, true);
                } else if (page < data.page) {
                    this.zoom('scroll',
                        point2D(flip.width(), data.scrollPos.y), false, true);
                }
            }
        },

        _ePressed: function () {
            let data = $(this).data().zoom;
            data.draggingCorner = true;
        },

        _eReleased: function () {
            let data = $(this).data().zoom;

            setTimeout(() => {
                data.draggingCorner = false;
            }, 1);
        },

        _eMouseDown: function (event) {
            //console.log('down!!');
            let data = $(this).data().zoom;
            data.draggingCur = ($.isTouch) ?
                point2D(
                    event.originalEvent.touches[0].pageX,
                    event.originalEvent.touches[0].pageY
                ) :
                point2D(event.pageX, event.pageY);

            return false;
        },

        _eMouseMove: function (event) {
            let data = $(this).data().zoom;

            if (data.draggingCur) {
                data.dragging = true;

                let cur = ($.isTouch) ?
                        point2D(
                            event.originalEvent.touches[0].pageX,
                            event.originalEvent.touches[0].pageY
                        ) :
                        point2D(event.pageX, event.pageY),
                    motion = point2D(
                        cur.x - data.draggingCur.x,
                        cur.y - data.draggingCur.y
                    );

                $(this).zoom('scroll',
                    point2D(
                        data.scrollPos.x - motion.x,
                        data.scrollPos.y - motion.y
                    ), true);

                data.draggingCur = cur;

                return false;
            }
            return null;
        },

        _eMouseUp: function (event) {
            let data = $(this).data().zoom;

            if (data.dragging) {
                $(this).zoom('scroll', data.scrollPos);
            }

            data.draggingCur = null;

            setTimeout(() => {
                data.dragging = false;
            }, 1);
        },

        _eMouseWheel: function (event) {
            event.preventDefault();


            let deltaX = event.originalEvent.deltaX || 0;
            let deltaY = event.originalEvent.deltaY || 0;

            let data = $(this).data().zoom,
                cur = point2D(
                    data.scrollPos.x - deltaX,
                    data.scrollPos.y - deltaY
                );
            $(this).zoom('scroll', cur);
        },

        _eTouchStart: function (event, page) {
            //console.log('Touch Start!');
            let data = $(this).data().zoom,
                finger = point2D(
                    event.originalEvent.touches[0].pageX,
                    event.originalEvent.touches[0].pageY
                );

            data.touch = {};
            data.touch.initial = finger;
            data.touch.last = finger;
            data.touch.timestamp = (new Date()).getTime();
            data.touch.speed = point2D(0, 0);
        },

        _eTouchMove: function (event) {
            let data = $(this).data().zoom,
                zoom = $(this).zoom('value'),
                flip = data.opts.flipbook,
                time = (new Date()).getTime(),
                finger = point2D(
                    event.originalEvent.touches[0].pageX,
                    event.originalEvent.touches[0].pageY
                );
            if (data.touch && zoom === 1 && !flip.data().mouseAction) {
                data.touch.motion = point2D(
                    finger.x - data.touch.last.x,
                    finger.y - data.touch.last.y
                );


                data.touch.speed.x = (data.touch.speed.x === 0) ?
                    data.touch.motion.x / (time - data.touch.timestamp) :
                    (data.touch.speed.x + (data.touch.motion.x / (time - data.touch.timestamp))) / 2;

                data.touch.last = finger;
                data.touch.timestamp = time;
            }
        },

        _eTouchEnd: function (event) {
            let data = $(this).data().zoom;

            if (data.touch && $(this).zoom('value') === 1) {
                let y = Math.abs(data.touch.initial.y - data.touch.last.y);

                if (y < 50 && (data.touch.speed.x < -1 || data.touch.last.x - data.touch.initial.x < -100)) {
                    this.trigger('zoom.swipeLeft');
                } else if (y < 50 && (data.touch.speed.x > 1 || data.touch.last.x - data.touch.initial.x > 100)) {
                    this.trigger('zoom.swipeRight');
                }
            }
        },

        _eDestroying: function () {
            let that = this,
                data = this.data().zoom,
                flip = data.opts.flipbook,
                events = [
                    'tap',
                    'doubleTap',
                    'resize',
                    'zoomIn',
                    'zoomOut',
                    'swipeLeft',
                    'swipeRight'
                ];

            this.zoom('zoomOut', 0);

            $.each(events, (index, eventName) => {
                that.off('zoom.' + eventName);
            });

            for (let eventName in data.flipbookEvents) {
                if (Object.prototype.hasOwnProperty.call(data.flipbookEvents, eventName)) {
                    flip.off(eventName, data.flipbookEvents[eventName]);
                }
            }

            flip.off('touchstart', data.eventTouchStart)
                .off('touchmove', data.eventTouchMove)
                .off('touchend', data.eventTouchEnd);

            this.off('touchstart', zoomMethods._tap)
                .off('click', zoomMethods._tap);

            data = null;
            this.data().zoom = null;
        }
    };

    function isPage(element, last) {
        if (element[0] === last[0]) {
            return false;
        }

        if (element.attr('page')) {
            return true;
        }

        return (element.parent()[0]) ?
            isPage(element.parent(), last) :
            false;
    }

    function error(message) {
        function TurnJsError(message) {
            this.name = 'TurnJsError';
            this.message = message;
        }

        TurnJsError.prototype = new Error();
        TurnJsError.prototype.constructor = TurnJsError;
        return new TurnJsError(message);
    }

    function translate(x, y, use3d) {
        return (has3d && use3d) ? ' translate3d(' + x + 'px,' + y + 'px, 0px) ' :
            ' translate(' + x + 'px, ' + y + 'px) ';
    }

    function scale(v, use3d) {
        return (has3d && use3d) ? ' scale3d(' + v + ', ' + v + ', 1) ' :
            ' scale(' + v + ') ';
    }

    function rotate(deg, use3d) {
        return ' rotate(' + deg + 'deg)';
    }

    function point2D(x, y) {
        return {
            x: x,
            y: y
        };
    }

    function bind(func, context) {
        return function () {
            return func.apply(context, arguments); // eslint-disable-line
        };
    }

    $.extend($.fn, {
        zoom: function () {
            let args = arguments; // eslint-disable-line

            if (!args[0] || typeof (args[0]) === 'object') {
                return zoomMethods.init.apply($(this[0]), args);
            } else if (zoomMethods[args[0]]) {
                return zoomMethods[args[0]].apply($(this[0]), Array.prototype.slice.call(args, 1));
            } else {
                throw error(args[0] + ' is not a method');
            }
        }
    });
}(jQuery));
