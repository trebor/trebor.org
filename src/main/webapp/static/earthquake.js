// constants

var HOUR_OF_A_WEEK_PROPORTION = 1 / (7 * 24);
var DAY_OF_A_WEEK_PROPORTION = 1 / (7);
var EPSILON_PROPORTION = 1 / (7 * 24 * 60);
var MILLISECONDS_INA_SECOND = 1000;
var MILLISECONDS_INA_MINUTE = 60 * MILLISECONDS_INA_SECOND;
var MILLISECONDS_INA_HOUR = 60 * MILLISECONDS_INA_MINUTE;
var MILLISECONDS_INA_DAY = 24 * MILLISECONDS_INA_HOUR;
var MILLISECONDS_INA_WEEK = 7 * MILLISECONDS_INA_DAY;

var ANIMATE_INITIAL_LOAD = false;
var USE_TEST_DATA = false;
var UI_UPDATE_MILLISECONDS = 10 * MILLISECONDS_INA_SECOND;
var REMOTE_DATA_UPDATE_MILLISECONDS = 60 * MILLISECONDS_INA_SECOND;

var HOUR_DATA_SETS = ["eqs1hour-M0"];
var DAY_DATA_SETS = ["eqs1day-M0"];
var WEEK_DATA_SETS = ["eqs7day-M1", "eqs1day-M0"];
var TEST_DATA_SETS = ["data1", "data2"];
var DATE_FORMAT = d3.time.format("%d %b %Y");
var TIME_FORMAT = d3.time.format("%H:%M:%S");
var ZONE_FORMAT = d3.time.format("%Z");
var QUAKE_DATE_FORMAT = d3.time.format.utc("%A, %B %e, %Y %H:%M:%S UTC");
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
var MARKER_STROKE_WIDTH = 8;
var MARKER_OFFSET = 40;
var MAX_OPACITY = 0.8;
var MIN_OPACITY = 0.2;
var KEY_WIDTH = 250;
var KEY_HEIGHT = 450;
var KEY_PADDING = 10;
var CHART_HEIGHT_PROPORTION = 0.44; // must match value in #chartDiv.height
var CHART_QUAKE_ROLLIN_MILLISECONDS = 2000;
var FADE_IN_DURATION = function (d) {return d.Magnitude * 500;};
var FADE_OUT_DURATION = function (d) {return d.Magnitude * 100;};

// globals

var quakeData = [];
var quakeTesseract = null;
var quakesByMag = null;
var quakesByDate = null;
var projection = null;
var dateWindowMax = null;
var dateWindowMin = null;
var observedMinMag = null;
var observedMaxMag = null;
var observedMinDate = null;
var observedMaxDate = null;
var timeScale = null;
var dateLimitScale = null;
var magLimitScale = null;
var dateWindowExtent = MILLISECONDS_INA_WEEK;
var dataSets = WEEK_DATA_SETS;
var timeScaleChanged = true;
var dataChanged = true;
var loadingData = 0;
var lastDataRefreshTime = null;
var nextDataRefreshTime = null;
var updateDisplayInternal = null;

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

// initialize the system, this is the main entry point for bulk of the code

initialize();

// initialize the sytems

function initialize()
{
  updateData();

  // update chaining function which calls itself to keep hope alive

  var updateChainFunction = function()
  {
    setTimeout(updateChainFunction, UI_UPDATE_MILLISECONDS);

    // if it is time to reload data, do so

    var now = new Date();
    if (now >= nextDataRefreshTime)
      updateData();

    // otherwise if the UI has already rendered once, and data is not already bing loaded, 
    // update the display

    else
      updateDisplay();
  }

  // fire off the chain function

  updateChainFunction();
}

// load all data sets, combine them, and present them on the display
// the helper function must be recursive because the data is loaded asynchronously

