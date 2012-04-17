function input(attributes, text) {return html("input", attributes, text);}
function form(attributes, text) {return html("form", attributes, text);}
function table(attributes, text) {return html("table", attributes, text);}
function tRow(attributes, text) {return html("tr", attributes, text);}
function tCell(attributes, text) {return html("td", attributes, text);}
function div(attributes, text) {return html("div", attributes, text);}
function span(attributes, text) {return html("span", attributes, text);}
function text(attributes, text) {return html("text", attributes, text);}
function htmlP(attributes, text) {return html("p", attributes, text);}
function htmlImg(attributes, source, altText)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};
  attributes = mergeProperties({src: source, alt: altText}, attributes);
  return html("img", attributes, "");
}
function htmlA(attributes, text, link)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};
  attributes = mergeProperties({href: link}, attributes);
  return html("a", attributes, text);
}

function svg(attributes, content)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};
  attributes = mergeProperties({xmlns: "http://www.w3.org/2000/svg"}, attributes);
  return html("svg", attributes, content);
}

function html(tag, attributes, content)
{
  attributes = typeof attributes !== 'undefined' ? attributes : {};
  var result = [];
  result.push('<' + tag);
  for (var attribute in attributes)
    result.push(' ' + attribute + '="' + attributes[attribute] + '"');
  result.push('>' + content + '</' + tag + '>');
  return result.join('');
}

function mergeProperties(obj1,obj2)
{
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}
