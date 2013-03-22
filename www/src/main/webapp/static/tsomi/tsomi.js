var width = $("#chart").width();
var height = $("#chart").height() - $("#header").height();

var color = d3.scale.category20();
var nextMidId = 0;

var TIMELINE_OPACITY = 0.03;
var TIMELINE_OPACITY = 0.03;
var TIMELINE_HIGHLIGHT_OPACITY = 0.2;
var HEAD_ANGLE = Math.PI / 6;
var ARROW_WIDTH = 6;
var WIKI_ICON_WIDTH = 30;
var PRINTABLE_PARAM = "?printable=yes";
var CHARGE_HIDDEN = 10;
var CHARGE_BASE = 400;
var CHARGE_RANDOM = 0;
var LINK_BASE = 40;
var LINK_RANDOM = 100;
var LINK_MIN_OFFSET = 25;
var RIM_SIZE = 22;
var NODE_SIZE = 150;
var IMAGE_SIZE = 106;
var PRINTABLE = true;
var STOCK_EASE = "elastic";
var DEFAULT_DURATION = 600;
var TIMELINE_MARGIN = 50;
var TIMELINE_Y = (height - 20);

// image for unknown person

var BACK_BUTTON = "images/backbutton.png";
var FORWARD_BUTTON = "images/forwardbutton.png";
var UNKNOWN_PERSON = "images/unknown.png";
var WIKI_LOGO = "images/Wikipedia-logo.png";

// the history of tsomi

var tsomiPast = [];
var tsomiFuture = [];

// create the svg instance

var svg = d3.select("#chart")
  .append("svg:svg")
  .attr("width", width)
  .attr("height", height);

// create a definitions section

var defs = svg.append("defs");

// create path for names

defs.append("path")
  .attr("id", "namepath")
  .attr("d", function() {
    var r = (NODE_SIZE - RIM_SIZE) / 2;
    return "M 0 " + (-r) + " a " + r + " " + r + " 0 1 0 0.01 0 Z";
  });

// create path for titles

defs.append("path")
  .attr("id", "titlepath")
  .attr("d", function() {
    var inset = 60;
    var len = 550;
    var curve = 130;
    return populate_path(
      "M X0 Y0 L X1 Y1 A X2 Y2 0 0 1 X3 Y3 L X4 Y4", [
        {x: inset, y: len},
        {x: inset, y: inset + curve},
        {x: curve, y: curve},
        {x: inset + curve, y: inset},
        {x: len, y: inset},
      ]);
  });

// add title

svg.append("text")
  .classed("title", true)
  .attr("dx", "120")
  .append("textPath")
  .attr("xlink:href", "#titlepath")
  .text("The Sphere Of My Influences");

// add back button

var FB_BUTTON_SIZE = 34;
var FB_BUTTON_X_OFF = (80 - FB_BUTTON_SIZE) / 2;
var FB_BUTTON_X = width - 60;
var FB_BUTTON_Y = 125;

svg.append("g")
  .attr("transform", "translate(" +
        (FB_BUTTON_X - FB_BUTTON_X_OFF) + ", " +
        (FB_BUTTON_Y) + ")")
  .append("image")
  .classed("backbutton", true)
  .attr("transform", "scale(0)")
  .attr("xlink:href", BACK_BUTTON)
  .style("opacity", .7)
  .attr("x", FB_BUTTON_SIZE / -2)
  .attr("y", FB_BUTTON_SIZE / -2)
  .attr("width", FB_BUTTON_SIZE)
  .attr("height", FB_BUTTON_SIZE)
  .append("title")
  .text("Go Back (Left Arrow)");

