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
  .charge(-50)
  .linkDistance(linkDistance)
  .linkStrength(0.3)
  .size([w, h]);

//  create the svg work area

var vis = d3
  .select("#chart")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

// custom drag behavior

var customDrag = d3.behavior.drag()
  .on("dragstart", dragstart)
  .on("drag", dragmove)
  .on("dragend", dragend);

function dragstart(d, i) 
{
  d.fixed = true;
}

function dragmove(d, i) 
{
  d.px += d3.event.dx;
  d.py += d3.event.dy;
  force.resume();
}

function dragend(d, i)
{
  if (d != root)
    d.fixed = false;
}

d3.json(dataSource, function(json)
{
  root = json;
  root.fixed = true;
  root.x = w / 2;
  root.y = h / 2;
  update();

  // close all nodes for starters

  toggleChildren(root);
  
  // enable root mouse interaction
 
  enableMouseInteraction(root);
});

function enableMouseInteraction(target)
{
  node
    .filter(function(d) {return d == target;})
    .on("mouseover", mouseoverNode)
    .on("mouseout", mouseoutNode);

  vis
    .selectAll(".nodeIcon")
    .filter(function(d) {return d == target;})
    .on("click", click);
}

function disableMouseInteraction(target)
{
  node
    .filter(function(d) {return d == target;})
    .on("mouseover", null)
    .on("mouseout", null);

  vis
    .selectAll(".nodeIcon")
    .filter(function(d) {return d == target;})
    .on("click", click);
}

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
    .attr("opacity", 1)
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

  // on the new "enter" nodes create an svg  group element
  
  var en = node
    .enter()
    .append("svg:g")
    .attr("class", "node")
    .style("visibility", "hidden")
    .call(customDrag);

  // add node icon

  en.append("svg:image")
    .attr("class", "nodeIcon")
    .attr("xlink:href", function(d) {return iconPath(d.iconName);})
    .attr("opacity", 1)
    .attr("x", iconPosition)
    .attr("y", iconPosition)
    .attr("width", iconSize)
    .attr("height", iconSize);


  // add node action icon

  en.filter(selectIcon)
    .append("svg:image")
    .attr("class", "nodeActionIcon")
    .style("visibility", "hidden")
    .attr("opacity", 1)
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
    .attr("class", "clickText")
    .attr("opacity", 1)
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
    .attr("opacity", 1)
    .html(nodeHtml);

  // remove old nodes
  
  node.exit().remove();
}

