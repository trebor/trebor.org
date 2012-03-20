// globals

var overlay = null;
var theData = null;
var projection = null;
var dateFormat = d3.time.format("%d %b %Y");
var timeFormat = d3.time.format("%H:%M:%S");
var quakeDateFormat = d3.time.format("%A, %B %e, %Y %H:%M:%S UTC");

// constants

var MAX_MAGNITUDE = 10;
var SUMMARY_WIDTH = 250;
var SUMMARY_HEIGHT = 100;
var WEDGE_WIDTH = 30;
var MARKER_STROKE = 2;
var DEFAULT_OPACITY = 0.55;
var HOUR_OF_A_WEEK_PROPORTION = 1 / (7 * 24);
var DAY_OF_A_WEEK_PROPORTION = 1 / (7);
var EPSILON_PROPORTION = 1 / (7 * 24 * 60);
var MILLISECONDS_INA_WEEK = 7 * 24 * 60 * 60 * 1000;
var MARKER_COLOR = "#63a";
var MARKER_EDGE_COLOR = "#85c"; 
var MARKER_OFFSET = 40;

// google map style

var mapStyle = 
[ 
  { featureType: "poi.park", elementType: "geometry", stylers: [ { gamma: 1 }, { lightness: 50 }, { saturation: -45 } ] },
  { featureType: "water", elementType: "geometry", stylers: [ { saturation: -25 }, { lightness: 50 } ] },
  { featureType: "road", stylers: [ { visibility: "on" }, { saturation: -70 }, { lightness: 40 } ] },
  { featureType: "administrative", stylers: [ { saturation: -100 }, { lightness: 20 } ] },
  { elementType: "labels", stylers: [ { lightness: 52 }, { saturation: -80 } ] } 
];

// google map

var map = new google.maps.Map(d3.select("#map").node(),
{
  zoom: 2,
  center: new google.maps.LatLng(20.8255, -156.9199),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  styles: mapStyle,
});

// usgs colors

var usgsMarkerColorScale = new chroma.ColorScale(
  {
    colors: ['red','#f00','#00f','#00f','#ff0', '#ff0'],
    positions: [0,HOUR_OF_A_WEEK_PROPORTION-EPSILON_PROPORTION,HOUR_OF_A_WEEK_PROPORTION,DAY_OF_A_WEEK_PROPORTION,DAY_OF_A_WEEK_PROPORTION+EPSILON_PROPORTION, 1],
    mode: 'rgb'
  });

// marker edge color scale (based on age)

var usgsMarkerEdgeColorScale = new chroma.ColorScale(
  {
    colors: ['#a00','#a00','#00a','#00a','#aa0', '#aa0'],
    positions: [0,HOUR_OF_A_WEEK_PROPORTION-EPSILON_PROPORTION,HOUR_OF_A_WEEK_PROPORTION,DAY_OF_A_WEEK_PROPORTION,DAY_OF_A_WEEK_PROPORTION+EPSILON_PROPORTION, 1],
    mode: 'rgb'
  });

var treborMarkerColorScale = new chroma.ColorScale({
  colors: ['#ff0', '#f00','#888'],
  positions: [0,HOUR_OF_A_WEEK_PROPORTION,1],
  mode: 'rgb'
});

// marker edge color scale (based on age)

var treborMarkerEdgeColorScale = new chroma.ColorScale({
  colors: ['#aa0','#a00', '#666'],
  positions: [0,HOUR_OF_A_WEEK_PROPORTION,1],
  mode: 'rgb'
});

var jbMarkerColorScale = new chroma.ColorScale({
  colors: ['#00f', '#aaa'],
//  positions: [0,HOUR_OF_A_WEEK_PROPORTION,1],
  mode: 'rgb'
});

// marker edge color scale (based on age)

var jbMarkerEdgeColorScale = new chroma.ColorScale({
  colors: ['#00f', '#aaa'],
//  positions: [0,HOUR_OF_A_WEEK_PROPORTION,1],
  mode: 'rgb'
});

// marker color scale (based on age)

//var markerColorScale = usgsMarkerColorScale;
//var markerColorScale = treborMarkerColorScale;
var markerColorScale = jbMarkerColorScale;

// marker edge color scale (based on age)

//var markerEdgeColorScale = usgsMarkerEdgeColorScale;
var markerEdgeColorScale = jbMarkerEdgeColorScale;

// construct the color scale

//constructScale();

// initialize data

initialize();

// have a look at the radius computation

function initialize()
{
//  var dataSources = ["eqs7day-M5"];
//  var dataSources = ["eqs1hour-M0"];
var dataSources = ["eqs1hour-M0", "eqs7day-M1"];
//  var dataSources = ["eqs1hour-M0", "eqs7day-M1", "eqs7day-M2.5"];

  getAllQuakeData(dataSources);
  setTimeout("initialize()", 5 * 1000);
}

