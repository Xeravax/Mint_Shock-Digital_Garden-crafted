const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const markdownItCallouts = require('markdown-it-callouts').default;
const lucideIcons = require('@grimlink/eleventy-plugin-lucide-icons');

module.exports = function (eleventyConfig) {
	// Copy static assets
	eleventyConfig.addPassthroughCopy('src/assets');

	// Add navigation plugin
	eleventyConfig.addPlugin(eleventyNavigationPlugin);

	// Add lucide icons plugin
	eleventyConfig.addPlugin(lucideIcons, {
		class: 'custom-class',
		width: 24,
		height: 24,
		stroke: 'currentColor',
		'stroke-width': 2,
	});

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
