function deleter() { //delete the tag where the delete icon was clicked
	var parent = $(this).parent(); //see edit()
	$.ajax({ //see save()
		'url': '/editnbt/delete',
		'type': 'POST',
		'data': JSON.stringify({'path': getPath(parent)}),
		'dataType': 'json',
		'success': editSuccess,
		'error': editError
	});
	modified = true;
	if (parent.is(saveTag) || parent.find(saveTag).length) closeAll(); //if we deleted a tag that was being edited, close the edit windows
	var ulContainer = parent.parent();
	parent.remove(); //delete the tag
	if (ulContainer.parent().children('img.type').attr('src') != IMAGES.TAG_Compound) initializeList(ulContainer); //if on a list, redo the ordering icons
	remakeImages();
}
var deleteImg = $('<img>').addClass('delete').attr('src', IMAGES.delete).attr('title', 'Delete tag');
function showDelete() { //see showedit()
	if (!$(this).parent().children('img.delete').is(deleteImg)) $(this).after(deleteImg);
}