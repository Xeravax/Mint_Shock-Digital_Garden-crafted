module.exports = function (eleventyConfig) {
	// Copy static assets
	eleventyConfig.addPassthroughCopy('src/assets');

	// Set input directory
	return {
		dir: {
			input: 'src',
			includes: '_includes',
			output: '_site',
		},
	};
};