function updateData()
{
  // note that data is being loaded

  ++loadingData;

  // establish last and next update time

  lastDataRefreshTime = new Date();
  nextDataRefreshTime = new Date(lastDataRefreshTime.getTime() + REMOTE_DATA_UPDATE_MILLISECONDS);

  // load some mother fuckin' data

  updateDataHelper((USE_TEST_DATA ? TEST_DATA_SETS : dataSets).slice(), []);
}

// recursivly load and combinde data, when all data is loaded, display that data

function updateDataHelper(dataSets, dataAccumulation)
{
  // if there are no more data sets to load, register the data for display

  if (dataSets.length == 0)
  {
    // register the new data

    registerQuakeData(dataAccumulation);

    // decrement the loading counter

    --loadingData;

    // update the display for the new data

    updateDisplay();
    return;
  }

  // load data set

  d3.csv("/quake?test=" + USE_TEST_DATA + "&name=" + dataSets.pop() + ".txt", 
         function(data)
         {
           updateDataHelper(dataSets, dataAccumulation.concat(data));
         });
}

function registerQuakeData(data)
{
  // remove duplicate quakes

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

  // pre compute radius and date
  
  for (var i in data)
  {
    var d = data[i];
    d.radius = computeMarkerRadius(d.Magnitude) + MARKER_STROKE_WIDTH / 2;
    d.date = QUAKE_DATE_FORMAT.parse(d.Datetime);
  }

  // initialize tesseract

  quakeTesseract = tesseract(data);
  quakeData = data;
  quakesByMag = quakeTesseract.dimension(function(d) {return d.Magnitude;});
  quakesByDate = quakeTesseract.dimension(function(d) {return d.date;});

  // establish observed size, date and date ranges

  var magData = quakesByMag.top(Infinity);
  if (magData.length > 0)
  {
    observedMaxMag = magData[0].Magnitude;
    observedMinMag = magData[magData.length - 1].Magnitude;
  }

  var dateData = quakesByDate.top(Infinity);
  if (dateData.length > 0)
  {
    observedMaxDate = dateData[0].date;
    observedMinDate = dateData[dateData.length - 1].date;
  }

  // estalish date window

  dateWindowMax = new Date();
  dateWindowMin = USE_TEST_DATA ? observedMinDate : new Date(dateWindowMax.getTime() - dateWindowExtent);
  timeScale = d3.time.scale.utc().domain([dateWindowMin, dateWindowMax]).range([MIN_OPACITY, MAX_OPACITY]);

  // apply any filters to data

  quakesByMag.filter(magLimitScale ? magLimitScale.domain() : null);
  quakesByDate.filter(dateLimitScale ? dateLimitScale.domain() : timeScale.domain());

  // note that data has changed

  dataChanged = true;
}

// update display

function updateDisplay()
{
  var now = new Date();

  // if data is loading, then no need to update display it will get updated with the new data

  if (loadingData > 0)
    return

  // if this is the first time around, create the display

  if (isFirstRender())
  {
    var updateMap = initializeOverlay();
    var updateKey = constructKey();

    updateDisplayInternal = function()
    {
      updateMap();
      updateKey();
    };
  }
    
  // update the display

  updateDisplayInternal();
  
  // changes are accounted for 

  timeScaleChanged = false;
  dataChanged = false;
}

// test if this is the first rendering of the data

function isFirstRender()
{
  return updateDisplayInternal == null;
}

// put loaded data on the map

