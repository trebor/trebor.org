// globals

var overlay = null;
var dataTesseract = null;
var dataByMag = null;
var dataByDate = null;
var projection = null;
var dateFormat = d3.time.format("%d %b %Y");
var timeFormat = d3.time.format("%H:%M:%S");
var quakeDateFormat = d3.time.format("%A, %B %e, %Y %H:%M:%S UTC");
var now = getUtcNow();
var lastWeek = new Date(now.getTime() - MILLISECONDS_INA_WEEK);
var timeScale = null;
var minDate = null;
var maxDate = null;
var limitEnabled = false;
var limitMinDate = null;
var limitMaxDate = null;
var limitMinMag = null;
var limitMaxMag = null;

// constants

var USE_TEST_DATA = false;
var CHECK_FOR_UPDATE = true;
var ANIMATE_INITIAL_LOAD = false;
var CHECK_FOR_UPDATE_SECONDS = 60;
var ANIMATION_FRAMES = 2 * 7;
var ANIMATION_DURATION = 10 * 1000;
var ANIMATION_DELAY = ANIMATION_DURATION / ANIMATION_FRAMES;
var MAX_MAGNITUDE = 9;
var SUMMARY_WIDTH = 240;
var SUMMARY_HEIGHT = 180;
var WEDGE_WIDTH = 30;
var DEFAULT_OPACITY = 0.55;
var QUAKE_BASE = "http://earthquake.usgs.gov/earthquakes/recenteqsus/Quakes/";
var QUAKE_TAIL = ".php";
var HOUR_OF_A_WEEK_PROPORTION = 1 / (7 * 24);
var DAY_OF_A_WEEK_PROPORTION = 1 / (7);
var EPSILON_PROPORTION = 1 / (7 * 24 * 60);
var MILLISECONDS_INA_SECOND = 1000;
var MILLISECONDS_INA_MINUTE = 60 * MILLISECONDS_INA_SECOND;
var MILLISECONDS_INA_HOUR = 60 * MILLISECONDS_INA_MINUTE;
var MILLISECONDS_INA_DAY = 24 * MILLISECONDS_INA_HOUR;
var MILLISECONDS_INA_WEEK = 7 * MILLISECONDS_INA_DAY;
var MARKER_STROKE_WIDTH = 8;
var MARKER_OFFSET = 40;
var MAX_OPACITY = 0.8;
var MIN_OPACITY = 0.1;
var KEY_WIDTH = 200;
var KEY_HEIGHT = 350;
var KEY_PADDING = 20;
var FADE_IN_DURATION = function (d) {return d.Magnitude * 300;};
var FADE_OUT_DURATION = function (d) {return d.Magnitude * 300;};

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
//  var dataSets = ["eqs7day-M5"];
//  var dataSets = ["eqs1hour-M0"];
    var dataSets = ["eqs1hour-M0", "eqs7day-M1"];

  // initialize tesseract

  dataTesseract = tesseract([]);

  // load data sets

  loadDataSets(dataSets);

  // if enabled, periodically check for updates

  if (CHECK_FOR_UPDATE)
    setTimeout(function() {loadDataSets(dataSets);}, CHECK_FOR_UPDATE_SECONDS * MILLISECONDS_INA_SECOND);
}

function loadDataSets(dataSets)
{
  // get quake data, the helper function must be recursive because the data is loaded asynchronously

  loadDataHelper(dataSets.slice());
}

function loadDataHelper(dataSets)
{
  // if no more data sets to load, register the data for display

  if (dataSets.length == 0)
  {
    dataByMag = dataTesseract.dimension(function(d) {return d.Magnitude;});
    dataByDate = dataTesseract.dimension(function(d) {return d.date;});
    registerQuakeData();
    return;
  }

  // load data set

  d3.csv("/quake?test=" + USE_TEST_DATA + "&name=" + dataSets.pop() + ".txt", 
         function(data)
         {
           // compute magnitude radius and date for each quake
           
           for (var i in data)
           {
             var d = data[i];
             d.radius = computeMarkerRadius(d.Magnitude) + MARKER_STROKE_WIDTH / 2;
             d.date = quakeDateFormat.parse(d.Datetime);
             if (d.radius < 0)
               console.log(d);
           }
           
           // add fresh data to tesseract
           
           dataTesseract.add(data);

           // recurse

           loadDataHelper(dataSets);
         });
}

