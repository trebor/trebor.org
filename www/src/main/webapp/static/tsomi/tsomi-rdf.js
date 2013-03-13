var QUERY_URL = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&format=json&query=";

var debugging = false;

var prefixies = [
  {prefix: "rdf",         uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"},
  {prefix: "fn",          uri: "http://www.w3.org/2005/xpath-functions#"},
  {prefix: "dbcat",       uri: "http://dbpedia.org/resource/Category/"},
  {prefix: "rdfs",        uri: "http://www.w3.org/2000/01/rdf-schema#"},
  {prefix: "skos",        uri: "http://www.w3.org/2004/02/skos/core/"},
  {prefix: "xsd",         uri: "http://www.w3.org/2001/XMLSchema#"},
  {prefix: "dc",          uri: "http://purl.org/dc/elements/1.1/"},
  {prefix: "owl",         uri: "http://www.w3.org/2002/07/owl#"},
  {prefix: "wiki",        uri: "http://en.wikipedia.org/wiki/"},
  {prefix: "dbpedia-owl", uri: "http://dbpedia.org/ontology/"},
  {prefix: "dbprop",      uri: "http://dbpedia.org/property/"},
  {prefix: "dbpedia",     uri: "http://dbpedia.org/resource/"},
  {prefix: "prov",        uri: "http://www.w3.org/ns/prov#"},
  {prefix: "foaf",        uri: "http://xmlns.com/foaf/0.1/"},
  {prefix: "dcterms",     uri: "http://purl.org/dc/terms/"},
];

var predicates = {
  influenced:    "dbpedia-owl:influenced",
  influencedBy: "dbpedia-owl:influencedBy",
  depiction: "foaf:depiction",
  thumbnail: "dbpedia-owl:thumbnail",
  name: "foaf:name",
  wikiTopic: "foaf:isPrimaryTopicOf",
  occupation: "dbpprop:occupation",
  dob: "dbprop:dateOfBirth",
  dod: "dbprop:dateOfDeath",
};

var subjects = {
  bacon:      "Kevin_Bacon",
  duckworth:  "Eleanor_Duckworth",
  vonnegut:   "Kurt_Vonnegut",
  plath:      "Silvia_Plath",
  egoldman:   "Emma_Goldman",
  oats:       "Joyce_Carol_Oates",
  kahlo:      "Frida_Kahlo",
  bohm:       "David_Bohm",
  obama:      "Barack_Obama",
  chomsky:    "Noam_Chomsky",
  eroosevelt: "Eleanor_Roosevelt(Hato_Rey)",
  pinker:     "Steven_Pinker",
  sontag:     "Susan_Sontag",
  einstein:   "Albert_Einstein",
};

var personalDetails = [
  {name: "name",       optional: false, type: "literal"},
  {name: "thumbnail",  optional: true,  type: "url"},
  {name: "depiction",  optional: true,  type: "url"},
  {name: "wikiTopic",  optional: false, type: "url"},
  {name: "dob",        optional: true,  type: "literal"},
  {name: "dod",        optional: true,  type: "literal"},
];

var person_details = ["thumbnail", "depiction", "occupation", "name", "dob", "dod"];

var personDetailsSelect = function() {
  var result = "";
  personalDetails.forEach(function(detail) {
    result += " ?" + detail.name;
  });
  return result;
};

var personDetailsWhere = function(target) {
  var result = "";
  personalDetails.forEach(function(detail) {
    var name = detail.name;
    var predicate = predicates[name];

    if (detail.optional) {
      result += "  OPTIONAL {" + target + " " + predicate + " ?" + name + " . }\n";
    } else {
      result += "  " + target + " " + predicate + " ?" + name + " .\n";
    }
  });
  return result; // + "\n  FILTER(langMatches(lang(?name), 'EN'))";
};

var query_relationship_details = "\n\
SELECT DISTINCT ?subject" + personDetailsSelect() + "\n\
WHERE\n\
{\n\
  %domain% %relationship% %range% .\n" +
  personDetailsWhere("?subject") + "\n\
}";


var query_details = "SELECT" + personDetailsSelect() + " \n\
WHERE\n\
{\n" +
  personDetailsWhere("%target%") + "\n\
}";

var query_describe = "DESCRIBE %target%";

var display_results = function(data){
  console.log(data);
  var keys = data.head.vars;
  data.results.bindings.forEach(function(result) {
    var line = "";
    keys.forEach(function(key) {
      line += binding_to_string(result[key]) + " ";
    });
    console.log(line);
  });
};

function binding_to_string(binding) {
  var result;

  if (binding !== undefined) {
    switch (binding.type) {
    case "uri":
      //result = binding.value;
      result = prefix_uri(prefixies, binding.value);
      break;
    case "literal":
      result = "[" + binding.value.substring(0, 30) + "]";
      break;
    default:
      result = "{" + binding.value.substring(0, 30) + "}";
    }
  }

  return result;
}

function sparqlQuery(query, variables, callback) {

  var execute = function() {
  // swap in variables

  Object.keys(variables).forEach(function(variable) {
    query = query.replace(new RegExp("%" + variable + "%", "g"), variables[variable]);
  });

  query = prefix_table_to_string(prefixies) + "\n" + query;
  
  if (debugging) {
    console.log("---------------- query ----------------");
    console.log(query);
    //console.log(escape(query));
    console.log("^^^^^^^^^^^^^^^^ query ^^^^^^^^^^^^^^^^");
  }

  $.getJSON(QUERY_URL + escape(query), function(data) {
    if (debugging) {
      console.log("---------------- results -----------------");
      display_results(data);
      console.log("^^^^^^^^^^^^^^^^ results ^^^^^^^^^^^^^^^^");
    }

    callback(data);
  })
    .error(function(error) {console.log("HTTP error"), callback(undefined)});
  };

  setTimeout(execute, 0);
};

// convert uri to prefixed thingy

function prefix_uri(prefixies, uri) {
  var result = uri;
  prefixies.some(function(prefix) {
    if (uri.indexOf(prefix.uri) >= 0) {
      result = uri.replace(prefix.uri, prefix.prefix + ":");
      return true;
    };
    return false;
  });
  return result;
}

function shorten(uri) {
  return prefix_uri(prefixies, uri);
}

// convert prefix table to string

function prefix_table_to_string(prefixies) {
  var result = "";
  prefixies.forEach(function(prefix) {
    result += "PREFIX " + prefix.prefix + ": <" + prefix.uri + ">\n";
  });
  return result;
}

var personCache = {};

function getPerson(id, callback) {

  // if the person is in the chache, use that

  var personGraph = personCache[id];
  if (personGraph !== undefined)
    callback(personGraph);

  // otherwise query for the person and be sure to cache that

  else
    queryForPerson(id, function(personGraph) {
      personCache[id] = personGraph;
      callback(personGraph);
    });
}

function queryForPerson(targetId, callback) {
  var targetGraph = new TGraph();
   queryForInfluencedBy(targetGraph, targetId, function() {
     queryForInfluenced(targetGraph, targetId, function() {
      var targetNode = targetGraph.getNode(targetId);
      if (targetNode !== undefined) {
        queryDetails(targetNode, function() {callback(targetGraph);});
      } else {
        callback(targetGraph);
      }
    });
   });
}

function queryForInfluencedBy(targetGraph, targetId, callback) {
  var parameters = {
    domain: "?subject", 
    relationship: predicates.influencedBy,
    range: targetId,
  };

  sparqlQuery(query_relationship_details, parameters, function(data) {
    if (data !== undefined) {
      data.results.bindings.forEach(function(binding) {

        // add relationship

        var otherId = "<" + binding.subject.value + ">";
        targetGraph.addLink(otherId, targetId, {type: parameters.relationship});
        if (debugging) {
          console.log(
            "[" + targetId + "]",
            parameters.relationship,
            "[" + shorten(binding.subject.value) + "]");
        }

        // add personal details for the other person in this relationship

        var other = targetGraph.getNode(otherId);
        person_details.forEach(function(detail) {
          other.setProperty(detail, binding[detail] !== undefined 
                            ? binding[detail].value 
                            : undefined);
        });
      });
    }

    callback(targetGraph);
  });
}

function queryForInfluenced(targetGraph, targetId, callback) {
  var parameters = {
    domain: targetId,
    relationship: predicates.influencedBy,
    range: "?subject",
  };

  sparqlQuery(query_relationship_details, parameters, function(data) {
    if (data !== undefined) {
      data.results.bindings.forEach(function(binding) {

        // add relationship

        var otherId = "<" + binding.subject.value + ">";
        targetGraph.addLink(otherId, targetId, {type: parameters.relationship});
        if (debugging) {
          console.log(
            "[" + shorten(binding.subject.value) + "]",
            parameters.relationship,
            "[" + targetId + "]");
        }

        // add personal details for the other person in this relationship

        var other = targetGraph.getNode(otherId);
        person_details.forEach(function(detail) {
          other.setProperty(detail, binding[detail] !== undefined
                            ? binding[detail].value 
                            : undefined);
        });
      });
    }

    callback(targetGraph);
  });
}

function applyDetails(node, binding) {
  var other = targetGraph.getNode(otherId);
  person_details.forEach(function(detail) {
    other.setProperty(detail, binding[detail] !== undefined
                      ? binding[detail].value 
                      : undefined);
  });
}

function queryAllDetails(personNodes, callback) {

  if (personNodes.length == 0) {
    callback();
  }
  else {
    queryDetails(personNodes.shift(), function() {
      queryAllDetails(personNodes, callback);
    });
  }
}

function queryDetails(personNode, callback) {
  sparqlQuery(query_details, {target: personNode.getId()}, function(details) {
    if (details !== undefined) {
      if (details.results.bindings.length > 0) {
        var detailsBinding = details.results.bindings[0];
        details.head.vars.forEach(function(key) {
          if (detailsBinding[key] !== undefined)
            personNode.setProperty(key, detailsBinding[key].value);
        });
      }
    }
    callback();
  });
}