function getAllQuakeData(sources, data)
{
  data = typeof data !== 'undefined' ? data : [];

  // base case if we've got all the data, hand it off for processing

  if (sources.length == 0)
  {
    displayQuakeData(data);
    return;
  }

  // recurse

  d3.csv("/quake?&name=" + sources.pop() + ".txt", 
         function(d)
         {
           getAllQuakeData(sources, data.concat(d));
         });
}

function displayQuakeData(data)
{
  // remove dupes

  var quakeIds = {};
  data = data.filter(
    function (d)
    {
      var found = quakeIds[d.Eqid];
      if (found)
        return false;

      quakeIds[d.Eqid] = true;
      return true;
    });

  // sort the smallest quakes to the top of the view

  data.sort(function (a, b)
  {
    if (a.Magnitude < b.Magnitude)
      return 1;
    if (a.Magnitude > b.Magnitude)
      return -1;
    return 0;
  });

  var minDate = null;
  var maxDate = null;

  // establish size, date and date ranges

  for (var i = 0; i < data.length; ++i)
  {
    var d = data[i];
    d.radius = computeMarkerRadius(d.Magnitude) + MARKER_STROKE / 2;
    d.date = quakeDateFormat.parse(d.Datetime);

    if (!minDate || minDate.getTime() > d.date.getTime())
      minDate = d.date;

    if (!maxDate || maxDate.getTime() < d.date.getTime())
      maxDate = d.date;
  }

  var now = new Date();
  var lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  timeScale = d3.time.scale().domain([now, lastWeek]).range([0.2,1]);

  for (var i = 0; i < data.length; ++i)
    data[i].age = timeScale(data[i].date);

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
    // create the div to put this all in

    var layer = d3.select(this.getPanes().overlayMouseTarget)
      .append("div")
      .attr("class", "markers");

    // draw each marker as a separate svg element

    overlay.draw = function() 
    {
      var proParent = this;
      projection = this.getProjection();

      // create svg to put marker in

      var updates = layer.selectAll("svg.quakeBox")
        .data(theData, function(d) {return d.Eqid;})

      // update existing markers

        .each(function(d) {projectOntoMap(this, d, projection, -d.radius, -d.radius);});

      var enters = updates.enter()
        .append("svg:svg")
        .attr("class", "quakeBox")
        .style("width",  function(d) {return 2 * d.radius + "px";})
        .style("height", function(d) {return 2 * d.radius + "px";})
//      .style("background", "blue")
        .style("visibility", "hidden")
          .on("mouseover", function(d) {mouseoverQuake(d, proParent);})
        .on("mouseout", function(d) {mouseoutQuake(d, proParent);})
        .each(function(d) {projectOntoMap(this, d, projection, -d.radius, -d.radius);});

      // add the one and only marker for this svg

      enters
        .append("svg:circle")
        .attr("r", 0)
        .style("visibility", "visible")
        .attr("cx", function(d) {return d.radius;})
        .attr("cy", function(d) {return d.radius;})
//        .attr("opacity", DEFAULT_OPACITY)
        .attr("opacity", function(d) {return d.age;})
        .style("fill", MARKER_COLOR)
        .style("stroke", MARKER_EDGE_COLOR)
//          .style("fill", function (d) {return markerColorScale.getColor(d.age);})
//          .style("stroke", function (d) {return markerEdgeColorScale.getColor(d.age);})
//      .style("fill", function (d) {return markerColorScale.getColor(d.Magnitude / MAX_MAGNITUDE);})
        .transition()
        .duration(function(d) {return 500 * d.Magnitude})
        .attr("r", function(d) {return d.radius - MARKER_STROKE / 2;});

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

// projectOntoMap lat long to screen coordinates

function projectOntoMap(svg, d, projection, xOffset, yOffset) 
{
  d = new google.maps.LatLng(d.Lat, d.Lon);
  d = projection.fromLatLngToDivPixel(d);
  return d3.select(svg)
    .style("left", d.x + xOffset + "px")
    .style("top" , d.y + yOffset + "px");
}
    
var QUAKE_BASE = "http://earthquake.usgs.gov/earthquakes/recenteqsus/Quakes/";
var QUAKE_TAIL = ".php";

// construct html to go into summary text

function constructSummaryHtml(quake)
{
  var title = quake.Magnitude + " " + quake.Region;
  var link = QUAKE_BASE + quake.Src + quake.Eqid + QUAKE_TAIL;
  var newline = "<br />";
  var nbs = "&nbsp;";

  var result = 
    table([["id", "summary"]],
      tRow([],
        tCell([["id", "mag"], ["rowspan", "2"]], htmlA([["id", "magtext"]], quake.Magnitude, link)) + 
        tCell([["rowspan", "2"], ["width", "7%"]],
          svg([["id", "magtag"], ["width", "50em"]],
          text([["x", "-2.85em"], ["y", ".8em"], ["transform", "rotate(-90)"]], "MAG"))) +
          tCell([["id", "date"]], dateFormat(quake.date))) +
      tRow([],
        tCell([["id", "time"]], timeFormat(quake.date))) +
      tRow([["height", "40%"]], 
        tCell([["id", "region"], ["colspan", "3"]], capitaliseFirstLetter(quake.Region))));

  return result;
}

function table(attributes, text) {return html("table", attributes, text);}
function tRow(attributes, text) {return html("tr", attributes, text);}
function tCell(attributes, text) {return html("td", attributes, text);}
function div(attributes, text) {return html("div", attributes, text);}
function span(attributes, text) {return html("span", attributes, text);}
function text(attributes, text) {return html("text", attributes, text);}
function htmlA(attributes, text, link)
{
  attributes = typeof attributes !== 'undefined' ? attributes : [];
  attributes = attributes.concat([["href", link]]);
  return html("a", attributes, text);
}

function svg( attributes, content)
{
  attributes = typeof attributes !== 'undefined' ? attributes : [];
  attributes = attributes.concat([["xmlns", "http://www.w3.org/2000/svg"]]);
  return html("svg", attributes, content);
}

function html(tag, attributes, content)
{
  attributes = typeof attributes !== 'undefined' ? attributes : [];

  var result = [];
  result.push('<' + tag);
  for (i in attributes)
    result.push(' ' + attributes[i][0] + '="' + attributes[i][1] + '"');
  result.push('>' + content + '</' + tag + '>');
  return result.join('');
}

function mouseoverQuake(quake, map)
{
  highlightQuake(quake, true);
  addQuakeDtail(quake, map);
}


function mouseoutQuake(quake, map)
{
  highlightQuake(quake, false);
  removeQuakeDtail(quake, map);
}

function addQuakeDtail(quake, map)
{
  // create quake detail window

  var quakeDetail = d3.select(".markers")
    .append("svg:svg")
    .attr("class", "quakeDetail")
    .each(function(d) {projectOntoMap(this, quake, map.getProjection(), 0, 0);})
    .style("width", SUMMARY_WIDTH  + MARKER_OFFSET * 2 + "px")
    .style("height",SUMMARY_HEIGHT + MARKER_OFFSET * 2 + "px")
    .on("mouseover", function(d) {mouseoverQuake(quake, map);})
    .on("mouseout", function(d) {mouseoutQuake(quake, map);})
  //    .style("background", "green");
    .style("visibility", "hidden");

  // add line
  
  quakeDetail
    .append("svg:path")
    .attr("class", "quakeDetailLine")
    .style("visibility", "visible")
    .attr("d", function() {return quakeDetailLine(quake);});

//   // add html

  quakeDetail
    .append("svg:foreignObject")
    .style("visibility", "visible")
    .attr("class", "summaryTextObject")
    .attr("width",  SUMMARY_WIDTH + "px")
    .attr("height", SUMMARY_HEIGHT + "px")
    .attr("x", MARKER_OFFSET)
    .attr("y", MARKER_OFFSET - WEDGE_WIDTH)
    .append("xhtml:body")
    .attr("class", "quakeDetailText")
    .html(function() {return constructSummaryHtml(quake);});
}

function removeQuakeDtail(quake, map)
{
  d3.select(".quakeDetail")
    .remove();
}

// highlight selected quake

function highlightQuake(quake, enable)
{
  d3.selectAll("circle")
    .filter(function (d) {return d == quake;})
//    .attr("opacity", function() {return enable ? 1.0 : DEFAULT_OPACITY;})
    .style("stroke", function() 
           {
             return enable ? "black" : MARKER_EDGE_COLOR;
//             return enable ? "black" : markerEdgeColorScale.getColor(quake.age);
           });
}


// return path for line to quake detail text

function quakeDetailLine(quake)
{
  var path = 
    " m 0 0" +
    " l " + MARKER_OFFSET + " " + MARKER_OFFSET +
    " v " + -WEDGE_WIDTH +
    " h " + (SUMMARY_WIDTH) + 
    " v " + SUMMARY_HEIGHT +
    " h " + -SUMMARY_WIDTH + 
    " v " + -(SUMMARY_HEIGHT - 2 * WEDGE_WIDTH) + 
    " z";

//  console.log("path", path);
  return path;
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
    var error = 10 - ratio;
    console.log("mag:", i, "rad:", rad, "area:", area, "ratio", ratio, "error", error);
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
      .style("background", function (d) {return markerColorScale.getColor(val);})
      .style("width", "100%")
      .style("height", "2em")
      .style("line-height", "2em")
      .style("text-align", "center")
      .text(valStr);
  }
}

function capitaliseFirstLetter(string)
{
  return string.charAt(0).toUpperCase() + string.slice(1);
}

