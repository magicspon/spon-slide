import mitt from 'mitt'

const mapNodesToMachine = ($Elements, wrap = true) => {
	return $Elements.map(($node, i, a) => {
		return {
			PREV: a[i - 1] ? i - 1 : wrap === true ? a.length - 1 : i,
			NEXT: a[i + 1] ? i + 1 : wrap === true ? 0 : i
		}
	})
}

const eventPromise = (event, element, callback) => {
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

const domify = (() => {
	const div = document.createElement('div')

	return html => {
		div.innerHTML = html
		return div.children[0]
	}
})()

export const animationEnd = () => {
	const types = {
		OAnimation: 'oAnimationEnd',
		WebkitAnimation: 'webkitAnimationEnd',
		MozAnimation: 'animationend',
		animation: 'animationend'
	}
	const elem = document.createElement('fake')
	return Object.keys(types).reduce(function(prev, trans) {
		return undefined !== elem.style[trans] ? types[trans] : prev
	}, '')
}

/*
	Options:

	animationType: {String} - animation, custom
	selector: {String} - css selector
	previousButton: {String} - css selector
	nextButton: {String} - css selector
	activeClass: {String} - class name
	loop: {Boolean} 
	delay: {Number} 
	wrap: {Boolean} 
	dots: {Boolean} 
	startingIndex: {Function(items)} - must return {Number}
	promiseBefore: {Boolean} 
	paginationParent: {Boolean} 
	paginationWrapper: {String} - html
	paginationButtons: {Function(items)} - must return an array eg: ['<button></button>','<button></button>']

	Events: 
	Called in order
	const $n = new Slide($HTML, {})

	$n.on('spon:prev') - on prev click
	$n.on('spon:next') - on next click
	$n.on('spon:before') - before promise
	$n.on('spon:change') - on change
	$n.on('spon:after') - after animation

	API:

	$n.init() - start
	$n.reset() - reset everything
	$n.destroy() - kill it all
	$n.next() - goto next
	$n.prev() - goto prev
	$n.goTo(n) - go to index
	$n.setOptions(o) - update optios object

	HTML:

	<div class="relative overflow-hidden data-ui="slide">
		<ul>
			<li data-slide-item>{{ loop.index }}</li>
			<li data-slide-item>{{ loop.index }}</li>
			<li data-slide-item>{{ loop.index }}</li>
		</ul>
		<a href="#0" data-slide-prev>prev</a>
		<a href="#0" data-slide-next>next</a>
	</div>

*/
export default class {
	defaults = {
		animationType: 'animation',
		selector: '[data-slide-item]',
		previousButton: '[data-slide-prev]',
		nextButton: '[data-slide-next]',
		activeClass: 'is-current',
		loop: false,
		delay: 3000,
		wrap: true,
		dots: true,
		promiseBefore: false,
		paginationParent: false,
		animateOnInit: false,
		startingIndex: () => 0,
		paginationWrapper: '<div></div>',
		paginationButtons: slides => slides.map(() => '<button />')
	}

	constructor($el, options = {}) {
		this.options = { ...this.defaults, ...options }
		this.$el = $el

		Object.assign(this, mitt())
	}

	/**
	 * @function setOptions
	 * @param {Object} options
	 * @return void
	 */
	setOptions = (options = {}) => {
		this.options = { ...this.options, options }
		return this
	}

	/**
	 * Initalize slides, bind click events and stuff
	 *
	 * @function init
	 * @return this
	 */
	init = () => {
		const {
			selector,
			previousButton,
			nextButton,
			activeClass,
			loop,
			wrap,
			dots,
			startingIndex,
			animateOnInit
		} = this.options
		const $item = this.$el.querySelector(`.${activeClass}`)

		this.$slides = [...this.$el.querySelectorAll(selector)]
		this.total = this.$slides.length - 1
		this.$prevBtn = previousButton && this.$el.querySelector(previousButton)
		this.$nextBtn = nextButton && this.$el.querySelector('[data-slide-next]')

		this.handle
		this.timer

		!$item && this.$slides[0].classList.add(activeClass)
		this.startingIndex = startingIndex(this.$slides)
		this.machine = mapNodesToMachine(this.$slides, wrap)
		this.$prevBtn && this.$prevBtn.addEventListener('click', this.prev)
		this.$nextBtn && this.$nextBtn.addEventListener('click', this.next)

		this.currentIndex = this.startingIndex
		dots && this._renderPager(this.startingIndex)
		loop && this._loop()

		animateOnInit && this.goTo(this.startingIndex)

		this.started = true
		return this
	}

	/**
	 * reset the slides
	 *
	 * @function reset
	 * @return this
	 */
	reset = () => {
		const { selector, activeClass, loop, wrap } = this.option
		const i = this.$nodes.indexOf(this.$el.querySelector(`.${activeClass}`))
		if (loop) this._cancelLoop()
		this.currentIndex = i > -1 ? i : 0
		this.$slides = [...this.$el.querySelectorAll(selector)]
		this.total = this.$slides.length - 1
		this.machine = mapNodesToMachine(this.$slides, wrap)
		return this
	}

	/**
	 * destroy the slide, remove all events
	 *
	 * @function destroy
	 * @return this
	 */
	destroy = () => {
		const { activeClass, loop, dots } = this.option
		if (loop) this._cancelLoop()

		if (this.$prevBtn) {
			this.$prevBtn.removeEventListener('click', this.prev)
			this.$prevBtn.removeAttribute('disabled')
		}

		if (this.$nextBtn) {
			this.$nextBtn.removeEventListener('click', this.next)
			this.$nextBtn.removeAttribute('disabled')
		}

		if (dots) {
			this.$pagerButtons.forEach(node =>
				node.removeEventListener('click', this.onPagerClick)
			)
			this.$pagerWrapper.parentNode.removeChild(this.$pagerWrapper)
		}

		this.$slides[this.currentIndex].classList.remove(activeClass)
		this.$slides.forEach(node => node.setAttribute('data-slide-item'))
		this.$slides = []
		this.off('*')
		return this
	}

	/**
	 * trigger PREV actions
	 *
	 * @function prev
	 * @return void
	 */
	prev = e => {
		e && e.preventDefault()
		this._transition(this.currentIndex, 'PREV')
	}

	/**
	 * trigger Next actions
	 *
	 * @function next
	 * @return void
	 */
	next = e => {
		e && e.preventDefault()
		this._transition(this.currentIndex, 'NEXT')
	}

	/**
	 * Function to run before updating the dom
	 *
	 * @function before
	 * @param {Object} props
	 * @return Promise
	 */
	before = props => {
		const { promiseBefore } = this.options
		if (!promiseBefore) return Promise.resolve()
		return new Promise(resolve => {
			this.emit('spon:before', { props, resolve })
		})
	}

	/**
	 * Update function
	 *
	 * @function goTo
	 * @param {Number} state
	 * @return void
	 */
	goTo = state => {
		if ((this.currentIndex === state && this.started) || this.isRuning) return
		this.isRuning = true
		const { activeClass, loop, animationType, dots, wrap } = this.options
		const forwards =
			(state > this.currentIndex ||
				(state === 0 && this.currentIndex === this.total)) &&
			!(state === this.total && this.currentIndex === 0)

		const $current = this.$slides[this.currentIndex]
		const $next = this.$slides[state]

		const props = {
			direction: forwards ? 'forwards' : 'backwards',
			currentEl: $current,
			nextEl: $next
		}

		const beforeProps = {
			...props,
			newIndex: state,
			currentIndex: this.currentIndex
		}

		if (!wrap) {
			this._updateButtonStates(state)
		}

		if (animationType !== 'custom') {
			this.before({
				...beforeProps
			}).then(() => {
				this.emit('spon:change', beforeProps)

				this.$slides
					.filter((_, index) => index !== this.currentIndex && index !== state)
					.forEach(node => node.setAttribute('data-slide-item', ''))

				eventPromise(animationEnd('animation'), $current, () => {
					$current.classList.remove(activeClass)
					$current.setAttribute(
						'data-slide-item',
						forwards ? 'hide-prev' : 'hide-next'
					)
				}).then(() => {
					this.emit('spon:after', props)
				})
				this.isRuning = false

				if (loop) {
					this._cancelLoop()
					this._loop()
				}

				$next.classList.add(activeClass)
				$next.setAttribute(
					'data-slide-item',
					forwards ? 'show-next' : 'show-prev'
				)
				dots && this._updatePagerButtons(state)
				this.currentIndex = state
			})
		} else {
			this.before(beforeProps).then(() => {
				dots && this._updatePagerButtons(state)
				this.emit('spon:after', props)
				this.currentIndex = state
				this.isRuning = false
				if (loop) {
					this._cancelLoop()
					this._loop()
				}
			})
		}
	}

	/**
	 * get the new state
	 *
	 * @function transition
	 * @return this
	 */
	_transition = (state, action) => {
		const newState = this.machine[state][action]

		this.emit(`spon:${action.toLowerCase()}`, {
			current: this.currentIndex,
			next: newState,
			slides: this.$slides
		})

		this.goTo(newState)
	}

	_updateButtonStates = state => {
		const prev = state === 0
		const next = state === this.total
		this.$prevBtn[prev ? 'setAttribute' : 'removeAttribute']('disabled', prev)
		this.$nextBtn[next ? 'setAttribute' : 'removeAttribute']('disabled', next)
	}

	/**
	 * @function _onPagerClick
	 * @param {Number} state
	 * @return void
	 */
	_onPagerClick = state => {
		this._updatePagerButtons(state)
		this.goTo(state)
	}

	/**
	 * @function onPagerClick
	 * @param {Number} state
	 * @return void
	 */
	_updatePagerButtons = state => {
		this.$pagerButtons[this.currentIndex].setAttribute('data-slide-pager', '')
		this.$pagerButtons[state].setAttribute('data-slide-pager', 'active')
	}

	/**
	 * Add pager html and bind events
	 *
	 * @function renderPager
	 * @param {Number} state
	 * @return void
	 */
	_renderPager = state => {
		const {
			paginationParent,
			paginationWrapper: wrapper,
			paginationButtons: buttons
		} = this.options

		const $parent = paginationParent ? paginationParent : this.$el

		this.$pagerWrapper = $parent.appendChild(domify(wrapper))
		this.$pagerButtons = buttons(this.$slides)
			.map(html => domify(html))
			.map((html, index) => {
				html.setAttribute('data-slide-pager', index === state ? 'active' : '')
				html.addEventListener('click', this._onPagerClick.bind(this, index))
				return html
			})

		this.$pagerWrapper.appendChild(
			this.$pagerButtons.reduce((acc, item) => {
				acc.appendChild(item)
				return acc
			}, document.createDocumentFragment())
		)
	}

	/**
	 * Request animation frame loop
	 *
	 * @function loop
	 * @return void
	 */
	_loop = () => {
		const { delay } = this.options
		this.timer = setTimeout(() => {
			this.handle = requestAnimationFrame(this._loop)
			this.next()
		}, delay)
	}

	/**
	 * @function cancelLoop
	 * @return void
	 */
	_cancelLoop = () => {
		cancelAnimationFrame(this.handle)
		clearTimeout(this.timer)
	}
}
