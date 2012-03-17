// google map

var mapStyle = 
[ 
  { featureType: "poi.park", elementType: "geometry", stylers: [ { gamma: 1 }, { lightness: 50 }, { saturation: -45 } ] },
  { featureType: "water", elementType: "geometry", stylers: [ { saturation: -25 }, { lightness: 50 } ] },
  { featureType: "road", stylers: [ { visibility: "on" }, { saturation: -70 }, { lightness: 40 } ] },
  { featureType: "administrative", stylers: [ { saturation: -100 }, { lightness: 20 } ] },
  { elementType: "labels", stylers: [ { lightness: 52 }, { saturation: -80 } ] } 
];

var map = new google.maps.Map(d3.select("#map").node(),
{
  zoom: 2,
  center: new google.maps.LatLng(20.8255, -156.9199),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  styles: mapStyle,
});

// compute color space

var colorScale = new chroma.ColorScale({
  colors: ['#00ff00','#0000ff','#ffff00','#ff0000'],
//    positions: [0,.07,1],
    mode: 'rgb'
});

// other globals

var overlay = null;
var theData = null;

// constants

var MAX_MAGNITUDE = 10;
var SUMMARY_WIDTH = 200;
var SUMMARY_HEIGHT = 100;

// construct the color scale

//constructScale();

// initialize data

initialize();

// have a look at the radius computation

function initialize()
{
  d3.csv("/quake?test=true", setData);
//  d3.csv("/quake?test=true&name=data1.csv", setData);
  setTimeout("change()", 3000);
}

function change()
{
  d3.csv("/quake?test=false", setData);
//  d3.csv("/quake?test=true&name=data2.csv", setData);
}

function setData(data)
{
  // sort the smallest quakes to the top of the view

  data.sort(function (a, b)
  {
    if (a.Magnitude < b.Magnitude)
      return 1;
    if (a.Magnitude > b.Magnitude)
      return -1;
    return 0;
  });

  var quakeDateFormat = d3.time.format("%A, %B %e, %Y %H:%M:%S UTC");
  var minDate = null;
  var maxDate = null;

  // establish size, date and date ranges

  for (var i = 0; i < data.length; ++i)
  {
    var d = data[i];
    d.size = computeMarkerRadius(d.Magnitude);
    d.date = quakeDateFormat.parse(d.Datetime);

    if (!minDate || minDate.getTime() > d.date.getTime())
      minDate = d.date;

    if (!maxDate || maxDate.getTime() < d.date.getTime())
      maxDate = d.date;
  }

  // establish age

  var ageRange = maxDate.getTime() - minDate.getTime();

  for (var i = 0; i < data.length; ++i)
  {
    var d = data[i];
    d.age = (d.date.getTime() - minDate.getTime()) / ageRange;
  }

  // set the global data

  theData = data;

  // if overlya has not been initialize, do that

  if (overlay == null)
    initializeOverlay();

  // otherwise redraw the overlay

  else
    overlay.draw();
}

// put loaded data on the map

function initializeOverlay()
{
  // create the overlay

  overlay = new google.maps.OverlayView();

  // Add the container when the overlay is added to the map.

  overlay.onAdd = function() 
  {
    // create date format for parsing
    // example: Friday, March  9, 2012 14:29:10 UTC

    // create the div to put this all in

    var layer = d3.select(this.getPanes().overlayMouseTarget)
      .append("div")
      .attr("class", "markers");

    // draw each marker as a separate SVG element

    overlay.draw = function() 
    {
      var projection = this.getProjection(),
          padding = 30;

      // create svg

      var updates = layer.selectAll("svg")
        .data(theData, function(d) {return d.Eqid;})
        .on("mouseover", mouseoverQuake)
        .on("mouseout", mouseoutQuake)
        .each(transform); // update existing markers

      var enters = updates.enter()
        .append("svg:svg")
        .on("mouseover", mouseoverQuake)
        .on("mouseout", mouseoutQuake)
        .each(transform);

      // add the one and only marker for this svg

      enters
        .append("svg:circle")
        .attr("r", 0)
//         .on("mouseover", mouseoverQuake)
//         .on("mouseout", mouseoutQuake)
        .style("visibility", "visible")
        .attr("cx", function(d) {return d.size;})
        .attr("cy", function(d) {return d.size;})
        .attr("opacity", 0.6)
//        .attr("opacity", function(d) {return d.age;})
//      .style("fill", function (d) {return colorScale.getColor(d.Magnitude / MAX_MAGNITUDE);})
        .transition()
        .duration(function(d) {return 500 * d.Magnitude})
        .attr("r", function(d) {return d.size - 1;});

      // add summary text
      
      enters
        .append("svg:foreignObject")
        .attr("class", "summaryTextObject")
        .attr("x", function(d) {return d.size;})
        .attr("y", function(d) {return d.size;})
        .style("visibility", "hidden")
        .attr("width",  SUMMARY_WIDTH + "px")
        .attr("height", SUMMARY_HEIGHT + "px")
        .append("xhtml:body")
        .style("visibility", "hidden")
        .attr("class", "summaryText")
        .html(constructSummaryHtml);

      // remove the exits

      updates.exit()
        .transition()
        .duration(function(d) {return 500 * d.Magnitude})
        .remove();

      updates.exit().selectAll("circle")
        .transition()
        .duration(function(d) {return 500 * d.Magnitude})
        .attr("r", 0)
        .remove();

      // transform lat long to screen coordinates

      function transform(d) 
      {
        var size = d.size;
        d = new google.maps.LatLng(d.Lat, d.Lon);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
          .style("visibility", "hidden")
//          .style("background", "blue")
          .style("left", d.x - size + "px")
          .style("top", d.y - size + "px")
          .style("width", size + SUMMARY_WIDTH + "px")
          .style("height", size + SUMMARY_HEIGHT + "px");
      }
    };
  };

  // be sure to remove markers when overlay is removed

  overlay.onRemove = function() 
  {
    d3.select(".markers").remove();
  };

  // add new layer

  overlay.setMap(map);
}