function initializeOverlay()
{
  // create the overlay

  var overlay = new google.maps.OverlayView();

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

      var dd = quakesByMag.top(Infinity);
      var updates = layer.selectAll("svg.quakeBox")
        .data(dd, function(d) {return d.Eqid;})
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
        .attr("class", "markerShape")
        .attr("cx", function(d) {return d.radius;})
        .attr("cy", function(d) {return d.radius;})
        .attr("r", 0)
        .transition()
        .duration(FADE_IN_DURATION)
        .attr("r", function(d) {return d.radius - MARKER_STROKE_WIDTH / 2;});

      // all get the opacity set

      updates.selectAll("circle")
        .attr("opacity", function(d) {return timeScale(d.date);});

      // fade out circles

      updates.exit().selectAll("circle")
        .transition()
        .duration(FADE_OUT_DURATION)
        .attr("r", 0);

      // remove the exits

      updates.exit()
        .transition()
        .duration(FADE_OUT_DURATION)
        .remove();

      // sort quakes

      d3.selectAll(".quakeBox")
        .sort(function (a, b)
          {
            if (a.Magnitude > b.Magnitude)
              return -1;
            if (a.Magnitude < b.Magnitude)
              return 1;
            return 0;
          });
    };
  };

  // be sure to remove markers when overlay is removed

  overlay.onRemove = function() 
  {
    d3.select(".markers").remove();
  };

  // add new layer

  overlay.setMap(map);

  // return the function which will update the map

  return function()
  {
    if (typeof overlay.draw !== 'undefined')
      overlay.draw();
  }
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
                                tCell({id: "date"}, DATE_FORMAT(quake.date))) + 
                           tRow({}, 
                                tCell({id: "time"}, 
                                      TIME_FORMAT(quake.date) + span({id: "zone", class: "label"}, ZONE_FORMAT(quake.date))
                                     )))
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
                                tCell({class: "label"}, "source") +
                                tCell({class: "value"}, quake.Src.toUpperCase())) +
                           tRow({},
                                tCell({class: "label"}, "lat") +
                                tCell({class: "value"}, quake.Lat) +
                                tCell({class: "label"}, "lon") +
                                tCell({class: "value"}, quake.Lon)))))
         );

  return result;
}

function input(attributes, text) {return html("input", attributes, text);}
function form(attributes, text) {return html("form", attributes, text);}
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

  // highlight matching quake

  d3
    .selectAll(".chartQuakes")
    .filter(function (d) {return d == quake;})
    .attr("class", "mapMouseOver");
}


function mouseoutQuake(quake, map)
{
  removeQuakeDtail(quake, map);

  // un-highlight matching quake

  d3
    .selectAll(".mapMouseOver")
    .filter(function (d) {return d == quake;})
    .attr("class", "chartQuakes");
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
  // create scale div and add to map

  var keyDiv = document.createElement("div");
  keyDiv.id = "keyDiv";
  keyDiv.style.width =  KEY_WIDTH + "px";
  keyDiv.style.height = KEY_HEIGHT + "px";
  keyDiv.style.padding = "0px " + KEY_PADDING + "px";

  // attach key to map (removing old one first)

  var topRight = map.controls[google.maps.ControlPosition.RIGHT_TOP];
  if (topRight.length > 0)
    topRight.pop();
  topRight.push(keyDiv);

  // add inner div

  var innerDiv = d3.select(keyDiv)
    .append("div")
    .attr("id", "keyInner");

  // add header area

  var headerDiv = innerDiv
    .append("div")
    .attr("id", "keyHeader");

  // add detail area

  var detailDiv = innerDiv
    .append("div")
    .attr("id", "detailDiv");

  var detailSvg = detailDiv
    .append("svg:svg")
    .attr("id", "detailSvg");

  // add quake chart area

  var chartDiv = innerDiv
    .append("div")
    .attr("id", "chartDiv");
  
  var chartSvg = chartDiv
    .append("svg:svg")
    .attr("id", "chartSvg");

  // signature

  var sigDiv = innerDiv
    .append("div")
    .attr("id", "sigDiv");

  // jam content into the sections, and collect up update functions

  var updateHeader = function() {if (timeScaleChanged) headerDiv.html(keyHeaderHtml);};
  var updateKeyDetail = createKeyDetail(detailSvg);
  var updateQuakeChart = createQuakeChart(chartSvg);
  var updateSig = createSignature(sigDiv);

  // return the function which will update key

  return function()
  {
    updateHeader();
    updateKeyDetail();
    updateQuakeChart();
    updateSig();
  };
}

// create signature area

