/** Global javascript settings **/
/* Change the URLBASE during development to the dev base.  This is required for the facebook api to work. **/

window.URLBASE_DEV = 'cardblanc-ghiraldi.sax1johno.c9.io';
window.URLBASE_PROD = 'sandbox.mycardblanc.com';
window.URLBASE = window.URLBASE_PROD;

// // CSS calc() replacement
// var myAddEventListener = (function () {
//     "use strict";
// 	if (document.addEventListener) {
// 		return function (element, event, handler) {
// 			element.addEventListener(event, handler, false);
// 		};
// 	}
// 	return function (element, event, handler) {
// 		element.attachEvent('on' + event, handler);
// 	};
// }());

// function calcFailback() {
// 	"use strict";
// 	var d = document.createElement('div'),
// 		host = document.getElementsByTagName('body')[0],
// 		content = document.getElementById('content'),
// 		sidebar = document.getElementById('sidebar'),
// 		newWidth;

// 	function resize() {
// 		content.style.height = window.innerHeight - 40 + 'px';
// 		content.style.width = window.innerWidth - 300 + 'px';
// 		sidebar.style.height = window.innerHeight - 40 + 'px';
// 	}

// 	host.appendChild(d);

// 	d.style.visibility = 'hidden';
// 	d.style.width = "-webkit-calc(10px)";
// 	d.style.width = "-o-calc(10px)";
// 	d.style.width = "-moz-calc(10px)";
// 	d.style.width = "calc(10px)";

// 	newWidth = d.offsetWidth;

// 	if (newWidth !== 10) {

// 		resize();
// 		myAddEventListener(window, "resize", resize);

// 	}

// 	host.removeChild(d);
// }

// myAddEventListener(window, "load", calcFailback);