svg.append("g")
  .attr("transform", "translate(" +
        (FB_BUTTON_X + FB_BUTTON_X_OFF) + ", " +
        (FB_BUTTON_Y) + ")")
  .append("image")
  .classed("forwardbutton", true)
  .attr("transform", "scale(0)")
  .attr("xlink:href", FORWARD_BUTTON)
  .style("opacity", .7)
  .attr("x", FB_BUTTON_SIZE / -2)
  .attr("y", FB_BUTTON_SIZE / -2)
  .attr("width", FB_BUTTON_SIZE)
  .attr("height", FB_BUTTON_SIZE)
  .append("title")
  .text("Go Forward (Right Arrow)");

// add groups for links and nodes

var timelinesGroup = svg.append("g").classed("timelines", true);
var linkGroup = svg.append("g").classed("links", true);
var nodeGroup = svg.append("g").classed("nodes", true);
var axiesGroup = svg
  .append("g")
  .attr("transform", "translate(0, " + TIMELINE_Y + ")")
  .classed("axies", true)
  .attr("class", "axis");

// setup the axies

var timelineScale = d3.time.scale()
  .range([0, width - 1])
  .domain([new Date(1900, 12, 15), new Date()]);

var timelineAxis = d3.svg.axis()
  .scale(timelineScale).tickSize(-20, -10, 0)
  .tickSubdivide(true);

axiesGroup.call(timelineAxis);

// create the fdl instance

var force = d3.layout.force()
  .gravity(0.00)
  .linkStrength(0.6)
  .charge(function(d) {
    return d.getProperty("hidden") 
      ? -CHARGE_HIDDEN
      : -(Math.random() * CHARGE_RANDOM + CHARGE_BASE)})
  .linkDistance(function(link) {
    var base = LINK_BASE;

    if (link.source == centerPerson || link.target == centerPerson)
      base = NODE_SIZE / 2 + LINK_MIN_OFFSET;
    else
      base = NODE_SIZE / 4 + LINK_MIN_OFFSET;

    return Math.random() * LINK_RANDOM + base;})
  .size([width, height]);

var centerPerson;

// fire everything off when the document is ready

$(document).ready(function() {

  createSpecialData();
  var subject = estabishInitialSubject();
  querySubject(lengthen(subject, true));
  $(document).keydown(function(e){
    switch (e.keyCode) {
    case 37:
      goBack();
      break;
    case 39:
      goForward();
      break;
    }
  });
});

function estabishInitialSubject() {
  var subject = subjects.oats;
  //var subject = subjects.bronte;
  //var subject = subjects.munro;
  //var subject = subjects.sontag;
  //var subject = subjects.einstein;
  //var subject = subjects.vonnegut;
  //var subject = subjects.kant;
  //var subject = subjects.mock;

  var urlSubject = getURLParameter("subject");

  if (urlSubject != "null") {
    urlSubject = urlSubject.replace("%20", "_");
    urlSubject = urlSubject.replace(" ", "_");
    subject = "dbpedia:" + urlSubject;
  }
  else {
    urlSubject = getURLParameter("subject_raw");
    if (urlSubject != "null") {
      subject = "dbpedia:" + urlSubject;
    }
  }

  return subject;
}


function wikichange(url) {
  console.log("changed!", url);
}

function connectToWiki() {
  window.open(d3.select("#wikiframe").attr("src").replace(PRINTABLE_PARAM, ""),'_blank');
}

function querySubject(subjectId, recordPast, recordFuture) {
  recordPast = recordPast !== undefined ? recordPast : true;
  recordFuture = recordFuture !== undefined ? recordFuture : false;

  console.log("query for subject", subjectId);


  getPerson(subjectId, function(graph) {
    console.log(subjectId + " has nodes ", graph.getNodes().length);
    if (graph.getNodes().length > 0) {

      if (recordPast) savePast();
      if (recordFuture) saveFuture();

      centerPerson = graph.getNode(subjectId);
      updateChart(graph);
      
      // set wiki page

      setWikiPage(centerPerson);
    }
  });
}