function createSignature(sigDiv)
{
  var space = "&nbsp;";
  var tar = "http://www.trebor.org/static/assets/icons/tat.png";
  var icon = "http://www.trebor.org/static/assets/icons/favicon.ico";
  var url = "http://www.trebor.org";
  var name = "Robert Harris";
  var date = "March 2012";

  var html = 
    table({id: "sigTable"}, 
          tRow({id: "sigRow"},
               tCell({id: "sigName"}, name) +
               tCell({id: "sigIcon"}, htmlA({}, htmlImg({}, icon, "trebor.org"), url)) +
               tCell({id: "sigDate"}, date)
              )
         );
  
  sigDiv.html(html);
  return function() {};
}



// create key detail

function createKeyDetail(detailSvg)
{
  var stockMagnitude = 5;
  var examples = 7;
  var keyPadding = 15;
  var examplePercentStep = (100 - 2 * keyPadding) / (examples - 1);
  var countdownTimerRadius = 18;

  // create the age quakes

  var ageScale = d3.time.scale.utc().domain(timeScale.domain()).range([0, examples - 1]);
  var ageQuakes = [];

  for (var example = 0; example < examples; ++example)
  {
    var quake = new Object();
    quake.date = ageScale.invert(example);
    quake.example = example;
    quake.Magnitude = stockMagnitude;
    quake.radius = computeMarkerRadius(quake.Magnitude);
    quake.offset = keyPadding + examplePercentStep * example;
    ageQuakes.push(quake);
  }

  // add the age quakes

  detailSvg
    .append("text")
    .attr("class", "detailTitle")
    .attr("x", "50%")
    .attr("y", "1.2em")
    .style("text-anchor", "middle")
    .text("Quake Age");

  var startAge = detailSvg
    .append("text")
    .attr("class", "detailLabel")
    .attr("x", keyPadding - examplePercentStep * 0.5 + "%")
    .attr("y", "2.4em")
    .style("text-anchor", "start");

  detailSvg
    .append("text")
    .attr("class", "detailLabel")
    .attr("x", (keyPadding + (examples - 1) * examplePercentStep + examplePercentStep * 0.5) + "%")
    .attr("y", "2.3em")
    .style("text-anchor", "end")
    .attr("dominant-baseline", "right")
    .text("Now");

  var ageMarkers = detailSvg.selectAll("g.age")
    .data(ageQuakes)
    .enter()
    .append("svg:g")
    .attr("class", "age");

  ageMarkers
    .append("svg:circle")
    .attr("class", "markerShape")
    .attr("cx", function(d) {return d.offset + "%";})
    .attr("cy", "3.2em")
    .attr("opacity", function(d) {return timeScale(d.date);})
    .attr("r", function(d) {return d.radius - MARKER_STROKE_WIDTH / 2;});

  // add update data

  detailSvg
    .append("svg:foreignObject")
    .style("visibility", "visible")
    .attr("width",  "100%")
    .attr("height", "15%")
    .attr("x", "0%")
    .attr("y", "47%")
    .append("xhtml:body")
    .attr("id", "dataUpdate")
    .attr("class", "detailTitle")
    .style("text-anchor", "middle")
    .html("Update")
    .on("click", updateData);

  // last label and time

  var timeXPos = 70;

  detailSvg
    .append("text")
    .attr("class", "detailLabel")
    .attr("x", timeXPos)
    .attr("y", "9.2em")
    .style("text-anchor", "end")
    .text("Last");

  var lastTime = detailSvg
    .append("text")
    .attr("class", "detailValue")
    .attr("x", timeXPos + 5)
    .attr("y", "9.2em")
    .style("text-anchor", "start");

  // next label and time

  detailSvg
    .append("text")
    .attr("class", "detailLabel")
    .attr("x", timeXPos)
    .attr("y", "10.2em")
    .style("text-anchor", "end")
    .text("Next");

  var nextTime = detailSvg
    .append("text")
    .attr("class", "detailValue")
    .attr("x", timeXPos + 5)
    .attr("y", "10.2em")
    .style("text-anchor", "start");

  // countdown arc

  var countDown = detailSvg
    .append("svg:path")
    .attr("id", "updateCountDown")
    .attr("transform", "translate(" + (KEY_WIDTH - (3 * countdownTimerRadius + KEY_PADDING)) + ", 110)");

  // arc for countdown

  var arc = d3.svg.arc()
    .startAngle(0)
    .endAngle  (Math.PI * 2)
    .innerRadius(0)
    .outerRadius(countdownTimerRadius);

  // hint to select quakes

  detailSvg
    .append("text")
    .attr("class", "detailLabel")
    .attr("x", "50%")
    .attr("y", "12.9em")
    .style("text-anchor", "middle")
    .text("Drag to select quakes.");


  return function() 
  {
    // if data has changed, create a fresh update scale

    if (dataChanged)
    {
      var now = new Date();
      var duration = nextDataRefreshTime.getTime() - now.getTime();

      countDown
        .attr("d", arc)
        .transition()
        .ease("linear")
        .duration(duration)
        .attrTween("d", function arcTween(a) 
                   {
                     return function(t) 
                     {
                       arc.startAngle(t * Math.PI * 2);
                       return arc();
                     };
                   }
                  );

      lastTime.text(TIME_FORMAT(lastDataRefreshTime));
      nextTime.text(TIME_FORMAT(nextDataRefreshTime));
    }

    // if time scale has changed, update start age label
    
    if (timeScaleChanged)
    {
      var unitName = null;
      switch(dataSets)
      {
      case HOUR_DATA_SETS:
        unitName = "1 Hour";
        break;
      case DAY_DATA_SETS:
        unitName = "1 Day";
        break;
      case WEEK_DATA_SETS:
        unitName = "1 Week";
        break;
      }
      
      startAge.text(unitName);
    }
  };
}

