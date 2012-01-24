var dataSource = "/menu/" + getNodeName();
var iconBasePath = "/static/assets/icons/";
var iconType = ".png";
var iconSize = 20;
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;

var cluster = d3.layout.cluster()
    .size([h, w - 450]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#chart")
    .append("svg")
    .attr("class", "svg-area")
    .append("g")
    .attr("transform", "translate(150, 0)");

d3.json(dataSource, function(json) 
{
  var nodes = cluster.nodes(json);

  var link = vis.selectAll("path.link")
    .data(cluster.links(nodes))
    .enter().append("path")
    .attr("class", "link")
    .attr("d", diagonal);

  var node = vis.selectAll("g.node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

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
    .attr("x", function(d) { return d.children ? "-21em" : "1em";})
    .attr("y", "-.65em")
    .append("xhtml:body")
    .attr("class", "title")
    .attr("align", function (d) {return d.children ? "right" : "left";})
    .style("text-align", function (d) {return d.children ? "right" : "left";})
    .html(nodeName);
});

function nodeName(node)
{
  return "<a href=\"" + getNodeUrl(node) + "\">" + strip(node.title) + "</a>";
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
