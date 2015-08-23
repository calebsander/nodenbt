var tagType; //the type of the new tag when creating a compound
function createTag(type, key) { //calls renderJSON to generate the tag and adds it as a child of saveTag
	var container = saveTag.children('ul');
	container.append(renderJSON({
		'type': type,
		'value': DEFAULTS[type]
	}, key));
	if (key !== undefined) sortKeys(container);
	if (saveTag.children('img.type').attr('src') != IMAGES.TAG_Compound) initializeList(saveTag.children('ul'));
	$.ajax({ //see save()
		'url': '/editnbt/add',
		'type': 'POST',
		'data': JSON.stringify({
			'path': getPath(saveTag),
			'type': type,
			'value': DEFAULTS[type],
			'key': key
		}),
		'dataType': 'json',
		'success': editSuccess,
		'error': editError
	});
	modified = true;
}
function add() { //opens the type selection interface for adding a new tag to a compound, or just adds a new tag to a TAG_List, TAG_Byte_Array, or TAG_Int_Array
	closeAll(); //nothing else should be editted at the same time
	var parent = $(this).parent(); //see edit()
	saveTag = parent;
	var parentKey = parent.attr('key');
	if (parent.children('img.type').attr('src') == IMAGES.TAG_Compound) { //if adding an element to a compound
		if (parentKey) { //if the compound is the child of another compound
			$('div#tagtype h3.panel-title').text('Adding tag to ' + parentKey); //display what is being edited
			$('div#tagname h3.panel-title').text('Adding tag to ' + parentKey);
		}
		else { //if the compound is the child of a list
			$('div#tagtype h3.panel-title').text('Adding tag');
			$('div#tagname h3.panel-title').text('Adding tag');
		}
		newTag = true; //note that the function is not trying to coerce an element - tells the type save button what to do when clicked
		setTypeSelect('null'); //show all possible new tags
		$('div#tagtype').show(); //allow tag type to be selected
	}
	else { //adding an element to a list; type is implied and name is not applicable, so create it immediately
		if (parent.attr('type') == 'null') alert('Cannot add an element to a null-typed list. Convert the type first.');
		else createTag(parent.attr('type'));
	}
	parent.children('ul').show();
}
function compoundSave() { //after name has been entered, add a child to the compound using it and the previously selected type
	if ($('button#namesave').hasClass('btn-success')) { //if name is invalid, do nothing
		createTag(tagType, $('input#nameinput').val()); //add the tag
		closeName(); //done with choosing a name
	}
}
var addImg = $('<img>').addClass('add').attr('src', IMAGES.add).attr('title', 'Add tag');
function showAdd() { //see showedit()
	if (!$(this).parent().children('img.add').is(addImg)) $(this).after(addImg);
}