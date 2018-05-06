/* Javascript flot charts plagin with extra elements drawing and touch support

 Copyright (c) 2013-2018 Yuri Dursin
 Licensed under the MIT license.

 Touch pan and zoom requires flot.navigate plugin
 Extra plugin supports configuration options:

 extra: {
    touch: true,            // touch pan, zoom and tap events enable (by default)
    color: color,           // default color
    lineWidth: width,       // default line width
    lineWidthRect: width,   // default line width for rect
    lineJoin: "round",      // default line join style
    cropByBounds: true,     // crop by plot bounds flag

    // array of rectangles, all parameters are optional
    rectangles: [{
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        color: color
        lineJoin: join,
        lineWidth: width,
    }],

    // array of vertical lines
    verticalLines: [{
        location: 55,
        color: color,
        lineWidth: width
    }],

     // array of horizontal lines
    horizontalLines: [{
        location: 100,
        color: color,
        lineWidth: width
    }]
 }

 Example usage:
    var plot = $.plot(parent, [[]], {
        extra:{
            rectangles: [{left:(new Date(2013,8,26)).getTime(), right:(new Date(2013,8,27)).getTime()}],
            horizontalLines: [{location: 120}],
            verticalLines: [{location: (new Date(2013,8,25)).getTime()}]
        }
        zoom: {
            interactive: true
        },
        pan: {
            interactive: true
        }
    })
    plot.bind('plottap', function(event, ntap, ktap, pos) {
        if (ntap === 1 && ktap === 2) {
            // single click with two fingers
        }
    })
*/

