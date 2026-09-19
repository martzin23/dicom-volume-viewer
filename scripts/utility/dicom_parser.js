/**
 * Parse a single DICOM file (as ArrayBuffer) into a Float32Array
 * of real-world pixel values, plus metadata needed to index it.
 */
export function parseDicomToFloat32(arrayBuffer) {
	const byteArray = new Uint8Array(arrayBuffer);
	const dataSet = dicomParser.parseDicom(byteArray);

	// --- Core image geometry tags ---
	const rows = dataSet.uint16("x00280010"); // Rows
	const columns = dataSet.uint16("x00280011"); // Columns
	const bitsAllocated = dataSet.uint16("x00280100"); // BitsAllocated
	const pixelRepresentation = dataSet.uint16("x00280103"); // 0 = unsigned, 1 = signed
	const samplesPerPixel = dataSet.uint16("x00280002") || 1;
	const numberOfFrames = parseInt(dataSet.string("x00280008") || "1", 10);

	// --- Rescale to real-world units (e.g. Hounsfield units for CT) ---
	const slope = parseFloat(dataSet.string("x00281053")) || 1; // RescaleSlope
	const intercept = parseFloat(dataSet.string("x00281052")) || 0; // RescaleIntercept

	// --- Raw pixel data element ---
	const pixelDataElement = dataSet.elements.x7fe00010;
	if (!pixelDataElement) {
		throw new Error("No PixelData element found in this DICOM file.");
	}

	// Get a typed view over the raw bytes according to bit depth/sign
	let rawPixels;
	if (bitsAllocated === 16) {
		rawPixels =
			pixelRepresentation === 1
				? new Int16Array(
					arrayBuffer,
					pixelDataElement.dataOffset,
					pixelDataElement.length / 2,
				)
				: new Uint16Array(
					arrayBuffer,
					pixelDataElement.dataOffset,
					pixelDataElement.length / 2,
				);
	} else if (bitsAllocated === 8) {
		rawPixels = new Uint8Array(
			arrayBuffer,
			pixelDataElement.dataOffset,
			pixelDataElement.length,
		);
	} else {
		throw new Error(`Unsupported BitsAllocated: ${bitsAllocated}`);
	}

	// Convert to Float32Array with rescale applied (real-world values)
	const voxelCount = rawPixels.length;
	const floatData = new Float32Array(voxelCount);
	for (let i = 0; i < voxelCount; i++) {
		floatData[i] = rawPixels[i] * slope + intercept;
	}

	return {
		data: floatData, // the indexable Float32Array
		rows,
		columns,
		numberOfFrames,
		samplesPerPixel,
		slope,
		intercept,

		// --- Indexing helpers ---
		// 2D: get value at (x, y) in a single-frame image
		getPixel(x, y) {
			return this.data[y * this.columns + x];
		},
		// 3D: get value at (x, y, z) in a multi-frame volume
		// (assumes frames are stored contiguously, one after another)
		getVoxel(x, y, z) {
			const frameSize = this.rows * this.columns;
			return this.data[z * frameSize + y * this.columns + x];
		},
	};
}

/**
 * Build a full 3D Float32Array volume from an array of single-slice
 * DICOM files (the common case: one file per slice, ordered by
 * ImagePositionPatient or InstanceNumber before calling this).
 */
export function buildVolumeFromSlices(sliceArrayBuffers) {
	const slices = sliceArrayBuffers.map(parseDicomToFloat32);
	const { rows, columns } = slices[0];
	const depth = slices.length;
	const volume = new Float32Array(rows * columns * depth);

	slices.forEach((slice, z) => {
		volume.set(slice.data, z * rows * columns);
	});

	return {
		data: volume,
		rows,
		columns,
		depth,
		getVoxel(x, y, z) {
			return this.data[z * this.rows * this.columns + y * this.columns + x];
		},
	};
}

async function sortFilesByPosition(fileList) {
	const withMeta = await Promise.all(
		Array.from(fileList).map(async (file) => {
			const buffer = await file.arrayBuffer();
			const dataSet = dicomParser.parseDicom(new Uint8Array(buffer));
			const position = dataSet.string("x00200032");
			const z = position ? parseFloat(position.split("\\")[2]) : 0;
			return { file, z };
		}),
	);

	return withMeta.sort((a, b) => a.z - b.z).map((item) => item.file);
}

// ---- Example usage for a full volume from multiple files ----
export async function loadVolumeExample(fileList) {
	fileList = await sortFilesByPosition(fileList);
	// Sort files by name/instance number first if needed!
	const buffers = await Promise.all(
		Array.from(fileList).map((f) => f.arrayBuffer()),
	);
	const volume = buildVolumeFromSlices(buffers);
	return volume;
}

// Export for module usage
// if (typeof module !== "undefined") {
//   module.exports = { parseDicomToFloat32, buildVolumeFromSlices, loadVolumeExample };
// }
