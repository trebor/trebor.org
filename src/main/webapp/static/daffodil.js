var dataSource = "/rdf?q=" + escape(getParameterByName("q"));
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var r = (Math.min(w, h) / 2) - 50;
var iconSize = 12

var tree = d3.layout.tree()
    .size([360, r])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

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
    .append("path")
    .attr("class", "link")
    .attr("d", diagonal);
//     .append("text")
//     .attr("dx", function(d) {return d.x;})
//     .attr("dy", function(d) {return d.y;})
//     .text("foobar");
    
  
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

  
  node
    .filter(function (d) {return d.type == "URI";})
    .append("circle")
    .attr("class", "uri-icon")
    .attr("r", iconSize)
    .on("click", clickNode);

  node
    .filter(function (d) {return d.type == "BLANK";})
    .append("circle")
    .attr("class", "blank-icon")
    .attr("r", iconSize - 3);

  node
    .filter(function (d) {return d.type == "LITERAL";})
    .append("rect")
    .attr("class", "literal-icon")
    .attr("x", -iconSize)
    .attr("y", -iconSize)
    .attr("width", 2 * iconSize)
    .attr("height",2 * iconSize)
    .attr("transform", function(d) {return "rotate( " + -d.x + " )";});


  node.append("text")
    .attr("class", "shortText")
    .attr("dx", "0em")
    .attr("dy", "-1.5em")
    .attr("text-anchor", "middle")
    .attr("transform", function(d) { return "rotate( " + (90 - d.x) + " )"; })
    .text(function(d) { return d.name; });

  node.append("text")
    .attr("class", "fullText")
    .attr("dx", "0em")
    .attr("dy", "-1.5em")
    .attr("text-anchor", "middle")
    .attr("transform", function(d) { return "rotate( " + (90 - d.x) + " )"; })
    .attr("visibility", "hidden")
    .text(function(d) { return d.fullname; });
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
