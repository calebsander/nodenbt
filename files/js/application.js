// Some general UI pack related JS
// Extend JS String with repeat method
String.prototype.repeat = function(num) {
treturn new Array(num + 1).join(this);
};

(function($) {

t// Add segments to a slider
t$.fn.addSliderSegments = function (amount, orientation) {tt
ttreturn this.each(function () {
tttif (orientation == "vertical") {
ttttvar output = ''
ttttt, i;
ttttfor (i = 1; i <= amount - 2; i++) {
tttttoutput += '<div class="ui-slider-segment" style="top:' + 100 / (amount - 1) * i + '%;"></div>';
tttt};
tttt$(this).prepend(output);
ttt} else {
ttttvar segmentGap = 100 / (amount - 1) + "%"
ttttt, segment = '<div class="ui-slider-segment" style="margin-left: ' + segmentGap + ';"></div>';
tttt$(this).prepend(segment.repeat(amount - 2));
ttt}
tt});
t};

t$(function() {
t
tt// Todo list
tt$(".todo").on('click', 'li', function() {
ttt$(this).toggleClass("todo-done");
tt});

tt// Custom Selects
tt$("select[name='huge']").selectpicker({style: 'btn-hg btn-primary', menuStyle: 'dropdown-inverse'});
tt$("select[name='herolist']").selectpicker({style: 'btn-primary', menuStyle: 'dropdown-inverse'});
tt$("select[name='info']").selectpicker({style: 'btn-info'});

tt// Tooltips
tt$("[data-toggle=tooltip]").tooltip("show");

tt// Tags Input
tt$(".tagsinput").tagsInput();

tt// jQuery UI Sliders
ttvar $slider = $("#slider");
ttif ($slider.length) {
ttt$slider.slider({
ttttmin: 1,
ttttmax: 5,
ttttvalue: 2,
ttttorientation: "horizontal",
ttttrange: "min"
ttt}).addSliderSegments($slider.slider("option").max);
tt}

ttvar $verticalSlider = $("#vertical-slider");
ttif ($verticalSlider.length) {
ttt$verticalSlider.slider({
ttttmin: 1,
ttttmax: 5,
ttttvalue: 3,
ttttorientation: "vertical",
ttttrange: "min"
ttt}).addSliderSegments($verticalSlider.slider("option").max, "vertical");
tt}

tt// Placeholders for input/textarea
tt$(":text, textarea").placeholder();

tt// Focus state for append/prepend inputs
tt$('.input-group').on('focus', '.form-control', function () {
ttt$(this).closest('.input-group, .form-group').addClass('focus');
tt}).on('blur', '.form-control', function () {
ttt$(this).closest('.input-group, .form-group').removeClass('focus');
tt});

tt// Make pagination demo work
tt$(".pagination").on('click', "a", function() {
ttt$(this).parent().siblings("li").removeClass("active").end().addClass("active");
tt});

tt$(".btn-group").on('click', "a", function() {
ttt$(this).siblings().removeClass("active").end().addClass("active");
tt});

tt// Disable link clicks to prevent page scrolling
tt$(document).on('click', 'a[href="#fakelink"]', function (e) {
ttte.preventDefault();
tt});

tt// Switch
tt$("[data-toggle='switch']").wrap('<div class="switch" />').parent().bootstrapSwitch();

tttt// Typeahead
ttif($('#typeahead-demo-01').length) {
ttt$('#typeahead-demo-01').typeahead({
ttttname: 'states',
ttttlimit: 4,
ttttlocal: ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
tttt"Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
tttt"Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri",
tttt"Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Dakota",
tttt"North Carolina","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
tttt"South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]
ttt});
tt}t

tt// make code pretty
ttwindow.prettyPrint && prettyPrint();
tt
t});
t
})(jQuery);
