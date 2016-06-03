var editor, editorOrig; //editor is the ace editor variable, editorOrig is the original value of the editor's text to compare to
function edit() { //open the editor
	closeAll(); //remove all editting windows
	var parent = $(this).parent(); //parent should be the li element
	saveTag = parent;
	switch (parent.children('img.type').attr('src')) { //different types must be handled differently
		//generally, store the original value and set the editor text to it, then set the title to say what's being editted
		case IMAGES.TAG_Byte:
			editorOrig = parent.attr('value');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Byte');
			break;
		case IMAGES.TAG_Short:
			editorOrig = parent.attr('value');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Short');
			break;
		case IMAGES.TAG_Int:
			editorOrig = parent.attr('value');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Int');
			break;
		case IMAGES.TAG_Long:
			editorOrig = parent.attr('value');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Long');
			break;
		case IMAGES.TAG_Float:
			editorOrig = parent.attr('value');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Float');
			break;
		case IMAGES.TAG_Double:
			editorOrig = parent.attr('value');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Double');
			break;
		case IMAGES.TAG_Byte_Array: //Byte_Array and Int_Array are weird because their value attribute is a sort of array
			editorOrig = parent.attr('value').replace(/,/g, '\n'); //editor should display each child on its own line
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Byte_Array');
			break;
		case IMAGES.TAG_String:
			editorOrig = parent.attr('value');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_String');
			break;
		case IMAGES.TAG_Int_Array: //see case IMAGES.TAG_Byte_Array
			editorOrig = parent.attr('value').replace(/,/g, '\n');
			editor.setValue(editorOrig);
			if (parent.attr('key')) editorTitle.text('Editing ' + parent.attr('key'));
			else editorTitle.text('Editing TAG_Int_Array');
			break;
		default:
			throw new Error('No such tag: ' + parent.children('img.type').attr('src'));
	}
	editorTitle.append(escHelp);
	$('div#editor').show();
	editor.focus(); //target editor
}
function save() { //save the editted tag
	if ($(this).hasClass('btn-info')) { //if it was actually changed
		var saveType = saveTag.children('img.type').attr('src');
		var editorValue = editor.getValue();
		var valueWorks = valueCheck(saveType, editorValue); //check the value
		if (valueWorks.success) { //if it worked
			if (saveType == IMAGES.TAG_Byte_Array || saveType == IMAGES.TAG_Int_Array) saveTag.attr('value', String(valueWorks.value)); //make sure array is properly converted to string representation
			else { //only need to change the displayed value if not a TAG_Byte_Array or TAG_Int_Array
				saveTag.attr('value', valueWorks.value); //record new value
				var spanChild = saveTag.children('span'); //get the span element that displays the value
				var saveValue = formatValue(valueWorks.value, saveTag.children('img.type').attr('src'));
				if (saveTag.attr('key')) spanChild.text(saveTag.attr('key') + ': ' + saveValue); //just change the text, as in renderJSON
				else spanChild.text(saveValue);
			}
			if (saveTag.parent().parent().children('img.type').attr('src') == IMAGES.TAG_List) initializeList(saveTag.parent()); //display the index number again
			remakeImages();
			closeEditor();
			const path = getPath(saveTag);
			const value = valueWorks.value;
			const tag = path.pop(); //see code for up
			const parent = walkPath(path);
			switch (parent.type) { //save the new value (different types of parents require different fashions of locating the child)
				case TAG_List:
					parent.value.list[tag] = value;
					break;
				case TAG_Compound:
					parent.value[tag].value = value;
					break;
				default: //TAG_Byte_Array or TAG_Int_Array
					parent.value[tag] = value;
			}
			modified = true;
		}
		else alert(valueWorks.message); //should be cleaned up
	}
}
var editImg = $('<img>').addClass('edit').attr('src', IMAGES.edit).attr('title', 'Edit value'); //image element with the edit icon
function showEdit() { //triggered when mousing over an edittable element - shows the edit icon
	if (!$(this).parent().children('img.edit').is(editImg)) $(this).after(editImg); //if this isn't already displaying the edit icon, display it
}