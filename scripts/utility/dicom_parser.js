import Vector2D from "../math/vector2d.js";
import Vector3D from "../math/vector3d.js";

function bufferToSlice(buffer) {
	const data = dicomParser.parseDicom(new Uint8Array(buffer));

	const Rows = data.uint16("x00280010");
	const Columns = data.uint16("x00280011");
	const BitsAllocated = data.uint16("x00280100");
	const PixelRepresentation = data.uint16("x00280103");
	const SamplesPerPixel = data.uint16("x00280002") || 1;
	if (SamplesPerPixel !== 1) throw new Error("Unsupported format: Pixel values are not grayscale.")
	const NumberOfFrames = parseInt(data.string("x00280008") || "1", 10);
	if (NumberOfFrames !== 1) throw new Error("Unsupported format: File contains a multi layered slice.")
	const layerIndex = parseFloat(data.string("x00200032", 2)) || 0;
	const RescaleSlope = parseFloat(data.string("x00281053")) || 1;
	const RescaleIntercept = parseFloat(data.string("x00281052")) || 0;
	const [PixelSpacingRow, PixelSpacingColumn] = [parseFloat(data.string("x00280030", 0)) || 1, parseFloat(data.string("x00280030", 1)) || 1];
	const SliceThickness = data.string("x00180050") || 1;
	const Modality = data.string('x00080060');

	const PixelData = data.elements.x7fe00010;
	if (!PixelData) {
		throw new Error("Unsupported format: No PixelData element found.");
	}

	let rawPixels;
	if (BitsAllocated === 16) {
		rawPixels =
			PixelRepresentation === 1
				? new Int16Array(buffer, PixelData.dataOffset, PixelData.length / 2)
				: new Uint16Array(buffer, PixelData.dataOffset, PixelData.length / 2);
	} else if (BitsAllocated === 8) {
		rawPixels = new Uint8Array(buffer, PixelData.dataOffset, PixelData.length);
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
		columns: Columns,
		depth: NumberOfFrames,
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

export async function dicomToVolume(files, size_limit) {
	const buffers = await Promise.all(Array.from(files).map((f) => f.arrayBuffer()));
	const slices = buffers.map(bufferToSlice).sort((a, b) => a.z - b.z).map((slice) => {return rescaleSlice(slice, size_limit)});
	const volume = slicesToVolume(slices);
	return volume;
}

export function rescaleSlice(slice, size_limit, channels = 1) {
	const width = slice.columns;
	const height = slice.rows;
	const scale = Math.min(1, size_limit / Math.max(width, height));
	if (scale === 1) return slice

	const nw = Math.max(1, Math.floor(width * scale));
	const nh = Math.max(1, Math.floor(height * scale));
	const dst = new Float32Array(nw * nh * channels);

	for (let y = 0; y < nh; y++) {
		const sy = Math.min(Math.max((y + 0.5) * height / nh - 0.5, 0), height - 1);
		const y0 = Math.floor(sy);
		const y1 = Math.min(y0 + 1, height - 1);
		const fy = sy - y0;

		for (let x = 0; x < nw; x++) {
			const sx = Math.min(Math.max((x + 0.5) * width / nw - 0.5, 0), width - 1);
			const x0 = Math.floor(sx);
			const x1 = Math.min(x0 + 1, width - 1);
			const fx = sx - x0;

			for (let c = 0; c < channels; c++) {
				const v00 = slice.data[(y0 * width + x0) * channels + c];
				const v10 = slice.data[(y0 * width + x1) * channels + c];
				const v01 = slice.data[(y1 * width + x0) * channels + c];
				const v11 = slice.data[(y1 * width + x1) * channels + c];
				const top = v00 + (v10 - v00) * fx;
				const bottom = v01 + (v11 - v01) * fx;
				dst[(y * nw + x) * channels + c] = top + (bottom - top) * fy;
			}
		}
	}

	slice.data = dst;
	slice.rows = nw;
	slice.columns = nh;
	return slice;
}