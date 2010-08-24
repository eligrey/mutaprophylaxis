/*
 * Mutaprophylaxis JavaScript Library, Enhanced Security Edition v0.2.1
 * Implements methods to prevent unauthorized DOM mutations.
 *
 * 2010-08-24
 * 
 * By Eli Grey, http://eligrey.com
 *
 * License: GNU GPL v3 and the X11/MIT license
 *   See COPYING.md
 */

/*jslint laxbreak: true, onevar: true, undef: true, nomen: true, eqeqeq: true,
  bitwise: true, regexp: true, newcap: true, immed: true, strict: true, maxlen: 90*/

/*global self, addEventListener*/

// Script users: place your code starting at line 138!

"use strict";
if (typeof addEventListener !== "undefined") {
(function (view) {
// Instant timeout needed as the DOM is locked during the execution of
// MutationEvent event listeners.
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
	, revertMutation = function (evt) {
		var
			  relatedNode = evt.relatedNode
			, target = evt.target
			, prevValue = evt.prevValue
			, prevNamespaceURI = evt.prevNamespaceURI
			, prevNodeName = evt.prevNodeName
		;
		switch (evt.type) {
			case "DOMSubtreeModified":
				throw new TypeError(
					"DOMSubtreeModified mutation events cannot be reverted."
						.toLocaleString()
				);
			case "DOMNodeRemoved":
			case "DOMNodeRemovedFromDocument":
				if (target.nodeType === 2) { // ATTRIBUTE_NODE
					relatedNode.setAttributeNodeNS(target);
				} else {
					relatedNode.appendChild(target);
					// It's impossible to know the order position of the removed node in
					// relation to it's parent node's child nodes, so it is appended as
					// the last child as innerHTML-triggered mutations are the most common
				}
				break;
			case "DOMNodeInserted":
			case "DOMNodeInsertedIntoDocument":
				if (target.nodeType === 2) { // ATTRIBUTE_NODE
					relatedNode.removeAttributeNode(target);
				} else {
					relatedNode.removeChild(target);
				}
				break;
			case "DOMAttrModified":
				switch (evt.attrChange) {
					case 1: // MODIFICATION
						relatedNode.nodeValue = prevValue;
						break;
					case 2: // ADDITION
						target.removeAttributeNode(relatedNode);
						break;
					case 3: // REMOVAL
						target.setAttributeNodeNS(relatedNode);
						break;
				}
				break;
			case "DOMCharacterDataModified":
				target.nodeValue = prevValue;
				break;
			case "DOMElementNameChanged":
			case "DOMAttributeNameChanged":
				target.ownerDocument.renameNode(target, prevNamespaceURI, prevNodeName);
				break;
		}
	}
	, protect = function (node) {
		var
			  revertable = [
				  "DOMNodeRemoved"
				, "DOMNodeInserted"
				, "DOMAttrModified"
				, "DOMCharacterDataModified"
				, "DOMElementNameChanged"
				, "DOMAttributeNameChanged"
			  ]
			, i = 6 // revertable.length
			, revertMutations = true
			, revert = function (evt) {
				evt.stopPropagation();
				if (revertMutations) {
					timeouts.push(function () {
						revertMutations = false;
						revertMutation(evt);
						revertMutations = true;
					});
					view.postMessage(timeoutKey, "*");
				}
			}
		;
		while (i--) {
			node.addEventListener(revertable[i], revert, false);
		}
		return function (mutator) { // mutator function authorizer
			revertMutations = false;
			mutator();
			revertMutations = true;
		};
	}
;

// Prevent string identification of Mutaprophylaxis functions
Function.prototype.toString = function () {
	return "function(){}"; // Keep a valid ECMAScript return value though.
};
view.addEventListener("message", dispatchTimeouts, false);

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

module("Mutaprophylaxis ESE");

asyncTest("DOMNodeRemoved", function () {
	expect(1);
	var
		  node = doc.createElement("div")
		, child = node.appendChild(doc.createTextNode(""))
	;
	nodes.appendChild(node);
	protect(node);
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
	protect(node);
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
	protect(node);
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
	protect(node);
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
	protect(elem);
	protect(attr);
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

}(self));
}
