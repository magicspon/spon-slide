import once from 'lodash.once'

export const mapNodesToMachine = ($Elements, wrap = true) => {
	return $Elements.map(($node, i, a) => {
		return {
			PREV: a[i - 1]
				? {
						$el: a[i - 1],
						index: i - 1
					}
				: wrap === true
					? {
							$el: a[a.length - 1],
							index: a.length - 1
						}
					: {
							$el: $node,
							index: i
						},

			NEXT: a[i + 1]
				? {
						$el: a[i + 1],
						index: i + 1
					}
				: wrap === true
					? {
							$el: a[0],
							index: 0
						}
					: {
							$el: a[i],
							index: i
						}
		}
	})
}

export const eventPromise = (event, element, callback) => {
	function onEnd(resolve) {
		resolve()
		element.removeEventListener(event, onEnd)
	}

	return new Promise(resolve => {
		element.addEventListener(event, once(onEnd.bind(null, resolve)))
		callback()
	})
}

export const animationEnd = type => {
	let types
	if (type && ('transition' === type || 'trans' === type)) {
		types = {
			OTransition: 'oTransitionEnd',
			WebkitTransition: 'webkitTransitionEnd',
			MozTransition: 'transitionend',
			transition: 'transitionend'
		}
	} else {
		// animation is default
		types = {
			OAnimation: 'oAnimationEnd',
			WebkitAnimation: 'webkitAnimationEnd',
			MozAnimation: 'animationend',
			animation: 'animationend'
		}
	}
	const elem = document.createElement('fake')
	return Object.keys(types).reduce(function(prev, trans) {
		return undefined !== elem.style[trans] ? types[trans] : prev
	}, '')
}
