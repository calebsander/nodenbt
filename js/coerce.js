function coerce() { //open the type selection interface for coercing a tag
	closeAll(); //shouldn't be editing anything else simultaneously
	var parent = $(this).parent(); //see edit()
	saveTag = parent;
	newTag = false; //not trying to add a tag, tells save tag button that it should attempt to change the tag type
	if (parent.attr('type')) var type = parent.attr('type'); //if coercing a List, simply read the type from its stored attribute
	else { //if not coercing a List
		var imgSrc = parent.children('img.type').attr('src'); //get the type image src
		for (var i in IMAGES) { //look through the image asset urls until finding one that matches, and then take its key (the tag type)
			if (IMAGES[i] == imgSrc) {
				var type = i;
				break;
			}
		}
	}
	setTypeSelect(type); //display appropriate type options
	typeTitle.text('Converting ' + parent.attr('key')); //display what is being editted
	typePanel.show(); //open the type input
}
function saveCoerce() { //checks to see if the coercion is valid, saves it if it is
	if (saveTag.children('img.type').attr('src') == IMAGES.TAG_List) { //if in a list, each value must be checked individually
		var success = false; //coercibility; defaults to unsuccessful
		if (tagType == TAG_List || tagType == TAG_Compound) { //if going to List or Compound (from End), it's allowed
			saveTag.attr('type', tagType);
			success = true;
			coerceImg.detach();
		}
		else { //otherwise, a type check is needed
			var valueWorks, elements = saveTag.children('ul').children(); //valueworks is the result of valuecheck(), elements is the array of children
			success = true;
			for (var i = 0, j; i < elements.length; i++) { //for each element
				if (saveTag.attr('type') == TAG_Byte_Array || saveTag.attr('type') == TAG_Int_Array) { //converting a Byte_Array or Int_Array
					valueWorks = valueCheck(IMAGES[tagType], elements.eq(i).attr('value').replace(/,/g, '\n')); //check that the values are allowed
					if (!valueWorks.success) { //if it didn't work, record so
						success = false;
						alert(valueWorks.message);
						break;
					}
				}
				else { //if not a Byte_Array or Int_Array
					valueWorks = valueCheck(IMAGES[tagType], elements.eq(i).attr('value')); //check the value
					if (!valueWorks.success) { //if it didn't work, record so
						success = false;
						alert(valueWorks.message);
						break;
					}
				}
			}
			if (success) { //if it worked
				saveTag.attr('type', tagType); //change the type
				var src = IMAGES[tagType]; //get url for the children's type icons
				if (tagType == TAG_Byte_Array) var subsrc = IMAGES.TAG_Byte; //get url for the subchildren (only matters if coercing a Byte_Array or Int_Array)
				else var subsrc = IMAGES.TAG_Int;
				for (i = 0; i < elements.length; i++) { //go through the elements
					if (elements.eq(i).attr('value')) { //if not a Byte_Array or Int_Array
						elements.eq(i).children('span').text(formatValue(elements.eq(i).attr('value'), src)); //if going between a number and a string, add/remove the quotation marks
						elements.eq(i).children('img.type').attr('src', src); //change the icon
					}
				}
			}
		}
		if (success) setTypeAttr(saveTag.children('img.subtype'), tagType);
	}
	else { //if dealing with a single member of a compound
		if (saveTag.children('img.type').attr('src') == IMAGES.TAG_Byte_Array || saveTag.children('img.type').attr('src') == IMAGES.TAG_Int_Array) { //converting a Byte_Array or Int_Array
			var src = IMAGES[tagType]; //get new image src
			var valueWorks = valueCheck(src, saveTag.attr('value').replace(/,/g, '\n')); //check values
			if (valueWorks.success) { //if all the children are allowed
				saveTag.children('img.type').attr('src', src); //change the type image src of the parent
				success = true;
			}
			else alert(valueWorks.message); //otherwise, alert so
		}
		else { //if not a Byte_Array or Int_Array
			var src = IMAGES[tagType];
			var valueWorks = valueCheck(src, saveTag.attr('value')); //find if it is an allowable value
			if (valueWorks.success) { //if it is
				saveTag.children('span').text(saveTag.attr('key') + ': ' + formatValue(saveTag.attr('value'), src)); //if going between a number and a string, add/remove the quotation marks
				saveTag.children('img.type').attr('src', src); //change the image src
				success = true;
			}
			else alert(valueWorks.message); //if it isn't, alert so
		}
	}
	remakeImages();
	if (success) {
		const tag = walkPath(getPath(saveTag)); //get the tag being editted
		if (tag.type == TAG_List) {
			if (tag.value.type == TAG_String && tagType != TAG_Long) {
				for (var element in tag.value.list) tag.value.list[element] = Number(tag.value.list[element]); //convert strings to numbers
			}
			else if (tagType == TAG_String) {
				for (var element in tag.value.list) tag.value.list[element] = String(tag.value.list[element]); //convert numbers to strings
			}
			tag.value.type = tagType;
		}
		else {
			if (tag.type == TAG_String && tagType != TAG_Long) tag.value = Number(tag.value); //convert strings to numbers
			else if (tagType == TAG_String) tag.value = String(tag.value); //convert numbers to strings
			tag.type = tagType;
		}
		modified = true;
		closeType(); //close the window
	}
}
var coerceImg = $('<img>').addClass('coerce').attr('src', IMAGES.coerce).attr('title', 'Convert type');
function showCoerce() { //see showedit()
	if (!$(this).parent().children('img.coerce').is(coerceImg)) {
		var type = $(this).parent().attr('type'); //will contain the type for a TAG_List, otherwise it will be undefined
		if (type === undefined || COERCE_TO[type]) $(this).after(coerceImg); //not all lists are coercible (e.g. TAG_Compound)
	}
}