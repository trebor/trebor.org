var dataSource = "/trebor/tree.json";
var imagesPath = "image/";
var imageType = ".png";
var w = window.innerWidth - 8;
var h = window.innerHeight - 22;
var node;
var link;
var root;
var nodeSize = 80;
var nodeOffset = nodeSize / 2;
var linkLength = nodeSize * 1.25;
var iconSize = 20;

// construct the force layout

var force = d3
  .layout
  .force()
  .on("tick", tick)
  .gravity(0)
  .charge(-200)
  .linkDistance(linkLength)
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

  vis.selectAll("g.node")
    .each(function(d) {return click(d);});
});

function update() {
  var nodes = flatten(root), links = d3.layout.tree().links(nodes);

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

  // add image

  en.append("svg:image")
    .attr("class", "nodeImage")
    .attr("xlink:href", imagePath)
    .attr("x", imagePosition)
    .attr("y", imagePosition)
    .attr("width", imageSize)
    .attr("height", imageSize);

  // add icon

  en.append("svg:image")
    .attr("class", "nodeIcon")
    .attr("xlink:href", selectIcon)
    .attr("x", nodeSize / 2 - iconSize)
    .attr("y", nodeSize / 2 - iconSize)
    .attr("width", iconSize)
    .attr("height", iconSize);
  
  // append text
  
  en.append("svg:text")
    .attr("class", "nodetext")
    .attr("dx", 0)
    .attr("dy", nodeOffset * 1.3)
    .attr("text-anchor", "middle")
    .text(function(node) {return node.name;});

  // remove old nodes
  
  node.exit().remove();
}

function selectIcon(node)
{
    display(node);

    if (node._children != null)
        return imagesPath + "expand" + imageType;

    if (node.children != null)
        return imagesPath + "collapse" + imageType;

    return imagesPath + "link" + imageType;
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

function imagePath(node)
{
  return imagesPath + node.imageName + imageType;
}

function imagePosition(node)
{
  return "-" + nodeOffset + "px";
}

function imageSize(node)
{
  return nodeSize + "px";
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return d._children ? "#ff0000" : d.children ? "#00ff00" : "#0000ff";
//  return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}



// Toggle children on click.
function click(d)
{
  if (d.children) 
  {
    d._children = d.children;
    d.children = null;
  }
  else
  {
    d.children = d._children;
    d._children = null;
  }
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) 
{
  var nodes = [], i = 0;

  function recurse(node) 
  {
    if (node.children)
      node.size = node.children.reduce(function(p, v) {return p + recurse(v);  }, 0);
    if (!node.id)
      node.id = ++i;
    nodes.push(node);
    return node.size;
  }

  root.size = recurse(root);
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
