var width = $("#chart").width();
var height = $("#chart").height() - $("#header").height();

var color = d3.scale.category20();
var nextMidId = 0;

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
var IMAGE_SIZE = 108;
var PRINTABLE = true;
var STOCK_EASE = "elastic";
var DEFAULT_DURATION = 600;

// image for unknown person

var UNKNOWN_PERSON = "images/unknown.png";
var WIKI_LOGO = "images/Wikipedia-logo.png";

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

// add groups for links and nodes

var linkGroup = svg.append("g").classed("links", true);
var nodeGroup = svg.append("g").classed("nodes", true);

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
  //var subject = subjects.oats;
  var subject = subjects.bronte;
  //var subject = subjects.munro;
  //var subject = subjects.sontag;
  //var subject = subjects.einstein;
  //var subject = subjects.vonnegut;
  //var subject = subjects.kant;
  //var subject = subjects.mock;
  querySubject(lengthen(subject, true));
  // $('#wikiframe').load(function(uri) {
  //   wikichange(uri);
  // });
});

function wikichange(url) {
  console.log("changed!", url);
}

function connectToWiki() {
  window.open(d3.select("#wikiframe").attr("src").replace(PRINTABLE_PARAM, ""),'_blank');
}

function querySubject(subjectId) {
  console.log("query for subject", subjectId);
  getPerson(subjectId, function(graph) {
    console.log(subjectId + " has nodes ", graph.getNodes().length);
    if (graph.getNodes().length > 0) {

      centerPerson = graph.getNode(subjectId);
      console.log("centerPerson", centerPerson.getProperty("name"));
      updateChart(graph);
      
      // set wiki page

      setWikiPage(centerPerson);
    }
  });
}

function setWikiPage(node) {
  setWikiConnectButtonVisibility(false);
  var page = node.getProperty("wikiTopic") + (PRINTABLE ? PRINTABLE_PARAM : "");
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
  graph.getNodes().forEach(function(physicalNode) {
    physicalNodes.push(physicalNode);
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
    .style("stroke-width", ARROW_WIDTH)
    .append("title")
    .text(function(d) {return d.getProperty("type")});

  svg.selectAll("path.link")
    .transition()
    .duration(0)
    .delay(DEFAULT_DURATION)
    .attr("visibility", "visibile");


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
    .on("click", onWikipediaClick);
  
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
    
    var nodes = d3.selectAll("g.node");
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
  event.stopPropagation();
}

function onImageClick(node) {
  node.open = !node.open || false;
  console.log(node.getProperty("name") + " image", node.open);
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

function onWikipediaClick(node) {
  d3.select(d3.event.target)
    .attr("transform", "scale(1)");
  var event = d3.event;
  setWikiPage(node);
  event.stopPropagation();
}


function onNodeClick(node) {
  d3.selectAll("g.scale")
    .filter(function(d) {return d.getId() == node.getId()})
    .attr("transform", function(d) {return "scale(" + computeNodeScale(node, false) + ")"});
  querySubject(node.getId());
}

function populate_path(path, points) {
  for(index in points) {
    path = path
      .replace("X" + index, points[index].x)
      .replace("Y" + index, points[index].y);
  };
  return path;
}
