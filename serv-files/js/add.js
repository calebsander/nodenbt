var tagtype; //the type of the new tag when creating a compound
function createtag(type, key) { //calls renderJSON to generate the tag and adds it as a child of savetag
	var container = savetag.children('ul');
	container.append(renderJSON({
		'type': type,
		'value': defaults[type]
	}, key));
	if (key !== undefined) sortkeys(container);
	if (savetag.children('img.type').attr('src') != images.TAG_Compound) initializeList(savetag.children('ul'));
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
	else { //adding an element to a list; type is implied and name is not applicable, so create it immediately
		if (parent.attr('type') == 'null') alert('Cannot add an element to a null-typed list. Convert the type first.');
		else createtag(parent.attr('type'));
	}
	parent.children('ul').show();
}
function compoundsave() { //after name has been entered, add a child to the compound using it and the previously selected type
	if ($('button#namesave').hasClass('btn-success')) { //if name is invalid, do nothing
		createtag(tagtype, $('input#nameinput').val()); //add the tag
		closename(); //done with choosing a name
	}
}
var addimg = $('<img>').addClass('add').attr('src', images.add).attr('title', 'Add tag');
function showadd() { //see showedit()
	if (!$(this).parent().children('img.add').is(addimg)) $(this).after(addimg);
}