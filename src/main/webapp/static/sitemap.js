var dataSource = "/menu/" + getUrlVars()["page"];
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

  node.append("foreignObject")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", "20em")
    .attr("height", "1.5em")
    .attr("x", function(d) { return d.children ? "-21em" : "1em"; })
    .attr("y", "-.75em")
    .append("xhtml:body")
    .style("margin", "0")
    .html(nodeName);
});

function nodeName(node)
{
  var align = node.children ? "style=\"float:right;\"" : "";
  return "<a " + align + " href=\"" + getNodeUrl(node) + "\">" + strip(node.title) + "</a>";
}

function getNodeUrl(node)
{
  return "fdlmenu.html?page=" + node.name;
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
