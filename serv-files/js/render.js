function toggleContainer() { //triggered when clicking on a Byte_Array, Int_Array, List, or Compound's images - shows its children
	var li = $(this).parent();
	var container = li.children('ul');
	if (container.is(':visible')) {
		container.hide();
		li.removeClass('shown');
	}
	else {
		container.show();
		li.addClass('shown');
	}
}

function newContainer() { //returns a new container that can have subtags added to it
	return $('<ul>').addClass('nbtcontainer').hide();
}
function setTypeAttr(img, type) { //changes the src and title attributes of an img.type element to match a certain type
	return img.attr('src', IMAGES[type]).attr('title', type || TAG_End);
}
function createTypeImg(type) { //create a new type image of a certain type
	return setTypeAttr($('<img>').addClass('type'), type);
}
function renderJSON(data, key, root) { //a recursive function to create an element that represents a tag
	/*
		key will be undefined if invoked by Byte_Array, Int_Array, or List; only relevant if displaying the child of a compound
		generally, the function finds what type the data is, appends an image with the correct icon, appends a span with the value, and adds mouseover edit function handlers
		if the data has a key, it adds compound-specific functions (e.g. rename), sets the key attribute, and adds the key to the displayed value
		Byte_Array, Int_Array, List, and Compound call this function on each of their children and then put them inside a hidden container
		root will only be true for the root tag
		returns the li element
	*/
	var display = $('<li>'); //the main element
	var typeImg = createTypeImg(data.type); //image that indicates type
	var valueSpan = $('<span>'); //span that contains the value (with a possible key prefix)

	var valueString; //value of span text without the key
	if (typeof(data.value) != 'object') { //for primitive types, calculate the display value
		valueString = String(data.value);
		display.attr('value', data.value);
	}
	else valueString = ''; //for complicated types (with subtags), don't display a value

	var mouseTarget; //target for mouseover handlers (only applicable when there are subtags (so valuestring == ''))
	if (key === undefined) mouseTarget = typeImg; //if no key, then valuespan will be empty, so use the image
	else {
		mouseTarget = valueSpan; //if a key, then target the span
		valueSpan.mouseover(showRename); //make the tag renamable
	}

	var container; //will contain subtags if there are any

	if ([TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double].indexOf(data.type) != -1) { //numerical types should be treated the same
		valueSpan.mouseover(removeIcons);
		if (key !== undefined) valueSpan.mouseover(showCoerce);
		valueSpan.mouseover(showDelete).mouseover(showEdit);
	}
	else if ([TAG_Byte_Array, TAG_Int_Array].indexOf(data.type) != -1) {
		display.attr('value', String(data.value));
		mouseTarget.mouseover(removeIcons)
		if (key !== undefined) mouseTarget.mouseover(showCoerce);
		valueSpan.mouseover(showDelete).mouseover(showEdit);
	}
	else if (data.type == TAG_String) {
		valueString = '"' + valueString + '"'; //add quotes around the value
		valueSpan.mouseover(removeIcons);
		if (key !== undefined) valueSpan.mouseover(showCoerce);
		valueSpan.mouseover(showDelete).mouseover(showEdit);
	}
	else if (data.type == TAG_List) { //very similar to TAG_Byte_Array and TAG_Int_Array except getting type information is different and coercibility is calculated differently
		display.attr('type', String(data.value.type)); //store the type information in the tag
		container = newContainer();
		for (var i = 0; i < data.value.list.length; i++) { //add each of the subtags
			container.append(renderJSON({
				'type': data.value.type,
				'value': data.value.list[i]
			}));
		}
		initializeList(container);
		mouseTarget.mouseover(removeIcons).mouseover(showCoerce).mouseover(showAdd).mouseover(showDelete);
	}
	else if (data.type == TAG_Compound) {
		container = newContainer();
		for (var i in data.value) container.append(renderJSON(data.value[i], i)); //add each of the subtags
		sortKeys(container); //order the tags alphabetically
		mouseTarget.mouseover(removeIcons).mouseover(showAdd);
		if (!root) mouseTarget.mouseover(showDelete);
	}
	else throw new Error('No such tag: ' + data.type); //should never trigger, but if it did, it would mess up everything, so better to just quit

	var valueText; //the text to assign to valuespan
	if (key === undefined) valueText = valueString;
	else { //if there is a key
		display.attr('key', key); //store the key information in the tag
		valueText = key + ': ' + valueString; //add key prefix
	}
	display.append(typeImg); //add type image
	if (data.type == TAG_List) display.append(createTypeImg(data.value.type).addClass('subtype'));
	if (valueText) { //don't bother using valuespan unless it would have any text
		valueSpan.text(valueText);
		display.append(valueSpan); //add type span
	}
	if (container) { //if there are subtags
		typeImg.click(toggleContainer); //make clicking the image show/hide subtags
		display.append(container);
	}
	return display; //return the new element
}
function renderMCA(data) { //like renderJSON, but for the response on an MCA/MCR upload - shows which chunks are available
	var shownChunks = $('<ul>');
	var display, typeImg, valueSpan, container; //see renderJSON
	var x, z;
	for (x in data) {
		for (z in data[x]) {
			if (data[x][z]) {
				display = $('<li>').attr('x', x).attr('z', z); //the main element
				typeImg = createTypeImg('chunk').click(readChunk).click(toggleContainer); //image that indicates type
				valueSpan = $('<span>').text('[' + String(x) + ', ' + String(z) + ']'); //span that contains the value (with a possible key prefix)
				container = newContainer();
				shownChunks.append(display.append(typeImg).append(valueSpan).append(container));
			}
		}
	}
	return shownChunks;
}
function sortKeys(container) { //does an insertion sort on the elements in a compound by key
	var elements = container.children(); //get the tags to sort
	var testIndex, //index of current tag being tested
		nextIndex, //index of the next tag to display
		nextKey, //the 'first' key (sorted alphabetically) of the remaining tags
		testKey; //the current key being tested
	while (elements.length) { //tags are removed from elements after being added until none are left
		nextKey = elements.eq(0).attr('key'); //assume the first element will be added
		nextIndex = 0;
		for (testIndex = 1; testIndex < elements.length; testIndex++) { //go over the remaining tags looking for one with a key that should come first
			testKey = elements.eq(testIndex).attr('key');
			if (testKey.toLowerCase() < nextKey.toLowerCase()) { //the comparison
				nextKey = testKey;
				nextIndex = testIndex;
			}
		}
		container.append(elements.splice(nextIndex, 1)); //append the chosen element to the container
	}
}
function initializeList(list) { //add ordering icons to a TAG_List's container
	var elements = list.children(), //the list of children
		element; //the element inside the child that has the mouseover handlers
	for (var i = 0; i < elements.length; i++) { //for each child
		//get the element that has the click handlers
		if (elements.eq(i).children('span').length) {
			element = elements.eq(i).children('span'); //if the child has a span, use it
			element.text(String(i) + ': ' + formatValue(element.parent().attr('value'), element.parent().children('img.type').attr('src'))); //display an index number if there is already a valuespan
		}
		else element = elements.eq(i).children('img.type'); //otherwise, use the type image
		element.off('mouseover', showUp).off('mouseover', showDown); //remove any past ordering icons
		if (i) element.mouseover(showUp); //if not the first element, add an up icon
		if (i != elements.length - 1) element.mouseover(showDown); //if not the last element, add a down icon
	}
}

function readChunk() { //get the full NBT data for a specific chunk
	var parent = $(this).parent(); //parent should be the li element
	var x = parent.attr('x');
	var z = parent.attr('z');
	if (!parent.children('ul').children().length) {
		mcaObject[x][z] = new NBTRead(mcaObject[x][z]).readComplete();
		parent.children('ul').append(renderJSON(mcaObject[x][z], undefined, true).addClass('shown'));
		parent.children('ul').children('li').children('ul').show();
	}
}