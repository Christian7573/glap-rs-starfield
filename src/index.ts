import { RandomContainer, RandomAreaPoint } from "./random";
import seedrandom from "seedrandom";
export { default as SvgRenderer } from "./svg";

type MyRandom = seedrandom.prng;

enum ObjKind {
	Square,
	Triangle,
	WackTriangle,
	NebulaCloud,
}

type OutputFunc = (kind: ObjKind, x: number, y: number, rot: number, size: number, color: number) => void;

export function populate_with_randomly(rng: MyRandom, kinds: ObjKind[], count: [number, number], sizes: [number, number], colors: number[], max_pos: number, output: OutputFunc) {
	const objects = ((count[1] - count[0]) * rng()) + count[0];
	for (let _i = 0; _i < objects; _i++) {
		const x = rng() * max_pos;
		const y = rng() * max_pos;
		const kind = kinds[Math.floor(rng() * kinds.length)];
		const size = ((sizes[1] - sizes[0]) * rng()) + sizes[0];
		const color = colors[Math.floor(rng() * colors.length)];
		const rot = rng() * Math.PI * 2;
		output(kind, x, y, rot, size, color);
	}
}

export function populate_with_branch(rng: MyRandom, kinds: ObjKind[], branch_continuity: number, continuity_decrease: number, base_pos: [number, number], offset: [number, number], rot_range: [number, number], colors: number[], sizes: [number, number], output: OutputFunc) {
	const kind = kinds[Math.floor(rng() * kinds.length)];
	const size = ((sizes[1] - sizes[0]) * rng()) + sizes[0];
	const color = colors[Math.floor(rng() * colors.length)];
	const my_rot = rng() * Math.PI * 2;
	output(kind, base_pos[0], base_pos[1], my_rot, size, color);

	while (rng() <= branch_continuity) {
		branch_continuity -= continuity_decrease;
		const length = ((offset[1] - offset[0]) * rng()) + offset[0];
		const rot = ((rot_range[1] - rot_range[0]) * rng()) + rot_range[0];
		const x = Math.cos(rot) * length;
		const y = Math.sin(rot) * length;
		const new_rots: [number, number] = [rot - ((rot_range[1] - rot_range[0]) * 0.25), rot + ((rot_range[1] - rot_range[0]) * 0.25)];
		populate_with_branch(rng, kinds, branch_continuity, continuity_decrease, [base_pos[0] + x, base_pos[1] + y], offset, new_rots, colors, sizes, output);
	}
}

const stars = [ObjKind.Square, ObjKind.Triangle, ObjKind.WackTriangle];
const star_colors = {
	white: 0xffffff,
	yellow: 0xfdffbc,
	yellow_orange: 0xffeebb,
	orange: 0xffdcb8,
	red: 0xffc1b6,
	blue: 0x6cf3f5,
};

export function foreground_layer(rng: MyRandom, max_pos: number, output: OutputFunc) {
	const foreground_colors: number[] = [
		star_colors.white, star_colors.white, star_colors.white,
		star_colors.yellow, star_colors.yellow,
		star_colors.yellow_orange, star_colors.yellow_orange,
		star_colors.orange,
		star_colors.red,
		star_colors.blue
	];

	populate_with_randomly(rng, stars, [1000, 2000], [0.4, 0.6], foreground_colors, max_pos, output);
}

export function middle_layer(rng: MyRandom, max_pos: number, output: OutputFunc) {
	const middle_colors: number[] = [
		star_colors.white, star_colors.white,
		star_colors.yellow,
		star_colors.yellow_orange, star_colors.yellow_orange,
		star_colors.orange, star_colors.orange,
		star_colors.red,
		star_colors.blue, star_colors.blue,
	];

	populate_with_randomly(rng, stars, [5000,10000], [0.2, 0.5], middle_colors, max_pos, output);
}