function createQuakeChart(svg)
{
  var m = {top: 5, left: 30, bottom: 25, right: 15};
  var w = KEY_WIDTH - m.left - m.right;
  var h = (KEY_HEIGHT * CHART_HEIGHT_PROPORTION) - m.top - m.bottom;

  // initialize the scales

  var quakeChartTimeScale = d3.time.scale.utc().range([0, w]);
  var quakeChartMagScale = d3.scale.linear().range([h, 0]);

  // frame to attach axes too

  var frame = svg
    .append("g")
    .attr("transform", "translate(" + m.left + "," + m.top + ")");

  // create x-axis

  var xAxis = frame.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + h + ")");

  // create y-axis

  var yAxis = frame.append("g")
    .attr("class", "y axis");

  // data that persists in the update function
  
  var lastTimeScaleChange = null;
  var chartMarkers = null;
  var isFirstTime = true;

  // the function used to update this chart, defined here so it has access to 
  // chart variables but can be called globally 

  var updateQuakeChart = function()
  {
    // if the timescale has changed, record that

    var now = new Date();
    if (timeScaleChanged)
      lastTimeScaleChange = now;

    // if timescale has changed recently then protect the display from updates until it's roll in is complete

    else if (lastTimeScaleChange && lastTimeScaleChange.getTime() + CHART_QUAKE_ROLLIN_MILLISECONDS > now.getTime())
      return;

    // set the domain of the chat scales

    quakeChartTimeScale.domain(timeScale.domain());
    quakeChartMagScale.domain([0, parseFloat(observedMaxMag) + 0.001]).nice();

    // set the x-axis scale

    var xAxisScale = null;
    var xAxisTickFormat = null;
    var xAxisTickNumber;
    switch(dataSets)
    {
    case HOUR_DATA_SETS:
      xAxisInterval = d3.time.minutes;
      xAxisTickFormat = d3.time.format("%H:%M");
      xAxisTickNumber = 10;
      break;
    case DAY_DATA_SETS:
      xAxisInterval = d3.time.hours;
      xAxisTickFormat = d3.time.format("%H:00");
      xAxisTickNumber = 8;
      break;
    case WEEK_DATA_SETS:
      xAxisInterval = d3.time.days;
      xAxisTickFormat = d3.time.format("%d %b");
      xAxisTickNumber = 2;
      break;
    }

    var xAxisScale = d3.svg.axis().scale(quakeChartTimeScale)
      .tickSubdivide(1)
      .tickSize(6, 3, 0)
      .ticks(xAxisInterval, xAxisTickNumber)
      .tickFormat(xAxisTickFormat)
      .orient("bottom");

    var yAxisScale = d3.svg.axis().scale(quakeChartMagScale).orient("left");

    if (timeScaleChanged)
    {
      xAxis 
        .transition()
        .duration(CHART_QUAKE_ROLLIN_MILLISECONDS)
        .call(xAxisScale);

      yAxis
        .transition()
        .duration(CHART_QUAKE_ROLLIN_MILLISECONDS)
        .call(yAxisScale);
    }
    else
    {
      xAxis.call(xAxisScale);
      yAxis.call(yAxisScale);
    }
    
    // establish the cirlce updates
    
    chartMarkers = svg.selectAll("circle")
      .data(quakeData.filter(
        function (d) 
        {
          return d.date >= dateWindowMin && d.date < dateWindowMax;
        }), function(d) {return d.Eqid;});
    
    // add the new circles

    var updateMarkers = chartMarkers
      .enter()
      .append("circle")
      .attr("opacity", 0)
      .attr("class", "chartQuakes")
      .attr("r", 3);

    // if timescale changed, roll in new points from left edge

    if (timeScaleChanged && !isFirstTime)
    {
      // place markers flush left of the chart

      updateMarkers.attr("transform", function(d)
              {
                return "translate(" + m.left + "," + (quakeChartMagScale(d.Magnitude) + m.top) + ")"; 
              });

      // remove the exits
      
      chartMarkers.exit()
        .transition()
        .duration(CHART_QUAKE_ROLLIN_MILLISECONDS)
        .attr("opacity", 0)
        .attr("transform", function(d)
              { return "translate(" + m.left + "," + 
                (quakeChartMagScale(d.Magnitude) + m.top) + ")"; 
              })
        .remove();

      // (re)position all quakes
      
      chartMarkers
        .transition()
        .duration(CHART_QUAKE_ROLLIN_MILLISECONDS)
        .attr("opacity", 1)
        .attr("transform", function(d)
              { return "translate(" + (quakeChartTimeScale(d.date) + m.left) + "," + 
                (quakeChartMagScale(d.Magnitude) + m.top) + ")"; 
              });
    }
    
    // otherwise just fade them in where they belong
    
    else
    {
      // place markers at final destination

      updateMarkers
        .attr("transform", function(d)
              {
                return "translate(" + (quakeChartTimeScale(d.date) + m.left) + "," + (quakeChartMagScale(d.Magnitude) + m.top) + ")";
              });

      // remove the exits
      
      chartMarkers.exit()
        .transition()
        .duration(CHART_QUAKE_ROLLIN_MILLISECONDS)
        .attr("opacity", 0)
        .remove();

      // (re)position all quakes
      
      chartMarkers
        .attr("transform", function(d)
              { return "translate(" + (quakeChartTimeScale(d.date) + m.left) + "," + 
                (quakeChartMagScale(d.Magnitude) + m.top) + ")"; 
              })
        .attr("opacity", 1);
    }

    if (timeScaleChanged)
    {
      chartMarkers.classed("unselected", false);
      svg.classed("selecting", false);
      magLimitScale = null;
      dateLimitScale = null;
      quakesByMag.filter(null);
      quakesByDate.filter(timeScale);

      svg.selectAll("g.brush").remove();
      svg.append("g")
        .attr("class", "brush")
        .attr("transform", function(d) { return "translate(" + m.left + "," + m.top + ")"; })
        .call(d3.svg.brush().x(quakeChartTimeScale).y(quakeChartMagScale)
              .on("brushstart", brushstart)
              .on("brush", brush)
              .on("brushend", brushend));

    }

    // no longer the first time

    isFirstTime = false;
  }

  // brush functions

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

    chartMarkers.classed("unselected", function(d) {return !select(d);});
  }
  
  function brushend() 
  {
    var e = d3.event.target.extent();

    if (d3.event.target.empty())
    {
      chartMarkers.classed("unselected", false);

      magLimitScale = null;
      dateLimitScale = null;
      quakesByMag.filter(null);
      quakesByDate.filter(timeScale);
      updateDisplay();
    }
    else
    {
      magLimitScale = d3.scale.linear().domain([e[0][1],e[1][1]]);
      dateLimitScale = d3.time.scale().domain([e[0][0],e[1][0]]);
      quakesByMag.filter(magLimitScale.domain());
      quakesByDate.filter(dateLimitScale.domain());
      updateDisplay();
    }

    svg.classed("selecting", !d3.event.target.empty());
  }

  // return function which will update the quake chart

  return updateQuakeChart;
}

