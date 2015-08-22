function deleter() { //delete the tag where the delete icon was clicked
	var parent = $(this).parent(); //see edit()
	$.ajax({ //see save()
		'url': '/editnbt/delete',
		'type': 'POST',
		'data': JSON.stringify({'path': getpath(parent)}),
		'dataType': 'json',
		'success': editsuccess,
		'error': editerror
	});
	modified = true;
	if (parent.is(savetag) || parent.find(savetag).length) closeall(); //if we deleted a tag that was being edited, close the edit windows
	var ulcontainer = parent.parent();
	parent.remove(); //delete the tag
	if (ulcontainer.parent().children('img.type').attr('src') != images.TAG_Compound) addudicons(ulcontainer); //if on a list/array, redo the ordering icons
	remakeimages();
}
var deleteimg = $('<img>').addClass('delete').attr('src', images['delete']).attr('title', 'Delete tag');
function showdelete() { //see showedit()
	if (!$(this).parent().children('img.delete').is(deleteimg)) $(this).after(deleteimg);
}