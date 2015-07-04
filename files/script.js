//Strings for tag types are stored in variables of the same name so arbitrary string literals are not used as much
var TAG_End = 'TAG_End';
var TAG_Byte = 'TAG_Byte';
var TAG_Short = 'TAG_Short';
var TAG_Int = 'TAG_Int';
var TAG_Long = 'TAG_Long';
var TAG_Float = 'TAG_Float';
var TAG_Double = 'TAG_Double';
var TAG_Byte_Array = 'TAG_Byte_Array';
var TAG_String = 'TAG_String';
var TAG_List = 'TAG_List';
var TAG_Compound = 'TAG_Compound';
var TAG_Int_Array = 'TAG_Int_Array';

var images = { //stores the URL for all image assets
	'null': '/images/TAG_End.png',
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

var gzip; //whether the file is gzipped
var modified = false; //whether the file has been editted

function fileDragHover(e) { //triggered when dragging a file onto or off the filedrag div
	e.stopPropagation();
	e.preventDefault();
	if (e.type == 'dragover') $('div#filedrag').addClass('hover').text('Drop file here'); //if dragged onto
	else $('div#filedrag').removeClass('hover').text('Upload'); //if dragged off
}
function fileSelectHandler(e) { //triggered when drogging a file onto the filedrag div
	fileDragHover(e);
	if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files) var files = e.originalEvent.dataTransfer.files;
	else return;
	var reader;
	reader = new FileReader();
	reader.name = files[0].name;
	reader.type = files[0].type;
	reader.onload = function(e) { //when file has been processed into memory, upload it to the server and display it
		$('div#nbt').children().remove();
		remakeimages();
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
									$('div#nbt').append($('<div>').attr('id', 'filetitle').text(e.target.name)).append($('<ul>').append(renderJSON(server_response.data, undefined, true).addClass('shown'))); //display the JSON
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
	var li = $(this).parent();
	var container = li.children('ul');
	if (container.is(':visible')) {
		container.hide();
		li.removeClass('shown');
	}
	else {
		container.show();
		li.addClass('shown');
	}
}

function subtype(type) { //gets the type of the inner element of an array
	switch (type) {
		case TAG_Byte_Array:
			return TAG_Byte;
		case TAG_Int_Array:
			return TAG_Int;
	}
}
function newcontainer() { //returns a new container that can have subtags added to it
	return $('<ul>').addClass('nbtcontainer').hide();
}
function settypeattr(img, type) { //changes the src and title attributes of an img.type element to match a certain type
	return img.attr('src', images[type]).attr('title', type || TAG_End);
}
function createtypeimg(type) { //create a new type image of a certain type
	return settypeattr($('<img>').addClass('type'), type);
}
function renderJSON(data, key, root) { //a recursive function to create an element that represents a tag
	/*
		key will be undefined if invoked by Byte_Array, Int_Array, or List; only relevant if displaying the child of a compound
		generally, the function finds what type the data is, appends an image with the correct icon, appends a span with the value, and adds mouseover edit function handlers
		if the data has a key, it adds compound-specific functions (e.g. rename), sets the key attribute, and adds the key to the displayed value
		Byte_Array, Int_Array, List, and Compound call this function on each of their children and then put them inside a hidden container
		root will only be true for the root tag
		returns the li element
	*/
	var display = $('<li>'); //the main element
	var typeimg = createtypeimg(data.type); //image that indicates type
	var valuespan = $('<span>'); //span that contains the value (with a possible key prefi)

	var valuestring; //value of span text without the key
	if (typeof(data.value) != 'object') { //for primitive types, calculate the display value
		valuestring = String(data.value);
		display.attr('value', data.value);
	}
	else valuestring = ''; //for complicated types (with subtags), don't display a value

	var mousetarget; //target for mouseover handlers (only applicable when there are subtags (so valuestring == ''))
	if (key === undefined) mousetarget = typeimg; //if no key, then valuespan will be empty, so use the image
	else {
		mousetarget = valuespan; //if a key, then target the span
		valuespan.mouseover(showrename); //make the tag renamable
	}

	var container; //will contain subtags if there are any

	if ([TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double].indexOf(data.type) != -1) { //numerical types should be treated the same
		valuespan.mouseover(removeicons);
		if (key !== undefined) valuespan.mouseover(showcoerce);
		valuespan.mouseover(showdelete).mouseover(showedit);
	}
	else if ([TAG_Byte_Array, TAG_Int_Array].indexOf(data.type) != -1) {
		container = newcontainer();
		for (var i = 0; i < data.value.length; i++) { //add each of the subtags
			container.append(renderJSON({
				'type': subtype(data.type),
				'value': data.value[i]
			}));
		}
		addudicons(container);
		mousetarget.mouseover(removeicons)
		if (key !== undefined) mousetarget.mouseover(showcoerce);
		valuespan.mouseover(showadd).mouseover(showdelete).mouseover(showedit);
	}
	else if (data.type == TAG_String) {
		valuestring = '"' + valuestring + '"'; //add quotes around the value
		valuespan.mouseover(removeicons);
		if (key !== undefined) valuespan.mouseover(showcoerce);
		valuespan.mouseover(showdelete).mouseover(showedit);
	}
	else if (data.type == TAG_List) { //very similar to TAG_Byte_Array and TAG_Int_Array except getting type information is different and coercibility is calculated differently
		display.attr('type', String(data.value.type)); //store the type information in the tag
		container = newcontainer();
		for (var i = 0; i < data.value.list.length; i++) { //add each of the subtags
			container.append(renderJSON({
				'type': data.value.type,
				'value': data.value.list[i]
			}));
		}
		addudicons(container);
		mousetarget.mouseover(removeicons).mouseover(showcoerce).mouseover(showadd).mouseover(showdelete);
	}
	else if (data.type == TAG_Compound) {
		container = newcontainer();
		for (var i in data.value) container.append(renderJSON(data.value[i], i)); //add each of the subtags
		sortkeys(container); //order the tags alphabetically
		mousetarget.mouseover(removeicons).mouseover(showadd);
		if (!root) mousetarget.mouseover(showdelete);
	}
	else throw new Error('No such tag: ' + data.type); //should never trigger, but if it did, it would mess up everything, so better to just quit

	var valuetext; //the text to assign to valuespan
	if (key === undefined) valuetext = valuestring;
	else { //if there is a key
		display.attr('key', key); //store the key information in the tag
		valuetext = key + ': ' + valuestring; //add key prefix
	}
	display.append(typeimg); //add type image
	if (data.type == TAG_List) display.append(createtypeimg(data.value.type).addClass('subtype'));
	if (valuetext) { //don't bother using valuespan unless it would have any text
		valuespan.text(valuetext);
		display.append(valuespan); //add type span
	}
	if (container) { //if there are subtags
		typeimg.click(togglecontainer); //make clicking the image show/hide subtags
		display.append(container);
	}
	return display; //return the new element
}
function sortkeys(container) { //does an insertion sort on the elements in a compound by key
	var elements = container.children(); //get the tags to sort
	var testindex, //index of current tag being tested
		nextindex, //index of the next tag to display
		nextkey, //the 'first' key (sorted alphabetically) of the remaining tags
		testkey; //the current key being tested
	while (elements.length) { //tags are removed from elements after being added until none are left
		nextkey = elements.eq(0).attr('key'); //assume the first element will be added
		nextindex = 0;
		for (testindex = 1; testindex < elements.length; testindex++) { //go over the remaining tags looking for one with a key that should come first
			testkey = elements.eq(testindex).attr('key');
			if (testkey.toLowerCase() < nextkey.toLowerCase()) { //the comparison
				nextkey = testkey;
				nextindex = testindex;
			}
		}
		container.append(elements.splice(nextindex, 1)); //append the chosen element to the container
	}
}

var savetag; //stores the current element being editted for editting function that are not instantaneous
var newtag; //whether or not a new tag is being added - used to change what happens when entering a new tag type or name

function removeicons() { //triggered whenever mousing over an element - removes all the editting function icons if they exist on another element
	if (!$(this).parent().children('img.edit').is(editimg)) editimg.detach();
	if (!$(this).parent().children('img.delete').is(deleteimg)) deleteimg.detach();
	if (!$(this).parent().children('img.rename').is(renameimg)) renameimg.detach();
	if (!$(this).parent().children('img.add').is(addimg)) addimg.detach();
	if (!$(this).parent().children('img.coerce').is(coerceimg)) coerceimg.detach();
	if (!$(this).parent().children('img.up').is(upimg)) upimg.detach();
	if (!$(this).parent().children('img.down').is(downimg)) downimg.detach();
}

var coerceto = { //stores possible new tag types for conversion (not all may actually work)
	//null is a special case because it should only be used on lists of length 0 without a specified type
	'null': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double, TAG_Byte_Array, TAG_String, TAG_List, TAG_Compound, TAG_Int_Array],
	'TAG_Byte': [TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double, TAG_String],
	'TAG_Short': [TAG_Byte, TAG_Int, TAG_Long, TAG_Float, TAG_Double, TAG_String],
	'TAG_Int': [TAG_Byte, TAG_Short, TAG_Long, TAG_Float, TAG_Double, TAG_String],
	'TAG_Long': [TAG_Byte, TAG_Short, TAG_Int, TAG_Float, TAG_Double, TAG_String],
	'TAG_Float': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Double, TAG_String],
	'TAG_Double': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_String],
	'TAG_String': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double],
	'TAG_Byte_Array': [TAG_Int_Array],
	'TAG_Int_Array': [TAG_Byte_Array]
};
function settypeselect(type) { //used to set the possible values of the tag type for adding a new tag or coercing an existing one
	var typeselect = $('select#typeinput'); //prefetch the typeselect
	typeselect.children().remove(); //remove all the previous options
	//for each possible coercible value, append a new option to the typeselect
	for (var i = 0; i < coerceto[type].length; i++) typeselect.append($('<option>').attr('value', coerceto[type][i]).text(coerceto[type][i]));
	typeselect.select2(); //so a default option is selected
}

