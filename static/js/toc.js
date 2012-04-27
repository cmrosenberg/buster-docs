(function () {
    elementsByClassName = function (element, className) {
        if (element.getElementsByClassName) {
            return element.getElementsByClassName(className);
        }

        var elements = element.getElementsByTagName("*"), results = [];
        var regexp = new RegExp("(^|\\s)" + className + "(\\s|$)");

        for (var i = 0, l = elements.length; i < l; ++i) {
            if (regexp.test(elements[i].className)) {
                results.push(elements[i]);
            }
        }

        return results;
    };

    // Get all text nodes in order and concat them to one string.
    // Leaves <code> nodes intact.
    function strippedHtml(element, html) {
        var html = html || [];
        for (var i = 0, ii = element.childNodes.length; i < ii; i++) {
            var childNode = element.childNodes[i];
            if (childNode.nodeType == 3) {
                html.push(childNode.nodeValue);
            } else if (childNode.nodeName == "CODE") {
                html.push("<code>" + strippedHtml(childNode, []) + "</code>");
            } else {
                strippedHtml(childNode, html);
            }
        }

        return html.join("");
    }

    function createSection(section) {
        var result;

        for (var i = 0, ii = section.childNodes.length; i < ii; i++) {
            var element = section.childNodes[i];

            if (element.nodeName == "H2") {
                result = {
                    name: strippedHtml(element),
                    element: element,
                    subs: []
                };
            }

            if (element.nodeName == "H3") {
                result.subs.push({                    
                    name: strippedHtml(element),
                    element: element
                });
            }
        }

        return result;
    }

    function createListItemForSectionItem(sectionItem, element) {
        var link = document.createElement("a");
        link.innerHTML = sectionItem.name;
        link.href = "#" + sectionItem.element.id;

        var item = document.createElement("li");
        item.appendChild(link);
        element.appendChild(item);
        return item;
    }

    function writeSectionHtml(section, element) {
        var item = createListItemForSectionItem(section, element);

        if (section.subs.length == 0) return;
        var subs = document.createElement("ul");
        item.appendChild(subs);

        for (var i = 0, ii = section.subs.length; i < ii; i++) {
            createListItemForSectionItem(section.subs[i], subs);
        }
    }

    
    var sectionElements = elementsByClassName(document, "section");
    var nav = document.createElement("ul");
    for (var i = 0, ii = sectionElements.length; i < ii; i++) {
        var section = createSection(sectionElements[i]);
        writeSectionHtml(section, nav);
    }

    var el = document.getElementById("doc-nav");
    if (el) { el.appendChild(nav); }
}());