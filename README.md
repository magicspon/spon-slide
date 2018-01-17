# Wallop with whistles

Inspired by: http://pedroduarte.me/wallop

examples en route...

## Install

`npm install spon-slide` or `yarn add spon-slide`

Import

```
/*
	Options:

	animationType: {String} - animation, transition, custom
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

	$n.emitter('spon:prev') - on prev click
	$n.emitter('spon:next') - on next click
	$n.emitter('spon:before') - before promise
	$n.emitter('spon:change') - on change
	$n.emitter('spon:after') - after animation

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
```
