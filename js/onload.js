var editorTitle; //the element that contains the title of the editor panel
$(document).ready(function() { //mess with elements when they have all loaded
	editorTitle = $('div#editor h3.panel-title');
	$('div#filedrag').on('dragover', fileDragHover).on('dragover', fileDragHover).on('drop', fileSelectHandler);

	editor = ace.edit('ace'); //make a new ace editor
	editor.setShowPrintMargin(false); //don't show an annoying vertical line
	editor.setShowInvisibles(false); //don't show new lines, paragraphs, etc.
	editor.getSession().on('change', function() { //when modifying the text
		if (editor.getValue() == editorOrig) $('button#save').removeClass('btn-info'); //if editor's value is the same as the original one, show that nothing is being saved
		else $('button#save').addClass('btn-info'); //otherwise, show that something will be saved
	});
	editor.keyBinding.originalOnCommandKey = editor.keyBinding.onCommandKey;
	editor.keyBinding.onCommandKey = function(e, hashId, keyCode) { //if the escape key is pressed in the editor, close it
		if (keyCode == ESC_KEY) closeEditor();
	};
	editor.$blockScrolling = Infinity;

	$('div#filedrag').hover(function() { //tell the user that they can drop a file on the filedrop
		$(this).text('Drop file here'); //on mouseover
	}, function() {
		$(this).text('Upload'); //on mouseout
	});

	$('button#save').click(save); //bind the save function
	$('input#nameinput').keydown(function(e) { //add an event handler for typing in the name input
		switch (e.which) {
			case ENTER_KEY: //if enter is pressed
				if (newTag) compoundSave(); //if adding a new tag to a compound, do that
				else saveName(); //otherwise, just rename the current tag
				break;
			case ESC_KEY: //if escape is pressed, close the input box
				closeName();
				break;
			default: //if text is being entered
				setTimeout($.proxy(checkName, this), 0); //allow new value to be registered before checking it
		}
	}).focus(function() { //so the button's style matches that of the input
		$('button#namesave').removeClass('blur').addClass('focus');
	}).blur(function() { //see .blur()
		$('button#namesave').removeClass('focus').addClass('blur');
	});
	$('button#namesave').click(function() { //bind click handler to name save button, see $('input#nameinput').keydown() for e.which == 13
		if (newTag) compoundSave();
		else saveName();
	});
	$('button#typesave').click(function() { //bind click handler to type save button
		tagType = $('select#typeinput').val();
		if (newTag) { //if adding a new tag to a compound, any type is allowed
			closeType(); //close the window
			$('div#tagname').show();
			$('input#nameinput').focus(); //transitioning to name input, so move typehead there
		}
		else saveCoerce(); //if coercing, check to make sure it's allowed
	});
	$('button#typecancel').click(closeType); //bind the tag type close button
	$('a#download').click(function() {
		modified = false;
	});
	$('li.dropdown.keep-open>ul.dropdown-menu').click(function(e) { //stop dropdown from closing when clicking in it
		e.stopPropagation();
	});
	$('li#li-x,li#li-z').keydown(function() { //make changing either the x or z values update the region filename
		setTimeout(displayRegionName, 0); //allow new value to be registered before checking it
	});
	$('a#download').click(download); //bind click handler to the download function
	$('a#search').click(showSearch); //bind click handler to the search function
	$('input#search-text').keydown(function(e) { //display new search results
		if (e.which == ESC_KEY) closeSearch(); //if escape is pressed, close the panel
		else setTimeout($.proxy(updateSearchResults, this), 0); //allow new value to be registered before checking it
	});
	remakeImages(); //images need click handlers
	$('select').select2(); //initialize the select
});

window.onbeforeunload = function() {
	if (modified) return 'You have unsaved changes; are you sure you want to leave?';
};