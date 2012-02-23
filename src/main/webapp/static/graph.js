var rootUri = getParameterByName("q");
var oldRootUri = rootUri;
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var r = (Math.min(w, h) / 2) - 50;
var iconSize = 12
var nodeCircleRadius = 40;
var depth = 1;
var linkDistance = 250;
var arrowBackset = 18;
var transitionDuration = 3000;
var fill = d3.scale.category20();
var nodesTick;
var linksTick;
var oldNodePositions = new Array();
var rootPos = [w / 2, h / 2];

// create the visualization

var vis = d3.select("#chart").append("svg").attr("width", w).attr("height", h);

// create the force network

var force = d3.layout.force().charge(-100).linkDistance(linkDistance).size([w, h]);

// entry point for code

setRootUri(rootUri);

function setRootUri(newRootUri)
{
  oldRootUri = rootUri;
  rootUri = newRootUri;
  var dataSource = "/graph?q=" + escape(rootUri) + "&depth=" + depth;
  console.log("loading from: " + dataSource);
  d3.json(dataSource, configureGraph);
}

function isRoot(node)
{
  return node.name == rootUri || node.fullname == rootUri;
}

function configureGraph(json) 
{


  force
    .stop()
    .nodes(json.nodes)
    .links(json.links);

  // add links
  
  allLinks = vis.selectAll("g.link")
    .data(json.links, linkId)
    .each(linkSortId);

  newLinks = allLinks
    .enter();

  // add paths for new links

  newLinks
    .append("svg:g")
    .attr("class", "link")
    .each(linkSortId)
    .append("path")
    .attr("class", "linkPath")
    .attr("id", idKey);

  allLinks
    .attr("d", path);

  // add text to links

  allLinks
    .append("text")
    .attr("class", "linkText")
    .attr("dy", "0.25em")
    .attr("dx", "0.25em")
    .append("textPath")
    .attr("xlink:href", idRef)
    .attr("startOffset", nodeCircleRadius)
    .text(function(d) {return d.name;});

  // remove old links

  allLinks.exit().remove();

  // add nodes

  var allNodes = 
    vis.selectAll("g.node")
    .data(json.nodes, function(d) {return d.fullname;})
    .each(nodeSortId);

  var newNodes = allNodes
    .enter()
    .append("svg:g")
    .each(nodeSortId)
    .attr("class", "node")
    .call(force.drag)
    .on("click", clickNode);

  newNodes
    .append("circle")
    .attr("class", "nodeCircle")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", nodeCircleRadius);

  // add icon cirlce

  newNodes
    .append("circle")
    .attr("class", "uri-icon")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", iconSize);

  // add text circle path

  newNodes
    .append("path")
    .attr("class", "nodeTextCircle")
    .attr("id", idKey)
    .attr("d", function(d) {return cubicCircle(0, 0, nodeCircleRadius - 16);})
    .attr("transform", "rotate(90)")
    .style("fill", "none");

  // add node cirlce text

  newNodes
    .append("text")
    .attr("class", "circleText")
    .attr("dy", "0")
    .append("textPath")
    .attr("xlink:href", idRef)
    .attr("startOffset", "50%")
    .text(function (d) {return d.name;});

  // remove old nodes

  allNodes.exit()
    .each(function(d){d.fixed = true;})
    .attr("opacity", 1)
    .transition()
    .duration(transitionDuration)
    .attr("opacity", 0)
    .remove();

  // sort nodes and links into correct order

  vis
    .selectAll("g.link, g.node")
    .sort(function(a, b) 
      {
        var aSortId = a.sortId;
        var bSortId = b.sortId;
        var result = aSortId < bSortId ? -1 : aSortId > bSortId ? 1 : 0;
        return result;
      });

  // select items which need updating on tick

  nodesTick = vis.selectAll("g.node");
  linksTick = vis.selectAll("path.linkPath");

  // transition root node too middle

  vis.selectAll("g.node")
    .filter(isRoot)
    .each(function (d) {d.fixed = true;})
    .transition()
    .duration(transitionDuration)
    .tween("customRootMove", function (d) 
           {
             var op = oldNodePositions[d.fullname];
             var startX = op ? op[0] : w / 2;
             var startY = op ? op[1] : h / 2;

             return function(t) 
             {
               d.px = startX * (1 - t) + (w/2) * t;
               d.py = startY * (1 - t) + (h/2) * t;
               return t;
             };
           });

  // activate the tick!

  force
    .start()
    .on("tick", onTick);
}

function onTick() 
{
  // update node circle positions

  nodesTick
    .attr("transform", function(d) { return "translate(" + xy(d) + ")"; });

  // update link path

  linksTick
    .attr("d", path);

}

// compute the path for a link

function path(link)
{
  return "M" + xy(link.source) + "L" + xy(link.target);
}

function clickPredicate(predicate)
{
  var target="./daffodil.html?q=" + escape(predicate.fullname)
  window.location = target;
}

function clickNode(node)
{
  vis.selectAll("g.node")
    .each(function (d) {
      oldNodePositions[d.fullname] = [d.x, d.y];
      console.log("oldNodePositions", oldNodePositions[d.fullname]);
    });
  
  setRootUri(node.fullname);
}

// extract x and y values from a node

function xy(node)
{
  return node.x + ", " + node.y;
}

function idKey(linkOrNode, i)
{
  return linkOrNode.fullname + i;
}

function idRef(linkOrNode, i)
{
  return "#" + idKey(linkOrNode, i);
}

function linkId(link)
{
  return link.source.fullname + link.fullname + link.target.fullname;
}

function linkSortId(link)
{
  link.sortId = "a" + linkId;
}

function nodeSortId(node)
{
  node.sortId = "z" + node.name;
}

function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function cubicCircle(x, y, r)
{
  var cp = (r * .55);

  var path =
    "M " + (x + r) + "," + y + " " +
    "c " + 0   + "," + cp  + "  " +  (-r + cp) + "," + r         + "  " +  -r + "," +  r +
    "c " + -cp + "," + 0   + "  " +  -r        + "," + (-r + cp) + "  " +  -r + "," + -r +
    "c " + 0   + "," + -cp + "  " +  ( r - cp) + "," + -r        + "  " +   r + "," + -r +
    "c " + cp  + "," + 0   + "  " +   r        + "," + (r - cp)  + "  " +   r + "," +  r;

  return path;
}
