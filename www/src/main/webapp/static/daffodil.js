var targetUri = getParameterByName("q");
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var r = (Math.min(w, h) / 2) - 50;
var iconSize = 12
var nodeCircleRadius = 40;
var arrowBackset = 18;
var transitionDuration = 1000;

var tree = d3.layout.tree()
    .size([360, r])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var diagonal = d3.svg.diagonal
  .radial()
  .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; })
  .source(function (d) {return d.target.issubject == "true" ? d.source : d.target;})
  .target(function (d) {return d.target.issubject == "true" ? d.target : d.source;});


var hackedDiagonal = function (d, i)
{
  var pattern = /[0-9\.\-e]+/g;
  var values = diagonal(d, i).match(pattern);

  var x1 = values[0];
  var y1 = values[1];
  var x2 = values[6];
  var y2 = values[7];

  return "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
}

var vis = d3.select("#chart").append("svg")
  .attr("width", w)
  .attr("height", h)
  .append("g")
  .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

loadData(targetUri);

function loadData(targetUri)
{
  var dataSource = "/rdf?q=" + escape(targetUri);
  d3.json(dataSource, configureTree);
}

function linkId(link)
{
  var id =
    "[" + 
    link.source.name + "-" + 
    link.target.predicate.name + "-" + 
    link.target.name +
    "]";
  return id;
}

function linkSortId(link)
{
  link.sortId = "a" + linkId(link);
}

function nodeSortId(node)
{
  node.sortId = "z" + node.name;
}

function nodeTransform(node)
{
  return "rotate(" + (node.x - 90) + ")translate(" + node.y + ")";
}

function linkTransform(link)
{
  return "rotate(" + (link.target.x * 1.3) + ")translate(" + -link.source.x + ")";
//  return "translate(" + node.x + "," + node.y + ")";
//  return "rotate(" + (node.x * 1.25) + ")translate(" + -node.x + "," + -node.y + ")";
}

function configureTree(json) 
{
  var nodes = tree.nodes(json);

  // select all the nodes

  var allNodes = vis.selectAll("g.node")
    .data(nodes, function(d) {return d.name;});

  // add new nodes

  var newNodes = allNodes
    .enter()
    .append("g")
//    .each(function(d) {console.log("add node: " + d.fullname);})
    .attr("class", "node")
    .each(nodeSortId)
    .attr("transform", nodeTransform)
    .on("mouseover", focusNode)
    .on("mouseout", defocusNode);


  allNodes
    .each(nodeSortId)
    .transition()
    .duration(transitionDuration)
    .attr("transform", nodeTransform);

  // add clicking for URIs

  newNodes
    .filter(function (d) {return d.type == "URI";})
    .attr("cursor", "pointer")
    .on("click", clickNode);

   // add backing circle

  newNodes
    .filter(function (d) {return d.type != "BLANK";})
    .append("circle")
    .attr("class", "nodeCircle")
    .attr("r", nodeCircleRadius);

  // add circle path for text

  newNodes
    .filter(function(d) {return d.type != "BLANK";})
    .append("path")
    .attr("id", function (d, i) {return ("" + i + d.name);})
    .attr("d", function() {return cubicCircle(0, 0, nodeCircleRadius - 16);})
    .style("fill", "none");

  // add text to circle path

  newNodes
    .filter(function(d) {return d.type != "BLANK";})
    .append("text")
    .attr("class", "circleText")
    .attr("dy", "0")
    .append("textPath")
    .attr("xlink:href", function(d, i) {return "#" + i + d.name;})
    .attr("startOffset", "50%")
    .text(function (d) {return d.name;});

  allNodes
    .selectAll(".circleText")
    .attr("transform", function(d) { return "rotate( " + (180 - d.x) + " )"; });
  
  // add URI icon

  newNodes
    .filter(function (d) {return d.type == "URI";})
    .append("circle")
    .attr("class", "uri-icon")
    .attr("r", iconSize);

  // add BLANK icon

  newNodes
    .filter(function(d) {return d.type == "BLANK";})
    .append("circle")
    .attr("class", "blank-icon")
    .attr("r", iconSize - 3);

  // add LITERAL icon

  newNodes
    .filter(function (d) {return d.type == "LITERAL";})
    .append("rect")
    .attr("class", "literal-icon")
    .attr("x", -iconSize)
    .attr("y", -iconSize)
    .attr("width", 2 * iconSize)
    .attr("height",2 * iconSize)
    .attr("transform", function(d) {return "rotate( " + -d.x + " )";});

  // add link "g" node

  var allLinks = vis.selectAll("g.link")
    .data(tree.links(nodes), linkId);

  var enterLinks = allLinks
    .enter()
    .insert("g")
    .attr("class", "link")
    .each(linkSortId)
//    .each(function(d) {console.log("add link: " + linkId(d));})
//     .attr("transform", linkTransform)
    .attr("cursor", "pointer")
    .on("mouseover", focusLink)
    .on("mouseout", defocusLink)
    .on("click", function (d) {clickPredicate(d.target.predicate);});


  // add predicate link path

  enterLinks
    .append("path")
    .attr("id", linkId)
    .attr("class", "linkPath");

  // add link path

  allLinks
    .selectAll(".linkPath")
//    .transition()
//    .duration(transitionDuration)
    .attr("d", hackedDiagonal);


  // add predicate text

  enterLinks
    .append("text")
    .attr("class", "linkText")
    .attr("dy", "0.25em")
    .attr("dx", "0.25em")
    .append("textPath")
    .attr("xlink:href", function(d) {return "#" + linkId(d);})
    .attr("startOffset", nodeCircleRadius)
    .text(function(d) {return d.target.predicate.name;});

  // add predicate direction arrow

  enterLinks
    .append("text")
    .attr("class", "predicateArrow")
    .attr("dy", "0.38em")
    .attr("dx", function(d) 
          {
            return d.target.type == "BLANK" 
              ? -(iconSize + arrowBackset)
              : -(nodeCircleRadius + arrowBackset);

         })
    .append("textPath")
    .attr("xlink:href", function(d) 
          {
            return "#" + linkId(d);
          })
    .attr("startOffset", "100%")
    .text(function(d) {return String.fromCharCode(0x25b6);});

  // remove exits

  allNodes
    .exit()
//    .each(function(d) {console.log("remove node: " + d.name);})
    .remove();

  allLinks
    .exit()
//    .each(function(d) {console.log("remove link: " + linkId(d));})
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
}


function focusNode(node)
{
  vis
    .selectAll(".circleText")
    .filter(function (d) {return d == node;})
    .attr("class", "circleTextFocus");
}

function defocusNode(node)
{
  vis
    .selectAll(".circleTextFocus")
    .filter(function (d) {return d == node;})
    .attr("class", "circleText");
}

function focusLink(link)
{
  vis
    .selectAll(".linkText")
    .filter(function (d) {return d == link;})
    .attr("class", "linkTextFocus");
}

function defocusLink(link)
{
  vis
    .selectAll(".linkTextFocus")
    .filter(function (d) {return d == link;})
    .attr("class", "linkText");
}


function clickPredicate(predicate)
{
  var target="./daffodil.html?q=" + escape(predicate.fullname)
  window.location = target;
}

function clickNode(node)
{
  loadData(node.fullname);
//  var target="./daffodil.html?q=" + escape(node.fullname)
//  window.location = target;
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
