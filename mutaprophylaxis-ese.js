/*
 * Mutaprophylaxis JavaScript Library, Enhanced Security Edition v0.2
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
					relatedNode.setAttributeNodeNS(target.namespaceURI, target);
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
						revertMutation(evt)();
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

(function () {
	/* Place your code directly after this comment!
	 * For example, to protect an ad container, you might do the following:
		 var adContainer = document.getElementById("adContainer");
		 adContainer.style.setProperty("display", "block", "important");
		 protect(adContainer);
	 */
	
}());

}(self));
}
