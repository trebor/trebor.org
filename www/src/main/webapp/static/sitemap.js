var dataSource = "/menu/" + getNodeName();
var iconBasePath = "/static/assets/icons/";
var iconType = ".png";
var iconSize = 20;
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var maxWidth = 20;
var minWidth = 1;

var cluster = d3.layout.cluster()
    .size([h, w - 450]);

var vis = d3.select("#chart")
    .append("svg")
    .attr("class", "svg-area")
    .append("g")
    .attr("transform", "translate(150, 0)");

d3.json(dataSource, function(json) 
{
  var nodes = cluster.nodes(json);

  // establish min and max hit counts

  var minHit = Number.MAX_VALUE;
  var maxHit = Number.MIN_VALUE;
  var totHit = 0;
  for (var i in nodes)
  {
    var node = nodes[i];
    node.hitCount = parseInt(node.hitCount);
    totHit += node.hitCount;
    minHit = Math.min(node.hitCount, minHit);
    maxHit = Math.max(node.hitCount, maxHit);
  }

  // compute traffic proportion by node

  for (var i in nodes)
  {
    var node = nodes[i];
    node.trafficProportion = Math.round(100 * node.hitCount / totHit) / 100;
    node.trafficPercent = Math.floor(node.trafficProportion * 100);
  }

  // establish scale to map between hit count and width

  var widthScale = d3.scale.linear().domain([minHit, maxHit]).range([minWidth, maxWidth]);

  var diagonal1 = d3.svg.diagonal()
    .source(function(d) {return {x: d.source.x + widthScale(d.source.hitCount), y: d.source.y};})
    .target(function(d) {return {x: d.target.x + widthScale(d.target.hitCount), y: d.target.y};})
    .projection(function(d) { return [d.y, d.x]; });

  var diagonal2 = d3.svg.diagonal()
    .source(function(d) {return {x: d.target.x - widthScale(d.target.hitCount), y: d.target.y};})
    .target(function(d) {return {x: d.source.x - widthScale(d.source.hitCount), y: d.source.y};})
    .projection(function(d) { return [d.y, d.x]; });

  var link = vis.selectAll("path.connect")
    .data(cluster.links(nodes))
    .enter();

  link.append("path")
    .attr("class", "connect")
    .attr("d", function (d) {return diagonal1(d) + diagonal2(d).replace("M", "L") + "z";});

  var node = vis.selectAll("g.node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .on("mouseover", mouseoverIcon)
    .on("mouseout", mouseoutIcon)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

  node.append("svg:circle")
    .attr("class", "connectEnd")
    .attr("r", function (d) {return widthScale(d.hitCount);});

  node.append("svg:image")
    .attr("class", "nodeIcon")
    .attr("xlink:href", function(d) {return iconPath(d.iconName);})
    .attr("x", iconSize / -2)
    .attr("y", iconSize / -2)
    .attr("width", iconSize)
    .attr("height", iconSize)
    .on("click", function (d) {window.location = getNodeUrl(d);});

  node.append("foreignObject")
    .attr("class", "titleObject")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", "20em")
    .attr("height", "1.5em")
    .attr("x", function(d) { return d.children ? "-21.3em" : "1em";})
    .attr("y", "-.65em")
    .append("xhtml:body")
    .attr("class", "title")
    .attr("align", function (d) {return d.children ? "right" : "left";})
    .style("text-align", function (d) {return d.children ? "right" : "left";})
    .html(nodeName);

  node.append("foreignObject")
    .attr("class", "trafficObject")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", "8em")
    .attr("height", "1.5em")
    .attr("opacity", 0)
    .attr("x", function(d) { return !d.children ? "-9.3em" : "1em";})
    .attr("y", "-.65em")
    .append("xhtml:body")
    .attr("class", "traffic")
    .attr("align", function (d) {return !d.children ? "right" : "left";})
    .style("text-align", function (d) {return !d.children ? "right" : "left";})
    .html(nodeTraffic);
});

function mouseoverIcon(node)
{
  console.log("over");
  d3.selectAll(".trafficObject")
    .filter(function (d) {return d == node;})
    .transition()
    .attr("opacity", 1);
}

function mouseoutIcon(node)
{
  d3.selectAll(".trafficObject")
    .filter(function (d) {return d == node;})
    .transition()
    .attr("opacity", 0);

}


function nodeName(node)
{
  return "<a href=\"" + getNodeUrl(node) + "\">" + strip(node.title) + "</a>";
}

function nodeTraffic(node)
{
  var viewTag = node.hitCount == 1 ? " view " : " views ";
  return node.hitCount + viewTag + node.trafficPercent + "%";
}

function getNodeUrl(node)
{
  return "/fdl/" + node.name;
}

function iconPath(name)
{
  return iconBasePath + name + iconType;
}

function strip(html)
{
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText;
}

function getNodeName()
{
  var tokens = window.location.href.split('/');
  return tokens[tokens.length - 1];
}

function getUrlVars()
{
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, 
      function(m,key,value)
      {
        vars[key] = value;
      });
  return vars;
}
