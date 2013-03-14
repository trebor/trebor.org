var width = $("#chart").width();
var height = $("#chart").height() - $("#header").height();

var color = d3.scale.category20();
var nextMidId = 0;

var CHARGE_HIDDEN = 200;
var CHARGE_BASE = 800;
var CHARGE_RANDOM = 250;
var LINK_BASE = 80;
var LINK_RANDOM = 150;
var NODE_SIZE = 300;
var IMAGE_SIZE = 200;

// image for unknown person

var UNKNOWN_PERSON = "images/unknown.png";

// create the svg instance

var svg = d3.select("#chart")
  .append("svg:svg")
  .attr("width", width)
  .attr("height", height);

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
    return Math.random() * LINK_RANDOM + LINK_BASE;})
  .size([width, height]);

var centerPerson;

// fire everything off when the document is ready

$(document).ready(function() {
  //var subject = subjects.oats;
  //var subject = subjects.sontag;
  //var subject = subjects.einstein;
  var subject = subjects.vonnegut;
  
  querySubject("<http://dbpedia.org/resource/" + subject + ">");

  $('#wikiframe').load(function(uri) {
    wikichange(uri);
  });

  // $("#wikiframe").contents().change(url)
  // });
  // onLoad="wikichange(this.contentWindow.location)"
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
      d3.select("#wikiframe")
        .attr("src", centerPerson.getProperty("wikiTopic") + "?printable=no");
      console.log("centerPerson", centerPerson.getProperty("name"));
      updateChart(graph);
    }
  });
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
    renderedLinks.push({source: src, mid: mid, target: trg, value: 3});
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
    .style("stroke-width", function(d) { return 2;});

  var exitLinks = allLink.exit().remove();
  
  var allNodes = nodeGroup.selectAll(".node")
    .data(renderedNodes, function(d) {return d.id;});

  var enterNodes = allNodes.enter();
  var exitNodes = allNodes.exit().remove();


  var nodeGroups = enterNodes
    .append("g")
    .each(function(d){console.log("enter", d.getProperty("name"));})
    .classed("node", true)
    .on("click", onNodeClick)
    .on("mouseover", onNodeMouseOver)
    .on("mouseout", onNodeMouseOut)
    .call(force.drag);

  allNodes
    .selectAll(".scale")
    .each(function(d){console.log("update", d.getProperty("name"));})
    .attr("transform", function(d) {console.log("!"); return "scale(" + computeNodeScale(d) + ")"});

  var scaleGroups = nodeGroups
    .append("g")
    .attr("transform", function(d) {return "scale(" + computeNodeScale(d) + ")"})
    .classed("scale", true);

  scaleGroups
    .append("rect")
    .classed("backdrop", true)
    .attr("rx", 15)
    .attr("ry", 15)
    .attr("x", -NODE_SIZE / 2)
    .attr("y", -NODE_SIZE / 2)
    .attr("width", NODE_SIZE)
    .attr("height", NODE_SIZE);


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
    .append("text")
    .attr("y", 100)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .text(function(d) {return d.getProperty("name")});

  force.on("tick", function(event) {

    var k = .1 * event.alpha;
    centerPerson.x += (width  / 2 - centerPerson.x) * k;
    centerPerson.y += (height / 2 - centerPerson.y) * k;

    d3.selectAll("path.link").attr("d", function(d) {
//      return populate_path("M X0 Y0 L X1 Y1", [d.source, d.target]);
      return populate_path("M X0 Y0 Q X1 Y1 X2 Y2", [d.source, d.mid, d.target]);
    });
    
    d3.selectAll("g.node")
      .attr("transform", function(d) {
        return populate_path("translate(X0, Y0)", [d])
      });
  });
}

function computeNodeScale(node, isMouseOver) {
  var scale = 1;
  if (node.getId() == centerPerson.getId())
    scale = isMouseOver ? 1.2 : 1.0;
  else
    scale = isMouseOver ? 0.7 : 0.4;
  return scale;
}

function scaleNode(node, isMouseOver) {
  var scale = computeNodeScale(node, isMouseOver);

  d3.selectAll("g.scale")
    .filter(function(d) {return d.getId() == node.getId()})
    .transition()
    .attr("transform", function(d) {return "scale(" + scale + ")"});
}

function onNodeMouseOut(node) {
//  console.log("mouse out", node.getProperty("name"));
  scaleNode(node, false);
}

function onNodeMouseOver(node) {
//  console.log("mouse over", node.getProperty("name"));
  nodeGroup
    .selectAll("g.node")
    .sort(function(a, b) {

      if (a == node) 
        return 1;

      if (b == node)
        return -1;

      //console.log("foo", a.getId().localeCompare(b.getId()));

      return a.getProperty("name").localeCompare(b.getProperty("name"));
    });

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
