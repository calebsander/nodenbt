/*
	JAVASCRIPT OBJECT REPRESENTATION OF A REGION

	The region file stores an area that encompasses 32x32 chunks.
	Each chunk may or may not exist in that area.
	When accessing chunks by X and Z index, they will be converted to region-relative chunk indices.
	Since Read is oblivious to the location of the region, make sure you use the correct region file.

	TIMESTAMP
	Each chunk has a 32-bit unsigned integer representing its last modification time.
	Since this is not especially useful, it is not included in the result of getChunkData().
	The timestamp can be accessed for an individual chunk with getChunkTimestamp.

	CHUNK DATA FORMAT
	The chunks will be stored in a two-dimensional array.
	Access an individual chunk using getChunkData()[x][z] where x and z are region-relative chunk indices.
	The chunk data will either be undefined, indicating that the chunk doesn't exist, or a Buffer of uncompressed NBT data.
	Use code like nbt.js to process the NBT data.
*/

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
	return this.buffer.readUInt32BE(SECTOR_LENGTH + calculateChunkOffset(x, z));
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
			catch (error) {
				if (error.message != CHUNK_DOESNT_EXIST) throw error;
			}
		}
	}
	return result;
};

function Write() {
	this.buffer = new Buffer(SECTOR_LENGTH * 2);
	this.buffer.fill(0x00); //put empty locations and timestamps so it will always be a valid file
}
//Set the timestamp value for the specified chunk
Write.prototype.setChunkTimestamp = function(x, z, timestamp) {
	this.buffer.writeUInt32BE(timestamp, SECTOR_LENGTH + calculateChunkOffset(x, z));
};
//Set the index in the file of the sector containing the specified chunk and its length in sectors
Write.prototype.setChunkLocation = function(x, z, sector, length) {
	const offset = calculateChunkOffset(x, z);
	this.buffer.writeUInt16BE(sector >> 8, offset);
	this.buffer.writeUInt8(sector % 256, offset + 2);
	this.buffer.writeUInt8(length, offset + 3);
};
//Write all the chunk data (see format above)
Write.prototype.setAllChunks = function(data) {
	if (this.buffer.length != SECTOR_LENGTH * 2) this.buffer = new Write().getBuffer(); //make sure no chunks are already stored
	var compressedChunk; //a Buffer containing the compressed chunk data
	var chunkLength; //length in bytes of the chunk data and compression scheme byte
	var length, sectorLength; //length in (bytes, sectors) of the chunk data and metadata
	var chunkBuffer; //buffer of compressed chunk data to append
	for (var x = 0, z; x < 32; x++) { //iterate over every chunk
		for (z = 0; z < 32; z++) {
			if (data[x][z]) { //if chunk doesn't exist, no need to do anything since location is already set to 0x00
				compressedChunk = zlib.deflateSync(data[x][z]); //compress the raw data
				chunkLength = compressedChunk.length + 1; //length of chunk data + compression scheme byte
				length = chunkLength + 4; //length of length int + compression byte + chunk data
				sectorLength = Math.ceil(length / SECTOR_LENGTH); //all data must fit in a full number of sectors
				chunkBuffer = new Buffer(SECTOR_LENGTH * sectorLength); //make a Buffer to store the data and padding so it has no partial sectors
				chunkBuffer.writeUInt32BE(chunkLength, 0); //4 bytes of length information
				chunkBuffer.writeUInt8(ZLIB_COMPRESSION, 4); //1 byte of compression scheme
				compressedChunk.copy(chunkBuffer, 5); //copy the data into the chunkBuffer
				chunkBuffer.fill(0x00, length); //pad the rest to make it a full sector
				this.setChunkLocation(x, z, this.buffer.length / SECTOR_LENGTH, sectorLength); //record the location of the chunk data
				this.buffer = Buffer.concat([this.buffer, chunkBuffer]); //append onto the main file buffer
			}
		}
	}
};
Write.prototype.getBuffer = function() {
	return this.buffer;
};

module.exports = {
	Read: Read,
	Write: Write
};