export function background_layer(rng: MyRandom, max_pos: number, output: OutputFunc) {
	const background_colors: number[] = [
		star_colors.white, star_colors.white, star_colors.white,
		star_colors.yellow,
		star_colors.yellow_orange, star_colors.yellow_orange,
		star_colors.orange,
		star_colors.red, star_colors.red, star_colors.red,
		star_colors.blue, star_colors.blue,
	];

	populate_with_randomly(rng, stars, [30000, 60000], [0.05, 0.3], background_colors, max_pos, output);
}

enum TileLayer {
	Foreground,
	Middle,
	Background,
};

export abstract class Starfield {
	seed: string;
	load_range: number = 200;

	foreground_tile_size: number;
	foreground_tiles: string[] = [];
	foreground_tile_count: number = 6;
	middle_tile_size: number;
	middle_tiles: string[] = [];
	middle_tile_count: number = 6;
	background_tile_size: number;
	background_tiles: string[] = [];
	background_tile_count = 6;

	constructor(seed: string, foreground_tile_size: number, middle_tile_size: number, background_tile_size: number) {
		this.seed = seed;
		this.foreground_tile_size = foreground_tile_size;
		this.middle_tile_size = middle_tile_size;
		this.background_tile_size = background_tile_size;
	}

	abstract output_func(): OutputFunc;
	abstract flush_outputs_to_tile(id: string, tile_layer: TileLayer, tile_x: number, tile_y: number): void;
	abstract drop_tile(id: string): void;

	update_player_position(x: number, y: number) {
		const load_points = [
			[x - this.load_range, y - this.load_range],
			[x + this.load_range, y - this.load_range],
			[x - this.load_range, y + this.load_range],
			[x + this.load_range, y + this.load_range]
		];
		for (const load_point of load_points) {
			this.ensure_chunk(Math.floor(load_point[0] / this.foreground_tile_size), Math.floor(load_point[1] / this.foreground_tile_size), TileLayer.Foreground);
			this.ensure_chunk(Math.floor(load_point[0] / this.middle_tile_size), Math.floor(load_point[1] / this.middle_tile_size), TileLayer.Middle);
			this.ensure_chunk(Math.floor(load_point[0] / this.background_tile_size), Math.floor(load_point[1] / this.background_tile_size), TileLayer.Background);
		}
		this.update_viewport(x, y);
	}
	abstract update_viewport(x: number, y: number): void;

	tile_id(x: number, y: number, layer: TileLayer): string {
		return `${layer}_${x}_${y}`;
	}

	ensure_chunk(x: number, y: number, layer: TileLayer) {
		let tiles: string[];
		let tile_size: number;
		let tile_count: number;
		switch (layer) {
			case TileLayer.Foreground:
				tiles = this.foreground_tiles;
				tile_size = this.foreground_tile_size;
				tile_count = this.foreground_tile_count;
				break;
			case TileLayer.Middle:
				tiles = this.middle_tiles;
				tile_size = this.middle_tile_size;
				tile_count = this.middle_tile_count;
				break;
			case TileLayer.Background:
				tiles = this.background_tiles;
				tile_size = this.background_tile_size;
				tile_count = this.background_tile_count;
				break;
			default: throw new Error();
		}

		const tile_id = this.tile_id(x, y, layer);
		const tile_index = tiles.indexOf(tile_id);
		if (tile_index < 0) {
			let generation_func;
			switch (layer) {
				case TileLayer.Foreground: generation_func = foreground_layer; break;
				case TileLayer.Middle: generation_func = middle_layer; break;
				case TileLayer.Background: generation_func = background_layer; break;
				default: throw new Error();
			}
			const seed = `${this.seed}_${tile_id}`;
			const output = this.output_func();
			generation_func(seedrandom(seed), tile_size, output);
			this.flush_outputs_to_tile(tile_id, x, y, layer);
			tiles.push(tile_id);
			if (tiles.length > tile_count) this.drop_tile(tiles.shift());
		}
	}
}
