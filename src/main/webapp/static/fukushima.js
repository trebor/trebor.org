// google map

var map = new google.maps.Map(d3.select("#map").node(),
{
  zoom: 7,
  center: new google.maps.LatLng(37.7596, 140.473),
  mapTypeId: google.maps.MapTypeId.TERRAIN
});

// other globals

var minFrame = 1
var maxFrame = 2513;
var frameIndex = minFrame;
var frameDelay = 50;
var fadeDelay = 1500;
var maxReading = 4.5;
var minTime = 1303617600000;
var maxTime = 1326985200000;

// compute color space

var colorScale = new chroma.ColorScale({
    colors: ['#00e000','#ffff00','#ff0000'],
    positions: [0,.07,1],
    mode: 'rgb'
});

// timeline values

var timelineRect = null;
var timelineText = null;

// construct the timeline

constructTimeline();

// construct the color scale

constructScale();

// start up the data animation
  
animateData();

// load data and chain to self to animate

function animateData()
{
  var name = "fukushima-data/frame-" + pad(frameIndex, 5) + ".json";
  d3.json(name, displayData);
  setTimeout("animateData()", frameDelay);
  if (++frameIndex > maxFrame)
    frameIndex = minFrame;
}

// put loaded data on the map

function displayData(data)
{
  // if there is no data, return

  if (!data)
    return;

  // update timeline

  updateTimeline(data[0].t);

  // create overlay

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

// construct the reading scale

function constructScale()
{
  var max = 12;

  // create scale div and add to map

  var scaleDiv = document.createElement('DIV');
  scaleDiv.style.width="3em";
  scaleDiv.style.height="0%";
//   scaleDiv.style.padding="5px 10px 50px 20px";
  scaleDiv.id = "scale";
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(scaleDiv);

  // add label

  var innerDiv = d3.select(scaleDiv)
    .append("div")
    .style("height", "0%")
    .style("width", "100%")
    .style("text-align", "center");

   innerDiv.append("a")
    .attr("href", "http://wikipedia.org/wiki/Sievert")
    .text("µSv/h");

  // add reading values

  for (var i = 0; i < max; ++i)
  {
    var val = i / max;
    var valStr = "" + Math.round(val * maxReading * 10) / 10;
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

// construct the timeline div

function constructTimeline()
{
  var round = 0;
  var timelineDiv = document.createElement('DIV');
  timelineDiv.id = "timeline";
  timelineDiv.style.width="50%";
  timelineDiv.style.height="2em";
  timelineDiv.style.padding="35px";
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(timelineDiv);
  
  // create timeline svg element
  
  var svg = d3.select(timelineDiv)
    .append('svg:svg')
    .attr('width', "100%")
    .attr('height', "100%");

  // background rectangle
  
  svg.append("svg:rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("rx", round)
    .attr("ry", round)
    .attr("opacity", 0.75)
    .style("fill", "white")
    .attr("width", "100%")
    .attr("height", "100%");

  // progress bar rectangle

  timelineRect = svg.append("svg:rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("rx", round)
    .attr("ry", round)
    .attr("opacity", 0.35)
    .style("fill", "black")
    .attr("width", "0%")
    .attr("height", "100%");

  // text overlay

  timelineText = svg.append("text")
    .attr("x", "50%")
    .attr("y", "52%")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text("");

}


function updateTimeline(time)
{
  var format = d3.time.format("%d %b %Y %H:00");

  if (timelineRect)
    timelineRect.attr("width", ((time - minTime) / (maxTime - minTime) * 100) + "%");

  if (timelineText)
    timelineText.text(format(new Date(time)));
}