var QUAKE_BASE = "http://earthquake.usgs.gov/earthquakes/recenteqsus/Quakes/";
var QUAKE_TAIL = ".php";

// construct html to go into summary text

function constructSummaryHtml(quake)
{
  var title = quake.Magnitude + " " + quake.Region;
  var link = QUAKE_BASE + quake.Src + quake.Eqid + QUAKE_TAIL;
  var newline = "<br />";

  result = 
    "<a href=\"" + link + "\">" + title + "</a>" + newline + 
    quake.Datetime;

  return result;
}

function mouseoverQuake(quake, index)
{
//   console.log("mouseoverQuake", quake);

  d3.selectAll(".summaryText")
    .filter(function (d) {return d.Eqid == quake.Eqid;})
    .style("visibility", "visible");
}

function mouseoutQuake(quake, index)
{
  console.log("mouseoutQuake", quake);

  d3
    .selectAll(".summaryText")
    .filter(function (d) {return d.Eqid == quake.Eqid;})
    .style("visibility", "hidden");
}

// compute the radiuse from a magnitude 

function computeMarkerRadius(magnitude)
{
  // compute the ideal area (10^magnitude)

  var area = Math.pow(10, magnitude);

  // establish the radius which will produce that visual area

  var radius = Math.sqrt(area / Math.PI);

  // scale down the radius (add error) so markes fit on screen
  // note: error increased with magnitude

  return 2.5 + radius / (1 - 1/(0.02 * (magnitude - MAX_MAGNITUDE)));
}

function testRadiusComputation()
{
  console.log("-----------------");
  var prev = null;
  for (var i = 1; i < 11; ++i)
  {
    var rad = computeMarkerRadius(i);
    var area = Math.PI * rad * rad;
    var ratio = Math.round(area / (prev != null ? prev : area));
    console.log("mag:", i, "rad:", rad, "area:", area, "ratio", ratio);
    prev = area;
  }
}

// construct the reading scale

function constructScale()
{
  var max = 10;

  // create scale div and add to map

  var scaleDiv = document.createElement('DIV');
  scaleDiv.id = "scale";
  scaleDiv.style.width="3em";
  scaleDiv.style.height="0%";
  scaleDiv.style.padding="20px 40px";
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(scaleDiv);

  // add label

  var innerDiv = d3.select(scaleDiv)
    .append("div")
    .style("height", "0%")
    .style("width", "100%")
    .style("text-align", "center");

   innerDiv.append("a")
    .attr("href", "http://wikipedia.org/wiki/Richter_magnitude_scale")
    .text("mag");

  // add reading values

  for (var i = 0; i < max; ++i)
  {
    var val = i / max;
    var valStr = "" + Math.round(val * MAX_MAGNITUDE * 10) / 10;
    if (valStr.length == 1)
      valStr += ".0";

    innerDiv
      .append("div")
      .style("opacity", 0.8)
      .style("background", function (d) {return colorScale.getColor(val);})
      .style("width", "100%")
      .style("height", "2em")
      .style("line-height", "2em")
      .style("text-align", "center")
      .text(valStr);
  }
}
