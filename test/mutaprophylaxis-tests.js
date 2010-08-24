(function (view, doc, MutationEvent) {
"use strict";
var
	  timeouts = []
	, timeoutKey = "instant-timeout" + Math.random()
	, dispatchTimeouts = function (evt) {
			if (evt.source === view && evt.data === timeoutKey) {
				evt.stopPropagation();
				var i = timeouts.length;
				while (i--) {
					timeouts.shift()();
				}
			}
	}
	, instantTimeout = function (fn) {
		timeouts.push(fn);
		view.postMessage(timeoutKey, "*");
	}
	, nodes = doc.getElementById("mutaprophylaxis-test")
;

view.addEventListener("message", dispatchTimeouts, false);

module("Mutaprophylaxis");

asyncTest("DOMNodeRemoved", function () {
	expect(1);
	var
		  node = doc.createElement("div")
		, child = node.appendChild(doc.createTextNode(""))
	;
	nodes.appendChild(node);
	MutationEvent.protect(node);
	node.removeChild(child);
	instantTimeout(function () {
		equals(child.parentNode, node, "removing child from protected node");
		nodes.removeChild(node);
		start();
	});
});
asyncTest("DOMNodeInserted", function () {
	expect(1);
	var
		  node = doc.createElement("div")
		, child = doc.createTextNode("")
	;
	nodes.appendChild(node);
	MutationEvent.protect(node);
	node.appendChild(child);
	instantTimeout(function () {
		equals(child.parentNode, null, "appending child to protected node");
		nodes.removeChild(node);
		start();
	});
});
asyncTest("DOMAttrModified", function () {
	expect(3);
	var node = doc.createElement("div");
	nodes.appendChild(node);
	node.setAttribute("data-attr-test-1", "pass");
	node.setAttribute("data-attr-test-2", "pass");
	MutationEvent.protect(node);
	node.setAttribute("data-attr-test-3", "fail");
	node.removeAttribute("data-attr-test-1");
	node.setAttribute("data-attr-test-2", "fail");
	instantTimeout(function () {
		equals(node.getAttribute("data-attr-test-1"), "pass", "removing attribute on protected node");
		equals(node.getAttribute("data-attr-test-2"), "pass", "modifying attribute on protected node");
		equals(node.getAttribute("data-attr-test-3"), null, "setting attribute on protected node");
		nodes.removeChild(node);
		start();
	});
});
asyncTest("DOMCharacterDataModified", function () {
	expect(1);
	var node = doc.createTextNode("pass");
	nodes.appendChild(node);
	MutationEvent.protect(node);
	node.nodeValue = "fail";
	instantTimeout(function () {
		equals(node.nodeValue, "pass", "modifying value of protected node");
		nodes.removeChild(node);
		start();
	});
});
asyncTest("DOMElementNameChanged and DOMAttributeNameChanged", function () {
	// Note that no browsers as of 2010-08-24 support Document.renameNode
	expect(2);
	var
		  elem = doc.createElement("pass")
		, attr = doc.createAttribute("pass")
		, canRenameNodes = false
		, renameTestNode = doc.createElement("test")
	;
	nodes.appendChild(elem);
	try {
		doc.renameNode(renameTestNode, null, "test2");
		canRenameNodes = true;
	} catch (ex) {}
	MutationEvent.protect(elem);
	MutationEvent.protect(attr);
	if (canRenameNodes) {
		doc.renameNode(elem, null, "fail");
		doc.renameNode(attr, null, "fail");
		instantTimeout(function () {
			equals(elem.nodeName.toLowerCase(), "pass", "changing name of protected element node");
			equals(attr.nodeName.toLowerCase(), "pass", "changing name of protected attribute node");
			nodes.removeChild(elem);
			start();
		});
	} else {
		ok(true, "N/A: changing name of protected element node");
		ok(true, "N/A: changing name of protected attribute node");
		nodes.removeChild(elem);
		start();
	}
});
}(self, document, MutationEvent));