function setWikiPage(node) {
  setWikiConnectButtonVisibility(false);
  var page = node.getProperty("wikiTopic");

  if (PRINTABLE && page.indexOf("wikipedia.org") >= 0)
    page += PRINTABLE_PARAM;

  var wiki = d3.select("#wikiframe")
    .attr("onload", "setWikiConnectButtonVisibility(true)")
    .attr("src", page);

      //document.getElementById("#wikiconnect").style.visibility = 'visibile';
  // wike font size
  //var iframe = top.frames['iframe'].document;
  //console.log("iframe", iframe);
  //wiki.selectAll('p').style('font-size','5px');
}

function wcMouseEvent(over) {
  var wc = d3.select("#wikiconnect");
  scaleElement(wc, over ? 1.2 : 1, DEFAULT_DURATION, STOCK_EASE);
}

function setWikiConnectButtonVisibility(visible) {
  var wc = d3.select("#wikiconnect");
  if (visible) {
    scaleElement(wc, 1, DEFAULT_DURATION, STOCK_EASE);
  } else {
    scaleElement(wc, 0, DEFAULT_DURATION);
  }
}

function scaleElement(element, scale, duration, ease) {
  var te = element
      .transition()
      .style("transform", "scale(" + scale + ")")
      .style("-o-transform", "scale(" + scale + ")")
      .style("-ms-transform", "scale(" + scale + ")")
      .style("-moz-transform", "scale(" + scale + ")")
      .style("-webkit-transform", "scale(" + scale + ")");

  if (ease !== undefined) te.ease(ease);
  if (duration !== undefined) te.duration(duration);
}

