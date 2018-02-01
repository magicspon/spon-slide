export const mapNodesToMachine = ($Elements, wrap = true) => {
	return $Elements.map(($node, i, a) => {
		return {
			PREV: a[i - 1] ? i - 1 : wrap === true ? a.length - 1 : i,
			NEXT: a[i + 1] ? i + 1 : wrap === true ? 0 : i
		}
	})
}

export const eventPromise = (event, element, callback) => {
	let complete = false

	const done = (resolve, e) => {
		e.stopPropagation()
		element.removeEventListener(event, done)
		if (e.target === element && !complete) {
			complete = true
			resolve()
			return
		}
	}

	return new Promise(resolve => {
		callback && callback()
		element.addEventListener(event, done.bind(null, resolve), false)
	})
}

export const animationEnd = (type = 'transition') => {
	const types =
		type === 'transition'
			? {
					OTransition: 'oTransitionEnd',
					WebkitTransition: 'webkitTransitionEnd',
					MozTransition: 'transitionend',
					transition: 'transitionend'
				}
			: {
					OAnimation: 'oAnimationEnd',
					WebkitAnimation: 'webkitAnimationEnd',
					MozAnimation: 'animationend',
					animation: 'animationend'
				}

	const elem = document.createElement('div')
	return Object.keys(types).reduce(function(prev, trans) {
		return undefined !== elem.style[trans] ? types[trans] : prev
	}, '')
}

export const domify = (() => {
	const div = document.createElement('div')

	return html => {
		div.innerHTML = html
		return div.children[0]
	}
})()