function keyHeaderHtml()
{
  var space = "&nbsp;";
  var selectHour = span({class: "spanSelector", onclick: "setHourSpan()"}, "Hour");
  var selectDay = span({class: "spanSelector", onclick: "setDaySpan()"},  "Day");
  var selectWeek = span({class: "spanSelector", onclick: "setWeekSpan()"}, "Week");

  // use dataSets as proxy for which time mode is selected

  var unitName = null;
  var space1 = space;
  var space2 = space;
  switch(dataSets)
  {
  case HOUR_DATA_SETS:
    unitName = "this Hour";
    selectHour = span({class: "spanSelected"}, "Hour");
    space1 = "";
    break;
  case DAY_DATA_SETS:
    unitName = "this Day";
    selectDay = span({class: "spanSelected"}, "Day");
    space2 = "";
    break;
  case WEEK_DATA_SETS:
    unitName = "this Week";
    selectWeek = span({class: "spanSelected"}, "Week");
    space2 = "";
    break;
  }

  var selectors = selectHour + space + selectDay + space + selectWeek;

  // construct the header table

  var result = 
    table({id: "keyHeaderTable"},
          tRow({}, 
               tCell({},
                     table({id: "titleTable"},
                           tRow({}, tCell({id: "keyTitle"}, "Earthquakes" + space + unitName)) +
                           tRow({id: "spanSelectors"}, tCell({}, selectors))
                          )
                    )
              )
         );

  return result;
}

