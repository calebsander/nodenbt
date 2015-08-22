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
		case images.TAG_Byte_Array: //Byte_Array and Int_Array are weird because their value attribute is a sort of array
			editororig = parent.attr('value').replace(/,/g, '\n'); //editor should display each child on its own line
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
			editororig = parent.attr('value').replace(/,/g, '\n');
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
function save() { //save the editted tag
	if ($(this).hasClass('btn-info')) { //if it was actually changed
		var savetype = savetag.children('img.type').attr('src');
		var editorvalue = editor.getValue();
		var valueworks = valuecheck(savetype, editorvalue); //check the value
		if (valueworks.success) { //if it worked
			if (savetype == images.TAG_Byte_Array || savetype == images.TAG_Int_Array) savetag.attr('value', String(valueworks.value)); //make sure array is properly converted to string representation
			else { //only need to change the displayed value if not a TAG_Byte_Array or TAG_Int_Array
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
var editimg = $('<img>').addClass('edit').attr('src', images.edit).attr('title', 'Edit value'); //image element with the edit icon
function showedit() { //triggered when mousing over an edittable element - shows the edit icon
	if (!$(this).parent().children('img.edit').is(editimg)) $(this).after(editimg); //if this isn't already displaying the edit icon, display it
}