function updateChart(graph) {

  // check each physicalNode and, if it already exited, reestablish it's old positions

  var physicalNodes = [];
  var minDate = null;
  var maxDate = null;

  var sampleDate = function(date) {
    if (minDate == null || date < minDate)
      minDate = date;
    if (maxDate == null || date > maxDate)
      maxDate = date;
  };

  graph.getNodes().forEach(function(physicalNode) {
    physicalNodes.push(physicalNode);

    // establish date of birth
    
    var dobStr = physicalNode.getProperty("dob");
    var dob = undefined;
    if (dobStr !== undefined) {
      var dob = new Date(dobStr);
      physicalNode.setProperty("birthDate", dob);
    }
      
    // establish date of death

    var dodStr = physicalNode.getProperty("dod");
    var dod = undefined;

    if (dodStr !== undefined) {
      dod = new Date(dodStr);
      physicalNode.setProperty("deathDate", dod);
    }
    else if (dob != undefined) {
      dod = new Date();
      physicalNode.setProperty("deathDate", dod);
    }

    // establish min max dates
      
    if (dob !== undefined && dod !== undefined) {
      sampleDate(dod);
      sampleDate(dob);
    }

    // physicalNode.x = width/2 + (Math.random() - 0.5) * width/2;
    // physicalNode.y = height/2 + (Math.random() - 0.5) * height/2;
    // physicalNode.x = width/2;
    // physicalNode.y = height/2;
    force.nodes().forEach(function(oldNode) {
      if (centerPerson.getId() == oldNode.getId()) {
        centerPerson.x = oldNode.x;
        centerPerson.y = oldNode.y;
        centerPerson.weight = 0;
      }
      // if (physicalNode.getId() == oldNode.getId()) {
      //   physicalNode.x = oldNode.x;
      //   physicalNode.y = oldNode.y;
      // }
    });
  });

  // adjust scale

  timelineScale.domain([minDate, maxDate]);
  timelineScale.domain([
    timelineScale.invert(timelineScale.range()[0] - TIMELINE_MARGIN), 
    timelineScale.invert(timelineScale.range()[1] + TIMELINE_MARGIN)
  ]);

  // transition in the new scale

  svg.transition()
    .duration(2000)
    .select(".axis")
    .call(timelineAxis);

  var physicalLinks = [];
  var renderedLinks = [];

  graph.getLinks().forEach(function(link) {
    var src = link.getSource();
    var mid = new TNode("mid" + nextMidId++, {isMiddel: true, hidden: true});
    var trg = link.getTarget();

    // if src and target have old values, place this node right between them

    // if (src.x !== undefined && trg.x != undefined) {
    //   mid.x = (src.x + trg.x) / 2;
    //   mid.y = (src.y + trg.y) / 2;
    // }

    physicalNodes.push(mid);
    physicalLinks.push({source: src, target: mid});
    physicalLinks.push({source: mid, target: trg});
    link.mid = mid;
    renderedLinks.push(link);
  });

  // filter out hidden nodes so they are not rendered

  var renderedNodes = physicalNodes.filter(function(d) {return !d.getProperty("hidden")});

  // create the force directed layout

  force
    .nodes(physicalNodes)
    .links(physicalLinks)
    .start();

  // remove all links, they will all be created from scratch

  linkGroup.selectAll(".link").remove();

  var allLink = linkGroup.selectAll(".link")
    .data(renderedLinks);

  var enterLinks = allLink
    .enter();

  enterLinks
    .append("path")
    .attr("visibility", "hidden")
    .classed("link", true)
    .classed("to", function(d) {return d.target.getId() == centerPerson.getId();})
    .classed("from", function(d) {return d.source.getId() == centerPerson.getId();})
    .style("stroke-width", ARROW_WIDTH);
    // .append("title")
    // .text(function(d) {return d.getProperty("type")});

  svg.selectAll("path.link")
    .transition()
    .duration(0)
    .delay(DEFAULT_DURATION)
    .attr("visibility", "visibile");

  // add timeline paths for each node

  timelinesGroup.selectAll("path.timeline")
    .remove();

  timelinesGroup.selectAll("path.timeline")
    .data(renderedNodes)
    .enter()
    .append("path")
    .filter(function(d) {return d.getProperty("birthDate") !== undefined;})
    .classed("timeline", true)
    .style("opacity", 0)
    .transition()
    .duration(2000)
    .style("opacity", function(d) {return d == centerPerson ? TIMELINE_HIGHLIGHT_OPACITY : TIMELINE_OPACITY});

  //var exitLinks = allLink.exit().remove();
  
  var allNodes = nodeGroup.selectAll(".node")
    .data(renderedNodes, function(d) {return d.id;});

  var enterNodes = allNodes.enter();
  var exitNodes = allNodes.exit();

  exitNodes
    .selectAll(".scale")
    .transition()
    .duration(DEFAULT_DURATION)
    .attr("transform", "scale(0)");

  exitNodes
    .transition()
    .duration(DEFAULT_DURATION)
    .remove();


  var nodeGroups = enterNodes
    .append("g")
    .classed("node", true)
    .on("click", onNodeClick)
    .on("mouseover", onNodeMouseOver)
    .on("mouseout", onNodeMouseOut)
    .call(force.drag);

  allNodes
    .selectAll(".scale")
    .attr("transform", function(d) {return "scale(" + computeNodeScale(d) + ")"});

  var scaleGroups = nodeGroups
    .append("g")
    .attr("transform", "scale(0)")
    .classed("scale", true);
  
  scaleGroups
    .transition()
    .duration(DEFAULT_DURATION)
    .attr("transform", function(d) {return "scale(" + computeNodeScale(d) + ")"});

  scaleGroups
    .append("circle")
    .classed("backdrop", true)
    .attr("r", NODE_SIZE / 2);

  scaleGroups
    .append("image")
    .filter(function(d) {return !d.getProperty("hidden")})
    .attr("pointer-events", "none")
    .attr("xlink:href", function(d) {

      // create the list of all plausible images in preference order

      var thumbnail = d.getProperty("thumbnail");
      var altThumbnail = thumbnail !== undefined 
        ? thumbnail.replace("wikipedia/commons", "wikipedia/en")
        : undefined;

      var depiction = d.getProperty("depiction");
      var altDepiction = depiction !== undefined 
        ? depiction.replace("wikipedia/commons", "wikipedia/en")
        : undefined;

      d.images = [
        thumbnail, 
        altThumbnail, 
        depiction, 
        altDepiction,
        UNKNOWN_PERSON].filter(function(d) {return d !== undefined});

      // return first of those images

      return d.images.shift(); 
    })
    .on("error", function(d) {this.setAttribute("href", d.images.shift());})
    // .on("click", onImageClick)
    .attr("x", -IMAGE_SIZE / 2)
    .attr("y", -IMAGE_SIZE / 2)
    .attr("width", IMAGE_SIZE)
    .attr("height", IMAGE_SIZE);


  scaleGroups
    .append("circle")
    .classed("rim", true)
    .attr("pointer-events", "none")
    .attr("r", (NODE_SIZE - RIM_SIZE) / 2)
    .style("stroke-width", RIM_SIZE);


  scaleGroups
    .append("text")
    .attr("pointer-events", "none")
    .attr("dx", BrowserDetect.browser == "Firefox" ? "403" : "203")
    .attr("dy", "0.3em")
    .attr("text-anchor", "middle")
    .append("textPath")
    .classed("name", true)
    .attr("xlink:href", "#namepath")
    .text(function(d) { return d.getProperty("name")});

  // scaleGroups
  //   .append("title")
  //   .text(function(d) {
  //     return "dob: " + d.getProperty("dob") + " dod: " + d.getProperty("dod");
  //   });

  scaleGroups
    .append("g")
    .attr("transform", "translate(" + 
          (WIKI_ICON_WIDTH / 2 + 6) + ", " + 
          (WIKI_ICON_WIDTH / 2 + 18) + ")")

    .append("image")
    .classed("wikibutton", true)
    .attr("xlink:href", WIKI_LOGO)
    .attr("x", -WIKI_ICON_WIDTH / 2)
    .attr("y", -WIKI_ICON_WIDTH / 2)
    .attr("width", WIKI_ICON_WIDTH)
    .attr("height", WIKI_ICON_WIDTH)
    .attr("transform", "scale(1)")
    .on("mouseover", onWikipediaMouseOver)
    .on("mouseout", onWikipediaMouseOut)
    .on("click", onWikipediaClick)
    .append("title")
    .text("Show Wiki Text");

  force.on("tick", function(event) {

    var k2 = 15 * event.alpha;
    var k = .5 * event.alpha;
    centerPerson.x += (width  / 2 - centerPerson.x) * k;
    centerPerson.y += (height / 2 - centerPerson.y) * k;

    d3.selectAll("path.link")
      .each(function(link) {
        if (link.source.getId() == centerPerson.getId()) {
          link.target.x += k2;
        }
        if (link.target.getId() == centerPerson.getId()) {
          link.source.x -= k2;
        }
      })
      .attr("d", arrowPath);

    timelinesGroup.selectAll(".timeline")
      .classed("highlight", function(d) {return d == centerPerson;})
      .attr("d", timelinePath);
    
    var nodes = nodeGroup.selectAll("g.node");
    var margin = NODE_SIZE / 2 / 2;
    var x1 = margin;
    var x2 = width - margin;
    var y1 = margin;
    var y2 = height - margin;
    var delta = 1;


    nodes.each(function(d) {
      if (d.x < x1) d.x += delta;
      if (d.x > x2) d.x -= delta;
      if (d.y < y1) d.y += delta;
      if (d.y > y2) d.y -= delta;
    });

    // update transoform
    
    nodes.attr("transform", function(d) {
        return populate_path("translate(X0, Y0)", [d])
    });
  });
}

