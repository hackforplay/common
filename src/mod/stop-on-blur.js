import Hack from '../hackforplay/hack';

export default function stopOnBlur() {
	const resume = document.createElement('span');
	resume.textContent = '▶︎';
	resume.style.color = 'white';
	resume.style.position = 'absolute';
	resume.style.fontSize = '64px';
	resume.style.left = '210px';
	resume.style.top = '100px';

	document.body.addEventListener(
		'mouseenter',
		() => (resume.style.opacity = 1)
	);
	document.body.addEventListener(
		'mouseleave',
		() => (resume.style.opacity = 0.6)
	);

	const updateStyle = () => {
		if (this._element) {
			this._element.style.opacity = document.hasFocus() ? 1.0 : 0.3;
		}
		if (Hack.world) {
			if (document.hasFocus()) {
				Hack.world.resume();
			} else {
				Hack.world.stop();
			}
		}
		if (document.hasFocus()) {
			if (resume.parentElement === document.body) {
				document.body.removeChild(resume);
			}
		} else {
			if (document.body.hasChildNodes()) {
				document.body.insertBefore(resume, document.body.firstChild);
			} else {
				document.body.appendChild(resume);
			}
		}
	};
	window.addEventListener('focus', updateStyle);
	window.addEventListener('blur', updateStyle);
	updateStyle();
}
