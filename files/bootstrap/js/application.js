// NOTICE!! DO NOT USE ANY OF THIS JAVASCRIPT
// IT'S ALL JUST JUNK FOR OUR DOCS!
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

t$(function(){

ttvar $window = $(window)

tt// Disable certain links in docs
tt$('section [href^=#]').click(function (e) {
ttte.preventDefault()
tt})

tt// side bar
ttsetTimeout(function () {
ttt$('.bs-docs-sidenav').affix({
ttttoffset: {
ttttttop: function () { return $window.width() <= 980 ? 290 : 210 }
tttt, bottom: 270
tttt}
ttt})
tt}, 100)

tt// make code pretty
ttwindow.prettyPrint && prettyPrint()

tt// add-ons
tt$('.add-on :checkbox').on('click', function () {
tttvar $this = $(this)
tttt, method = $this.attr('checked') ? 'addClass' : 'removeClass'
ttt$(this).parents('.add-on')[method]('active')
tt})

tt// add tipsies to grid for scaffolding
ttif ($('#gridSystem').length) {
ttt$('#gridSystem').tooltip({
tttttselector: '.show-grid > [class*="span"]'
tttt, title: function () { return $(this).width() + 'px' }
ttt})
tt}

tt// tooltip demo
tt$('.tooltip-demo').tooltip({
tttselector: "a[data-toggle=tooltip]"
tt})

tt$('.tooltip-test').tooltip()
tt$('.popover-test').popover()

tt// popover demo
tt$("a[data-toggle=popover]")
ttt.popover()
ttt.click(function(e) {
tttte.preventDefault()
ttt})

tt// button state demo
tt$('#fat-btn')
ttt.click(function () {
ttttvar btn = $(this)
ttttbtn.button('loading')
ttttsetTimeout(function () {
tttttbtn.button('reset')
tttt}, 3000)
ttt})

tt// carousel demo
tt$('#myCarousel').carousel()

tt// javascript build logic
ttvar inputsComponent = $("#components.download input")
ttt, inputsPlugin = $("#plugins.download input")
ttt, inputsVariables = $("#variables.download input")

tt// toggle all plugin checkboxes
tt$('#components.download .toggle-all').on('click', function (e) {
ttte.preventDefault()
tttinputsComponent.attr('checked', !inputsComponent.is(':checked'))
tt})

tt$('#plugins.download .toggle-all').on('click', function (e) {
ttte.preventDefault()
tttinputsPlugin.attr('checked', !inputsPlugin.is(':checked'))
tt})

tt$('#variables.download .toggle-all').on('click', function (e) {
ttte.preventDefault()
tttinputsVariables.val('')
tt})

tt// request built javascript
tt$('.download-btn .btn').on('click', function () {

tttvar css = $("#components.download input:checked")
tttttt.map(function () { return this.value })
tttttt.toArray()
tttt, js = $("#plugins.download input:checked")
tttttt.map(function () { return this.value })
tttttt.toArray()
tttt, vars = {}
tttt, img = ['glyphicons-halflings.png', 'glyphicons-halflings-white.png']

tt$("#variables.download input")
ttt.each(function () {
tttt$(this).val() && (vars[ $(this).prev().text() ] = $(this).val())
ttt})

ttt$.ajax({
tttttype: 'POST'
ttt, url: /\?dev/.test(window.location) ? 'http://localhost:3000' : 'http://bootstrap.herokuapp.com'
ttt, dataType: 'jsonpi'
ttt, params: {
tttttjs: js
tttt, css: css
tttt, vars: vars
tttt, img: img
ttt}
ttt})
tt})
t})

// Modified from the original jsonpi https://github.com/benvinegar/jquery-jsonpi
$.ajaxTransport('jsonpi', function(opts, originalOptions, jqXHR) {
tvar url = opts.url;

treturn {
ttsend: function(_, completeCallback) {
tttvar name = 'jQuery_iframe_' + jQuery.now()
tttt, iframe, form

tttiframe = $('<iframe>')
tttt.attr('name', name)
tttt.appendTo('head')

tttform = $('<form>')
tttt.attr('method', opts.type) // GET or POST
tttt.attr('action', url)
tttt.attr('target', name)

ttt$.each(opts.params, function(k, v) {

tttt$('<input>')
ttttt.attr('type', 'hidden')
ttttt.attr('name', k)
ttttt.attr('value', typeof v == 'string' ? v : JSON.stringify(v))
ttttt.appendTo(form)
ttt})

tttform.appendTo('body').submit()
tt}
t}
})

}(window.jQuery)
