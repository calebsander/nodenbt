!function($) {
ttvar Selectpicker = function(element, options, e) {
ttttif (e ) {
tttttte.stopPropagation();
tttttte.preventDefault();
tttt}
ttttthis.$element = $(element);
ttttthis.$newElement = null;
ttttthis.button = null;

tttt//Merge defaults, options and data-attributes to make our options
ttttthis.options = $.extend({}, $.fn.selectpicker.defaults, this.$element.data(), typeof options == 'object' && options);

tttt//If we have no title yet, check the attribute 'title' (this is missed by jq as its not a data-attribute
ttttif(this.options.title==null)
ttttttthis.options.title = this.$element.attr('title');

tttt//Expose public methods
ttttthis.val = Selectpicker.prototype.val;
ttttthis.render = Selectpicker.prototype.render;
ttttthis.init();
tt};

ttSelectpicker.prototype = {

ttttconstructor: Selectpicker,

ttttinit: function (e) {
ttttttvar _this = this;
ttttttthis.$element.hide();
ttttttthis.multiple = this.$element.prop('multiple');


ttttttvar classList = this.$element.attr('class') !== undefined ? this.$element.attr('class').split(/\s+/) : '';
ttttttvar id = this.$element.attr('id');
ttttttthis.$element.after( this.createView() );
ttttttthis.$newElement = this.$element.next('.select');
ttttttvar select = this.$newElement;
ttttttvar menu = this.$newElement.find('.dropdown-menu');
ttttttvar menuArrow = this.$newElement.find('.dropdown-arrow');
ttttttvar menuA = menu.find('li > a');
ttttttvar liHeight = select.addClass('open').find('.dropdown-menu li > a').outerHeight();
ttttttselect.removeClass('open');
ttttttvar divHeight = menu.find('li .divider').outerHeight(true);
ttttttvar selectOffset_top = this.$newElement.offset().top;
ttttttvar size = 0;
ttttttvar menuHeight = 0;
ttttttvar selectHeight = this.$newElement.outerHeight();
ttttttthis.button = this.$newElement.find('> button');
ttttttif (id !== undefined) {
ttttttttthis.button.attr('id', id);
tttttttt$('label[for="' + id + '"]').click(function(){ select.find('button#'+id).focus(); })
tttttt}
ttttttfor (var i = 0; i < classList.length; i++) {
ttttttttif(classList[i] != 'selectpicker') {
ttttttttttthis.$newElement.addClass(classList[i]);
tttttttt}
tttttt}
tttttt//If we are multiple, then add the show-tick class by default
ttttttif(this.multiple) {
tttttttt this.$newElement.addClass('select-multiple');
tttttt}
ttttttthis.button.addClass(this.options.style);
ttttttmenu.addClass(this.options.menuStyle);
ttttttmenuArrow.addClass(function() {
ttttttttif (_this.options.menuStyle) {
ttttttttttreturn _this.options.menuStyle.replace('dropdown-', 'dropdown-arrow-');
tttttttt}
tttttt});
ttttttthis.checkDisabled();
ttttttthis.checkTabIndex();
ttttttthis.clickListener();
ttttttvar menuPadding = parseInt(menu.css('padding-top')) + parseInt(menu.css('padding-bottom')) + parseInt(menu.css('border-top-width')) + parseInt(menu.css('border-bottom-width'));
ttttttif (this.options.size == 'auto') {
ttttttttfunction getSize() {
ttttttttttvar selectOffset_top_scroll = selectOffset_top - $(window).scrollTop();
ttttttttttvar windowHeight = $(window).innerHeight();
ttttttttttvar menuExtras = menuPadding + parseInt(menu.css('margin-top')) + parseInt(menu.css('margin-bottom')) + 2;
ttttttttttvar selectOffset_bot = windowHeight - selectOffset_top_scroll - selectHeight - menuExtras;
ttttttttttmenuHeight = selectOffset_bot;
ttttttttttif (select.hasClass('dropup')) {
ttttttttttttmenuHeight = selectOffset_top_scroll - menuExtras;
tttttttttt}
ttttttttttmenu.css({'max-height' : menuHeight + 'px', 'overflow-y' : 'auto', 'min-height' : liHeight*3 + 'px'});
tttttt}
ttttttttgetSize();
tttttttt$(window).resize(getSize);
tttttttt$(window).scroll(getSize);
ttttttttif (window.MutationObserver) {
ttttttttttnew MutationObserver(getSize).observe(this.$element.get(0), {
ttttttttttttchildList: true
tttttttttt});
tttttttt} else {
ttttttttttthis.$element.bind('DOMNodeInserted', getSize);
tttttttt}
tttttt} else if (this.options.size && this.options.size != 'auto' && menu.find('li').length > this.options.size) {
ttttttttvar optIndex = menu.find("li > *").filter(':not(.divider)').slice(0,this.options.size).last().parent().index();
ttttttttvar divLength = menu.find("li").slice(0,optIndex + 1).find('.divider').length;
ttttttttmenuHeight = liHeight*this.options.size + divLength*divHeight + menuPadding;
ttttttttmenu.css({'max-height' : menuHeight + 'px', 'overflow-y' : 'scroll'});
tttttt}

tttttt// Listen for updates to the DOM and re render... (Use Mutation Observer when availiable)
ttttttif (window.MutationObserver) {
ttttttttnew MutationObserver($.proxy(this.reloadLi, this)).observe(this.$element.get(0), {
ttttttttttchildList: true
tttttttt});
tttttt} else {
ttttttttthis.$element.bind('DOMNodeInserted', $.proxy(this.reloadLi, this));
tttttt}

ttttttthis.render();
tttt},

ttttcreateDropdown: function() {
ttttttvar drop =
tttttttt"<div class='btn-group select'>" +tttttttttt
tttttttttt"<button class='btn dropdown-toggle clearfix' data-toggle='dropdown'>" +
tttttttttttt"<span class='filter-option pull-left'></span>&nbsp;" +
tttttttttttt"<span class='caret'></span>" +
tttttttttt"</button>" +
tttttttttt"<span class='dropdown-arrow'></span>" +
tttttttttt"<ul class='dropdown-menu' role='menu'>" +
tttttttttt"</ul>" +
tttttttt"</div>";

ttttttreturn $(drop);
tttt},


ttttcreateView: function() {
ttttttvar $drop = this.createDropdown();
ttttttvar $li = this.createLi();
tttttt$drop.find('ul').append($li);
ttttttreturn $drop;
tttt},

ttttreloadLi: function() {
tttttt//Remove all children.
ttttttthis.destroyLi();
tttttt//Re build
tttttt$li = this.createLi();
ttttttthis.$newElement.find('ul').append( $li );
tttttt//render view
ttttttthis.render();
tttt},

ttttdestroyLi:function() {
ttttttthis.$newElement.find('li').remove();
tttt},

ttttcreateLi: function() {

ttttttvar _this = this;
ttttttvar _li = [];
ttttttvar _liA = [];
ttttttvar _liHtml = '';

ttttttthis.$element.find('option').each(function(){
tttttttt_li.push($(this).text());
tttttt});

ttttttthis.$element.find('option').each(function(index) {
tttttttt//Get the class and text for the option
ttttttttvar optionClass = $(this).attr("class") !== undefined ? $(this).attr("class") : '';
ttttttt 	var text =t$(this).text();
ttttttt 	var subtext = $(this).data('subtext') !== undefined ? '<small class="muted">'+$(this).data('subtext')+'</small>' : '';

tttttttt//Append any subtext to the main text.
tttttttttext+=subtext;

ttttttttif ($(this).parent().is('optgroup') && $(this).data('divider') != true) {
ttttttttttif ($(this).index() == 0) {
tttttttttttt//Get the opt group label
ttttttttttttvar label = $(this).parent().attr('label');
ttttttttttttvar labelSubtext = $(this).parent().data('subtext') !== undefined ? '<small class="muted">'+$(this).parent().data('subtext')+'</small>' : '';
ttttttttttttlabel += labelSubtext;

ttttttttttttif ($(this)[0].index != 0) {
tttttttttttttt_liA.push(
tttttttttttttttt'<div class="divider"></div>'+
tttttttttttttttt'<dt>'+label+'</dt>'+ 
tttttttttttttttt_this.createA(text, "opt " + optionClass )
tttttttttttttttt);
tttttttttttt} else {
tttttttttttttt_liA.push(
tttttttttttttttt'<dt>'+label+'</dt>'+ 
tttttttttttttttt_this.createA(text, "opt " + optionClass ));
tttttttttttt}
tttttttttt} else {
tttttttttttt _liA.push( _this.createA(text, "opt " + optionClass )t);
tttttttttt}
tttttttt} else if ($(this).data('divider') == true) {
tttttttttt_liA.push('<div class="divider"></div>');
tttttttt} else if ($(this).data('hidden') == true) {
	tttttttt_liA.push('');
tttttttt} else {
tttttttttt_liA.push( _this.createA(text, optionClass ) );
tttttttt}
tttttt});

ttttttif (_li.length > 0) {
ttttttttfor (var i = 0; i < _li.length; i++) {
ttttttttttvar $option = this.$element.find('option').eq(i);
tttttttttt_liHtml += "<li rel=" + i + ">" + _liA[i] + "</li>";
tttttttt}
tttttt}

tttttt//If we dont have a selected item, and we dont have a title, select the first element so something is set in the button
ttttttif(this.$element.find('option:selected').length==0 && !_this.options.title) {
ttttttttthis.$element.find('option').eq(0).prop('selected', true).attr('selected', 'selected');
tttttt}

ttttttreturn $(_liHtml);
tttt},

ttttcreateA:function(test, classes) {
tttt return '<a tabindex="-1" href="#" class="'+classes+'">' +
tttttttt '<span class="pull-left">' + test + '</span>' +
tttttttt '</a>';

tttt},

tttt render:function() {
ttttttvar _this = this;

tttttt//Set width of select
tttttt if (this.options.width == 'auto') {
tttttttt var ulWidth = this.$newElement.find('.dropdown-menu').css('width');
tttttttt this.$newElement.css('width',ulWidth);
tttttt } else if (this.options.width && this.options.width != 'auto') {
tttttttt this.$newElement.css('width',this.options.width);
tttttt }

tttttt//Update the LI to match the SELECT
ttttttthis.$element.find('option').each(function(index) {
ttttttt _this.setDisabled(index, $(this).is(':disabled') || $(this).parent().is(':disabled') );
ttttttt _this.setSelected(index, $(this).is(':selected') );
tttttt});



ttttttvar selectedItems = this.$element.find('option:selected').map(function(index,value) {
ttttttttif($(this).attr('title')!=undefined) {
ttttttttttreturn $(this).attr('title');
tttttttt} else {
ttttttttttreturn $(this).text();
tttttttt}
tttttt}).toArray();

tttttt//Convert all the values into a comma delimited stringtt
ttttttvar title = selectedItems.join(", ");

tttttt//If this is multi select, and the selectText type is count, the show 1 of 2 selected etc..tttttttttt
ttttttif(_this.multiple && _this.options.selectedTextFormat.indexOf('count') > -1) {
ttttttttvar max = _this.options.selectedTextFormat.split(">");
ttttttttif( (max.length>1 && selectedItems.length > max[1]) || (max.length==1 && selectedItems.length>=2)) {
tttttttttttitle = selectedItems.length +' of ' + this.$element.find('option').length + ' selected';
tttttttt}
tttttt }t
tttttt
tttttt//If we dont have a title, then use the default, or if nothing is set at all, use the not selected text
ttttttif(!title) {
tttttttttitle = _this.options.title != undefined ? _this.options.title : _this.options.noneSelectedText;tt
tttttt}
tttttt
ttttttthis.$element.next('.select').find('.filter-option').html( title );
	tt},
	tt
tttt
tttt
ttttsetSelected:function(index, selected) {
ttttttif(selected) {
ttttttttthis.$newElement.find('li').eq(index).addClass('selected');
tttttt} else {
ttttttttthis.$newElement.find('li').eq(index).removeClass('selected');
tttttt}
tttt},
tttt
ttttsetDisabled:function(index, disabled) {
ttttttif(disabled) {
ttttttttthis.$newElement.find('li').eq(index).addClass('disabled');
tttttt} else {
ttttttttthis.$newElement.find('li').eq(index).removeClass('disabled');
tttttt}
tttt},
ttt 
ttttcheckDisabled: function() {
ttttttif (this.$element.is(':disabled')) {
ttttttttthis.button.addClass('disabled');
ttttttttthis.button.click(function(e) {
tttttttttte.preventDefault();
tttttttt});
tttttt}
tttt},
		
		checkTabIndex: function() {
			if (this.$element.is('[tabindex]')) {
				var tabindex = this.$element.attr("tabindex");
				this.button.attr('tabindex', tabindex);
			}
		},
		
		clickListener: function() {
ttttttvar _this = this;
tttttt
tttttt$('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });
tttttt
ttttt 
tttttt
ttttttthis.$newElement.on('click', 'li a', function(e){
ttttttttvar clickedIndex = $(this).parent().index(),
tttttttttt$this = $(this).parent(),
tttttttttt$select = $this.parents('.select');
tttttttt
tttttttt
tttttttt//Dont close on multi choice menutt
ttttttttif(_this.multiple) {
tttttttttte.stopPropagation();
tttttttt}
tttttttt
tttttttte.preventDefault();
tttttttt
tttttttt//Dont run if we have been disabled
ttttttttif ($select.prev('select').not(':disabled') && !$(this).parent().hasClass('disabled')){
tttttttttt//Deselect all others if not multi select box
ttttttttttif (!_this.multiple) {
tttttttttttt$select.prev('select').find('option').removeAttr('selected');
tttttttttttt$select.prev('select').find('option').eq(clickedIndex).prop('selected', true).attr('selected', 'selected');
tttttttttt} 
tttttttttt//Else toggle the one we have chosen if we are multi selet.
ttttttttttelse {
ttttttttttttvar selected = $select.prev('select').find('option').eq(clickedIndex).prop('selected');
tttttttttttt
ttttttttttttif(selected) {
tttttttttttttt$select.prev('select').find('option').eq(clickedIndex).removeAttr('selected');
tttttttttttt} else {
tttttttttttttt$select.prev('select').find('option').eq(clickedIndex).prop('selected', true).attr('selected', 'selected');
tttttttttttt}
tttttttttt}
tttttttttt
tttttttttt
tttttttttt$select.find('.filter-option').html($this.text());
tttttttttt$select.find('button').focus();

tttttttttt// Trigger select 'change'
tttttttttt$select.prev('select').trigger('change');
tttttttt}

tttttt});
tttttt
ttttt this.$newElement.on('click', 'li.disabled a, li dt, li .divider', function(e) {
tttttttte.preventDefault();
tttttttte.stopPropagation();
tttttttt$select = $(this).parent().parents('.select');
tttttttt$select.find('button').focus();
tttttt});

ttttttthis.$element.on('change', function(e) {
tttttttt_this.render();
tttttt});
tttt},
tttt
ttttval:function(value) {
tttttt
ttttttif(value!=undefined) {
ttttttttthis.$element.val( value );
tttttttt
ttttttttthis.$element.trigger('change');
ttttttttreturn this.$element;
tttttt} else {
ttttttttreturn this.$element.val();
tttttt}
tttt}

tt};

tt$.fn.selectpicker = function(option, event) {
ttt //get the args of the outer function..
ttt var args = arguments;
ttt var value;
ttt var chain = this.each(function () {
ttttttvar $this = $(this),
ttttttttdata = $this.data('selectpicker'),
ttttttttoptions = typeof option == 'object' && option;
tttttt
ttttttif (!data) {
tttttt	$this.data('selectpicker', (data = new Selectpicker(this, options, event)));
tttttt} else {
tttttt	for(var i in option) {
tttttt		data[i]=option[i];
tttttt	}
tttttt}
tttttt
ttttttif (typeof option == 'string') {
tttttttt//Copy the value of option, as once we shift the arguments
tttttttt//it also shifts the value of option.
ttttttttproperty = option;
ttttttttif(data[property] instanceof Function) {
tttttttttt[].shift.apply(args);
ttttttttttvalue = data[property].apply(data, args);
tttttttt} else {
ttttttttttvalue = data[property];
tttttttt}
tttttt}
tttt});
tttt
ttttif(value!=undefined) {
ttttttreturn value;
tttt} else {
ttttttreturn chain;
tttt} 
tt};

tt$.fn.selectpicker.defaults = {
ttttstyle: null,
ttttsize: 'auto',
tttttitle: null,
ttttselectedTextFormat : 'values',
ttttnoneSelectedText : 'Nothing selected',
ttttwidth: null,
ttttmenuStyle: null,
tttttoggleSize: null
tt}

}(window.jQuery);
