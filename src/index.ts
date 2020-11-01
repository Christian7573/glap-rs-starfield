import { RandomContainer, RandomAreaPoint } from "./random";
import Type_SvgRenderer from "./svg";

export async function SvgRenderer(): Promise<typeof Type_SvgRenderer> { return (await import("./svg")).default; }

export class Starfield {
	chunks = new Map<string, StarfieldChunk>();
	chunks_ordered: Starfield[] = [];
	chunk_size: number;
	max_chunks: number;
	seed: string;

	constructor(seed: string, chunk_size: number, max_chunks: number) {
		this.seed = seed;
		this.chunk_size = chunk_size;
		this.max_chunks = max_chunks;
	}
	
}

export class StarfieldChunk {
	stars: Star[] = [];
	nebula_fogs: NebulaFog[] = [];
}

export class Star {
	readonly x: number;
	readonly y: number;
	readonly size: number;
	readonly color: number;

	constructor(x: number, y: number, size: number, color: number) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
	}
}
export class NebulaFog {
	x: number;
	y: number;
	radians: number;
	size: number;
	color: number;
	opacity: number;
}
export enum StarType {
	Star,
	TopHat, //Easter eggs go brrrrrr
	OldLogo,
}

export class StarfieldChunkGenerator {
	tophat_threshold = 0.95;
	small_star_threshold = 0.8;
	medium_star_threshold = 0.85;
	large_star_threshold = 0.9;

	small_star_size = 3;
	medium_star_size = 8;
	large_star_size = 15;

	generate(seed_x: string, seed_y: string, size: number) {
		const chunk = new StarfieldChunk();

		//Small stars
		for (const [x, y] of this.points_above_threshold(new RandomContainer(seed_x + "_s", seed_y + "_s"), size, this.small_star_threshold)) {
			chunk.stars.push(new Star(x, y, this.small_star_size, 0xffffff));
		}

		//Medium stars
		for (const [x, y] of this.points_above_threshold(new RandomContainer(seed_x + "_m", seed_y + "_m"), size, this.medium_star_threshold)) {
			chunk.stars.push(new Star(x, y, this.medium_star_size, 0xffffff));
		}

		//Lage stars
		for (const [x, y] of this.points_above_threshold(new RandomContainer(seed_x + "_l", seed_y + "_l"), size, this.large_star_threshold)) {
			chunk.stars.push(new Star(x, y, this.large_star_size, 0xffffff));
		}
	}
	points_above_threshold(random: RandomContainer, size: number, threshold: number): [number, number][] {
		const out = [];
		for (const position of random.iter(size, size)) {
			if (position.vx >= threshold && position.vy >= threshold) out.push([position.x, position.y]);
		}
		return out;
	}
}
