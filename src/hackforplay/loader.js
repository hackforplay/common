import 'hackforplay/core';

/*
function blobToDataURL(blob, callback) {
	var a = new FileReader();
	a.onload = function(e) { callback(e.target.result); }
	a.readAsDataURL(blob);
}
*/

enchant.Surface.load = function(src, callback, onerror) {
	// console.log(src);

	const image = new Image();
	const surface = Object.create(enchant.Surface.prototype, {
		context: {
			value: null
		},
		_css: {
			value: 'url(' + src + ')'
		},
		_element: {
			value: image
		}
	});
	enchant.EventTarget.call(surface);
	onerror = onerror || function() {};
	surface.addEventListener('load', callback);
	surface.addEventListener('error', onerror);
	image.onerror = function() {
		var e = new enchant.Event(enchant.Event.ERROR);
		e.message = 'Cannot load an asset: ' + image.src;
		enchant.Core.instance.dispatchEvent(e);
		surface.dispatchEvent(e);
	};
	image.onload = function() {
		surface.width = image.width;
		surface.height = image.height;
		surface.dispatchEvent(new enchant.Event('load'));
	};

	if (src.startsWith('data:')) {
		image.src = src;
		// 一部の MOD の為に元画像の情報を残す
		image.originalSource = src;

		return surface;
	}

	feeles.fetchDataURL(src).then(function(dataURL) {
		image.src = dataURL;
		// 一部の MOD の為に元画像の情報を残す
		image.originalSource = src;
	});

	return surface;
};
