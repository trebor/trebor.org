var dataSource = "/trebor/tree/" + getUrlVars()["page"];
var iconBasePath = "assets/icons/";
var iconType = ".png";
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var node;
var link;
var root;
var discount = 0.8;
var nodeSize = 150;
var nodeOffset = nodeSize / 2;
var linkLength = nodeSize * 0.95;
var actionIconSize = nodeSize * 0.25;
var nodeBuffer = 20;

//construct the force layout

var force = d3
  .layout
  .force()
  .on("tick", tick)
  .gravity(0)
  .charge(-200)
  .linkDistance(linkDistance)
  .size([w, h]);

//  create the svg work area

var vis = d3
  .select("#chart")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

d3.json(dataSource, function(json)
{
  root = json;
  root.fixed = true;
  root.x = w / 2;
  root.y = h / 2;
  update();

  // close all nodes for starters

  vis.selectAll("g.node").each(toggleChildren);
});

function update() 
{
  var nodes = flatten(root);
  var links = d3.layout.tree().links(nodes);

  // restart the force layout.
  
  force.nodes(nodes).links(links).start();

  // update the links
  
  link = vis
    .selectAll("line.link")
    .data(links, function(d) {return d.target.id;});

  // enter any new links
  
  link.enter()
    .insert("line", ".node")
    .attr("class", "link")
    .style("visibility", "hidden")
    .attr("x1",  function(d) {return d.source.x;})
    .attr("y1", function(d) {return d.source.y;})
    .attr("x2", function(d) {return d.target.x;})
    .attr("y2", function(d) {return d.target.y;});

  // exit any old links
  
  link.exit().remove();

  // select all nodes and add new nodes
  
  node = vis
    .selectAll("g.node")
    .data(nodes, function(d) {return d.id;});

  // on the new "enter" nodes add drag and click
  
  var en = node
    .enter()
    .append("svg:g")
    .attr("class", "node")
    .style("visibility", "hidden")
    .on("mouseover", mouseoverNode)
    .on("mouseout", mouseoutNode)
    .call(force.drag);

  // add node icon

  en.append("svg:image")
    .attr("class", "nodeIcon")
    .attr("xlink:href", function(d) {return iconPath(d.iconName);})
    .attr("x", iconPosition)
    .attr("y", iconPosition)
    .attr("width", iconSize)
    .attr("height", iconSize)
    .on("click", click);

  // add node action icon

  en.filter(selectIcon)
    .append("svg:image")
    .attr("class", "nodeActionIcon")
    .style("visibility", "hidden")
    .attr("xlink:href", selectIcon)
    .attr("x", function(d) {return iconSize(d) / -2;})
    .attr("y", function(d) {return iconSize(d) / 2 - actionIconSize;})
    .attr("width", actionIconSize)
    .attr("height", actionIconSize)
    .on("mouseover", mouseoverActionIcon)
    .on("mouseout", mouseoutActionIcon)
    .on("click", click);

  // add click text
  
  en.filter(selectIcon)
    .append("svg:foreignObject")
    .attr("class", "clickTextObject")
    .style("visibility", "hidden")
    .attr("width", "10em")
    .attr("height", "2em")
    .attr("x", function(d) {return (iconSize(d) / -2) - (getEmSize(this) * 5) + actionIconSize / 2;})
    .attr("y", function(d) {return iconSize(d) / 2 - getEmSize(this) / 2;})
    .append("xhtml:body")
    .style("visibility", "hidden")
    .attr("class", "clickText")
    .html(getNodeClickText);

  // add summary text

  var text = en.filter(function(d) {return d.title || d.summary;})
    .append("svg:foreignObject")
    .attr("class", "summaryTextObject")
    .style("visibility", "hidden")
    .attr("y", function(d) {return iconSize(d) / -2 - getEmSize(this) * .45;})
    .attr("x", function(d) {return iconSize(d) / 2 - getEmSize(this) * .45;})
    .attr("width", "25em")
    .attr("height", "20em")
    .append("xhtml:body")
    .attr("class", "summaryText")
    .html(nodeHtml);

  // remove old nodes
  
  node.exit().remove();
}

function nodeHtml(node)
{
  var home = "<a href=\"treemenu.html?page=home\">home</a>";
  var zoom = "<a href=\"treemenu.html?page=" + node.name + "\">zoom node</a>";
  var site = "<a href=\"sitemap.html?page=home\">site map</a>";
  var title = node.title ? "<big>" + node.title + "</big>" : "";
  var space1 = node.title && node.summary ? "<br/><br/>" : "";
  var summary = node.summary ? node.summary : "";
  var space2 = node.title || node.summary ? "<br/><br/>" : "";
  var menu  = 
    "<small>" +
    (root.name != "home" ? home + "&nbsp;" : "") +
    (node.name != root.name ? zoom : site)  + "&nbsp;" +
    "<\small>";

  return title + space1 + summary + space2 + menu;
}

function mouseoverActionIcon(icon)
{
   vis.selectAll(".clickText")
    .filter(function (d) {return d == icon;}).style("visibility", "visible");
}

