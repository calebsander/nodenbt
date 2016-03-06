function download() {
	switch (type) {
		case DAT:
			var written = new NBTWrite();
			written.writeComplete(nbtObject);
			var toDownload = written.getBuffer().rawBuffer();
			if (gzip) toDownload = jz.gz.compress(toDownload).buffer;
			saveAs(new Blob([toDownload], {type: 'application/octet-stream'}), fileName);
			break;
		case MCA:
			var chunks = [];
			var tempWrite; //temporary nbt.Write instance
			var x, z;
			for (x in mcaObject) {
				if (chunks[x] === undefined) chunks[x] = [];
				for (z in mcaObject[x]) {
					if (mcaObject[x][z] instanceof Buffer) chunks[x][z] = mcaObject[x][z];
					else {
						tempWrite = new NBTWrite();
						tempWrite.writeComplete(mcaObject[x][z]);
						chunks[x][z] = tempWrite.getBuffer();
					}
				}
			}
			var written = new MCAWrite();
			written.setAllChunks(chunks);
			saveAs(new Blob([written.getBuffer().rawBuffer()], {type: 'application/octet-stream'}), fileName);
			break;
		default:
			alert('You need to upload a file first');
	}
}