var dataSource = "/menu/" + getUrlVars()["page"];
var iconBasePath = "assets/icons/";
var iconType = ".png";
var w = window.innerWidth;
var h = window.innerHeight - 6;
var mx = w / 2;
var my = h / 2;
var node;
var link;
var root;
var summaryBoxEmWide = 30;
var summaryBoxEmHigh = 30;
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
  .charge(-100)
  .linkDistance(linkDistance)
  .linkStrength(0.4);

//  create the svg work area

var vis = d3
  .select("#chart")
  .append("svg")  
  .attr("class", "svg-area");

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

function stripHtml(html)
{
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent||tmp.innerText;
}

d3.json(dataSource, function(json)
{
  root = json;
  document.title = stripHtml(root.title);
  root.fixed = true;
  root.x = mx;
  root.y = my;
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
    .on("click", null);
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
    .html(getNodeClickText);

  // add summary text

  var text = en.filter(function(d) {return d.title || d.summary;})
    .append("svg:foreignObject")
    .attr("class", "summaryTextObject")
    .attr("x", assignSummaryPositionX)
    .attr("y", assignSummaryPositionY)
    .style("visibility", "hidden")
    .attr("width", summaryBoxEmWide + "em")
    .attr("height", summaryBoxEmHigh + "em")
    .append("xhtml:body")
    .attr("class", "summaryText")
    .html(nodeHtml);

  // remove old nodes
  
  node.exit().remove();
}

function assignSummaryPositionX(d)
{
  var boxWidth = getEmSize(this) * summaryBoxEmWide;
  var halfIcon = iconSize(d) / 2;
  return (d.x > mx) ? -(halfIcon + boxWidth) : halfIcon;
}

function assignSummaryPositionY(d)
{
  var halfIcon = iconSize(d) / 2;
  return -halfIcon;
}

function nodeHtml(node)
{
  var parentName = node.parentName;
  var home  = "<a href=\"fdlmenu.html?page=home\">home</a>";
  var focus = "<a href=\"fdlmenu.html?page=" + node.name + "\">focus</a>";
  var site  = "<a href=\"sitemap.html?page=home\">site-map</a>";
  var up    = "<a href=\"fdlmenu.html?page=" + parentName + "\">up</a>";
  var title = node.title ? "<big>" + node.title + "</big>" : "";
  var summary = node.summary ? node.summary : "";
  var menu  = 
    "<p class=\"nodeMenu\" align=\"right\">" +
    (root.name != "home"                     ? home  + "&nbsp;" : "") +
    (node.name == root.name && parentName    ? up    + "&nbsp;" : "") +
    (node.name != root.name                  ? focus + "&nbsp;" : "") +
    (true                                    ? site  + "&nbsp;" : "") +
    "</p>";
  var table = 
    "<table class=\"summaryBanner\">" +
    "<tr><td>" + title + "</td><td> " +  menu + "</td></tr>" +
    "<tr><td colspan=\"2\">" + summary + "</td></tr>" +
   "</table>";

  return table;
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
var nodeIconFadeTo = 0.1;
var linkFadeTo = 0;

function mouseoverNode(node, index)
{
  var targetClass = $(d3.event.target).attr("class");

  // make visible the summary and node icon

  vis
    .selectAll(".summaryText, .nodeActionIcon")
    .filter(function (d) {return d == node;})
    .style("visibility", "visible");

  // set posiont of summar text based on node icon postion on the page

  vis
    .selectAll(".summaryTextObject")
    .filter(function (d) {return d == node;})
    .attr("x", assignSummaryPositionX)
    .attr("y", assignSummaryPositionY);

  // found out the other nodes and edges

  fadeToOpacity(node, ".nodeIcon", nodeIconFadeTo);
  fadeToOpacity(node, ".link", linkFadeTo);

  // if this is a node icon, sort selected element to the top of the view

  if (targetClass == "nodeIcon")
      moveToTop(node);
}

function mouseoutNode(node)
{
  // hide summar, node action icon and click text

  vis
    .selectAll(".summaryText, .nodeActionIcon, .clickText")
    .filter(function (d) {return d == node;})
    .style("visibility", "hidden");

  // fade everything else back up to normal opacity

  fadeToOpacity(node, ".nodeIcon", 1);
  fadeToOpacity(node, ".link", 1);
}

function moveToTop(node)
{
  // get all the nodes

 var nodes = vis.selectAll(".node");
  
  // figure out if our target node is alreayd last

  var lastIndex = nodes[0].length - 1;
  var alreadyLast = false;
  nodes.each(function (n, i) 
  {
    if (i == lastIndex && n == node) 
      alreadyLast = true;
  });

  // if it is, no need to sort

  if (alreadyLast)
    return;

  // sort target node to last (top)

  nodes.sort(function(a, b) 
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
      // this assumes all nodes go live at the same time, bad!

      vis.selectAll("g.node")
        .each(enableMouseInteraction);

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
  return ((iconSize(link.source) + iconSize(link.target)) / 2 + nodeBuffer);
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

    // disable mouse interaction with all nodes

    vis.selectAll("g.node")
      .each(disableMouseInteraction);


    // fix it so it doesn't move

    node.fixed = true;

    // set parent weighting

    var growDuration = 500;
    var growLengthEase = "linear";
    var growSizeEase = "linear";


    for (i in node.children)
    {
      var child = node.children[i];
      
      // transition in the weight of the parent node in the position calcluation
      
      vis.selectAll("g.node")
        .filter(function (d) {return d.name == child.name;})
        .attr("parent-weight", 1)
        .transition()
        .ease(function (t) {
          var x = Math.cos(t * (Math.PI / 2) + Math.PI) + 1;
          return t >= 1 ? 1 : x;
        })
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
