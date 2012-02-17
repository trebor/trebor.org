var dataSource = "/rdf?q=" + escape(getParameterByName("q"));
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var r = (Math.min(w, h) / 2) - 50;
var iconSize = 12
var nodeCircleRadius = 40;

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

d3.json(dataSource, function(json) {
  var nodes = tree.nodes(json);

  var link = vis.selectAll("path.link")
    .data(tree.links(nodes))
    .enter()
    .append("g")
    .attr("class", "linkg");

 link
    .append("path")
    .attr("id", function(d) {return d.target.predicate.name + d.target.name;})
    .attr("class", "link")
    .attr("d", hackedDiagonal);

  link
    .append("text")
    .attr("class", "predicateText")
    .attr("dy", "0.25em")
    .append("textPath")
    .attr("xlink:href", function(d) 
          {
            return "#" + d.target.predicate.name + d.target.name;
          })
    .attr("startOffset", nodeCircleRadius + 18)
    .text(function(d) {return d.target.predicate.name;});

  link
    .append("text")
    .attr("class", "predicateArrow")
    .attr("dy", "0.41em")
    .append("textPath")
    .attr("xlink:href", function(d) 
          {
            return "#" + d.target.predicate.name + d.target.name;
          })
    .attr("startOffset", nodeCircleRadius)
    .text(function(d) {return String.fromCharCode(0x25b6);});


  var node = vis.selectAll("g.node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d)
          {
            return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
          })
    .on("mouseover", focusNode)
    .on("mouseout", defocusNode);

  // add backing circle

  node
    .filter(function (d) {return d.type != "BLANK";})
    .append("circle")
    .attr("class", "nodeCircle")
    .attr("r", nodeCircleRadius);

  // add circle path for text

  node
    .filter(function(d) {return d.type != "BLANK";})
    .append("path")
    .attr("id", function (d, i) {return ("" + i + d.name);})
    .attr("d", function() {return cubicCircle(0, 0, nodeCircleRadius - 16);})
    .style("fill", "none");

  // add text to circle path

  node
    .filter(function(d) {return d.type != "BLANK";})
    .append("text")
    .attr("class", "circleText")
    .attr("dy", "0")
    .attr("transform", function(d) { return "rotate( " + (180 - d.x) + " )"; })
    .append("textPath")
    .attr("xlink:href", function(d, i) {return "#" + i + d.name;})
    .attr("startOffset", "50%")
    .text(function (d) {return d.name;});
  
  // add URI icon

  node
    .filter(function (d) {return d.type == "URI";})
    .append("circle")
    .attr("class", "uri-icon")
    .attr("r", iconSize)
    .on("click", clickNode);

  // add BLANK icon

  node
    .filter(function(d) {return d.type == "BLANK";})
    .append("circle")
    .attr("class", "blank-icon")
    .attr("r", iconSize - 3);

  // add LITERAL icon

  node
    .filter(function (d) {return d.type == "LITERAL";})
    .append("rect")
    .attr("class", "literal-icon")
    .attr("x", -iconSize)
    .attr("y", -iconSize)
    .attr("width", 2 * iconSize)
    .attr("height",2 * iconSize)
    .attr("transform", function(d) {return "rotate( " + -d.x + " )";});
});

function focusNode(node)
{
  vis
    .selectAll(".node")
    .filter(function (d) {return d != node;})
    .style("opacity", "0.2");

  vis
    .selectAll(".shortText")
    .filter(function (d) {return d == node;})
    .style("visibility", "hidden");

  vis
    .selectAll(".fullText")
    .filter(function (d) {return d == node;})
    .style("visibility", "visible");
}

function defocusNode(node)
{
  vis
    .selectAll(".node")
    .filter(function (d) {return d != node;})
    .style("opacity", "1");

  vis
    .selectAll(".shortText")
    .filter(function (d) {return d == node;})
    .style("visibility", "visible");

  vis
    .selectAll(".fullText")
    .filter(function (d) {return d == node;})
    .style("visibility", "hidden");
}

function clickNode(node)
{
  var target="./daffodil.html?q=" + escape(node.fullname)
  window.location = target;
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
