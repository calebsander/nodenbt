/* =============================================================
 * flatui-radio v0.0.3
 * ============================================================ */

!function ($) {

 /* RADIO PUBLIC CLASS DEFINITION
t* ============================== */

tvar Radio = function (element, options) {
ttthis.init(element, options);
t}

tRadio.prototype = {
t
ttconstructor: Radio
tt
t, init: function (element, options) {ttt
tttvar $el = this.$element = $(element)
ttt
tttthis.options = $.extend({}, $.fn.radio.defaults, options);ttt
ttt$el.before(this.options.template);tt
tttthis.setState();
tt}t 
tt
t, setState: function () {tt
tttvar $el = this.$element
tttt, $parent = $el.closest('.radio');
tttt
tttt$el.prop('disabled') && $parent.addClass('disabled');t 
tttt$el.prop('checked') && $parent.addClass('checked');
tt} 
tt
t, toggle: function () {tt
tttvar d = 'disabled'
tttt, ch = 'checked'
tttt, $el = this.$element
tttt, checked = $el.prop(ch)
tttt, $parent = $el.closest('.radio')ttt
tttt, $parentWrap = $el.closest('form').length ? $el.closest('form') : $el.closest('body')
tttt, $elemGroup = $parentWrap.find(':radio[name="' + $el.attr('name') + '"]')
tttt, e = $.Event('toggle')
tttt
tttt$elemGroup.not($el).each(function () {
tttttvar $el = $(this)
tttttt, $parent = $(this).closest('.radio');
tttttt
ttttttif ($el.prop(d) == false) {
ttttttt$parent.removeClass(ch) && $el.removeAttr(ch).trigger('change');
tttttt} 
tttt});
ttt
ttttif ($el.prop(d) == false) {
tttttif (checked == false) $parent.addClass(ch) && $el.prop(ch, true);
ttttt$el.trigger(e);
ttttt
tttttif (checked !== $el.prop(ch)) {
tttttt$el.trigger('change'); 
ttttt}
tttt}ttttttt 
tt} 
tt 
t, setCheck: function (option) {tt
tttvar ch = 'checked'
tttt, $el = this.$element
tttt, $parent = $el.closest('.radio')
tttt, checkAction = option == 'check' ? true : false
tttt, checked = $el.prop(ch)
tttt, $parentWrap = $el.closest('form').length ? $el.closest('form') : $el.closest('body')
tttt, $elemGroup = $parentWrap.find(':radio[name="' + $el['attr']('name') + '"]')
tttt, e = $.Event(option)
tttt
ttt$elemGroup.not($el).each(function () {
ttttvar $el = $(this)
ttttt, $parent = $(this).closest('.radio');
ttttt
ttttt$parent.removeClass(ch) && $el.removeAttr(ch);
ttt});
tttttt
ttt$parent[checkAction ? 'addClass' : 'removeClass'](ch) && checkAction ? $el.prop(ch, ch) : $el.removeAttr(ch);
ttt$el.trigger(e);t
ttttt
tttif (checked !== $el.prop(ch)) {
tttt$el.trigger('change'); 
ttt}
tt}t
tt 
t}


 /* RADIO PLUGIN DEFINITION
t* ======================== */

tvar old = $.fn.radio

t$.fn.radio = function (option) {
ttreturn this.each(function () {
tttvar $this = $(this)
tttt, data = $this.data('radio')
tttt, options = $.extend({}, $.fn.radio.defaults, $this.data(), typeof option == 'object' && option);
tttif (!data) $this.data('radio', (data = new Radio(this, options)));
tttif (option == 'toggle') data.toggle()
tttif (option == 'check' || option == 'uncheck') data.setCheck(option)
tttelse if (option) data.setState(); 
tt});
t}
t
t$.fn.radio.defaults = {
tttemplate: '<span class="icons"><span class="first-icon fui-radio-unchecked"></span><span class="second-icon fui-radio-checked"></span></span>'
t}


 /* RADIO NO CONFLICT
t* ================== */

t$.fn.radio.noConflict = function () {
tt$.fn.radio = old;
ttreturn this;
t}


 /* RADIO DATA-API
t* =============== */

t$(document).on('click.radio.data-api', '[data-toggle^=radio], .radio', function (e) {
ttvar $radio = $(e.target);
tte && e.preventDefault() && e.stopPropagation();
ttif (!$radio.hasClass('radio')) $radio = $radio.closest('.radio');
tt$radio.find(':radio').radio('toggle');
t});
t
t$(function () {
tt$('[data-toggle="radio"]').each(function () {
tttvar $radio = $(this);
ttt$radio.radio();
tt});
t});

}(window.jQuery);
