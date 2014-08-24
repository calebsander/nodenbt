var images = {
	TAG_Byte: '/images/TAG_Byte.png',
	TAG_Short: '/images/TAG_Short.png',
	TAG_Int: '/images/TAG_Int.png',
	TAG_Long: '/images/TAG_Long.png',
	TAG_Float: '/images/TAG_Float.png',
	TAG_Double: '/images/TAG_Double.png',
	TAG_Byte_Array: '/images/TAG_Byte_Array.png',
	TAG_String: '/images/TAG_String.png',
	TAG_List: '/images/TAG_List.png',
	TAG_Compound: '/images/TAG_Compound.png',
	TAG_Int_Array: '/images/TAG_Int_Array.png',
	edit: '/images/edit.png',
	delete: '/images/delete.png',
	rename: '/images/rename.png',
	add: '/images/add.png',
	coerce: '/images/coerce.png',
	up: '/images/up.png',
	down: '/images/down.png'
};

$.ajaxTransport('+*', function(options, originalOptions, jqXHR) {
	if (window.FormData && ((options.dataType && (options.dataType == 'blob' || options.dataType == 'arraybuffer')) || (options.data && ((window.Blob && options.data instanceof Blob) || (window.ArrayBuffer && options.data instanceof ArrayBuffer))))) {
		return {
			send: function(headers, completeCallback) {
				var xhr = new XMLHttpRequest(),
					url = options.url || window.location.href,
					type = options.type || 'GET',
					dataType = options.dataType || 'text',
					data = options.data || null,
					async = options.async || true;
 
				xhr.addEventListener('load', function() {
					var res = {};
					res[dataType] = xhr.response;
					completeCallback(xhr.status, xhr.statusText, res, xhr.getAllResponseHeaders());
				});
 
				xhr.open(type, url, async);
				xhr.responseType = dataType;
				if (data) data = new Uint8Array(data);
				xhr.send(data);
			},
			abort: function() {
				jqXHR.abort();
			}
		};
	}
});

var gzip;
function togglecontainer() {
	var container = $(this).parent().children('ul');
	if (container.is(':visible')) container.hide();
	else container.show();
}

function FileDragHover(e) {
	e.stopPropagation();
	e.preventDefault();
	if (e.type == 'dragover') $('div#filedrag').addClass('hover').text('Drop file here');
	else $('div#filedrag').removeClass('hover').text('Upload');
}
function FileSelectHandler(e) {
	FileDragHover(e);
	var files;
	if (e.dataTransfer && e.dataTransfer.files) files = e.dataTransfer.files;
	if (e.target && e.target.files) files = e.target.files;
	var reader;
	reader = new FileReader();
	reader.name = files[0].name;
	reader.type = files[0].type;
	reader.onload = function(e) {
		$('div#nbt').children().remove();
		$('div#nbt').prepend($('<div>').attr('id', 'loading').text('Parsing...'));
		$.ajax({
			url: '/upload',
			type: 'POST',
			dataType: 'json',
			data: e.target.result,
			processData: false,
			success: (function() {
				return function(server_response) {
					gzip = server_response.gzip;
					$('li#open').removeClass('open');
					if (!server_response.success) {
						$('div#loading').text('COULD NOT PARSE').addClass('error');
						return;
					}
					$.ajax({
						url: '/nbtjson',
						dataType: 'json',
						success: (function() {
							return function(server_response) {
								if (!server_response.success) {
									$('div#loading').text('ERROR').addClass('error');
									return;
								}
								$('a#download').attr('download', e.target.name).attr('href', '/download/' + e.target.name + '?gzip=' + String(gzip));
								$('div#editor').hide();
								$('div#loading').text('Rendering...');
								setTimeout(function() {
									$('div#nbt').append($('<div>').attr('id', 'filetitle').text(e.target.name)).append($('<ul>').append(renderJSON(server_response.data)));
									if (gzip) $('div#filetitle').text($('div#filetitle').text() + ' (compressed)');
									$('div#nbt>ul>li>ul').show();
									$('div#loading').remove();
								}, 100);
							}
						}())
					});
				}
			}())
		});
	};
	reader.readAsArrayBuffer(files[0]);
}

