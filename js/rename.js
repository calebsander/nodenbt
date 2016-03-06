var renameOrig; //the original tag name to compare to
function rename() { //open the rename panel
	closeAll(); //don't want to be editting anything else at the same time
	var parent = $(this).parent(); //see edit()
	saveTag = parent; //see edit()
	newtag = false;
	renameOrig = parent.attr('key'); //store originalname
	$('div#tagname h3.panel-title').text('Renaming ' + renameOrig); //display what is being renamed
	$('input#nameinput').keydown(); //trigger the code that checks to see if the new name is valid (make sure no other key is named '')
	$('div#tagname').show(); //open the renaming window
	$('input#nameinput').focus(); //target the name input for text input
}
function checkName() { //checks the value of the nameinput to see if it conflicts
	var value = $(this).val(); //get value
	if (value == renameOrig) $('button#namesave').removeClass('btn-success').removeClass('btn-danger'); //if the changed value is the same as the original one, show that nothing will be changed
	else { //if something is being changed
		if (value.length < 32768) { //make sure length fixed in a short
			if (newTag) { //if adding a new tag to a compound
				var children = saveTag.children('ul').children(); //get children of the compound
				var success = true; //assume it worked unless an error is flagged
				for (var i = 0; i < children.length; i++) { //go through the children
					if (children.eq(i).attr('key') == value) { //if one of the tags is already named that, fail
						success = false;
						break;
					}
				}
			}
			else { //see if (newtag)
				var siblings = saveTag.parent().children(); //get siblings (members of the same compound)
				var success = true;
				for (var i = 0; i < siblings.length; i++) {
					if (siblings.eq(i).attr('key') == value && !siblings.eq(i).is(saveTag)) { //if another sibling tag is already named that and isn't the one being renamed
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
function saveName() { //save the new name
	if ($('button#namesave').hasClass('btn-success')) { //if the name is invalid, do nothing
		const path = getPath(saveTag); //get the path before renaming
		const newName = $('input#nameinput').val(); //fetch the new name
		saveTag.attr('key', newName); //save the new key
		const spanChild = saveTag.children('span'); //get the span element that displays the value
		if (saveTag.children('img.type').attr('src') == IMAGES.TAG_List || saveTag.children('img.type').attr('src') == IMAGES.TAG_Compound || saveTag.children('img.type').attr('src') == IMAGES.TAG_Byte_Array || saveTag.children('img.type').attr('src') == IMAGES.TAG_Int_Array) spanChild.text(newName + ':'); //if the tag has children, just display the new name
		else spanChild.text(newName + ': ' + formatValue(saveTag.attr('value'), saveTag.children('img.type').attr('src'))); //if a tag without children, display the new name and the unchanged value
		sortKeys(saveTag.parent());
		closeName(); //the name input doesn't need to be shown anymore
		remakeImages();
		const tag = path.pop(); //see code for up
		const compound = walkPath(path).value;
		compound[newName] = compound[tag]; //switch tags
		delete compound[tag]; //remove old tag
		modified = true;
	}
}
var renameImg = $('<img>').addClass('rename').attr('src', IMAGES.rename).attr('title', 'Rename tag');
function showRename() { //see showedit()
	if (!$(this).parent().children('img.rename').is(renameImg)) $(this).after(renameImg);
}