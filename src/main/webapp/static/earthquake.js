// globals

var overlay = null;
var theData = null;
var projection = null;
var dateFormat = d3.time.format("%d %b %Y");
var timeFormat = d3.time.format("%H:%M:%S");
var quakeDateFormat = d3.time.format("%A, %B %e, %Y %H:%M:%S UTC");
var now = new Date();
var lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
var timeScale = null;

// constants

var USE_TEST_DATA = false;
var CHECK_FOR_UPDATE = true;
var ANIMATE_INITIAL_LOAD = false;
var CHECK_FOR_UPDATE_SECONDS = 60;
var ANIMATION_FRAMES = 2 * 7;
var ANIMATION_DURATION = 10 * 1000;
var ANIMATION_DELAY = ANIMATION_DURATION / ANIMATION_FRAMES;
var MAX_MAGNITUDE = 10;
var SUMMARY_WIDTH = 240;
var SUMMARY_HEIGHT = 144;
var WEDGE_WIDTH = 30;
var DEFAULT_OPACITY = 0.55;
var QUAKE_BASE = "http://earthquake.usgs.gov/earthquakes/recenteqsus/Quakes/";
var QUAKE_TAIL = ".php";
var HOUR_OF_A_WEEK_PROPORTION = 1 / (7 * 24);
var DAY_OF_A_WEEK_PROPORTION = 1 / (7);
var EPSILON_PROPORTION = 1 / (7 * 24 * 60);
var MILLISECONDS_INA_DAY = 24 * 60 * 60 * 1000;
var MILLISECONDS_INA_WEEK = 7 * MILLISECONDS_INA_DAY;
var MARKER_STROKE_WIDTH = 1;
var MARKER_COLOR = "#63a";
var MARKER_EDGE_COLOR = "#85c"; 
var MARKER_HIGHLIGHT_EDGE_COLOR = "white"; 
var MARKER_OFFSET = 40;
var MAX_OPACITY = 0.8;
var MIN_OPACITY = 0.1;

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

// initialize data

initialize();

// have a look at the radius computation

function initialize()
{
  // update time scale

  now = new Date();
  lastWeek = new Date(now.getTime() - MILLISECONDS_INA_WEEK);
  timeScale = d3.time.scale().domain([now, lastWeek]).range([MAX_OPACITY, MIN_OPACITY]);

  // construct the key

  if (isFirstRender())
    constructKey();

//  var dataSources = ["eqs7day-M5"];
//  var dataSources = ["eqs1hour-M0"];
//  var dataSources = ["eqs1hour-M0", "eqs7day-M1"];
//  var dataSources = ["eqs1hour-M0", "eqs7day-M1", "eqs7day-M2.5"];
  var dataSources = ["eqs7day-M2.5"];

  getAllQuakeData(dataSources);

  // if enabled, periodically check for updates

  if (CHECK_FOR_UPDATE)
    setTimeout("initialize()", CHECK_FOR_UPDATE_SECONDS * 1000);
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

  d3.csv("/quake?test=" + USE_TEST_DATA + "&name=" + sources.pop() + ".txt", 
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
    d.radius = computeMarkerRadius(d.Magnitude) + MARKER_STROKE_WIDTH / 2;
    d.date = quakeDateFormat.parse(d.Datetime);

    if (!minDate || minDate.getTime() > d.date.getTime())
      minDate = d.date;

    if (!maxDate || maxDate.getTime() < d.date.getTime())
      maxDate = d.date;
  }

  // establish opacity

  for (var i = 0; i < data.length; ++i)
    data[i].opacity = timeScale(data[i].date);

  // if firts time, animate in the quakes

  if (ANIMATE_INITIAL_LOAD && isFirstRender())
  {
    var animateTimeScale = d3.time.scale().domain([maxDate, minDate]).range([ANIMATION_FRAMES - 1, 0]);
    animate(0, animateTimeScale, data);
  }

  // otherwise just update the data
  
 else
    updateDisplayedData(data);
}

// animate in the data

function animate(frame, animateTimeScale, data)
{
  if (frame >= ANIMATION_FRAMES)
    return;
    
  var acceptDate = animateTimeScale.invert(frame);
  updateDisplayedData(data.filter(
      function (d)
      {
        return d.date.getTime() <= acceptDate.getTime();
      }));
    
    // if overlya has not been initialize, do that
    
  setTimeout(function() {animate(frame + 1, animateTimeScale, data);}, ANIMATION_DELAY);
}

// update display

function updateDisplayedData(data)
{
  theData = data;
  if (isFirstRender())
    initializeOverlay();
    
  // otherwise redraw the overlay
    
  else
    overlay.draw();
}