function renderJSON(data, key) {
	var display = $('<li>');
	switch (data.type) {
		case 'TAG_Byte':
			if (key) return display.attr('key', key).attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Byte).attr('title', 'TAG_Byte')).append($('<span>').text(key + ': ' + String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce));
			else return display.attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Byte).attr('title', 'TAG_Byte')).append($('<span>').text(String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete));
		case 'TAG_Short':
			if (key) return display.attr('key', key).attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Short).attr('title', 'TAG_Short')).append($('<span>').text(key + ': ' + String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce));
			else return display.attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Short).attr('title', 'TAG_Short')).append($('<span>').text(String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete));
		case 'TAG_Int':
			if (key) return display.attr('key', key).attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Int).attr('title', 'TAG_Int')).append($('<span>').text(key + ': ' + String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce));
			else return display.attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Int).attr('title', 'TAG_Int')).append($('<span>').text(String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete));
		case 'TAG_Long':
			if (key) return display.attr('key', key).attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Long).attr('title', 'TAG_Long')).append($('<span>').text(key + ': ' + data.value).mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce));
			else return display.attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Long).attr('title', 'TAG_Long')).append($('<span>').text(data.value).mouseover(removeicons).mouseover(showedit).mouseover(showdelete));
		case 'TAG_Float':
			if (key) return display.attr('key', key).attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Float).attr('title', 'TAG_Float')).append($('<span>').text(key + ': ' + String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce));
			else return display.attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Float).attr('title', 'TAG_Float')).append($('<span>').text(String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete));
		case 'TAG_Double':
			if (key) return display.attr('key', key).attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Double).attr('title', 'TAG_Double')).append($('<span>').text(key + ': ' + String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce));
			else return display.attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_Double).attr('title', 'TAG_Double')).append($('<span>').text(String(data.value)).mouseover(removeicons).mouseover(showedit).mouseover(showdelete));
		case 'TAG_Byte_Array':
			var container = $('<ul>').addClass('nbtcontainer').hide();
			for (var i = 0; i < data.value.length; i++) container.append(renderJSON({type: 'TAG_Byte', value: data.value[i]}));
			addudicons(container);
			if (key) return display.attr('key', key).append($('<img>').addClass('type').attr('src', images.TAG_Byte_Array).attr('title', 'TAG_Byte_Array').click(togglecontainer)).append($('<span>').text(key + ':').mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce)).append(container);
			else return display.append($('<img>').addClass('type').attr('src', images.TAG_Byte_Array).attr('title', 'TAG_Byte_Array').click(togglecontainer).mouseover(removeicons).mouseover(showedit).mouseover(showdelete)).append(container);
		case 'TAG_String':
			if (key) return display.attr('key', key).attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_String).attr('title', 'TAG_String')).append($('<span>').text(key + ': ' + '"' + data.value + '"').mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce));
			else return display.attr('value', data.value).append($('<img>').addClass('type').attr('src', images.TAG_String).attr('title', 'TAG_String')).append($('<span>').text('"' + data.value + '"').mouseover(removeicons).mouseover(showedit).mouseover(showdelete));
		case 'TAG_List':
			var container = $('<ul>').addClass('nbtcontainer').hide();
			for (var i = 0; i < data.value.list.length; i++) container.append(renderJSON({type: data.value.type, value: data.value.list[i]}));
			addudicons(container);
			if (key) {
				display.attr('key', key).attr('type', String(data.value.type)).append($('<img>').addClass('type').attr('src', images.TAG_List).attr('title', 'TAG_List').click(togglecontainer)).append($('<span>').text(key + ':').mouseover(removeicons).mouseover(showdelete).mouseover(showrename).mouseover(showadd)).append(container);
				if (coerceto[String(data.value.type)]) display.children('span').mouseover(showcoerce);
				return display;
			}
			else {
				display.attr('type', String(data.value.type)).append($('<img>').addClass('type').attr('src', images.TAG_List).attr('title', 'TAG_List').click(togglecontainer).mouseover(removeicons).mouseover(showdelete).mouseover(showadd)).append(container);
				if (coerceto[String(data.value.type)]) display.children('img').mouseover(showcoerce);
				return display;
			}
		case 'TAG_Compound':
			var container = $('<ul>').addClass('nbtcontainer').hide();
			for (var i in data.value) container.append(renderJSON(data.value[i], i));
			if (key) return display.attr('key', key).append($('<img>').addClass('type').attr('src', images.TAG_Compound).attr('title', 'TAG_Compound').click(togglecontainer)).append($('<span>').text(key + ':').mouseover(removeicons).mouseover(showdelete).mouseover(showrename).mouseover(showadd)).append(container);
			else return display.append($('<img>').addClass('type').attr('src', images.TAG_Compound).attr('title', 'TAG_Compound').click(togglecontainer).mouseover(removeicons).mouseover(showdelete).mouseover(showadd)).append(container);
		case 'TAG_Int_Array':
			var container = $('<ul>').addClass('nbtcontainer').hide();
			for (var i = 0; i < data.value.length; i++) container.append(renderJSON({type: 'TAG_Int', value: data.value[i]}));
			addudicons(container);
			if (key) return display.attr('key', key).append($('<img>').addClass('type').attr('src', images.TAG_Int_Array).attr('title', 'TAG_Int_Array').click(togglecontainer)).append($('<span>').text(key + ':').mouseover(removeicons).mouseover(showedit).mouseover(showdelete).mouseover(showrename).mouseover(showcoerce)).append(container);
			else return display.append($('<img>').addClass('type').attr('src', images.TAG_Int_Array).attr('title', 'TAG_Int_Array').click(togglecontainer).mouseover(removeicons).mouseover(showedit).mouseover(showdelete)).append(container);
		default:
			throw new Error('No such tag: ' + data.type);
	}
}