function timelinePath(node) {
  var TIMELINE_UPSET = 50;

  var birth = {x: timelineScale(node.getProperty("birthDate")), y: TIMELINE_Y};
  var bc1 = {x: node.x, y: TIMELINE_Y - TIMELINE_UPSET};
  var bc2 = {x: birth.x, y: TIMELINE_Y - TIMELINE_UPSET};
  var death = {x: timelineScale(node.getProperty("deathDate")), y: TIMELINE_Y};
  var dc1 = {x: death.x, y: TIMELINE_Y - TIMELINE_UPSET};
  var dc2 = {x: node.x, y: TIMELINE_Y - TIMELINE_UPSET};

  return populate_path(
    "M X0 Y0 C X1 Y1 X2 Y2 X3 Y3 L X4 Y4 C X5 Y5 X6 Y6 X7 Y7", [node, bc1, bc2, birth, death, dc1, dc2, node]);
}

function arrowPath(link) {
  var s = link.source;
  var m = link.mid;  
  var t = link.target;

  var angle = angleRadians(t, m);
  var nodeRadius = (NODE_SIZE / 2) * computeNodeScale(t) + ARROW_WIDTH;

  var tip = radial(t, nodeRadius, angle);
  var left = radial(tip, 20, angle + HEAD_ANGLE);
  var right = radial(tip, 20, angle - HEAD_ANGLE);

  //return populate_path("M X0 Y0 L X1 Y1 L X2 Y2 M X3 Y3 L X4 Y4 L X5 Y5",
  return populate_path("M X0 Y0 Q X1 Y1 X2 Y2 M X3 Y3 L X4 Y4 L X5 Y5",
                       [s, m, tip, left, tip, right]);
}

