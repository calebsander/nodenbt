function up() { //move an element in a list up
	var parent = $(this).parent(); //see edit()
	$.ajax({ //see save()
		'url': '/editnbt/up',
		'type': 'POST',
		'data': JSON.stringify({'path': getPath(parent)}),
		'dataType': 'json',
		'success': editSuccess,
		'error': editError
	});
	modified = true;
	var prev = parent.prev(); //find previous sibling before detaching the element
	parent.detach(); //remove the element but keep its mouseover handlers
	prev.before(parent); //put the element before its previous sibling
	initializeList(parent.parent()); //add new ordering icons
	removeIcons(); //remove all the old icons that may no longer be applicable from new ordering
	parent.children('img.type').mouseover(); //reshow the icons so the user can see which element they were reordering
	parent.children('span').mouseover(); //reshow the icons so the user can see which element they were reordering
}
function down() { //move an element in a list down; see up()
	var parent = $(this).parent();
	$.ajax({ //see save()
		'url': '/editnbt/down',
		'type': 'POST',
		'data': JSON.stringify({'path': getPath(parent)}),
		'dataType': 'json',
		'success': editSuccess,
		'error': editError
	});
	modified = true;
	var next = parent.next();
	parent.detach();
	next.after(parent);
	initializeList(parent.parent());
	removeIcons();
	parent.children('img.type').mouseover();
	parent.children('span').mouseover();
}
var upImg = $('<img>').addClass('up').attr('src', IMAGES.up).attr('title', 'Move up');
function showUp() { //see showedit()
	if (!$(this).parent().children('img.up').is(upImg)) $(this).after(upImg);
}
var downImg = $('<img>').addClass('down').attr('src', IMAGES.down).attr('title', 'Move down');
function showDown() { //see showedit()
	if (!$(this).parent().children('img.down').is(downImg)) $(this).after(downImg);
}