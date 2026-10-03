import Vector2D from "../math/vector2d.js";
import Vector3D from "../math/vector3d.js";

function bufferToSlice(buffer) {
	const data = dicomParser.parseDicom(new Uint8Array(buffer));

	const Rows = data.uint16("x00280010");
	const Columns = data.uint16("x00280011");
	const BitsAllocated = data.uint16("x00280100");
	const PixelRepresentation = data.uint16("x00280103");
	const SamplesPerPixel = data.uint16("x00280002") || 1;
	if (SamplesPerPixel !== 1) throw new Error("Pixel value is not grayscale.")
	const NumberOfFrames = parseInt(data.string("x00280008") || "1", 10);
	if (NumberOfFrames !== 1) throw new Error("Slice is multi layered.")
	const layerIndex = parseFloat(data.string("x00200032", 2)) || 0;
	const RescaleSlope = parseFloat(data.string("x00281053")) || 1;
	const RescaleIntercept = parseFloat(data.string("x00281052")) || 0;
	const [PixelSpacingRow, PixelSpacingColumn] = [parseFloat(data.string("x00280030", 0)) || 1, parseFloat(data.string("x00280030", 1)) || 1];
	const SliceThickness = data.string("x00180050") || 1;
	const Modality = data.string('x00080060');

	const pixelDataElement = data.elements.x7fe00010;
	if (!pixelDataElement) {
		throw new Error("No PixelData element found in this DICOM file.");
	}

	let rawPixels;
	if (BitsAllocated === 16) {
		rawPixels =
			PixelRepresentation === 1
			? new Int16Array(buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2)
			: new Uint16Array(buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
	} else if (BitsAllocated === 8) {
		rawPixels = new Uint8Array(buffer, pixelDataElement.dataOffset, pixelDataElement.length);
	} else {
		throw new Error(`Unsupported BitsAllocated: ${BitsAllocated}`);
	}

	const voxelCount = rawPixels.length;
	const floatData = new Float32Array(voxelCount);
	for (let i = 0; i < voxelCount; i++) {
		floatData[i] = rawPixels[i] * RescaleSlope + RescaleIntercept;
	}

	return {
		data: floatData,
		rows: Rows,
		depth: NumberOfFrames,
		columns: Columns,
		z: layerIndex,
		pixel_length: PixelSpacingRow,
		pixel_width: PixelSpacingColumn,
		pixel_height: SliceThickness,
		modality: Modality,
		slope: RescaleSlope,
		intercept: RescaleIntercept,
	};
}

function slicesToVolume(slices) {
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

	return {
		data: volume,
		size: new Vector3D(rows, columns, depth),
		dimensions: new Vector3D(slices[0].pixel_length * rows, slices[0].pixel_width * columns, slices[0].pixel_height * depth),
		range: new Vector2D(min, max),
		modality: slices[0].modality,
		intercept: slices[0].intercept,
		slope: slices[0].slope,
	};
}

export async function dicomToVolume(files) {
	const buffers = await Promise.all(Array.from(files).map((f) => f.arrayBuffer()));
	const slices = buffers.map(bufferToSlice).sort((a, b) => a.z - b.z);
	// const slices = buffers.map(bufferToSlice);
	const volume = slicesToVolume(slices);
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