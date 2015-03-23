require(["helper/util"], function(util) {
    // This function is called when scripts/helper/util.js is loaded.
    // If util.js calls define(), then this function is not fired until
    // util's dependencies have loaded, and the util argument will hold
    // the module value for "helper/util".
	
	var titles = document.getElementsByTagName('h1');
	for (var i = 0; i < titles.length; i++) {
		titles[i].textContent = util.toFunnyCase(titles[i].textContent);
	}
});