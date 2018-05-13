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
    color: color,           // default drawing color for lines
    fillColor: color,       // default filling color for markers
    lineWidth: 1,           // default line width
    lineWidthRect: 0,       // default line width for rect
    lineWidthMarker: 1,     // default line width for markers
    lineJoin: "round",      // default line join style
    cropByBounds: true,     // crop by plot bounds flag
    background: true,       // drawing rectangles at background
    transparent: 1,         // drawing rectangles with alpha channel on value < 1
    markerRadius: 3,        // default marker radius
    markerSymbol: 'circle', // default marker symbol
    shadowSize: 2,          // default shadow size for markers
    shadowBlur: 10,         // default shadow blur for lines
    shadowBlurText: 3,		// default shadow blur for text
    shadowColor: '#000',
    shadowColorText: '#666',
    textAlign: 'left',
    textBaseline: 'bottom',
    textColor: '#444',
    textFont: '14px arial',
	
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
	
    // array of markers
    markers: [{
        x: 10,
        y: 10,
        symbol: function or reserved: 'circle', 'square', 'diamond', 'cross', 'triangle', 'triangle_down'
        radius: 3, 
        color: color,
        fillColor: color,
        lineWidth: width,
        shadowSize: 2,
		text: 'string'
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
        markers: [{ x: (new Date(2018,5,1)).getTime(), y: 100, radius: 5, symbol: 'triangle', color: '#ff0000', fillColor: '#800000', text: 'marker' }]
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