function registerQuakeData()
{
  // remove dupes

//   var quakeIds = {};
//   data = data.filter(
//     function (d)
//     {
//       var found = quakeIds[d.Eqid];
//       if (found)
//         return false;

//       quakeIds[d.Eqid] = true;
//       return true;
//     });

  // update global time info

  now = getUtcNow();
  lastWeek = new Date(now.getTime() - MILLISECONDS_INA_WEEK);
  timeScale = d3.time.scale.utc().domain([now, lastWeek]).range([MAX_OPACITY, MIN_OPACITY]);

  // establish size, date and date ranges

  var dateData = dataByDate.top(Infinity);
  minDate = dateData[0].date;
  maxDate = dateData[dateData.length - 1].date;

  console.log("min", minDate);
  console.log("max", maxDate);

  // if firts time, animate in the quakes

  if (ANIMATE_INITIAL_LOAD && isFirstRender())
  {
    var animateTimeScale = d3.time.scale().domain([maxDate, minDate]).range([ANIMATION_FRAMES - 1, 0]);
    animate(0, animateTimeScale, data);
  }

  // otherwise just update the data
  
 else
    updateDisplayedData();
}

// animate in the data

function animate(frame, animateTimeScale, data)
{
  if (frame >= ANIMATION_FRAMES)
    return;
    
  var acceptDate = animateTimeScale.invert(frame);
//   updateDisplayedData(data.filter(
//       function (d)
//       {
//         return d.date.getTime() <= acceptDate.getTime();
//       }));
    
    // if overlya has not been initialize, do that
    
  setTimeout(function() {animate(frame + 1, animateTimeScale, data);}, ANIMATION_DELAY);
}

// update display

