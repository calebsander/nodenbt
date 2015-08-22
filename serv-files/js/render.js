function togglecontainer() { //triggered when clicking on a Byte_Array, Int_Array, List, or Compound's images - shows its children
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

function newcontainer() { //returns a new container that can have subtags added to it
	return $('<ul>').addClass('nbtcontainer').hide();
}
function settypeattr(img, type) { //changes the src and title attributes of an img.type element to match a certain type
	return img.attr('src', images[type]).attr('title', type || TAG_End);
}
function createtypeimg(type) { //create a new type image of a certain type
	return settypeattr($('<img>').addClass('type'), type);
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
	var typeimg = createtypeimg(data.type); //image that indicates type
	var valuespan = $('<span>'); //span that contains the value (with a possible key prefix)

	var valuestring; //value of span text without the key
	if (typeof(data.value) != 'object') { //for primitive types, calculate the display value
		valuestring = String(data.value);
		display.attr('value', data.value);
	}
	else valuestring = ''; //for complicated types (with subtags), don't display a value

	var mousetarget; //target for mouseover handlers (only applicable when there are subtags (so valuestring == ''))
	if (key === undefined) mousetarget = typeimg; //if no key, then valuespan will be empty, so use the image
	else {
		mousetarget = valuespan; //if a key, then target the span
		valuespan.mouseover(showrename); //make the tag renamable
	}

	var container; //will contain subtags if there are any

	if ([TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double].indexOf(data.type) != -1) { //numerical types should be treated the same
		valuespan.mouseover(removeicons);
		if (key !== undefined) valuespan.mouseover(showcoerce);
		valuespan.mouseover(showdelete).mouseover(showedit);
	}
	else if ([TAG_Byte_Array, TAG_Int_Array].indexOf(data.type) != -1) {
		display.attr('value', String(data.value));
		mousetarget.mouseover(removeicons)
		if (key !== undefined) mousetarget.mouseover(showcoerce);
		valuespan.mouseover(showdelete).mouseover(showedit);
	}
	else if (data.type == TAG_String) {
		valuestring = '"' + valuestring + '"'; //add quotes around the value
		valuespan.mouseover(removeicons);
		if (key !== undefined) valuespan.mouseover(showcoerce);
		valuespan.mouseover(showdelete).mouseover(showedit);
	}
	else if (data.type == TAG_List) { //very similar to TAG_Byte_Array and TAG_Int_Array except getting type information is different and coercibility is calculated differently
		display.attr('type', String(data.value.type)); //store the type information in the tag
		container = newcontainer();
		for (var i = 0; i < data.value.list.length; i++) { //add each of the subtags
			container.append(renderJSON({
				'type': data.value.type,
				'value': data.value.list[i]
			}));
		}
		initializeList(container);
		mousetarget.mouseover(removeicons).mouseover(showcoerce).mouseover(showadd).mouseover(showdelete);
	}
	else if (data.type == TAG_Compound) {
		container = newcontainer();
		for (var i in data.value) container.append(renderJSON(data.value[i], i)); //add each of the subtags
		sortkeys(container); //order the tags alphabetically
		mousetarget.mouseover(removeicons).mouseover(showadd);
		if (!root) mousetarget.mouseover(showdelete);
	}
	else throw new Error('No such tag: ' + data.type); //should never trigger, but if it did, it would mess up everything, so better to just quit

	var valuetext; //the text to assign to valuespan
	if (key === undefined) valuetext = valuestring;
	else { //if there is a key
		display.attr('key', key); //store the key information in the tag
		valuetext = key + ': ' + valuestring; //add key prefix
	}
	display.append(typeimg); //add type image
	if (data.type == TAG_List) display.append(createtypeimg(data.value.type).addClass('subtype'));
	if (valuetext) { //don't bother using valuespan unless it would have any text
		valuespan.text(valuetext);
		display.append(valuespan); //add type span
	}
	if (container) { //if there are subtags
		typeimg.click(togglecontainer); //make clicking the image show/hide subtags
		display.append(container);
	}
	return display; //return the new element
}
function renderMCA(data) { //like renderJSON, but for the response on an MCA/MCR upload - shows which chunks are available
	var shownchunks = $('<ul>');
	var display, typeimg, valuespan, container; //see renderJSON
	var x, z;
	for (x in data) {
		for (z in data[x]) {
			if (data[x][z]) {
				display = $('<li>').attr('x', x).attr('z', z); //the main element
				typeimg = createtypeimg('chunk').click(fetch).click(togglecontainer); //image that indicates type
				valuespan = $('<span>').text('[' + String(x) + ', ' + String(z) + ']'); //span that contains the value (with a possible key prefix)
				container = newcontainer();
				shownchunks.append(display.append(typeimg).append(valuespan).append(container));
			}
		}
	}
	return shownchunks;
}
function sortkeys(container) { //does an insertion sort on the elements in a compound by key
	var elements = container.children(); //get the tags to sort
	var testindex, //index of current tag being tested
		nextindex, //index of the next tag to display
		nextkey, //the 'first' key (sorted alphabetically) of the remaining tags
		testkey; //the current key being tested
	while (elements.length) { //tags are removed from elements after being added until none are left
		nextkey = elements.eq(0).attr('key'); //assume the first element will be added
		nextindex = 0;
		for (testindex = 1; testindex < elements.length; testindex++) { //go over the remaining tags looking for one with a key that should come first
			testkey = elements.eq(testindex).attr('key');
			if (testkey.toLowerCase() < nextkey.toLowerCase()) { //the comparison
				nextkey = testkey;
				nextindex = testindex;
			}
		}
		container.append(elements.splice(nextindex, 1)); //append the chosen element to the container
	}
}
function initializeList(list) { //add ordering icons to a TAG_List's container
	var elements = list.children(), element, j; //elements is the list of children, element is the element inside the child that has the mouseover handlers
	for (var i = 0; i < elements.length; i++) { //for each child
		//get the element that has the click handlers
		if (elements.eq(i).children('span').length) element = elements.eq(i).children('span'); //if the child has a span, use it
		else element = elements.eq(i).children('img.type'); //otherwise, use the type image
		element.off('mouseover', showup).off('mouseover', showdown); //remove any past ordering icons
		if (i) element.mouseover(showup); //if not the first element, add an up icon
		if (i != elements.length - 1) element.mouseover(showdown); //if not the last element, add a down icon
	}
}

function fetch() { //get the full NBT data for a specific chunk
	var parent = $(this).parent(); //parent should be the li element
	if (!parent.children('ul').children().length) {
		$.ajax({
			'url': '/chunk/' + parent.attr('x') + '/' + parent.attr('z'),
			'type': 'GET',
			'dataType': 'json',
			'success': function(response) {
				parent.children('ul').children().remove();
				parent.children('ul').append(renderJSON(response.data, undefined, true).addClass('shown'));
				parent.children('ul').show().children('li').children('ul').show();
			}
		});
	}
}