function showSearch() { //display the search panel
	searchTitle.append(escHelp); //add help text
	searchPanel.show();
	searchInput.focus(); //focus on the search input field
}
function updateSearchResults() { //display new results
	var searchTerm = $(this).val().toLowerCase(); //so it is case-insensitive
	searchOutput.children().remove(); //prepare for adding new results
	var allSpans = $('div#nbt li>span');
	var path, //the result of calling getPath() on matching spans
		breadcrumb, //the container for the breadcrumb information
		parent; //the parent of the span element
	allSpans.each(function(span) {
		allSpans[span] = $(allSpans[span]); //make it a jQuery object instead of a node
		if (allSpans[span].text().toLowerCase().indexOf(searchTerm) != -1) { //if the valuespan has the text in it
			parent = allSpans[span].parent();
			path = getPath(parent);
			breadcrumb = $('<ol>').addClass('breadcrumb').click(function(parent) {
				return function() { //wrapped so that it will work even when the value of parent is changed
					$('span.highlight').removeClass('highlight'); //stop highlighting any other spans
					showElement(parent, true); //open all the parents to that element
					parent.children('span').addClass('highlight'); //highlight this span
					parent.get(0).scrollIntoView(); //make sure it is on the page
				};
			}(parent));
			path.forEach(function(segment) { //add each element of the path to the breadcrumb
				breadcrumb.append($('<li>').text(String(segment)));
			});
			searchOutput.append(breadcrumb); //add to the results list
		}
	});
}
function showElement(element, skip) { //show all the parent elements to this element (will skip the most-nested one); called recursively
	if (!(element.hasClass('shown') || skip)) $.proxy(toggleContainer, element.children('img.type'))(); //call toggleContainer on a child of the li to show this tag if hidden
	var nextParent = element.parent().parent(); //li -> ul.container -> li
	if (nextParent.is('li')) showElement(nextParent); //stop once reaching the top of the display chain
}
function closeSearch() { //close the search panel and reset the input
	searchPanel.hide();
	searchInput.val('');
	searchOutput.children().remove(); //prepare for adding new results
}