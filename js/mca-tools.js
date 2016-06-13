var BLOCKS_PER_REGION = 512; //32 chunks/region * 16 blocks/chunk
var BITS_BLOCKS_PER_REGION = Math.log2(BLOCKS_PER_REGION);
var BITMASK_BLOCKS_PER_REGION = BLOCKS_PER_REGION - 1;
var BLOCKS_PER_CHUNK = 16;
var BITS_BLOCKS_PER_CHUNK = Math.log2(BLOCKS_PER_CHUNK);
function displayRegionName() { //display the name of the region file that contains the specified coordinates
	const xCoord = Number(liXInput.val()), zCoord = Number(liZInput.val());
	if (!(isNaN(xCoord) || isNaN(zCoord))) {
		fileNameOutput.text('r.' + String(xCoord >> BITS_BLOCKS_PER_REGION) + '.' + String(zCoord >> BITS_BLOCKS_PER_REGION) + '.mca');
		chunkOutput.text('Chunk ' + String((xCoord & BITMASK_BLOCKS_PER_REGION) >> BITS_BLOCKS_PER_CHUNK) + ', ' + String((zCoord & BITMASK_BLOCKS_PER_REGION) >> BITS_BLOCKS_PER_CHUNK));
	}
}