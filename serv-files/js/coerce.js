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
				if (savetag.attr('type') == TAG_Byte_Array || savetag.attr('type') == TAG_Int_Array) { //converting a Byte_Array or Int_Array
					valueworks = valuecheck(images[tagtype], elements.eq(i).attr('value').replace(/,/g, '\n')); //check that the values are allowed
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
		if (savetag.children('img.type').attr('src') == images.TAG_Byte_Array || savetag.children('img.type').attr('src') == images.TAG_Int_Array) { //converting a Byte_Array or Int_Array
			var src = images[tagtype]; //get new image src
			var valueworks = valuecheck(src, savetag.attr('value').replace(/,/g, '\n')); //check values
			if (valueworks.success) { //if all the children are allowed
				savetag.children('img.type').attr('src', src); //change the type image src of the parent
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