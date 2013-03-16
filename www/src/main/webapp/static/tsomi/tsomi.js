var width = $("#chart").width();
var height = $("#chart").height() - $("#header").height();

var color = d3.scale.category20();
var nextMidId = 0;

var HEAD_ANGLE = Math.PI / 6;
var ARROW_WIDTH = 6;


var CHARGE_HIDDEN = 50;
var CHARGE_BASE = 400;
var CHARGE_RANDOM = 0;
var LINK_BASE = 30;
var LINK_RANDOM = 150;
var RIM_SIZE = 22;
var NODE_SIZE = 150;
var IMAGE_SIZE = 108;
var PRINTABLE = true;
// image for unknown person

var UNKNOWN_PERSON = "images/unknown.png";
var WIKI_LOGO = "images/50px-Wikipedia_logo_silver.png";

// create the svg instance

var svg = d3.select("#chart")
  .append("svg:svg")
  .attr("width", width)
  .attr("height", height);

// create path for names

svg.append("defs")
  .append("path")
  .attr("id", "namepath")
  .attr("d", function() {
    var r = (NODE_SIZE - RIM_SIZE) / 2;
    return "M 0 " + (-r) + " a " + r + " " + r + " 0 1 0 0.01 0 Z";
  });


// add groups for links and nodes

var linkGroup = svg.append("g").classed("links", true);
var nodeGroup = svg.append("g").classed("nodes", true);

// create the fdl instance

var force = d3.layout.force()
  .gravity(0.01)
  .charge(function(d) {
    return d.getProperty("hidden") 
      ? -CHARGE_HIDDEN
      : -(Math.random() * CHARGE_RANDOM + CHARGE_BASE)})
  .linkDistance(function(link) {

    if (link.source == centerPerson || link.target == centerPerson)
      return NODE_SIZE / 2 + 20;

    return Math.random() * LINK_RANDOM + LINK_BASE;})
  .size([width, height]);

var centerPerson;

// fire everything off when the document is ready

$(document).ready(function() {
  var subject = subjects.oats;
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
  var page = node.getProperty("wikiTopic") + (PRINTABLE ? "?printable=yes" : "");
  var wiki = d3.select("#wikiframe")
    // .style({"visibility":"hidden"})
    // .attr("onload", "this.style.visibility = 'visible';")
    .attr("src", page);

  // wike font size
  //var iframe = top.frames['iframe'].document;
  //console.log("iframe", iframe);
  //wiki.selectAll('p').style('font-size','5px');
}

function updateChart(graph) {

  // check each physicalNode and, if it already exited, reestablish it's old positions

  var physicalNodes = [];
  graph.getNodes().forEach(function(physicalNode) {
    physicalNodes.push(physicalNode);
    physicalNode.x = width/2 + (Math.random() - 0.5) * width/2;
    physicalNode.y = height/2 + (Math.random() - 0.5) * height/2;
    force.nodes().forEach(function(oldNode) {
      if (physicalNode.getId() == oldNode.getId()) {
        physicalNode.x = oldNode.x;
        physicalNode.y = oldNode.y;
      }
    });
  });

  var physicalLinks = [];
  var renderedLinks = [];

  graph.getLinks().forEach(function(link) {
    var src = link.getSource();
    var mid = new TNode("mid" + nextMidId++, {hidden: true});
    var trg = link.getTarget();

    // if src and target have old values, place this node right between them

    if (src.x !== undefined && trg.x != undefined) {
      mid.x = (src.x + trg.x) / 2;
      mid.y = (src.y + trg.y) / 2;
    }

    physicalNodes.push(mid);
    physicalLinks.push({source: src, target: mid, value: 3});
    physicalLinks.push({source: mid, target: trg, value: 3});
    link.mid = mid;
    link.value = 3;
    renderedLinks.push(link);
  });

  // filter out hidden nodes so they are not rendered

  var renderedNodes = physicalNodes.filter(function(d) {return !d.getProperty("hidden")});

  // create the force directed layout

  force
      .nodes(physicalNodes)
      .links(physicalLinks)
      .start();


  var allLink = linkGroup.selectAll(".link")
    .data(renderedLinks);

  var enterLinks = allLink
    .enter().append("path")
    .attr("class", "link")
    .style("stroke-width", ARROW_WIDTH)
    .append("title")
    .text(function(d) {return d.getProperty("type")});

  var exitLinks = allLink.exit().remove();
  
  var allNodes = nodeGroup.selectAll(".node")
    .data(renderedNodes, function(d) {return d.id;});

  var enterNodes = allNodes.enter();
  var exitNodes = allNodes.exit().remove();


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
    .attr("transform", function(d) {return "scale(" + computeNodeScale(d) + ")"})
    .classed("scale", true);

  scaleGroups
    .append("circle")
    .classed("backdrop", true)
    .attr("r", NODE_SIZE / 2);

  scaleGroups
    .append("image")
    .filter(function(d) {return !d.getProperty("hidden")})
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
    .attr("r", (NODE_SIZE - RIM_SIZE) / 2)
    .style("stroke-width", RIM_SIZE);


  scaleGroups
    .append("text")
     .attr("dx", "203")
     .attr("dy", "0.3em")
    .append("textPath")
    .classed("name", true)
    .attr("xlink:href", "#namepath")
    .attr("text-anchor", "middle")
    .text(function(d) {return d.getProperty("name")});

  scaleGroups
    .append("image")
    .classed("wikibutton", true)
    .attr("xlink:href", WIKI_LOGO)
    .attr("x", 6)
    .attr("y", 18)
    .attr("width", 30)
    .attr("height", 30)
    .on("click", onWikipediaClick);
  
  force.on("tick", function(event) {

    var k = .1 * event.alpha;
    centerPerson.x += (width  / 2 - centerPerson.x) * k;
    centerPerson.y += (height / 2 - centerPerson.y) * k;

    d3.selectAll("path.link").attr("d", arrowPath);
    
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
}

function onImageClick(node) {
  node.open = !node.open || false;
  console.log(node.getProperty("name") + " image", node.open);
  if (node.open) 
    $("#wikidiv").animate({left: "100px"});
  else
    $("#wikidiv").animate({right: "100px"});
}

function onWikipediaClick(node) {
  var event = d3.event;
  setWikiPage(node);
  event.stopPropagation();
}


function onNodeClick(node) {
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
