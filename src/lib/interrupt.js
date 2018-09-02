const a_href = false;
const img_src = false;
const audio_src = false;
const script_src = false;
const xhr_url = true;

// Hyper link
if (a_href) {
	const hrefLoader = (node, href, set) => {
		set(`javascript: feeles.replace('${href}');`);
	};
	interruptSetter(HTMLAnchorElement, 'href', hrefLoader);
}

// Image source
if (img_src) {
	interruptSetter(HTMLImageElement, 'src', resourceLoader);
}

// Audio source
if (audio_src) {
	interruptSetter(HTMLAudioElement, 'src', resourceLoader);
}

// Script source
if (script_src) {
	interruptSetter(HTMLScriptElement, 'src', resourceLoader);
}

// XHR open()
if (xhr_url) {
	interruptXHR(XMLHttpRequest);
}

/**
 * @param node: HTMLElement
 * @param src: String
 * @param set: Function
 */
function resourceLoader(node, src, set) {
	if (src.startsWith('data:')) return set(src);
	if (src.startsWith('blob:')) return set(src);

	if (!isSameOrigin(src)) {
		set(src);
		return;
	}
	// If relative path:
	feeles
		.fetch(getFeelesName(src))
		.then(response => response.blob())
		.then(blob => {
			const url = URL.createObjectURL(blob);
			const revokeHandler = () => {
				node.removeEventListener('load', revokeHandler);
				node.removeEventListener('error', revokeHandler);
				URL.revokeObjectURL(url);
			};
			node.addEventListener('load', revokeHandler);
			node.addEventListener('error', revokeHandler);

			set(url);
		});
}

/**
 * @param constructor: HTMLElement
 * @param attr: String
 * @param delegate: Function(
 *	 node: HTMLElement,
 *	 value: any,
 *	 set: Function
 * )
 */
function interruptSetter(constructor, attr, delegate) {
	const proto = constructor.prototype;
	const desc = Object.getOwnPropertyDescriptor(proto, attr);
	Object.defineProperty(proto, attr, {
		set: function(value) {
			delegate(this, value, desc.set.bind(this));
		}
	});
}

/**
 * @param constructor: XMLHttpRequest
 * @param attr: String
 * @param delegate: Function(
 *	 node: HTMLElement,
 *	 value: any,
 *	 set: Function
 * )
 */
function interruptXHR(constructor) {
	const { open, send } = constructor.prototype;

	Object.defineProperty(constructor.prototype, 'open', {
		value: interruptOpen
	});

	function interruptOpen(
		_method,
		_url,
		_async = true,
		_user = '',
		_password = ''
	) {
		if (_async === false) {
			throw new Error(
				'feeles.XMLHttpRequest does not support synchronization requests.'
			);
		}
		if (!isSameOrigin(_url)) {
			open.call(this, _method, _url, _async, _user, _password);
			return;
		}
		this.send = function(...sendArgs) {
			feeles
				.fetch(getFeelesName(_url))
				.then(response => response.blob())
				.then(blob => {
					const url = URL.createObjectURL(blob);

					const revokeHandler = () => {
						this.removeEventListener('load', revokeHandler);
						this.removeEventListener('error', revokeHandler);
						this.removeEventListener('abort', revokeHandler);
						URL.revokeObjectURL(url);
					};

					this.addEventListener('load', revokeHandler);
					this.addEventListener('error', revokeHandler);
					this.addEventListener('abort', revokeHandler);

					open.call(this, _method, url, _async, _user, _password);
					send.apply(this, sendArgs);
				});
		};
	}
}

const currentOrigin = getOrigin('');
const baseURL = (() => {
	const a = document.createElement('a');
	a.href = '';

	if (!a.href) {
		return '';
	}

	// 	If a.origin === "null" (e.g. Open in Blob URL), a.pathname doesn't work.
	if (a.origin === 'null') {
		return 'http://fake.origin/';
	}

	const index = a.href.lastIndexOf('/');
	return a.href.substr(0, index + 1);
})();

/**
 * @param url: String
 * @return String
 */
function getFeelesName(url) {
	if (baseURL) {
		const fullPath = new URL(url, baseURL).href;
		return fullPath.substr(baseURL.length);
	}
	return url;
}

/**
 * @param url: String
 * @return Boolean
 */
function isSameOrigin(url) {
	return getOrigin(url) === currentOrigin;
}

/**
 * @param url: String
 * @return String
 */
function getOrigin(url) {
	const a = document.createElement('a');
	a.href = url;
	return a.origin;
}
