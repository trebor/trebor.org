function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.href);
	if (results == null)
		return "";
	else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
}

var jsonUri = "http://localhost:8080/trebor/mim";
var browseUri = "http://localhost:8080/trebor/static/marker.html";

d3.json(jsonUri + "?uri=" + getParameterByName("uri"), function(json) {

	// screen size

	var w = screen.width, h = screen.height - 200;

	// establish links and nodes for diagarm

	links = json.links;
	nodes = json.nodes;

	// center all nodes (does not work!)

	nodes.forEach(function(node) {
		node.x = w / 2;
		node.y = h / 2;
	});

	// create force directed layou object

	var force = d3.layout.force().nodes(d3.values(nodes)).links(links).size(
			[ w, h ]).linkDistance(60).charge(-300).on("tick", tick).start();

	// append svg object to page

	var svg = d3.select("body").append("svg:svg").attr("width", w).attr(
			"height", h);

	// per-type markers, as they don't inherit styles.

	svg.append("svg:defs").selectAll("marker").data(
			[ "suit", "licensing", "resolved" ]).enter().append("svg:marker")
			.attr("id", String).attr("viewBox", "0 -5 10 10").attr("refX", 15)
			.attr("refY", -1.5).attr("markerWidth", 6).attr("markerHeight", 6)
			.attr("orient", "auto").append("svg:path").attr("d",
					"M0,-5L10,0L0,5");

	// append link paths to svg

	var path = svg.append("svg:g").selectAll("path").data(force.links())
			.enter().append("svg:path").on("click", browse).attr("class",
					function(d) {
						return "link " + d.type;
					}).attr("marker-end", function(d) {
				return "url(#" + d.type + ")";
			});

	// append node circles to svg

	var circle = svg.append("svg:g").selectAll("circle").data(force.nodes())
			.enter().append("svg:circle").on("click", browse).attr("r", 6)
			.call(force.drag);

	// not sure whats happening here

	var text = svg.append("svg:g").selectAll("g").data(force.nodes()).enter()
			.append("svg:g");

	// a copy of the text with a thick white stroke for legibility.

	text.append("svg:text").attr("x", 8).attr("y", ".31em").attr("class",
			"shadow").text(function(d) {
		return d.name;
	});

	// 

	text.append("svg:text").attr("x", 8).attr("y", ".31em").text(function(d) {
		return d.name;
	});

	// Use elliptical arc path segments to doubly-encode directionality.

	function tick() {
		path.attr("d",
				function(d) {
					var dx = d.target.x - d.source.x, dy = d.target.y
							- d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
					return "M" + d.source.x + "," + d.source.y + "A" + dr + ","
							+ dr + " 0 0,1 " + d.target.x + "," + d.target.y;
				});

		circle.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});

		text.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});
	}

	function browse(d) {
		window.location = browseUri + "?uri=" + escape(d.name);
	}
});