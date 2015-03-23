define({
	
	/**
	 * Capitalize one letter every two letters. (Ex: "Julien" => "JuLiEn")
	 * 
	 * @param {string} str The string to format
	 */
	toFunnyCase: function(str) {
		var result = '';
		var uppercase = true;
		
		for (var i = 0; i < str.length; i++) {
			result += uppercase ? str[i].toUpperCase() : str[i].toLowerCase();
			uppercase = !uppercase;
		}
		
		return result;
	}

});