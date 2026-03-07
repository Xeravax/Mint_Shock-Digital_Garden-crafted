module.exports = function (eleventyConfig) {
	// Copy static assets
	eleventyConfig.addPassthroughCopy('assets');
	eleventyConfig.addPassthroughCopy({ css: 'styles' });
	eleventyConfig.addPassthroughCopy({ scripts: 'scripts' });

	// Set input directory
	return {
		dir: {
			input: 'sites',
			includes: '../_includes',
			output: '_site',
		},
	};
};
