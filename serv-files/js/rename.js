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
		if (savetag.children('img.type').attr('src') == images.TAG_List || savetag.children('img.type').attr('src') == images.TAG_Compound || savetag.children('img.type').attr('src') == images.TAG_Byte_Array || savetag.children('img.type').attr('src') == images.TAG_Int_Array) spanchild.text(newname + ':'); //if the tag has children, just display the new name
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
var renameimg = $('<img>').addClass('rename').attr('src', images.rename).attr('title', 'Rename tag');
function showrename() { //see showedit()
	if (!$(this).parent().children('img.rename').is(renameimg)) $(this).after(renameimg);
}