function mouseoutActionIcon(icon)
{
   vis.selectAll(".clickText")
    .filter(function (d) {return d == icon;}).style("visibility", "hidden");
}


function mouseoverNode(node)
{
  vis
    .selectAll(".summaryText, .nodeActionIcon")
    .filter(function (d) {return d == node;})
    .style("visibility", "visible");

  vis
    .selectAll(".link")
    .transition()
    .attr("opacity", "0");

  vis
    .selectAll(".nodeIcon")
    .filter(function (d) {return d != node;})
    .transition()
    .attr("opacity", "0.2");

  vis.selectAll(".node").sort(function(a, b) 
  {
    if (a == node)
      return 1;

    if (b == node)
      return -1;

     if (a.name < b.name)
       return 1;

     if (a.name > b.name)
       return -1;

    return 0;
  });
}

function mouseoutNode(node)
{
  vis
    .selectAll(".summaryText, .nodeActionIcon")
    .filter(function (d) {return d == node;})
    .style("visibility", "hidden");

  vis
    .selectAll(".nodeIcon")
    .filter(function (d) {return d != node;})
    .transition()
    .attr("opacity", "1");

  vis
    .selectAll(".link")
    .transition()
    .attr("opacity", "1");
}

function getEmSize(el)
{
  return Number(getComputedStyle(el, '').fontSize.match(/(\d+)px/)[1]);
}

function selectIconName(node)
{
  var iconName = null;
  
  if (node._children)
  {
    node.clickAct = "expand";
    iconName = "expand";
  }

  else if (node.children)
  {
    node.clickAct = "collapse";
    iconName = "collapse";
  }    
  else if (node.link)
  {
      if (isLocalUrl(node.link))
      {
          node.clickAct = "link";
          iconName = "inlink";
      }
      else
      {
          node.clickAct = "exteranl link";
          iconName = "link";
      }
  }
  else if (node.image)
  {
    node.clickAct = "view image";
    iconName = "image";
  }
  
  return iconName;
}

function selectIcon(node)
{
  var iconName = selectIconName(node);
  return iconName ? iconPath(iconName) : null;
}

function tick() {
  link
    .style("visibility", "visible")
    .attr("x1", function(d) {return d.source.x;})
    .attr("y1", function(d) {return d.source.y;})
    .attr("x2", function(d) {return d.target.x;})
    .attr("y2", function(d) {return d.target.y;});

  node
    .style("visibility", "visible")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function iconPath(name)
{
  return iconBasePath + name + iconType;
}

// establish the icon position for a given node

function iconPosition(node)
{
  return -iconSize(node) / 2;
}

// establish the icon size for a given node

function iconSize(node)
{
  return nodeSize * Math.pow(discount, node.depth);
}

// establish the distance between two links

function linkDistance(link) 
{
  return (iconSize(link.source) + iconSize(link.target)) / 2 + nodeBuffer;
}

// toggle children open or closed

function toggleChildren(node)
{
  if (node.children) 
  {
    node._children = node.children;
    node.children = null;
  }
  else if (node._children)
  {
    node.children = node._children;
    node._children = null;
  }

  // update icon

  vis
    .selectAll("[class=nodeActionIcon]")
    .filter(function (d) {return d == node;})
    .attr("href", selectIcon(node));

  vis
    .selectAll("[class=clickText]")
    .filter(function (d) {return d == node;})
    .html(getNodeClickText);

  update();
}

function getNodeClickText(node)
{
  return "<center>" + node.clickAct + "</center>";
}


// handle a node click

function click(node)
{
  if (node.children || node._children)
    toggleChildren(node);
  else if (node.image)
    jQuery.slimbox(node.image, node.imageDescription,
    {
      overlayOpacity: 0.5,
      overlayFadeDuration: 250,
      resizeDuration: 250,
      captionAnimationDuration: 250,
    });
  else if (node.link)
  {
    if (isLocalUrl(node.link))
      window.location = node.link;
    else
      window.open(node.link, '_blank');
  }
  
  mouseoverNode(node);
}

// tests if a url is local to this domain

function isLocalUrl(url)
{
  return url.indexOf("http") != 0;
}

// returns a list of all nodes under the root

function flatten(root) 
{
  var nodes = [], i = 0;

  function recurse(node, depth)
  {
    if (node.children)
      node.size = node.children.reduce(
          function(p, v)
          {
            return p + recurse(v, depth + 1);
          }, 0);
    if (!node.id)
      node.id = ++i;
    nodes.push(node);
    node.depth = depth;
    return node.size;
  }

  root.size = recurse(root, 0);
  return nodes;
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


function display(thing)
{
  if (!thing)
    console.log(typeof(thing), ": NULL");
  else if (thing instanceof Array)
  {
    console.log("array: ");
    for (n in thing)
      console.log("   ", typeof(thing[n]), " [", n, "]: ", thing[n]);
  } 
  else
    console.log(typeof(thing), ": ", thing);
}
