const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const markdownItCallouts = require('markdown-it-callouts').default;

module.exports = function (eleventyConfig) {
	// Copy static assets
	eleventyConfig.addPassthroughCopy('src/assets');

	// Add navigation plugin
	eleventyConfig.addPlugin(eleventyNavigationPlugin);

	// Use markdown-it plugins in Eleventy
	eleventyConfig.amendLibrary('md', (mdLib) => {
		mdLib.use(markdownItCallouts, {
			calloutSymbols: {},
			emptyTitleFallback: 'none',
		});
	});

	// Set input directory
	return {
		dir: {
			input: 'src',
			includes: '_includes',
			output: '_site',
		},
	};
};
