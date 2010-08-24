/*
 * Mutaprophylaxis JavaScript Library v0.1
 * Implements methods to prevent unauthorized DOM mutations.
 *
 * 2010-08-23
 * 
 * By Eli Grey, http://eligrey.com
 *
 * License: GNU GPL v3 and the X11/MIT license
 *   See COPYING.md
 */

/*jslint laxbreak: true, onevar: true, undef: true, nomen: true, eqeqeq: true,
  bitwise: true, regexp: true, newcap: true, immed: true, strict: true, maxlen: 90*/

/*global self, MutationEvent*/

"use strict";
if (typeof MutationEvent !== "undefined") {
(function (view, MutationEvent) {
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
;

view.addEventListener("message", dispatchTimeouts, false);

MutationEvent.prototype.revert = function () {
	var
		  evt = this
		, relatedNode = evt.relatedNode
		, target = evt.target
		, prevValue = evt.prevValue
		, prevNamespaceURI = evt.prevNamespaceURI
		, prevNodeName = evt.prevNodeName
	;
	switch (evt.type) {
		case "DOMSubtreeModified":
			throw new TypeError(
				"DOMSubtreeModified mutation events cannot be reverted.".toLocaleString()
			);
		case "DOMNodeRemoved":
		case "DOMNodeRemovedFromDocument":
			if (target.nodeType === target.ATTRIBUTE_NODE) {
				relatedNode.setAttributeNodeNS(target.namespaceURI, target);
			} else {
				relatedNode.appendChild(target);
				// It's impossible to know the order position of the removed node in
				// relation to it's parent node's child nodes, so it is appended as
				// the last child as innerHTML-triggered mutations are the most common.
			}
			break;
		case "DOMNodeInserted":
		case "DOMNodeInsertedIntoDocument":
			if (target.nodeType === target.ATTRIBUTE_NODE) {
				relatedNode.removeAttributeNode(target);
			} else {
				relatedNode.removeChild(target);
			}
			break;
		case "DOMAttrModified":
			switch (evt.attrChange) {
				case evt.MODIFICATION:
					relatedNode.nodeValue = prevValue;
					break;
				case evt.ADDITION:
					target.removeAttributeNode(relatedNode);
					break;
				case evt.REMOVAL:
					target.setAttributeNodeNS(relatedNode.namespaceURI, relatedNode);
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
};

MutationEvent.protect = function (node) {
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
					evt.revert();
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
};

}(self, MutationEvent));
}