var images = { //stores the URL for all image assets
	'TAG_Byte': '/images/TAG_Byte.png',
	'TAG_Short': '/images/TAG_Short.png',
	'TAG_Int': '/images/TAG_Int.png',
	'TAG_Long': '/images/TAG_Long.png',
	'TAG_Float': '/images/TAG_Float.png',
	'TAG_Double': '/images/TAG_Double.png',
	'TAG_Byte_Array': '/images/TAG_Byte_Array.png',
	'TAG_String': '/images/TAG_String.png',
	'TAG_List': '/images/TAG_List.png',
	'TAG_Compound': '/images/TAG_Compound.png',
	'TAG_Int_Array': '/images/TAG_Int_Array.png',
	'edit': '/images/edit.png',
	'delete': '/images/delete.png',
	'rename': '/images/rename.png',
	'add': '/images/add.png',
	'coerce': '/images/coerce.png',
	'up': '/images/up.png',
	'down': '/images/down.png'
};

$.ajaxTransport('+*', function(options, originalOptions, jqXHR) { //allows client to upload the raw binary contents of the NBT file instead of a string
	if (window.FormData && (options.data && ((window.Blob && options.data instanceof Blob) || (window.ArrayBuffer && options.data instanceof ArrayBuffer)))) {
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

var gzip; //whether or not the file is gzipped

function FileDragHover(e) { //triggered when dragging a file onto or off the filedrag div
	e.stopPropagation();
	e.preventDefault();
	if (e.type == 'dragover') $('div#filedrag').addClass('hover').text('Drop file here'); //if dragged onto
	else $('div#filedrag').removeClass('hover').text('Upload'); //if dragged off
}
function FileSelectHandler(e) { //triggered when drogging a file onto the filedrag div
	FileDragHover(e);
	if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files) var files = e.originalEvent.dataTransfer.files;
	else return;
	var reader;
	reader = new FileReader();
	reader.name = files[0].name;
	reader.type = files[0].type;
	reader.onload = function(e) { //when file has been processed into memory, upload it to the server and display it
		$('div#nbt').children().remove();
		remakeImages();
		$('div#nbt').prepend($('<div>').attr('id', 'loading').text('Parsing...'));
		$.ajax({
			url: '/upload',
			type: 'POST',
			dataType: 'json',
			data: e.target.result,
			processData: false, //so jQuery doesn't coerce it into a string first
			success: (function() {
				return function(server_response) {
					gzip = server_response.gzip;
					$('li#open').removeClass('open');
					if (!server_response.success) {
						$('div#loading').text('COULD NOT PARSE').addClass('error');
						return; //don't try to display an unparseable file
					}
					$.ajax({ //fetch the JSON version
						url: '/nbtjson',
						dataType: 'json',
						success: (function() {
							return function(server_response) {
								if (!server_response.success) { //something somewhere went wrong
									$('div#loading').text('ERROR').addClass('error');
									return;
								}
								$('a#download').attr('download', e.target.name).attr('href', '/download/' + e.target.name + '?gzip=' + String(gzip)); //download the file with the same name and same compression
								closeall();
								$('div#loading').text('Rendering...');
								setTimeout(function() { //makes sure the previous jQuery commands complete before hanging the client while processing
									$('div#nbt').append($('<div>').attr('id', 'filetitle').text(e.target.name)).append($('<ul>').append(renderJSON(server_response.data))); //display the JSON
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
	reader.readAsArrayBuffer(files[0]); //read the file
}

function togglecontainer() { //triggered when clicking on a Byte_Array, Int_Array, List, or Compound's images - shows its children
	var container = $(this).parent().children('ul');
	if (container.is(':visible')) container.hide();
	else container.show();
}

function renderJSON(data, key) { //a recursive function to create an element that represents a tag
	//key will be undefined if invoked by Byte_Array, Int_Array, or List; only relevant if displaying the child of a compound
	//generally, the function finds what type the data is, appends an image with the correct icon, appends a span with the value, and adds mouseover edit function handlers
	//if the data has a key, it adds compound-specific functions (e.g. rename), sets the key attribute, and adds the key to the displayed value
	//Byte_Array, Int_Array, List, and Compound call this function on each of their children and then put them inside a hidden container
	//returns the li element
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
				if (coerceto[String(data.value.type)]) display.children('span').mouseover(showcoerce); //not all lists are coercible (e.g. TAG_Compound)
				return display;
			}
			else {
				display.attr('type', String(data.value.type)).append($('<img>').addClass('type').attr('src', images.TAG_List).attr('title', 'TAG_List').click(togglecontainer).mouseover(removeicons).mouseover(showdelete).mouseover(showadd)).append(container);
				if (coerceto[String(data.value.type)]) display.children('img').mouseover(showcoerce); //not all lists are coercible (e.g. TAG_Compound)
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
		default: //should never trigger, but if it did, it would mess up everything, so better to just quit
			throw new Error('No such tag: ' + data.type);
	}
}

var savetag; //stores the current element being editted for editting function that are not instantaneous
var newtag; //whether or not a new tag is being added - used to change what happens when entering a new tag type or name

function removeicons() { //triggered whenever mousing over an element - removes all the editting function icons if they exist on another element
	if (!$(this).parent().children('img.edit').is(editimg) && !$(this).children('img.edit').is(editimg)) editimg.detach();
	if (!$(this).parent().children('img.delete').is(deleteimg) && !$(this).children('img.delete').is(deleteimg)) deleteimg.detach();
	if (!$(this).parent().children('img.rename').is(renameimg) && !$(this).children('img.rename').is(renameimg)) renameimg.detach();
	if (!$(this).parent().children('img.add').is(addimg) && !$(this).children('img.add').is(addimg)) addimg.detach();
	if (!$(this).parent().children('img.coerce').is(coerceimg) && !$(this).children('img.coerce').is(coerceimg)) coerceimg.detach();
	if (!$(this).parent().children('img.up').is(upimg) && !$(this).children('img.up').is(upimg)) upimg.detach();
	if (!$(this).parent().children('img.down').is(downimg) && !$(this).children('img.down').is(downimg)) downimg.detach();
}

var coerceto = { //stores possible new tag types for conversion (not all may actually work)
	//null is a special case because it should only be used on lists of length 0 without a specified type
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
function settypeselect(type) { //used to set the possible values of the tag type for adding a new tag or coercing an existing one
	var typeselect = $('select#typeinput'); //prefetch the typeselect
	typeselect.children().remove(); //remove all the previous options
	//for each possible coercible value, append a new option to the typeselect
	for (var i = 0; i < coerceto[type].length; i++) typeselect.append($('<option>').attr('value', coerceto[type][i]).text(coerceto[type][i]));
	typeselect.select2(); //so it is initialized with an option
}

//Readds the image click handlers
function remakeImages() {
	editimg.off('click').click(edit);
	deleteimg.off('click').click(deleter);
	renameimg.off('click').click(rename);
	addimg.off('click').click(add);
	coerceimg.off('click').click(coerce);
	upimg.off('click').click(up);
	downimg.off('click').click(down);
}

var editor, editororig; //editor is the ace editor variable, editororig is the original value of the editor to compare to
function edit() {
	closeall(); //remove all editting windows
	var parent = $(this).parent(); //parent should be the li element
	if (parent.is('span')) parent = parent.parent(); //if targetting an element in a List of type Byte_Array or Int_Array, parent will be correct, otherwise parent is incorrectly the span element
	savetag = parent;
	switch (parent.children('img.type').attr('src')) { //different types must be handled differently
		//generally, store the original value and set the editor text to it, then set the title to say what's being editted
		case images.TAG_Byte:
			editororig = parent.attr('value');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Byte');
			break;
		case images.TAG_Short:
			editororig = parent.attr('value');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Short');
			break;
		case images.TAG_Int:
			editororig = parent.attr('value');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Int');
			break;
		case images.TAG_Long:
			editororig = parent.attr('value');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Long');
			break;
		case images.TAG_Float:
			editororig = parent.attr('value');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Float');
			break;
		case images.TAG_Double:
			editororig = parent.attr('value');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Double');
			break;
		case images.TAG_Byte_Array: //Byte_Array and Int_Array are weird because they have children who determine their value
			var elements = parent.children('ul').children(), values;
			for (var i = 0; i < elements.length; i++) values[i] = elements.eq(i).attr('value'); //create an array of all the children
			editororig = values.join('\n'); //editor should display each child on its own line
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Byte_Array');
			break;
		case images.TAG_String:
			editororig = parent.attr('value');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Double');
			break;
		case images.TAG_Int_Array: //see case images.TAG_Byte_Array
			var elements = parent.children('ul').children(), values;
			for (var i = 0; i < elements.length; i++) values[i] = elements.eq(i).attr('value');
			editororig = values.join('\n');
			editor.setValue(editororig);
			if (parent.attr('key')) $('div#editor h3.panel-title').text('Editing ' + parent.attr('key'));
			else $('div#editor h3.panel-title').text('Editing TAG_Int_Array');
			break;
		default:
			throw new Error('No such tag: ' + parent.children('img.type').attr('src'));
	}
	$('div#editor').show();
	editor.focus(); //target editor
}
var editimg = $('<img>').addClass('edit').attr('src', images.edit).attr('title', 'Edit value'); //image element with the edit icon
function showedit() { //triggered when mousing over an edittable element - shows the edit icon
	if (!$(this).parent().children('img.edit').is(editimg) && !$(this).children('img.edit').is(editimg)) { //if this isn't already displaying the edit icon
		if ($(this).is('img')) $(this).after(editimg); //for List elements with children, there is no span, so the mouseover is on the img element; add it after the image
		else $(this).append(editimg); //otherwise, append it inside the span
	}
}
function valuecheck(type, value) { //used to check if the provided value (as a string) is valid for the data type
	//returns an object, where success says whether or not it worked, message is the error message, and value is the value to save
	switch (type) {
		case images.TAG_Byte:
			value = Number(value); //convert value to a number
			//if value is out of range or value cannot be made into a number or it was '' (which becomes 0) or it is not an integer, it fails
			if (value < -128 || value > 127 || isNaN(value) || value === '' || Math.floor(value) != value) return {success: false, message: String(value) + " is out of TAG_Byte's range"};
			return {success: true, value: String(value)};
		case images.TAG_Short: //see TAG_Byte
			value = Number(value);
			if (value < -32768 || value > 32767 || isNaN(value) || value === '' || Math.floor(value) != value) return {success: false, message: String(value) + " is out of TAG_Short's range"};
			return {success: true, value: String(value)};
		case images.TAG_Int: //see TAG_Byte
			value = Number(value);
			if (value < -2147483648 || value > 2147483647 || isNaN(value) || value === '' || Math.floor(value) != value) return {success: false, message: String(value) + " is out of TAG_Int's range"};
			return {success: true, value: String(value)};
		case images.TAG_Long:
			var bn = new BigNumber(value); //as longs can be larger than JavaScript variables, convert them to a BigNumber object
			//if value is not an integer or it was not a valid number string, it fails
			if (value.indexOf('.') > -1 || (!bn.compare(new BigNumber(0)) && value != '0')) return {success: false, message: value + " is out of TAG_Long's range"};
			if (value[0] == '-') { //if value is negative, convert it to positive to resolve a BigNumber bug
				bn = new BigNumber(value.substring(1)); //omit the negative sign
				//if value is too small, it fails
				if (bn.compare(new BigNumber('9223372036854775808')) == 1) return {success: false, message: value + " is out of TAG_Long's range"};
			}
			//if value is too large, it fails
			else if (bn.compare(new BigNumber('9223372036854775807')) == 1) return {success: false, message: value + " is out of TAG_Long's range"};
			return {success: true, value: String(bn)};
		case images.TAG_Float: //value fails if it cannot be turned into a number or is '' (which becomes 0 when converted)
			if (isNaN(Number(value)) || value === '') return {success: false, message: 'NaN'};
			return {success: true, value: String(Number(value))};
		case images.TAG_Double: //see case images.TAG_Float
			if (isNaN(Number(value)) || value === '') return {success: false, message: 'NaN'};
			return {success: true, value: String(Number(value))};
		case images.TAG_Byte_Array: //test each byte, if any fail it all fails
			var values = value.split('\n');
			for (var i = 0; i < values.length; i++) {
				if (!(valuecheck(images.TAG_Byte, values[i]).success)) return {success: false, message: values[i] + ' (element ' + String(i + 1) + ") is out of TAG_Byte's range"};
			}
			return {success: true, value: values};
		case images.TAG_String: //if it is longer than TAG_Short's max value, it fails
			if (value.length > 32767) return {success: false, message: value + " is longer than 32767 characters"};
			return {success: true, value: '"' + value + '"'};
		case images.TAG_Int_Array: //see case images.TAG_Byte_Array
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
	if ($(this).hasClass('btn-info')) { //if it was actually changed
		var savetype = savetag.children('img.type').attr('src');
		var editorvalue = editor.getValue();
		var valueworks = valuecheck(savetype, editorvalue); //check the value
		if (valueworks.success) { //if it worked
			if (savetype == images.TAG_Byte_Array || savetype == images.TAG_Int_Array) { //if it is a Byte_Array or Int_Array
				if (savetype == images.TAG_Byte_Array) nbttype = 'TAG_Byte';
				else nbttype = 'TAG_Int';
				var container = savetag.children('ul');
				container.children().remove(); //remove old children
				//iterate over every element and append the li to the container
				for (var i = 0; i < valueworks.value.length; i++) container.append(renderJSON({type: nbttype, value: Number(valueworks.value[i])}, undefined, true));
				addudicons(container); //must re-add the ordering icons
			}
			else { //otherwise, it is much simpler
				if (savetype == images.TAG_String) savetag.attr('value', valueworks.value.substring(1, valueworks.value.length - 1)); //get rid of the quotes around a string
				else savetag.attr('value', valueworks.value); //record new value
				if (savetag.attr('key')) savetag.children('span').text(savetag.attr('key') + ': ' + valueworks.value); //just change the text, as in renderJSON
				else savetag.children('span').text(valueworks.value);
			}
			remakeImages();
			closeeditor();
		}
		else alert(valueworks.message); //should be cleaned up
	}
}
function closeeditor() { //close the editor
	$('button#save').removeClass('btn-info');
	$('div#editor').hide();
}

function deleter() { //no server code yet
	var parent = $(this).parent(); //see edit()
	if (parent.is('span')) parent = parent.parent();
	parent.remove(); //delete the tag
	remakeImages();
	if (parent.is(savetag) || parent.find(savetag).length) closeall(); //if we deleted a tag that was being edited, close the edit windows
}
var deleteimg = $('<img>').addClass('delete').attr('src', images['delete']).attr('title', 'Delete tag');
function showdelete() { //see showedit()
	if (!$(this).parent().children('img.delete').is(deleteimg) && !$(this).children('img.delete').is(deleteimg)) {
		if ($(this).is('img')) $(this).after(deleteimg);
		else $(this).append(deleteimg);
	}
}

var renameorig; //the original tag name to compare to
function rename() {
	closeall(); //don't want to be editting anything else at the same time
	var parent = $(this).parent(); //seet edit()
	if (parent.is('span')) parent = parent.parent();
	savetag = parent; //see edit()
	newtag = false;
	renameorig = parent.attr('key'); //store originalname
	$('div#tagname h3.panel-title').text('Renaming ' + renameorig); //display what is being renamed
	$('input#nameinput').keydown(); //trigger the code that checks to see if the new name is valid (make sure no other key is named '')
	$('div#tagname').show(); //open the renaming window
	$('input#nameinput').focus(); //target the name input for text input
}
var renameimg = $('<img>').addClass('rename').attr('src', images.rename).attr('title', 'Rename tag');
function showrename() { //see showedit()
	if (!$(this).parent().children('img.rename').is(renameimg) && !$(this).children('img.rename').is(renameimg)) {
		if ($(this).is('img')) $(this).after(renameimg);
		else $(this).append(renameimg);
	}
}
function savename() { //no server code yet
	if ($('button#namesave').hasClass('btn-success')) { //if the name is invalid, do nothing
		var newname = $('input#nameinput').val(); //fetch the new name
		savetag.attr('key', newname); //save the new key
		if (savetag.attr('value')) savetag.children('span').text(newname + ': ' + savetag.attr('value')); //if a tag without children, display the new name and the unchanged value
		else savetag.children('span').text(newname + ':'); //if the tag has children, just display the new name
		closename(); //the name input doesn't need to be shown anymore
		remakeImages();
	}
}
function closename() { //close the name input
	$('input#nameinput').val(''); //reset the value of the input so the next request isn't affected by the last input entered
	$('button#namesave').removeClass('btn-success').removeClass('btn-danger'); //display that the value is unchanged
	$('div#tagname').hide(); //actually stop displaying the name input
}

var tagtype, defaults = { //tagtype is the type of the new tag when creating a compound, defaults stores the values to initialize new elements at
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
function createtag(type, key) { //calls renderJSON to generate the tag and adds it as a child of savetag
	savetag.children('ul').append(renderJSON({type: type, value: defaults[type]}, key));
}
function add() { //no server code yet
	closeall(); //nothing else should be editted at the same time
	var parent = $(this).parent(); //see edit()
	if (parent.is('span')) parent = parent.parent();
	savetag = parent;
	var parentkey = parent.attr('key');
	if (parent.children('img.type').attr('src') == images.TAG_Compound) { //if adding an element to a compound
		if (parentkey) { //if the compound is the child of another compound
			$('div#tagtype h3.panel-title').text('Adding tag to ' + parentkey); //display what is being edited
			$('div#tagname h3.panel-title').text('Adding tag to ' + parentkey);
		}
		else { //if the compound is the child of a list
			$('div#tagtype h3.panel-title').text('Adding tag');
			$('div#tagname h3.panel-title').text('Adding tag');
		}
		newtag = true; //note that the function is not trying to coerce an element - tells the type save button what to do when clicked
		settypeselect('null'); //show all possible new tags
		$('div#tagtype').show(); //allow tag type to be selected
	}
	else createtag(parent.attr('type')); //otherwise, adding an element to a list; type is implied and name is not applicable, so create it immediately
}
var addimg = $('<img>').addClass('add').attr('src', images.add).attr('title', 'Add tag');
function showadd() { //see showedit()
	if (!$(this).parent().children('img.add').is(addimg) && !$(this).children('img.add').is(addimg)) {
		if ($(this).is('img')) $(this).after(addimg);
		else $(this).append(addimg);
	}
}
function compoundsave() { //after name has been entered, add a child to the compound using it and the previously selected type
	if ($('button#namesave').hasClass('btn-success')) { //if name is invalid, do nothing
		createtag(tagtype, $('input#nameinput').val()); //add the tag
		closename(); //done with choosing a name
	}
}
function closetype() { //close the type selection - quick and easy
	$('div#tagtype').hide();
}

function coerce() {
	closeall(); //shouldn't be editing anything else simultaneously
	var parent = $(this).parent(); //see edit()
	if (parent.is('span')) parent = parent.parent();
	savetag = parent;
	newtag = false; //not trying to add a tag, tells save tag button that it should attempt to change the tag type
	if (parent.attr('type')) var type = parent.attr('type'); //if coercing a List, simply read the type from its stored attribute
	else { //if not coercing a List
		var imgsrc = parent.children('img.type').attr('src'); //get the type image src
		for (var i in images) { //look through the image asset urls until finding one that matches, and then take its key (the tag type)
			if (images[i] == imgsrc) {
				var type = i;
				break;
			}
		}
	}
	settypeselect(type); //display appropriate type options
	if (parent.attr('key')) $('div#tagtype h3.panel-title').text('Converting ' + parent.attr('key')); //display what is being editted
	else $('div#tagtype h3.panel-title').text('Converting ' + type);
	$('div#tagtype').show(); //open the type input
}
var coerceimg = $('<img>').addClass('coerce').attr('src', images.coerce).attr('title', 'Convert type');
function showcoerce() { //see showedit()
	if (!$(this).parent().children('img.coerce').is(coerceimg) && !$(this).children('img.coerce').is(coerceimg)) {
		if ($(this).is('img')) $(this).after(coerceimg);
		else $(this).append(coerceimg);
	}
}

function addudicons(list) { //add ordering icons to a Byte_Array, List, or Int_Array's container
	var elements = list.children(), element, j; //elements is the list of children, element is the element inside the child that has the mouseover handlers
	for (var i = 0; i < elements.length; i++) { //for each child
		//get the element that has the click handlers
		if (elements.eq(i).children('span').length) element = elements.eq(i).children('span'); //if the child has a span, use it
		else element = elements.eq(i).children('img.type'); //otherwise, use the type image
		element.off('mouseover', showup).off('mouseover', showdown); //remove any past ordering icons
		if (i) element.mouseover(showup); //if not the first element, add an up icon
		if (i != elements.length - 1) element.mouseover(showdown); //if not the last element, add a down icon
	}
}
function up() { //move an element in a list up
	var parent = $(this).parent(); //see edit()
	if (parent.is('span')) parent = parent.parent();
	$.ajax({
		'url': '/editnbt/up',
		'type': 'POST',
		'data': JSON.stringify({'path': getPath(parent)}),
		'dataType': 'json',
		'success': function(response) {
			if (!response.success) this.error();
		},
		'error': function() {
			alert('Editting failed?');
		}
	});
	var prev = parent.prev(); //find previous sibling before detaching the element
	parent.detach(); //remove the element but keep its mouseover handlers
	prev.before(parent); //put the element before its previous sibling
	addudicons(parent.parent()); //add new ordering icons
	removeicons(); //remove all the old icons that may no longer be applicable from new ordering
	parent.children('img.type').mouseover(); //reshow the icons so the user can see which element they were reordering
	parent.children('span').mouseover(); //reshow the icons so the user can see which element they were reordering
}
var upimg = $('<img>').addClass('up').attr('src', images.up).attr('title', 'Move up');
function showup() { //see showedit()
	if (!$(this).parent().children('img.up').is(upimg) && !$(this).children('img.up').is(upimg)) {
		if ($(this).is('img')) $(this).after(upimg);
		else $(this).append(upimg);
	}
}
function down() { //see up()
	var parent = $(this).parent();
	if (parent.is('span')) parent = parent.parent();
	var next = parent.next();
	parent.detach();
	next.after(parent);
	addudicons(parent.parent());
	removeicons();
	parent.children('img.type').mouseover();
	parent.children('span').mouseover();
}
var downimg = $('<img>').addClass('down').attr('src', images.down).attr('title', 'Move down');
function showdown() { //see showedit()
	if (!$(this).parent().children('img.down').is(downimg) && !$(this).children('img.down').is(downimg)) {
		if ($(this).is('img')) $(this).after(downimg);
		else $(this).append(downimg);
	}
}

function closeall() { //close all editing windows
	closeeditor();
	closename();
	closetype();
}

function getPath(element) { //gets an array representing the path to the tag
	if (element.parent().parent().is('li')) { //if not the top element
		var path = getPath(element.parent().parent()); //get parent's path, then add to it
		if (element.attr('key')) path.push(element.attr('key')); //if in a compound tag and has key
		else { //if no key, either in a list or in a compound without a key
			if (element.parent().parent().children('img.type').attr('src') == images.TAG_Compound) path.push(''); //if a nameless compound tag
			else path.push(element.parent().children().index(element)); //if in a list, get index
		}
		return path;
	}
	else { //if the top element
		if (element.attr('key')) return [element.attr('key')];
		else return [''];
	}
}

$(document).ready(function() { //mess with elements when they have all loaded
	$('div#filedrag').on('dragover', FileDragHover).on('dragover', FileDragHover).on('drop', FileSelectHandler);

	editor = ace.edit('ace'); //make a new ace editor
	editor.setShowPrintMargin(false); //don't show an annoying vertical line
	editor.setShowInvisibles(false); //don't show new lines, paragraphs, etc.
	editor.getSession().on('change', function() { //when modifying the text
		if (editor.getValue() == editororig) $('button#save').removeClass('btn-info'); //if editor's value is the same as the original one, show that nothing is being saved
		else $('button#save').addClass('btn-info'); //otherwise, show that something will be saved
	});
	editor.keyBinding.originalOnCommandKey = editor.keyBinding.onCommandKey;
	editor.keyBinding.onCommandKey = function(e, hashId, keyCode) { //if the escape key is pressed in the editor, close it
		if (keyCode == 27) closeeditor();
	};

	$('div#filedrag').hover(function() { //tell the user that they can drop a file on the filedrop
		$(this).text('Drop file here');
	}, function() {
		$(this).text('Upload');
	});

	$('button#save').click(save); //bind the save function
	$('input#nameinput').keydown(function(e) { //add an event handler for typing in the name input
		if (e.which == 13) { //if enter is pressed
			if (newtag) compoundsave(); //if adding a new tag to a compound, do that
			else savename(); //otherwise, just rename the current tag
		}
		else if (e.which == 27) closename(); //if escape is pressed, close the input box
		else { //if text is being entered
			setTimeout($.proxy(function() { //allow new value to be registered before checking it
				var value = $(this).val(); //get value
				if (value == renameorig) $('button#namesave').removeClass('btn-success').removeClass('btn-danger'); //if the changed value is the same as the original one, show that nothing will be changed
				else { //if something is being changed
					if (value.length < 32768) { //make sure length fixed in a short
						if (newtag) { //if adding a new tag to a compound
							var children = savetag.children('ul').children(); //get children of the compound
							var success = true; //assume it worked unless an error is flagged
							for (var i = 0; i < children.length; i++) { //go through the children
								if (children.eq(i).attr('key') == value) { //if one of the tags is already named that, fail
									success = false;
									break;
								}
							}
						}
						else { //see if (newtag)
							var siblings = savetag.parent().children(); //get siblings (members of the same compound)
							var success = true;
							for (var i = 0; i < siblings.length; i++) {
								if (siblings.eq(i).attr('key') == value && !siblings.eq(i).is(savetag)) { //if another sibling tag is already named that and isn't the one being renamed
									success = false;
									break;
								}
							}
						}
						if (success) $('button#namesave').removeClass('btn-danger').addClass('btn-success'); //if it is legal, show so
						else $('button#namesave').removeClass('btn-success').addClass('btn-danger'); //otherwise show that it isn't allowed
					}
					else $('button#namesave').removeClass('btn-success').addClass('btn-danger');
				}
			}, this), 0);
		}
	}).focus(function() { //so the button's style matches that of the input
		$('button#namesave').removeClass('blur').addClass('focus');
	}).blur(function() { //see .blur()
		$('button#namesave').removeClass('focus').addClass('blur');
	});
	$('button#namesave').click(function() { //bind click handler to name save button, see $('input#nameinput').keydown() for e.which == 13
		if (newtag) compoundsave();
		else savename();
	});
	$('button#typesave').click(function() { //bind click handler to type save button
		tagtype = $('select#typeinput').val();
		if (newtag) { //if adding a new tag to a compound, any type is allowed
			closetype(); //close the window
			$('div#tagname').show();
			$('input#nameinput').focus(); //transitioning to name input, so move typehead there
		}
		else { //if coercing, check to make sure it's allowed
			if (savetag.children('img.type').attr('src') == images.TAG_List) { //if in a list, each value must be checked individually
				if (tagtype == 'TAG_List' || tagtype == 'TAG_Compound') savetag.attr('type', tagtype); //if going to List or Compound (from End), it's allowed
				else { //otherwise, a type check is needed
					var success = true, valueworks, elements = savetag.children('ul').children(), j; //success is coercibility, valueworks is the result of valuecheck(), elements is the array of children
					for (var i = 0; i < elements.length; i++) { //for each element
						if (elements.eq(i).attr('value')) { //if not a Byte_Array or Int_Array
							valueworks = valuecheck(images[tagtype], elements.eq(i).attr('value')); //check the value
							if (!valueworks.success) { //if it didn't work, record so
								success = false;
								alert(valueworks.message);
								break;
							}
						}
						else { //converting a Byte_Array or Int_Array
							var subchildren = elements.eq(i).children('ul').children(), items = []; //subchildren is the set of children of each element of the list, items contains their values
							for (j = 0; j < subchildren.length; j++) items[j] = subchildren.eq(j).attr('value'); //create an array of values of each child of the Byte_Array or Int_Array
							valueworks = valuecheck(images[tagtype], items.join('\n')); //check that the values are allowed
							if (!valueworks.success) { //if it didn't work, record so
								success = false;
								alert(valueworks.message);
								break;
							}
						}
					}
					if (success) { //if it worked
						savetag.attr('type', tagtype); //change the type
						var src = images[tagtype]; //get url for the children's type icons
						if (tagtype == 'TAG_Byte_Array') var subsrc = images.TAG_Byte; //get url for the subchildren (only matters if coercing a Byte_Array or Int_Array)
						else var subsrc = images.TAG_Int;
						for (i = 0; i < elements.length; i++) { //go through the elements
							if (elements.eq(i).attr('value')) { //if not a Byte_Array or Int_Array
								if (tagtype == 'TAG_String') savetag.children('span').text('"' + savetag.attr('value') + '"'); //if going from a number to a string, add the quotation marks
								else if (savetag.children('img.type').attr('src') == images.TAG_String) savetag.children('span').text(savetag.attr('value')); //if going from a string to a number, get rid of the quotation marks
								elements.eq(i).children('img.type').attr('src', src); //change the icon
							}
							else {
								subchildren = elements.eq(i).children('ul').children(); //get the elements of the Byte_Array or Int_Array
								for (j = 0; j < subchildren.length; j++) subchildren.eq(j).children('img.type').attr('src', subsrc); //change each of their icons in turn
								elements.eq(i).children('img.type').attr('src', src); //change the icon
							}
						}
						closetype(); //close the window
					}
				}
			}
			else { //if not dealing with a list
				if (savetag.attr('value')) { //if not a Byte_Array or Int_Array
					var src = images[tagtype];
					var valueworks = valuecheck(src, savetag.attr('value')); //find if it is an allowable value
					if (valueworks.success) { //if it is
						if (tagtype == 'TAG_String') savetag.children('span').text(savetag.attr('key') + ': "' + savetag.attr('value') + '"'); //if going from a number to a string, add the quotation marks
						else if (savetag.children('img.type').attr('src') == images.TAG_String) savetag.children('span').text(savetag.attr('key') + ': ' + savetag.attr('value')); //if going from a string to a number, get rid of the quotation marks
						savetag.children('img.type').attr('src', src); //change the image src
						closetype(); //close the window
					}
					else alert(valueworks.message); //if it isn't, alert so
				}
				else { //if a Byte_Array or Int_Array
					var src = images[tagtype]; //get new image src
					if (tagtype == 'TAG_Byte_Array') var subsrc = images.TAG_Byte; //get src for children
					else var subsrc = images.TAG_Int;
					var elements = savetag.children('ul').children(), items = []; //elements is the list of children, items is the array of their values
					for (var i = 0; i < elements.length; i++) items[i] = elements.eq(i).attr('value'); //form the list of values
					var valueworks = valuecheck(src, items.join('\n')); //check values
					if (valueworks.success) { //if all the children are allowed
						savetag.children('img.type').attr('src', src); //change the type image src of the parent
						for (i = 0; i < elements.length; i++) elements.eq(i).children('img.type').attr('src', subsrc); //change the type image of all the children
						closetype(); //close the window
					}
					else alert(valueworks.message); //otherwise, alert so
				}
			}
			remakeImages();
		}
	});
	$('button#cancel').click(closeeditor); //bind the editor close button
	remakeImages(); //images need click handlers
	$('select').select2(); //initialize the select
});