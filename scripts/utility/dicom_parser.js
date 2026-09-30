
function parseDicomToFloat32(arrayBuffer) {
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

	let rawPixels;
	if (bitsAllocated === 16) {
		rawPixels =
			pixelRepresentation === 1
				? new Int16Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length / 2)
				: new Uint16Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
	} else if (bitsAllocated === 8) {
		rawPixels = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length);
	} else {
		throw new Error(`Unsupported BitsAllocated: ${bitsAllocated}`);
	}

	const voxelCount = rawPixels.length;
	const floatData = new Float32Array(voxelCount);
	for (let i = 0; i < voxelCount; i++) {
		floatData[i] = rawPixels[i] * slope + intercept;
	}

	return {
		data: floatData,
		rows,
		columns,
		numberOfFrames,
		samplesPerPixel,
		slope,
		intercept,
		getPixel(x, y) {
			return this.data[y * this.columns + x];
		},
		getVoxel(x, y, z) {
			const frameSize = this.rows * this.columns;
			return this.data[z * frameSize + y * this.columns + x];
		},
	};
}

function buildVolumeFromSlices(sliceArrayBuffers) {
	const slices = sliceArrayBuffers.map(parseDicomToFloat32);
	const { rows, columns } = slices[0];
	const depth = slices.length;
	const volume = new Float32Array(rows * columns * depth);

	slices.forEach((slice, z) => {
		volume.set(slice.data, z * rows * columns);
	});

	let min = Infinity;
	let max = -Infinity;
	for (let x = 0; x < rows * columns * depth; x++) {
		let value = volume[x];
		min = Math.min(min, value);
		max = Math.max(max, value);
	}
	console.log(min, max);

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

export async function dicomToVolume(fileList) {
	fileList = await sortFilesByPosition(fileList);
	const buffers = await Promise.all(Array.from(fileList).map((f) => f.arrayBuffer()));
	const volume = buildVolumeFromSlices(buffers);
	return volume;
}

function stripExtension(segment) {
	const idx = segment.lastIndexOf(".");
	return idx > 0 ? segment.slice(0, idx) : segment;
}

/**
 * Checks whether the last segments of `fullPath` match the segments
 * of `suffixPath`, split on '/'. Segment-aware (won't false-positive
 * on coincidental trailing digits like "10001" matching "0001"), and
 * extension-agnostic on the final filename segment.
 */
function pathEndsWithSegments(fullPath, suffixPath) {
	const fullSegments = fullPath.split("/").filter(Boolean);
	const suffixSegments = suffixPath.split("/").filter(Boolean);
	if (suffixSegments.length > fullSegments.length) return false;
	const tail = fullSegments.slice(-suffixSegments.length);
	return tail.every((seg, i) => {
		const isLast = i === suffixSegments.length - 1;
		return isLast
			? stripExtension(seg) === stripExtension(suffixSegments[i])
			: seg === suffixSegments[i];
	});
}

export async function buildVolumeFromDicomDir(dicomdirFile, allFiles) {
	const dicomdirBuffer = await dicomdirFile.arrayBuffer();
	const dicomdirDataSet = dicomParser.parseDicom(new Uint8Array(dicomdirBuffer));

	const directoryRecordSequence = dicomdirDataSet.elements.x00041220;
	if (!directoryRecordSequence || !directoryRecordSequence.items) {
		throw new Error("No directory records found in this DICOMDIR file.");
	}

	const imageRecords = [];
	for (const item of directoryRecordSequence.items) {
		const record = item.dataSet;
		const recordType = record.string("x00041430"); // DirectoryRecordType
		if (recordType !== "IMAGE") continue;

		const referencedFileId = record.string("x00041500"); // backslash-separated path
		const instanceNumber = parseInt(record.string("x00200013") || "0", 10);
		if (referencedFileId) {
			imageRecords.push({
				path: referencedFileId.split("\\").join("/"),
				instanceNumber,
			});
		}
	}

	if (imageRecords.length === 0) {
		throw new Error("DICOMDIR contained no IMAGE records.");
	}

	const filesByPath = new Map();
	for (const file of allFiles) {
		const relativePath = (file.webkitRelativePath || file.name).toUpperCase();
		filesByPath.set(relativePath, file);
	}

	const matchedFiles = imageRecords
		.map((record) => {
			const suffix = record.path.toUpperCase();
			const candidates = [...filesByPath.entries()].filter(([path]) =>
				pathEndsWithSegments(path, suffix),
			);

			if (candidates.length === 0) {
				console.warn(`Could not resolve DICOMDIR reference to a file: "${record.path}"`);
				return null;
			}
			if (candidates.length > 1) {
				console.warn(
					`Ambiguous match for "${record.path}" — ${candidates.length} files matched, using the first: ${candidates[0][0]}`,
				);
			}
			return { file: candidates[0][1], instanceNumber: record.instanceNumber, refPath: record.path };
		})
		.filter(Boolean);

	if (matchedFiles.length === 0) {
		console.error("Sample DICOMDIR references:", imageRecords.slice(0, 3).map((r) => r.path));
		console.error("Sample available file paths:", [...filesByPath.keys()].slice(0, 3));
		throw new Error("None of the DICOMDIR file references matched the selected files.");
	}

	matchedFiles.sort((a, b) => a.instanceNumber - b.instanceNumber);

	const buffers = [];
	for (const m of matchedFiles) {
		try {
			buffers.push(await m.file.arrayBuffer());
		} catch (err) {
			throw new Error(`Failed to read file for reference "${m.refPath}" (${m.file.name}): ${err.message}`);
		}
	}

	// Parse each slice individually so a bad match points at the exact
	// file/record responsible, instead of a bare RangeError.
	const slices = [];
	for (let i = 0; i < buffers.length; i++) {
		try {
			slices.push(parseDicomToFloat32(buffers[i]));
		} catch (err) {
			throw new Error(
				`Failed parsing slice ${i} — reference "${matchedFiles[i].refPath}", resolved file "${matchedFiles[i].file.webkitRelativePath || matchedFiles[i].file.name}": ${err.message}`,
			);
		}
	}

	const { rows, columns } = slices[0];
	const depth = slices.length;
	const volume = new Float32Array(rows * columns * depth);
	slices.forEach((slice, z) => volume.set(slice.data, z * rows * columns));

	console.log(`Volume built from DICOMDIR: ${columns} x ${rows} x ${depth} (${matchedFiles.length} slices)`);

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

export async function dicomdirToVolume(files) {
	const allFiles = Array.from(files);
	const dicomdirFile = allFiles.find((f) => f.name.toUpperCase() === "DICOMDIR");

	if (!dicomdirFile) {
		console.error("No DICOMDIR file found in the selected folder.");
		return;
	}

	try {
		const volume = await buildVolumeFromDicomDir(dicomdirFile, allFiles);
		return volume;
	} catch (err) {
		console.error("Failed to build volume from DICOMDIR:", err);
	}
}