function angleRadians(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function radial(point, radius, radians) {
  return {
    x: Math.cos(radians) * radius + point.x,
    y: Math.sin(radians) * radius + point.y,
  };
}


function computeNodeScale(node, isMouseOver) {
  isMouseOver = isMouseOver || false;
  var scale = 1;

  if (node.getId() == centerPerson.getId())
    scale = 1.0;
  else
    scale = 0.5;

  return scale * (isMouseOver ? 2 : 1);
}

function scaleNode(node, isMouseOver) {
  var scale = computeNodeScale(node, isMouseOver);

  d3.selectAll("g.scale")
    .filter(function(d) {return d.getId() == node.getId()})
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .attr("transform", function(d) {return "scale(" + scale + ")"});
}

function onNodeMouseOut(node) {
  scaleNode(node, false);

  timelinesGroup.selectAll(".timeline")
    .filter(function(d) {return d == node && d != centerPerson;})
    .classed("highlight", false)
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .style("opacity", TIMELINE_OPACITY);

  event.stopPropagation();
}

function onNodeMouseOver(node) {

  // move node to top of the stack

  $("g.node").each(function(i, e) {
    if (e.__data__ == node) {
      $e = $(e);
      var parent = $e.parent();
      $e.remove();
      parent.append($e);
    }
  });

  // scale node

  scaleNode(node, true);

  timelinesGroup.selectAll(".timeline")
    .filter(function(d) {return d == node && d != centerPerson;})
    .classed("highlight", true)
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .style("opacity", TIMELINE_HIGHLIGHT_OPACITY);

  event.stopPropagation();
}

function onImageClick(node) {
  node.open = !node.open || false;
  if (node.open) 
    $("#wikidiv").animate({left: "100px"});
  else
    $("#wikidiv").animate({right: "100px"});
}

function onWikipediaMouseOver(node) {

  d3.select(d3.event.target)
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .attr("transform", "scale(1.8)");
}

function onWikipediaMouseOut(node) {
  d3.select(d3.event.target)
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .attr("transform", "scale(1)");
}

function onBackbuttonMouseOver(node) {
  scaleBackButton(1.4);
}

function onBackbuttonMouseOut(node) {
  scaleBackButton(1.0);
}

function onBackbuttonClick(node) {
  goBack();
}

function onForwardbuttonMouseOver(node) {
  scaleForwardButton(1.4);
}

function onForwardbuttonMouseOut(node) {
  scaleForwardButton(1.0);
}

function onForwardbuttonClick(node) {
  goForward();
}

function goBack() {
  if (tsomiPast.length > 0) {
    querySubject(tsomiPast.shift(), false, true);
    if (tsomiPast.length == 0)
      hideBackButton();
  }
}

function goForward() {
  if (tsomiFuture.length > 0) {
    querySubject(tsomiFuture.shift(), true, false);
    if (tsomiFuture.length == 0)
      hideForwardButton();
  }
}

function savePast() {
  if (centerPerson !== undefined) {
    tsomiPast.unshift(centerPerson.getId());
    if (tsomiPast.length == 1)
      showBackButton();
  }
}

function saveFuture() {
  if (centerPerson !== undefined) {
    tsomiFuture.unshift(centerPerson.getId());
    if (tsomiFuture.length == 1)
      showForwardButton();
  }
}

function clearFuture() {
  tsomiFuture = [];
  hideForwardButton();
}


function onWikipediaClick(node) {
  d3.select(d3.event.target)
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .attr("transform", "scale(1)");

  var event = d3.event;
  setWikiPage(node);
  event.stopPropagation();
}

function showBackButton() {
  d3.select(".backbutton")
    .on("mouseover", onBackbuttonMouseOver)
    .on("mouseout", onBackbuttonMouseOut)
    .on("click", onBackbuttonClick);
  scaleBackButton(1);
}

function hideBackButton() {
  d3.select(".backbutton")
    .on("mouseover", undefined)
    .on("mouseout", undefined)
    .on("click", undefined);
  scaleBackButton(0);
}

function showForwardButton() {
  d3.select(".forwardbutton")
    .on("mouseover", onForwardbuttonMouseOver)
    .on("mouseout", onForwardbuttonMouseOut)
    .on("click", onForwardbuttonClick);
  scaleForwardButton(1);
}

function hideForwardButton() {
  d3.select(".forwardbutton")
    .on("mouseover", undefined)
    .on("mouseout", undefined)
    .on("click", undefined);
  scaleForwardButton(0);
}

function scaleBackButton(scale) {
  d3.select(".backbutton")
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .attr("transform", "scale(" + scale + ")");
}

function scaleForwardButton(scale) {
  d3.select(".forwardbutton")
    .transition()
    .duration(DEFAULT_DURATION)
    .ease(STOCK_EASE)
    .attr("transform", "scale(" + scale + ")");
}

function onNodeClick(node) {
  // scaleNode(node, false);
  //onNodeMouseOut(node);

  // timelinesGroup.selectAll(".backdrop")
  //   .filter(function(d) {return d == node})
  //   .classed("clicked", true);

  var clickEase = "cubic-in-out";
  var clickDuration = DEFAULT_DURATION / 3;
  var scale = computeNodeScale(node, true);
  d3.selectAll("g.scale")
    .filter(function(d) {return d.getId() == node.getId()})
    .attr("transform", function(d) {return "scale(" + scale + ") rotate(0)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") translate(0, 0)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") rotate(0) translate(0, 0)"})
    .transition()
    .duration(clickDuration)
    .ease(clickEase)
    .attr("transform", function(d) {return "scale(" + scale + ") rotate(-10)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") translate(0, 10)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") rotate(-10) translate(0, 10)"})
    .transition()
    .duration(clickDuration)
    .ease(clickEase)
    .attr("transform", function(d) {return "scale(" + scale + ") rotate(10)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") translate(0, -10)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") rotate(10) translate(0, -10)"})
    .transition()
    .duration(clickDuration)
    .ease(clickEase)
    .attr("transform", function(d) {return "scale(" + scale + ") rotate(0)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") translate(0, 0)"})
    // .attr("transform", function(d) {return "scale(" + scale + ") rotate(0) translate(0, 0)"})
    .each("end", function() {
      querySubject(node.getId());
      clearFuture();
    });
}

function populate_path(path, points) {
  for(index in points) {
    path = path
      .replace("X" + index, points[index].x)
      .replace("Y" + index, points[index].y);
  };
  return path;
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}
