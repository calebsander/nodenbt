function displayRegionName() { //display the name of the region file that contains the specified coordinates
	const xCoord = Number($('li#li-x>div>input').val()), zCoord = Number($('li#li-z>div>input').val());
	if (!(isNaN(xCoord) || isNaN(zCoord))) $('li#filename').text('r.' + String(Math.floor(xCoord / 512)) + '.' + String(Math.floor(zCoord / 512)) + '.mca');
}