function up() { //move an element in a list up
	var parent = $(this).parent(); //see edit()
	$.ajax({ //see save()
		'url': '/editnbt/up',
		'type': 'POST',
		'data': JSON.stringify({'path': getpath(parent)}),
		'dataType': 'json',
		'success': editsuccess,
		'error': editerror
	});
	modified = true;
	var prev = parent.prev(); //find previous sibling before detaching the element
	parent.detach(); //remove the element but keep its mouseover handlers
	prev.before(parent); //put the element before its previous sibling
	initializeList(parent.parent()); //add new ordering icons
	removeicons(); //remove all the old icons that may no longer be applicable from new ordering
	parent.children('img.type').mouseover(); //reshow the icons so the user can see which element they were reordering
	parent.children('span').mouseover(); //reshow the icons so the user can see which element they were reordering
}
function down() { //move an element in a list down; see up()
	var parent = $(this).parent();
	$.ajax({ //see save()
		'url': '/editnbt/down',
		'type': 'POST',
		'data': JSON.stringify({'path': getpath(parent)}),
		'dataType': 'json',
		'success': editsuccess,
		'error': editerror
	});
	modified = true;
	var next = parent.next();
	parent.detach();
	next.after(parent);
	initializeList(parent.parent());
	removeicons();
	parent.children('img.type').mouseover();
	parent.children('span').mouseover();
}
var upimg = $('<img>').addClass('up').attr('src', images.up).attr('title', 'Move up');
function showup() { //see showedit()
	if (!$(this).parent().children('img.up').is(upimg)) $(this).after(upimg);
}
var downimg = $('<img>').addClass('down').attr('src', images.down).attr('title', 'Move down');
function showdown() { //see showedit()
	if (!$(this).parent().children('img.down').is(downimg)) $(this).after(downimg);
}