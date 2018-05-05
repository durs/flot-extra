/* Javascript flot charts plagin with extra elements drawing and touch support

 Copyright (c) 2013-2018 Yuri Dursin
 Licensed under the MIT license.

 Touch functions requires flot.navigate plugin
 The plugin supports these options:

 extra: {
    touch: true,        // touch pan and zoom enable (by default)
    color: color,       // default color
    lineWidth: width,   // default line width
    lineWidthRect: width,   // default line width for rect
    lineJoin: "round",  // default line join style
    cropByBounds: true, // crop by plot bounds flag

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
     });

 */

(function ($) {

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
        var touch = {}
        function touchstart(evt) {
            var opt = plot.getOptions();
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};
            var touches = evt.originalEvent.touches;
            if (pan.interactive && touches.length >= 1) {
                touch.p = { left: touches[0].pageX, top: touches[0].pageY }
            }
            if (zoom.interactive && touches.length >= 2) {
                touch.d = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
            }
            return false;
        }        
        function touchmove(evt) {
            var opt = plot.getOptions();
            var pan = opt.pan || {};
            var zoom = opt.zoom || {};
            var tmout = 1000 / (pan.frameRate || 20);
            var touches = evt.originalEvent.touches;
            if (pan.interactive && touches.length === 1) {
                var p = { left: touches[0].pageX, top: touches[0].pageY }
                if (touch.p && !touch.t) touch.t = setTimeout(function () {
                    plot.pan({ left: touch.p.left - p.left, top: touch.p.top - p.top });
                    touch.t = undefined;
                    touch.p = p;
                }, tmout) 
            }
            if (zoom.interactive && touches.length === 2) {
                var ofs = plot.offset();
                var p = { left: (touches[0].pageX + touches[1].pageX) / 2 - ofs.left, top: (touches[0].pageY + touches[1].pageY) / 2 - ofs.top }
                var d = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
                if (touch.d && !touch.t) touch.t = setTimeout(function () {
                    plot.zoom({ amount: d/touch.d, center: p });
                    touch.t = undefined;
                    touch.d = d;
                }, tmout) 
            }
        }
        function touchend(evt) {
            if (touch.t) clearTimeout(touch.t)
            touch.p = touch.d = touch.t = undefined;
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
                .bind('touchstart', touchstart)
                .bind('touchmove', touchmove)
                .bind('touchend', touchend)    
            }
        })
        plot.hooks.shutdown.push(function(plot, eventHolder) {
            eventHolder
            .unbind('touchstart', touchstart)
            .unbind('touchmove', touchmove)
            .unbind('touchend', touchend)   
        })
    }

    $.plot.plugins.push({
        name: 'extra',
        version: '2.1',
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