// unused style

var mapStyles = [ { stylers: [ { gamma: 1 }, { hue: "#0022ff" }, { saturation: -83 }, { lightness: 12 } ] },{ } ];

// google map

var map = new google.maps.Map(d3.select("#map").node(), 
{
  zoom: 7,
  center: new google.maps.LatLng(37.7596, 140.473),
  mapTypeId: google.maps.MapTypeId.TERRAIN
});

// other globals

var maxData = 2525;
var frameIndex = 0;
var frameDelay = 50;
var fadeDelay = 1500;
var maxReading = 3.5;

// compute color space

var colorScale = new chroma.ColorScale({
    colors: ['#00e000','#ffff00','#ff0000'],
    positions: [0,.07,1],
    mode: 'rgb'
});

// start up the data animation

animateData();

// load data and chain to self to animate

function animateData()
{
  var name = "fukushima-data/frame-" + pad(frameIndex, 5) + ".json";
  d3.json(name, displayData);
  setTimeout("animateData()", frameDelay);
  frameIndex = (frameIndex + 1) % (maxData + 1);
}

// put loaded data on the map

function displayData(data)
{
  var overlay = new google.maps.OverlayView();

  // Add the container when the overlay is added to the map.

  overlay.onAdd = function() 
  {
    var layer = d3.select(this.getPanes().overlayLayer)
      .append("div")
      .attr("class", "readings");

    // draw each marker as a separate SVG element

    overlay.draw = function() 
    {
      var projection = this.getProjection(),
          padding = 10;

      var marker = layer.selectAll("svg")
        .data(data)
        .each(transform) // update existing markers
        .enter()
        .append("svg:svg")
        .each(transform)
        .attr("class", "marker");

      // add a circle

      marker.append("svg:circle")
        .attr("r", 5)
        .attr("cx", padding)
        .attr("cy", padding)
        .attr("opacity", 0.3)
        .style("fill", function (d) {return colorScale.getColor(d.v / maxReading);})
        .transition()
        .duration(fadeDelay)
        .attr("opacity", 0);

      // transform lat long to screen coordinates

      function transform(d) 
      {
        d = new google.maps.LatLng(d.x, d.y);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
            .style("left", (d.x - padding) + "px")
            .style("top", (d.y - padding) + "px");
      }
    };
  };

  // be sure to remove readings when overlay is removed

  overlay.onRemove = function() 
  {
    d3.select(".readings").remove();
  };

  // add new layer

  overlay.setMap(map);

  // schedule to delete this layer when it has fadded out

  setTimeout(function() {overlay.setMap(null)}, fadeDelay);
}

// dear god, manual preceeding zeros

function pad(num, size) 
{
  var s = "000000000" + num;
  return s.substr(s.length-size);
}
