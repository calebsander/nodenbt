var nbtDiv, //the container for all the tags
	editorTitle, //the element that contains the title of the editor panel
	typeTitle, //the element that contains the title of the type panel
	nameTitle, //the element that contains the title of the name panel
	searchTitle, //the element containing the title of the search panel
	editorSaveButton, //the save button for the editor
	nameSaveButton, //the save button for the tag name panel
	nameInput, //the input on the tag name panel
	searchInput, //the input field for the search panel
	typeSelect, //the selector for tag types
	editorPanel, //the panel for editting values
	typePanel, //the tag type panel
	namePanel, //the tag name panel
	searchPanel, //the search panel
	fileDrag, //the div that files are dropped onto
	searchOutput, //the container for the search results
	searchDiv, //the search link at the top
	liX, //the x coordinate input's wrapper
	liX, //the z coordinate input's wrapper
	liXInput, //the x coordinate input
	liZInput, //the z coordinate input
	fileNameOutput, //the output containing the mcr file name
	chunkOutput; //the output containing the chunk numbers
$(document).ready(function() { //mess with elements when they have all loaded
	nbtDiv = $('div#nbt');
	editorTitle = $('div#editor h3.panel-title');
	typeTitle = $('div#tagtype h3.panel-title');
	nameTitle = $('div#tagname h3.panel-title');
	searchTitle = $('div#search-panel h3.panel-title');
	editorSaveButton = $('button#save');
	nameSaveButton = $('button#namesave');
	nameInput = $('input#nameinput');
	searchInput = $('input#search-text');
	typeSelect = $('select#typeinput');
	editorPanel = $('div#editor');
	typePanel = $('div#tagtype');
	namePanel = $('div#tagname');
	searchPanel = $('div#search-panel');
	fileDrag = $('div#filedrag');
	searchOutput = $('div#search-output');
	searchDiv = $('a#search');
	liX = $('li#li-x');
	liZ = $('li#li-z');
	liXInput = liX.children('div').children('input');
	liZInput = liZ.children('div').children('input');
	fileNameOutput = $('li#filename');
	chunkOutput = $('li#chunk');

	$('li#fileparent').on('dragover', fileDragHover).on('dragleave', fileDragHover).on('drop', fileSelectHandler).hover(function() { //tell the user that they can drop a file on the filedrop
		fileDrag.text('Drop file here'); //on mouseover
	}, function() {
		fileDrag.text('Upload'); //on mouseout
	});
	$('input#upload').change(function(e) {
		loadFile(e.target.files);
	});

	editor = ace.edit('ace'); //make a new ace editor
	editor.setShowPrintMargin(false); //don't show an annoying vertical line
	editor.setShowInvisibles(false); //don't show new lines, paragraphs, etc.
	editor.getSession().on('change', function() { //when modifying the text
		if (editor.getValue() == editorOrig) editorSaveButton.removeClass('btn-info'); //if editor's value is the same as the original one, show that nothing is being saved
		else editorSaveButton.addClass('btn-info'); //otherwise, show that something will be saved
	});
	editor.keyBinding.originalOnCommandKey = editor.keyBinding.onCommandKey;
	editor.keyBinding.onCommandKey = function(e, hashId, keyCode) { //if the escape key is pressed in the editor, close it
		if (keyCode == ESC_KEY) closeEditor();
	};
	editor.$blockScrolling = Infinity;

	editorSaveButton.click(save); //bind the save function
	nameInput.keydown(function(e) { //add an event handler for typing in the name input
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
		nameSaveButton.removeClass('blur').addClass('focus');
	}).blur(function() { //see .focus()
		nameSaveButton.removeClass('focus').addClass('blur');
	});
	nameSaveButton.click(function() { //bind click handler to name save button, see nameInput.keydown() for e.which == ENTER_KEY
		if (newTag) compoundSave();
		else saveName();
	});
	$('button#typesave').click(function() { //bind click handler to type save button
		tagType = typeSelect.val();
		if (newTag) { //if adding a new tag to a compound, any type is allowed
			closeType(); //close the window
			nameInput.keydown();
			namePanel.show();
			nameInput.focus(); //transitioning to name input, so move typehead there
		}
		else saveCoerce(); //if coercing, check to make sure it's allowed
	});
	$('button#typecancel').click(closeType); //bind the tag type close button
	$('a#download').click(function() {
		download(); //bind click handler to the download function
		modified = false;
	});
	$('li.dropdown.keep-open>ul.dropdown-menu').click(function(e) { //stop dropdown from closing when clicking in it
		e.stopPropagation();
	});
	$('a#locator').click(function() {
		setTimeout(function() {
			$(liXInput).focus();
		}, 0);
	});
	[liX, liZ].forEach(function(li) {
		li.keyup(displayRegionName); //make changing either the x or z values update the region filename
	});
	liX.keyup();
	searchDiv.click(showSearch); //bind click handler to the search function
	$('input#search-text').keydown(function(e) { //display new search results
		if (e.which == ESC_KEY) closeSearch(); //if escape is pressed, close the panel
		else setTimeout($.proxy(updateSearchResults, this), 0); //allow new value to be registered before checking it
	});
	remakeImages(); //images need click handlers
	typeSelect.select2(); //initialize the select
});

window.onbeforeunload = function() {
	if (modified) return 'You have unsaved changes; are you sure you want to leave?';
};