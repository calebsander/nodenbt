function deleter() { //delete the tag where the delete icon was clicked
	var parent = $(this).parent(); //see edit()
	const path = getPath(parent);
	const tag = path.pop(); //see code for up
	const deleteParent = walkPath(path);
	switch (deleteParent.type) { //remove the tag (different types of parents require different fashions of locating the child)
		case TAG_List:
			deleteParent.value.list.splice(tag, 1);
			break;
		case TAG_Compound:
			delete deleteParent.value[tag];
	}
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