var savetag;
function removeicons() {
	if (editimg && !$(this).is(editimg) && !$(this).children('img.edit').is(editimg)) editimg.remove();
	if (deleteimg && !$(this).is(deleteimg) && !$(this).children('img.delete').is(deleteimg)) deleteimg.remove();
	if (renameimg && !$(this).is(renameimg) && !$(this).children('img.rename').is(renameimg)) renameimg.remove();
	if (addimg && !$(this).is(addimg) && !$(this).children('img.add').is(addimg)) addimg.remove();
	if (coerceimg && !$(this).is(coerceimg) && !$(this).children('img.coerce').is(coerceimg)) coerceimg.remove();
	if (upimg && !$(this).is(upimg) && !$(this).children('img.up').is(upimg)) upimg.remove();
	if (downimg && !$(this).is(downimg) && !$(this).children('img.down').is(downimg)) downimg.remove();
}

var editimg, editor, editororig;
function edit() {
	closeall();
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	savetag = parent;
	switch (parent.children('img.type').attr('src')) {
		case images.TAG_Byte:
			if (parent.attr('key')) {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = parent.children('span').text();
				editor.setValue(parent.children('span').text());
				$('div#editor h3.panel-title').text('Editing TAG_Byte');
			}
			break;
		case images.TAG_Short:
			if (parent.attr('key')) {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = parent.children('span').text();
				editor.setValue(parent.children('span').text());
				$('div#editor h3.panel-title').text('Editing TAG_Short');
			}
			break;
		case images.TAG_Int:
			if (parent.attr('key')) {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = parent.children('span').text();
				editor.setValue(parent.children('span').text());
				$('div#editor h3.panel-title').text('Editing TAG_Int');
			}
			break;
		case images.TAG_Long:
			if (parent.attr('key')) {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = parent.children('span').text();
				editor.setValue(parent.children('span').text());
				$('div#editor h3.panel-title').text('Editing TAG_Long');
			}
			break;
		case images.TAG_Float:
			if (parent.attr('key')) {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = parent.children('span').text();
				editor.setValue(parent.children('span').text());
				$('div#editor h3.panel-title').text('Editing TAG_Float');
			}
			break;
		case images.TAG_Double:
			if (parent.attr('key')) {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = parent.children('span').text();
				editor.setValue(parent.children('span').text());
				$('div#editor h3.panel-title').text('Editing TAG_Double');
			}
			break;
		case images.TAG_Byte_Array:
			var editorvalue = '';
			var elements = parent.children('ul').children();
			for (var i = 0; i < elements.length; i++) editorvalue += elements.eq(i).text() + '\n';
			editorvalue = editorvalue.substring(0, editorvalue.length - 1);
			if (parent.attr('key')) {
				editororig = editorvalue;
				editor.setValue(editorvalue);
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = editorvalue;
				editor.setValue(editorvalue);
				$('div#editor h3.panel-title').text('Editing TAG_Byte_Array');
			}
			break;
		case images.TAG_String:
			if (parent.attr('key')) {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = parent.attr('value');
				editor.setValue(parent.attr('value'));
				$('div#editor h3.panel-title').text('Editing TAG_Double');
			}
			break;
		case images.TAG_Int_Array:
			var editorvalue = '';
			var elements = parent.children('ul').children();
			for (var i = 0; i < elements.length; i++) editorvalue += elements.eq(i).text() + '\n';
			editorvalue = editorvalue.substring(0, editorvalue.length - 1);
			if (parent.attr('key')) {
				editororig = editorvalue;
				editor.setValue(editorvalue);
				$('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			}
			else {
				editororig = editorvalue;
				editor.setValue(editorvalue);
				$('div#editor h3.panel-title').text('Editing TAG_Int_Array');
			}
			break;
		default:
			throw new Error('No such tag: ' + parent.children('img.type').attr('src'));
	}
	$('div#editor').show();
	editor.focus();
}
function showedit() {
	if (!$(this).is(editimg) && !$(this).children('img.edit').is(editimg)) {
		editimg = $('<img>').addClass('edit').attr('src', images.edit).attr('title', 'Edit value').click(edit);
		if ($(this).is('img')) $(this).after(editimg);
		else $(this).append(editimg);
	}
}
function valuecheck(type, value) {
	switch (type) {
		case images.TAG_Byte:
			value = Number(value);
			if (value < -128 || value > 127 || isNaN(value) || value == '' || Math.floor(value) != value) return {success: false, message: String(value) + " is out of TAG_Byte's range"};
			return {success: true, value: value};
		case images.TAG_Short:
			value = Number(value);
			if (value < -32768 || value > 32767 || isNaN(value) || value == '' || Math.floor(value) != value) return {success: false, message: String(value) + " is out of TAG_Short's range"};
			return {success: true, value: value};
		case images.TAG_Int:
			value = Number(value);
			if (value < -2147483648 || value > 2147483647 || isNaN(value) || value == '' || Math.floor(value) != value) return {success: false, message: String(value) + " is out of TAG_Int's range"};
			return {success: true, value: value};
		case images.TAG_Long:
			var bn = new BigNumber(value);
			if (value.indexOf('.') > -1 || (!bn.compare(new BigNumber(0)) && value != '0')) return {success: false, message: value + " is out of TAG_Long's range"};
			if (value[0] == '-') {
				bn = new BigNumber(value.substring(1));
				if (bn.compare(new BigNumber('9223372036854775808')) == 1) return {success: false, message: value + " is out of TAG_Long's range"};
			}
			else if (bn.compare(new BigNumber('9223372036854775807')) == 1) return {success: false, message: value + " is out of TAG_Long's range"};
			return {success: true, value: String(bn)};
		case images.TAG_Float:
			if (isNaN(Number(value)) || value == '') return {success: false, message: 'NaN'};
			return {success: true, value: Number(value)};
		case images.TAG_Double:
			if (isNaN(Number(value)) || value == '') return {success: false, message: 'NaN'};
			return {success: true, value: Number(value)};
		case images.TAG_Byte_Array:
			var values = value.split('\n');
			for (var i = 0; i < values.length; i++) {
				if (!(valuecheck(images.TAG_Byte, values[i]).success)) return {success: false, message: values[i] + ' (element ' + String(i + 1) + ") is out of TAG_Byte's range"};
			}
			return {success: true, value: values};
		case images.TAG_String:
			if (value.length > 32767) return {success: false, message: value + " is longer than 32767 characters"};
			return {success: true, value: '"' + value + '"'};
		case images.TAG_Int_Array:
			var values = value.split('\n');
			for (var i = 0; i < values.length; i++) {
				if (!(valuecheck(images.TAG_Int, values[i]).success)) return {success: false, message: values[i] + ' (element ' + String(i + 1) + ") is out of TAG_Int's range"};
			}
			return {success: true, value: values};
		default:
			throw new Error('No such tag: ' + type);
	}
}
function save() { //no server code yet
	if ($(this).hasClass('btn-info')) {
		var savetype = savetag.children('img.type').attr('src');
		var editorvalue = editor.getValue();
		var valueworks = valuecheck(savetype, editorvalue);
		if (valueworks.success) {
			if (savetype == images.TAG_Byte_Array || savetype == images.TAG_Int_Array) {
				if (savetype == images.TAG_Byte_Array) nbttype = 'TAG_Byte';
				else nbttype = 'TAG_Int';
				var container = savetag.children('ul');
				container.children().remove();
				for (var i = 0; i < valueworks.value.length; i++) container.append(renderJSON({type: nbttype, value: Number(valueworks.value[i])}, undefined, true));
				addudicons(container);
			}
			else {
				savetag.attr('value', valueworks.value);
				if (savetag.attr('key')) savetag.children('span').text(savetag.attr('key') + ': ' + String(valueworks.value));
				else savetag.children('span').text(String(valueworks.value));
			}
			closeeditor();
		}
		else alert(valueworks.message); //should be cleaned up
	}
	else closeeditor();
}
function closeeditor() {
	$('button#save').removeClass('btn-info');
	$('div#editor').hide();
}

var deleteimg;
function deleter() { //no server code yet
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	parent.remove();
	if (parent.is(savetag) || parent.find(savetag).length) closeall();
}
function showdelete() {
	if (!$(this).is(deleteimg) && !$(this).children('img.delete').is(deleteimg)) {
		deleteimg = $('<img>').addClass('delete').attr('src', images.delete).attr('title', 'Delete tag').click(deleter);
		if ($(this).is('img')) $(this).after(deleteimg);
		else $(this).append(deleteimg);
	}
}

var renameimg, renameorig;
function rename() {
	closeall();
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	savetag = parent;
	newtag = false;
	renameorig = parent.attr('key');
	$('div#tagname h3.panel-title').text('Renaming ' + renameorig);
	$('input#nameinput').keydown();
	$('div#tagname').show();
	$('input#nameinput').focus();
}
function showrename() {
	if (!$(this).is(renameimg) && !$(this).children('img.rename').is(renameimg)) {
		renameimg = $('<img>').addClass('rename').attr('src', images.rename).attr('title', 'Rename tag').click(rename);
		if ($(this).is('img')) $(this).after(renameimg);
		else $(this).append(renameimg);
	}
}
function savename() { //no server code yet
	if ($('button#namesave').hasClass('btn-success')) {
		var newname = $('input#nameinput').val();
		var savetype = savetag.children('img.type').attr('src');
		savetag.attr('key', newname);
		if (savetag.attr('value')) savetag.children('span').text(newname + ': ' + savetag.attr('value'));
		else savetag.children('span').text(newname + ':');
		closename();
	}
}
function closename() {
	$('input#nameinput').val('');
	$('button#namesave').removeClass('btn-success').removeClass('btn-danger');
	$('div#tagname').hide();
}

var addimg, newtag, tagtype, defaults = {
	TAG_Byte: 0,
	TAG_Short: 0,
	TAG_Int: 0,
	TAG_Long: '0',
	TAG_Float: 0,
	TAG_Double: 0,
	TAG_Byte_Array: [],
	TAG_String: '',
	TAG_List: {type: null, list: []},
	TAG_Compound: {},
	TAG_Int_Array: []
};
function createtag(type, key) {
	savetag.children('ul').append(renderJSON({type: type, value: defaults[type]}, key));
}
function settypeselect(type) { //may have to call selectpicker on it again
	var typeselect = $('select#typeinput');
	typeselect.children().remove();
	for (var i = 0; i < coerceto[type].length; i++) typeselect.append($('<option>').attr('value', coerceto[type][i]).text(coerceto[type][i]));
}
function add() { //no server code yet
	closeall();
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	savetag = parent;
	newtag = true;
	var parentkey = parent.attr('key');
	if (parent.children('img.type').attr('src') == images.TAG_Compound) {
		if (parentkey) {
			$('div#tagtype h3.panel-title').text('Adding tag to ' + parentkey);
			$('div#tagname h3.panel-title').text('Adding tag to ' + parentkey);
		}
		else {
			$('div#tagtype h3.panel-title').text('Adding tag');
			$('div#tagname h3.panel-title').text('Adding tag');
		}
		settypeselect('null');
		$('div#tagtype').show();
	}
	else createtag(parent.attr('type'));
}
function showadd() {
	if (!$(this).is(addimg) && !$(this).children('img.add').is(addimg)) {
		addimg = $('<img>').addClass('add').attr('src', images.add).attr('title', 'Add tag').click(add);
		if ($(this).is('img')) $(this).after(addimg);
		else $(this).append(addimg);
	}
}
function compoundsave() {
	if ($('button#namesave').hasClass('btn-success')) {
		createtag(tagtype, $('input#nameinput').val());
		closename();
	}
}
function closetype() {
	$('div#tagtype').hide();
}

var coerceimg, coerceto = {
	'null': ['TAG_Byte', 'TAG_Short', 'TAG_Int', 'TAG_Long', 'TAG_Float', 'TAG_Double', 'TAG_Byte_Array', 'TAG_String', 'TAG_List', 'TAG_Compound', 'TAG_Int_Array'],
	'TAG_Byte': ['TAG_Short', 'TAG_Int', 'TAG_Long', 'TAG_Float', 'TAG_Double', 'TAG_String'],
	'TAG_Short': ['TAG_Byte', 'TAG_Int', 'TAG_Long', 'TAG_Float', 'TAG_Double', 'TAG_String'],
	'TAG_Int': ['TAG_Byte', 'TAG_Short', 'TAG_Long', 'TAG_Float', 'TAG_Double', 'TAG_String'],
	'TAG_Long': ['TAG_Byte', 'TAG_Short', 'TAG_Int', 'TAG_Float', 'TAG_Double', 'TAG_String'],
	'TAG_Float': ['TAG_Byte', 'TAG_Short', 'TAG_Int', 'TAG_Long', 'TAG_Double', 'TAG_String'],
	'TAG_Double': ['TAG_Byte', 'TAG_Short', 'TAG_Int', 'TAG_Long', 'TAG_Float', 'TAG_String'],
	'TAG_String': ['TAG_Byte', 'TAG_Short', 'TAG_Int', 'TAG_Long', 'TAG_Float', 'TAG_Double'],
	'TAG_Byte_Array': ['TAG_Int_Array'],
	'TAG_Int_Array': ['TAG_Byte_Array']
};
function coerce() { //no client or server code yet
	closeall();
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	savetag = parent;
	newtag = false;
	if (parent.attr('type')) var type = parent.attr('type');
	else {
		var imgsrc = parent.children('img.type').attr('src');
		for (var i in images) {
			if (images[i] == imgsrc) {
				var type = i;
				break;
			}
		}
	}
	settypeselect(type);
	if (parent.attr('key')) $('div#tagtype h3.panel-title').text('Converting ' + parent.attr('key'));
	else $('div#tagtype h3.panel-title').text('Converting ' + type);
	$('div#tagtype').show();
}
function showcoerce() {
	if (!$(this).is(coerceimg) && !$(this).children('img.coerce').is(coerceimg)) {
		coerceimg = $('<img>').addClass('coerce').attr('src', images.coerce).attr('title', 'Convert type').click(coerce);
		if ($(this).is('img')) $(this).after(coerceimg);
		else $(this).append(coerceimg);
	}
}

function addudicons(list) {
	var elements = list.children(), element, j;
	for (var i = 0; i < elements.length; i++) {
		if (elements.eq(i).children('span').length) element = elements.eq(i).children('span');
		else element = elements.eq(i).children('img.type');
		element.off('mouseover', showup).off('mouseover', showdown);
		if (i) element.mouseover(showup);
		if (i != elements.length - 1) element.mouseover(showdown);
	}
}
var upimg;
function up() {
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	var prevsibling = parent.prev();
	parent.detach();
	prevsibling.before(parent);
	addudicons(parent.parent());
	removeicons();
	parent.children('img.type').mouseover();
	parent.children('span').mouseover();
}
function showup() {
	if (!$(this).is(upimg) && !$(this).children('img.up').is(upimg)) {
		upimg = $('<img>').addClass('up').attr('src', images.up).attr('title', 'Move up').click(up);
		if ($(this).is('img')) $(this).after(upimg);
		else $(this).append(upimg);
	}
}

var downimg;
function down() {
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	var nextsibling = parent.next();
	parent.detach();
	nextsibling.after(parent);
	addudicons(parent.parent());
	removeicons();
	parent.children('img.type').mouseover();
	parent.children('span').mouseover();
}
function showdown() {
	if (!$(this).is(downimg) && !$(this).children('img.down').is(downimg)) {
		downimg = $('<img>').addClass('down').attr('src', images.down).attr('title', 'Move down').click(down);
		if ($(this).is('img')) $(this).after(downimg);
		else $(this).append(downimg);
	}
}

function closeall() {
	closeeditor();
	closename();
	closetype();
}

window.onload = function() {
	var filedrag = $('div#filedrag')[0];
	filedrag.addEventListener('dragover', FileDragHover);
	filedrag.addEventListener('dragleave', FileDragHover);
	filedrag.addEventListener('drop', FileSelectHandler);
	
	editor = ace.edit('ace');
	editor.setShowPrintMargin(false);
	editor.setShowInvisibles(false);
	editor.getSession().on('change', function() {
		if (editor.getValue() != editororig) $('button#save').addClass('btn-info');
	});
	editor.keyBinding.originalOnCommandKey = editor.keyBinding.onCommandKey;
	editor.keyBinding.onCommandKey = function(e, hashId, keyCode) {
		if (keyCode == 27) closeeditor();
	};
	
	$('div#filedrag').hover(function() {
		$(this).text('Drop file here');
	}, function() {
		$(this).text('Upload');
	})

	$('button#save').click(save);
	$('input#nameinput').keydown(function(e) {
		if (e.which == 13) {
			if (newtag) compoundsave();
			else savename();
		}
		else if (e.which == 27) closename();
		else {
			setTimeout($.proxy(function() {
				var value = $(this).val();
				if (value != renameorig) {
					if (value.length < 32768) {
						if (newtag) {
							var siblings = savetag.children('ul').children();
							var success = true;
							for (var i = 0; i < siblings.length; i++) {
								if (siblings.eq(i).attr('key') == value) {
									success = false;
									break;
								}
							}
						}
						else {
							var siblings = savetag.parent().children();
							var success = true;
							for (var i = 0; i < siblings.length; i++) {
								if (siblings.eq(i).attr('key') == value && !siblings.eq(i).is(savetag)) {
									success = false;
									break;
								}
							}
						}
						if (success) $('button#namesave').removeClass('btn-danger').addClass('btn-success');
						else $('button#namesave').removeClass('btn-success').addClass('btn-danger');
					}
					else $('button#namesave').removeClass('btn-success').addClass('btn-danger');
				}
				else $('button#namesave').removeClass('btn-success').removeClass('btn-danger');
			}, this), 0);
		}
	}).focus(function() {
		$('button#namesave').removeClass('blur').addClass('focus');
	}).blur(function() {
		$('button#namesave').removeClass('focus').addClass('blur');
	});
	$('button#namesave').click(function() {
		if (newtag) compoundsave();
		else savename();
	});
	$('button#typesave').click(function() {
		closetype();
		tagtype = $('select#typeinput').val();
		if (newtag) {
			$('div#tagname').show();
			$('input#nameinput').focus();
		}
		else {
			if (savetag.children('img.type').attr('src') == images.TAG_List) {
				if (tagtype == 'TAG_List' || tagtype == 'TAG_Compound') {
					savetag.attr('type', tagtype);
				}
				else {
					var success = true, valueworks, elements = savetag.children('ul').children(), items, subchildren;
					for (var i = 0; i < elements.length; i++) {
						if (elements.eq(i).attr('value')) {
							valueworks = valuecheck(images[tagtype], elements.eq(i).attr('value'));
							if (!valueworks.success) {
								success = false;
								alert(valueworks.message);
							}
						}
						else { //converting a Byte_Array or Int_Array
							subchildren = elements.eq(i).children('ul').children();
							items = [];
							for (j = 0; j < subchildren.length; j++) items[j] = subchildren.eq(j).attr('value');
							valueworks = valuecheck(images[tagtype], items.join('\n'));
							if (!valueworks.success) {
								success = false;
								alert(valueworks.message);
							}
						}
					}
					if (success) {
						savetag.attr('type', tagtype);
						if (tagtype == 'TAG_Byte_Array') var subsrc = images.TAG_Byte;
						else var subsrc = images.TAG_Int;
						for (i = 0; i < elements.length; i++) {
							if (elements.eq(i).attr('value')) {
								if (tagtype == 'TAG_String') savetag.children('span').text(savetag.attr('key') + ': "' + savetag.attr('value') + '"');
								else if (savetag.children('img.type').attr('src') == images.TAG_String) savetag.children('span').text(savetag.attr('key') + ': ' + savetag.attr('value'));
								elements.eq(i).children('img.type').attr('src', images[tagtype]);
							}
							else {
								elements.eq(i).children('img.type').attr('src', images[tagtype]);
								subchildren = elements.eq(i).children('ul').children();
								for (j = 0; j < subchildren.length; j++) subchildren.eq(j).children('img.type').attr('src', subsrc);
							}
						}
					}
				}
			}
			else {
				if (savetag.attr('value')) {
					var valueworks = valuecheck(images[tagtype], savetag.attr('value'));
					if (valueworks.success) {
						if (tagtype == 'TAG_String') savetag.children('span').text(savetag.attr('key') + ': "' + savetag.attr('value') + '"');
						else if (savetag.children('img.type').attr('src') == images.TAG_String) savetag.children('span').text(savetag.attr('key') + ': ' + savetag.attr('value'));
						savetag.children('img.type').attr('src', images[tagtype]);
					}
					else alert(valueworks.message);
				}
				else {
					if (tagtype == 'TAG_Byte_Array') var subtype = 'TAG_Byte';
					else var subtype = 'TAG_Int';
					var elements = savetag.children('ul').children(), items = [];
					for (var i = 0; i < elements.length; i++) items[i] = elements.eq(i).attr('value');
					var valueworks = valuecheck(images[tagtype], items.join('\n'));
					if (valueworks.success) {
						savetag.children('img.type').attr('src', images[tagtype]);
						for (i = 0; i < elements.length; i++) elements.eq(i).children('img.type').attr('src', images[subtype])
					}
					else alert(valueworks.message);
				}
			}
		}
	});
	$('select').selectpicker({style: 'btn btn-primary', menuStyle: 'dropdown-inverse'});
};