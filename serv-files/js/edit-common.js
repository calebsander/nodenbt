var savetag; //stores the current element being editted for editting function that are not instantaneous
var newtag; //whether or not a new tag is being added - used to change what happens when entering a new tag type or name

function settypeselect(type) { //used to set the possible values of the tag type for adding a new tag or coercing an existing one
	var typeselect = $('select#typeinput'); //prefetch the typeselect
	typeselect.children().remove(); //remove all the previous options
	//for each possible coercible value, append a new option to the typeselect
	for (var i = 0; i < coerceto[type].length; i++) typeselect.append($('<option>').attr('value', coerceto[type][i]).text(coerceto[type][i]));
	typeselect.select2(); //so a default option is selected
}

function removeicons() { //triggered whenever mousing over an element - removes all the editting function icons if they exist on another element
	if (!$(this).parent().children('img.edit').is(editimg)) editimg.detach();
	if (!$(this).parent().children('img.delete').is(deleteimg)) deleteimg.detach();
	if (!$(this).parent().children('img.rename').is(renameimg)) renameimg.detach();
	if (!$(this).parent().children('img.add').is(addimg)) addimg.detach();
	if (!$(this).parent().children('img.coerce').is(coerceimg)) coerceimg.detach();
	if (!$(this).parent().children('img.up').is(upimg)) upimg.detach();
	if (!$(this).parent().children('img.down').is(downimg)) downimg.detach();
}
function remakeimages() { //readds the image click handlers
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

function closeeditor() { //close the editor
	$('button#save').removeClass('btn-info');
	$('div#editor').hide();
}
function closename() { //close the name input
	$('input#nameinput').val(''); //reset the value of the input so the next request isn't affected by the last input entered
	$('button#namesave').removeClass('btn-success').removeClass('btn-danger'); //display that the value is unchanged
	$('div#tagname').hide(); //actually stop displaying the name input
}
function closetype() { //close the type selection - quick and easy
	$('div#tagtype').hide();
}
function closeall() { //close all editing windows
	closeeditor();
	closename();
	closetype();
}

function getpath(element) { //get an array representing the path to the tag; used for editting tags
	var parent = element.parent().parent();
	if (parent.is('li')) { //if not the top element
		var path = getpath(parent); //get parent's path, then add to it
		if (element.attr('key')) path.push(element.attr('key')); //if in a compound tag and has key
		else { //if no key, either in a list, a compound without a key, or a chunk
			if (parent.children('img.type').attr('src') == images.TAG_Compound) path.push(''); //if a nameless compound tag
			else if (parent.children('img.type').attr('src') == images.TAG_List) path.push(element.parent().children().index(element)); //if in a list, get index
			//if at the first level under a chunk, no need to add any path specification
		}
		return path;
	}
	else if (element.attr('x')) return [element.attr('x'), element.attr('z')]; //if a chunk tag
	else return []; //if the top element in an NBT structure
}