(function ($) {
    var pan_count_motion = 10;
    var tap_tmout_touch = 300;
    var tap_tmout_untouch = 300;

    function init(plot) {

        // draw extra elements
        function draw(plot, ctx) {
            var opt = plot.getOptions();
            var extra = opt.extra || {};
            if (!extra.rectangles && !extra.verticalLines && !extra.horizontalLines) return;

            var width = plot.width();
            var height = plot.height();
            var plotOffset = plot.getPlotOffset();
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // draw rectangles
            if (extra.rectangles)
            $.each(extra.rectangles, function(key,rect){
                if (Array.isArray(rect)) {
                    if (rect.length < 4) rect = { left: rect[0], right: rect[1], color: rect[2] }
                    else rect = { left: rect[0], top: rect[1], right: rect[2], bottom: rect[3], color: rect[4] }
                }

                // prepare coordinates
                var p1 = plot.p2c({ x: rect.left, y: rect.top });
                var p2 = plot.p2c({ x: rect.right, y: rect.bottom });
                if (typeof(p1.left) == 'undefined') p1.left = 0;
                if (typeof(p2.left) == 'undefined') p2.left = width;
                if (typeof(p1.top) == 'undefined') p1.top = 0;
                if (typeof(p2.top) == 'undefined') p2.top = height;
                var x = Math.min(p1.left, p2.left),
                    y = Math.min(p1.top, p2.top),
                    w = Math.abs(p2.left - p1.left),
                    h = Math.abs(p2.top - p1.top);

                // crop by plot bounds
                if (extra.cropByBounds){
                    if (x+w<=0 || x>=width) w=0;
                    else {
                        if (x<0){ w+=x; x=0; }
                        if (x+w>width) w=width-x;
                    }
                    if (y+h<=0 || y>=height) h=0;
                    else {
                        if (y<0){ h+=y; y=0; }
                        if (y+h>height) h=height-y;
                    }
                }

                // draw rect
                if (w>0 || h>0){
                    var lnw = rect.lineWidth || extra.lineWidthRect;
                    var c = $.color.parse(rect.color || extra.color);
                    ctx.fillStyle = c.scale('a', 0.4).toString();
                    ctx.fillRect(x, y, w, h);
                    if (lnw > 0) {
                        ctx.lineWidth = lnw;
                        ctx.lineJoin = rect.lineJoin || extra.lineJoin;
                        ctx.strokeStyle = c.scale('a', 0.8).toString();
                        ctx.strokeRect(x, y, w, h);
                    }
                }
            });

            // yep, you guessed it, this function draws a line.
            var drawLine = function(x1, y1, x2, y2, color, lineWidth){
                ctx.beginPath();
                ctx.strokeStyle = color || extra.color;
                ctx.lineWidth = lineWidth || extra.lineWidth;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            };

            // draw extra vertical lines as desired:
            if (extra.verticalLines)
            $.each(extra.verticalLines, function(key,line){
                var p = plot.p2c({ x: line.location, y: 0 });
                drawLine(p.left, 0, p.left, height, line.color, line.lineWidth);
            });

            // draw extra horizontal lines as desired:
            if (extra.horizontalLines)
            $.each(extra.horizontalLines, function(key,line){
                var p = plot.p2c({ x: 0, y: line.location });
                drawLine(0, p.top, width, p.top, line.color, line.lineWidth);
            });

            ctx.restore();
        }

        // process touch events
        var touch = {};
        function touch_clear() {
            if (touch.t) clearTimeout(touch.t)
            touch.p = touch.d = touch.t = touch.n = undefined;            
        }
        function touch_pan(p, tmout) {
            if (touch.p && !touch.t) touch.t = setTimeout(function() {
                touch.t = undefined;
                var ofsx = touch.p.left - p.left;
                var ofsy = touch.p.top - p.top;
                plot.pan({ left: ofsx, top: ofsy });
                touch.p = p;
                if (touch.n > 0) {
                    touch.n--;
                    var p2 = { left: p.left - ofsx*2/3, top: p.top - ofsy*2/3}
                    if (p2.left > 0 || p2.top > 0) touch_pan(p2, tmout);
                }
            }, tmout)
        }
        function touch_zoom(touches, tmout) {
            var ofs = plot.offset();
            var p = { left: (touches[0].pageX + touches[1].pageX) / 2 - ofs.left, top: (touches[0].pageY + touches[1].pageY) / 2 - ofs.top }
            var d = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
            if (touch.d && !touch.t) touch.t = setTimeout(function () {
                touch.t = undefined;
                if (d > 0 && touch.d > 0) plot.zoom({ amount: d/touch.d, center: p });
                touch.d = d;
            }, tmout) 
        }
        function touch_tap(ntap, ktap, tap) {
            var ofs = plot.offset();
            var pos = plot.c2p({ left: tap.pageX - ofs.left, top: tap.pageY - ofs.top });
            plot.getPlaceholder().trigger('plottap', [ntap, ktap, pos]);          
        }
        function touch_start(evt) {
            evt.preventDefault();
            var opt = plot.getOptions();
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};
            var touches = evt.originalEvent.touches;

            // clear previus pan and zoom
            touch_clear();
            
            // prepare pan
            if (pan.interactive && touches.length >= 1) {
                touch.p = { left: touches[0].pageX, top: touches[0].pageY }
            }

            // prepare zoom
            if (zoom.interactive && touches.length >= 2) {
                touch.d = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
            }

            // prepare tap
            if (!touch.ttap) {
                touch.ktap = touches.length;
                touch.ntap = 1;
            }
            else if (touch.ktap !== undefined && touch.ktap < touches.length) {
                touch.ktap = touches.length;                
            }
            else {
                clearTimeout(touch.ttap);
                touch.ttap = undefined;
                touch.ktap = touches.length;                
                touch.ntap ++;
            }
            if (!touch.ttap) {
                touch.tap = touches[0];
                touch.ttap = setTimeout(function() { 
                    touch.ttap = touch.ntap = touch.ktap = touch.tap = undefined;
                }, tap_tmout_touch)
            }
        }
        function touch_move(evt) {
            evt.preventDefault();
            var opt = plot.getOptions();
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};
            var tmout = 1000 / (pan.frameRate || 20);
            var touches = evt.originalEvent.touches;

            // process pan
            if (pan.interactive && touches.length === 1) {
                touch_pan({ left: touches[0].pageX, top: touches[0].pageY }, tmout)
            }

            // process zoom
            if (zoom.interactive && touches.length === 2) {
                touch_zoom(touches, tmout);
            }
        }
        function touch_end(evt) {
            evt.preventDefault();
            var touches = evt.originalEvent.touches;

            // clear pan and zoom
            //touchclear();

            // set pan timeout actions
            if (touch.t) touch.n = pan_count_motion; 

            // check tap coordinates
            if (touch.ttap && touch.tap) {
                var changed = evt.originalEvent.changedTouches;
                for (var i = 0, len = changed.length; i < len; i++) {
                    var tap = changed[i];
                    if (tap.identifier !== touch.tap.identifier) continue;
                    var dx = Math.abs(tap.pageX - touch.tap.pageX);
                    var dy = Math.abs(tap.pageY - touch.tap.pageY);
                    if (dx > 2 || dy > 2) {
                        clearTimeout(touch.ttap);
                        touch.ttap = touch.ntap = touch.ktap = touch.tap = undefined;    
                    }
                    break;
                }
            }

            // process tap events
            if (touches.length === 0 && touch.ttap) {
                var ktap = touch.ktap;
                touch.ktap = undefined;
                clearTimeout(touch.ttap);
                touch.ttap = setTimeout(function() {
                    touch_tap(touch.ntap, ktap, touch.tap);
                    touch.ttap = touch.ntap = touch.ktap = touch.tap = undefined;    
                }, tap_tmout_untouch)
            }
        }

        // init hooks
        plot.hooks.drawOverlay.push(draw);
        plot.hooks.bindEvents.push(function(plot, eventHolder) {
            var opt = plot.getOptions();
            var extra = opt.extra || {};
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};    
            if (extra.touch && (pan.interactive || zoom.interactive)) {
                eventHolder
                .bind('touchstart', touch_start)
                .bind('touchmove', touch_move)
                .bind('touchend', touch_end)    
            }
        })
        plot.hooks.shutdown.push(function(plot, eventHolder) {
            eventHolder
            .unbind('touchstart', touch_start)
            .unbind('touchmove', touch_move)
            .unbind('touchend', touch_end)   
        })
    }

    $.plot.plugins.push({
        name: 'extra',
        version: '2.2',
        init: init,
        options: {
            extra: {
                touch: true,
                color: "#666",
                lineJoin: "round",
                lineWidth: 1,
                lineWidthRect: 0,
                cropByBounds: true,
                rectangles: null,
                verticalLines: null,
                horizontalLines: null
            }
        }
    });

})(jQuery);