//Readds the image click handlers
function remakeimages() {
	editimg.off('click').click(edit);
	deleteimg.off('click').click(deleter);
	renameimg.off('click').click(rename);
	addimg.off('click').click(add);
	coerceimg.off('click').click(coerce);
	upimg.off('click').click(up);
	downimg.off('click').click(down);
}

//Funcions for edit request responses:
function editsuccess(response) { //on success
	if (!response.success) editerror();
}
function editerror() { //on error
	alert('Editting failed?');
}

var editor, editororig; //editor is the ace editor variable, editororig is the original value of the editor's text to compare to
function edit() { //open the editor
	closeall(); //remove all editting windows
	var parent = $(this).parent(); //parent should be the li element
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
			var elements = parent.children('ul').children(), values = [];
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
			var elements = parent.children('ul').children(), values = [];
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
	if (!$(this).parent().children('img.edit').is(editimg)) $(this).after(editimg); //if this isn't already displaying the edit icon, display it
}
function valuecheck(type, value) { //used to check if the provided value (as a string) is valid for the data type
	var origvalue = value;
	//returns an object, where success says whether or not it worked, message is the error message, and value is the value to save
	switch (type) {
		case images.TAG_Byte:
			value = Number(value); //convert value to a number
			//if value is out of range or value cannot be made into a number or it was '' (which becomes 0) or it is not an integer, it fails
			if (value < -128 || value > 127 || isNaN(value) || origvalue === '' || Math.floor(value) != value) return {success: false, message: origvalue + " is out of TAG_Byte's range"};
			return {success: true, value: String(value)};
		case images.TAG_Short: //see TAG_Byte
			value = Number(value);
			if (value < -32768 || value > 32767 || isNaN(value) || origvalue === '' || Math.floor(value) != value) return {success: false, message: origvalue + " is out of TAG_Short's range"};
			return {success: true, value: String(value)};
		case images.TAG_Int: //see TAG_Byte
			value = Number(value);
			if (value < -2147483648 || value > 2147483647 || isNaN(value) || origvalue === '' || Math.floor(value) != value) return {success: false, message: origvalue + " is out of TAG_Int's range"};
			return {success: true, value: String(value)};
		case images.TAG_Long:
			var outofrange = {success: false, message: origvalue + " is out of TAG_Long's range"}; //value to return if invalid
			//if value is not an integer or it was not a valid number string, it fails
			if (value.indexOf('.') != -1 || isNaN(Number(value)) || value === '') return outofrange;
			if (strnum.gt(value, '9223372036854775807') || strnum.lt(value, '-9223372036854775808')) return outofrange;
			return {success: true, value: strnum.normalize(value)};
		case images.TAG_Float: //value fails if it cannot be turned into a number or is '' (which becomes 0 when converted)
			if (isNaN(Number(value)) || value === '') return {success: false, message: "NaN is out of TAG_Float's range"};
			return {success: true, value: String(Number(value))};
		case images.TAG_Double: //see case images.TAG_Float
			if (isNaN(Number(value)) || value === '') return {success: false, message: "NaN is out of TAG_Double's range"};
			return {success: true, value: String(Number(value))};
		case images.TAG_Byte_Array: //test each byte, if any fail it all fails
			var values = value.split('\n');
			for (var i = 0; i < values.length; i++) {
				if (!(valuecheck(images.TAG_Byte, values[i]).success)) return {success: false, message: values[i] + ' (element ' + String(i + 1) + ") is out of TAG_Byte's range"};
			}
			return {success: true, value: values};
		case images.TAG_String: //if it is longer than TAG_Short's max value, it fails
			if (value.length > 32767) return {success: false, message: value + " is longer than 32767 characters"};
			return {success: true, value: value};
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
function formatvalue(value, type) { //put quotes around strings for display purposes, any other value is left unchanged
	if (type == images.TAG_String) return '"' + value + '"';
	else return value;
}
function save() { //save the editted tag
	if ($(this).hasClass('btn-info')) { //if it was actually changed
		var savetype = savetag.children('img.type').attr('src');
		var editorvalue = editor.getValue();
		var valueworks = valuecheck(savetype, editorvalue); //check the value
		if (valueworks.success) { //if it worked
			if (savetype == images.TAG_Byte_Array || savetype == images.TAG_Int_Array) { //if it is a Byte_Array or Int_Array
				if (savetype == images.TAG_Byte_Array) nbttype = TAG_Byte;
				else nbttype = TAG_Int;
				var container = savetag.children('ul');
				container.children().remove(); //remove old children
				//iterate over every element and append the li to the container
				for (var i = 0; i < valueworks.value.length; i++) container.append(renderJSON({type: nbttype, value: valueworks.value[i] = Number(valueworks.value[i])}, undefined, true));
				addudicons(container); //must re-add the ordering icons
			}
			else { //otherwise, it is much simpler
				savetag.attr('value', valueworks.value); //record new value
				var spanchild = savetag.children('span'); //get the span element that displays the value
				var savevalue = formatvalue(valueworks.value, savetag.children('img.type').attr('src'));
				if (savetag.attr('key')) spanchild.text(savetag.attr('key') + ': ' + savevalue); //just change the text, as in renderJSON
				else spanchild.text(savevalue);
			}
			remakeimages();
			closeeditor();
			$.ajax({ //make a very simple AJAX request with the path to the editted tag and its new value
				'url': '/editnbt/edit',
				'type': 'POST',
				'data': JSON.stringify({
					'path': getpath(savetag),
					'value': valueworks.value
				}),
				'dataType': 'json',
				'success': editsuccess,
				'error': editerror
			});
			modified = true;
		}
		else alert(valueworks.message); //should be cleaned up
	}
}
function closeeditor() { //close the editor
	$('button#save').removeClass('btn-info');
	$('div#editor').hide();
}

function deleter() { //delete the tag where the delete icon was clicked
	var parent = $(this).parent(); //see edit()
	$.ajax({ //see save()
		'url': '/editnbt/delete',
		'type': 'POST',
		'data': JSON.stringify({'path': getpath(parent)}),
		'dataType': 'json',
		'success': editsuccess,
		'error': editerror
	});
	modified = true;
	if (parent.is(savetag) || parent.find(savetag).length) closeall(); //if we deleted a tag that was being edited, close the edit windows
	var ulcontainer = parent.parent();
	parent.remove(); //delete the tag
	if (ulcontainer.parent().children('img.type').attr('src') != images.TAG_Compound) addudicons(ulcontainer); //if on a list/array, redo the ordering icons
	remakeimages();
}
var deleteimg = $('<img>').addClass('delete').attr('src', images['delete']).attr('title', 'Delete tag');
function showdelete() { //see showedit()
	if (!$(this).parent().children('img.delete').is(deleteimg)) $(this).after(deleteimg);
}

var renameorig; //the original tag name to compare to
function rename() { //open the rename panel
	closeall(); //don't want to be editting anything else at the same time
	var parent = $(this).parent(); //see edit()
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
	if (!$(this).parent().children('img.rename').is(renameimg)) $(this).after(renameimg);
}
function checkname() { //checks the value of the nameinput to see if it conflicts
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
}
function savename() { //save the new name
	if ($('button#namesave').hasClass('btn-success')) { //if the name is invalid, do nothing
		var path = getpath(savetag); //get the path before renaming
		var newname = $('input#nameinput').val(); //fetch the new name
		savetag.attr('key', newname); //save the new key
		var spanchild = savetag.children('span'); //get the span element that displays the value
		if (savetag.attr('value') === undefined) spanchild.text(newname + ':'); //if the tag has children, just display the new name
		else spanchild.text(newname + ': ' + formatvalue(savetag.attr('value'), savetag.children('img.type').attr('src'))); //if a tag without children, display the new name and the unchanged value
		sortkeys(savetag.parent());
		closename(); //the name input doesn't need to be shown anymore
		remakeimages();
		$.ajax({ //see save()
			'url': '/editnbt/rename',
			'type': 'POST',
			'data': JSON.stringify({
				'path': path,
				'name': newname
			}),
			'dataType': 'json',
			'success': editsuccess,
			'error': editerror
		});
		modified = true;
	}
}
function closename() { //close the name input
	$('input#nameinput').val(''); //reset the value of the input so the next request isn't affected by the last input entered
	$('button#namesave').removeClass('btn-success').removeClass('btn-danger'); //display that the value is unchanged
	$('div#tagname').hide(); //actually stop displaying the name input
}

var tagtype, defaults = { //tagtype is the type of the new tag when creating a compound, defaults stores the values to initialize new elements at
	'TAG_Byte':       0,
	'TAG_Short':      0,
	'TAG_Int':        0,
	'TAG_Long':      '0',
	'TAG_Float':      0,
	'TAG_Double':     0,
	'TAG_Byte_Array': [],
	'TAG_String':     '',
	'TAG_List':       {
		'type': null,
		'list': []
	},
	'TAG_Compound':   {},
	'TAG_Int_Array':  []
};
function createtag(type, key) { //calls renderJSON to generate the tag and adds it as a child of savetag
	var container = savetag.children('ul');
	container.append(renderJSON({
		'type': type,
		'value': defaults[type]
	}, key));
	if (key !== undefined) sortkeys(container);
	if (savetag.children('img.type').attr('src') != images.TAG_Compound) addudicons(savetag.children('ul'));
	$.ajax({ //see save()
		'url': '/editnbt/add',
		'type': 'POST',
		'data': JSON.stringify({
			'path': getpath(savetag),
			'type': type,
			'value': defaults[type],
			'key': key
		}),
		'dataType': 'json',
		'success': editsuccess,
		'error': editerror
	});
	modified = true;
}
function add() { //opens the type selection interface for adding a new tag to a compound, or just adds a new tag to a TAG_List, TAG_Byte_Array, or TAG_Int_Array
	closeall(); //nothing else should be editted at the same time
	var parent = $(this).parent(); //see edit()
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
	else if (parent.attr('type')) { //adding an element to a list; type is implied and name is not applicable, so create it immediately
		if (parent.attr('type') == 'null') alert('Cannot add an element to a null-typed list. Convert the type first.');
		else createtag(parent.attr('type'));
	}
	else { //adding an element to a byte array or int array
		var parenttype = parent.children('img.type').attr('title');
		createtag(parenttype.substring(0, parenttype.length - '_Array'.length)); //take off the array ending on the type
	}
	parent.children('ul').show();
}
var addimg = $('<img>').addClass('add').attr('src', images.add).attr('title', 'Add tag');
function showadd() { //see showedit()
	if (!$(this).parent().children('img.add').is(addimg)) $(this).after(addimg);
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

function coerce() { //open the type selection interface for coercing a tag
	closeall(); //shouldn't be editing anything else simultaneously
	var parent = $(this).parent(); //see edit()
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
function savecoerce() { //checks to see if the coercion is valid, saves it if it is
	if (savetag.children('img.type').attr('src') == images.TAG_List) { //if in a list, each value must be checked individually
		var success = false;
		if (tagtype == TAG_List || tagtype == TAG_Compound) { //if going to List or Compound (from End), it's allowed
			savetag.attr('type', tagtype);
			success = true;
			coerceimg.detach();
		}
		else { //otherwise, a type check is needed
			var valueworks, elements = savetag.children('ul').children(); //success is coercibility, valueworks is the result of valuecheck(), elements is the array of children
			success = true;
			for (var i = 0, j; i < elements.length; i++) { //for each element
				if (elements.eq(i).attr('value') === undefined) { //converting a Byte_Array or Int_Array
					var subchildren = elements.eq(i).children('ul').children(), items = []; //subchildren is the set of children of each element of the list, items contains their values
					for (j = 0; j < subchildren.length; j++) items[j] = subchildren.eq(j).attr('value'); //create an array of values of each child of the Byte_Array or Int_Array
					valueworks = valuecheck(images[tagtype], items.join('\n')); //check that the values are allowed
					if (!valueworks.success) { //if it didn't work, record so
						success = false;
						alert(valueworks.message);
						break;
					}
				}
				else { //if not a Byte_Array or Int_Array
					valueworks = valuecheck(images[tagtype], elements.eq(i).attr('value')); //check the value
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
				if (tagtype == TAG_Byte_Array) var subsrc = images.TAG_Byte; //get url for the subchildren (only matters if coercing a Byte_Array or Int_Array)
				else var subsrc = images.TAG_Int;
				for (i = 0; i < elements.length; i++) { //go through the elements
					if (elements.eq(i).attr('value')) { //if not a Byte_Array or Int_Array
						elements.eq(i).children('span').text(formatvalue(elements.eq(i).attr('value'), src)); //if going between a number and a string, add/remove the quotation marks
						elements.eq(i).children('img.type').attr('src', src); //change the icon
					}
					else {
						subchildren = elements.eq(i).children('ul').children(); //get the elements of the Byte_Array or Int_Array
						for (j = 0; j < subchildren.length; j++) subchildren.eq(j).children('img.type').attr('src', subsrc); //change each of their icons in turn
						elements.eq(i).children('img.type').attr('src', src); //change the icon
					}
				}
			}
		}
		if (success) settypeattr(savetag.children('img.subtype'), tagtype);
	}
	else { //if dealing with a single member of a compound
		if (savetag.attr('value') === undefined) { //if a Byte_Array or Int_Array
			var src = images[tagtype]; //get new image src
			if (tagtype == TAG_Byte_Array) var subsrc = images.TAG_Byte; //get src for children
			else var subsrc = images.TAG_Int;
			var elements = savetag.children('ul').children(), items = []; //elements is the list of children, items is the array of their values
			for (var i = 0; i < elements.length; i++) items[i] = elements.eq(i).attr('value'); //form the list of values
			var valueworks = valuecheck(src, items.join('\n')); //check values
			if (valueworks.success) { //if all the children are allowed
				savetag.children('img.type').attr('src', src); //change the type image src of the parent
				for (i = 0; i < elements.length; i++) elements.eq(i).children('img.type').attr('src', subsrc); //change the type image of all the children
				success = true;
			}
			else alert(valueworks.message); //otherwise, alert so
		}
		else { //if not a Byte_Array or Int_Array
			var src = images[tagtype];
			var valueworks = valuecheck(src, savetag.attr('value')); //find if it is an allowable value
			if (valueworks.success) { //if it is
				savetag.children('span').text(savetag.attr('key') + ': ' + formatvalue(savetag.attr('value'), src)); //if going between a number and a string, add/remove the quotation marks
				savetag.children('img.type').attr('src', src); //change the image src
				success = true;
			}
			else alert(valueworks.message); //if it isn't, alert so
		}
	}
	remakeimages();
	if (success) {
		$.ajax({ //see save()
			'url': '/editnbt/coerce',
			'type': 'POST',
			'data': JSON.stringify({
				'path': getpath(savetag),
				'type': tagtype
			}),
			'dataType': 'json',
			'success': editsuccess,
			'error': editerror
		});
		modified = true;
		closetype(); //close the window
	}
}
var coerceimg = $('<img>').addClass('coerce').attr('src', images.coerce).attr('title', 'Convert type');
function showcoerce() { //see showedit()
	if (!$(this).parent().children('img.coerce').is(coerceimg)) {
		var type = $(this).parent().attr('type'); //will contain the type for a TAG_List, otherwise it will be undefined
		if (type === undefined || coerceto[type]) $(this).after(coerceimg); //not all lists are coercible (e.g. TAG_Compound)
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
	$.ajax({ //see save()
		'url': '/editnbt/up',
		'type': 'POST',
		'data': JSON.stringify({'path': getpath(parent)}),
		'dataType': 'json',
		'success': editsuccess,
		'error': editerror
	});
	modified = true;
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
	if (!$(this).parent().children('img.up').is(upimg)) $(this).after(upimg);
}
function down() { //move an element in a list down; see up()
	var parent = $(this).parent();
	$.ajax({ //see save()
		'url': '/editnbt/down',
		'type': 'POST',
		'data': JSON.stringify({'path': getpath(parent)}),
		'dataType': 'json',
		'success': editsuccess,
		'error': editerror
	});
	modified = true;
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
	if (!$(this).parent().children('img.down').is(downimg)) $(this).after(downimg);
}

function closeall() { //close all editing windows
	closeeditor();
	closename();
	closetype();
}

function getpath(element) { //get an array representing the path to the tag; used for editting tags
	if (element.parent().parent().is('li')) { //if not the top element
		var path = getpath(element.parent().parent()); //get parent's path, then add to it
		if (element.attr('key')) path.push(element.attr('key')); //if in a compound tag and has key
		else { //if no key, either in a list or in a compound without a key
			if (element.parent().parent().children('img.type').attr('src') == images.TAG_Compound) path.push(''); //if a nameless compound tag
			else path.push(element.parent().children().index(element)); //if in a list, get index
		}
		return path;
	}
	else return []; //if the top element
}

$(document).ready(function() { //mess with elements when they have all loaded
	$('div#filedrag').on('dragover', fileDragHover).on('dragover', fileDragHover).on('drop', fileSelectHandler);

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
		$(this).text('Drop file here'); //on mouseover
	}, function() {
		$(this).text('Upload'); //on mouseout
	});

	$('button#save').click(save); //bind the save function
	$('input#nameinput').keydown(function(e) { //add an event handler for typing in the name input
		switch (e.which) {
			case 13: //if enter is pressed
				if (newtag) compoundsave(); //if adding a new tag to a compound, do that
				else savename(); //otherwise, just rename the current tag
				break;
			case 27: //if escape is pressed, close the input box
				closename();
				break;
			default: //if text is being entered
				setTimeout($.proxy(checkname, this), 0); //allow new value to be registered before checking it
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
		else savecoerce(); //if coercing, check to make sure it's allowed
	});
	$('button#typecancel').click(closetype); //bind the tag type close button
	$('a#download').click(function() {
		modified = false;
	});
	remakeimages(); //images need click handlers
	$('select').select2(); //initialize the select
});

window.onbeforeunload = function() {
	if (modified) return 'You have unsaved changes; are you sure you want to leave?';
};