function updateDisplayedData()
{
  if (isFirstRender())
  {
    initializeOverlay();
    constructKey();
  }
    
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
        .data(dataByMag.top(Infinity), function(d) {return d.Eqid;})

      // update existing markers

        .each(function(d) {projectOntoMap(this, d, projection, -d.radius, -d.radius);});

      var enters = updates.enter()
        .append("svg:svg")
        .attr("class", "quakeBox")
        .style("width",  function(d) {return 2 * d.radius + "px";})
        .style("height", function(d) {return 2 * d.radius + "px";})
        .style("visibility", "hidden")
        .on("mouseover", function(d) {mouseoverQuake(d, proParent);})
        .on("mouseout", function(d) {mouseoutQuake(d, proParent);})
        .each(function(d) {projectOntoMap(this, d, projection, -d.radius, -d.radius);});

      // add the one and only marker for this svg

      enters
        .append("svg:circle")
        .attr("cx", function(d) {return d.radius;})
        .attr("cy", function(d) {return d.radius;})
        .each(function(d) {styleMaker(d, this, true);});

      // remove the exits

      updates.exit()
        .transition()
        .duration(FADE_OUT_DURATION)
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
    .attr("class", "markerShape")
    .attr("opacity", function(d) {return timeScale(quake.date);});

  if (animate)
  {
    marker
      .attr("r", 0)
      .transition()
      .duration(FADE_IN_DURATION)
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
               tCell({id: "magnitudeText"}, quake.Magnitude) +
               tCell({},
                     table({id: "timeTable"}, 
                           tRow({},
                                tCell({id: "date"}, dateFormat(quake.date))) + 
                           tRow({}, 
                                tCell({id: "time"}, timeFormat(quake.date) + span({class: "label"}, "UTC"))))
                    )
              ) +
          tRow({},
               tCell({id: "region", colspan: 2}, capitaliseFirstLetter(quake.Region))) +
          tRow({}, 
               tCell({colspan: 2},
                     table({id: "summarySubtable"},
                           tRow({},
                                tCell({class: "label"}, "id") +
                                tCell({class: "value"}, quake.Eqid) +
                                tCell({class: "label"}, "sourc") +
                                tCell({class: "value"}, quake.Src.toUpperCase())) +
                           tRow({},
                                tCell({class: "label"}, "lat") +
                                tCell({class: "value"}, quake.Lat) +
                                tCell({class: "label"}, "lon") +
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
  addQuakeDtail(quake, map);
}


function mouseoutQuake(quake, map)
{
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

  var keyDiv = document.createElement("div");
  keyDiv.id = "keyDiv";
  keyDiv.style.width =  KEY_WIDTH + "px";
  keyDiv.style.height = KEY_HEIGHT + "px";
  keyDiv.style.padding = KEY_PADDING + "px";

  // attach key to map

  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(keyDiv);

  // add inner div

  var innerDiv = d3.select(keyDiv)
    .append("div")
    .attr("id", "keyInner");

  // add header area

  var headerDiv = innerDiv
    .append("div")
    .attr("id", "keyHeader")
    .html(keyHeaderHtml);

  // add quake chart area

  var chartDiv = innerDiv
    .append("div")
    .attr("id", "chartDiv");
  
  var chartSvg = chartDiv
    .append("svg:svg")
    .attr("id", "chartSvg");

  createQuakeChart(chartSvg);

  // add detail area

  var detailDiv = innerDiv
    .append("div")
    .attr("id", "detailDiv");

  var detailSvg = detailDiv
    .append("svg:svg")
    .attr("id", "detailSvg");

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

  var sizeMarkers = detailSvg.selectAll("g.magnitude")
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

  detailSvg.append("svg:rect")
    .attr("x", "0%")
    .attr("y", headerPercent + "%")
    .attr("width", "50%")
    .attr("height", (100 - headerPercent) + "%")
    .style("fill", "white");

  // add the age quakes

  var ageMarkers = detailSvg.selectAll("g.age")
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

function createQuakeChart(svg)
{
  var tickTimeFormat = d3.time.format("%d %b");
  var m = {top: 10, left: 20, bottom: 20, right: 10};
  var w = (200 * 1.0) - m.left - m.right;
  var h = (350 * 0.5) - m.top - m.bottom;
  
  var x = d3.time.scale.utc().domain([lastWeek, now]).range([0, w]);
  var y = d3.scale.linear().domain([0, MAX_MAGNITUDE]).range([h, 0]);

  // frame to attach axes too

  var frame = svg
    .append("g")
    .attr("transform", "translate(" + m.left + "," + m.top + ")");

  // x-axis

  frame.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + h + ")")
    .call(d3.svg.axis().scale(x).tickSubdivide(1)
          .tickSize(5, 3, 0).ticks(d3.time.days, 2)
          .tickFormat(tickTimeFormat).orient("bottom"));

  // y-axis

  frame.append("g")
    .attr("class", "y axis")
    .call(d3.svg.axis().scale(y).orient("left"));

  // data circles
  
  var circle = svg.selectAll("circle")
    .data(dataByMag.top(Infinity))
    .enter()
    .append("circle")
    .attr("class", "chartQuakes")
    .attr("transform", function(d) { return "translate(" + (x(d.date) + m.left) + "," + (y(d.Magnitude) + m.top) + ")"; })
    .attr("r", 2);

  // brush
  
  frame.append("g")
    .attr("class", "brush")
    .call(d3.svg.brush().x(x).y(y)
          .on("brushstart", brushstart)
          .on("brush", brush)
          .on("brushend", brushend));
  
  // prush functions

  function brushstart()
  {
    svg.classed("selecting", true);
  }
  
  function brush() 
  {
    var e = d3.event.target.extent();
    var minDate = e[0][0];
    var maxDate = e[1][0];
    var minMag = e[0][1];
    var maxMag = e[1][1];

    function select(d)
    {
      return minDate <= d.date && d.date <= maxDate
        && minMag <= d.Magnitude && d.Magnitude <= maxMag;
    };

    circle.classed("unselected", function(d) {return !select(d);});
  }
  
  function brushend() 
  {
    var e = d3.event.target.extent();

    if (d3.event.target.empty())
    {
      circle.classed("unselected", false);
      dataByMag.filter(null);
      dataByDate.filter(null);
      updateDisplayedData();
    }
    else
    {
      dataByMag.filter([e[0][1],e[1][1]]);
      dataByDate.filter([e[0][0],e[1][0]]);
      updateDisplayedData();
    }


    svg.classed("selecting", !d3.event.target.empty());
  }
}

function keyHeaderHtml()
{
  var result = table(
    {id: "keyHeaderTable"},
    tRow({}, 
         tCell({colspan: 2}, "Earthquakes")
        ) +
     tRow({}, 
          tCell({class: "label"}, "first") + 
          tCell({class: "value"}, timeAgo(minDate))
         ) +
     tRow({}, 
          tCell({class: "label"}, "last") + 
          tCell({class: "value"}, timeAgo(maxDate))
         )
  );

  return result;
}

function timeAgo(date)
{
  var now = getUtcNow();

  var delta = now.getTime() - date.getTime();
  var bigUnit = establishTimeUnit(delta);

  var deltaRemainder = delta % bigUnit.divisor;
  var smallUnit = establishTimeUnit(deltaRemainder);

  return Math.floor(delta / bigUnit.divisor) + " " + bigUnit.short + " " + 
    Math.floor(deltaRemainder / smallUnit.divisor) + " " + smallUnit.short;
}

function establishTimeUnit(milliseconds)
{
  var units = [
    {threshold: MILLISECONDS_INA_MINUTE, divisor: MILLISECONDS_INA_SECOND, unit: "seconds", short: "sec"},
    {threshold: MILLISECONDS_INA_HOUR, divisor: MILLISECONDS_INA_MINUTE, unit: "minutes", short: "min"},
    {threshold: MILLISECONDS_INA_DAY, divisor: MILLISECONDS_INA_HOUR, unit: "hours", short: "hrs"},
    {threshold: MILLISECONDS_INA_WEEK, divisor: MILLISECONDS_INA_DAY, unit: "days", short: "day"},
  ];

  for (var i in units)
    if (milliseconds < units[i].threshold)
      return units[i];

  return units[units.length - 1];
}


function getUtcNow()
{
  var now = new Date();
  return new Date(
    now.getUTCFullYear(), now.
    getUTCMonth(), 
    now.getUTCDate(),  
    now.getUTCHours(), 
    now.getUTCMinutes(), 
    now.getUTCSeconds());
}

function capitaliseFirstLetter(string)
{
  return string.charAt(0).toUpperCase() + string.slice(1);
}

