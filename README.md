Mutaprophylaxis
===============

*Version 0.1*

Mutaprophylaxis ([IPA][1]: /ˌmjutʌproʊfɪˈlæksɪs/) is a JavaScript library that implements methods to prevent unauthorized
DOM mutations.


Usage
-----

Mutaprophylaxis is intended for protecting nodes from DOM mutations triggered by malicious
scripts and browser add-ons that interact with websites. To be honest, I predict that the
main use of Mutaprophylaxis will be being used in combination with inline
`display: block !important` styles to create ad blocker-blocking ads. Go ahead and use
Mutaprophylaxis to make unblockable ads if you wish, however gray hat it may be.


Tested Browsers
---------------

* Firefox 3.6+
* Safari 5+
* Google Chrome 5+
* Opera 10.60+

Note that Internet Explorer 9 Platform Preview #4 partially supports DOM Level 3 mutation
events, though it is still missing important parts of the specification used in
Mutaprophylaxis.

API
---

Strong and emphasized text has titles (which can be viewed by hovering your cursor over
them) containing their type. If they are functions, it is their return type.


<dl>
  <dt><code>MutationEvent.<strong title="Function(Function mutator)">protect</strong>(<strong title="Node">node</strong>)</code></dt>
  <dd>
    Reverts all mutation events that ever occur on <em title="Node">node</em> and returns
    a function that authorizes all mutations done by the function passed to it. For
    example, refer to the following example code.
<pre><code>var authorizedMutator = MutationEvent.protect(document);
authorizedMutator(function () {
    document.body.appendChild(document.createElement("p"))
        .appendChild(document.createTextNode("These DOM mutations were authorized."))
});</code></pre>
  </dd>

  <dt><code><strong title="MutationEvent">event</strong>.<strong title="void">revert</strong>()</code></dt>
  <dd>
    Attempts to revert a MutationEvent. Note that a MutationEvent cannot be reverted
    during an the execution of a MutationEvent event listener, so you should call it in
    a zero-timeout. For example, refer to the following example code.
<pre><code>var allowMutations = false;
comments.addEventListener("DOMCharacterDataModified", function (event) {
    if (!allowMutations) {
        setTimeout(function () {
            allowMutations = true;
            event.revert();
            allowMutations = false;
        }, 0);
    }
}, false);</code></pre>
    Also note that generic DOMSubtreeModified events cannot be reverted, as they do not
	contain enough relevant information needed for reverting the event.
  </dd>
</dl>


![Tracking image](//in.getclicky.com/212712ns.gif =1x1)


  [1]: http://en.wikipedia.org/wiki/IPA_chart_for_English_dialects
