var dataSource = "/trebor/tree.json";
var imagesPath = "image/";
var imageType = ".png";
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var node;
var link;
var root;
var discount = 0.8;
var nodeSize = 120;
var nodeOffset = nodeSize / 2;
var linkLength = nodeSize * 0.95;
var iconSize = nodeSize * 0.25;
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

  // Restart the force layout.
  force.nodes(nodes).links(links).start();

  // Update the links
  link = vis
    .selectAll("line.link")
    .data(links, function(d) {return d.target.id;});

  // Enter any new links.
  link.enter()
    .insert("line", ".node")
    .attr("class", "link")
    .attr("x1",  function(d) {return d.source.x;})
    .attr("y1", function(d) {return d.source.y;})
    .attr("x2", function(d) {return d.target.x;})
    .attr("y2", function(d) {return d.target.y;});

  // Exit any old links.
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
    .on("click", click)
    .call(force.drag);

  // add node image

  en.append("svg:image")
    .attr("class", "nodeImage")
    .attr("xlink:href", function(d) {return imagePath(d.imageName);})
    .attr("x", imagePosition)
    .attr("y", imagePosition)
    .attr("width", imageSize)
    .attr("height", imageSize);

  // add node icon

  en.append("svg:image")
    .attr("class", "nodeIcon")
    .attr("xlink:href", selectIcon)
    .attr("x", function(d) {return imageSize(d) / -2;})
    .attr("y", function(d) {return imageSize(d) / -2;})
    .attr("width", iconSize)
    .attr("height", iconSize);
  
  // add node text
  
  en.append("svg:text")
    .attr("class", "nodeText")
    .attr("dx", 0)
    .attr("dy", function(d) {return imageSize(d) / 2 + 15;})
    .attr("text-anchor", "middle")
    .text(function(node) {return node.name;});
  
  // add summary icon

  en.filter(function(d) {return d.summary != null;})
    .append("svg:image")
    .attr("class", "summaryIcon")
    .attr("xlink:href", function(d) {return imagePath("summary");})
    .attr("x", function(d) {return (imageSize(d) / 2) - iconSize;})
    .attr("y", function(d) {return imageSize(d) / -2;})
    .attr("width", iconSize)
    .attr("height", iconSize);

  // add summary text

  en.filter(function(d) {return d.summary != null;})
    .append("svg:text")
    .attr("class", "summaryText")
    .attr("dx", function(d) {return imageSize(d) / 2;})
    .attr("dy", 0)
    .attr("text-anchor", "start")
    .text(function(node) {return node.summary;});

  // remove old nodes
  
  node.exit().remove();
}

function selectIcon(node)
{
  var imageName = "unknown";
  
  if (node._children)
    imageName = "expand";

  else if (node.children)
    imageName = "collapse";
    
  else if (node.link)
    imageName = isLocalUrl(node.link) ? "inlink" : "link";

  return imagePath(imageName);
}

function tick() {
  link
    .attr("x1", function(d) {return d.source.x;})
    .attr("y1", function(d) {return d.source.y;})
    .attr("x2", function(d) {return d.target.x;})
    .attr("y2", function(d) {return d.target.y;});

  node
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
//    .attr("x", function(d) {return d.x - nodeOffset;})
//    .attr("y", function(d) {return d.y - nodeOffset;});
}

function imagePath(name)
{
  return imagesPath + name + imageType;
}

// establish the image positino for a given node

function imagePosition(node)
{
  return -imageSize(node) / 2;
}

// establish the image size for a given node

function imageSize(node)
{
    return nodeSize * Math.pow(discount, node.depth);
}

// establish the distance between two links

function linkDistance(link) 
{
  return (imageSize(link.source) + imageSize(link.target)) / 2 + nodeBuffer;
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
    .selectAll("[class=nodeIcon]")
    .filter(function (d) {return d == node;})
    .attr("href", selectIcon(node));

  update();
}

// handle a node click

function click(node)
{
  if (node.children || node._children)
    toggleChildren(node);
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

function display(thing)
{
    if (thing instanceof Array)
    {
        console.log("array: ");
        for (n in thing)
            console.log("  ", n, ": ", thing[n]);
    }
    else if (typeof(thing) == "object")
        console.log("object: ", thing);
    else
        console.log(typeof(thing), "?: ", thing);

    return "bar";
}