// test if this is the first rendering of the data

function isFirstRender()
{
  return overlay == null;
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
        .style("visibility", "visible")
        .attr("cx", function(d) {return d.radius;})
        .attr("cy", function(d) {return d.radius;})
        .each(function(d) {styleMaker(d, this, false);});

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

function styleMaker(quake, marker, animate)
{
  var marker = d3.select(marker);

  marker
    .attr("opacity", function(d) {return quake.opacity;})
    .style("stroke-width", MARKER_STROKE_WIDTH)
    .style("stroke", MARKER_EDGE_COLOR)
    .style("fill", MARKER_COLOR);

  if (animate)
  {
    marker
      .attr("r", 0)
      .transition()
      .duration(function(d) {return 500 * quake.Magnitude})
      .attr("r", function(d) {return quake.radius - MARKER_STROKE_WIDTH / 2;});
  }
  else
  {
    marker
      .attr("r", function(d) {return quake.radius - MARKER_STROKE_WIDTH / 2;});
  }

//          .style("fill", function (d) {return markerColorScale.getColor(d.opacity);})
//          .style("stroke", function (d) {return markerEdgeColorScale.getColor(d.opacity);})
//      .style("fill", function (d) {return markerColorScale.getColor(d.Magnitude / MAX_MAGNITUDE);})
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
    
// compute usgs quake detail url

function quakeUrl(quake)
{
  return QUAKE_BASE + quake.Src + quake.Eqid + QUAKE_TAIL;
}

// construct html to go into summary text

function constructSummaryHtml(quake)
{
  var result = 
    table({id: "summary"},
          tRow({},
               tCell({class: "label", rowspan: "2"}, "MAG") + 
               tCell({rowspan: "2"}, 
                     span({id: "magnitudeText", class: "value"}, quake.Magnitude)) + 
               tCell({id: "date", class: "value"}, dateFormat(quake.date))
              ) +
          tRow({},
               tCell({id: "time", class: "value"}, timeFormat(quake.date)) +
               tCell({class: "label"}, "UTC")
              ) +
          tRow({},
               tCell({id: "region", colspan: "4"}, 
                     capitaliseFirstLetter(quake.Region))) +
          tRow({}, 
               tCell({colspan: "4"},
                     table({id: "summarySubtable", width: "100%"},
                           tRow({},
                                tCell({class: "label"}, "ID") +
                                tCell({class: "value"}, quake.Eqid) +
                                tCell({class: "label"}, "SOURCE") +
                                tCell({class: "value"}, quake.Src.toUpperCase())) +
                           tRow({},
                                tCell({class: "label"}, "LAT") +
                                tCell({class: "value"}, quake.Lat) +
                                tCell({class: "label"}, "LON") +
                                tCell({class: "value"}, quake.Lon)))))
         );

  return result;
}

function table(attributes, text) {return html("table", attributes, text);}
function tRow(attributes, text) {return html("tr", attributes, text);}
function tCell(attributes, text) {return html("td", attributes, text);}
function div(attributes, text) {return html("div", attributes, text);}
function span(attributes, text) {return html("span", attributes, text);}
function text(attributes, text) {return html("text", attributes, text);}
function htmlImg(attributes, source, altText)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};
  attributes = mergeProperties({src: source, alt: altText}, attributes);
  return html("img", attributes, "");
}
function htmlA(attributes, text, link)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};
  attributes = mergeProperties({href: link}, attributes);
  return html("a", attributes, text);
}

function svg( attributes, content)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};
  attributes = mergeProperties({xmlns: "http://www.w3.org/2000/svg"}, attributes);
  return html("svg", attributes, content);
}

function html(tag, attributes, content)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};

  var result = [];
  result.push('<' + tag);
  for (var attribute in attributes)
    result.push(' ' + attribute + '="' + attributes[attribute] + '"');
  result.push('>' + content + '</' + tag + '>');
  return result.join('');
}

