const zlib = require('zlib');

const SECTOR_LENGTH = 4096;
const GZIP_COMPRESSION = 1;
const ZLIB_COMPRESSION = 2;
const CHUNK_DOESNT_EXIST = 'Chunk doesn\'t exist';

function Read(buffer) {
	this.buffer = buffer;
}
//Get location in locations or timestamps sector of the start of the specified chunk's data
function calculateChunkOffset(x, z) {
	return 4 * ((x & 31) + (z & 31) * 32);
}
//Get the index in the file of the sector containing the specified chunk and its length in sectors
Read.prototype.getChunkLocation = function(x, z) {
	const offset = calculateChunkOffset(x, z);
	return (this.buffer.readUInt16BE(offset) << 8) + this.buffer.readUInt8(offset + 2);
};
//Returns whether a chunk exists
Read.prototype.chunkExists = function(x, z) {
	return !!this.getChunkLocation(x, z);
};
//Get the timestamp value for the specified chunk
Read.prototype.getChunkTimestamp = function(x, z) {
	return readUInt32BE(calculateChunkOffset(x, z) + SECTOR_LENGTH);
};
//Get the uncompressed NBT data for the specified chunk
Read.prototype.getChunkData = function(x, z) {
	if (!this.chunkExists(x, z)) throw new Error(CHUNK_DOESNT_EXIST);
	const offset = this.getChunkLocation(x, z) * SECTOR_LENGTH;
	const chunkLength = this.buffer.readUInt32BE(offset);
	const compressionScheme = this.buffer.readUInt8(offset + 4); //offset + 4 is the of the compression scheme byte
	const compressedChunk = this.buffer.slice(offset + 5, offset + 4 + chunkLength); //offset + 5 is the start of the chunk data, and the length of the chunk == (chunkLength - length of compression scheme byte)
	switch (compressionScheme) {
		case GZIP_COMPRESSION:
			return zlib.gunzipSync(compressedChunk);
		case ZLIB_COMPRESSION:
			return zlib.inflateSync(compressedChunk);
		default:
			throw new Error('Unknown compression scheme: ' + String(compressionScheme));
	}
};
//Read the entire region into chunks
Read.prototype.getAllChunks = function() {
	var result = [];
	for (var x = 0, z; x < 32; x++) {
		result[x] = [];
		for (z = 0; z < 32; z++) {
			try {
				result[x][z] = this.getChunkData(x, z);
			}
			catch (err) {
				if (err.message != CHUNK_DOESNT_EXIST) throw err;
			}
		}
	}
	return result;
};

module.exports = {
	Read: Read
};