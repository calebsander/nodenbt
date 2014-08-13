/* ============================================================
 * bootstrapSwitch v1.3 by Larentis Mattia @spiritualGuru
 * http://www.larentis.eu/switch/
 * ============================================================
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 * ============================================================ */

!function ($) {
t"use strict";

t$.fn['bootstrapSwitch'] = function (method) {
ttvar methods = {
tttinit: function () {
ttttreturn this.each(function () {
ttttttvar $element = $(this)
ttttttt, $div
ttttttt, $switchLeft
ttttttt, $switchRight
ttttttt, $label
ttttttt, myClasses = ""
ttttttt, classes = $element.attr('class')
ttttttt, color
ttttttt, moving
ttttttt, onLabel = "ON"
ttttttt, offLabel = "OFF"
ttttttt, icon = false;

tttttt$.each(['switch-mini', 'switch-small', 'switch-large'], function (i, el) {
tttttttif (classes.indexOf(el) >= 0)
ttttttttmyClasses = el;
tttttt});

tttttt$element.addClass('has-switch');

ttttttif ($element.data('on') !== undefined)
tttttttcolor = "switch-" + $element.data('on');

ttttttif ($element.data('on-label') !== undefined)
tttttttonLabel = $element.data('on-label');

ttttttif ($element.data('off-label') !== undefined)
tttttttoffLabel = $element.data('off-label');

ttttttif ($element.data('icon') !== undefined)
ttttttticon = $element.data('icon');

tttttt$switchLeft = $('<span>')
ttttttt.addClass("switch-left")
ttttttt.addClass(myClasses)
ttttttt.addClass(color)
ttttttt.html(onLabel);

ttttttcolor = '';
ttttttif ($element.data('off') !== undefined)
tttttttcolor = "switch-" + $element.data('off');

tttttt$switchRight = $('<span>')
ttttttt.addClass("switch-right")
ttttttt.addClass(myClasses)
ttttttt.addClass(color)
ttttttt.html(offLabel);

tttttt$label = $('<label>')
ttttttt.html("&nbsp;")
ttttttt.addClass(myClasses)
ttttttt.attr('for', $element.find('input').attr('id'));

ttttttif (icon) {
ttttttt$label.html('<i class="' + icon + '"></i>');
tttttt}

tttttt$div = $element.find(':checkbox').wrap($('<div>')).parent().data('animated', false);

ttttttif ($element.data('animated') !== false)
ttttttt$div.addClass('switch-animate').data('animated', true);

tttttt$div
ttttttt.append($switchLeft)
ttttttt.append($label)
ttttttt.append($switchRight);

tttttt$element.find('>div').addClass(
ttttttt$element.find('input').is(':checked') ? 'switch-on' : 'switch-off'
tttttt);

ttttttif ($element.find('input').is(':disabled'))
ttttttt$(this).addClass('deactivate');

ttttttvar changeStatus = function ($this) {
ttttttt$this.siblings('label').trigger('mousedown').trigger('mouseup').trigger('click');
tttttt};

tttttt$element.on('keydown', function (e) {
tttttttif (e.keyCode === 32) {
tttttttte.stopImmediatePropagation();
tttttttte.preventDefault();
ttttttttchangeStatus($(e.target).find('span:first'));
ttttttt}
tttttt});

tttttt$switchLeft.on('click', function (e) {
tttttttchangeStatus($(this));
tttttt});

tttttt$switchRight.on('click', function (e) {
tttttttchangeStatus($(this));
tttttt});

tttttt$element.find('input').on('change', function (e) {
tttttttvar $this = $(this)
tttttttt, $element = $this.parent()
tttttttt, thisState = $this.is(':checked')
tttttttt, state = $element.is('.switch-off');

ttttttte.preventDefault();

ttttttt$element.css('left', '');

tttttttif (state === thisState) {

ttttttttif (thisState)
ttttttttt$element.removeClass('switch-off').addClass('switch-on');
ttttttttelse $element.removeClass('switch-on').addClass('switch-off');

ttttttttif ($element.data('animated') !== false)
ttttttttt$element.addClass("switch-animate");

tttttttt$element.parent().trigger('switch-change', {'el': $this, 'value': thisState})
ttttttt}
tttttt});

tttttt$element.find('label').on('mousedown touchstart', function (e) {
tttttttvar $this = $(this);
tttttttmoving = false;

ttttttte.preventDefault();
ttttttte.stopImmediatePropagation();

ttttttt$this.closest('div').removeClass('switch-animate');

tttttttif ($this.closest('.has-switch').is('.deactivate'))
tttttttt$this.unbind('click');
tttttttelse {
tttttttt$this.on('mousemove touchmove', function (e) {
tttttttttvar $element = $(this).closest('.switch')
tttttttttt, relativeX = (e.pageX || e.originalEvent.targetTouches[0].pageX) - $element.offset().left
tttttttttt, percent = (relativeX / $element.width()) * 100
tttttttttt, left = 25
tttttttttt, right = 75;

tttttttttmoving = true;

tttttttttif (percent < left)
ttttttttttpercent = left;
tttttttttelse if (percent > right)
ttttttttttpercent = right;

ttttttttt$element.find('>div').css('left', (percent - right) + "%")
tttttttt});

tttttttt$this.on('click touchend', function (e) {
tttttttttvar $this = $(this)
tttttttttt, $target = $(e.target)
tttttttttt, $myCheckBox = $target.siblings('input');

ttttttttte.stopImmediatePropagation();
ttttttttte.preventDefault();

ttttttttt$this.unbind('mouseleave');

tttttttttif (moving)
tttttttttt$myCheckBox.prop('checked', !(parseInt($this.parent().css('left')) < -25));
tttttttttelse $myCheckBox.prop("checked", !$myCheckBox.is(":checked"));

tttttttttmoving = false;
ttttttttt$myCheckBox.trigger('change');
tttttttt});

tttttttt$this.on('mouseleave', function (e) {
tttttttttvar $this = $(this)
tttttttttt, $myCheckBox = $this.siblings('input');

ttttttttte.preventDefault();
ttttttttte.stopImmediatePropagation();

ttttttttt$this.unbind('mouseleave');
ttttttttt$this.trigger('mouseup');

ttttttttt$myCheckBox.prop('checked', !(parseInt($this.parent().css('left')) < -25)).trigger('change');
tttttttt});

tttttttt$this.on('mouseup', function (e) {
ttttttttte.stopImmediatePropagation();
ttttttttte.preventDefault();

ttttttttt$(this).unbind('mousemove');
tttttttt});
ttttttt}
tttttt});
ttttt}
tttt);
ttt},
ttttoggleActivation: function () {
tttt$(this).toggleClass('deactivate');
ttt},
tttisActive: function () {
ttttreturn !$(this).hasClass('deactivate');
ttt},
tttsetActive: function (active) {
ttttif (active)
ttttt$(this).removeClass('deactivate');
ttttelse $(this).addClass('deactivate');
ttt},
ttttoggleState: function (skipOnChange) {
ttttvar $input = $(this).find('input:checkbox');
tttt$input.prop('checked', !$input.is(':checked')).trigger('change', skipOnChange);
ttt},
tttsetState: function (value, skipOnChange) {
tttt$(this).find('input:checkbox').prop('checked', value).trigger('change', skipOnChange);
ttt},
tttstatus: function () {
ttttreturn $(this).find('input:checkbox').is(':checked');
ttt},
tttdestroy: function () {
ttttvar $div = $(this).find('div')
ttttt, $checkbox;

tttt$div.find(':not(input:checkbox)').remove();

tttt$checkbox = $div.children();
tttt$checkbox.unwrap().unwrap();

tttt$checkbox.unbind('change');

ttttreturn $checkbox;
ttt}
tt};

ttif (methods[method])
tttreturn methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
ttelse if (typeof method === 'object' || !method)
tttreturn methods.init.apply(this, arguments);
ttelse
ttt$.error('Method ' + method + ' does not exist!');
t};
}(jQuery);

$(function () {
t$('.switch')['bootstrapSwitch']();
});
