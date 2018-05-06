# Name

Javascript flot charts plagin with extra elements drawing and touch support
Read more about flot charts at the website: http://www.flotcharts.org/

# Features

* Drawing rectangles (transparent), vertical and horizontal lines
* Touch devices support panning and zooming (requires flot.navigate plugin)
* Touch event "plottap" on single or multi taps on plot

# Configuration

Extra plugin supports configuration options:
``` js 
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
```

# Usage example

``` js 
var plot = $.plot(parent, [[]], {
    extra: {
        rectangles: [{ left: (new Date(2013,8,26)).getTime(), right: (new Date(2013,8,27)).getTime() }],
        horizontalLines: [{ location: 120 }],
        verticalLines: [{ location: (new Date(2013,8,25)).getTime() }]
    },
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
```

# Contributors

* [durs](https://github.com/durs)