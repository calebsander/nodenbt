function showSearch() { //display the search panel
	$('div#search-panel').show();
}
function updateSearchResults() { //display new results
	var searchTerm = $(this).val();
	var searchOutput = $('div#search-output');
	searchOutput.children().remove(); //prepare for adding new results
	var allSpans = $('div#nbt li>span');
	var path, //the result of calling getPath() on matching spans
		breadcrumb, //the container for the breadcrumb information
		parent; //the parent of the span element
	allSpans.each(function(span) {
		allSpans[span] = $(allSpans[span]); //make it a jQuery object instead of a node
		if (allSpans[span].text().indexOf(searchTerm) != -1) {
			parent = allSpans[span].parent();
			path = getPath(parent);
			breadcrumb = $('<ol>').addClass('breadcrumb').click(function(parent) {
				return function() {
					showElement(parent);
				};
			}(parent));
			path.forEach(function(segment) {
				breadcrumb.append($('<li>').text(String(segment)));
			});
			searchOutput.append(breadcrumb);
		}
	});
}
function showElement(element) { //show all the parent elements to this element; called recursively
	if (!element.hasClass('shown')) { //once we get to a shown element, stop showing its parents
		$.proxy(toggleContainer, element.children('img.type'))();
		showElement(element.parent().parent()); //li -> ul.container -> li
	}
}