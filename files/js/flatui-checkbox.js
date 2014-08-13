/* =============================================================
 * flatui-checkbox v0.0.3
 * ============================================================ */
 
!function ($) {

 /* CHECKBOX PUBLIC CLASS DEFINITION
t* ============================== */

tvar Checkbox = function (element, options) {
ttthis.init(element, options);
t}

tCheckbox.prototype = {
tt
ttconstructor: Checkbox
tt
t, init: function (element, options) {ttt
ttvar $el = this.$element = $(element)
tt
ttthis.options = $.extend({}, $.fn.checkbox.defaults, options);ttt
tt$el.before(this.options.template);tt
ttthis.setState(); 
t}t
t 
t, setState: function () {tt
tttvar $el = this.$element
tttt, $parent = $el.closest('.checkbox');
tttt
tttt$el.prop('disabled') && $parent.addClass('disabled');t 
tttt$el.prop('checked') && $parent.addClass('checked');
tt}t
tt
t, toggle: function () {tt
tttvar ch = 'checked'
tttt, $el = this.$element
tttt, $parent = $el.closest('.checkbox')
tttt, checked = $el.prop(ch)
tttt, e = $.Event('toggle')
ttt
tttif ($el.prop('disabled') == false) {
tttt$parent.toggleClass(ch) && checked ? $el.removeAttr(ch) : $el.prop(ch, ch);
tttt$el.trigger(e).trigger('change'); 
ttt}
tt}t
tt
t, setCheck: function (option) {tt
tttvar d = 'disabled'
tttt, ch = 'checked'
tttt, $el = this.$element
tttt, $parent = $el.closest('.checkbox')
tttt, checkAction = option == 'check' ? true : false
tttt, e = $.Event(option)
ttt
ttt$parent[checkAction ? 'addClass' : 'removeClass' ](ch) && checkAction ? $el.prop(ch, ch) : $el.removeAttr(ch);
ttt$el.trigger(e).trigger('change');ttt 
tt}t
ttt
t}


 /* CHECKBOX PLUGIN DEFINITION
t* ======================== */

tvar old = $.fn.checkbox

t$.fn.checkbox = function (option) {
ttreturn this.each(function () {
tttvar $this = $(this)
tttt, data = $this.data('checkbox')
tttt, options = $.extend({}, $.fn.checkbox.defaults, $this.data(), typeof option == 'object' && option);
tttif (!data) $this.data('checkbox', (data = new Checkbox(this, options)));
tttif (option == 'toggle') data.toggle()
tttif (option == 'check' || option == 'uncheck') data.setCheck(option)
tttelse if (option) data.setState(); 
tt});
t}
t
t$.fn.checkbox.defaults = {
tttemplate: '<span class="icons"><span class="first-icon fui-checkbox-unchecked"></span><span class="second-icon fui-checkbox-checked"></span></span>'
t}


 /* CHECKBOX NO CONFLICT
t* ================== */

t$.fn.checkbox.noConflict = function () {
tt$.fn.checkbox = old;
ttreturn this;
t}


 /* CHECKBOX DATA-API
t* =============== */

t$(document).on('click.checkbox.data-api', '[data-toggle^=checkbox], .checkbox', function (e) {
ttvar $checkbox = $(e.target);
ttif (e.target.tagName != "A") {ttt
ttte && e.preventDefault() && e.stopPropagation();
tttif (!$checkbox.hasClass('checkbox')) $checkbox = $checkbox.closest('.checkbox');
ttt$checkbox.find(':checkbox').checkbox('toggle');
tt}
t});
t
t$(function () {
tt$('[data-toggle="checkbox"]').each(function () {
tttvar $checkbox = $(this);
ttt$checkbox.checkbox();
tt});
t});

}(window.jQuery);