function nodeHtml(node)
{
  var home = "<a href=\"treemenu.html?page=home\">home</a>";
  var zoom = "<a href=\"treemenu.html?page=" + node.name + "\">zoom node</a>";
  var site = "<a color=\"red\" href=\"sitemap.html?page=home\">site map</a>";
  var title = node.title ? "<big>" + node.title + "</big>" : "";
  var space1 = node.title && node.summary ? "<br/><br/>" : "";
  var summary = node.summary ? node.summary : "";
  var space2 = node.title || node.summary ? "<br/><br/>" : "";
  var menu  = 
    "<p class=\"nodeMenu\" align=\"right\">" +
    (root.name != "home" ? home + "&nbsp;" : "") +
    (node.name != root.name ? zoom : site)  + "&nbsp;" +
    "</p>";

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

var fadeDuration = 250;
var nodeIconFadeTo = 0.2;
var linkFadeTo = 0;

function mouseoverNode(node)
{
  vis
    .selectAll(".summaryText, .nodeActionIcon")
    .filter(function (d) {return d == node;})
    .style("visibility", "visible");

  // found out the other nodes and edges

  fadeToOpacity(node, ".nodeIcon", nodeIconFadeTo);
  fadeToOpacity(node, ".link", linkFadeTo);

  // sort selected element to the top of the view

  moveToTop(node);
}

function moveToTop(node)
{
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

  fadeToOpacity(node, ".nodeIcon", 1);
  fadeToOpacity(node, ".link", 1);
}

function fadeToOpacity(allBut, type, fadeTo)
{
  vis
    .selectAll(type)
    .filter(function (d)
    {
      return d != allBut;
    })
    .transition()
    .duration(fadeDuration)
    .attr("opacity", fadeTo);
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

function tick() 
{
  // handle node growth
  
  node
    .filter(function(d) {return $(this).attr("parent-weight");})
    .each(function (d) 
    {
      var parentWeight = $(this).attr("parent-weight");
      d.x = weight(d.parent.x, d.x, parentWeight);
      d.y = weight(d.parent.y, d.y, parentWeight);
      force.resume();
    })
    .filter(function(d) {return $(this).attr("parent-weight") == 0;})
    .attr("parent-weight", null);

  // update node scale
  
  node
    .style("visibility", "visible")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  node
    .selectAll(".nodeIcon")
    .filter(function(d) {return $(this).attr("node-icon-scale");})
    .attr("transform", function(d) 
          {
            force.resume();
            return "scale(" + $(this).attr("node-icon-scale") + ")";
          })
    .filter(function(d) {return $(this).attr("node-icon-scale") == 1;})
    .attr("node-icon-scale", null)
    .each(function (d)
    {
      enableMouseInteraction(d);
      enableMouseInteraction(d.parent);
      if (d.parent != root)
        d.parent.fixed = false;
    });

  // update link position
    
  link
    .style("visibility", "visible")
    .attr("x1", function(d) {return d.source.x;})
    .attr("y1", function(d) {return d.source.y;})
    .attr("x2", function(d) {return d.target.x;})
    .attr("y2", function(d) {return d.target.y;});

}

function weight(a, b, aWeight)
{
  return a * aWeight + b * (1 - aWeight);
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
  return ((iconSize(link.source) + iconSize(link.target)) / 2 + nodeBuffer) * 0.9;
}

// collapse all a nodes children nodes (transitive)

function collapseChildren(node)
{
  if (!node.children)
    return;
    
  for (i in node.children)
    collapseChildren(node.children[i]);

  node._children = node.children;
  node.children = null;
}

// expand a nodes children (one level deep only)

function expandChildren(node)
{
  node.children = node._children;
  node._children = null;
}

// toggle children open or closed

function toggleChildren(node)
{
  if (node.children) 
    collapseChildren(node);
  else if (node._children)
    expandChildren(node);

  // update action icon

  vis
    .selectAll(".nodeActionIcon")
    .filter(function (d) {return d == node;})
    .attr("href", selectIcon(node));

  // update click text

  vis
    .selectAll(".clickText")
    .filter(function (d) {return d == node;})
    .html(getNodeClickText);

 // upate tree

  update();
}

function getNodeClickText(node)
{
  return "<center>" + node.clickAct + "</center>";
}

// handle a node click

function click(node)
{
  // if collapse node

  if (node.children)
  {
    // collapse children

    toggleChildren(node);
  }

  // if expand  node

  else if (node._children)
  {
    // expand children

    toggleChildren(node);

    // move node to top

    moveToTop(node);

    // turn off node summary if showing

    mouseoutNode(node);

    // disable mouse interaction

    disableMouseInteraction(node);

    // fix it so it doesn't move

    node.fixed = true;

    // set parent weighting

    var growDuration = 800;
    var growLengthEase = "sin-out";
    var growSizeEase = "linear";


    for (i in node.children)
    {
      var child = node.children[i];
      
      // transition in the weight of the parent node in the position calcluation
      
      vis.selectAll("g.node")
        .filter(function (d) {return d.name == child.name;})
        .each(disableMouseInteraction)
        .attr("parent-weight", 1)
        .transition()
        .ease(growLengthEase)
        .duration(growDuration)
        .attr("parent-weight", 0);
      
      // transition in size of the node
      
      vis.selectAll("g.node")
        .filter(function (d) {return d.name == child.name;})
        .selectAll(".nodeIcon")
        .attr("node-icon-scale", 0)
        .transition()
        .duration(growDuration * 3)
        .ease(growSizeEase)
        .attr("node-icon-scale", 1);
    }
  }
  else if (node.image)
  {
    mouseoutNode(node);
    jQuery.slimbox(node.image, node.imageDescription,
    {
      overlayOpacity: 0.5,
      overlayFadeDuration: 250,
      resizeDuration: 250,
      captionAnimationDuration: 250,
    });
  }
  else if (node.link)
  {
    if (isLocalUrl(node.link))
      window.location = node.link;
    else
      window.open(node.link, '_blank');
  }
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
            v.parent = node;
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
