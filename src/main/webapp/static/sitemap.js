var dataSource = "/trebor/tree/" + getUrlVars()["page"];
var iconBasePath = "assets/icons/";
var iconType = ".png";
var iconSize = 20;
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;

var cluster = d3.layout.cluster()
    .size([h, w - 600]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h)
    .append("g")
    .attr("transform", "translate(200, 0)");

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

  node.append("svg:foreignObject")
    .attr("width", "20em")
    .attr("height", "3em")
    .attr("x", function(d) { return d.children ? "-20.5em" : "0.5em"; })
    .attr("y", "-1.6em")
    .append("xhtml:body")
    .html(nodeName);
});

function nodeName(node)
{
  var align = node.children ? "right" : "left";
  var title = 
    "<a href=\"" + getNodeUrl(node) + "\">" + strip(node.title) + "</a>";
  return "<p align=\"" + align + "\">" + title + "</p>";
}

function getNodeUrl(node)
{
  return "treemenu.html?page=" + node.name;
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