function mergeProperties(obj1,obj2)
{
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
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
    .style("stroke", function() 
      {
        return enable ? MARKER_HIGHLIGHT_EDGE_COLOR : MARKER_EDGE_COLOR;
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

function constructKey()
{
  var stockMagnitude = 5.2;
  var stockAge = 4;
  var examples = 7;
  var baseMagnitude = 1;
  var headerPercent = 20;
  var examplePercentStep = (100 - headerPercent) / (examples + 1);

  // create scale div and add to map

  var scaleDiv = document.createElement('DIV');
  scaleDiv.id = "scale";
  scaleDiv.style.width="15em";
  scaleDiv.style.height="35em";
  scaleDiv.style.padding="20px";
  scaleDiv.style.background = "red";

  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(scaleDiv);

  // add svg area to work in

  var svg = d3.select(scaleDiv)
    .append("svg:svg")
    .attr("class", "key")
    .style("height", "100%")
    .style("width", "100%")
    .style("background", "white")
    .style("text-align", "center");

  // create the magnitude quakes

  var sizeQuakes = [];
  for (var magnitude = 0; magnitude <= examples; ++magnitude)
  {
    var quake = new Object();
    var date = new Date(now.getTime() - stockAge * MILLISECONDS_INA_DAY);
    quake.opacity = timeScale(date);
    quake.Magnitude = baseMagnitude + magnitude;
    quake.radius = computeMarkerRadius(quake.Magnitude);
    quake.yPos = headerPercent + examplePercentStep * magnitude;
    sizeQuakes.push(quake);
  }

  // add the magnitude quakes

  var sizeMarkers = svg.selectAll("g.magnitude")
    .data(sizeQuakes)
    .enter()
    .append("svg:g")
    .attr("class", "magnitude");

  sizeMarkers
//     .filter(function (d) {return d.Magnitude <= 4;})
    .append("svg:circle")
    .attr("r", 0)
    .each(function(d) {styleMaker(d, this, false);})
    .attr("cx", "75%")
    .attr("cy", function (d) {return d.yPos + "%";});

//   sizeMarkers
//     .append("svg:circle")
//     .attr("r", 1.5)
//     .attr("cx", "75%")
//     .attr("cy", function (d) {return d.yPos + "%";});

  sizeMarkers
    .append("svg:text")
    .attr("x", "55%")
    .attr("y", function (d) {return d.yPos + "%";})
    .style("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(function(d) {return d.Magnitude;});

  sizeMarkers
    .append("svg:line")
    .attr("x1", "60%")
    .attr("y1", function (d) {return d.yPos + "%";})
    .attr("x2", "75%")
    .attr("y2", function (d) {return d.yPos + "%";});

//   var magicNumber = 6.65;
//   sizeMarkers
//     .filter(function (d) {return d.Magnitude > 4;})
//     .append("svg:line")
//     .attr("x1", "75%")
//     .attr("y1", function (d) {return d.yPos + "%";})
//     .attr("x2", function (d) {return (75 + 0.5 * d.radius / magicNumber) + "%";})
//     .attr("y2", function (d) {return (d.yPos - d.radius / magicNumber) + "%";});

//   sizeMarkers
//      .filter(function (d) {return d.Magnitude > 4;})
//     .append("svg:path")
//     .attr("transform", function(d) {return "translate(" +
//                                     (180) + ", " + 
//                                     (112 + 56.2 * (d.Magnitude - 1)) + ") rotate(9)";})
//     .attr("d", function (d) 
//           {
//             var r = d.radius;
//             var theta = -87 * Math.PI / 180;
//             var x2 = r * Math.cos(theta);
//             var y2 = r * Math.sin(theta);
//             return "m 0 0 v " + -r + "A " + r + " " + r + " 0 0 1 " + x2  + " " + y2 + " z";
//           });

  // create the age quakes

  var ageQuakes = [];
  for (var daysBack = 0; daysBack <= examples; ++daysBack)
  {
    var quake = new Object();
    var date = new Date(now.getTime() - daysBack * MILLISECONDS_INA_DAY);
    quake.daysBack = daysBack;
    quake.opacity = timeScale(date);
    quake.Magnitude = stockMagnitude;
    quake.radius = computeMarkerRadius(quake.Magnitude);
    quake.yPos = headerPercent + examplePercentStep * quake.daysBack;
    ageQuakes.push(quake);
  }

  // add rectangle to block out size marker

  svg
    .append("svg:rect")
    .attr("x", "0%")
    .attr("y", headerPercent + "%")
    .attr("width", "50%")
    .attr("height", (100 - headerPercent) + "%")
    .style("fill", "white");

  // add the age quakes

  var ageMarkers = svg.selectAll("g.age")
    .data(ageQuakes)
    .enter()
    .append("svg:g")
    .attr("class", "age");

  ageMarkers
    .append("svg:circle")
    .attr("r", 0)
    .each(function(d) {styleMaker(d, this, false);})
    .attr("cx", "25%")
    .attr("cy", function(d) {return d.yPos + "%";});

  ageMarkers
    .append("svg:text")
    .attr("x", "25%")
    .attr("y", function(d) {return d.yPos + "%";})
    .style("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(function(d) {return d.daysBack;});
}

function capitaliseFirstLetter(string)
{
  return string.charAt(0).toUpperCase() + string.slice(1);
}