// set the time span to the last hour

function setHourSpan()
{
  dateWindowExtent = MILLISECONDS_INA_HOUR;
  dataSets = HOUR_DATA_SETS;
  timeScaleChanged = true;
  updateData();
}

// set the time span to the last day

function setDaySpan()
{
  dateWindowExtent = MILLISECONDS_INA_DAY;
  dataSets = DAY_DATA_SETS;
  timeScaleChanged = true;
  updateData();
}

// set the time span to the last week

function setWeekSpan()
{
  dateWindowExtent = MILLISECONDS_INA_WEEK;
  dataSets = WEEK_DATA_SETS;
  timeScaleChanged = true;
  updateData();
}


function timeDifferenceText(date1, date2)
{
  var delta = date2.getTime() - date1.getTime();
  var bigUnit = establishTimeUnit(delta);
  var bigText = Math.floor(delta / bigUnit.divisor) + " " + bigUnit.short;

  if (bigUnit.divisor == MILLISECONDS_INA_SECOND)
    return bigText;

  var deltaRemainder = delta % bigUnit.divisor;
  var smallUnit = establishTimeUnit(deltaRemainder);
  var smallText = Math.floor(deltaRemainder / smallUnit.divisor) + " " + smallUnit.short;

  return bigText + " " + smallText;
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

function convertToUtc(date)
{
  date = typeof date !== 'undefined' ? date : new Date();
  return new Date(
    date.getUTCFullYear(), 
    date.getUTCMonth(), 
    date.getUTCDate(),  
    date.getUTCHours(), 
    date.getUTCMinutes(), 
    date.getUTCSeconds());
}

function capitaliseFirstLetter(string)
{
  return string.charAt(0).toUpperCase() + string.slice(1);
}

