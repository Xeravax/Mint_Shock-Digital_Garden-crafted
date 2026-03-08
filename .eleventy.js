const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');

module.exports = function (eleventyConfig) {
	// Copy static assets
	eleventyConfig.addPassthroughCopy('src/assets');

	// Add navigation plugin
	eleventyConfig.addPlugin(eleventyNavigationPlugin);

	// Set input directory
	return {
		dir: {
			input: 'src',
			includes: '_includes',
			output: '_site',
		},
	};
};
